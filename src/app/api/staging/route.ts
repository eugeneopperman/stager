import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getProviderRouter, getReplicateProvider, Decor8Provider } from "@/lib/providers";
import { CREDITS_PER_STAGING, ROOM_TYPES } from "@/lib/constants";
import { createNotification } from "@/lib/notifications";
import { getUserCredits, deductCredits, logCreditTransaction } from "@/lib/billing/subscription";
import { validateRequest, stagingRequestSchema } from "@/lib/schemas";
import { rateLimiters, getRateLimitHeaders, getClientIdentifier } from "@/lib/rate-limit";

/**
 * POST /api/staging
 *
 * Stage a room image with AI.
 * Uses provider system with Gemini as default.
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

    // Rate limiting - staging is resource-intensive
    const rateLimitResult = rateLimiters.staging(getClientIdentifier(request, user.id));
    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        { error: "Too many staging requests. Please wait before trying again." },
        { status: 429, headers: getRateLimitHeaders(rateLimitResult) }
      );
    }

    // Get user credits (handles both personal and team credits)
    const creditInfo = await getUserCredits(user.id);

    if (creditInfo.available < CREDITS_PER_STAGING) {
      return NextResponse.json(
        { error: "Insufficient credits. Please upgrade your plan." },
        { status: 402 }
      );
    }

    // Parse and validate request body
    const body = await request.json();
    const validation = validateRequest(stagingRequestSchema, body);
    if (!validation.success) {
      return validation.response;
    }

    const {
      image,
      mimeType,
      roomType,
      style,
      propertyId,
      declutterFirst, // If true, remove furniture before staging
      mask, // Optional B/W mask image (base64) - white = areas to stage, black = preserve
    } = validation.data;

    // Generate a unique job ID
    const jobId = crypto.randomUUID();

    // Try to upload original image to Supabase Storage (non-blocking)
    const originalFileName = `${user.id}/${jobId}-original.${mimeType.split("/")[1] || "png"}`;
    let originalImageUrl = `data:${mimeType};base64,${image.substring(0, 100)}...`; // Default fallback

    try {
      const originalImageBuffer = Buffer.from(image, "base64");
      const { error: originalUploadError } = await supabase.storage
        .from("staging-images")
        .upload(originalFileName, originalImageBuffer, {
          contentType: mimeType,
          upsert: true,
        });

      if (!originalUploadError) {
        // Try to get a signed URL
        const { data: signedUrlData } = await supabase.storage
          .from("staging-images")
          .createSignedUrl(originalFileName, 3600);

        if (signedUrlData?.signedUrl) {
          originalImageUrl = signedUrlData.signedUrl;
        } else {
          const { data: publicUrl } = supabase.storage
            .from("staging-images")
            .getPublicUrl(originalFileName);
          originalImageUrl = publicUrl.publicUrl;
        }
      }
    } catch {
      // Continue with base64 fallback
    }

    // Select provider
    const router = getProviderRouter();
    const { provider } = await router.selectProvider();

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

    // Handle sync provider (Decor8 or Gemini)
    if (provider.supportsSync) {
      let result;

      // If declutterFirst and using Decor8, use the declutter → stage pipeline
      if (declutterFirst && provider instanceof Decor8Provider) {
        result = await provider.declutterAndStage({
          imageBase64: image,
          mimeType,
          roomType,
          furnitureStyle: style,
          jobId,
        });
      } else {
        result = await provider.stageImageSync({
          imageBase64: image,
          mimeType,
          roomType,
          furnitureStyle: style,
          jobId,
          maskBase64: mask,
        });
      }

      if (!result.success || !result.imageData) {
        await supabase
          .from("staging_jobs")
          .update({
            status: "failed",
            error_message: result.error || "Staging failed",
            processing_time_ms: Date.now() - startTime,
          })
          .eq("id", job.id);

        // Create staging failure notification
        const roomLabel = ROOM_TYPES.find((r) => r.id === roomType)?.label || roomType;
        await createNotification(
          supabase,
          user.id,
          "staging_failed",
          "Staging Failed",
          `Your ${roomLabel} staging could not be completed. Please try again.`,
          "/history"
        );

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

      // Deduct credits (handles both personal and team credits)
      const deductSuccess = await deductCredits(user.id, CREDITS_PER_STAGING);
      if (!deductSuccess) {
        console.error("[Staging API] Failed to deduct credits");
      }
      const newCredits = creditInfo.available - CREDITS_PER_STAGING;

      // Log the credit transaction
      await logCreditTransaction({
        userId: user.id,
        type: "staging_deduction",
        amount: -CREDITS_PER_STAGING,
        balanceAfter: newCredits,
        referenceId: job.id,
        description: `Staging job: ${roomType} - ${style}`,
      });

      // Create staging completion notification
      const roomLabel = ROOM_TYPES.find((r) => r.id === roomType)?.label || roomType;
      await createNotification(
        supabase,
        user.id,
        "staging_complete",
        "Staging Complete",
        `Your ${roomLabel} staging is ready to view!`,
        "/history"
      );

      // Check for low credits warning (3 or fewer)
      if (newCredits <= 3 && newCredits > 0) {
        await createNotification(
          supabase,
          user.id,
          "low_credits",
          "Low Credits",
          `You have ${newCredits} credit${newCredits !== 1 ? "s" : ""} remaining. Consider adding more to continue staging.`,
          "/billing"
        );
      }

      return NextResponse.json({
        success: true,
        jobId: job.id,
        stagedImageUrl,
        provider: provider.providerId,
        async: false,
      });
    }

    // Handle async provider (Stable Diffusion)
    // Get webhook URL for completion callback (only use HTTPS URLs)
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "";
    const webhookUrl = appUrl.startsWith("https://")
      ? `${appUrl}/api/webhooks/replicate`
      : undefined;

    // Start async staging with Replicate
    // Use base64 data URL directly (storage URLs have permission issues)
    const replicateProvider = getReplicateProvider();
    try {
      const asyncResult = await replicateProvider.stageImageAsync(
        {
          imageBase64: image,
          // Skip imageUrl - use base64 directly to avoid storage permission issues
          mimeType,
          roomType,
          furnitureStyle: style,
          jobId,
        },
        webhookUrl // Pass undefined if not set, not empty string
      );

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
    const errorMessage = error instanceof Error ? error.message : "An unexpected error occurred";
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}
