import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getProviderRouter, getReplicateProvider } from "@/lib/providers";
import {
  type RoomType,
  type FurnitureStyle,
  FREE_REMIXES_PER_IMAGE,
  CREDITS_PER_REMIX,
  ROOM_TYPES,
} from "@/lib/constants";
import { createNotification } from "@/lib/notifications";
import crypto from "crypto";

/**
 * Compute a hash for grouping versions of the same original image
 */
function computeImageHash(imageUrl: string): string {
  return crypto.createHash("md5").update(imageUrl).digest("hex");
}

/**
 * POST /api/staging/[jobId]/remix
 *
 * Create a remix of an existing staging job with different settings.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ jobId: string }> }
) {
  const { jobId } = await params;
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

    // Fetch the parent job
    const { data: parentJob, error: parentError } = await supabase
      .from("staging_jobs")
      .select("*")
      .eq("id", jobId)
      .eq("user_id", user.id)
      .single();

    if (parentError || !parentJob) {
      return NextResponse.json(
        { error: "Parent job not found" },
        { status: 404 }
      );
    }

    if (parentJob.status !== "completed") {
      return NextResponse.json(
        { error: "Can only remix completed staging jobs" },
        { status: 400 }
      );
    }

    // Parse request body
    const body = await request.json();
    const { roomType, style, propertyId } = body as {
      roomType: RoomType;
      style: FurnitureStyle;
      propertyId?: string;
    };

    if (!roomType || !style) {
      return NextResponse.json(
        { error: "Room type and style are required" },
        { status: 400 }
      );
    }

    // Get or create version group
    const originalImageUrl = parentJob.original_image_url;
    const imageHash = computeImageHash(originalImageUrl);

    let versionGroupData: {
      id: string;
      free_remixes_used: number;
    } | null = null;

    const { data: existingGroup, error: fetchError } = await supabase
      .from("version_groups")
      .select("*")
      .eq("user_id", user.id)
      .eq("original_image_hash", imageHash)
      .single();

    if (fetchError || !existingGroup) {
      // Create new version group
      const { data: newGroup, error: createError } = await supabase
        .from("version_groups")
        .insert({
          user_id: user.id,
          original_image_hash: imageHash,
          original_image_url: originalImageUrl,
          free_remixes_used: 0,
        })
        .select()
        .single();

      if (createError || !newGroup) {
        console.error("[Remix API] Failed to create version group:", createError);
        return NextResponse.json(
          { error: "Failed to create version group" },
          { status: 500 }
        );
      }

      versionGroupData = newGroup;

      // Also update the parent job to link to the version group if not already
      if (!parentJob.version_group_id) {
        await supabase
          .from("staging_jobs")
          .update({
            version_group_id: newGroup.id,
            is_primary_version: true, // First job becomes primary
          })
          .eq("id", parentJob.id);
      }
    } else {
      versionGroupData = existingGroup;
    }

    if (!versionGroupData) {
      return NextResponse.json(
        { error: "Failed to get or create version group" },
        { status: 500 }
      );
    }

    // Check credits: first 2 remixes are free, then 1 credit each
    const freeRemixesUsed = versionGroupData.free_remixes_used || 0;
    const isFreeRemix = freeRemixesUsed < FREE_REMIXES_PER_IMAGE;

    if (!isFreeRemix) {
      // Need to check and deduct credits
      const { data: profile } = await supabase
        .from("profiles")
        .select("credits_remaining")
        .eq("id", user.id)
        .single();

      if (!profile || profile.credits_remaining < CREDITS_PER_REMIX) {
        return NextResponse.json(
          { error: "Insufficient credits. Please upgrade your plan." },
          { status: 402 }
        );
      }
    }

    // Generate a unique job ID for the remix
    const newJobId = crypto.randomUUID();

    // Select provider
    const router = getProviderRouter();
    const { provider } = await router.selectProvider();

    // Create new staging job for the remix
    const { error: jobError } = await supabase
      .from("staging_jobs")
      .insert({
        id: newJobId,
        user_id: user.id,
        property_id: propertyId || parentJob.property_id || null,
        original_image_url: originalImageUrl,
        room_type: roomType,
        style: style,
        status: "processing",
        provider: provider.providerId,
        version_group_id: versionGroupData.id,
        parent_job_id: parentJob.id,
        is_primary_version: false,
      })
      .select()
      .single();

    if (jobError) {
      console.error("[Remix API] Failed to create job:", jobError);
      return NextResponse.json(
        { error: "Failed to create remix job" },
        { status: 500 }
      );
    }

    // Increment free_remixes_used if this was a free remix
    if (isFreeRemix) {
      await supabase
        .from("version_groups")
        .update({ free_remixes_used: freeRemixesUsed + 1 })
        .eq("id", versionGroupData.id);
    }

    // Fetch original image and convert to base64
    let imageBase64: string;
    let mimeType: string = "image/png";

    try {
      const imageResponse = await fetch(originalImageUrl);
      if (!imageResponse.ok) {
        throw new Error("Failed to fetch original image");
      }
      const imageBuffer = await imageResponse.arrayBuffer();
      imageBase64 = Buffer.from(imageBuffer).toString("base64");
      mimeType = imageResponse.headers.get("content-type") || "image/png";
    } catch (fetchError) {
      console.error("[Remix API] Failed to fetch original image:", fetchError);
      await supabase
        .from("staging_jobs")
        .update({
          status: "failed",
          error_message: "Failed to fetch original image",
        })
        .eq("id", newJobId);
      return NextResponse.json(
        { error: "Failed to fetch original image" },
        { status: 500 }
      );
    }

    // Handle sync provider (Decor8 or Gemini)
    if (provider.supportsSync) {
      const result = await provider.stageImageSync({
        imageBase64,
        mimeType,
        roomType,
        furnitureStyle: style,
        jobId: newJobId,
      });

      if (!result.success || !result.imageData) {
        await supabase
          .from("staging_jobs")
          .update({
            status: "failed",
            error_message: result.error || "Staging failed",
            processing_time_ms: Date.now() - startTime,
          })
          .eq("id", newJobId);

        const roomLabel = ROOM_TYPES.find((r) => r.id === roomType)?.label || roomType;
        await createNotification(
          supabase,
          user.id,
          "staging_failed",
          "Remix Failed",
          `Your ${roomLabel} remix could not be completed. Please try again.`,
          "/history"
        );

        return NextResponse.json(
          { error: result.error || "Failed to stage image" },
          { status: 500 }
        );
      }

      // Upload staged image
      const fileName = `${user.id}/${newJobId}-staged.${result.mimeType?.split("/")[1] || "png"}`;
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
          credits_used: isFreeRemix ? 0 : CREDITS_PER_REMIX,
        })
        .eq("id", newJobId);

      // Deduct credits if not a free remix
      if (!isFreeRemix) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("credits_remaining")
          .eq("id", user.id)
          .single();

        if (profile) {
          await supabase
            .from("profiles")
            .update({
              credits_remaining: profile.credits_remaining - CREDITS_PER_REMIX,
            })
            .eq("id", user.id);
        }
      }

      // Create completion notification
      const roomLabel = ROOM_TYPES.find((r) => r.id === roomType)?.label || roomType;
      await createNotification(
        supabase,
        user.id,
        "staging_complete",
        "Remix Complete",
        `Your ${roomLabel} remix is ready to view!`,
        "/history"
      );

      return NextResponse.json({
        success: true,
        jobId: newJobId,
        stagedImageUrl,
        provider: provider.providerId,
        async: false,
        isFreeRemix,
        freeRemixesRemaining: isFreeRemix
          ? FREE_REMIXES_PER_IMAGE - (freeRemixesUsed + 1)
          : 0,
        versionGroupId: versionGroupData.id,
      });
    }

    // Handle async provider (Stable Diffusion)
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "";
    const webhookUrl = appUrl.startsWith("https://")
      ? `${appUrl}/api/webhooks/replicate`
      : undefined;

    const replicateProvider = getReplicateProvider();
    try {
      const asyncResult = await replicateProvider.stageImageAsync(
        {
          imageBase64,
          mimeType,
          roomType,
          furnitureStyle: style,
          jobId: newJobId,
        },
        webhookUrl
      );

      await supabase
        .from("staging_jobs")
        .update({
          replicate_prediction_id: asyncResult.predictionId,
        })
        .eq("id", newJobId);

      return NextResponse.json({
        success: true,
        jobId: newJobId,
        status: "processing",
        provider: provider.providerId,
        async: true,
        predictionId: asyncResult.predictionId,
        pollUrl: `/api/staging/${newJobId}/status`,
        isFreeRemix,
        freeRemixesRemaining: isFreeRemix
          ? FREE_REMIXES_PER_IMAGE - (freeRemixesUsed + 1)
          : 0,
        versionGroupId: versionGroupData.id,
      });
    } catch (error) {
      console.error("[Remix API] Replicate error:", error);
      await supabase
        .from("staging_jobs")
        .update({
          status: "failed",
          error_message: error instanceof Error ? error.message : "Replicate staging failed",
        })
        .eq("id", newJobId);

      return NextResponse.json(
        { error: error instanceof Error ? error.message : "Stable Diffusion staging failed" },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("[Remix API] Unexpected error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "An unexpected error occurred" },
      { status: 500 }
    );
  }
}
