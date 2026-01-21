import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { fetchImageBuffer, processImage } from "@/lib/download/process-image";
import { RESOLUTION_PRESETS, type ResolutionPreset } from "@/lib/download/presets";
import JSZip from "jszip";

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
  const propertyId = searchParams.get("propertyId");
  const resolution = (searchParams.get("resolution") || "original") as ResolutionPreset;
  const watermark = searchParams.get("watermark") === "true";
  const includeClean = searchParams.get("includeClean") === "true";

  if (!propertyId) {
    return NextResponse.json({ error: "Missing propertyId parameter" }, { status: 400 });
  }

  // Validate resolution preset
  if (!RESOLUTION_PRESETS[resolution]) {
    return NextResponse.json({ error: "Invalid resolution preset" }, { status: 400 });
  }

  try {
    // Fetch the property
    const { data: property, error: propertyError } = await supabase
      .from("properties")
      .select("*")
      .eq("id", propertyId)
      .eq("user_id", user.id)
      .single();

    if (propertyError || !property) {
      return NextResponse.json({ error: "Property not found" }, { status: 404 });
    }

    // Fetch completed staging jobs for this property
    const { data: jobs, error: jobsError } = await supabase
      .from("staging_jobs")
      .select("*")
      .eq("property_id", propertyId)
      .eq("status", "completed")
      .not("staged_image_url", "is", null)
      .order("created_at", { ascending: false });

    if (jobsError) {
      return NextResponse.json({ error: "Failed to fetch staging jobs" }, { status: 500 });
    }

    if (!jobs || jobs.length === 0) {
      return NextResponse.json({ error: "No completed staging jobs found" }, { status: 400 });
    }

    // Create ZIP
    const zip = new JSZip();
    const sanitizedAddress = property.address.replace(/[^a-z0-9]/gi, "-").substring(0, 50);

    // Helper function to format names
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

    // Track filenames to handle duplicates
    const filenameCount: Record<string, number> = {};

    const getUniqueFilename = (baseName: string) => {
      if (!filenameCount[baseName]) {
        filenameCount[baseName] = 0;
      }
      filenameCount[baseName]++;
      if (filenameCount[baseName] === 1) {
        return `${baseName}.jpg`;
      }
      return `${baseName}-${filenameCount[baseName]}.jpg`;
    };

    // Process each job
    for (const job of jobs) {
      if (!job.staged_image_url) continue;

      try {
        const imageBuffer = await fetchImageBuffer(job.staged_image_url);
        const baseName = `${formatRoomType(job.room_type)}-${formatStyle(job.style)}`;

        // Reset filename count for each folder structure
        const watermarkKey = `watermarked/${baseName}`;
        const cleanKey = `clean/${baseName}`;

        if (includeClean && watermark) {
          // "Download Both" mode: create both watermarked/ and clean/ folders

          // Process watermarked version
          const processedWatermarked = await processImage(imageBuffer, {
            resolution,
            watermark: true,
          });
          const watermarkFilename = getUniqueFilename(watermarkKey);
          zip.file(`${sanitizedAddress}/watermarked/${watermarkFilename.replace('watermarked/', '')}`, processedWatermarked.buffer);

          // Process clean version
          const processedClean = await processImage(imageBuffer, {
            resolution,
            watermark: false,
          });
          filenameCount[cleanKey] = filenameCount[watermarkKey]; // Sync the count
          const cleanFilename = getUniqueFilename(cleanKey);
          zip.file(`${sanitizedAddress}/clean/${cleanFilename.replace('clean/', '')}`, processedClean.buffer);
        } else {
          // Single version mode
          const processed = await processImage(imageBuffer, {
            resolution,
            watermark,
          });
          const filename = getUniqueFilename(baseName);
          zip.file(`${sanitizedAddress}/${filename}`, processed.buffer);
        }
      } catch (error) {
        console.error(`Failed to process image for job ${job.id}:`, error);
        // Continue with other images
      }
    }

    // Generate ZIP as Blob
    const zipBlob = await zip.generateAsync({
      type: "blob",
      compression: "DEFLATE",
      compressionOptions: { level: 6 },
    });

    // Return the ZIP
    const zipFilename = `${sanitizedAddress}.zip`;

    return new Response(zipBlob, {
      status: 200,
      headers: {
        "Content-Type": "application/zip",
        "Content-Disposition": `attachment; filename="${zipFilename}"`,
        "Content-Length": zipBlob.size.toString(),
        "Cache-Control": "private, no-cache",
      },
    });
  } catch (error) {
    console.error("Error creating batch download:", error);
    return NextResponse.json(
      { error: "Failed to create batch download" },
      { status: 500 }
    );
  }
}
