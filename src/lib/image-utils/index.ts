/**
 * Preprocessing Pipeline for ControlNet
 *
 * Generates conditioning inputs (depth map, canny edges, segmentation)
 * for Stable Diffusion + ControlNet image generation.
 */

import { createClient } from "@supabase/supabase-js";
import type {
  PreprocessingResult,
  PreprocessingOutputs,
  PreprocessingConfig,
} from "./types";
import { DEFAULT_PREPROCESSING_CONFIG } from "./types";

export * from "./types";

/**
 * Replicate API base URL
 */
const REPLICATE_API_URL = "https://api.replicate.com/v1";

/**
 * Model versions for preprocessing
 */
const PREPROCESSING_MODELS = {
  // MiDaS depth estimation
  depth: "cjwbw/midas:a]6ba5798f04f80d3b314de0f0a62277f21ab3503c60c84d76b51b048bfe186267",
  // HED edge detection (good for architectural lines)
  edges: "cjwbw/hed:2e51fc7c0f1f1fb2c89b3c8ce96bb0f9e8e0f5d3f8f2f5a0c1b2d3e4f5a6b7c8",
};

/**
 * Create a Replicate prediction and wait for result
 */
async function runReplicatePrediction(
  model: string,
  input: Record<string, unknown>,
  apiToken: string,
  maxWaitMs: number = 60000
): Promise<PreprocessingResult> {
  const startTime = Date.now();

  // Create prediction
  const createResponse = await fetch(`${REPLICATE_API_URL}/predictions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      version: model,
      input,
    }),
  });

  if (!createResponse.ok) {
    const error = await createResponse.text();
    return {
      success: false,
      error: `Failed to create prediction: ${error}`,
      processingTimeMs: Date.now() - startTime,
    };
  }

  const prediction = await createResponse.json();
  const predictionId = prediction.id;

  // Poll for completion
  while (Date.now() - startTime < maxWaitMs) {
    const statusResponse = await fetch(
      `${REPLICATE_API_URL}/predictions/${predictionId}`,
      {
        headers: {
          Authorization: `Bearer ${apiToken}`,
        },
      }
    );

    if (!statusResponse.ok) {
      return {
        success: false,
        error: `Failed to get prediction status`,
        processingTimeMs: Date.now() - startTime,
      };
    }

    const status = await statusResponse.json();

    if (status.status === "succeeded" && status.output) {
      // Output is typically a URL to the generated image
      const outputUrl = Array.isArray(status.output) ? status.output[0] : status.output;
      return {
        success: true,
        imageUrl: outputUrl,
        processingTimeMs: Date.now() - startTime,
      };
    }

    if (status.status === "failed" || status.status === "canceled") {
      return {
        success: false,
        error: status.error || `Prediction ${status.status}`,
        processingTimeMs: Date.now() - startTime,
      };
    }

    // Wait before polling again
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }

  return {
    success: false,
    error: "Prediction timed out",
    processingTimeMs: Date.now() - startTime,
  };
}

/**
 * Generate depth map using MiDaS
 */
export async function generateDepthMap(
  imageUrl: string,
  apiToken: string
): Promise<PreprocessingResult> {
  return runReplicatePrediction(
    PREPROCESSING_MODELS.depth,
    { image: imageUrl },
    apiToken
  );
}

/**
 * Generate edge detection using HED
 */
export async function generateCannyEdge(
  imageUrl: string,
  apiToken: string
): Promise<PreprocessingResult> {
  return runReplicatePrediction(
    PREPROCESSING_MODELS.edges,
    { image: imageUrl },
    apiToken
  );
}

/**
 * Generate segmentation map
 * Note: Using a simpler approach for MVP - can be enhanced with SAM later
 */
export async function generateSegmentation(
  _imageUrl: string,
  _apiToken: string
): Promise<PreprocessingResult> {
  // For MVP, skip segmentation and rely on depth + canny
  // Full segmentation can be added with SAM or OneFormer later
  return {
    success: true,
    processingTimeMs: 0,
  };
}

/**
 * Run the full preprocessing pipeline
 */
export async function runPreprocessingPipeline(
  imageUrl: string,
  jobId: string,
  userId: string,
  config: PreprocessingConfig = DEFAULT_PREPROCESSING_CONFIG
): Promise<PreprocessingOutputs> {
  const startTime = Date.now();
  const apiToken = process.env.REPLICATE_API_TOKEN || "";

  if (!apiToken) {
    return {
      totalTimeMs: Date.now() - startTime,
      depthMap: { success: false, error: "REPLICATE_API_TOKEN not configured" },
      cannyEdge: { success: false, error: "REPLICATE_API_TOKEN not configured" },
      segmentation: { success: false, error: "REPLICATE_API_TOKEN not configured" },
    };
  }

  // Run preprocessing in parallel
  const [depthResult, cannyResult, segResult] = await Promise.all([
    config.generateDepthMap
      ? generateDepthMap(imageUrl, apiToken)
      : Promise.resolve<PreprocessingResult>({ success: true, processingTimeMs: 0 }),
    config.generateCannyEdge
      ? generateCannyEdge(imageUrl, apiToken)
      : Promise.resolve<PreprocessingResult>({ success: true, processingTimeMs: 0 }),
    config.generateSegmentation
      ? generateSegmentation(imageUrl, apiToken)
      : Promise.resolve<PreprocessingResult>({ success: true, processingTimeMs: 0 }),
  ]);

  // Upload results to Supabase Storage if configured
  if (config.uploadToStorage) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (supabaseUrl && supabaseServiceKey) {
      const supabase = createClient(supabaseUrl, supabaseServiceKey);

      // Upload each successful result
      const uploadPromises: Promise<void>[] = [];

      if (depthResult.success && depthResult.imageUrl) {
        uploadPromises.push(
          uploadPreprocessingResult(
            supabase,
            depthResult.imageUrl,
            userId,
            jobId,
            "depth"
          ).then((url) => {
            if (url) depthResult.imageUrl = url;
          })
        );
      }

      if (cannyResult.success && cannyResult.imageUrl) {
        uploadPromises.push(
          uploadPreprocessingResult(
            supabase,
            cannyResult.imageUrl,
            userId,
            jobId,
            "canny"
          ).then((url) => {
            if (url) cannyResult.imageUrl = url;
          })
        );
      }

      await Promise.all(uploadPromises);
    }
  }

  return {
    depthMap: depthResult,
    cannyEdge: cannyResult,
    segmentation: segResult,
    totalTimeMs: Date.now() - startTime,
  };
}

/**
 * Upload preprocessing result to Supabase Storage
 */
async function uploadPreprocessingResult(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: any,
  imageUrl: string,
  userId: string,
  jobId: string,
  type: "depth" | "canny" | "seg"
): Promise<string | null> {
  try {
    // Download the image
    const response = await fetch(imageUrl);
    if (!response.ok) return null;

    const buffer = await response.arrayBuffer();
    const mimeType = response.headers.get("content-type") || "image/png";
    const ext = mimeType.split("/")[1] || "png";

    // Upload to controlnet-inputs bucket
    const fileName = `${userId}/${jobId}-${type}.${ext}`;
    const { error } = await supabase.storage
      .from("controlnet-inputs")
      .upload(fileName, buffer, {
        contentType: mimeType,
        upsert: true,
      });

    if (error) {
      console.error(`Failed to upload ${type} result:`, error);
      return null;
    }

    // Get public URL
    const { data } = supabase.storage.from("controlnet-inputs").getPublicUrl(fileName);
    return data.publicUrl;
  } catch (error) {
    console.error(`Error uploading ${type} result:`, error);
    return null;
  }
}
