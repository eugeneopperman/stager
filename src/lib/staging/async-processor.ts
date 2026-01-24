/**
 * Async Staging Processor
 *
 * Processes staging jobs asynchronously via the job queue.
 * Handles retries, error recovery, and notifications.
 */

import { createClient } from "@/lib/supabase/server";
import { trackStagingOperation, trackStagingMetrics, captureProviderError } from "@/lib/observability";
import { queueStagingComplete, queueStagingFailed } from "@/lib/jobs/queue";
import { invalidateUserCredits } from "@/lib/cache";
import { deductCredits, logCreditTransaction } from "@/lib/billing/subscription";

/**
 * Process a staging job asynchronously
 * Called by the job queue processor
 */
export async function processAsyncStagingJob(
  jobId: string,
  userId: string
): Promise<void> {
  const supabase = await createClient();
  const startTime = Date.now();

  // Get job details
  const { data: job, error: fetchError } = await supabase
    .from("staging_jobs")
    .select("*")
    .eq("id", jobId)
    .single();

  if (fetchError || !job) {
    throw new Error(`Job not found: ${jobId}`);
  }

  // Check if already processed
  if (job.status === "completed" || job.status === "failed") {
    console.log(`[Staging] Job ${jobId} already processed with status: ${job.status}`);
    return;
  }

  // Update status to processing
  await supabase
    .from("staging_jobs")
    .update({ status: "processing" })
    .eq("id", jobId);

  try {
    // Get the provider based on job metadata
    const provider = job.provider || "gemini";

    // Process with the appropriate provider
    const result = await trackStagingOperation(
      async () => {
        return await processWithProvider(job, provider);
      },
      {
        jobId,
        provider,
        roomType: job.room_type,
        style: job.style,
      }
    );

    if (!result.success) {
      throw new Error(result.error || "Provider returned failure");
    }

    // Upload staged image
    const stagedImagePath = `${userId}/${jobId}/staged.${result.mimeType?.split("/")[1] || "png"}`;
    const imageBuffer = Buffer.from(result.imageData!, "base64");

    const { error: uploadError } = await supabase.storage
      .from("staging-images")
      .upload(stagedImagePath, imageBuffer, {
        contentType: result.mimeType || "image/png",
        upsert: true,
      });

    if (uploadError) {
      throw new Error(`Failed to upload staged image: ${uploadError.message}`);
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from("staging-images")
      .getPublicUrl(stagedImagePath);

    const stagedImageUrl = urlData.publicUrl;

    // Update job as completed
    const processingTime = Date.now() - startTime;
    await supabase
      .from("staging_jobs")
      .update({
        status: "completed",
        staged_image_url: stagedImageUrl,
        completed_at: new Date().toISOString(),
        processing_time_ms: processingTime,
      })
      .eq("id", jobId);

    // Deduct credits
    const creditDeducted = await deductCredits(userId, 1);
    if (creditDeducted) {
      await logCreditTransaction(userId, jobId, 1, "staging");
      await invalidateUserCredits(userId);
    }

    // Track metrics
    trackStagingMetrics({
      processingTimeMs: processingTime,
      provider,
      success: true,
      creditsUsed: 1,
    });

    // Queue completion notification
    await queueStagingComplete(jobId, userId, stagedImageUrl);

    console.log(`[Staging] Job ${jobId} completed successfully in ${processingTime}ms`);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    const processingTime = Date.now() - startTime;

    // Update job as failed
    await supabase
      .from("staging_jobs")
      .update({
        status: "failed",
        error_message: errorMessage,
        completed_at: new Date().toISOString(),
        processing_time_ms: processingTime,
      })
      .eq("id", jobId);

    // Track failure
    captureProviderError(
      error instanceof Error ? error : new Error(errorMessage),
      job.provider || "unknown",
      { jobId, userId }
    );

    trackStagingMetrics({
      processingTimeMs: processingTime,
      provider: job.provider || "unknown",
      success: false,
      creditsUsed: 0,
    });

    // Queue failure notification
    await queueStagingFailed(jobId, userId, errorMessage);

    // Re-throw for retry
    throw error;
  }
}

/**
 * Process with the selected provider
 */
async function processWithProvider(
  job: {
    original_image_url: string;
    room_type: string;
    style: string;
    provider?: string;
    custom_prompt?: string;
  },
  provider: string
): Promise<{
  success: boolean;
  imageData?: string;
  mimeType?: string;
  error?: string;
}> {
  // Get original image
  const response = await fetch(job.original_image_url);
  if (!response.ok) {
    throw new Error("Failed to fetch original image");
  }

  const imageBuffer = await response.arrayBuffer();
  const base64Image = Buffer.from(imageBuffer).toString("base64");
  const mimeType = response.headers.get("content-type") || "image/jpeg";

  // Use the appropriate provider
  switch (provider) {
    case "gemini":
    case "decor8": {
      const { getProviderRouter } = await import("@/lib/providers");
      const router = getProviderRouter();
      const { provider: selectedProvider } = await router.selectProvider();

      if (selectedProvider.supportsSync && "stageImageSync" in selectedProvider) {
        return await selectedProvider.stageImageSync(
          base64Image,
          mimeType,
          job.room_type,
          job.style,
          job.custom_prompt
        );
      }

      throw new Error(`Provider ${provider} does not support sync processing`);
    }

    case "replicate":
    case "stable-diffusion": {
      // Replicate is already async, this shouldn't be called
      // but handle it for completeness
      throw new Error("Replicate jobs should use webhook callback, not queue processing");
    }

    default:
      throw new Error(`Unknown provider: ${provider}`);
  }
}
