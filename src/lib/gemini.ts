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

function getRoomSpecificItems(roomType: RoomType, styleLabel: string): string {
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

function buildStagingPrompt(roomType: RoomType, furnitureStyle: FurnitureStyle): string {
  const roomLabel = getRoomLabel(roomType);
  const { label: styleLabel, description: styleDescription } = getStyleDetails(furnitureStyle);
  const roomItems = getRoomSpecificItems(roomType, styleLabel);

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
