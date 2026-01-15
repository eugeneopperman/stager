"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import {
  Brush,
  Eraser,
  RotateCcw,
  Circle,
} from "lucide-react";
import { useMaskDrawing, type MaskMode } from "../hooks/useMaskDrawing";

interface MaskingToolProps {
  imageUrl: string;
  onApply: (dataUrl: string, maskDataUrl?: string) => void;
  onCancel: () => void;
  disabled?: boolean;
}

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

  // Mask drawing hook
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
    getMaskDataUrl,
    exportMaskForAI,
  } = useMaskDrawing({
    width: displaySize.width,
    height: displaySize.height,
    initialBrushSize: 30,
    initialMode: "preserve",
  });

  // Convert screen coordinates to canvas coordinates
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

  // Mouse handlers
  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (disabled) return;
      const { x, y } = getCanvasCoords(e.clientX, e.clientY);
      if (x >= 0 && x <= displaySize.width && y >= 0 && y <= displaySize.height) {
        startDrawing(x, y);
      }
    },
    [disabled, getCanvasCoords, displaySize, startDrawing]
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!isDrawing) return;
      const { x, y } = getCanvasCoords(e.clientX, e.clientY);
      draw(x, y);
    },
    [isDrawing, getCanvasCoords, draw]
  );

  const handleMouseUp = useCallback(() => {
    stopDrawing();
  }, [stopDrawing]);

  const handleMouseLeave = useCallback(() => {
    if (isDrawing) {
      stopDrawing();
    }
  }, [isDrawing, stopDrawing]);

  // Touch handlers
  const handleTouchStart = useCallback(
    (e: React.TouchEvent) => {
      if (disabled) return;
      e.preventDefault();
      const touch = e.touches[0];
      const { x, y } = getCanvasCoords(touch.clientX, touch.clientY);
      if (x >= 0 && x <= displaySize.width && y >= 0 && y <= displaySize.height) {
        startDrawing(x, y);
      }
    },
    [disabled, getCanvasCoords, displaySize, startDrawing]
  );

  const handleTouchMove = useCallback(
    (e: React.TouchEvent) => {
      if (!isDrawing) return;
      e.preventDefault();
      const touch = e.touches[0];
      const { x, y } = getCanvasCoords(touch.clientX, touch.clientY);
      draw(x, y);
    },
    [isDrawing, getCanvasCoords, draw]
  );

  const handleTouchEnd = useCallback(() => {
    stopDrawing();
  }, [stopDrawing]);

  // Handle apply - for now just pass the image through
  // In future, could composite mask onto image or pass mask separately
  const handleApply = useCallback(() => {
    const maskDataUrl = exportMaskForAI();
    onApply(imageUrl, maskDataUrl || undefined);
  }, [imageUrl, exportMaskForAI, onApply]);

  return (
    <div className="space-y-4">
      {/* Canvas with image background */}
      <div
        ref={containerRef}
        className="relative aspect-video bg-black/90 rounded-lg overflow-hidden"
        style={{ cursor: `url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="${brushSize}" height="${brushSize}" viewBox="0 0 ${brushSize} ${brushSize}"><circle cx="${brushSize/2}" cy="${brushSize/2}" r="${brushSize/2 - 1}" fill="none" stroke="${mode === 'stage' ? '%2300c800' : '%23c80000'}" stroke-width="2"/></svg>') ${brushSize/2} ${brushSize/2}, crosshair` }}
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

        {/* Drawing canvas overlay */}
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

        {/* Instructions overlay */}
        {!hasDrawn && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/30 pointer-events-none">
            <div className="text-center text-white">
              <Brush className="h-8 w-8 mx-auto mb-2 opacity-70" />
              <p className="text-sm font-medium">Paint areas to mark</p>
              <p className="text-xs opacity-70">Green = Stage, Red = Preserve</p>
            </div>
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="p-4 bg-muted/30 rounded-lg border space-y-4">
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

        {/* Action Buttons */}
        <div className="flex gap-2 pt-2 border-t">
          <Button
            variant="ghost"
            size="sm"
            onClick={clearMask}
            disabled={disabled || !hasDrawn}
            className="gap-1"
          >
            <RotateCcw className="h-3 w-3" />
            Clear
          </Button>
          <div className="flex-1" />
          <Button variant="outline" size="sm" onClick={onCancel} disabled={disabled}>
            Cancel
          </Button>
          <Button size="sm" onClick={handleApply} disabled={disabled || !hasDrawn}>
            Apply Mask
          </Button>
        </div>

        {/* Help text */}
        <p className="text-xs text-muted-foreground text-center">
          <span className="text-green-600 font-medium">Green</span> areas will be staged with furniture.{" "}
          <span className="text-red-600 font-medium">Red</span> areas will be preserved as-is.
        </p>
      </div>
    </div>
  );
}
