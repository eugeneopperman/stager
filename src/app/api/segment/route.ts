import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * POST /api/segment
 *
 * Use SAM (Segment Anything Model) to create masks from click points.
 * Calls Replicate's meta/sam-2-video model which supports point prompts.
 */
export async function POST(request: NextRequest) {
  console.log("[Segment API] Request received");

  try {
    const supabase = await createClient();

    // Check authentication
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Parse request body
    const body = await request.json();
    const {
      image,
      mimeType,
      points,
      labels,
    } = body as {
      image: string; // base64 image data
      mimeType: string;
      points: Array<{ x: number; y: number }>; // click coordinates in pixels
      labels: number[]; // 1 = foreground (include), 0 = background (exclude)
    };

    if (!image || !mimeType || !points || points.length === 0) {
      return NextResponse.json(
        { error: "Missing required fields: image, mimeType, points" },
        { status: 400 }
      );
    }

    const apiToken = process.env.REPLICATE_API_TOKEN;
    if (!apiToken) {
      return NextResponse.json(
        { error: "Replicate API not configured" },
        { status: 500 }
      );
    }

    // Convert to data URL for Replicate
    const imageUrl = `data:${mimeType};base64,${image}`;

    // Format points for meta/sam-2-video: "[x,y],[x,y],..." as string
    const clickCoordinates = points.map(p => `[${Math.round(p.x)},${Math.round(p.y)}]`).join(",");
    // Format labels as comma-separated: "1,1,0,1"
    const clickLabels = (labels || points.map(() => 1)).join(",");

    console.log("[Segment API] Click coordinates:", clickCoordinates);
    console.log("[Segment API] Click labels:", clickLabels);

    // Call meta/sam-2-video on Replicate - supports point prompts
    const response = await fetch("https://api.replicate.com/v1/predictions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        // meta/sam-2-video - official Meta SAM 2 with point prompt support
        version: "33432afdfc06a10da6b4018932893d39b0159f838b6d11dd1236dff85cc5ec1d",
        input: {
          input_video: imageUrl, // Works with single images too
          click_coordinates: clickCoordinates,
          click_labels: clickLabels,
        },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("[Segment API] Replicate error:", errorText);
      return NextResponse.json(
        { error: `SAM API error: ${response.status}` },
        { status: 500 }
      );
    }

    const prediction = await response.json();
    console.log("[Segment API] Prediction created:", prediction.id);

    // Poll for completion - SAM 2 video takes ~49 seconds
    const maxAttempts = 120; // 60 seconds max
    let result = prediction;

    for (let i = 0; i < maxAttempts; i++) {
      if (result.status === "succeeded") {
        break;
      }
      if (result.status === "failed" || result.status === "canceled") {
        console.error("[Segment API] Prediction failed:", result.error);
        return NextResponse.json(
          { error: result.error || "Segmentation failed" },
          { status: 500 }
        );
      }

      // Wait 500ms then poll
      await new Promise(resolve => setTimeout(resolve, 500));

      const pollResponse = await fetch(
        `https://api.replicate.com/v1/predictions/${prediction.id}`,
        {
          headers: { Authorization: `Bearer ${apiToken}` },
        }
      );
      result = await pollResponse.json();

      // Log progress every 10 attempts
      if (i % 10 === 0) {
        console.log("[Segment API] Polling attempt", i, "status:", result.status);
      }
    }

    if (result.status !== "succeeded") {
      console.error("[Segment API] Timed out. Final status:", result.status);
      return NextResponse.json(
        { error: "Segmentation timed out" },
        { status: 500 }
      );
    }

    console.log("[Segment API] Success! Output:", JSON.stringify(result.output).substring(0, 500));

    // meta/sam-2-video returns output as a video/image URL or array
    // For single image, it should return a mask
    let maskUrl: string | null = null;

    if (typeof result.output === "string") {
      maskUrl = result.output;
    } else if (Array.isArray(result.output) && result.output.length > 0) {
      maskUrl = result.output[0];
    } else if (result.output?.combined_mask) {
      maskUrl = result.output.combined_mask;
    } else if (result.output?.masks?.[0]) {
      maskUrl = result.output.masks[0];
    }

    if (!maskUrl) {
      console.error("[Segment API] No mask in output:", result.output);
      return NextResponse.json(
        { error: "No mask returned from SAM" },
        { status: 500 }
      );
    }

    console.log("[Segment API] Got mask URL:", maskUrl);

    // Fetch the mask and convert to base64
    const maskResponse = await fetch(maskUrl);
    const maskBuffer = await maskResponse.arrayBuffer();
    const maskBase64 = Buffer.from(maskBuffer).toString("base64");

    // Determine content type
    const contentType = maskResponse.headers.get("content-type") || "image/png";
    const imageType = contentType.includes("jpeg") || contentType.includes("jpg")
      ? "image/jpeg"
      : "image/png";

    return NextResponse.json({
      success: true,
      maskDataUrl: `data:${imageType};base64,${maskBase64}`,
    });
  } catch (error) {
    console.error("[Segment API] Error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
