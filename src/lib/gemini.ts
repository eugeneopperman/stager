import { GoogleGenerativeAI } from "@google/generative-ai";
import { ROOM_TYPES, FURNITURE_STYLES, type RoomType, type FurnitureStyle } from "./constants";

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GEMINI_API_KEY || "");

// Use Gemini 2.0 Flash Experimental for image generation
// Note: This is currently the only Gemini model that supports image output
const model = genAI.getGenerativeModel({
  model: "gemini-2.0-flash-exp",
  generationConfig: {
    // @ts-expect-error - responseModalities is valid for image generation
    responseModalities: ["image", "text"],
  },
});

// Alias for backward compatibility
const getImageModel = () => model;

function getRoomLabel(roomId: RoomType): string {
  const room = ROOM_TYPES.find((r) => r.id === roomId);
  return room?.label || roomId;
}

function getStyleDetails(styleId: FurnitureStyle): { label: string; description: string } {
  const style = FURNITURE_STYLES.find((s) => s.id === styleId);
  return {
    label: style?.label || styleId,
    description: style?.description || "",
  };
}

function buildStagingPrompt(roomType: RoomType, furnitureStyle: FurnitureStyle): string {
  const roomLabel = getRoomLabel(roomType);
  const { label: styleLabel, description: styleDescription } = getStyleDetails(furnitureStyle);

  return `You are a professional virtual staging photographer and interior stylist.

Your task is to realistically stage this EMPTY photo of a ${roomLabel} by ADDING furniture and decor only.

ABSOLUTE CONSTRAINTS — THESE MUST NOT CHANGE:
- Camera angle, lens perspective, or field of view
- Walls, wall color, wall texture, or wall condition
- Flooring, carpet, floor material, or floor color
- Ceiling shape, height, color, or texture
- Windows, doors, trim, or architectural features
- Existing lighting direction, brightness, shadows, or light sources
- Image framing, crop, resolution, or aspect ratio

DO NOT remove, alter, repaint, replace, resize, or reposition any existing elements.

---

ONLY ADD the following in a cohesive ${styleLabel} style (${styleDescription}):

- Furniture appropriate for a ${roomLabel}, sized realistically for the space
- Area rugs placed ON TOP of the existing floor (do not replace flooring)
- Wall art or mirrors hung naturally on existing walls
- Indoor plants and subtle decorative accessories
- Lamps or light fixtures that complement the existing lighting
- Curtains or blinds installed on existing windows only

---

REAL ESTATE STAGING GUIDELINES:
- Favor neutral, market-friendly colors and timeless design choices
- Avoid overly bold, trendy, or distracting decor
- Stage the room to appeal to the broadest range of buyers
- Keep the space feeling open, inviting, and easy to imagine living in

---

ROOM-SPECIFIC LOGIC:
- Furniture layout must match how a real ${roomLabel} is typically used
- Maintain clear walkways and functional spacing between furniture
- Do not block doors, windows, vents, or architectural features

If staging a bedroom:
- Include a bed, nightstands, and soft textiles
- Ensure balanced spacing around the bed and access to both sides

If staging a living room:
- Arrange seating to support conversation and comfort
- Orient furniture toward a natural focal point when appropriate

If staging a dining room:
- Include a dining table with appropriately sized chairs
- Ensure comfortable clearance for seating and movement

---

LESS-IS-MORE GUARDRAILS:
- Do not overcrowd the room
- Use restraint in the number of decor items
- Preserve negative space to reflect professional real estate staging
- Every added item should serve a clear visual or functional purpose

---

REALISM REQUIREMENTS:
- All added items must be photorealistic and indistinguishable from the original photograph
- Materials, textures, reflections, and shadows must match the existing lighting and perspective
- No floating objects, warped geometry, or inconsistent shadows
- Avoid any 3D-rendered, illustrated, or AI-stylized appearance
- The final image must look like a naturally staged, professionally photographed real home

---

FINAL OUTPUT RULE:
The resulting image must be IDENTICAL to the input photo in every way except for the addition of furniture and decor.

Stage this ${roomLabel} in a ${styleLabel} style while preserving the original photograph exactly.`;
}

export interface StagingResult {
  success: boolean;
  imageData?: string; // Base64 encoded image
  mimeType?: string;
  error?: string;
}

async function attemptStaging(
  imageBase64: string,
  mimeType: string,
  prompt: string,
  useImageModel: boolean = true
): Promise<StagingResult> {
  const selectedModel = useImageModel ? getImageModel() : model;

  const result = await selectedModel.generateContent([
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

export async function stageImage(
  imageBase64: string,
  mimeType: string,
  roomType: RoomType,
  furnitureStyle: FurnitureStyle
): Promise<StagingResult> {
  const prompt = buildStagingPrompt(roomType, furnitureStyle);

  // Try with image generation model first
  try {
    const result = await attemptStaging(imageBase64, mimeType, prompt, true);
    if (result.success) {
      return result;
    }
  } catch (error) {
    console.error("Image model error, falling back:", error);
  }

  // Fallback: try with standard model
  try {
    const result = await attemptStaging(imageBase64, mimeType, prompt, false);
    if (result.success) {
      return result;
    }
    return {
      success: false,
      error: "Image generation is not available. The AI analyzed your image but could not generate a staged version. This feature requires Gemini's image generation capabilities which may have quota limits.",
    };
  } catch (error) {
    console.error("Gemini staging error:", error);

    // Check for rate limit errors
    const errorMessage = error instanceof Error ? error.message : String(error);
    if (errorMessage.includes("429") || errorMessage.includes("quota")) {
      return {
        success: false,
        error: "Rate limit exceeded. Please wait a minute and try again, or upgrade your Google AI API plan for higher limits.",
      };
    }

    return {
      success: false,
      error: errorMessage || "Failed to process image",
    };
  }
}

export async function analyzeRoom(
  imageBase64: string,
  mimeType: string
): Promise<{ roomType: RoomType | null; confidence: number; description: string }> {
  try {
    const prompt = `Analyze this room image and determine:
1. What type of room is this? (living room, bedroom, kitchen, bathroom, dining room, home office, outdoor/patio, or other)
2. Is the room empty/unfurnished or already furnished?
3. Describe the key architectural features (windows, flooring, ceiling height, etc.)

Respond in JSON format:
{
  "roomType": "living-room" | "bedroom-master" | "bedroom-guest" | "bedroom-kids" | "dining-room" | "kitchen" | "home-office" | "bathroom" | "outdoor-patio" | null,
  "confidence": 0.0-1.0,
  "isEmpty": true/false,
  "description": "Brief description of the room and its features"
}`;

    const result = await model.generateContent([
      {
        inlineData: {
          mimeType,
          data: imageBase64,
        },
      },
      prompt,
    ]);

    const response = await result.response;
    const text = response.text();

    // Parse JSON from response
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      return {
        roomType: parsed.roomType as RoomType | null,
        confidence: parsed.confidence || 0,
        description: parsed.description || "",
      };
    }

    return {
      roomType: null,
      confidence: 0,
      description: "Could not analyze the room",
    };
  } catch (error) {
    console.error("Room analysis error:", error);
    return {
      roomType: null,
      confidence: 0,
      description: "Error analyzing the room",
    };
  }
}
