import { ROOM_TYPES, FURNITURE_STYLES, type RoomType, type FurnitureStyle } from "../constants";
import { BaseStagingProvider } from "./base-provider";
import { getControlNetWeights, DEFAULT_CONDITIONING_SCALE } from "../controlnet/weights";
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
 * Stable Diffusion + ControlNet provider using Replicate API.
 * Supports async processing with webhook callbacks.
 */
export class ReplicateProvider extends BaseStagingProvider {
  readonly providerId = "stable-diffusion" as const;
  readonly displayName = "Stable Diffusion + ControlNet";
  readonly supportsSync = false; // SD takes too long for sync
  readonly supportsAsync = true;

  private apiToken: string;
  private baseUrl = "https://api.replicate.com/v1";

  // SDXL with ControlNet model
  private modelVersion = "lucataco/sdxl-controlnet:latest";

  constructor() {
    super();
    this.apiToken = process.env.REPLICATE_API_TOKEN || "";
  }

  async stageImageSync(_input: StagingInput): Promise<StagingResult> {
    // SD + ControlNet is too slow for sync - always use async
    throw new Error(
      "Stable Diffusion provider does not support sync staging. Use stageImageAsync instead."
    );
  }

  async stageImageAsync(
    input: StagingInput,
    webhookUrl: string,
    controlnetInputs?: ControlNetInputs
  ): Promise<AsyncStagingResult> {
    const prompt = this.buildPrompt(input.roomType, input.furnitureStyle);
    const negativePrompt = this.buildNegativePrompt();
    const weights = getControlNetWeights(input.roomType);

    // Prepare the prediction request
    const predictionInput: Record<string, unknown> = {
      prompt,
      negative_prompt: negativePrompt,
      image: `data:${input.mimeType};base64,${input.imageBase64}`,
      num_inference_steps: 30,
      guidance_scale: 7.5,
      controlnet_conditioning_scale: DEFAULT_CONDITIONING_SCALE,
    };

    // Add ControlNet inputs if preprocessing was done
    if (controlnetInputs?.depthMapUrl) {
      predictionInput.depth_image = controlnetInputs.depthMapUrl;
      predictionInput.depth_weight = weights.depth;
    }
    if (controlnetInputs?.cannyEdgeUrl) {
      predictionInput.canny_image = controlnetInputs.cannyEdgeUrl;
      predictionInput.canny_weight = weights.canny;
    }
    if (controlnetInputs?.segmentationUrl) {
      predictionInput.seg_image = controlnetInputs.segmentationUrl;
      predictionInput.seg_weight = weights.segmentation;
    }

    try {
      const prediction = await this.createPrediction(
        this.modelVersion,
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
      console.error("Replicate prediction error:", error);
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
      // Simple health check - get account info
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
    return 30; // SD + ControlNet typically takes 20-45 seconds
  }

  buildPrompt(roomType: RoomType, furnitureStyle: FurnitureStyle): string {
    const roomLabel = this.getRoomLabel(roomType);
    const { label: styleLabel } = this.getStyleDetails(furnitureStyle);
    const furnitureItems = this.getRoomFurnitureList(roomType, styleLabel);

    // SD prompts are different from Gemini - more concise, keyword-focused
    return `Professional real estate photo, ${roomLabel} interior, ${styleLabel} style furniture and decor,
${furnitureItems},
photorealistic, high quality, professional photography, natural lighting,
soft shadows, 8k resolution, architectural photography, interior design magazine quality,
MLS listing photo, staged home, market ready`;
  }

  /**
   * Build negative prompt to prevent common SD issues
   */
  buildNegativePrompt(): string {
    return `blurry, low quality, distorted, warped, bent lines, wrong perspective,
floating objects, unrealistic shadows, cartoon, illustration, painting,
artificial, CGI, rendered, 3D render, video game,
people, pets, animals, faces, hands,
text, watermark, signature, logo,
cluttered, messy, dirty, damaged,
different room, different angle, zoomed, cropped differently,
walls changed, floor changed, ceiling changed, windows moved, doors moved`;
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

  private getRoomFurnitureList(roomType: RoomType, styleLabel: string): string {
    switch (roomType) {
      case "bedroom-master":
      case "bedroom-guest":
      case "bedroom-kids":
        return `${styleLabel} bed with headboard, matching nightstands, soft bedding and pillows, area rug, table lamps, wall art`;

      case "living-room":
        return `${styleLabel} sofa, accent chairs, coffee table, side tables, area rug, floor lamp, wall art, decorative pillows`;

      case "dining-room":
        return `${styleLabel} dining table, dining chairs, chandelier or pendant light, area rug, sideboard, table centerpiece`;

      case "kitchen":
        return `bar stools at counter, decorative fruit bowl, small plants, coordinated accessories`;

      case "home-office":
        return `${styleLabel} desk, ergonomic office chair, bookshelf, desk lamp, wall art, area rug`;

      case "bathroom":
        return `matching towels, bath mat, decorative accessories, small plant, coordinated soap dispenser`;

      case "outdoor-patio":
        return `${styleLabel} outdoor furniture set, potted plants, outdoor rug, decorative cushions, lanterns`;

      default:
        return `${styleLabel} furniture, area rug, wall art, decorative accessories, plants`;
    }
  }
}
