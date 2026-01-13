import type { RoomType, FurnitureStyle } from "../constants";
import type {
  StagingResult,
  StagingInput,
  AsyncStagingResult,
  StagingProvider,
  ProviderHealth,
} from "./types";

/**
 * Abstract base class for AI staging providers.
 * Implement this interface to add new providers (Gemini, Stable Diffusion, etc.)
 */
export abstract class BaseStagingProvider {
  /**
   * Unique identifier for this provider
   */
  abstract readonly providerId: StagingProvider;

  /**
   * Human-readable name for display
   */
  abstract readonly displayName: string;

  /**
   * Whether this provider supports synchronous staging (returns result immediately)
   */
  abstract readonly supportsSync: boolean;

  /**
   * Whether this provider supports asynchronous staging (returns job ID, completes via webhook)
   */
  abstract readonly supportsAsync: boolean;

  /**
   * Stage an image synchronously (blocks until complete).
   * Only available if supportsSync is true.
   *
   * @param input - Staging input with image and configuration
   * @returns Staging result with base64 image data
   */
  abstract stageImageSync(input: StagingInput): Promise<StagingResult>;

  /**
   * Start an async staging job (returns immediately with job ID).
   * Only available if supportsAsync is true.
   * Completion will be signaled via webhook.
   *
   * @param input - Staging input with image and configuration
   * @param webhookUrl - URL to call when processing completes
   * @returns Async result with job/prediction ID
   */
  abstract stageImageAsync(
    input: StagingInput,
    webhookUrl: string
  ): Promise<AsyncStagingResult>;

  /**
   * Check the health/availability of this provider.
   *
   * @returns Provider health status including rate limit info
   */
  abstract checkHealth(): Promise<ProviderHealth>;

  /**
   * Build a prompt for staging based on room type and style.
   * Can be overridden by providers that need different prompt formats.
   *
   * @param roomType - Type of room being staged
   * @param furnitureStyle - Desired furniture style
   * @returns Prompt string for the AI model
   */
  abstract buildPrompt(roomType: RoomType, furnitureStyle: FurnitureStyle): string;

  /**
   * Estimate processing time for this provider.
   *
   * @returns Estimated time in seconds
   */
  abstract getEstimatedProcessingTime(): number;
}
