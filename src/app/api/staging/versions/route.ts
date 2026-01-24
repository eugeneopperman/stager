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

  // If jobId is provided, first get the job with its version group
  let actualGroupId = groupId;
  if (jobId && !groupId) {
    const { data: job, error: jobError } = await supabase
      .from("staging_jobs")
      .select("*, version_group:version_groups(*)")
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
      return NextResponse.json({
        versions: [job],
        versionGroup: null,
        freeRemixesRemaining: FREE_REMIXES_PER_IMAGE,
        totalVersions: 1,
      });
    }

    actualGroupId = job.version_group_id;
  }

  // Fetch version group with all its staging jobs in one query using join
  const { data: versionGroup, error: groupError } = await supabase
    .from("version_groups")
    .select(`
      *,
      staging_jobs(*)
    `)
    .eq("id", actualGroupId)
    .eq("user_id", user.id)
    .order("created_at", { ascending: true, referencedTable: "staging_jobs" })
    .single();

  if (groupError || !versionGroup) {
    return NextResponse.json(
      { error: "Version group not found" },
      { status: 404 }
    );
  }

  // Extract versions from joined data and filter by user_id
  const versions = (versionGroup.staging_jobs || []).filter(
    (job: { user_id: string }) => job.user_id === user.id
  );

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
