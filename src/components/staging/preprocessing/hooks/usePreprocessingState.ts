"use client";

import { useState, useCallback } from "react";
import {
  type PreprocessingState,
  type PreprocessingTool,
  type ImageAdjustments,
  DEFAULT_ADJUSTMENTS,
} from "../types";

const MAX_HISTORY = 10;

interface UsePreprocessingStateReturn {
  state: PreprocessingState;
  setActiveTool: (tool: PreprocessingTool | null) => void;
  setAdjustments: (adjustments: ImageAdjustments) => void;
  setProcessing: (isProcessing: boolean) => void;
  applyChanges: (newImageDataUrl: string) => Promise<File>;
  resetToOriginal: () => void;
  undo: () => void;
  canUndo: boolean;
}

/**
 * Converts a data URL to a File object
 */
async function dataUrlToFile(dataUrl: string, filename: string): Promise<File> {
  const response = await fetch(dataUrl);
  const blob = await response.blob();
  return new File([blob], filename, { type: blob.type });
}

/**
 * Hook for managing preprocessing state
 */
export function usePreprocessingState(
  originalFile: File,
  originalPreview: string
): UsePreprocessingStateReturn {
  const [state, setState] = useState<PreprocessingState>({
    workingImageUrl: null,
    workingImageFile: null,
    originalImageUrl: originalPreview,
    originalImageFile: originalFile,
    activeTool: null,
    isProcessing: false,
    adjustments: DEFAULT_ADJUSTMENTS,
    cropSettings: null,
    maskData: null,
    history: [],
    historyIndex: -1,
  });

  const setActiveTool = useCallback((tool: PreprocessingTool | null) => {
    setState((prev) => ({ ...prev, activeTool: tool }));
  }, []);

  const setAdjustments = useCallback((adjustments: ImageAdjustments) => {
    setState((prev) => ({ ...prev, adjustments }));
  }, []);

  const setProcessing = useCallback((isProcessing: boolean) => {
    setState((prev) => ({ ...prev, isProcessing }));
  }, []);

  const applyChanges = useCallback(
    async (newImageDataUrl: string): Promise<File> => {
      // Create file from data URL
      const timestamp = Date.now();
      const extension = newImageDataUrl.includes("image/png") ? "png" : "jpg";
      const newFile = await dataUrlToFile(
        newImageDataUrl,
        `preprocessed-${timestamp}.${extension}`
      );

      setState((prev) => {
        // Add current working image to history (or original if first change)
        const currentUrl = prev.workingImageUrl || prev.originalImageUrl;
        const newHistory = [...prev.history.slice(0, prev.historyIndex + 1), currentUrl];

        // Limit history size
        if (newHistory.length > MAX_HISTORY) {
          newHistory.shift();
        }

        return {
          ...prev,
          workingImageUrl: newImageDataUrl,
          workingImageFile: newFile,
          history: newHistory,
          historyIndex: newHistory.length - 1,
          activeTool: null,
          adjustments: DEFAULT_ADJUSTMENTS, // Reset adjustments after apply
        };
      });

      return newFile;
    },
    []
  );

  const resetToOriginal = useCallback(() => {
    setState((prev) => ({
      ...prev,
      workingImageUrl: null,
      workingImageFile: null,
      activeTool: null,
      isProcessing: false,
      adjustments: DEFAULT_ADJUSTMENTS,
      cropSettings: null,
      maskData: null,
      history: [],
      historyIndex: -1,
    }));
  }, []);

  const undo = useCallback(() => {
    setState((prev) => {
      if (prev.historyIndex < 0) return prev;

      const previousUrl = prev.history[prev.historyIndex];

      // If going back to first item, reset to original
      if (prev.historyIndex === 0) {
        return {
          ...prev,
          workingImageUrl: null,
          workingImageFile: null,
          historyIndex: -1,
        };
      }

      // Go back one step
      return {
        ...prev,
        workingImageUrl: previousUrl,
        historyIndex: prev.historyIndex - 1,
      };
    });
  }, []);

  const canUndo = state.historyIndex >= 0;

  return {
    state,
    setActiveTool,
    setAdjustments,
    setProcessing,
    applyChanges,
    resetToOriginal,
    undo,
    canUndo,
  };
}
