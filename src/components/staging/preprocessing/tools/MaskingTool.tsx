"use client";

import { useState, useRef, useCallback } from "react";
import { useMaskDrawing } from "../hooks/useMaskDrawing";
import { useContainerSize } from "../hooks/useContainerSize";
import { useImageDimensions } from "../hooks/useImageDimensions";
import { useSegmentation } from "../hooks/useSegmentation";
import {
  MaskCanvas,
  AIDetectionControls,
  BrushControls,
  ToolModeToggle,
} from "./masking";
import { MaskingToolActions } from "./MaskingToolActions";
import { MaskingToolHelp } from "./MaskingToolHelp";

interface MaskingToolProps {
  imageUrl: string;
  onApply: (dataUrl: string, maskDataUrl?: string) => void;
  onCancel: () => void;
  disabled?: boolean;
}

type ToolMode = "ai" | "brush";

export function MaskingTool({
  imageUrl,
  onApply,
  onCancel,
  disabled = false,
}: MaskingToolProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  // Use extracted hooks
  const containerSize = useContainerSize(containerRef);
  const { displaySize } = useImageDimensions(imageUrl, containerSize);
  const {
    isSegmenting,
    segmentError,
    maskUrl: samMaskUrl,
    runSegmentation,
    clearSegmentation,
  } = useSegmentation(imageUrl);

  // Tool state
  const [toolMode, setToolMode] = useState<ToolMode>("ai");
  const [prompt, setPrompt] = useState("");

  // Mask drawing hook (for brush mode)
  const {
    canvasRef,
    isDrawing,
    brushSize,
    mode,
    hasDrawn,
    setBrushSize,
    setMode,
    startDrawing,
    draw,
    stopDrawing,
    clearMask,
    exportMaskForAI,
  } = useMaskDrawing({
    width: displaySize.width,
    height: displaySize.height,
    initialBrushSize: 30,
    initialMode: "stage",
  });

  // Get canvas coordinates for brush mode
  const getCanvasCoords = useCallback(
    (clientX: number, clientY: number) => {
      if (!containerRef.current) return { x: 0, y: 0 };
      const rect = containerRef.current.getBoundingClientRect();
      return {
        x: clientX - rect.left - displaySize.offsetX,
        y: clientY - rect.top - displaySize.offsetY,
      };
    },
    [displaySize]
  );

  // Detection handlers
  const handleDetect = useCallback(() => {
    if (prompt.trim()) {
      runSegmentation(prompt.trim());
    }
  }, [prompt, runSegmentation]);

  const handleQuickPrompt = useCallback(
    (quickPrompt: string) => {
      setPrompt(quickPrompt);
      runSegmentation(quickPrompt);
    },
    [runSegmentation]
  );

  // Mouse handlers for brush mode
  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (disabled || toolMode !== "brush") return;
      const { x, y } = getCanvasCoords(e.clientX, e.clientY);
      if (x >= 0 && x <= displaySize.width && y >= 0 && y <= displaySize.height) {
        startDrawing(x, y);
      }
    },
    [disabled, toolMode, getCanvasCoords, displaySize, startDrawing]
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (toolMode !== "brush" || !isDrawing) return;
      const { x, y } = getCanvasCoords(e.clientX, e.clientY);
      draw(x, y);
    },
    [toolMode, isDrawing, getCanvasCoords, draw]
  );

  const handleMouseUp = useCallback(() => {
    if (toolMode === "brush") stopDrawing();
  }, [toolMode, stopDrawing]);

  const handleMouseLeave = useCallback(() => {
    if (toolMode === "brush" && isDrawing) stopDrawing();
  }, [toolMode, isDrawing, stopDrawing]);

  // Touch handlers
  const handleTouchStart = useCallback(
    (e: React.TouchEvent) => {
      if (disabled || toolMode !== "brush") return;
      e.preventDefault();
      const touch = e.touches[0];
      const { x, y } = getCanvasCoords(touch.clientX, touch.clientY);
      if (x >= 0 && x <= displaySize.width && y >= 0 && y <= displaySize.height) {
        startDrawing(x, y);
      }
    },
    [disabled, toolMode, getCanvasCoords, displaySize, startDrawing]
  );

  const handleTouchMove = useCallback(
    (e: React.TouchEvent) => {
      if (toolMode !== "brush" || !isDrawing) return;
      e.preventDefault();
      const touch = e.touches[0];
      const { x, y } = getCanvasCoords(touch.clientX, touch.clientY);
      draw(x, y);
    },
    [toolMode, isDrawing, getCanvasCoords, draw]
  );

  const handleTouchEnd = useCallback(() => {
    if (toolMode === "brush") stopDrawing();
  }, [toolMode, stopDrawing]);

  // Action handlers
  const handleClear = useCallback(() => {
    clearSegmentation();
    setPrompt("");
    clearMask();
  }, [clearSegmentation, clearMask]);

  const handleApply = useCallback(() => {
    if (samMaskUrl) {
      onApply(imageUrl, samMaskUrl);
    } else {
      const brushMask = exportMaskForAI();
      onApply(imageUrl, brushMask || undefined);
    }
  }, [imageUrl, samMaskUrl, exportMaskForAI, onApply]);

  const hasMask = !!samMaskUrl || hasDrawn;

  return (
    <div className="space-y-3">
      <MaskCanvas
        containerRef={containerRef}
        canvasRef={canvasRef}
        imageUrl={imageUrl}
        displaySize={displaySize}
        toolMode={toolMode}
        brushMode={mode}
        brushSize={brushSize}
        samMaskUrl={samMaskUrl}
        hasMask={hasMask}
        isSegmenting={isSegmenting}
        segmentPrompt={prompt}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      />

      {/* Controls */}
      <div className="p-4 bg-muted/30 rounded-lg border space-y-4">
        <ToolModeToggle mode={toolMode} onChange={setToolMode} disabled={disabled} />

        {toolMode === "ai" && (
          <AIDetectionControls
            prompt={prompt}
            onPromptChange={setPrompt}
            onDetect={handleDetect}
            onQuickPrompt={handleQuickPrompt}
            isSegmenting={isSegmenting}
            disabled={disabled}
          />
        )}

        {toolMode === "brush" && (
          <BrushControls
            mode={mode}
            brushSize={brushSize}
            onModeChange={setMode}
            onBrushSizeChange={setBrushSize}
            disabled={disabled}
          />
        )}

        {segmentError && (
          <div className="p-2 bg-destructive/10 border border-destructive/20 rounded text-xs text-destructive text-center">
            {segmentError}
          </div>
        )}

        <MaskingToolActions
          hasMask={hasMask}
          disabled={disabled}
          onClear={handleClear}
          onCancel={onCancel}
          onApply={handleApply}
        />

        <MaskingToolHelp mode={toolMode} />
      </div>
    </div>
  );
}
