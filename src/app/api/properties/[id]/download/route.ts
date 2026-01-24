import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import JSZip from "jszip";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();

  // Get authenticated user
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Fetch property with completed staging jobs in one query using join
  const { data: property, error: propertyError } = await supabase
    .from("properties")
    .select(`
      *,
      staging_jobs!inner(*)
    `)
    .eq("id", id)
    .eq("user_id", user.id)
    .eq("staging_jobs.status", "completed")
    .order("created_at", { ascending: true, referencedTable: "staging_jobs" })
    .single();

  if (propertyError || !property) {
    // Check if property exists but has no completed jobs
    const { data: propertyOnly } = await supabase
      .from("properties")
      .select("id")
      .eq("id", id)
      .eq("user_id", user.id)
      .single();

    if (!propertyOnly) {
      return NextResponse.json({ error: "Property not found" }, { status: 404 });
    }
    return NextResponse.json({ error: "No completed images to download" }, { status: 400 });
  }

  interface StagingJob {
    id: string;
    version_group_id: string | null;
    is_primary_version: boolean;
    staged_image_url: string | null;
    room_type: string;
    style: string;
    created_at: string;
  }

  const stagingJobs = property.staging_jobs as StagingJob[];

  if (!stagingJobs || stagingJobs.length === 0) {
    return NextResponse.json({ error: "No completed images to download" }, { status: 400 });
  }

  // Filter to only include primary versions when there are version groups
  // For jobs without version groups, include them all
  // For jobs with version groups, only include the primary version (or first if no primary)
  const versionGroupJobs = new Map<string, StagingJob[]>();
  const jobsWithoutVersionGroup: StagingJob[] = [];

  for (const job of stagingJobs) {
    if (job.version_group_id) {
      const existing = versionGroupJobs.get(job.version_group_id) || [];
      existing.push(job);
      versionGroupJobs.set(job.version_group_id, existing);
    } else {
      jobsWithoutVersionGroup.push(job);
    }
  }

  // For each version group, select the primary version (or first completed if no primary)
  const filteredJobs: StagingJob[] = [...jobsWithoutVersionGroup];
  for (const [, groupJobs] of versionGroupJobs) {
    const primaryJob = groupJobs.find((j) => j.is_primary_version);
    if (primaryJob) {
      filteredJobs.push(primaryJob);
    } else if (groupJobs.length > 0) {
      filteredJobs.push(groupJobs[0]); // Fallback to first job
    }
  }

  // Sort by created_at for consistent ordering
  filteredJobs.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());

  // Create ZIP file
  const zip = new JSZip();

  // Create folder name from address (sanitize for filesystem)
  const folderName = property.address
    .replace(/[^a-zA-Z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .substring(0, 100);

  const folder = zip.folder(folderName);
  if (!folder) {
    return NextResponse.json({ error: "Failed to create ZIP folder" }, { status: 500 });
  }

  // Track room type counts for unique naming
  const roomTypeCounts: Record<string, number> = {};

  // Fetch and add each image to the ZIP
  for (const job of filteredJobs) {
    if (!job.staged_image_url) continue;

    try {
      // Format room type for filename
      const roomType = job.room_type
        .split("-")
        .map((word: string) => word.charAt(0).toUpperCase() + word.slice(1))
        .join("-");

      // Track count for this room type
      roomTypeCounts[roomType] = (roomTypeCounts[roomType] || 0) + 1;
      const count = roomTypeCounts[roomType];

      // Create filename: Room-Type-Style-1.png (only add number if multiple of same room type)
      const style = job.style.charAt(0).toUpperCase() + job.style.slice(1);
      const suffix = count > 1 ? `-${count}` : "";
      const filename = `${roomType}-${style}${suffix}.png`;

      // Fetch the image
      let imageData: ArrayBuffer;

      if (job.staged_image_url.startsWith("data:")) {
        // Handle base64 data URLs
        const base64Data = job.staged_image_url.split(",")[1];
        const binaryString = atob(base64Data);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }
        imageData = bytes.buffer;
      } else {
        // Fetch from URL
        const response = await fetch(job.staged_image_url);
        if (!response.ok) {
          console.error(`Failed to fetch image: ${job.staged_image_url}`);
          continue;
        }
        imageData = await response.arrayBuffer();
      }

      folder.file(filename, imageData);
    } catch (error) {
      console.error(`Error processing image for job ${job.id}:`, error);
      continue;
    }
  }

  // Generate ZIP
  const zipContent = await zip.generateAsync({ type: "arraybuffer" });

  // Return ZIP file
  return new NextResponse(zipContent, {
    headers: {
      "Content-Type": "application/zip",
      "Content-Disposition": `attachment; filename="${folderName}.zip"`,
    },
  });
}
