import { z } from "zod";

/**
 * Valid room types from constants/ui.ts
 */
export const roomTypeSchema = z.enum([
  "living-room",
  "bedroom-master",
  "bedroom-guest",
  "bedroom-kids",
  "dining-room",
  "kitchen",
  "home-office",
  "bathroom",
  "outdoor-patio",
]);

export type RoomTypeSchema = z.infer<typeof roomTypeSchema>;

/**
 * Valid furniture styles from constants/ui.ts
 */
export const furnitureStyleSchema = z.enum([
  "modern",
  "traditional",
  "minimalist",
  "mid-century",
  "scandinavian",
  "industrial",
  "coastal",
  "farmhouse",
  "luxury",
]);

export type FurnitureStyleSchema = z.infer<typeof furnitureStyleSchema>;

/**
 * Valid MIME types for images
 */
export const imageMimeTypeSchema = z.enum([
  "image/png",
  "image/jpeg",
  "image/jpg",
  "image/webp",
]);

/**
 * Base64 image string validation (non-empty)
 */
export const base64ImageSchema = z
  .string()
  .min(1, "Image data is required")
  .refine(
    (val) => {
      // Basic check: should be valid base64 or at least look like it
      // We don't fully decode to avoid memory issues with large images
      return /^[A-Za-z0-9+/=]+$/.test(val.substring(0, 100));
    },
    { message: "Invalid base64 image data" }
  );

/**
 * Staging request schema
 * POST /api/staging
 */
export const stagingRequestSchema = z.object({
  image: base64ImageSchema,
  mimeType: imageMimeTypeSchema,
  roomType: roomTypeSchema,
  style: furnitureStyleSchema,
  propertyId: z.string().uuid().optional(),
  declutterFirst: z.boolean().default(false),
  mask: base64ImageSchema.optional(),
});

export type StagingRequest = z.infer<typeof stagingRequestSchema>;

/**
 * Remix request schema
 * POST /api/staging/[jobId]/remix
 */
export const remixRequestSchema = z.object({
  roomType: roomTypeSchema,
  style: furnitureStyleSchema,
  propertyId: z.string().uuid().optional(),
});

export type RemixRequest = z.infer<typeof remixRequestSchema>;

/**
 * Staging job action schema
 * PATCH /api/staging/[jobId]
 */
export const stagingJobActionSchema = z.object({
  action: z.enum(["set-primary", "delete"]),
});

export type StagingJobAction = z.infer<typeof stagingJobActionSchema>;
