"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import {
  Brush,
  MousePointer2,
  RotateCcw,
  Circle,
  Loader2,
  Plus,
  Minus,
} from "lucide-react";
import { useMaskDrawing, type MaskMode } from "../hooks/useMaskDrawing";

interface MaskingToolProps {
  imageUrl: string;
  onApply: (dataUrl: string, maskDataUrl?: string) => void;
  onCancel: () => void;
  disabled?: boolean;
}

type ToolMode = "click" | "brush";
type ClickMode = "include" | "exclude";

interface ClickPoint {
  x: number;
  y: number;
  label: number; // 1 = include, 0 = exclude
}

export function MaskingTool({
  imageUrl,
  onApply,
  onCancel,
  disabled = false,
}: MaskingToolProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const maskCanvasRef = useRef<HTMLCanvasElement>(null);
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });
  const [imageSize, setImageSize] = useState({ width: 0, height: 0 });
  const [displaySize, setDisplaySize] = useState({ width: 0, height: 0, offsetX: 0, offsetY: 0 });

  // Tool state
  const [toolMode, setToolMode] = useState<ToolMode>("click");
  const [clickMode, setClickMode] = useState<ClickMode>("include");
  const [clickPoints, setClickPoints] = useState<ClickPoint[]>([]);
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

  // Convert screen coordinates to normalized image coordinates (0-1)
  const getNormalizedCoords = useCallback(
    (clientX: number, clientY: number) => {
      if (!containerRef.current || !imageSize.width) return null;
      const rect = containerRef.current.getBoundingClientRect();

      // Get position relative to displayed image
      const relX = clientX - rect.left - displaySize.offsetX;
      const relY = clientY - rect.top - displaySize.offsetY;

      // Check if within image bounds
      if (relX < 0 || relX > displaySize.width || relY < 0 || relY > displaySize.height) {
        return null;
      }

      // Normalize to 0-1 range based on actual image dimensions
      const x = (relX / displaySize.width) * imageSize.width;
      const y = (relY / displaySize.height) * imageSize.height;

      return { x: Math.round(x), y: Math.round(y) };
    },
    [displaySize, imageSize]
  );

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

  // Call SAM API for segmentation
  const runSegmentation = useCallback(async (points: ClickPoint[]) => {
    if (points.length === 0) return;

    setIsSegmenting(true);
    setSegmentError(null);

    try {
      // Convert image to base64
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

      // Call segment API
      const apiResponse = await fetch("/api/segment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          image: base64,
          mimeType,
          points: points.map(p => ({ x: p.x, y: p.y })),
          labels: points.map(p => p.label),
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

  // Handle click in click mode
  const handleImageClick = useCallback(
    (e: React.MouseEvent) => {
      if (disabled || toolMode !== "click" || isSegmenting) return;

      const coords = getNormalizedCoords(e.clientX, e.clientY);
      if (!coords) return;

      const newPoint: ClickPoint = {
        x: coords.x,
        y: coords.y,
        label: clickMode === "include" ? 1 : 0,
      };

      const newPoints = [...clickPoints, newPoint];
      setClickPoints(newPoints);
      runSegmentation(newPoints);
    },
    [disabled, toolMode, isSegmenting, getNormalizedCoords, clickMode, clickPoints, runSegmentation]
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
      if (disabled) return;
      e.preventDefault();
      const touch = e.touches[0];

      if (toolMode === "click" && !isSegmenting) {
        const coords = getNormalizedCoords(touch.clientX, touch.clientY);
        if (coords) {
          const newPoint: ClickPoint = {
            x: coords.x,
            y: coords.y,
            label: clickMode === "include" ? 1 : 0,
          };
          const newPoints = [...clickPoints, newPoint];
          setClickPoints(newPoints);
          runSegmentation(newPoints);
        }
      } else if (toolMode === "brush") {
        const { x, y } = getCanvasCoords(touch.clientX, touch.clientY);
        if (x >= 0 && x <= displaySize.width && y >= 0 && y <= displaySize.height) {
          startDrawing(x, y);
        }
      }
    },
    [disabled, toolMode, isSegmenting, getNormalizedCoords, clickMode, clickPoints, runSegmentation, getCanvasCoords, displaySize, startDrawing]
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

  // Clear all
  const handleClear = useCallback(() => {
    setClickPoints([]);
    setSamMaskUrl(null);
    setSegmentError(null);
    clearMask();
  }, [clearMask]);

  // Handle apply - combine SAM mask with brush edits
  const handleApply = useCallback(() => {
    // If we have a SAM mask, use it; otherwise use brush mask
    if (samMaskUrl) {
      // For SAM masks, the mask is white = selected object
      // We need to invert it for staging: white = stage area
      // Actually, let's just pass it as-is and handle in the staging
      onApply(imageUrl, samMaskUrl);
    } else {
      const brushMask = exportMaskForAI();
      onApply(imageUrl, brushMask || undefined);
    }
  }, [imageUrl, samMaskUrl, exportMaskForAI, onApply]);

  const hasMask = samMaskUrl || hasDrawn;

  // Convert click points to display coordinates for rendering
  const getDisplayPoint = (point: ClickPoint) => {
    return {
      x: (point.x / imageSize.width) * displaySize.width + displaySize.offsetX,
      y: (point.y / imageSize.height) * displaySize.height + displaySize.offsetY,
    };
  };

  return (
    <div className="space-y-3">
      {/* Canvas with image background */}
      <div
        ref={containerRef}
        className="relative aspect-video bg-black/90 rounded-lg overflow-hidden"
        style={{
          cursor: toolMode === "click"
            ? (isSegmenting ? "wait" : "crosshair")
            : `url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="${brushSize}" height="${brushSize}" viewBox="0 0 ${brushSize} ${brushSize}"><circle cx="${brushSize/2}" cy="${brushSize/2}" r="${brushSize/2 - 1}" fill="none" stroke="${mode === 'stage' ? '%2300c800' : '%23c80000'}" stroke-width="2"/></svg>') ${brushSize/2} ${brushSize/2}, crosshair`
        }}
        onClick={toolMode === "click" ? handleImageClick : undefined}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* Background image */}
        <img
          src={imageUrl}
          alt="Mask preview"
          className="w-full h-full object-contain pointer-events-none"
        />

        {/* SAM mask overlay */}
        {samMaskUrl && (
          <img
            src={samMaskUrl}
            alt="Segment mask"
            className="absolute pointer-events-none opacity-50"
            style={{
              left: displaySize.offsetX,
              top: displaySize.offsetY,
              width: displaySize.width,
              height: displaySize.height,
              mixBlendMode: "multiply",
            }}
          />
        )}

        {/* Brush drawing canvas overlay */}
        {toolMode === "brush" && (
          <canvas
            ref={canvasRef}
            className="absolute pointer-events-none"
            style={{
              left: displaySize.offsetX,
              top: displaySize.offsetY,
              width: displaySize.width,
              height: displaySize.height,
            }}
          />
        )}

        {/* Click points visualization */}
        {toolMode === "click" && clickPoints.map((point, i) => {
          const displayPos = getDisplayPoint(point);
          return (
            <div
              key={i}
              className={`absolute w-4 h-4 -ml-2 -mt-2 rounded-full border-2 ${
                point.label === 1
                  ? "bg-green-500/50 border-green-400"
                  : "bg-red-500/50 border-red-400"
              }`}
              style={{ left: displayPos.x, top: displayPos.y }}
            />
          );
        })}

        {/* Segmenting overlay */}
        {isSegmenting && (
          <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
            <div className="text-center text-white">
              <Loader2 className="h-8 w-8 mx-auto mb-2 animate-spin" />
              <p className="text-sm">Detecting object...</p>
            </div>
          </div>
        )}

        {/* Instructions overlay */}
        {!hasMask && !isSegmenting && clickPoints.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/30 pointer-events-none">
            <div className="text-center text-white">
              {toolMode === "click" ? (
                <>
                  <MousePointer2 className="h-8 w-8 mx-auto mb-2 opacity-70" />
                  <p className="text-sm font-medium">Click on objects to select</p>
                  <p className="text-xs opacity-70">AI will detect and mask them</p>
                </>
              ) : (
                <>
                  <Brush className="h-8 w-8 mx-auto mb-2 opacity-70" />
                  <p className="text-sm font-medium">Paint areas to mark</p>
                  <p className="text-xs opacity-70">Green = Stage, Red = Preserve</p>
                </>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="p-4 bg-muted/30 rounded-lg border space-y-4">
        {/* Tool Mode Toggle */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground w-16">Tool</span>
          <div className="flex gap-1 flex-1">
            <Button
              variant={toolMode === "click" ? "default" : "outline"}
              size="sm"
              onClick={() => setToolMode("click")}
              disabled={disabled}
              className="flex-1 gap-1.5"
            >
              <MousePointer2 className="h-4 w-4" />
              Click
            </Button>
            <Button
              variant={toolMode === "brush" ? "default" : "outline"}
              size="sm"
              onClick={() => setToolMode("brush")}
              disabled={disabled}
              className="flex-1 gap-1.5"
            >
              <Brush className="h-4 w-4" />
              Brush
            </Button>
          </div>
        </div>

        {/* Click mode controls */}
        {toolMode === "click" && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground w-16">Action</span>
            <div className="flex gap-1 flex-1">
              <Button
                variant={clickMode === "include" ? "default" : "outline"}
                size="sm"
                onClick={() => setClickMode("include")}
                disabled={disabled}
                className={`flex-1 gap-1.5 ${clickMode === "include" ? "bg-green-600 hover:bg-green-700" : ""}`}
              >
                <Plus className="h-4 w-4" />
                Include
              </Button>
              <Button
                variant={clickMode === "exclude" ? "default" : "outline"}
                size="sm"
                onClick={() => setClickMode("exclude")}
                disabled={disabled}
                className={`flex-1 gap-1.5 ${clickMode === "exclude" ? "bg-red-600 hover:bg-red-700" : ""}`}
              >
                <Minus className="h-4 w-4" />
                Exclude
              </Button>
            </div>
          </div>
        )}

        {/* Brush mode controls */}
        {toolMode === "brush" && (
          <>
            {/* Mode Toggle */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground w-16">Mode</span>
              <div className="flex gap-1 flex-1">
                <Button
                  variant={mode === "stage" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setMode("stage")}
                  disabled={disabled}
                  className={`flex-1 gap-1.5 ${mode === "stage" ? "bg-green-600 hover:bg-green-700" : ""}`}
                >
                  <div className="w-3 h-3 rounded-full bg-green-500" />
                  Stage
                </Button>
                <Button
                  variant={mode === "preserve" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setMode("preserve")}
                  disabled={disabled}
                  className={`flex-1 gap-1.5 ${mode === "preserve" ? "bg-red-600 hover:bg-red-700" : ""}`}
                >
                  <div className="w-3 h-3 rounded-full bg-red-500" />
                  Preserve
                </Button>
              </div>
            </div>

            {/* Brush Size */}
            <div className="flex items-center gap-3">
              <span className="text-xs text-muted-foreground w-16">Brush</span>
              <Circle className="h-3 w-3 text-muted-foreground" />
              <Slider
                value={[brushSize]}
                onValueChange={(v) => setBrushSize(v[0])}
                min={10}
                max={100}
                step={5}
                disabled={disabled}
                className="flex-1"
              />
              <Circle className="h-5 w-5 text-muted-foreground" />
              <span className="text-xs text-muted-foreground w-8 text-right">{brushSize}px</span>
            </div>
          </>
        )}

        {/* Error message */}
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
            disabled={disabled || (!hasMask && clickPoints.length === 0)}
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

        {/* Help text */}
        <p className="text-xs text-muted-foreground text-center">
          {toolMode === "click" ? (
            <>Click objects to select them. Use <strong>Include</strong> to add, <strong>Exclude</strong> to remove.</>
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
