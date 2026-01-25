/**
 * Job Processor
 *
 * Handles processing of background jobs received from the queue.
 */

import type { JobPayload, JobType } from "./queue";
import { captureError } from "@/lib/observability";

// ============================================
// Job Handlers
// ============================================

type JobHandler = (data: Record<string, unknown>) => Promise<void>;

const jobHandlers: Record<JobType, JobHandler> = {
  "staging.process": handleStagingProcess,
  "staging.complete": handleStagingComplete,
  "staging.failed": handleStagingFailed,
  "email.send": handleEmailSend,
  "email.invitation": handleEmailInvitation,
  "email.campaign.enroll": handleCampaignEnroll,
  "email.campaign.process": handleCampaignProcess,
  "email.digest.send": handleDigestSend,
  "email.reengagement.check": handleReengagementCheck,
  "billing.sync": handleBillingSync,
  "cleanup.expired_invitations": handleCleanupExpiredInvitations,
  "cleanup.old_jobs": handleCleanupOldJobs,
};

// ============================================
// Main Processor
// ============================================

export interface ProcessResult {
  success: boolean;
  error?: string;
  duration: number;
}

/**
 * Process a job from the queue
 */
export async function processJob(payload: JobPayload): Promise<ProcessResult> {
  const startTime = Date.now();
  const { type, data, metadata } = payload;

  console.log(`[Job] Processing ${type}`, {
    correlationId: metadata?.correlationId,
    attempt: metadata?.attempt,
  });

  const handler = jobHandlers[type];
  if (!handler) {
    return {
      success: false,
      error: `Unknown job type: ${type}`,
      duration: Date.now() - startTime,
    };
  }

  try {
    await handler(data);

    const duration = Date.now() - startTime;
    console.log(`[Job] Completed ${type} in ${duration}ms`);

    return { success: true, duration };
  } catch (error) {
    const duration = Date.now() - startTime;
    const errorMessage = error instanceof Error ? error.message : String(error);

    console.error(`[Job] Failed ${type}:`, error);

    captureError(error instanceof Error ? error : new Error(errorMessage), {
      tags: {
        "job.type": type,
        "job.correlation_id": metadata?.correlationId || "unknown",
      },
      extra: { data, metadata },
    });

    return {
      success: false,
      error: errorMessage,
      duration,
    };
  }
}

// ============================================
// Job Handler Implementations
// ============================================

async function handleStagingProcess(data: Record<string, unknown>): Promise<void> {
  const { jobId, userId } = data as { jobId: string; userId: string };

  // Import dynamically to avoid circular dependencies
  const { processAsyncStagingJob } = await import("@/lib/staging/async-processor");
  await processAsyncStagingJob(jobId, userId);
}

async function handleStagingComplete(data: Record<string, unknown>): Promise<void> {
  const { jobId, userId } = data as {
    jobId: string;
    userId: string;
    stagedImageUrl: string;
  };

  const { createNotification } = await import("@/lib/notifications");
  const { createClient } = await import("@/lib/supabase/server");
  const supabase = await createClient();

  await createNotification(
    supabase,
    userId,
    "staging_complete",
    "Staging Complete",
    "Your virtual staging is ready to view.",
    `/history?job=${jobId}`
  );

  console.log(`[Job] Notified user ${userId} of staging completion for job ${jobId}`);
}

async function handleStagingFailed(data: Record<string, unknown>): Promise<void> {
  const { jobId, userId, error } = data as {
    jobId: string;
    userId: string;
    error: string;
  };

  const { createNotification } = await import("@/lib/notifications");
  const { createClient } = await import("@/lib/supabase/server");
  const supabase = await createClient();

  await createNotification(
    supabase,
    userId,
    "staging_failed",
    "Staging Failed",
    `Your staging job encountered an error: ${error}`,
    `/history?job=${jobId}`
  );

  console.log(`[Job] Notified user ${userId} of staging failure for job ${jobId}`);
}

async function handleEmailSend(data: Record<string, unknown>): Promise<void> {
  const { to, template, templateData } = data as {
    to: string;
    template: string;
    templateData: Record<string, unknown>;
  };

  // This is a placeholder for generic email sending
  // Most emails should use specific handlers (invitation, campaign, etc.)
  console.log(`[Job] Email send requested: ${template} to ${to}`, templateData);
  console.warn("[Job] Generic email.send not fully implemented - use specific email handlers");
}

async function handleEmailInvitation(data: Record<string, unknown>): Promise<void> {
  const {
    to,
    organizationName,
    inviterName,
    invitationToken,
    initialCredits,
  } = data as {
    to: string;
    organizationName: string;
    inviterName: string;
    invitationToken: string;
    initialCredits: number;
  };

  const { sendTeamInvitationEmail } = await import("@/lib/notifications/email");
  await sendTeamInvitationEmail({
    to,
    organizationName,
    inviterName,
    invitationToken,
    initialCredits,
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
  });

  console.log(`[Job] Sent invitation email to ${to} for ${organizationName}`);
}

async function handleBillingSync(data: Record<string, unknown>): Promise<void> {
  const { userId } = data as {
    userId: string;
    stripeCustomerId: string;
  };

  // Invalidate caches to force fresh data from Stripe webhooks
  const { invalidateBillingCaches } = await import("@/lib/cache/cached-queries");
  await invalidateBillingCaches(userId);

  console.log(`[Job] Invalidated billing caches for user ${userId}`);
}

async function handleCleanupExpiredInvitations(_data: Record<string, unknown>): Promise<void> {
  const { createAdminClient } = await import("@/lib/supabase/admin");
  const supabase = createAdminClient();

  // Update expired invitations - cast to any to work around Supabase type generation issues
  const { data, error } = await (supabase
    .from("team_invitations") as ReturnType<typeof supabase.from>)
    .update({ status: "expired" })
    .eq("status", "pending")
    .lt("expires_at", new Date().toISOString())
    .select("id");

  if (error) {
    throw new Error(`Failed to expire invitations: ${error.message}`);
  }

  console.log(`[Job] Expired ${data?.length || 0} team invitations`);
}

async function handleCleanupOldJobs(data: Record<string, unknown>): Promise<void> {
  const { daysOld = 90 } = data as { daysOld?: number };

  const { createAdminClient } = await import("@/lib/supabase/admin");
  const supabase = createAdminClient();

  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - daysOld);

  // Only delete completed jobs older than cutoff
  const { data: deletedJobs, error } = await supabase
    .from("staging_jobs")
    .delete()
    .eq("status", "completed")
    .lt("created_at", cutoffDate.toISOString())
    .select("id");

  if (error) {
    throw new Error(`Failed to cleanup old jobs: ${error.message}`);
  }

  console.log(`[Job] Cleaned up ${deletedJobs?.length || 0} old staging jobs`);
}

// ============================================
// Email Campaign Handlers
// ============================================

async function handleCampaignEnroll(data: Record<string, unknown>): Promise<void> {
  const { userId, campaignSlug } = data as {
    userId: string;
    campaignSlug: string;
  };

  const { createAdminClient } = await import("@/lib/supabase/admin");
  const { enrollInCampaign } = await import("@/lib/email/campaigns");

  const supabase = createAdminClient();
  const result = await enrollInCampaign(supabase, userId, campaignSlug);

  if (!result.success) {
    // Don't throw for expected failures (already enrolled, etc.)
    if (result.error?.includes("Already enrolled") || result.error?.includes("not active")) {
      console.log(`[Job] Campaign enrollment skipped: ${result.error}`);
      return;
    }
    throw new Error(`Failed to enroll in campaign: ${result.error}`);
  }

  console.log(`[Job] Enrolled user ${userId} in campaign ${campaignSlug}`);
}

async function handleCampaignProcess(data: Record<string, unknown>): Promise<void> {
  const { enrollmentId, processAll } = data as {
    enrollmentId?: string;
    processAll?: boolean;
  };

  const { createAdminClient } = await import("@/lib/supabase/admin");
  const {
    processCampaignStep,
    getActiveCampaignEnrollments,
  } = await import("@/lib/email/campaigns");

  const supabase = createAdminClient();

  if (processAll) {
    // Process all pending campaign steps (scheduled job)
    const enrollments = await getActiveCampaignEnrollments(supabase, 50);

    let processed = 0;
    for (const enrollment of enrollments) {
      const result = await processCampaignStep(supabase, enrollment.id);
      if (result.success) {
        processed++;
      }
    }

    console.log(`[Job] Processed ${processed}/${enrollments.length} campaign steps`);
  } else if (enrollmentId) {
    // Process single enrollment
    const result = await processCampaignStep(supabase, enrollmentId);

    if (!result.success) {
      throw new Error(`Failed to process campaign step: ${result.error}`);
    }

    console.log(
      `[Job] Processed campaign step for enrollment ${enrollmentId}`,
      result.completed ? "(completed)" : ""
    );
  }
}

async function handleDigestSend(data: Record<string, unknown>): Promise<void> {
  const { userId, sendAll } = data as {
    userId?: string;
    sendAll?: boolean;
  };

  const { createAdminClient } = await import("@/lib/supabase/admin");
  const { sendWeeklyDigest, getUsersForDigest } = await import("@/lib/email/campaigns/digest");

  const supabase = createAdminClient();

  if (sendAll) {
    // Send to all eligible users (scheduled job)
    const users = await getUsersForDigest(supabase, 100);

    let sent = 0;
    for (const user of users) {
      const result = await sendWeeklyDigest(supabase, user.id);
      if (result.success) {
        sent++;
      }
    }

    console.log(`[Job] Sent weekly digest to ${sent}/${users.length} users`);
  } else if (userId) {
    // Send to single user
    const result = await sendWeeklyDigest(supabase, userId);

    if (!result.success) {
      throw new Error(`Failed to send digest: ${result.error}`);
    }

    console.log(`[Job] Sent weekly digest to user ${userId}`);
  }
}

async function handleReengagementCheck(_data: Record<string, unknown>): Promise<void> {
  const { createAdminClient } = await import("@/lib/supabase/admin");
  const { getInactiveUsers, enrollInCampaign } = await import("@/lib/email/campaigns");

  const supabase = createAdminClient();

  // Check for users inactive for 7, 14, and 30 days
  const inactivityPeriods = [
    { days: 7, campaign: "reengagement-7d" },
    { days: 14, campaign: "reengagement-14d" },
    { days: 30, campaign: "reengagement-30d" },
  ];

  let totalEnrolled = 0;

  for (const { days, campaign } of inactivityPeriods) {
    const users = await getInactiveUsers(supabase, days, 50);

    for (const user of users) {
      // Check if already enrolled in any reengagement campaign
      const { data: existing } = await supabase
        .from("campaign_enrollments")
        .select("id")
        .eq("user_id", user.id)
        .like("campaign:email_campaigns.slug", "reengagement-%")
        .single();

      if (existing) continue;

      const result = await enrollInCampaign(supabase, user.id, campaign);
      if (result.success) {
        totalEnrolled++;
      }
    }
  }

  console.log(`[Job] Enrolled ${totalEnrolled} users in re-engagement campaigns`);
}
