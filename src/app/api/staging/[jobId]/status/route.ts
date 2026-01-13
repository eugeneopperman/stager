import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getReplicateProvider } from "@/lib/providers";
import type { StagingJobStatus } from "@/lib/database.types";
import { CREDITS_PER_STAGING } from "@/lib/constants";

/**
 * Progress step information for UI display
 */
interface ProgressStep {
  step: string;
  stepNumber: number;
  totalSteps: number;
  message: string;
}

/**
 * Map job status to progress information
 */
function getProgressInfo(status: StagingJobStatus): ProgressStep {
  switch (status) {
    case "pending":
    case "queued":
      return {
        step: "queued",
        stepNumber: 1,
        totalSteps: 4,
        message: "Job queued, waiting to start...",
      };
    case "preprocessing":
      return {
        step: "preprocessing",
        stepNumber: 2,
        totalSteps: 4,
        message: "Analyzing room and preparing ControlNet inputs...",
      };
    case "processing":
      return {
        step: "generating",
        stepNumber: 3,
        totalSteps: 4,
        message: "Generating staged image with AI...",
      };
    case "uploading":
      return {
        step: "uploading",
        stepNumber: 4,
        totalSteps: 4,
        message: "Uploading final image...",
      };
    case "completed":
      return {
        step: "completed",
        stepNumber: 4,
        totalSteps: 4,
        message: "Staging complete!",
      };
    case "failed":
      return {
        step: "failed",
        stepNumber: 0,
        totalSteps: 4,
        message: "Staging failed",
      };
    default:
      return {
        step: "unknown",
        stepNumber: 0,
        totalSteps: 4,
        message: "Unknown status",
      };
  }
}

/**
 * Estimate remaining time based on status and provider
 */
function getEstimatedTimeRemaining(
  status: StagingJobStatus,
  provider: string,
  createdAt: string
): number | null {
  if (status === "completed" || status === "failed") {
    return null;
  }

  // Base estimates by provider
  const totalEstimate = provider === "stable-diffusion" ? 30 : 10;

  // Adjust based on current step
  const stepProgress: Record<string, number> = {
    queued: 0,
    pending: 0,
    preprocessing: 0.2,
    processing: 0.5,
    uploading: 0.9,
  };

  const progress = stepProgress[status] || 0;
  const elapsed = (Date.now() - new Date(createdAt).getTime()) / 1000;
  const remaining = Math.max(0, totalEstimate * (1 - progress) - elapsed * progress);

  return Math.round(remaining);
}

/**
 * GET /api/staging/[jobId]/status
 *
 * Poll the status of a staging job.
 * Returns progress information for async jobs.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ jobId: string }> }
) {
  const { jobId } = await params;

  const supabase = await createClient();

  // Verify user is authenticated
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Fetch job status
  let { data: job, error } = await supabase
    .from("staging_jobs")
    .select("*")
    .eq("id", jobId)
    .eq("user_id", user.id) // Ensure user owns this job
    .single();

  if (error || !job) {
    return NextResponse.json(
      { error: "Job not found" },
      { status: 404 }
    );
  }

  // If job is processing and has a Replicate prediction ID, check Replicate status
  if (
    job.status === "processing" &&
    job.provider === "stable-diffusion" &&
    job.replicate_prediction_id
  ) {
    console.log("[Status API] Checking Replicate prediction:", job.replicate_prediction_id);
    try {
      const replicateProvider = getReplicateProvider();
      const prediction = await replicateProvider.getPredictionStatus(job.replicate_prediction_id);
      console.log("[Status API] Replicate prediction status:", prediction.status);

      if (prediction.status === "succeeded" && prediction.output) {
        // Download and upload the image
        const imageUrl = Array.isArray(prediction.output) ? prediction.output[0] : prediction.output;
        console.log("[Status API] Prediction succeeded, output URL:", imageUrl);

        // Download the image from Replicate
        const imageResponse = await fetch(imageUrl);
        if (imageResponse.ok) {
          const imageBuffer = await imageResponse.arrayBuffer();
          const mimeType = imageResponse.headers.get("content-type") || "image/png";
          const ext = mimeType.split("/")[1] || "png";

          // Upload to Supabase Storage
          const fileName = `${user.id}/${job.id}-staged.${ext}`;
          const { error: uploadError } = await supabase.storage
            .from("staging-images")
            .upload(fileName, imageBuffer, {
              contentType: mimeType,
              upsert: true,
            });

          let stagedImageUrl: string;
          if (uploadError) {
            console.error("[Status API] Upload error:", uploadError);
            stagedImageUrl = imageUrl; // Use Replicate URL as fallback
          } else {
            const { data: publicUrl } = supabase.storage
              .from("staging-images")
              .getPublicUrl(fileName);
            stagedImageUrl = publicUrl.publicUrl;
          }

          // Update job as completed
          const processingTimeMs = Date.now() - new Date(job.created_at).getTime();
          await supabase
            .from("staging_jobs")
            .update({
              status: "completed",
              staged_image_url: stagedImageUrl,
              completed_at: new Date().toISOString(),
              processing_time_ms: processingTimeMs,
            })
            .eq("id", job.id);

          // Deduct credits
          const { data: profile } = await supabase
            .from("profiles")
            .select("credits_remaining")
            .eq("id", user.id)
            .single();

          if (profile) {
            await supabase
              .from("profiles")
              .update({
                credits_remaining: profile.credits_remaining - CREDITS_PER_STAGING,
              })
              .eq("id", user.id);
          }

          // Update local job object
          job = {
            ...job,
            status: "completed",
            staged_image_url: stagedImageUrl,
            completed_at: new Date().toISOString(),
            processing_time_ms: processingTimeMs,
          };
          console.log("[Status API] Job completed successfully");
        }
      } else if (prediction.status === "failed") {
        // Update job as failed
        await supabase
          .from("staging_jobs")
          .update({
            status: "failed",
            error_message: prediction.error || "Replicate prediction failed",
          })
          .eq("id", job.id);

        job = {
          ...job,
          status: "failed",
          error_message: prediction.error || "Replicate prediction failed",
        };
        console.log("[Status API] Job failed:", prediction.error);
      }
      // If still processing, just return current status
    } catch (error) {
      console.error("[Status API] Error checking Replicate:", error);
      // Don't fail the status check, just return current DB status
    }
  }

  const progress = getProgressInfo(job.status as StagingJobStatus);
  const estimatedTimeRemaining = getEstimatedTimeRemaining(
    job.status as StagingJobStatus,
    job.provider || "gemini",
    job.created_at
  );

  return NextResponse.json({
    jobId: job.id,
    status: job.status,
    progress,
    provider: job.provider || "gemini",
    estimatedTimeRemaining,
    stagedImageUrl: job.staged_image_url,
    originalImageUrl: job.original_image_url,
    error: job.error_message,
    roomType: job.room_type,
    style: job.style,
    createdAt: job.created_at,
    completedAt: job.completed_at,
    processingTimeMs: job.processing_time_ms,
  });
}
