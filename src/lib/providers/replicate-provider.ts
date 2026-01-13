import { ROOM_TYPES, FURNITURE_STYLES, type RoomType, type FurnitureStyle } from "../constants";
import { BaseStagingProvider } from "./base-provider";
import { getRoomRules, getRoomFurniturePrompt, getRoomNegativePrompt, getRoomControlNetWeights } from "../staging/room-rules";
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

  // SDXL img2img model - no mask required
  private model = "stability-ai/sdxl:7762fd07cf82c948538e41f63f77d685e02b063e37e496e96eefd46c929f9bdc";

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
    webhookUrl: string,
    _controlnetInputs?: ControlNetInputs
  ): Promise<AsyncStagingResult> {
    const prompt = this.buildPrompt(input.roomType, input.furnitureStyle);
    const negativePrompt = this.buildNegativePrompt(input.roomType);

    // Prepare the img2img request
    const predictionInput: Record<string, unknown> = {
      prompt,
      negative_prompt: negativePrompt,
      image: `data:${input.mimeType};base64,${input.imageBase64}`,
      // Lower prompt_strength = more preservation of original image
      // 0.8 allows furniture to be added while keeping room structure
      prompt_strength: 0.8,
      num_inference_steps: 30,
      guidance_scale: 7.5,
      scheduler: "K_EULER",
      refine: "expert_ensemble_refiner",
      high_noise_frac: 0.8,
    };

    try {
      const prediction = await this.createPrediction(
        this.model,
        predictionInput,
        webhookUrl
      );

      return {
        jobId: input.jobId || prediction.id,
        predictionId: prediction.id,
        status: "processing",
        estimatedTimeSeconds: this.getEstimatedProcessingTime(),
      };
    } catch (error) {
      console.error("Replicate inpainting error:", error);
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
    return 25; // Inpainting is typically faster than full generation
  }

  /**
   * Build an inpainting-focused prompt with structural preservation constraints.
   * Uses room-specific rules for appropriate furniture selection.
   */
  buildPrompt(roomType: RoomType, furnitureStyle: FurnitureStyle): string {
    const roomLabel = this.getRoomLabel(roomType);
    const { label: styleLabel, description: styleDescription } = this.getStyleDetails(furnitureStyle);
    const rules = getRoomRules(roomType);
    const furnitureList = getRoomFurniturePrompt(roomType, styleLabel);

    // Inpainting-focused prompt with clear constraints
    return `INPAINTING TASK: Add ${styleLabel} style furniture to this empty ${roomLabel}.

PRESERVE EXACTLY: All walls, floors, ceilings, windows, doors, and architectural features.
DO NOT CHANGE: Room dimensions, perspective, camera angle, or lighting direction.

ADD FURNITURE:
${furnitureList}

PLACEMENT RULES:
- ${rules.focalPoint}
- Keep clear: ${rules.clearanceZones.join(", ")}
- Maximum ${rules.maxItems} furniture pieces

STYLE: ${styleLabel} - ${styleDescription}
${rules.promptKeywords.join(", ")}

QUALITY: Professional real estate photography, photorealistic furniture, natural lighting,
accurate shadows matching room lighting, MLS listing ready, interior design magazine quality,
seamless integration with existing room`.trim();
  }

  /**
   * Build negative prompt with room-specific forbidden items and structural preservation.
   */
  buildNegativePrompt(roomType: RoomType): string {
    const roomNegatives = getRoomNegativePrompt(roomType);

    return `${roomNegatives},
changed room layout, altered perspective, modified walls, different floor,
changed ceiling, moved windows, moved doors, room appears larger, room appears smaller,
warped architecture, bent lines, distorted perspective, regenerated room structure,
different camera angle, zoomed in, zoomed out, cropped differently,
blurry, low quality, distorted, cartoon, illustration, painting, CGI, 3D render,
people, pets, animals, faces, hands, text, watermark, signature, logo,
floating objects, unrealistic shadows, wrong lighting direction,
cluttered, messy, overcrowded`.trim();
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
    const body: Record<string, unknown> = {
      version: model,
      input,
    };

    if (webhookUrl) {
      body.webhook = webhookUrl;
      body.webhook_events_filter = ["completed"];
    }

    const response = await fetch(`${this.baseUrl}/predictions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.apiToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Replicate API error: ${response.status} - ${error}`);
    }

    return response.json();
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
