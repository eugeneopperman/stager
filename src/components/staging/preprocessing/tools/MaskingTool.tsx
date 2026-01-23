"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { RotateCcw } from "lucide-react";
import { useMaskDrawing } from "../hooks/useMaskDrawing";
import {
  MaskCanvas,
  AIDetectionControls,
  BrushControls,
  ToolModeToggle,
} from "./masking";

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
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });
  const [imageSize, setImageSize] = useState({ width: 0, height: 0 });
  const [displaySize, setDisplaySize] = useState({ width: 0, height: 0, offsetX: 0, offsetY: 0 });

  // Tool state
  const [toolMode, setToolMode] = useState<ToolMode>("ai");
  const [prompt, setPrompt] = useState("");
  const [isSegmenting, setIsSegmenting] = useState(false);
  const [segmentError, setSegmentError] = useState<string | null>(null);
  const [samMaskUrl, setSamMaskUrl] = useState<string | null>(null);

  // Track container size
  useEffect(() => {
    const updateSize = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        setContainerSize({ width: rect.width, height: rect.height });
      }
    };
    updateSize();
    window.addEventListener("resize", updateSize);
    return () => window.removeEventListener("resize", updateSize);
  }, []);

  // Load image dimensions
  useEffect(() => {
    const img = new Image();
    img.onload = () => {
      setImageSize({ width: img.naturalWidth, height: img.naturalHeight });
    };
    img.src = imageUrl;
  }, [imageUrl]);

  // Calculate displayed image size (object-contain behavior)
  useEffect(() => {
    if (!imageSize.width || !containerSize.width) return;

    const containerAspect = containerSize.width / containerSize.height;
    const imageAspect = imageSize.width / imageSize.height;

    let displayWidth: number, displayHeight: number;

    if (imageAspect > containerAspect) {
      displayWidth = containerSize.width;
      displayHeight = containerSize.width / imageAspect;
    } else {
      displayHeight = containerSize.height;
      displayWidth = containerSize.height * imageAspect;
    }

    const offsetX = (containerSize.width - displayWidth) / 2;
    const offsetY = (containerSize.height - displayHeight) / 2;

    setDisplaySize({ width: displayWidth, height: displayHeight, offsetX, offsetY });
  }, [imageSize, containerSize]);

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

  // Run AI segmentation with text prompt
  const runSegmentation = useCallback(async (textPrompt: string) => {
    if (!textPrompt.trim()) return;

    setIsSegmenting(true);
    setSegmentError(null);

    try {
      let base64: string;
      let mimeType: string;

      if (imageUrl.startsWith("data:")) {
        const matches = imageUrl.match(/^data:([^;]+);base64,(.+)$/);
        if (matches) {
          mimeType = matches[1];
          base64 = matches[2];
        } else {
          throw new Error("Invalid data URL");
        }
      } else {
        const response = await fetch(imageUrl);
        const blob = await response.blob();
        mimeType = blob.type || "image/png";
        base64 = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => {
            const result = reader.result as string;
            resolve(result.split(",")[1]);
          };
          reader.onerror = reject;
          reader.readAsDataURL(blob);
        });
      }

      const apiResponse = await fetch("/api/segment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          image: base64,
          mimeType,
          prompt: textPrompt,
        }),
      });

      const data = await apiResponse.json();

      if (!apiResponse.ok) {
        throw new Error(data.error || "Segmentation failed");
      }

      if (data.maskDataUrl) {
        setSamMaskUrl(data.maskDataUrl);
      }
    } catch (err) {
      console.error("[MaskingTool] Segmentation error:", err);
      setSegmentError(err instanceof Error ? err.message : "Segmentation failed");
    } finally {
      setIsSegmenting(false);
    }
  }, [imageUrl]);

  const handleDetect = useCallback(() => {
    if (prompt.trim()) {
      runSegmentation(prompt.trim());
    }
  }, [prompt, runSegmentation]);

  const handleQuickPrompt = useCallback((quickPrompt: string) => {
    setPrompt(quickPrompt);
    runSegmentation(quickPrompt);
  }, [runSegmentation]);

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

  const handleClear = useCallback(() => {
    setSamMaskUrl(null);
    setSegmentError(null);
    setPrompt("");
    clearMask();
  }, [clearMask]);

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
        <ToolModeToggle
          mode={toolMode}
          onChange={setToolMode}
          disabled={disabled}
        />

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

        {/* Action Buttons */}
        <div className="flex gap-2 pt-2 border-t">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClear}
            disabled={disabled || !hasMask}
            className="gap-1"
          >
            <RotateCcw className="h-3 w-3" />
            Clear
          </Button>
          <div className="flex-1" />
          <Button variant="outline" size="sm" onClick={onCancel} disabled={disabled}>
            Cancel
          </Button>
          <Button size="sm" onClick={handleApply} disabled={disabled || !hasMask}>
            Apply Mask
          </Button>
        </div>

        <p className="text-xs text-muted-foreground text-center">
          {toolMode === "ai" ? (
            <>Type object names and click <strong>Detect</strong> to auto-select them.</>
          ) : (
            <>
              <span className="text-green-600 font-medium">Green</span> areas will be staged.{" "}
              <span className="text-red-600 font-medium">Red</span> areas preserved.
            </>
          )}
        </p>
      </div>
    </div>
  );
}
