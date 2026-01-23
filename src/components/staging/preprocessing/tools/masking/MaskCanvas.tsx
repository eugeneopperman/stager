"use client";

import { forwardRef, RefObject } from "react";
import Image from "next/image";
import { Loader2, Sparkles, Brush } from "lucide-react";

interface DisplaySize {
  width: number;
  height: number;
  offsetX: number;
  offsetY: number;
}

type ToolMode = "ai" | "brush";
type BrushMode = "stage" | "preserve";

interface MaskCanvasProps {
  containerRef: RefObject<HTMLDivElement | null>;
  canvasRef: RefObject<HTMLCanvasElement | null>;
  imageUrl: string;
  displaySize: DisplaySize;
  toolMode: ToolMode;
  brushMode: BrushMode;
  brushSize: number;
  samMaskUrl: string | null;
  hasMask: boolean;
  isSegmenting: boolean;
  segmentPrompt: string;
  onMouseDown: (e: React.MouseEvent) => void;
  onMouseMove: (e: React.MouseEvent) => void;
  onMouseUp: () => void;
  onMouseLeave: () => void;
  onTouchStart: (e: React.TouchEvent) => void;
  onTouchMove: (e: React.TouchEvent) => void;
  onTouchEnd: () => void;
}

export const MaskCanvas = forwardRef<HTMLDivElement, MaskCanvasProps>(
  function MaskCanvas(
    {
      containerRef,
      canvasRef,
      imageUrl,
      displaySize,
      toolMode,
      brushMode,
      brushSize,
      samMaskUrl,
      hasMask,
      isSegmenting,
      segmentPrompt,
      onMouseDown,
      onMouseMove,
      onMouseUp,
      onMouseLeave,
      onTouchStart,
      onTouchMove,
      onTouchEnd,
    },
    _ref
  ) {
    const brushCursor = toolMode === "brush"
      ? `url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="${brushSize}" height="${brushSize}" viewBox="0 0 ${brushSize} ${brushSize}"><circle cx="${brushSize/2}" cy="${brushSize/2}" r="${brushSize/2 - 1}" fill="none" stroke="${brushMode === 'stage' ? '%2300c800' : '%23c80000'}" stroke-width="2"/></svg>') ${brushSize/2} ${brushSize/2}, crosshair`
      : "default";

    return (
      <div
        ref={containerRef}
        className="relative aspect-video bg-black/90 rounded-lg overflow-hidden"
        style={{ cursor: brushCursor }}
        onMouseDown={onMouseDown}
        onMouseMove={onMouseMove}
        onMouseUp={onMouseUp}
        onMouseLeave={onMouseLeave}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      >
        {/* Background image */}
        <Image
          src={imageUrl}
          alt="Mask preview"
          fill
          className="object-contain pointer-events-none"
          unoptimized
        />

        {/* SAM mask overlay - uses img for precise pixel positioning with inline styles */}
        {samMaskUrl && (
          // eslint-disable-next-line @next/next/no-img-element -- Requires precise pixel positioning via inline styles
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

        {/* Segmenting overlay */}
        {isSegmenting && (
          <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
            <div className="text-center text-white">
              <Loader2 className="h-8 w-8 mx-auto mb-2 animate-spin" />
              <p className="text-sm">Detecting &quot;{segmentPrompt}&quot;...</p>
              <p className="text-xs opacity-70 mt-1">This may take a few seconds</p>
            </div>
          </div>
        )}

        {/* Instructions overlay */}
        {!hasMask && !isSegmenting && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/30 pointer-events-none">
            <div className="text-center text-white">
              {toolMode === "ai" ? (
                <>
                  <Sparkles className="h-8 w-8 mx-auto mb-2 opacity-70" />
                  <p className="text-sm font-medium">Type what to select</p>
                  <p className="text-xs opacity-70">e.g., &quot;sofa, table, chairs&quot;</p>
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
    );
  }
);
