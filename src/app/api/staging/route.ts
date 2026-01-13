import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getProviderRouter, getReplicateProvider } from "@/lib/providers";
import { type RoomType, type FurnitureStyle, CREDITS_PER_STAGING } from "@/lib/constants";

/**
 * POST /api/staging
 *
 * Stage a room image with AI.
 * Uses provider system with Gemini as default.
 */
export async function POST(request: NextRequest) {
  const startTime = Date.now();
  console.log("[Staging API] Request received");

  try {
    const supabase = await createClient();

    // Check authentication
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      console.log("[Staging API] Unauthorized - no user");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.log("[Staging API] User authenticated:", user.id);

    // Get user profile and check credits
    const { data: profile } = await supabase
      .from("profiles")
      .select("credits_remaining")
      .eq("id", user.id)
      .single();

    if (!profile || profile.credits_remaining < CREDITS_PER_STAGING) {
      console.log("[Staging API] Insufficient credits");
      return NextResponse.json(
        { error: "Insufficient credits. Please upgrade your plan." },
        { status: 402 }
      );
    }
    console.log("[Staging API] Credits OK:", profile.credits_remaining);

    // Parse request body
    const body = await request.json();
    const {
      image,
      mimeType,
      roomType,
      style,
      propertyId,
    } = body as {
      image: string;
      mimeType: string;
      roomType: RoomType;
      style: FurnitureStyle;
      propertyId?: string;
    };

    if (!image || !mimeType || !roomType || !style) {
      console.log("[Staging API] Missing required fields");
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }
    console.log("[Staging API] Room:", roomType, "Style:", style, "Image size:", image.length);

    // Generate a unique job ID
    const jobId = crypto.randomUUID();
    console.log("[Staging API] Job ID:", jobId);

    // Upload original image to Supabase Storage
    const originalFileName = `${user.id}/${jobId}-original.${mimeType.split("/")[1] || "png"}`;
    const originalImageBuffer = Buffer.from(image, "base64");

    const { error: originalUploadError } = await supabase.storage
      .from("staging-images")
      .upload(originalFileName, originalImageBuffer, {
        contentType: mimeType,
        upsert: true,
      });

    let originalImageUrl: string;
    if (originalUploadError) {
      console.error("[Staging API] Original image upload error:", originalUploadError);
      originalImageUrl = `data:${mimeType};base64,${image.substring(0, 100)}...`;
    } else {
      const { data: originalPublicUrl } = supabase.storage
        .from("staging-images")
        .getPublicUrl(originalFileName);
      originalImageUrl = originalPublicUrl.publicUrl;
      console.log("[Staging API] Original image uploaded");
    }

    // Select provider
    console.log("[Staging API] Selecting provider...");
    const router = getProviderRouter();
    const { provider, fallbackUsed } = await router.selectProvider();
    console.log("[Staging API] Provider selected:", provider.providerId, "Fallback used:", fallbackUsed);

    // Create staging job record
    const { data: job, error: jobError } = await supabase
      .from("staging_jobs")
      .insert({
        id: jobId,
        user_id: user.id,
        property_id: propertyId || null,
        original_image_url: originalImageUrl,
        room_type: roomType,
        style: style,
        status: "processing",
        provider: provider.providerId,
      })
      .select()
      .single();

    if (jobError) {
      console.error("[Staging API] Failed to create job:", jobError);
      return NextResponse.json(
        { error: "Failed to create staging job" },
        { status: 500 }
      );
    }
    console.log("[Staging API] Job created in DB");

    // Handle sync provider (Gemini)
    if (provider.supportsSync) {
      console.log("[Staging API] Using sync provider, calling stageImageSync...");
      const result = await provider.stageImageSync({
        imageBase64: image,
        mimeType,
        roomType,
        furnitureStyle: style,
        jobId,
      });
      console.log("[Staging API] stageImageSync returned, success:", result.success);

      if (!result.success || !result.imageData) {
        console.error("[Staging API] Staging failed:", result.error);
        await supabase
          .from("staging_jobs")
          .update({
            status: "failed",
            error_message: result.error || "Staging failed",
            processing_time_ms: Date.now() - startTime,
          })
          .eq("id", job.id);

        return NextResponse.json(
          { error: result.error || "Failed to stage image" },
          { status: 500 }
        );
      }

      // Upload staged image
      console.log("[Staging API] Uploading staged image...");
      const fileName = `${user.id}/${job.id}-staged.${result.mimeType?.split("/")[1] || "png"}`;
      const imageBuffer = Buffer.from(result.imageData, "base64");

      const { error: uploadError } = await supabase.storage
        .from("staging-images")
        .upload(fileName, imageBuffer, {
          contentType: result.mimeType || "image/png",
          upsert: true,
        });

      const { data: publicUrl } = supabase.storage
        .from("staging-images")
        .getPublicUrl(fileName);

      const stagedImageUrl = uploadError
        ? `data:${result.mimeType};base64,${result.imageData}`
        : publicUrl.publicUrl;

      // Update job as completed
      await supabase
        .from("staging_jobs")
        .update({
          status: "completed",
          staged_image_url: stagedImageUrl,
          completed_at: new Date().toISOString(),
          processing_time_ms: Date.now() - startTime,
        })
        .eq("id", job.id);

      // Deduct credits
      await supabase
        .from("profiles")
        .update({
          credits_remaining: profile.credits_remaining - CREDITS_PER_STAGING,
        })
        .eq("id", user.id);

      console.log("[Staging API] Success! Processing time:", Date.now() - startTime, "ms");
      return NextResponse.json({
        success: true,
        jobId: job.id,
        stagedImageUrl,
        provider: provider.providerId,
        async: false,
      });
    }

    // Handle async provider (Stable Diffusion)
    console.log("[Staging API] Using async provider (Stable Diffusion)");
    console.log("[Staging API] Original image URL:", originalImageUrl.substring(0, 150));

    // Get webhook URL for completion callback (only use HTTPS URLs)
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "";
    const webhookUrl = appUrl.startsWith("https://")
      ? `${appUrl}/api/webhooks/replicate`
      : undefined;
    console.log("[Staging API] Webhook URL:", webhookUrl || "none (will use polling)");

    // Start async staging with Replicate
    const replicateProvider = getReplicateProvider();
    try {
      const asyncResult = await replicateProvider.stageImageAsync(
        {
          imageBase64: image,
          imageUrl: originalImageUrl, // Use the uploaded image URL
          mimeType,
          roomType,
          furnitureStyle: style,
          jobId,
        },
        webhookUrl || ""
      );
      console.log("[Staging API] Replicate prediction started:", asyncResult.predictionId);

      // Store prediction ID for status polling
      await supabase
        .from("staging_jobs")
        .update({
          replicate_prediction_id: asyncResult.predictionId,
        })
        .eq("id", job.id);

      // Return immediately - client will poll for status
      return NextResponse.json({
        success: true,
        jobId: job.id,
        status: "processing",
        provider: provider.providerId,
        async: true,
        predictionId: asyncResult.predictionId,
        estimatedTimeSeconds: replicateProvider.getEstimatedProcessingTime(),
        pollUrl: `/api/staging/${job.id}/status`,
      });
    } catch (error) {
      console.error("[Staging API] Replicate error:", error);

      // Update job as failed
      await supabase
        .from("staging_jobs")
        .update({
          status: "failed",
          error_message: error instanceof Error ? error.message : "Replicate staging failed",
        })
        .eq("id", job.id);

      return NextResponse.json(
        { error: error instanceof Error ? error.message : "Stable Diffusion staging failed" },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error("[Staging API] Unexpected error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}
