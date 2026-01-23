import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import { useStagingSubmit } from "./useStagingSubmit";
import { server } from "@/test/mocks/server";
import { http, HttpResponse } from "msw";

// Mock the useStagingJob hook
vi.mock("./useStagingJob", () => ({
  useStagingJob: () => ({
    startPolling: vi.fn(),
    clearAllPolling: vi.fn(),
  }),
}));

// Mock next/navigation
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    refresh: vi.fn(),
  }),
}));

describe("useStagingSubmit", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("initializes with default state", () => {
    const { result } = renderHook(() => useStagingSubmit());

    expect(result.current.variations).toEqual([]);
    expect(result.current.isProcessing).toBe(false);
    expect(result.current.processingIndex).toBe(-1);
    expect(result.current.error).toBeNull();
    expect(result.current.currentProvider).toBeNull();
  });

  it("sets up initial variations when staging is submitted", async () => {
    const { result } = renderHook(() => useStagingSubmit());

    // Create a mock file
    const file = new File(["test"], "test.jpg", { type: "image/jpeg" });

    await act(async () => {
      result.current.submitStaging({
        imageFile: file,
        roomType: "living-room",
        styles: ["modern", "scandinavian"],
      });
    });

    // Should have 2 variations for the 2 styles
    expect(result.current.variations).toHaveLength(2);
    expect(result.current.variations[0].style).toBe("modern");
    expect(result.current.variations[1].style).toBe("scandinavian");
  });

  it("handles successful synchronous staging response", async () => {
    // Setup mock to return sync response
    server.use(
      http.post("/api/staging", () => {
        return HttpResponse.json({
          jobId: "test-job",
          stagedImageUrl: "https://example.com/staged.png",
          provider: "gemini",
          async: false,
        });
      })
    );

    const onComplete = vi.fn();
    const { result } = renderHook(() => useStagingSubmit({ onComplete }));

    const file = new File(["test"], "test.jpg", { type: "image/jpeg" });

    await act(async () => {
      await result.current.submitStaging({
        imageFile: file,
        roomType: "living-room",
        styles: ["modern"],
      });
    });

    await waitFor(() => {
      expect(result.current.variations[0].status).toBe("completed");
    });

    expect(result.current.variations[0].imageUrl).toBe(
      "https://example.com/staged.png"
    );
    expect(result.current.variations[0].provider).toBe("gemini");
    expect(onComplete).toHaveBeenCalled();
  });

  it("handles staging API error", async () => {
    server.use(
      http.post("/api/staging", () => {
        return HttpResponse.json(
          { error: "Insufficient credits" },
          { status: 400 }
        );
      })
    );

    const { result } = renderHook(() => useStagingSubmit());

    const file = new File(["test"], "test.jpg", { type: "image/jpeg" });

    await act(async () => {
      await result.current.submitStaging({
        imageFile: file,
        roomType: "living-room",
        styles: ["modern"],
      });
    });

    await waitFor(() => {
      expect(result.current.variations[0].status).toBe("failed");
    });

    expect(result.current.variations[0].error).toBe("Insufficient credits");
  });

  it("resets state correctly", async () => {
    const { result } = renderHook(() => useStagingSubmit());

    // Set some state first
    const file = new File(["test"], "test.jpg", { type: "image/jpeg" });

    await act(async () => {
      result.current.submitStaging({
        imageFile: file,
        roomType: "living-room",
        styles: ["modern"],
      });
    });

    // Wait for variations to be set
    await waitFor(() => {
      expect(result.current.variations.length).toBeGreaterThan(0);
    });

    // Reset
    act(() => {
      result.current.resetStaging();
    });

    expect(result.current.variations).toEqual([]);
    expect(result.current.isProcessing).toBe(false);
    expect(result.current.processingIndex).toBe(-1);
    expect(result.current.error).toBeNull();
    expect(result.current.currentProvider).toBeNull();
  });

  it("allows setting error externally", () => {
    const { result } = renderHook(() => useStagingSubmit());

    act(() => {
      result.current.setError("Custom error message");
    });

    expect(result.current.error).toBe("Custom error message");
  });
});
