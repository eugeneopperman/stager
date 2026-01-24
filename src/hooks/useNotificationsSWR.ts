"use client";

import useSWR, { mutate } from "swr";
import { useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  getNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  deleteAllNotifications,
} from "@/lib/notifications";
import type { Notification } from "@/lib/database.types";
import { notificationPollingConfig } from "@/lib/swr";

interface UseNotificationsSWRReturn {
  notifications: Notification[];
  unreadCount: number;
  isLoading: boolean;
  isLoadingNotifications: boolean;
  error: Error | undefined;
  refetch: () => Promise<void>;
  markAsRead: (notificationId: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  deleteNotification: (notification: Notification) => Promise<void>;
  deleteAllNotifications: () => Promise<void>;
}

export function useNotificationsSWR(userId: string | null): UseNotificationsSWRReturn {
  const supabase = createClient();
  const [fetchNotificationsTrigger, setFetchNotificationsTrigger] = useState(false);

  // Cache keys
  const unreadCountKey = userId ? `notifications-unread-${userId}` : null;
  const notificationsKey = userId && fetchNotificationsTrigger ? `notifications-list-${userId}` : null;

  // Fetch unread count with polling
  const {
    data: unreadCount = 0,
    isLoading: isLoadingCount,
    error: countError,
  } = useSWR<number>(
    unreadCountKey,
    async () => {
      if (!userId) return 0;
      return getUnreadCount(supabase, userId);
    },
    notificationPollingConfig
  );

  // Fetch full notifications list (only when triggered)
  const {
    data: notifications = [],
    isLoading: isLoadingNotifications,
    error: notificationsError,
  } = useSWR<Notification[]>(
    notificationsKey,
    async () => {
      if (!userId) return [];
      return getNotifications(supabase, userId);
    },
    {
      revalidateOnFocus: false,
    }
  );

  // Trigger fetching notifications (called when dropdown opens)
  const fetchNotifications = useCallback(async () => {
    setFetchNotificationsTrigger(true);
    if (userId) {
      await mutate(`notifications-list-${userId}`);
    }
  }, [userId]);

  const handleMarkAsRead = useCallback(
    async (notificationId: string) => {
      if (!userId) return;

      // Optimistic update
      await mutate(
        `notifications-list-${userId}`,
        (currentNotifications: Notification[] | undefined) =>
          currentNotifications?.map((n) =>
            n.id === notificationId ? { ...n, is_read: true } : n
          ),
        false
      );

      await mutate(
        `notifications-unread-${userId}`,
        (count: number | undefined) => Math.max(0, (count ?? 1) - 1),
        false
      );

      // Perform actual mutation
      await markAsRead(supabase, notificationId);

      // Revalidate
      await mutate(`notifications-unread-${userId}`);
    },
    [userId, supabase]
  );

  const handleMarkAllAsRead = useCallback(async () => {
    if (!userId) return;

    // Optimistic update
    await mutate(
      `notifications-list-${userId}`,
      (currentNotifications: Notification[] | undefined) =>
        currentNotifications?.map((n) => ({ ...n, is_read: true })),
      false
    );

    await mutate(`notifications-unread-${userId}`, 0, false);

    // Perform actual mutation
    await markAllAsRead(supabase, userId);

    // Revalidate
    await mutate(`notifications-unread-${userId}`);
  }, [userId, supabase]);

  const handleDeleteNotification = useCallback(
    async (notification: Notification) => {
      if (!userId) return;

      // Optimistic update
      await mutate(
        `notifications-list-${userId}`,
        (currentNotifications: Notification[] | undefined) =>
          currentNotifications?.filter((n) => n.id !== notification.id),
        false
      );

      if (!notification.is_read) {
        await mutate(
          `notifications-unread-${userId}`,
          (count: number | undefined) => Math.max(0, (count ?? 1) - 1),
          false
        );
      }

      // Perform actual mutation
      await deleteNotification(supabase, notification.id);

      // Revalidate
      await mutate(`notifications-unread-${userId}`);
    },
    [userId, supabase]
  );

  const handleDeleteAllNotifications = useCallback(async () => {
    if (!userId) return;

    // Optimistic update
    await mutate(`notifications-list-${userId}`, [], false);
    await mutate(`notifications-unread-${userId}`, 0, false);

    // Perform actual mutation
    await deleteAllNotifications(supabase, userId);
  }, [userId, supabase]);

  return {
    notifications,
    unreadCount,
    isLoading: isLoadingCount,
    isLoadingNotifications,
    error: countError || notificationsError,
    refetch: fetchNotifications,
    markAsRead: handleMarkAsRead,
    markAllAsRead: handleMarkAllAsRead,
    deleteNotification: handleDeleteNotification,
    deleteAllNotifications: handleDeleteAllNotifications,
  };
}
