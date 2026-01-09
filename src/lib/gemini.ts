import { GoogleGenerativeAI } from "@google/generative-ai";
import { ROOM_TYPES, FURNITURE_STYLES, type RoomType, type FurnitureStyle } from "./constants";

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GEMINI_API_KEY || "");

// Use Gemini Flash 2.5 (Nano Banana)
const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" });

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

  return `You are an expert interior designer and virtual stager for real estate photography.

Task: Virtually stage this empty ${roomLabel} with ${styleLabel} style furniture and decor.

Style Guidelines for ${styleLabel}:
${styleDescription}

Requirements:
1. Keep the original room architecture, walls, windows, and flooring intact
2. Add appropriate furniture for a ${roomLabel} in ${styleLabel} style
3. Include tasteful decor items (artwork, plants, rugs, lighting fixtures)
4. Ensure furniture is properly scaled and positioned
5. Maintain natural lighting and shadows
6. Create a warm, inviting atmosphere that appeals to potential home buyers
7. The staging should look photorealistic and professionally done

Important: The result should look like a real photograph of a professionally staged home, not a rendering or 3D visualization.`;
}

export interface StagingResult {
  success: boolean;
  imageData?: string; // Base64 encoded image
  mimeType?: string;
  error?: string;
}

export async function stageImage(
  imageBase64: string,
  mimeType: string,
  roomType: RoomType,
  furnitureStyle: FurnitureStyle
): Promise<StagingResult> {
  try {
    const prompt = buildStagingPrompt(roomType, furnitureStyle);

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

    // Note: Gemini 2.0 Flash has image generation capabilities
    // The actual implementation may need adjustment based on the API response format
    // For image-to-image transformation, we might need to use a specific configuration

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

    // If no image was generated, return the text response as error info
    return {
      success: false,
      error: text || "No staged image was generated. Please try again.",
    };
  } catch (error) {
    console.error("Gemini staging error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to process image",
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
