import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor, act } from "@testing-library/react";
import { useNotificationsSWR } from "./useNotificationsSWR";
import { createTestWrapper } from "@/test/utils";

// Mock supabase client
vi.mock("@/lib/supabase/client", () => ({
  createClient: () => ({
    from: vi.fn(),
  }),
}));

// Mock notification functions with inline data (vi.mock is hoisted)
vi.mock("@/lib/notifications", () => ({
  getNotifications: vi.fn().mockResolvedValue([
    {
      id: "notif-1",
      user_id: "user-1",
      type: "staging_complete",
      title: "Staging Complete",
      message: "Your staging is ready",
      is_read: false,
      created_at: "2024-01-15T10:00:00Z",
    },
    {
      id: "notif-2",
      user_id: "user-1",
      type: "credits_low",
      title: "Low Credits",
      message: "You have 5 credits remaining",
      is_read: true,
      created_at: "2024-01-14T10:00:00Z",
    },
  ]),
  getUnreadCount: vi.fn().mockResolvedValue(1),
  markAsRead: vi.fn().mockResolvedValue(undefined),
  markAllAsRead: vi.fn().mockResolvedValue(undefined),
  deleteNotification: vi.fn().mockResolvedValue(undefined),
  deleteAllNotifications: vi.fn().mockResolvedValue(undefined),
}));

// Test data for use in tests
const testNotification = {
  id: "notif-1",
  user_id: "user-1",
  type: "staging_complete",
  title: "Staging Complete",
  message: "Your staging is ready",
  is_read: false,
  created_at: "2024-01-15T10:00:00Z",
};

describe("useNotificationsSWR", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns empty state when no userId provided", () => {
    const { result } = renderHook(() => useNotificationsSWR(null), {
      wrapper: createTestWrapper(),
    });

    expect(result.current.notifications).toEqual([]);
    expect(result.current.unreadCount).toBe(0);
    expect(result.current.isLoading).toBe(false);
  });

  it("starts loading when userId is provided", () => {
    const { result } = renderHook(() => useNotificationsSWR("user-1"), {
      wrapper: createTestWrapper(),
    });

    // Hook should start in loading state for unread count
    expect(result.current.isLoading).toBe(true);
  });

  it("fetches unread count when userId is provided", async () => {
    const { result } = renderHook(() => useNotificationsSWR("user-1"), {
      wrapper: createTestWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.unreadCount).toBe(1);
  });

  it("does not fetch notifications until triggered", async () => {
    const { result } = renderHook(() => useNotificationsSWR("user-1"), {
      wrapper: createTestWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    // Notifications should be empty until refetch is called
    expect(result.current.notifications).toEqual([]);
    expect(result.current.isLoadingNotifications).toBe(false);
  });

  it("fetches notifications on refetch", async () => {
    const { result } = renderHook(() => useNotificationsSWR("user-1"), {
      wrapper: createTestWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    // Trigger fetching notifications
    await act(async () => {
      await result.current.refetch();
    });

    // Wait for notifications to load
    await waitFor(
      () => {
        expect(result.current.notifications.length).toBeGreaterThan(0);
      },
      { timeout: 2000 }
    );

    expect(result.current.notifications).toHaveLength(2);
  });

  it("markAsRead does nothing when no userId", async () => {
    const { markAsRead: mockMarkAsRead } = await import("@/lib/notifications");

    const { result } = renderHook(() => useNotificationsSWR(null), {
      wrapper: createTestWrapper(),
    });

    await act(async () => {
      await result.current.markAsRead("notif-1");
    });

    expect(mockMarkAsRead).not.toHaveBeenCalled();
  });

  it("markAllAsRead does nothing when no userId", async () => {
    const { markAllAsRead: mockMarkAllAsRead } = await import(
      "@/lib/notifications"
    );

    const { result } = renderHook(() => useNotificationsSWR(null), {
      wrapper: createTestWrapper(),
    });

    await act(async () => {
      await result.current.markAllAsRead();
    });

    expect(mockMarkAllAsRead).not.toHaveBeenCalled();
  });

  it("deleteNotification does nothing when no userId", async () => {
    const { deleteNotification: mockDeleteNotification } = await import(
      "@/lib/notifications"
    );

    const { result } = renderHook(() => useNotificationsSWR(null), {
      wrapper: createTestWrapper(),
    });

    await act(async () => {
      await result.current.deleteNotification(testNotification);
    });

    expect(mockDeleteNotification).not.toHaveBeenCalled();
  });

  it("deleteAllNotifications does nothing when no userId", async () => {
    const { deleteAllNotifications: mockDeleteAllNotifications } = await import(
      "@/lib/notifications"
    );

    const { result } = renderHook(() => useNotificationsSWR(null), {
      wrapper: createTestWrapper(),
    });

    await act(async () => {
      await result.current.deleteAllNotifications();
    });

    expect(mockDeleteAllNotifications).not.toHaveBeenCalled();
  });

  it("provides correct loading states", async () => {
    const { result } = renderHook(() => useNotificationsSWR("user-1"), {
      wrapper: createTestWrapper(),
    });

    // Initially loading
    expect(result.current.isLoading).toBe(true);

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    // Notifications not loading until triggered
    expect(result.current.isLoadingNotifications).toBe(false);
  });
});
