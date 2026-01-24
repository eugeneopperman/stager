/**
 * Staging Job Service
 * Handles CRUD operations for staging jobs
 */

import { createClient } from "@/lib/supabase/server";
import type { StagingJobStatus } from "@/lib/database.types";

/**
 * Parameters for creating a staging job
 */
export interface CreateJobParams {
  jobId: string;
  userId: string;
  propertyId?: string | null;
  originalImageUrl: string;
  roomType: string;
  style: string;
  provider: string;
}

/**
 * Staging job data structure
 */
export interface StagingJob {
  id: string;
  user_id: string;
  property_id: string | null;
  original_image_url: string;
  staged_image_url: string | null;
  room_type: string;
  style: string;
  status: StagingJobStatus;
  provider: string;
  replicate_prediction_id: string | null;
  error_message: string | null;
  processing_time_ms: number | null;
  created_at: string;
  completed_at: string | null;
  version_group_id: string | null;
  is_primary_version: boolean;
  parent_job_id: string | null;
}

/**
 * Create a new staging job record
 */
export async function createStagingJob(
  params: CreateJobParams
): Promise<StagingJob | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("staging_jobs")
    .insert({
      id: params.jobId,
      user_id: params.userId,
      property_id: params.propertyId || null,
      original_image_url: params.originalImageUrl,
      room_type: params.roomType,
      style: params.style,
      status: "processing",
      provider: params.provider,
    })
    .select()
    .single();

  if (error) {
    console.error("[Job Service] Failed to create job:", error);
    return null;
  }

  return data as StagingJob;
}

/**
 * Get a staging job by ID, validating user ownership
 */
export async function getStagingJob(
  jobId: string,
  userId: string
): Promise<StagingJob | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("staging_jobs")
    .select("*")
    .eq("id", jobId)
    .eq("user_id", userId)
    .single();

  if (error || !data) {
    return null;
  }

  return data as StagingJob;
}

/**
 * Update job status with optional additional data
 */
export async function updateJobStatus(
  jobId: string,
  status: StagingJobStatus,
  data?: Partial<Pick<StagingJob, "error_message" | "processing_time_ms" | "replicate_prediction_id">>
): Promise<boolean> {
  const supabase = await createClient();

  const { error } = await supabase
    .from("staging_jobs")
    .update({
      status,
      ...data,
    })
    .eq("id", jobId);

  if (error) {
    console.error("[Job Service] Failed to update job status:", error);
    return false;
  }

  return true;
}

/**
 * Mark a job as completed with the staged image URL
 */
export async function updateJobCompletion(
  jobId: string,
  stagedImageUrl: string,
  processingTimeMs: number
): Promise<boolean> {
  const supabase = await createClient();

  const { error } = await supabase
    .from("staging_jobs")
    .update({
      status: "completed",
      staged_image_url: stagedImageUrl,
      completed_at: new Date().toISOString(),
      processing_time_ms: processingTimeMs,
    })
    .eq("id", jobId);

  if (error) {
    console.error("[Job Service] Failed to update job completion:", error);
    return false;
  }

  return true;
}

/**
 * Mark a job as failed
 */
export async function updateJobFailure(
  jobId: string,
  errorMessage: string,
  processingTimeMs?: number
): Promise<boolean> {
  const supabase = await createClient();

  const { error } = await supabase
    .from("staging_jobs")
    .update({
      status: "failed",
      error_message: errorMessage,
      processing_time_ms: processingTimeMs,
    })
    .eq("id", jobId);

  if (error) {
    console.error("[Job Service] Failed to update job failure:", error);
    return false;
  }

  return true;
}

/**
 * Set a job as the primary version in its version group
 */
export async function setPrimaryVersion(
  jobId: string,
  userId: string
): Promise<{ success: boolean; versionGroupId?: string | null }> {
  const supabase = await createClient();

  // Fetch the job to get its version_group_id
  const { data: job, error: jobError } = await supabase
    .from("staging_jobs")
    .select("id, version_group_id, user_id")
    .eq("id", jobId)
    .eq("user_id", userId)
    .single();

  if (jobError || !job) {
    return { success: false };
  }

  if (!job.version_group_id) {
    // If job doesn't have a version group, just set it as primary
    await supabase
      .from("staging_jobs")
      .update({ is_primary_version: true })
      .eq("id", jobId);

    return { success: true, versionGroupId: null };
  }

  // Unset all other versions in this group
  const { error: unsetError } = await supabase
    .from("staging_jobs")
    .update({ is_primary_version: false })
    .eq("version_group_id", job.version_group_id)
    .eq("user_id", userId);

  if (unsetError) {
    console.error("[Job Service] Error unsetting other versions:", unsetError);
    return { success: false };
  }

  // Set this job as primary
  const { error: setError } = await supabase
    .from("staging_jobs")
    .update({ is_primary_version: true })
    .eq("id", jobId);

  if (setError) {
    console.error("[Job Service] Error setting primary:", setError);
    return { success: false };
  }

  return { success: true, versionGroupId: job.version_group_id };
}
