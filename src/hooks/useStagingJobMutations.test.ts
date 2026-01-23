import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useStagingJobMutations } from "./useStagingJobMutations";

// Mock Supabase client
const mockSupabaseUpdate = vi.fn();
const mockSupabaseDelete = vi.fn();
const mockSupabaseEq = vi.fn();

vi.mock("@/lib/supabase/client", () => ({
  createClient: () => ({
    from: () => ({
      update: (data: unknown) => {
        mockSupabaseUpdate(data);
        return {
          eq: (field: string, value: string) => {
            mockSupabaseEq(field, value);
            return Promise.resolve({ error: null });
          },
        };
      },
      delete: () => {
        mockSupabaseDelete();
        return {
          eq: (field: string, value: string) => {
            mockSupabaseEq(field, value);
            return Promise.resolve({ error: null });
          },
        };
      },
    }),
  }),
}));

// Mock next/navigation
const mockRefresh = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    refresh: mockRefresh,
  }),
}));

// Mock sonner
vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

// Mock window.confirm
const mockConfirm = vi.fn();
global.confirm = mockConfirm;

describe("useStagingJobMutations", () => {
  const mockProperties = [
    { id: "prop-1", address: "123 Main St" },
    { id: "prop-2", address: "456 Oak Ave" },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    mockConfirm.mockReturnValue(true);
  });

  it("initializes with correct default state", () => {
    const { result } = renderHook(() =>
      useStagingJobMutations({
        jobId: "test-job",
        initialPropertyId: null,
        initialIsFavorite: false,
        properties: mockProperties,
      })
    );

    expect(result.current.currentPropertyId).toBeNull();
    expect(result.current.isFavorite).toBe(false);
    expect(result.current.isAssigning).toBe(false);
    expect(result.current.isTogglingFavorite).toBe(false);
    expect(result.current.isDeleting).toBe(false);
    expect(result.current.currentProperty).toBeUndefined();
  });

  it("initializes with provided property and favorite state", () => {
    const { result } = renderHook(() =>
      useStagingJobMutations({
        jobId: "test-job",
        initialPropertyId: "prop-1",
        initialIsFavorite: true,
        properties: mockProperties,
      })
    );

    expect(result.current.currentPropertyId).toBe("prop-1");
    expect(result.current.isFavorite).toBe(true);
    expect(result.current.currentProperty).toEqual({
      id: "prop-1",
      address: "123 Main St",
    });
  });

  it("assigns to property successfully", async () => {
    const { result } = renderHook(() =>
      useStagingJobMutations({
        jobId: "test-job",
        initialPropertyId: null,
        initialIsFavorite: false,
        properties: mockProperties,
      })
    );

    await act(async () => {
      await result.current.assignToProperty("prop-1");
    });

    expect(mockSupabaseUpdate).toHaveBeenCalledWith({ property_id: "prop-1" });
    expect(mockSupabaseEq).toHaveBeenCalledWith("id", "test-job");
    expect(result.current.currentPropertyId).toBe("prop-1");
    expect(mockRefresh).toHaveBeenCalled();

    const { toast } = await import("sonner");
    expect(toast.success).toHaveBeenCalledWith("Added to 123 Main St");
  });

  it("removes from property successfully", async () => {
    const { result } = renderHook(() =>
      useStagingJobMutations({
        jobId: "test-job",
        initialPropertyId: "prop-1",
        initialIsFavorite: false,
        properties: mockProperties,
      })
    );

    await act(async () => {
      await result.current.assignToProperty(null);
    });

    expect(mockSupabaseUpdate).toHaveBeenCalledWith({ property_id: null });
    expect(result.current.currentPropertyId).toBeNull();

    const { toast } = await import("sonner");
    expect(toast.success).toHaveBeenCalledWith("Removed from property");
  });

  it("toggles favorite on", async () => {
    const { result } = renderHook(() =>
      useStagingJobMutations({
        jobId: "test-job",
        initialPropertyId: null,
        initialIsFavorite: false,
        properties: mockProperties,
      })
    );

    await act(async () => {
      await result.current.toggleFavorite();
    });

    expect(mockSupabaseUpdate).toHaveBeenCalledWith({ is_favorite: true });
    expect(result.current.isFavorite).toBe(true);

    const { toast } = await import("sonner");
    expect(toast.success).toHaveBeenCalledWith("Added to favorites");
  });

  it("toggles favorite off", async () => {
    const { result } = renderHook(() =>
      useStagingJobMutations({
        jobId: "test-job",
        initialPropertyId: null,
        initialIsFavorite: true,
        properties: mockProperties,
      })
    );

    await act(async () => {
      await result.current.toggleFavorite();
    });

    expect(mockSupabaseUpdate).toHaveBeenCalledWith({ is_favorite: false });
    expect(result.current.isFavorite).toBe(false);

    const { toast } = await import("sonner");
    expect(toast.success).toHaveBeenCalledWith("Removed from favorites");
  });

  it("deletes job after confirmation", async () => {
    mockConfirm.mockReturnValue(true);

    const { result } = renderHook(() =>
      useStagingJobMutations({
        jobId: "test-job",
        initialPropertyId: null,
        initialIsFavorite: false,
        properties: mockProperties,
      })
    );

    let deleteResult: boolean | undefined;
    await act(async () => {
      deleteResult = await result.current.deleteJob();
    });

    expect(mockConfirm).toHaveBeenCalled();
    expect(mockSupabaseDelete).toHaveBeenCalled();
    expect(deleteResult).toBe(true);

    const { toast } = await import("sonner");
    expect(toast.success).toHaveBeenCalledWith("Staging job deleted");
  });

  it("cancels delete when confirmation is rejected", async () => {
    mockConfirm.mockReturnValue(false);

    const { result } = renderHook(() =>
      useStagingJobMutations({
        jobId: "test-job",
        initialPropertyId: null,
        initialIsFavorite: false,
        properties: mockProperties,
      })
    );

    let deleteResult: boolean | undefined;
    await act(async () => {
      deleteResult = await result.current.deleteJob();
    });

    expect(mockConfirm).toHaveBeenCalled();
    expect(mockSupabaseDelete).not.toHaveBeenCalled();
    expect(deleteResult).toBe(false);
  });
});
