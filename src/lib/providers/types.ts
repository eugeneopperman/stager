import type { RoomType, FurnitureStyle } from "../constants";

/**
 * Supported AI providers for virtual staging
 */
export type StagingProvider = "gemini" | "stable-diffusion" | "decor8";

/**
 * Job status for async processing flow
 */
export type StagingStatus =
  | "pending"
  | "queued"
  | "preprocessing"
  | "processing"
  | "uploading"
  | "completed"
  | "failed";

/**
 * Result from a staging operation
 */
export interface StagingResult {
  success: boolean;
  imageData?: string; // Base64 encoded image
  mimeType?: string;
  error?: string;
  provider?: StagingProvider;
  processingTimeMs?: number;
}

/**
 * Input for staging a room image
 */
export interface StagingInput {
  imageBase64: string;
  imageUrl?: string; // Public URL of the uploaded image (for async providers)
  mimeType: string;
  roomType: RoomType;
  furnitureStyle: FurnitureStyle;
  jobId?: string;
}

/**
 * Async staging result for providers that return immediately
 */
export interface AsyncStagingResult {
  jobId: string;
  predictionId?: string; // Replicate prediction ID
  status: StagingStatus;
  estimatedTimeSeconds?: number;
}

/**
 * ControlNet conditioning inputs
 */
export interface ControlNetInputs {
  depthMapUrl?: string;
  cannyEdgeUrl?: string;
  segmentationUrl?: string;
}

/**
 * ControlNet weight configuration
 */
export interface ControlNetWeights {
  depth: number;
  canny: number;
  segmentation: number;
}

/**
 * Generation parameters stored with each job
 */
export interface GenerationParams {
  prompt: string;
  negativePrompt?: string;
  controlnetWeights?: ControlNetWeights;
  seed?: number;
  steps?: number;
  guidanceScale?: number;
}

/**
 * Provider health status
 */
export interface ProviderHealth {
  provider: StagingProvider;
  available: boolean;
  rateLimited: boolean;
  resetAt?: Date;
  errorMessage?: string;
}

/**
 * Configuration for provider selection
 */
export interface ProviderConfig {
  defaultProvider: StagingProvider;
  enableFallback: boolean;
  fallbackProvider: StagingProvider;
}
