import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor, act } from "@testing-library/react";
import { useStagingJobSWR } from "./useStagingJobSWR";
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

describe("useStagingJobSWR", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns undefined job when no jobId provided", () => {
    const { result } = renderHook(
      () => useStagingJobSWR(null),
      { wrapper: createTestWrapper() }
    );

    expect(result.current.job).toBeUndefined();
    expect(result.current.isLoading).toBe(false);
    expect(result.current.isPolling).toBe(false);
  });

  it("fetches job data when jobId is provided", async () => {
    const { result } = renderHook(
      () => useStagingJobSWR("test-job-id"),
      { wrapper: createTestWrapper() }
    );

    expect(result.current.isLoading).toBe(true);

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.job).toBeDefined();
    expect(result.current.job?.status).toBe("completed");
  });

  it("calls onComplete callback when job completes", async () => {
    const onComplete = vi.fn();

    const { result } = renderHook(
      () => useStagingJobSWR("test-job-id", { onComplete }),
      { wrapper: createTestWrapper() }
    );

    await waitFor(() => {
      expect(result.current.job?.status).toBe("completed");
    });

    expect(onComplete).toHaveBeenCalledWith(
      expect.objectContaining({ status: "completed" })
    );
  });

  it("calls onError callback when job fails", async () => {
    server.use(
      http.get("/api/staging/:jobId", () => {
        return HttpResponse.json({
          id: "test-job-id",
          status: "failed",
          error: "Processing failed",
        });
      })
    );

    const onError = vi.fn();

    const { result } = renderHook(
      () => useStagingJobSWR("test-job-id", { onError }),
      { wrapper: createTestWrapper() }
    );

    await waitFor(() => {
      expect(result.current.job?.status).toBe("failed");
    });

    expect(onError).toHaveBeenCalledWith("Processing failed");
  });

  it("indicates polling when job is processing", async () => {
    server.use(
      http.get("/api/staging/:jobId", () => {
        return HttpResponse.json({
          id: "test-job-id",
          status: "processing",
          progress: { message: "Generating..." },
        });
      })
    );

    const { result } = renderHook(
      () => useStagingJobSWR("test-job-id"),
      { wrapper: createTestWrapper() }
    );

    await waitFor(() => {
      expect(result.current.job?.status).toBe("processing");
    });

    expect(result.current.isPolling).toBe(true);
  });

  it("stops polling when job completes", async () => {
    const { result } = renderHook(
      () => useStagingJobSWR("test-job-id"),
      { wrapper: createTestWrapper() }
    );

    await waitFor(() => {
      expect(result.current.job?.status).toBe("completed");
    });

    expect(result.current.isPolling).toBe(false);
  });

  it("respects enablePolling option", async () => {
    server.use(
      http.get("/api/staging/:jobId", () => {
        return HttpResponse.json({
          id: "test-job-id",
          status: "processing",
        });
      })
    );

    const { result } = renderHook(
      () => useStagingJobSWR("test-job-id", { enablePolling: false }),
      { wrapper: createTestWrapper() }
    );

    await waitFor(() => {
      expect(result.current.job).toBeDefined();
    });

    // Even with processing status, polling should be disabled
    expect(result.current.isPolling).toBe(false);
  });

  it("handles API error gracefully", async () => {
    server.use(
      http.get("/api/staging/:jobId", () => {
        return HttpResponse.json(
          { error: "Server error" },
          { status: 500 }
        );
      })
    );

    const { result } = renderHook(
      () => useStagingJobSWR("test-job-id"),
      { wrapper: createTestWrapper() }
    );

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.error).toBeDefined();
  });

  it("refetch triggers data reload", async () => {
    const { result } = renderHook(
      () => useStagingJobSWR("test-job-id"),
      { wrapper: createTestWrapper() }
    );

    await waitFor(() => {
      expect(result.current.job).toBeDefined();
    });

    await act(async () => {
      await result.current.refetch();
    });

    expect(result.current.job?.status).toBe("completed");
  });

  it("resets callbacks when jobId changes", async () => {
    const onComplete = vi.fn();

    const { result, rerender } = renderHook(
      ({ jobId }) => useStagingJobSWR(jobId, { onComplete }),
      {
        wrapper: createTestWrapper(),
        initialProps: { jobId: "job-1" },
      }
    );

    await waitFor(() => {
      expect(result.current.job).toBeDefined();
    });

    expect(onComplete).toHaveBeenCalledTimes(1);

    // Change jobId - should reset callback tracking
    rerender({ jobId: "job-2" });

    await waitFor(() => {
      expect(result.current.job).toBeDefined();
    });

    // onComplete should be called again for the new job
    expect(onComplete).toHaveBeenCalledTimes(2);
  });
});
