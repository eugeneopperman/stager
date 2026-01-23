import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor, act } from "@testing-library/react";
import { useVersionManagement } from "./useVersionManagement";
import { server } from "@/test/mocks/server";
import { http, HttpResponse } from "msw";

// Mock next/navigation
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    refresh: vi.fn(),
  }),
}));

// Mock sonner toast
vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

describe("useVersionManagement", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("initializes with default state when no version group", () => {
    const { result } = renderHook(() =>
      useVersionManagement({
        jobId: "test-job",
        versionGroupId: null,
      })
    );

    expect(result.current.versions).toEqual([]);
    expect(result.current.versionCount).toBe(1);
    expect(result.current.hasVersions).toBe(false);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.isSettingPrimary).toBe(false);
  });

  it("fetches versions when version group exists", async () => {
    server.use(
      http.get("/api/staging/versions", () => {
        return HttpResponse.json({
          versions: [
            { id: "v1", room_type: "living-room", style: "modern" },
            { id: "v2", room_type: "living-room", style: "scandinavian" },
          ],
          totalVersions: 2,
        });
      })
    );

    const { result } = renderHook(() =>
      useVersionManagement({
        jobId: "test-job",
        versionGroupId: "version-group-1",
      })
    );

    await waitFor(() => {
      expect(result.current.versions).toHaveLength(2);
    });

    expect(result.current.versionCount).toBe(2);
    expect(result.current.hasVersions).toBe(true);
  });

  it("sets primary version successfully", async () => {
    const mockVersion = {
      id: "v2",
      room_type: "living-room",
      style: "scandinavian",
      is_primary_version: false,
    };

    server.use(
      http.get("/api/staging/versions", () => {
        return HttpResponse.json({
          versions: [
            { id: "v1", is_primary_version: true },
            { id: "v2", is_primary_version: false },
          ],
          totalVersions: 2,
        });
      }),
      http.patch("/api/staging/:jobId", () => {
        return HttpResponse.json({ success: true });
      })
    );

    const { result } = renderHook(() =>
      useVersionManagement({
        jobId: "test-job",
        versionGroupId: "version-group-1",
      })
    );

    // Wait for initial fetch
    await waitFor(() => {
      expect(result.current.versions).toHaveLength(2);
    });

    // Set primary
    await act(async () => {
      await result.current.setAsPrimary(mockVersion as Parameters<typeof result.current.setAsPrimary>[0]);
    });

    await waitFor(() => {
      expect(result.current.isSettingPrimary).toBe(false);
    });

    // Check that v2 is now primary
    const v2 = result.current.versions.find((v) => v.id === "v2");
    expect(v2?.is_primary_version).toBe(true);
  });

  it("handles set primary version error", async () => {
    server.use(
      http.get("/api/staging/versions", () => {
        return HttpResponse.json({
          versions: [{ id: "v1" }],
          totalVersions: 1,
        });
      }),
      http.patch("/api/staging/:jobId", () => {
        return HttpResponse.json({ error: "Failed" }, { status: 500 });
      })
    );

    const { result } = renderHook(() =>
      useVersionManagement({
        jobId: "test-job",
        versionGroupId: "version-group-1",
      })
    );

    await waitFor(() => {
      expect(result.current.versions).toHaveLength(1);
    });

    await act(async () => {
      await result.current.setAsPrimary({ id: "v1" } as Parameters<typeof result.current.setAsPrimary>[0]);
    });

    // Should have called toast.error (we mocked it above)
    const { toast } = await import("sonner");
    expect(toast.error).toHaveBeenCalledWith("Failed to set primary version");
  });

  it("allows manual fetch of versions", async () => {
    let fetchCount = 0;

    server.use(
      http.get("/api/staging/versions", () => {
        fetchCount++;
        return HttpResponse.json({
          versions: [{ id: `v${fetchCount}` }],
          totalVersions: fetchCount,
        });
      })
    );

    const { result } = renderHook(() =>
      useVersionManagement({
        jobId: "test-job",
        versionGroupId: "version-group-1",
      })
    );

    // Wait for initial fetch
    await waitFor(() => {
      expect(result.current.versions).toHaveLength(1);
    });

    // Manual fetch
    await act(async () => {
      await result.current.fetchVersions();
    });

    await waitFor(() => {
      expect(result.current.versionCount).toBe(2);
    });
  });
});
