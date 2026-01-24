/**
 * Staging Notifications Service
 * Handles notifications related to staging operations
 */

import { createClient } from "@/lib/supabase/server";
import { createNotification } from "@/lib/notifications";
import { ROOM_TYPES } from "@/lib/constants";

/**
 * Get human-readable room type label
 */
function getRoomLabel(roomType: string): string {
  return ROOM_TYPES.find((r) => r.id === roomType)?.label || roomType;
}

/**
 * Create notification for successful staging completion
 */
export async function notifyStagingComplete(
  userId: string,
  jobId: string,
  roomType: string
): Promise<void> {
  const supabase = await createClient();
  const roomLabel = getRoomLabel(roomType);

  await createNotification(
    supabase,
    userId,
    "staging_complete",
    "Staging Complete",
    `Your ${roomLabel} staging is ready to view!`,
    "/history"
  );
}

/**
 * Create notification for failed staging
 */
export async function notifyStagingFailed(
  userId: string,
  jobId: string,
  roomType: string
): Promise<void> {
  const supabase = await createClient();
  const roomLabel = getRoomLabel(roomType);

  await createNotification(
    supabase,
    userId,
    "staging_failed",
    "Staging Failed",
    `Your ${roomLabel} staging could not be completed. Please try again.`,
    "/history"
  );
}

/**
 * Create notification for low credit warning
 */
export async function notifyLowCredits(
  userId: string,
  remainingCredits: number
): Promise<void> {
  const supabase = await createClient();

  await createNotification(
    supabase,
    userId,
    "low_credits",
    "Low Credits",
    `You have ${remainingCredits} credit${remainingCredits !== 1 ? "s" : ""} remaining. Consider adding more to continue staging.`,
    "/billing"
  );
}
