import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { fetchImageBuffer, processImage } from "@/lib/download/process-image";
import { RESOLUTION_PRESETS, type ResolutionPreset } from "@/lib/download/presets";

export async function GET(request: NextRequest) {
  const supabase = await createClient();

  // Check authentication
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Parse query params
  const { searchParams } = new URL(request.url);
  const jobId = searchParams.get("jobId");
  const resolution = (searchParams.get("resolution") || "original") as ResolutionPreset;
  const watermark = searchParams.get("watermark") === "true";

  if (!jobId) {
    return NextResponse.json({ error: "Missing jobId parameter" }, { status: 400 });
  }

  // Validate resolution preset
  if (!RESOLUTION_PRESETS[resolution]) {
    return NextResponse.json({ error: "Invalid resolution preset" }, { status: 400 });
  }

  try {
    // Fetch the staging job
    const { data: job, error } = await supabase
      .from("staging_jobs")
      .select("*, properties(address, user_id)")
      .eq("id", jobId)
      .single();

    if (error || !job) {
      return NextResponse.json({ error: "Staging job not found" }, { status: 404 });
    }

    // Verify ownership - check if job belongs to user (via property or direct user_id)
    const hasAccess =
      job.user_id === user.id ||
      (job.properties && job.properties.user_id === user.id);

    if (!hasAccess) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    if (!job.staged_image_url) {
      return NextResponse.json({ error: "Staged image not available" }, { status: 400 });
    }

    // Fetch and process the image
    const imageBuffer = await fetchImageBuffer(job.staged_image_url);
    const processed = await processImage(imageBuffer, { resolution, watermark });

    // Generate filename
    const formatRoomType = (roomType: string) =>
      roomType
        .split("-")
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join("-");

    const formatStyle = (style: string) =>
      style
        .split("-")
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join("-");

    const propertyName = job.properties?.address
      ? job.properties.address.replace(/[^a-z0-9]/gi, "-").substring(0, 30)
      : "Staged";
    const roomType = formatRoomType(job.room_type);
    const style = formatStyle(job.style);
    const watermarkSuffix = watermark ? "-watermarked" : "";
    const filename = `${propertyName}-${roomType}-${style}${watermarkSuffix}.jpg`;

    // Return the image - convert Buffer to Uint8Array for Response
    const imageData = new Uint8Array(processed.buffer);
    return new Response(imageData, {
      status: 200,
      headers: {
        "Content-Type": "image/jpeg",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Content-Length": imageData.length.toString(),
        "Cache-Control": "private, max-age=3600",
      },
    });
  } catch (error) {
    console.error("Error processing image download:", error);
    return NextResponse.json(
      { error: "Failed to process image" },
      { status: 500 }
    );
  }
}
