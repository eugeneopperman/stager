export const STAGING_STATUS = {
  PENDING: "pending",
  PROCESSING: "processing",
  COMPLETED: "completed",
  FAILED: "failed",
} as const;

export type StagingStatus = (typeof STAGING_STATUS)[keyof typeof STAGING_STATUS];

// Time estimates for user feedback
export const STAGING_TIME_ESTIMATE = "15-30 seconds";

export const ACCEPTED_IMAGE_TYPES = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
];

export const MAX_IMAGE_SIZE = 10 * 1024 * 1024; // 10MB
export const MAX_BATCH_SIZE = 10; // Maximum images per batch staging
