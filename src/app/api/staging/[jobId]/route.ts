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
 * GET /api/staging/[jobId]
 *
 * Get the status of a staging job.
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
  // eslint-disable-next-line prefer-const -- job is reassigned later
  let { data: job, error } = await supabase
    .from("staging_jobs")
    .select("*")
    .eq("id", jobId)
    .eq("user_id", user.id)
    .single();

  if (error || !job) {
    return NextResponse.json({ error: "Job not found" }, { status: 404 });
  }

  // If job is processing and has a Replicate prediction ID, check Replicate status
  if (
    job.status === "processing" &&
    job.provider === "stable-diffusion" &&
    job.replicate_prediction_id
  ) {
    try {
      const replicateProvider = getReplicateProvider();
      const prediction = await replicateProvider.getPredictionStatus(
        job.replicate_prediction_id
      );

      if (prediction.status === "succeeded" && prediction.output) {
        // Download and upload the image
        const imageUrl = Array.isArray(prediction.output)
          ? prediction.output[0]
          : prediction.output;

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
            console.error("[Job API] Upload error:", uploadError);
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
      }
    } catch {
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
    versionGroupId: job.version_group_id,
    isPrimaryVersion: job.is_primary_version,
    parentJobId: job.parent_job_id,
  });
}

/**
 * PATCH /api/staging/[jobId]
 *
 * Update a staging job. Currently supports:
 * - Setting as primary version (action: "set-primary")
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ jobId: string }> }
) {
  const { jobId } = await params;

  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { action } = body as { action: string };

    if (action === "set-primary") {
      // Fetch the job to get its version_group_id
      const { data: job, error: jobError } = await supabase
        .from("staging_jobs")
        .select("id, version_group_id, user_id")
        .eq("id", jobId)
        .eq("user_id", user.id)
        .single();

      if (jobError || !job) {
        return NextResponse.json({ error: "Job not found" }, { status: 404 });
      }

      if (!job.version_group_id) {
        // If job doesn't have a version group, just set it as primary
        await supabase
          .from("staging_jobs")
          .update({ is_primary_version: true })
          .eq("id", jobId);

        return NextResponse.json({
          success: true,
          jobId,
          message: "Set as primary version",
        });
      }

      // Unset all other versions in this group
      const { error: unsetError } = await supabase
        .from("staging_jobs")
        .update({ is_primary_version: false })
        .eq("version_group_id", job.version_group_id)
        .eq("user_id", user.id);

      if (unsetError) {
        console.error("[Job API] Error unsetting other versions:", unsetError);
        return NextResponse.json(
          { error: "Failed to update versions" },
          { status: 500 }
        );
      }

      // Set this job as primary
      const { error: setError } = await supabase
        .from("staging_jobs")
        .update({ is_primary_version: true })
        .eq("id", jobId);

      if (setError) {
        console.error("[Job API] Error setting primary:", setError);
        return NextResponse.json(
          { error: "Failed to set primary version" },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        jobId,
        versionGroupId: job.version_group_id,
        message: "Set as primary version",
      });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error) {
    console.error("[Job API] Unexpected error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "An unexpected error occurred" },
      { status: 500 }
    );
  }
}
