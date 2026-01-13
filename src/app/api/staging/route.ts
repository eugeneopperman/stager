import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  getProviderRouter,
  getReplicateProvider,
  type StagingProvider,
} from "@/lib/providers";
import { runPreprocessingPipeline } from "@/lib/preprocessing";
import { type RoomType, type FurnitureStyle, CREDITS_PER_STAGING } from "@/lib/constants";

/**
 * POST /api/staging
 *
 * Stage a room image with AI.
 * Supports both sync (Gemini) and async (Stable Diffusion) providers.
 */
export async function POST(request: NextRequest) {
  const startTime = Date.now();

  try {
    const supabase = await createClient();

    // Check authentication
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get user profile and check credits
    const { data: profile } = await supabase
      .from("profiles")
      .select("credits_remaining")
      .eq("id", user.id)
      .single();

    if (!profile || profile.credits_remaining < CREDITS_PER_STAGING) {
      return NextResponse.json(
        { error: "Insufficient credits. Please upgrade your plan." },
        { status: 402 }
      );
    }

    // Parse request body
    const body = await request.json();
    const {
      image,
      mimeType,
      roomType,
      style,
      propertyId,
      preferredProvider,
    } = body as {
      image: string;
      mimeType: string;
      roomType: RoomType;
      style: FurnitureStyle;
      propertyId?: string;
      preferredProvider?: StagingProvider;
    };

    if (!image || !mimeType || !roomType || !style) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Generate a unique job ID
    const jobId = crypto.randomUUID();

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
      console.error("Original image upload error:", originalUploadError);
      originalImageUrl = `data:${mimeType};base64,${image.substring(0, 100)}...`;
    } else {
      const { data: originalPublicUrl } = supabase.storage
        .from("staging-images")
        .getPublicUrl(originalFileName);
      originalImageUrl = originalPublicUrl.publicUrl;
    }

    // Select provider based on availability and preference
    const router = getProviderRouter();
    const { provider, fallbackUsed } = await router.selectProvider(preferredProvider);

    if (fallbackUsed) {
      console.log(`Using fallback provider: ${provider.providerId}`);
    }

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
        status: provider.supportsSync ? "processing" : "queued",
        provider: provider.providerId,
      })
      .select()
      .single();

    if (jobError) {
      console.error("Failed to create job:", jobError);
      return NextResponse.json(
        { error: "Failed to create staging job" },
        { status: 500 }
      );
    }

    // Handle sync provider (Gemini)
    if (provider.supportsSync) {
      const result = await provider.stageImageSync({
        imageBase64: image,
        mimeType,
        roomType,
        furnitureStyle: style,
        jobId,
      });

      if (!result.success || !result.imageData) {
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

      return NextResponse.json({
        success: true,
        jobId: job.id,
        stagedImageUrl,
        provider: provider.providerId,
        async: false,
      });
    }

    // Handle async provider (Stable Diffusion)
    // Update status to preprocessing
    await supabase
      .from("staging_jobs")
      .update({ status: "preprocessing" })
      .eq("id", job.id);

    // Run preprocessing pipeline for ControlNet
    const preprocessingResults = await runPreprocessingPipeline(
      originalImageUrl,
      jobId,
      user.id
    );

    // Update preprocessing completion
    await supabase
      .from("staging_jobs")
      .update({
        preprocessing_completed_at: new Date().toISOString(),
        controlnet_inputs: {
          depth_map_url: preprocessingResults.depthMap?.imageUrl,
          canny_edge_url: preprocessingResults.cannyEdge?.imageUrl,
          segmentation_url: preprocessingResults.segmentation?.imageUrl,
        },
        status: "processing",
      })
      .eq("id", job.id);

    // Get webhook URL for completion callback
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const webhookUrl = `${appUrl}/api/webhooks/replicate`;

    // Start async staging with Replicate
    const replicateProvider = getReplicateProvider();
    const asyncResult = await replicateProvider.stageImageAsync(
      {
        imageBase64: image,
        mimeType,
        roomType,
        furnitureStyle: style,
        jobId,
      },
      webhookUrl,
      {
        depthMapUrl: preprocessingResults.depthMap?.imageUrl,
        cannyEdgeUrl: preprocessingResults.cannyEdge?.imageUrl,
        segmentationUrl: preprocessingResults.segmentation?.imageUrl,
      }
    );

    // Store prediction ID for webhook matching
    await supabase
      .from("staging_jobs")
      .update({
        replicate_prediction_id: asyncResult.predictionId,
        generation_params: {
          prompt: replicateProvider.buildPrompt(roomType, style),
          negative_prompt: replicateProvider.buildNegativePrompt(),
        },
      })
      .eq("id", job.id);

    // Return immediately for async - client will poll for status
    return NextResponse.json({
      success: true,
      jobId: job.id,
      status: "processing",
      provider: provider.providerId,
      async: true,
      estimatedTimeSeconds: provider.getEstimatedProcessingTime(),
      pollUrl: `/api/staging/${job.id}/status`,
    });
  } catch (error) {
    console.error("Staging API error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}
