/**
 * Background Job Queue
 *
 * Uses Upstash QStash for reliable, serverless background job processing.
 * Supports retries, delays, and scheduled jobs.
 *
 * Environment variables:
 * - QSTASH_TOKEN: Your QStash API token
 * - QSTASH_CURRENT_SIGNING_KEY: For webhook verification
 * - QSTASH_NEXT_SIGNING_KEY: For webhook verification (rotation)
 */

import { Client } from "@upstash/qstash";

// ============================================
// Job Types
// ============================================

export type JobType =
  | "staging.process"
  | "staging.complete"
  | "staging.failed"
  | "email.send"
  | "email.invitation"
  | "email.campaign.enroll"
  | "email.campaign.process"
  | "email.digest.send"
  | "email.reengagement.check"
  | "billing.sync"
  | "cleanup.expired_invitations"
  | "cleanup.old_jobs";

export interface JobPayload {
  type: JobType;
  data: Record<string, unknown>;
  metadata?: {
    userId?: string;
    correlationId?: string;
    attempt?: number;
  };
}

export interface JobOptions {
  /** Delay in seconds before processing */
  delay?: number;
  /** Number of retry attempts (default: 3) */
  retries?: number;
  /** Cron expression for scheduled jobs */
  cron?: string;
  /** Deduplication ID to prevent duplicate jobs */
  deduplicationId?: string;
}

// ============================================
// Queue Client
// ============================================

let qstashClient: Client | null = null;

function getQStashClient(): Client | null {
  if (qstashClient) {
    return qstashClient;
  }

  const token = process.env.QSTASH_TOKEN;
  if (!token) {
    if (process.env.NODE_ENV === "development") {
      console.warn("⚠️  QStash not configured. Set QSTASH_TOKEN for background jobs.");
    }
    return null;
  }

  qstashClient = new Client({ token });
  return qstashClient;
}

/**
 * Check if queue is available
 */
export function isQueueConfigured(): boolean {
  return !!process.env.QSTASH_TOKEN;
}

// ============================================
// Job Publishing
// ============================================

/**
 * Publish a job to the queue
 */
export async function publishJob(
  type: JobType,
  data: Record<string, unknown>,
  options?: JobOptions
): Promise<{ messageId: string } | null> {
  const client = getQStashClient();

  if (!client) {
    // Fallback: execute immediately in development
    if (process.env.NODE_ENV === "development") {
      console.log(`[Queue] Would publish job: ${type}`, data);
    }
    return null;
  }

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const webhookUrl = `${baseUrl}/api/jobs/process`;

  const payload: JobPayload = {
    type,
    data,
    metadata: {
      correlationId: crypto.randomUUID(),
      attempt: 1,
    },
  };

  try {
    const response = await client.publishJSON({
      url: webhookUrl,
      body: payload,
      retries: options?.retries ?? 3,
      delay: options?.delay ? (options.delay as number) : undefined,
      deduplicationId: options?.deduplicationId,
    });

    // Handle different response types from QStash
    const messageId = "messageId" in response ? response.messageId : "unknown";
    return { messageId };
  } catch (error) {
    console.error(`[Queue] Failed to publish job ${type}:`, error);
    throw error;
  }
}

/**
 * Schedule a recurring job
 */
export async function scheduleJob(
  type: JobType,
  data: Record<string, unknown>,
  cron: string,
  scheduleId: string
): Promise<{ scheduleId: string } | null> {
  const client = getQStashClient();

  if (!client) {
    console.warn(`[Queue] Cannot schedule job - QStash not configured`);
    return null;
  }

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const webhookUrl = `${baseUrl}/api/jobs/process`;

  const payload: JobPayload = {
    type,
    data,
    metadata: {
      correlationId: scheduleId,
    },
  };

  try {
    await client.schedules.create({
      scheduleId,
      destination: webhookUrl,
      body: JSON.stringify(payload),
      cron,
    });

    return { scheduleId };
  } catch (error) {
    console.error(`[Queue] Failed to schedule job ${type}:`, error);
    throw error;
  }
}

/**
 * Delete a scheduled job
 */
export async function deleteSchedule(scheduleId: string): Promise<void> {
  const client = getQStashClient();

  if (!client) {
    return;
  }

  try {
    await client.schedules.delete(scheduleId);
  } catch (error) {
    console.error(`[Queue] Failed to delete schedule ${scheduleId}:`, error);
    throw error;
  }
}

// ============================================
// Job-specific helpers
// ============================================

/**
 * Queue a staging job for processing
 */
export async function queueStagingJob(jobId: string, userId: string) {
  return publishJob(
    "staging.process",
    { jobId, userId },
    { retries: 3 }
  );
}

/**
 * Queue staging completion notification
 */
export async function queueStagingComplete(
  jobId: string,
  userId: string,
  stagedImageUrl: string
) {
  return publishJob("staging.complete", {
    jobId,
    userId,
    stagedImageUrl,
  });
}

/**
 * Queue staging failure notification
 */
export async function queueStagingFailed(
  jobId: string,
  userId: string,
  error: string
) {
  return publishJob("staging.failed", {
    jobId,
    userId,
    error,
  });
}

/**
 * Queue an email to be sent
 */
export async function queueEmail(
  to: string,
  template: string,
  data: Record<string, unknown>
) {
  return publishJob(
    "email.send",
    { to, template, data },
    { retries: 3 }
  );
}

/**
 * Queue a team invitation email
 */
export async function queueInvitationEmail(
  to: string,
  organizationName: string,
  inviterName: string,
  invitationToken: string,
  initialCredits: number
) {
  return publishJob(
    "email.invitation",
    {
      to,
      organizationName,
      inviterName,
      invitationToken,
      initialCredits,
    },
    {
      retries: 3,
      deduplicationId: `invitation:${invitationToken}`,
    }
  );
}

/**
 * Queue billing sync (e.g., after Stripe webhook)
 */
export async function queueBillingSync(userId: string, stripeCustomerId: string) {
  return publishJob(
    "billing.sync",
    { userId, stripeCustomerId },
    {
      retries: 5,
      deduplicationId: `billing:${userId}:${Date.now()}`,
    }
  );
}

// ============================================
// Email Campaign Jobs
// ============================================

/**
 * Queue user enrollment in a campaign
 */
export async function queueCampaignEnrollment(
  userId: string,
  campaignSlug: string
) {
  return publishJob(
    "email.campaign.enroll",
    { userId, campaignSlug },
    {
      retries: 3,
      deduplicationId: `campaign-enroll:${userId}:${campaignSlug}`,
    }
  );
}

/**
 * Queue processing of a campaign step
 */
export async function queueCampaignStepProcess(
  enrollmentId: string,
  delaySeconds?: number
) {
  return publishJob(
    "email.campaign.process",
    { enrollmentId },
    {
      retries: 3,
      delay: delaySeconds,
      deduplicationId: `campaign-step:${enrollmentId}:${Date.now()}`,
    }
  );
}

/**
 * Queue weekly digest for a user
 */
export async function queueWeeklyDigest(userId: string) {
  return publishJob(
    "email.digest.send",
    { userId },
    {
      retries: 2,
      deduplicationId: `digest:${userId}:${new Date().toISOString().slice(0, 10)}`,
    }
  );
}

/**
 * Queue re-engagement check (usually scheduled)
 */
export async function queueReengagementCheck() {
  return publishJob(
    "email.reengagement.check",
    {},
    { retries: 2 }
  );
}

// ============================================
// Scheduled Jobs Setup
// ============================================

/**
 * Initialize scheduled jobs
 * Call this once during app initialization
 */
export async function initializeScheduledJobs(): Promise<void> {
  // Clean up expired invitations daily at 2 AM UTC
  await scheduleJob(
    "cleanup.expired_invitations",
    {},
    "0 2 * * *",
    "cleanup-expired-invitations"
  );

  // Clean up old completed jobs weekly on Sunday at 3 AM UTC
  await scheduleJob(
    "cleanup.old_jobs",
    { daysOld: 90 },
    "0 3 * * 0",
    "cleanup-old-jobs"
  );

  // Process pending campaign emails every hour
  await scheduleJob(
    "email.campaign.process",
    { processAll: true },
    "0 * * * *",
    "email-campaign-process"
  );

  // Send weekly digests every Monday at 9 AM UTC
  await scheduleJob(
    "email.digest.send",
    { sendAll: true },
    "0 9 * * 1",
    "email-weekly-digest"
  );

  // Check for users needing re-engagement daily at 10 AM UTC
  await scheduleJob(
    "email.reengagement.check",
    {},
    "0 10 * * *",
    "email-reengagement-check"
  );
}
