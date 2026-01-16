import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * POST /api/segment
 *
 * Use FastSAM to create masks from text prompts.
 * 50x faster than regular SAM (~2-5 seconds).
 * User types what to select (e.g., "sofa, table, chairs").
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
      prompt,
      negativePrompt,
    } = body as {
      image: string; // base64 image data
      mimeType: string;
      prompt: string; // What to select, e.g., "sofa, table, chairs"
      negativePrompt?: string; // What to exclude
    };

    if (!image || !mimeType || !prompt) {
      return NextResponse.json(
        { error: "Missing required fields: image, mimeType, prompt" },
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

    console.log("[Segment API] Prompt:", prompt);

    // Call FastSAM on Replicate - 50x faster than regular SAM
    const response = await fetch("https://api.replicate.com/v1/predictions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        // FastSAM - fast segment anything with text prompts
        version: "371aeee1ce0c5efd25bbef7a4527ec9e59188b963ebae1eeb851ddc145685c17",
        input: {
          input_image: imageUrl,
          text_prompt: prompt,
          iou: 0.7,
          conf: 0.25,
          retina: true, // High-res masks
        },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("[Segment API] Replicate error:", errorText);
      return NextResponse.json(
        { error: `FastSAM API error: ${response.status}` },
        { status: 500 }
      );
    }

    const prediction = await response.json();
    console.log("[Segment API] Prediction created:", prediction.id);

    // Poll for completion - FastSAM is very fast (~2-5 seconds)
    const maxAttempts = 40; // 20 seconds max
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

    // FastSAM returns output as a string URL or array of URLs
    let maskUrl: string | null = null;

    if (typeof result.output === "string") {
      maskUrl = result.output;
    } else if (Array.isArray(result.output) && result.output.length > 0) {
      // Take the first mask if multiple returned
      maskUrl = result.output[0];
    }

    if (!maskUrl) {
      console.error("[Segment API] No mask in output:", result.output);
      return NextResponse.json(
        { error: "No objects found matching your prompt" },
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
