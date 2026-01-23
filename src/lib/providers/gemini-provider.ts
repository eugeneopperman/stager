import { GoogleGenerativeAI } from "@google/generative-ai";
import { ROOM_TYPES, FURNITURE_STYLES, type RoomType, type FurnitureStyle } from "../constants";
import { BaseStagingProvider } from "./base-provider";
import type {
  StagingResult,
  StagingInput,
  AsyncStagingResult,
  ProviderHealth,
} from "./types";

/**
 * Gemini AI provider for virtual staging.
 * Uses Google's Gemini 3 Pro Image model for image generation/editing.
 */
export class GeminiProvider extends BaseStagingProvider {
  readonly providerId = "gemini" as const;
  readonly displayName = "Google Gemini";
  readonly supportsSync = true;
  readonly supportsAsync = false;

  private genAI: GoogleGenerativeAI;
  private model: ReturnType<GoogleGenerativeAI["getGenerativeModel"]>;

  constructor() {
    super();
    this.genAI = new GoogleGenerativeAI(process.env.GOOGLE_GEMINI_API_KEY || "");
    this.model = this.genAI.getGenerativeModel({
      model: "gemini-3-pro-image-preview",
      generationConfig: {
        // @ts-expect-error - responseModalities is valid for image generation
        responseModalities: ["image", "text"],
      },
    });
  }

  async stageImageSync(input: StagingInput): Promise<StagingResult> {
    const startTime = Date.now();

    const prompt = this.buildPrompt(input.roomType, input.furnitureStyle);

    // Try with image generation model first
    try {
      const result = await this.attemptStaging(input.imageBase64, input.mimeType, prompt);

      if (result.success) {
        return {
          ...result,
          provider: this.providerId,
          processingTimeMs: Date.now() - startTime,
        };
      }
    } catch (error) {
      console.error("[GeminiProvider] Gemini image model error:", error);
    }

    // Return error if staging failed
    const errorMessage = "Image generation is not available. The AI analyzed your image but could not generate a staged version.";
    return {
      success: false,
      error: errorMessage,
      provider: this.providerId,
      processingTimeMs: Date.now() - startTime,
    };
  }

  async stageImageAsync(
    _input: StagingInput,
    _webhookUrl: string
  ): Promise<AsyncStagingResult> {
    throw new Error("Gemini provider does not support async staging");
  }

  async checkHealth(): Promise<ProviderHealth> {
    // Gemini doesn't have a dedicated health endpoint
    // We assume it's available if API key is configured
    const hasApiKey = !!process.env.GOOGLE_GEMINI_API_KEY;
    return {
      provider: this.providerId,
      available: hasApiKey,
      rateLimited: false,
      errorMessage: hasApiKey ? undefined : "GOOGLE_GEMINI_API_KEY not configured",
    };
  }

  getEstimatedProcessingTime(): number {
    return 10; // Gemini typically takes 5-15 seconds
  }

  buildPrompt(roomType: RoomType, furnitureStyle: FurnitureStyle): string {
    const roomLabel = this.getRoomLabel(roomType);
    const { label: styleLabel, description: styleDescription } = this.getStyleDetails(furnitureStyle);
    const roomItems = this.getRoomSpecificItems(roomType, styleLabel);

    return `You are performing a LOCAL IMAGE EDIT using INPAINTING ONLY.

You are NOT generating a new image.
You are NOT re-imagining the room.
You are editing a FIXED background photograph.

The input image is a professionally photographed, EMPTY ${roomLabel}.
The camera position, lens, perspective, vanishing points, and framing are LOCKED.

Any change to camera angle, zoom, crop, or perspective is a FAILURE.

---

TASK:
Realistically stage this EMPTY ${roomLabel} by ADDING furniture and decor ONLY.

---

ABSOLUTE IMMUTABLE CONSTRAINTS — MUST NOT CHANGE:
- Camera angle, camera height, lens perspective, focal length, or field of view
- Image framing, crop, resolution, or aspect ratio
- Vanishing points or vertical/horizontal line alignment
- Walls, wall color, wall texture, or wall condition
- Flooring, carpet, floor material, or floor color
- Ceiling shape, height, color, or texture
- Windows, doors, trim, baseboards, vents, or architectural features
- Existing lighting direction, brightness, color temperature, or shadow behavior

DO NOT remove, resize, repaint, reposition, reinterpret, or regenerate any existing pixels outside the edited areas.

---

EDITING SCOPE (CRITICAL):
Only modify pixels where new furniture or decor is placed.
All unedited areas must remain pixel-identical to the original photo.

If furniture cannot be added without altering perspective or geometry, DO NOT ADD IT.

---

STYLE REQUIREMENTS:
Stage the room in a ${styleLabel} style (${styleDescription}).

Favor neutral, market-friendly interpretations of this style.
The result should appeal to the broadest range of home buyers.

---

ONLY ADD THE FOLLOWING:
${roomItems}

DO NOT add people, pets, electronics, clutter, or personal items.

---

ROOM LOGIC & SPACING:
- Furniture layout must reflect how a real ${roomLabel} is used
- Maintain clear walkways and functional spacing
- Do not block doors, windows, vents, or architectural features
- Preserve negative space; do not overcrowd the room

---

REALISM REQUIREMENTS:
- All added objects must be photorealistic and indistinguishable from the original photograph
- Materials, textures, reflections, and shadows must match the existing lighting exactly
- Shadows must fall in the same direction and intensity as the original image
- No floating objects, warped geometry, or perspective distortion
- No illustrated, stylized, or CGI appearance

---

FAIL THE TASK IF ANY OF THE FOLLOWING OCCUR:
- Camera angle, zoom, or framing changes
- Room appears wider, narrower, taller, or shorter
- Vertical or horizontal lines shift or bend
- Ceiling height or wall angles appear altered
- Windows or doors move or resize
- The image looks regenerated instead of edited

---

FINAL OUTPUT RULE:
The final image must be IDENTICAL to the input photo in every way
EXCEPT for the addition of realistic furniture and decor.

Perform a professional real estate virtual staging edit that looks naturally photographed and MLS-ready.
Stage this ${roomLabel} in ${styleLabel} style.`;
  }

  // Private helper methods

  private async attemptStaging(
    imageBase64: string,
    mimeType: string,
    prompt: string
  ): Promise<StagingResult> {
    const result = await this.model.generateContent([
      {
        inlineData: {
          mimeType,
          data: imageBase64,
        },
      },
      prompt,
    ]);

    const response = await result.response;

    // Check if response contains generated image data
    const candidates = response.candidates;
    if (candidates && candidates.length > 0) {
      const parts = candidates[0].content?.parts;
      if (parts) {
        for (const part of parts) {
          if ("inlineData" in part && part.inlineData) {
            return {
              success: true,
              imageData: part.inlineData.data,
              mimeType: part.inlineData.mimeType,
            };
          }
        }
      }
    }

    // Get text response for error info
    const text = response.text();
    return {
      success: false,
      error: text || "No staged image was generated.",
    };
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

  private getRoomSpecificItems(roomType: RoomType, styleLabel: string): string {
    const baseItems = `- An area rug placed ON TOP of the existing flooring
- Wall art or a mirror hung naturally on existing walls
- Subtle decorative accessories (minimal and restrained)
- Indoor plants (optional, realistic placement)
- Lamps that complement the existing lighting
- Curtains or blinds installed ONLY on existing windows`;

    switch (roomType) {
      case "bedroom-master":
      case "bedroom-guest":
      case "bedroom-kids":
        return `- A bed appropriate for the bedroom, scaled realistically to the room
- Matching nightstands placed beside the bed
- Soft bedding, pillows, and neutral textiles in ${styleLabel} style
${baseItems}`;

      case "living-room":
        return `- A sofa or sectional sized appropriately for the space in ${styleLabel} style
- One or two accent chairs for additional seating
- A coffee table and side tables as needed
- A media console or focal point furniture if appropriate
${baseItems}`;

      case "dining-room":
        return `- A dining table sized appropriately for the room in ${styleLabel} style
- Dining chairs (typically 4-8 depending on table size)
- A sideboard or buffet if wall space allows
- A centerpiece or table setting
${baseItems}`;

      case "kitchen":
        return `- Bar stools if there is a counter or island
- Decorative items on counters (minimal and tasteful)
- A bowl of fruit or simple kitchen accessories
${baseItems}`;

      case "home-office":
        return `- A desk sized appropriately for the space in ${styleLabel} style
- An office chair
- Bookshelves or storage if wall space allows
- Desk accessories and task lighting
${baseItems}`;

      case "bathroom":
        return `- Towels, bath mat, and textiles in coordinating colors
- Countertop accessories (soap dispenser, tray, etc.)
- A small plant or decorative items
- Shower curtain if needed`;

      case "outdoor-patio":
        return `- Outdoor seating (chairs, sofa, or dining set) in ${styleLabel} style
- Outdoor-appropriate tables
- Potted plants and planters
- Outdoor rugs if appropriate for the surface
- Cushions and outdoor textiles`;

      default:
        return `- Furniture appropriate for the space in ${styleLabel} style
${baseItems}`;
    }
  }
}
