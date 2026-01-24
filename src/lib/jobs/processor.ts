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
  const { to, template, data: templateData } = data as {
    to: string;
    template: string;
    data: Record<string, unknown>;
  };

  // Import email service dynamically
  const { sendEmail } = await import("@/lib/notifications/email");
  await sendEmail(to, template, templateData);

  console.log(`[Job] Sent email to ${to} using template ${template}`);
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
  const { userId, stripeCustomerId } = data as {
    userId: string;
    stripeCustomerId: string;
  };

  // Sync subscription status from Stripe
  const { syncSubscriptionFromStripe } = await import("@/lib/billing/stripe");
  await syncSubscriptionFromStripe(userId, stripeCustomerId);

  // Invalidate caches
  const { invalidateBillingCaches } = await import("@/lib/cache/cached-queries");
  await invalidateBillingCaches(userId);

  console.log(`[Job] Synced billing for user ${userId}`);
}

async function handleCleanupExpiredInvitations(_data: Record<string, unknown>): Promise<void> {
  const { createAdminClient } = await import("@/lib/supabase/admin");
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("team_invitations")
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
