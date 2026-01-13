import type { RoomType } from "../constants";
import type { ControlNetWeights } from "../providers/types";

/**
 * ControlNet weight configurations optimized for each room type.
 *
 * - depth: Preserves 3D spatial relationships (important for furniture placement)
 * - canny: Preserves architectural lines and edges
 * - segmentation: Identifies floor/wall/ceiling boundaries
 *
 * Weights are normalized values between 0 and 1.
 * Higher values = stronger influence from that ControlNet mode.
 */
export const CONTROLNET_WEIGHTS: Record<RoomType, ControlNetWeights> = {
  "living-room": {
    depth: 0.7, // Strong depth for proper furniture placement
    canny: 0.3, // Moderate edge preservation
    segmentation: 0.4, // Floor/wall awareness for sofa placement
  },
  "bedroom-master": {
    depth: 0.8, // Very important for bed placement and spacing
    canny: 0.2, // Less important for bedrooms
    segmentation: 0.5, // Important for bed-to-wall relationships
  },
  "bedroom-guest": {
    depth: 0.8,
    canny: 0.2,
    segmentation: 0.5,
  },
  "bedroom-kids": {
    depth: 0.7,
    canny: 0.3,
    segmentation: 0.4,
  },
  "dining-room": {
    depth: 0.7, // Important for table centering
    canny: 0.4, // Preserve trim and molding
    segmentation: 0.5, // Floor area for table placement
  },
  "kitchen": {
    depth: 0.5, // Less important (mostly counter items)
    canny: 0.6, // Important for cabinet lines and counters
    segmentation: 0.4, // Counter/floor distinction
  },
  "home-office": {
    depth: 0.7, // Desk placement depth
    canny: 0.4, // Window and wall lines
    segmentation: 0.4, // Floor area for desk
  },
  "bathroom": {
    depth: 0.4, // Smaller space, less depth variation
    canny: 0.7, // Preserve fixtures and tile lines
    segmentation: 0.3, // Basic floor/wall awareness
  },
  "outdoor-patio": {
    depth: 0.6, // Moderate for outdoor furniture
    canny: 0.3, // Less defined edges outdoors
    segmentation: 0.5, // Ground/sky/structure awareness
  },
};

/**
 * Get ControlNet weights for a specific room type.
 * Falls back to default living room weights if room type not found.
 */
export function getControlNetWeights(roomType: RoomType): ControlNetWeights {
  return CONTROLNET_WEIGHTS[roomType] || CONTROLNET_WEIGHTS["living-room"];
}

/**
 * Default ControlNet conditioning scale (overall strength).
 * Lower values = more creative freedom, higher = stricter adherence to input.
 */
export const DEFAULT_CONDITIONING_SCALE = 0.75;

/**
 * Replicate model identifiers for ControlNet preprocessing
 */
export const CONTROLNET_MODELS = {
  // Depth estimation using MiDaS
  depth: "cjwbw/midas:latest",
  // SDXL with ControlNet depth
  sdxlDepth: "lucataco/sdxl-controlnet-depth:latest",
  // Segmentation using OneFormer
  segmentation: "sczhou/oneformer:latest",
  // Main SDXL model for generation
  sdxl: "stability-ai/sdxl:latest",
} as const;
