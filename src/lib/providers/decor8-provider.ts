import { ROOM_TYPES, FURNITURE_STYLES, type RoomType, type FurnitureStyle } from "../constants";
import { BaseStagingProvider } from "./base-provider";
import type {
  StagingResult,
  StagingInput,
  AsyncStagingResult,
  ProviderHealth,
} from "./types";

/**
 * Decor8 AI API response types
 */
interface Decor8Response {
  error: string;
  message: string;
  info?: {
    images: Array<{
      uuid: string;
      url: string;
      width: number;
      height: number;
      captions?: string[];
    }>;
    mask_info?: string;
  };
}

/**
 * Decor8 AI provider for virtual staging.
 * Uses proven virtual staging API with excellent structure preservation.
 * Cost: ~$0.20 per image
 */
export class Decor8Provider extends BaseStagingProvider {
  readonly providerId = "decor8" as const;
  readonly displayName = "Decor8 AI";
  readonly supportsSync = true;  // Decor8 returns results synchronously
  readonly supportsAsync = false;

  private apiKey: string;
  private baseUrl = "https://api.decor8.ai";

  constructor() {
    super();
    this.apiKey = process.env.DECOR8_API_KEY || "";
  }

  async stageImageSync(input: StagingInput): Promise<StagingResult> {
    const roomType = this.mapRoomType(input.roomType);
    const designStyle = this.mapDesignStyle(input.furnitureStyle);
    const roomLabel = ROOM_TYPES.find(r => r.id === input.roomType)?.label || input.roomType;
    const styleLabel = FURNITURE_STYLES.find(s => s.id === input.furnitureStyle)?.label || input.furnitureStyle;

    // Decor8 needs a URL - we'll use base64 data URL
    const imageUrl = input.imageUrl || `data:${input.mimeType};base64,${input.imageBase64}`;

    console.log("[Decor8Provider] Staging room:", roomType, "style:", designStyle);

    // Custom prompt emphasizing furniture addition only
    const customPrompt = `Add ${styleLabel} style furniture to this empty ${roomLabel}. Professional real estate virtual staging. Only add furniture and decor, preserve all existing room features.`;

    // Negative prompt to prevent structural changes
    const negativePrompt = "changing walls, changing floor, changing ceiling, changing windows, changing doors, removing windows, removing doors, altering room structure, construction, renovation, different wall color, different flooring";

    try {
      const response = await fetch(`${this.baseUrl}/generate_designs_for_room`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          input_image_url: imageUrl,
          room_type: roomType,
          design_style: designStyle,
          num_images: 1,
          keep_original_dimensions: true,
          prompt: customPrompt,
          negative_prompt: negativePrompt,
          guidance_scale: 7.5,  // Default, balanced
          num_inference_steps: 50,  // Higher quality
        }),
      });

      const responseText = await response.text();
      console.log("[Decor8Provider] Response status:", response.status);

      if (!response.ok) {
        console.error("[Decor8Provider] Error response:", responseText);
        return {
          success: false,
          error: `Decor8 API error: ${response.status} - ${responseText}`,
        };
      }

      const data: Decor8Response = JSON.parse(responseText);

      if (data.error || !data.info?.images?.length) {
        console.error("[Decor8Provider] API returned error:", data.error || "No images generated");
        return {
          success: false,
          error: data.error || "No images generated",
        };
      }

      const generatedImage = data.info.images[0];
      console.log("[Decor8Provider] Generated image:", generatedImage.url);

      // Fetch the generated image and convert to base64
      const imageResponse = await fetch(generatedImage.url);
      const imageBuffer = await imageResponse.arrayBuffer();
      const imageBase64 = Buffer.from(imageBuffer).toString("base64");

      // Determine mime type from URL or default to png
      const mimeType = generatedImage.url.includes(".jpg") || generatedImage.url.includes(".jpeg")
        ? "image/jpeg"
        : "image/png";

      return {
        success: true,
        imageData: imageBase64,
        mimeType,
      };
    } catch (error) {
      console.error("[Decor8Provider] Exception:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  async stageImageAsync(
    _input: StagingInput,
    _webhookUrl?: string
  ): Promise<AsyncStagingResult> {
    throw new Error(
      "Decor8 provider does not support async staging. Use stageImageSync instead."
    );
  }

  async checkHealth(): Promise<ProviderHealth> {
    if (!this.apiKey) {
      return {
        provider: this.providerId,
        available: false,
        rateLimited: false,
        errorMessage: "DECOR8_API_KEY not configured",
      };
    }

    try {
      // Test endpoint to verify API key
      const response = await fetch(`${this.baseUrl}/speak_friend_and_enter`, {
        headers: {
          "Authorization": `Bearer ${this.apiKey}`,
        },
      });

      if (response.status === 429) {
        return {
          provider: this.providerId,
          available: false,
          rateLimited: true,
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
    return 15; // Decor8 typically takes 10-20 seconds
  }

  buildPrompt(roomType: RoomType, furnitureStyle: FurnitureStyle): string {
    // Decor8 uses room_type and design_style instead of prompts
    const roomLabel = ROOM_TYPES.find(r => r.id === roomType)?.label || roomType;
    const styleLabel = FURNITURE_STYLES.find(s => s.id === furnitureStyle)?.label || furnitureStyle;
    return `${styleLabel} ${roomLabel}`;
  }

  /**
   * Map our room types to Decor8 room types
   */
  private mapRoomType(roomType: RoomType): string {
    const mapping: Record<RoomType, string> = {
      "living-room": "livingroom",
      "bedroom-master": "bedroom",
      "bedroom-guest": "bedroom",
      "bedroom-kids": "kidsroom",
      "dining-room": "diningroom",
      "kitchen": "kitchen",
      "home-office": "homeoffice",
      "bathroom": "bathroom",
      "outdoor-patio": "patio",
    };
    return mapping[roomType] || "livingroom";
  }

  /**
   * Map our furniture styles to Decor8 design styles
   */
  private mapDesignStyle(style: FurnitureStyle): string {
    const mapping: Record<FurnitureStyle, string> = {
      "modern": "modern",
      "traditional": "traditional",
      "minimalist": "minimalist",
      "mid-century": "midcenturymodern",
      "scandinavian": "scandinavian",
      "industrial": "industrial",
      "coastal": "coastal",
      "farmhouse": "farmhouse",
      "luxury": "luxemodern",
    };
    return mapping[style] || "modern";
  }
}
