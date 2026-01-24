/**
 * Staging Storage Service
 * Handles image upload/download operations for staging
 */

import { createClient } from "@/lib/supabase/server";

const STORAGE_BUCKET = "staging-images";

/**
 * Result of an upload operation
 */
export interface UploadResult {
  success: boolean;
  url: string;
  error?: string;
}

/**
 * Upload an original image to storage
 * Returns a signed URL or public URL for the uploaded image
 */
export async function uploadOriginalImage(
  imageBase64: string,
  mimeType: string,
  userId: string,
  jobId: string
): Promise<UploadResult> {
  const supabase = await createClient();

  const extension = mimeType.split("/")[1] || "png";
  const fileName = `${userId}/${jobId}-original.${extension}`;
  const imageBuffer = Buffer.from(imageBase64, "base64");

  const { error: uploadError } = await supabase.storage
    .from(STORAGE_BUCKET)
    .upload(fileName, imageBuffer, {
      contentType: mimeType,
      upsert: true,
    });

  if (uploadError) {
    console.error("[Storage Service] Original upload error:", uploadError);
    // Return a data URL fallback
    return {
      success: false,
      url: `data:${mimeType};base64,${imageBase64.substring(0, 100)}...`,
      error: uploadError.message,
    };
  }

  // Try to get a signed URL first
  const { data: signedUrlData } = await supabase.storage
    .from(STORAGE_BUCKET)
    .createSignedUrl(fileName, 3600);

  if (signedUrlData?.signedUrl) {
    return { success: true, url: signedUrlData.signedUrl };
  }

  // Fall back to public URL
  const { data: publicUrl } = supabase.storage
    .from(STORAGE_BUCKET)
    .getPublicUrl(fileName);

  return { success: true, url: publicUrl.publicUrl };
}

/**
 * Upload a staged image from base64 data
 */
export async function uploadStagedImage(
  imageBase64: string,
  mimeType: string,
  userId: string,
  jobId: string
): Promise<UploadResult> {
  const supabase = await createClient();

  const extension = mimeType.split("/")[1] || "png";
  const fileName = `${userId}/${jobId}-staged.${extension}`;
  const imageBuffer = Buffer.from(imageBase64, "base64");

  const { error: uploadError } = await supabase.storage
    .from(STORAGE_BUCKET)
    .upload(fileName, imageBuffer, {
      contentType: mimeType,
      upsert: true,
    });

  if (uploadError) {
    console.error("[Storage Service] Staged upload error:", uploadError);
    return {
      success: false,
      url: `data:${mimeType};base64,${imageBase64}`,
      error: uploadError.message,
    };
  }

  const { data: publicUrl } = supabase.storage
    .from(STORAGE_BUCKET)
    .getPublicUrl(fileName);

  return { success: true, url: publicUrl.publicUrl };
}

/**
 * Download an image from an external URL and upload to storage
 * Used for async provider results (e.g., Replicate)
 */
export async function downloadAndUploadImage(
  externalUrl: string,
  userId: string,
  jobId: string
): Promise<UploadResult> {
  const supabase = await createClient();

  try {
    const response = await fetch(externalUrl);
    if (!response.ok) {
      return {
        success: false,
        url: externalUrl,
        error: `Failed to download: ${response.status}`,
      };
    }

    const imageBuffer = await response.arrayBuffer();
    const mimeType = response.headers.get("content-type") || "image/png";
    const extension = mimeType.split("/")[1] || "png";
    const fileName = `${userId}/${jobId}-staged.${extension}`;

    const { error: uploadError } = await supabase.storage
      .from(STORAGE_BUCKET)
      .upload(fileName, imageBuffer, {
        contentType: mimeType,
        upsert: true,
      });

    if (uploadError) {
      console.error("[Storage Service] Download upload error:", uploadError);
      return { success: false, url: externalUrl, error: uploadError.message };
    }

    const { data: publicUrl } = supabase.storage
      .from(STORAGE_BUCKET)
      .getPublicUrl(fileName);

    return { success: true, url: publicUrl.publicUrl };
  } catch (error) {
    console.error("[Storage Service] Download error:", error);
    return {
      success: false,
      url: externalUrl,
      error: error instanceof Error ? error.message : "Download failed",
    };
  }
}
