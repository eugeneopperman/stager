import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { FREE_REMIXES_PER_IMAGE } from "@/lib/constants";

/**
 * GET /api/staging/versions?groupId={id}
 *
 * Fetch all versions for a version group.
 */
export async function GET(request: NextRequest) {
  const supabase = await createClient();

  // Verify user is authenticated
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const groupId = request.nextUrl.searchParams.get("groupId");
  const jobId = request.nextUrl.searchParams.get("jobId");

  if (!groupId && !jobId) {
    return NextResponse.json(
      { error: "Either groupId or jobId is required" },
      { status: 400 }
    );
  }

  // If jobId is provided, first get the version_group_id from that job
  let actualGroupId = groupId;
  if (jobId && !groupId) {
    const { data: job, error: jobError } = await supabase
      .from("staging_jobs")
      .select("version_group_id")
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
      // This job doesn't have a version group yet - return just this job
      const { data: singleJob } = await supabase
        .from("staging_jobs")
        .select("*")
        .eq("id", jobId)
        .eq("user_id", user.id)
        .single();

      return NextResponse.json({
        versions: singleJob ? [singleJob] : [],
        versionGroup: null,
        freeRemixesRemaining: FREE_REMIXES_PER_IMAGE,
        totalVersions: singleJob ? 1 : 0,
      });
    }

    actualGroupId = job.version_group_id;
  }

  // Fetch the version group
  const { data: versionGroup, error: groupError } = await supabase
    .from("version_groups")
    .select("*")
    .eq("id", actualGroupId)
    .eq("user_id", user.id)
    .single();

  if (groupError || !versionGroup) {
    return NextResponse.json(
      { error: "Version group not found" },
      { status: 404 }
    );
  }

  // Fetch all staging jobs in this version group
  const { data: versions, error: versionsError } = await supabase
    .from("staging_jobs")
    .select("*")
    .eq("version_group_id", actualGroupId)
    .eq("user_id", user.id)
    .order("created_at", { ascending: true });

  if (versionsError) {
    console.error("[Versions API] Error fetching versions:", versionsError);
    return NextResponse.json(
      { error: "Failed to fetch versions" },
      { status: 500 }
    );
  }

  const freeRemixesUsed = versionGroup.free_remixes_used || 0;
  const freeRemixesRemaining = Math.max(0, FREE_REMIXES_PER_IMAGE - freeRemixesUsed);

  return NextResponse.json({
    versions: versions || [],
    versionGroup: {
      id: versionGroup.id,
      originalImageUrl: versionGroup.original_image_url,
      freeRemixesUsed,
      createdAt: versionGroup.created_at,
    },
    freeRemixesRemaining,
    totalVersions: versions?.length || 0,
  });
}
