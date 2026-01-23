import type { NotificationType, Notification } from "../database.types";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SupabaseClientType = any;

/**
 * Create a new notification for a user
 */
export async function createNotification(
  supabase: SupabaseClientType,
  userId: string,
  type: NotificationType,
  title: string,
  message: string,
  link?: string
): Promise<{ success: boolean; error?: string }> {
  const { error } = await supabase.from("notifications").insert({
    user_id: userId,
    type,
    title,
    message,
    link: link || null,
  });

  if (error) {
    console.error("Failed to create notification:", error);
    return { success: false, error: error.message };
  }

  return { success: true };
}

/**
 * Get all notifications for a user (most recent first)
 */
export async function getNotifications(
  supabase: SupabaseClientType,
  userId: string,
  limit: number = 20
): Promise<Notification[]> {
  const { data, error } = await supabase
    .from("notifications")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    console.error("Failed to fetch notifications:", error);
    return [];
  }

  return data || [];
}

/**
 * Get count of unread notifications for a user
 */
export async function getUnreadCount(
  supabase: SupabaseClientType,
  userId: string
): Promise<number> {
  const { count, error } = await supabase
    .from("notifications")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("is_read", false);

  if (error) {
    console.error("Failed to get unread count:", error);
    return 0;
  }

  return count || 0;
}

/**
 * Mark a single notification as read
 */
export async function markAsRead(
  supabase: SupabaseClientType,
  notificationId: string
): Promise<{ success: boolean; error?: string }> {
  const { error } = await supabase
    .from("notifications")
    .update({ is_read: true })
    .eq("id", notificationId);

  if (error) {
    console.error("Failed to mark notification as read:", error);
    return { success: false, error: error.message };
  }

  return { success: true };
}

/**
 * Mark all notifications as read for a user
 */
export async function markAllAsRead(
  supabase: SupabaseClientType,
  userId: string
): Promise<{ success: boolean; error?: string }> {
  const { error } = await supabase
    .from("notifications")
    .update({ is_read: true })
    .eq("user_id", userId)
    .eq("is_read", false);

  if (error) {
    console.error("Failed to mark all notifications as read:", error);
    return { success: false, error: error.message };
  }

  return { success: true };
}

/**
 * Delete a notification
 */
export async function deleteNotification(
  supabase: SupabaseClientType,
  notificationId: string
): Promise<{ success: boolean; error?: string }> {
  const { error } = await supabase
    .from("notifications")
    .delete()
    .eq("id", notificationId);

  if (error) {
    console.error("Failed to delete notification:", error);
    return { success: false, error: error.message };
  }

  return { success: true };
}

/**
 * Delete all notifications for a user
 */
export async function deleteAllNotifications(
  supabase: SupabaseClientType,
  userId: string
): Promise<{ success: boolean; error?: string }> {
  const { error } = await supabase
    .from("notifications")
    .delete()
    .eq("user_id", userId);

  if (error) {
    console.error("Failed to delete all notifications:", error);
    return { success: false, error: error.message };
  }

  return { success: true };
}

/**
 * Helper to format notification time as relative (e.g., "2 minutes ago")
 */
export function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) {
    return "Just now";
  }

  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) {
    return `${diffInMinutes} minute${diffInMinutes !== 1 ? "s" : ""} ago`;
  }

  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) {
    return `${diffInHours} hour${diffInHours !== 1 ? "s" : ""} ago`;
  }

  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 7) {
    return `${diffInDays} day${diffInDays !== 1 ? "s" : ""} ago`;
  }

  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}
