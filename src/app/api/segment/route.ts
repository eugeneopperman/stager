import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * POST /api/segment
 *
 * Use SAM (Segment Anything Model) to create masks from click points.
 * Calls Replicate's SAM 2 model.
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
      points: Array<{ x: number; y: number }>; // click coordinates (normalized 0-1)
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

    // Format points for SAM - it expects [[x1,y1], [x2,y2], ...]
    const pointCoords = points.map(p => [p.x, p.y]);
    const pointLabels = labels || points.map(() => 1); // Default all to foreground

    console.log("[Segment API] Points:", pointCoords.length, "Labels:", pointLabels);

    // Call SAM 2 on Replicate
    // Model: meta/sam-2-base - the official Meta SAM 2 model
    const response = await fetch("https://api.replicate.com/v1/predictions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        // SAM 2 base model
        version: "fe97b453a6455861e3bac769b441ca1f1086110da7466dbb65cf1eecfd60dc83",
        input: {
          image: imageUrl,
          point_coords: pointCoords,
          point_labels: pointLabels,
          multimask_output: false, // Single best mask
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

    // Poll for completion (SAM is fast, usually < 5 seconds)
    const maxAttempts = 30;
    let result = prediction;

    for (let i = 0; i < maxAttempts; i++) {
      if (result.status === "succeeded") {
        break;
      }
      if (result.status === "failed") {
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
    }

    if (result.status !== "succeeded") {
      return NextResponse.json(
        { error: "Segmentation timed out" },
        { status: 500 }
      );
    }

    // SAM 2 returns combined_mask as a URL to the mask image
    const maskUrl = result.output?.combined_mask || result.output?.masks?.[0];

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

    return NextResponse.json({
      success: true,
      maskDataUrl: `data:image/png;base64,${maskBase64}`,
    });
  } catch (error) {
    console.error("[Segment API] Error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
