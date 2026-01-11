import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { stageImage } from "@/lib/gemini";
import { type RoomType, type FurnitureStyle, CREDITS_PER_STAGING } from "@/lib/constants";

export async function POST(request: NextRequest) {
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
    const { image, mimeType, roomType, style, propertyId } = body as {
      image: string;
      mimeType: string;
      roomType: RoomType;
      style: FurnitureStyle;
      propertyId?: string;
    };

    if (!image || !mimeType || !roomType || !style) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Generate a unique job ID for file naming
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
      // Fallback to truncated reference if upload fails
      originalImageUrl = `data:${mimeType};base64,${image.substring(0, 100)}...`;
    } else {
      const { data: originalPublicUrl } = supabase.storage
        .from("staging-images")
        .getPublicUrl(originalFileName);
      originalImageUrl = originalPublicUrl.publicUrl;
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
        status: "processing",
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

    // Call Gemini API to stage the image
    const result = await stageImage(image, mimeType, roomType, style);

    if (!result.success || !result.imageData) {
      // Update job as failed
      await supabase
        .from("staging_jobs")
        .update({
          status: "failed",
          error_message: result.error || "Staging failed",
        })
        .eq("id", job.id);

      return NextResponse.json(
        { error: result.error || "Failed to stage image" },
        { status: 500 }
      );
    }

    // Upload staged image to Supabase Storage
    const fileName = `${user.id}/${job.id}-staged.${result.mimeType?.split("/")[1] || "png"}`;
    const imageBuffer = Buffer.from(result.imageData, "base64");

    const { error: uploadError } = await supabase.storage
      .from("staging-images")
      .upload(fileName, imageBuffer, {
        contentType: result.mimeType || "image/png",
        upsert: true,
      });

    if (uploadError) {
      console.error("Upload error:", uploadError);
      // Still return the base64 image even if storage upload fails
    }

    // Get public URL
    const { data: publicUrl } = supabase.storage
      .from("staging-images")
      .getPublicUrl(fileName);

    const stagedImageUrl = uploadError
      ? `data:${result.mimeType};base64,${result.imageData}`
      : publicUrl.publicUrl;

    // Update job as completed
    const { error: updateError } = await supabase
      .from("staging_jobs")
      .update({
        status: "completed",
        staged_image_url: stagedImageUrl,
        completed_at: new Date().toISOString(),
      })
      .eq("id", job.id);

    if (updateError) {
      console.error("Failed to update job status:", updateError);
    }

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
    });
  } catch (error) {
    console.error("Staging API error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}
