/**
 * Types for the preprocessing pipeline
 */

/**
 * Result from a preprocessing operation
 */
export interface PreprocessingResult {
  success: boolean;
  imageUrl?: string; // URL to the processed image
  imageData?: string; // Base64 encoded image data
  mimeType?: string;
  error?: string;
  processingTimeMs?: number;
}

/**
 * All preprocessing outputs for a single image
 */
export interface PreprocessingOutputs {
  depthMap?: PreprocessingResult;
  cannyEdge?: PreprocessingResult;
  segmentation?: PreprocessingResult;
  totalTimeMs: number;
}

/**
 * Configuration for preprocessing operations
 */
export interface PreprocessingConfig {
  generateDepthMap: boolean;
  generateCannyEdge: boolean;
  generateSegmentation: boolean;
  uploadToStorage: boolean; // Whether to upload results to Supabase Storage
}

/**
 * Default preprocessing configuration
 */
export const DEFAULT_PREPROCESSING_CONFIG: PreprocessingConfig = {
  generateDepthMap: true,
  generateCannyEdge: true,
  generateSegmentation: true,
  uploadToStorage: true,
};
