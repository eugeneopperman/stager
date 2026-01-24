import { z } from "zod";
import {
  roomTypeSchema,
  furnitureStyleSchema,
  imageMimeTypeSchema,
  base64ImageSchema,
} from "./staging";

/**
 * Declutter request schema
 * POST /api/declutter
 */
export const declutterRequestSchema = z
  .object({
    image: base64ImageSchema,
    mimeType: imageMimeTypeSchema,
    roomType: roomTypeSchema.optional(),
    style: furnitureStyleSchema.optional(),
    stageAfter: z.boolean().default(false),
  })
  .refine(
    (data) => {
      // If stageAfter is true, roomType and style are required
      if (data.stageAfter) {
        return data.roomType && data.style;
      }
      return true;
    },
    {
      message: "roomType and style are required when stageAfter is true",
      path: ["roomType"],
    }
  );

export type DeclutterRequest = z.infer<typeof declutterRequestSchema>;

/**
 * Segment request schema (FastSAM text-based segmentation)
 * POST /api/segment
 */
export const segmentRequestSchema = z.object({
  image: base64ImageSchema,
  mimeType: imageMimeTypeSchema,
  prompt: z
    .string()
    .min(1, "Prompt is required")
    .max(500, "Prompt must not exceed 500 characters")
    .trim(),
  negativePrompt: z
    .string()
    .max(500, "Negative prompt must not exceed 500 characters")
    .trim()
    .optional(),
});

export type SegmentRequest = z.infer<typeof segmentRequestSchema>;
