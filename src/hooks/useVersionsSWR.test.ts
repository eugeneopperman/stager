import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor, act } from "@testing-library/react";
import { useVersionsSWR } from "./useVersionsSWR";
import { createTestWrapper } from "@/test/utils";
import { server } from "@/test/mocks/server";
import { http, HttpResponse } from "msw";

// Mock next/navigation
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    refresh: vi.fn(),
    push: vi.fn(),
  }),
}));

// Mock sonner toast
vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

describe("useVersionsSWR", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns empty state when no versionGroupId provided", () => {
    const { result } = renderHook(
      () => useVersionsSWR("job-1", null),
      { wrapper: createTestWrapper() }
    );

    expect(result.current.versions).toEqual([]);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.hasVersions).toBe(false);
  });

  it("starts loading when versionGroupId is provided", () => {
    const { result } = renderHook(
      () => useVersionsSWR("job-1", "group-1"),
      { wrapper: createTestWrapper() }
    );

    // When versionGroupId is provided, hook should start fetching
    expect(result.current.isLoading).toBe(true);
    // Initial state should be empty arrays
    expect(result.current.versions).toEqual([]);
    expect(result.current.versionCount).toBe(1); // Default count
    expect(result.current.hasVersions).toBe(false);
  });

  it("setAsPrimary does nothing when no cacheKey", async () => {
    // When no versionGroupId, setAsPrimary should return early
    const { result } = renderHook(
      () => useVersionsSWR("job-1", null),
      { wrapper: createTestWrapper() }
    );

    const mockVersion = {
      id: "version-2",
      room_type: "living-room",
      style: "scandinavian",
      staged_image_url: "https://example.com/v2.png",
      is_primary_version: false,
      created_at: "2024-01-02T00:00:00Z",
    } as Parameters<typeof result.current.setAsPrimary>[0];

    // Should return early without error when no cacheKey
    await act(async () => {
      await result.current.setAsPrimary(mockVersion);
    });

    // Test passes if no error thrown
    expect(result.current.versions).toEqual([]);
  });

  it("setAsPrimary handles missing data gracefully", async () => {
    // This tests that even with a versionGroupId but no cached data yet,
    // setAsPrimary handles the case gracefully
    const { result } = renderHook(
      () => useVersionsSWR("job-1", "group-1", { enabled: false }),
      { wrapper: createTestWrapper() }
    );

    const mockVersion = {
      id: "version-2",
      room_type: "living-room",
      style: "scandinavian",
    } as Parameters<typeof result.current.setAsPrimary>[0];

    // Should not crash even without data
    await act(async () => {
      await result.current.setAsPrimary(mockVersion);
    });

    // No error means success
    expect(result.current.error).toBeUndefined();
  });

  it("handles API error gracefully", async () => {
    server.use(
      http.get("/api/staging/versions", () => {
        return HttpResponse.json(
          { error: "Server error" },
          { status: 500 }
        );
      })
    );

    const { result } = renderHook(
      () => useVersionsSWR("job-1", "group-1"),
      { wrapper: createTestWrapper() }
    );

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.error).toBeDefined();
  });

  it("refetch triggers data reload", async () => {
    const { result } = renderHook(
      () => useVersionsSWR("job-1", "group-1"),
      { wrapper: createTestWrapper() }
    );

    // Wait for initial load
    await waitFor(
      () => {
        expect(result.current.isLoading).toBe(false);
      },
      { timeout: 2000 }
    );

    // Refetch should work without error
    await act(async () => {
      await result.current.refetch();
    });

    // Test passes if refetch completes without error
    expect(result.current.error).toBeUndefined();
  });

  it("respects enabled option", () => {
    const { result } = renderHook(
      () => useVersionsSWR("job-1", "group-1", { enabled: false }),
      { wrapper: createTestWrapper() }
    );

    expect(result.current.versions).toEqual([]);
    expect(result.current.isLoading).toBe(false);
  });
});
