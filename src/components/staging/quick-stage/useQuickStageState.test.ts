import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import { useQuickStageState } from "./useQuickStageState";
import { createTestWrapper } from "@/test/utils";

// Mock dependencies
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    refresh: vi.fn(),
    push: vi.fn(),
  }),
  useSearchParams: () => new URLSearchParams(),
}));

vi.mock("@/contexts/DashboardContext", () => ({
  useDashboard: () => ({
    credits: 100,
    refreshCredits: vi.fn(),
  }),
}));

vi.mock("@/hooks", () => ({
  useStagingSubmit: () => ({
    variations: [],
    isProcessing: false,
    processingIndex: -1,
    error: null,
    setError: vi.fn(),
    currentProvider: null,
    submitStaging: vi.fn(),
    resetStaging: vi.fn(),
  }),
}));

describe("useQuickStageState", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("initializes with default state", () => {
    const { result } = renderHook(() => useQuickStageState(), {
      wrapper: createTestWrapper(),
    });

    expect(result.current.state).toBe("upload");
    expect(result.current.selectedFile).toBeNull();
    expect(result.current.preview).toBeNull();
    expect(result.current.roomType).toBeNull();
    expect(result.current.styles).toEqual([]);
    expect(result.current.propertyId).toBeNull();
  });

  it("has correct credit calculations", () => {
    const { result } = renderHook(() => useQuickStageState(), {
      wrapper: createTestWrapper(),
    });

    expect(result.current.credits).toBe(100);
    expect(result.current.requiredCredits).toBe(0); // No styles selected
    expect(result.current.hasEnoughCredits).toBe(true);
  });

  it("updates required credits when styles change", () => {
    const { result } = renderHook(() => useQuickStageState(), {
      wrapper: createTestWrapper(),
    });

    act(() => {
      result.current.setStyles(["modern", "scandinavian"]);
    });

    // 2 styles × credits per staging
    expect(result.current.styles).toHaveLength(2);
    expect(result.current.requiredCredits).toBeGreaterThan(0);
  });

  it("handles image selection", () => {
    const { result } = renderHook(() => useQuickStageState(), {
      wrapper: createTestWrapper(),
    });

    const mockFile = new File(["test"], "test.jpg", { type: "image/jpeg" });
    const mockPreviewUrl = "blob:http://localhost/test";

    act(() => {
      result.current.handleImageSelect(mockFile, mockPreviewUrl);
    });

    expect(result.current.selectedFile).toBe(mockFile);
    expect(result.current.preview).toBe(mockPreviewUrl);
  });

  it("handles image clear", () => {
    const { result } = renderHook(() => useQuickStageState(), {
      wrapper: createTestWrapper(),
    });

    // First select an image
    const mockFile = new File(["test"], "test.jpg", { type: "image/jpeg" });
    act(() => {
      result.current.handleImageSelect(mockFile, "blob:test");
    });

    expect(result.current.selectedFile).not.toBeNull();

    // Now clear it
    act(() => {
      result.current.handleImageClear();
    });

    expect(result.current.selectedFile).toBeNull();
    expect(result.current.preview).toBeNull();
    expect(result.current.workingFile).toBeNull();
    expect(result.current.workingPreview).toBeNull();
    expect(result.current.maskDataUrl).toBeNull();
  });

  it("handles preprocessed image update", () => {
    const { result } = renderHook(() => useQuickStageState(), {
      wrapper: createTestWrapper(),
    });

    const mockFile = new File(["processed"], "processed.jpg", {
      type: "image/jpeg",
    });
    const mockPreviewUrl = "blob:http://localhost/processed";

    act(() => {
      result.current.handlePreprocessedImageUpdate(mockFile, mockPreviewUrl);
    });

    expect(result.current.workingFile).toBe(mockFile);
    expect(result.current.workingPreview).toBe(mockPreviewUrl);
  });

  it("handles mask update", () => {
    const { result } = renderHook(() => useQuickStageState(), {
      wrapper: createTestWrapper(),
    });

    const maskUrl = "data:image/png;base64,test";

    act(() => {
      result.current.handleMaskUpdate(maskUrl);
    });

    expect(result.current.maskDataUrl).toBe(maskUrl);

    // Clear mask
    act(() => {
      result.current.handleMaskUpdate(null);
    });

    expect(result.current.maskDataUrl).toBeNull();
  });

  it("sets room type", () => {
    const { result } = renderHook(() => useQuickStageState(), {
      wrapper: createTestWrapper(),
    });

    act(() => {
      result.current.setRoomType("living-room");
    });

    expect(result.current.roomType).toBe("living-room");
  });

  it("sets property id", () => {
    const { result } = renderHook(() => useQuickStageState(), {
      wrapper: createTestWrapper(),
    });

    act(() => {
      result.current.setPropertyId("property-123");
    });

    expect(result.current.propertyId).toBe("property-123");
  });

  it("resets state correctly", () => {
    const { result } = renderHook(() => useQuickStageState(), {
      wrapper: createTestWrapper(),
    });

    // Set some state
    const mockFile = new File(["test"], "test.jpg", { type: "image/jpeg" });
    act(() => {
      result.current.handleImageSelect(mockFile, "blob:test");
      result.current.setRoomType("bedroom");
      result.current.setStyles(["modern"]);
      result.current.setPropertyId("prop-1");
    });

    // Verify state was set
    expect(result.current.selectedFile).not.toBeNull();
    expect(result.current.roomType).toBe("bedroom");

    // Reset
    act(() => {
      result.current.handleReset();
    });

    expect(result.current.selectedFile).toBeNull();
    expect(result.current.preview).toBeNull();
    expect(result.current.roomType).toBeNull();
    expect(result.current.styles).toEqual([]);
    expect(result.current.compareIndex).toBe(0);
  });

  it("canStage is false when requirements not met", () => {
    const { result } = renderHook(() => useQuickStageState(), {
      wrapper: createTestWrapper(),
    });

    // Initially cannot stage
    expect(result.current.canStage).toBe(false);

    // Add file
    const mockFile = new File(["test"], "test.jpg", { type: "image/jpeg" });
    act(() => {
      result.current.handleImageSelect(mockFile, "blob:test");
    });

    expect(result.current.canStage).toBe(false); // Still missing room type and styles

    // Add room type
    act(() => {
      result.current.setRoomType("living-room");
    });

    expect(result.current.canStage).toBe(false); // Still missing styles

    // Add styles
    act(() => {
      result.current.setStyles(["modern"]);
    });

    expect(result.current.canStage).toBe(true); // Now can stage
  });

  it("returns correct style label", () => {
    const { result } = renderHook(() => useQuickStageState(), {
      wrapper: createTestWrapper(),
    });

    const label = result.current.getStyleLabel("modern");
    expect(typeof label).toBe("string");
    expect(label.length).toBeGreaterThan(0);
  });

  it("handles download without error", async () => {
    const { result } = renderHook(() => useQuickStageState(), {
      wrapper: createTestWrapper(),
    });

    // Set room type for filename generation
    act(() => {
      result.current.setRoomType("living-room");
    });

    // Mock document methods for download
    const createElementSpy = vi.spyOn(document, "createElement");
    const appendChildSpy = vi.spyOn(document.body, "appendChild");
    const removeChildSpy = vi.spyOn(document.body, "removeChild");

    const mockLink = {
      href: "",
      download: "",
      click: vi.fn(),
    };
    createElementSpy.mockReturnValue(mockLink as unknown as HTMLElement);
    appendChildSpy.mockImplementation(() => mockLink as unknown as Node);
    removeChildSpy.mockImplementation(() => mockLink as unknown as Node);

    // Test download with imageUrl
    act(() => {
      result.current.handleDownload({
        style: "modern",
        imageUrl: "https://example.com/image.png",
      });
    });

    expect(mockLink.click).toHaveBeenCalled();
    expect(mockLink.href).toBe("https://example.com/image.png");

    // Cleanup
    createElementSpy.mockRestore();
    appendChildSpy.mockRestore();
    removeChildSpy.mockRestore();
  });

  it("does not download when imageUrl is null", () => {
    const { result } = renderHook(() => useQuickStageState(), {
      wrapper: createTestWrapper(),
    });

    const createElementSpy = vi.spyOn(document, "createElement");

    act(() => {
      result.current.handleDownload({
        style: "modern",
        imageUrl: null,
      });
    });

    // Should not create a link element when no imageUrl
    expect(createElementSpy).not.toHaveBeenCalled();

    createElementSpy.mockRestore();
  });
});
