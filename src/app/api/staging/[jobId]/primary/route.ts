import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * PUT /api/staging/[jobId]/primary
 *
 * Set a version as the primary version (unsets others in the group).
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ jobId: string }> }
) {
  const { jobId } = await params;
  console.log("[Primary API] Setting primary version for job:", jobId);

  try {
    const supabase = await createClient();

    // Check authentication
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Fetch the job to get its version_group_id
    const { data: job, error: jobError } = await supabase
      .from("staging_jobs")
      .select("id, version_group_id, user_id")
      .eq("id", jobId)
      .eq("user_id", user.id)
      .single();

    if (jobError || !job) {
      return NextResponse.json(
        { error: "Job not found" },
        { status: 404 }
      );
    }

    if (!job.version_group_id) {
      // If job doesn't have a version group, just set it as primary (it's the only version)
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

    // First, unset all other versions in this group
    const { error: unsetError } = await supabase
      .from("staging_jobs")
      .update({ is_primary_version: false })
      .eq("version_group_id", job.version_group_id)
      .eq("user_id", user.id);

    if (unsetError) {
      console.error("[Primary API] Error unsetting other versions:", unsetError);
      return NextResponse.json(
        { error: "Failed to update versions" },
        { status: 500 }
      );
    }

    // Then set this job as primary
    const { error: setError } = await supabase
      .from("staging_jobs")
      .update({ is_primary_version: true })
      .eq("id", jobId);

    if (setError) {
      console.error("[Primary API] Error setting primary:", setError);
      return NextResponse.json(
        { error: "Failed to set primary version" },
        { status: 500 }
      );
    }

    console.log("[Primary API] Successfully set job as primary:", jobId);
    return NextResponse.json({
      success: true,
      jobId,
      versionGroupId: job.version_group_id,
      message: "Set as primary version",
    });
  } catch (error) {
    console.error("[Primary API] Unexpected error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "An unexpected error occurred" },
      { status: 500 }
    );
  }
}
