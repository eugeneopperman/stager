"use client";

import { useRef, useState, useCallback, useEffect } from "react";

export type MaskMode = "stage" | "preserve";

interface UseMaskDrawingOptions {
  width: number;
  height: number;
  initialBrushSize?: number;
  initialMode?: MaskMode;
}

interface UseMaskDrawingReturn {
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  isDrawing: boolean;
  brushSize: number;
  mode: MaskMode;
  hasDrawn: boolean;
  setBrushSize: (size: number) => void;
  setMode: (mode: MaskMode) => void;
  startDrawing: (x: number, y: number) => void;
  draw: (x: number, y: number) => void;
  stopDrawing: () => void;
  clearMask: () => void;
  getMaskDataUrl: () => string | null;
  // Get the mask as a black/white image for AI inpainting
  exportMaskForAI: () => string | null;
}

/**
 * Hook for managing mask drawing on a canvas
 */
export function useMaskDrawing({
  width,
  height,
  initialBrushSize = 30,
  initialMode = "preserve",
}: UseMaskDrawingOptions): UseMaskDrawingReturn {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [brushSize, setBrushSize] = useState(initialBrushSize);
  const [mode, setMode] = useState<MaskMode>(initialMode);
  const [hasDrawn, setHasDrawn] = useState(false);
  const lastPoint = useRef<{ x: number; y: number } | null>(null);

  // Initialize canvas when dimensions change
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || width === 0 || height === 0) return;

    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext("2d");
    if (ctx) {
      // Clear with transparent background
      ctx.clearRect(0, 0, width, height);
    }
  }, [width, height]);

  const getColor = useCallback((m: MaskMode) => {
    // Green = stage this area, Red = preserve/keep original
    return m === "stage" ? "rgba(0, 200, 0, 0.4)" : "rgba(200, 0, 0, 0.4)";
  }, []);

  const drawCircle = useCallback(
    (x: number, y: number) => {
      const canvas = canvasRef.current;
      const ctx = canvas?.getContext("2d");
      if (!ctx) return;

      ctx.globalCompositeOperation = "source-over";
      ctx.fillStyle = getColor(mode);
      ctx.beginPath();
      ctx.arc(x, y, brushSize / 2, 0, Math.PI * 2);
      ctx.fill();
    },
    [brushSize, mode, getColor]
  );

  const drawLine = useCallback(
    (fromX: number, fromY: number, toX: number, toY: number) => {
      const canvas = canvasRef.current;
      const ctx = canvas?.getContext("2d");
      if (!ctx) return;

      ctx.globalCompositeOperation = "source-over";
      ctx.strokeStyle = getColor(mode);
      ctx.lineWidth = brushSize;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.beginPath();
      ctx.moveTo(fromX, fromY);
      ctx.lineTo(toX, toY);
      ctx.stroke();
    },
    [brushSize, mode, getColor]
  );

  const startDrawing = useCallback(
    (x: number, y: number) => {
      setIsDrawing(true);
      setHasDrawn(true);
      lastPoint.current = { x, y };
      drawCircle(x, y);
    },
    [drawCircle]
  );

  const draw = useCallback(
    (x: number, y: number) => {
      if (!isDrawing) return;

      if (lastPoint.current) {
        drawLine(lastPoint.current.x, lastPoint.current.y, x, y);
      }
      lastPoint.current = { x, y };
    },
    [isDrawing, drawLine]
  );

  const stopDrawing = useCallback(() => {
    setIsDrawing(false);
    lastPoint.current = null;
  }, []);

  const clearMask = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!ctx || !canvas) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasDrawn(false);
  }, []);

  const getMaskDataUrl = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    return canvas.toDataURL("image/png");
  }, []);

  /**
   * Export mask as black/white image for AI inpainting
   * White = areas to stage (or preserve, depending on AI expectations)
   * Black = areas to keep as-is
   */
  const exportMaskForAI = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return null;

    const ctx = canvas.getContext("2d");
    if (!ctx) return null;

    // Create a new canvas for the B/W mask
    const maskCanvas = document.createElement("canvas");
    maskCanvas.width = canvas.width;
    maskCanvas.height = canvas.height;
    const maskCtx = maskCanvas.getContext("2d");
    if (!maskCtx) return null;

    // Start with black background (areas to keep)
    maskCtx.fillStyle = "black";
    maskCtx.fillRect(0, 0, maskCanvas.width, maskCanvas.height);

    // Get the drawn mask data
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const maskImageData = maskCtx.getImageData(0, 0, maskCanvas.width, maskCanvas.height);

    // Convert colored mask to B/W
    // Green (stage) -> White, Red (preserve) -> Black
    for (let i = 0; i < imageData.data.length; i += 4) {
      const r = imageData.data[i];
      const g = imageData.data[i + 1];
      const a = imageData.data[i + 3];

      if (a > 0) {
        // There's something drawn here
        if (g > r) {
          // Green = stage this area = white in mask
          maskImageData.data[i] = 255;
          maskImageData.data[i + 1] = 255;
          maskImageData.data[i + 2] = 255;
          maskImageData.data[i + 3] = 255;
        }
        // Red = preserve = stays black
      }
    }

    maskCtx.putImageData(maskImageData, 0, 0);
    return maskCanvas.toDataURL("image/png");
  }, []);

  return {
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
  };
}
