import { GoogleGenerativeAI } from "@google/generative-ai";
import { ROOM_TYPES, FURNITURE_STYLES, type RoomType, type FurnitureStyle } from "./constants";

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GEMINI_API_KEY || "");

// Use Gemini 2.5 Flash for image generation
const model = genAI.getGenerativeModel({
  model: "gemini-2.5-flash-preview-04-17",
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

  return `You are a virtual staging assistant. Add furniture and decor to this empty ${roomLabel} photo.

CRITICAL RULES - DO NOT CHANGE:
- DO NOT change the camera angle or perspective
- DO NOT change the walls, wall color, or wall texture
- DO NOT change the flooring, carpet, or floor material
- DO NOT change the ceiling or ceiling color
- DO NOT change the windows, doors, or architectural features
- DO NOT change the lighting conditions or light sources
- DO NOT crop or resize the image

ONLY ADD these items in ${styleLabel} style (${styleDescription}):
- Furniture appropriate for a ${roomLabel}
- Area rugs (placed ON the existing floor, not replacing it)
- Wall art and mirrors (hung on existing walls)
- Plants and decorative accessories
- Lamps and light fixtures
- Curtains or blinds on existing windows

The output image must:
- Have the EXACT same camera angle as the input
- Show the EXACT same walls, floor, and ceiling as the input
- Only differ by having furniture and decor added
- Look like a real photograph, not a 3D render

Add ${styleLabel} furniture to this ${roomLabel} while keeping everything else identical.`;
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
