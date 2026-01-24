/**
 * Staging Services
 * Modular services for staging operations
 */

// Existing room rules
export * from "./room-rules";

// Job management
export {
  createStagingJob,
  getStagingJob,
  updateJobStatus,
  updateJobCompletion,
  updateJobFailure,
  setPrimaryVersion,
  type CreateJobParams,
  type StagingJob,
} from "./job.service";

// Storage operations
export {
  uploadOriginalImage,
  uploadStagedImage,
  downloadAndUploadImage,
  type UploadResult,
} from "./storage.service";

// Provider orchestration
export {
  selectProvider,
  processSyncStaging,
  processAsyncStaging,
  checkAsyncStatus,
  extractImageUrl,
  type StagingParams,
  type SyncStagingResult,
  type AsyncStagingInitResult,
  type AsyncStatusResult,
} from "./processor.service";

// Notifications
export {
  notifyStagingComplete,
  notifyStagingFailed,
  notifyLowCredits,
} from "./notifications.service";
