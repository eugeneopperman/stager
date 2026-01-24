/**
 * Staging Processor Service
 * Orchestrates staging operations with different providers
 */

import {
  getProviderRouter,
  getReplicateProvider,
  BaseStagingProvider,
  Decor8Provider,
} from "@/lib/providers";
import type { RoomType, FurnitureStyle } from "@/lib/constants";

/**
 * Parameters for staging a single image
 */
export interface StagingParams {
  imageBase64: string;
  mimeType: string;
  roomType: RoomType;
  furnitureStyle: FurnitureStyle;
  jobId: string;
  declutterFirst?: boolean;
  maskBase64?: string;
}

/**
 * Result of synchronous staging
 */
export interface SyncStagingResult {
  success: boolean;
  imageData?: string;
  mimeType?: string;
  error?: string;
}

/**
 * Result of async staging initiation
 */
export interface AsyncStagingInitResult {
  predictionId: string | undefined;
  estimatedTimeSeconds: number;
}

/**
 * Status of async staging prediction
 */
export interface AsyncStatusResult {
  status: "processing" | "succeeded" | "failed";
  output?: string | string[];
  error?: string;
}

/**
 * Select the best available provider for staging
 */
export async function selectProvider(): Promise<{
  provider: BaseStagingProvider;
  fallbackUsed: boolean;
}> {
  const router = getProviderRouter();
  return router.selectProvider();
}

/**
 * Process synchronous staging with selected provider
 */
export async function processSyncStaging(
  params: StagingParams,
  provider: BaseStagingProvider
): Promise<SyncStagingResult> {
  try {
    let result;

    // If declutterFirst and using Decor8, use the declutter → stage pipeline
    if (params.declutterFirst && provider instanceof Decor8Provider) {
      result = await provider.declutterAndStage({
        imageBase64: params.imageBase64,
        mimeType: params.mimeType,
        roomType: params.roomType,
        furnitureStyle: params.furnitureStyle,
        jobId: params.jobId,
      });
    } else {
      result = await provider.stageImageSync({
        imageBase64: params.imageBase64,
        mimeType: params.mimeType,
        roomType: params.roomType,
        furnitureStyle: params.furnitureStyle,
        jobId: params.jobId,
        maskBase64: params.maskBase64,
      });
    }

    if (!result.success || !result.imageData) {
      return {
        success: false,
        error: result.error || "Staging failed",
      };
    }

    return {
      success: true,
      imageData: result.imageData,
      mimeType: result.mimeType || "image/png",
    };
  } catch (error) {
    console.error("[Processor Service] Sync staging error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Staging failed",
    };
  }
}

/**
 * Start async staging with Replicate
 */
export async function processAsyncStaging(
  params: StagingParams,
  webhookUrl?: string
): Promise<AsyncStagingInitResult> {
  const replicateProvider = getReplicateProvider();

  const asyncResult = await replicateProvider.stageImageAsync(
    {
      imageBase64: params.imageBase64,
      mimeType: params.mimeType,
      roomType: params.roomType,
      furnitureStyle: params.furnitureStyle,
      jobId: params.jobId,
    },
    webhookUrl
  );

  return {
    predictionId: asyncResult.predictionId,
    estimatedTimeSeconds: replicateProvider.getEstimatedProcessingTime(),
  };
}

/**
 * Check the status of an async staging prediction
 */
export async function checkAsyncStatus(
  predictionId: string
): Promise<AsyncStatusResult> {
  const replicateProvider = getReplicateProvider();
  const prediction = await replicateProvider.getPredictionStatus(predictionId);

  return {
    status: prediction.status as "processing" | "succeeded" | "failed",
    output: prediction.output,
    error: prediction.error,
  };
}

/**
 * Extract image URL from async prediction output
 */
export function extractImageUrl(output: string | string[]): string {
  return Array.isArray(output) ? output[0] : output;
}
