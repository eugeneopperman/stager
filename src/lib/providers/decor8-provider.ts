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
    const maskUrl = input.maskBase64 ? `data:image/png;base64,${input.maskBase64}` : undefined;

    console.log("[Decor8Provider] Staging room:", roomType, "style:", designStyle, "mask:", maskUrl ? "yes" : "no");

    // Custom prompt emphasizing furniture addition only - explicitly mention keeping windows
    const customPrompt = `Add ${styleLabel} style furniture to this empty ${roomLabel}. Professional real estate virtual staging. Only add furniture and decor. Keep all windows exactly as they are. Preserve all existing architectural features including windows, doors, walls, flooring.`;

    // Negative prompt to prevent structural changes - emphasize window preservation
    const negativePrompt = "removing windows, covering windows, blocking windows, no windows, window removed, changing windows, removing doors, changing walls, changing floor, changing ceiling, altering room structure, construction, renovation, different wall color, different flooring, boarded up windows";

    // Build request body
    const requestBody: Record<string, unknown> = {
      input_image_url: imageUrl,
      room_type: roomType,
      design_style: designStyle,
      num_images: 1,
      keep_original_dimensions: true,
      prompt: customPrompt,
      negative_prompt: negativePrompt,
      guidance_scale: 7.5,  // Default, balanced
      num_inference_steps: 50,  // Higher quality
    };

    // Add mask for inpainting if provided
    // White areas = stage with furniture, Black areas = preserve original
    if (maskUrl) {
      requestBody.mask_info = maskUrl;
      console.log("[Decor8Provider] Using mask for selective inpainting");
    }

    try {
      const response = await fetch(`${this.baseUrl}/generate_designs_for_room`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify(requestBody),
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
   * Remove objects/furniture from a room image (declutter)
   * Useful for staging already-furnished rooms
   */
  async declutterRoom(input: StagingInput): Promise<StagingResult> {
    const imageUrl = input.imageUrl || `data:${input.mimeType};base64,${input.imageBase64}`;

    console.log("[Decor8Provider] Decluttering room...");
    console.log("[Decor8Provider] Image URL length:", imageUrl.length, "starts with:", imageUrl.substring(0, 50));

    try {
      // Decor8 remove_objects_from_room parameters:
      // - input_image_url: The image to process
      // - objects_to_remove: Optional array of object types to remove
      // If no objects specified, it should auto-detect and remove furniture
      const requestBody = {
        input_image_url: imageUrl,
        // Specify common furniture types to ensure removal
        objects_to_remove: [
          "furniture",
          "sofa",
          "couch",
          "chair",
          "table",
          "bed",
          "desk",
          "cabinet",
          "shelf",
          "lamp",
          "rug",
          "curtain",
          "plant",
          "decoration"
        ],
      };

      console.log("[Decor8Provider] Declutter request body keys:", Object.keys(requestBody));

      const response = await fetch(`${this.baseUrl}/remove_objects_from_room`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify(requestBody),
      });

      const responseText = await response.text();
      console.log("[Decor8Provider] Declutter response status:", response.status);

      if (!response.ok) {
        console.error("[Decor8Provider] Declutter error:", responseText);
        return {
          success: false,
          error: `Decor8 declutter error: ${response.status} - ${responseText}`,
        };
      }

      // Log full response to understand structure
      console.log("[Decor8Provider] Declutter FULL response:", responseText.substring(0, 2000));

      // Parse response - structure may vary by endpoint
      const data = JSON.parse(responseText) as Record<string, unknown>;

      // Check for error
      if (data.error) {
        console.error("[Decor8Provider] Declutter API error:", data.error);
        return {
          success: false,
          error: String(data.error),
        };
      }

      // Try to find the output image in various possible locations
      let outputImageUrl: string | null = null;

      // Check info.images (standard staging response format)
      const info = data.info as { images?: Array<{ url: string; width?: number; height?: number }> } | undefined;
      if (info?.images?.length) {
        outputImageUrl = info.images[0].url;
        console.log("[Decor8Provider] Found image in info.images");
      }

      // Check for direct image_url field
      if (!outputImageUrl && typeof data.image_url === "string") {
        outputImageUrl = data.image_url;
        console.log("[Decor8Provider] Found image in image_url field");
      }

      // Check for output_image_url field
      if (!outputImageUrl && typeof data.output_image_url === "string") {
        outputImageUrl = data.output_image_url;
        console.log("[Decor8Provider] Found image in output_image_url field");
      }

      // Check for images array at root level
      const rootImages = data.images as Array<{ url?: string }> | undefined;
      if (!outputImageUrl && rootImages?.length && rootImages[0].url) {
        outputImageUrl = rootImages[0].url;
        console.log("[Decor8Provider] Found image in root images array");
      }

      if (!outputImageUrl) {
        console.error("[Decor8Provider] Could not find output image in response. Keys:", Object.keys(data));
        return {
          success: false,
          error: "No decluttered image in response",
        };
      }

      console.log("[Decor8Provider] Decluttered image URL:", outputImageUrl);
      console.log("[Decor8Provider] Input was data URL:", imageUrl.startsWith("data:"));

      // Fetch and convert to base64
      const imageResponse = await fetch(outputImageUrl);
      const imageBuffer = await imageResponse.arrayBuffer();
      const imageBase64 = Buffer.from(imageBuffer).toString("base64");

      const mimeType = outputImageUrl.includes(".jpg") || outputImageUrl.includes(".jpeg")
        ? "image/jpeg"
        : "image/png";

      return {
        success: true,
        imageData: imageBase64,
        mimeType,
      };
    } catch (error) {
      console.error("[Decor8Provider] Declutter exception:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  /**
   * Declutter a room then stage it - full pipeline for furnished rooms
   */
  async declutterAndStage(input: StagingInput): Promise<StagingResult> {
    console.log("[Decor8Provider] Starting declutter → stage pipeline");

    // Step 1: Declutter
    const declutterResult = await this.declutterRoom(input);
    if (!declutterResult.success || !declutterResult.imageData) {
      return {
        success: false,
        error: `Declutter failed: ${declutterResult.error}`,
      };
    }

    console.log("[Decor8Provider] Declutter complete, now staging...");

    // Step 2: Stage the decluttered image
    const stageInput: StagingInput = {
      ...input,
      imageBase64: declutterResult.imageData,
      mimeType: declutterResult.mimeType || "image/png",
      imageUrl: undefined, // Use the base64 from declutter
    };

    return this.stageImageSync(stageInput);
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
