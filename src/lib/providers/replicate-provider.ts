import { ROOM_TYPES, FURNITURE_STYLES, type RoomType, type FurnitureStyle } from "../constants";
import { BaseStagingProvider } from "./base-provider";
import { getRoomFurniturePrompt, getRoomNegativePrompt } from "../staging/room-rules";
import type {
  StagingResult,
  StagingInput,
  AsyncStagingResult,
  ProviderHealth,
  ControlNetInputs,
} from "./types";

/**
 * Replicate API response types
 */
interface ReplicatePrediction {
  id: string;
  status: "starting" | "processing" | "succeeded" | "failed" | "canceled";
  output?: string[];
  error?: string;
  urls?: {
    get: string;
    cancel: string;
  };
}

/**
 * Stable Diffusion provider using Replicate API.
 * Uses SDXL img2img model to add furniture while preserving room structure.
 */
export class ReplicateProvider extends BaseStagingProvider {
  readonly providerId = "stable-diffusion" as const;
  readonly displayName = "Stable Diffusion SDXL";
  readonly supportsSync = false;
  readonly supportsAsync = true;

  private apiToken: string;
  private baseUrl = "https://api.replicate.com/v1";

  // Interior Design SDXL model - bundles RealVisXL V5.0, Depth ControlNet, ProMax ControlNet, and SDXL Refiner
  private model = "rocketdigitalai/interior-design-sdxl:a3c091059a25590ce2d5ea13651fab63f447f21760e50c358d4b850e844f59ee";

  constructor() {
    super();
    this.apiToken = process.env.REPLICATE_API_TOKEN || "";
  }

  async stageImageSync(_input: StagingInput): Promise<StagingResult> {
    throw new Error(
      "Stable Diffusion provider does not support sync staging. Use stageImageAsync instead."
    );
  }

  async stageImageAsync(
    input: StagingInput,
    webhookUrl?: string,
    _controlnetInputs?: ControlNetInputs
  ): Promise<AsyncStagingResult> {
    const prompt = this.buildPrompt(input.roomType, input.furnitureStyle);
    const negativePrompt = this.buildNegativePrompt(input.roomType);

    // Use URL if available, otherwise use base64 data URL
    const imageSource = input.imageUrl || `data:${input.mimeType};base64,${input.imageBase64}`;
    console.log("[ReplicateProvider] Image source type:", input.imageUrl ? "URL" : "base64");
    console.log("[ReplicateProvider] Image source:", imageSource.substring(0, 100) + "...");

    // Prepare the interior design model request
    // This model uses RealVisXL V5.0 base with Depth ControlNet and ProMax ControlNet
    // Using model defaults which worked well in v1.033
    const predictionInput: Record<string, unknown> = {
      image: imageSource,
      prompt,
      negative_prompt: negativePrompt,
      depth_strength: 0.8,      // Model default - good structure preservation
      promax_strength: 0.8,     // Model default - preserves architectural lines
      guidance_scale: 7.5,      // Model default
      num_inference_steps: 50,
      refiner_strength: 0.4,    // Model default
    };

    console.log("[ReplicateProvider] Creating prediction with prompt:", prompt.substring(0, 100) + "...");

    try {
      const prediction = await this.createPrediction(
        this.model,
        predictionInput,
        webhookUrl
      );

      console.log("[ReplicateProvider] Prediction created:", prediction.id);
      return {
        jobId: input.jobId || prediction.id,
        predictionId: prediction.id,
        status: "processing",
        estimatedTimeSeconds: this.getEstimatedProcessingTime(),
      };
    } catch (error) {
      console.error("[ReplicateProvider] Error creating prediction:", error);
      throw error;
    }
  }

  async checkHealth(): Promise<ProviderHealth> {
    if (!this.apiToken) {
      return {
        provider: this.providerId,
        available: false,
        rateLimited: false,
        errorMessage: "REPLICATE_API_TOKEN not configured",
      };
    }

    try {
      const response = await fetch(`${this.baseUrl}/account`, {
        headers: {
          Authorization: `Bearer ${this.apiToken}`,
        },
      });

      if (response.status === 429) {
        const retryAfter = response.headers.get("Retry-After");
        return {
          provider: this.providerId,
          available: false,
          rateLimited: true,
          resetAt: retryAfter
            ? new Date(Date.now() + parseInt(retryAfter) * 1000)
            : undefined,
          errorMessage: "Rate limited",
        };
      }

      return {
        provider: this.providerId,
        available: response.ok,
        rateLimited: false,
        errorMessage: response.ok ? undefined : `HTTP ${response.status}`,
      };
    } catch (error) {
      return {
        provider: this.providerId,
        available: false,
        rateLimited: false,
        errorMessage: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  getEstimatedProcessingTime(): number {
    return 90; // Interior design model with ControlNet takes ~86 seconds
  }

  /**
   * Build a prompt optimized for the interior design model.
   * Simple, clean prompt that worked well in v1.033.
   */
  buildPrompt(roomType: RoomType, furnitureStyle: FurnitureStyle): string {
    const roomLabel = this.getRoomLabel(roomType);
    const { label: styleLabel } = this.getStyleDetails(furnitureStyle);
    const furnitureList = getRoomFurniturePrompt(roomType, styleLabel);

    // Simple prompt - let the model's ControlNet handle structure preservation
    return `${styleLabel} style ${roomLabel} interior design with ${furnitureList}, masterfully designed, photorealistic, professional real estate photography, 8k, highly detailed, natural lighting, magazine quality`.trim();
  }

  /**
   * Build negative prompt with room-specific forbidden items.
   * Simple version that worked well in v1.033.
   */
  buildNegativePrompt(roomType: RoomType): string {
    const roomNegatives = getRoomNegativePrompt(roomType);

    // Simple negative prompt - quality issues and wrong items
    return `${roomNegatives}, blurry, low quality, distorted, cartoon, illustration, CGI, 3D render, people, pets, text, watermark, cluttered, messy, overcrowded, floating objects`.trim();
  }

  /**
   * Get prediction status from Replicate
   */
  async getPredictionStatus(predictionId: string): Promise<ReplicatePrediction> {
    const response = await fetch(`${this.baseUrl}/predictions/${predictionId}`, {
      headers: {
        Authorization: `Bearer ${this.apiToken}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to get prediction status: ${response.status}`);
    }

    return response.json();
  }

  /**
   * Cancel a running prediction
   */
  async cancelPrediction(predictionId: string): Promise<void> {
    await fetch(`${this.baseUrl}/predictions/${predictionId}/cancel`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.apiToken}`,
      },
    });
  }

  // Private helper methods

  private async createPrediction(
    model: string,
    input: Record<string, unknown>,
    webhookUrl?: string
  ): Promise<ReplicatePrediction> {
    // Extract version hash if model is in "owner/name:version" format
    const version = model.includes(":") ? model.split(":")[1] : model;

    // Build body WITHOUT webhook first
    const body: Record<string, unknown> = {
      version,
      input,
    };

    // Only add webhook if it's a valid HTTPS URL (very strict check)
    if (webhookUrl &&
        typeof webhookUrl === "string" &&
        webhookUrl.trim().length > 15 &&
        webhookUrl.startsWith("https://") &&
        !webhookUrl.includes(" ") &&
        !webhookUrl.includes("\n")) {
      body.webhook = webhookUrl;
      body.webhook_events_filter = ["completed"];
      console.log("[ReplicateProvider] Webhook ENABLED:", webhookUrl);
    } else {
      // Explicitly ensure no webhook in body
      delete body.webhook;
      delete body.webhook_events_filter;
      console.log("[ReplicateProvider] Webhook DISABLED - no valid URL provided");
    }

    console.log("[ReplicateProvider] Creating prediction - version:", version, "body keys:", Object.keys(body), "has webhook:", "webhook" in body);

    const response = await fetch(`${this.baseUrl}/predictions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.apiToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    const responseText = await response.text();
    console.log("[ReplicateProvider] Response status:", response.status);
    console.log("[ReplicateProvider] Response body:", responseText.substring(0, 500));

    if (!response.ok) {
      throw new Error(`Replicate API error: ${response.status} - ${responseText}`);
    }

    return JSON.parse(responseText);
  }

  private getRoomLabel(roomId: RoomType): string {
    const room = ROOM_TYPES.find((r) => r.id === roomId);
    return room?.label || roomId;
  }

  private getStyleDetails(styleId: FurnitureStyle): { label: string; description: string } {
    const style = FURNITURE_STYLES.find((s) => s.id === styleId);
    return {
      label: style?.label || styleId,
      description: style?.description || "",
    };
  }
}
