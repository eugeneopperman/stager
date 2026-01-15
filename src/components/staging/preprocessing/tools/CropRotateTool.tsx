"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  RotateCw,
  RotateCcw,
  FlipHorizontal,
  FlipVertical,
  RotateCcw as ResetIcon,
  Square,
  RectangleHorizontal,
  Monitor,
} from "lucide-react";
import { useImageCanvas, type CropArea, type RotationDegrees } from "../hooks/useImageCanvas";

type AspectRatio = "free" | "1:1" | "4:3" | "16:9";

interface CropRotateToolProps {
  imageUrl: string;
  onApply: (dataUrl: string) => void;
  onCancel: () => void;
  disabled?: boolean;
}

const ASPECT_RATIOS: { id: AspectRatio; label: string; icon: React.ElementType; ratio: number | null }[] = [
  { id: "free", label: "Free", icon: RectangleHorizontal, ratio: null },
  { id: "1:1", label: "1:1", icon: Square, ratio: 1 },
  { id: "4:3", label: "4:3", icon: RectangleHorizontal, ratio: 4 / 3 },
  { id: "16:9", label: "16:9", icon: Monitor, ratio: 16 / 9 },
];

export function CropRotateTool({
  imageUrl,
  onApply,
  onCancel,
  disabled = false,
}: CropRotateToolProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const { rotateImage, flipImage, cropImage, getImageDimensions } = useImageCanvas();

  // Current working image (after rotations/flips)
  const [workingUrl, setWorkingUrl] = useState(imageUrl);
  const [rotation, setRotation] = useState<RotationDegrees>(0);

  // Image dimensions
  const [imageDimensions, setImageDimensions] = useState({ width: 0, height: 0 });
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });

  // Crop state (in percentage of displayed image)
  const [cropPercent, setCropPercent] = useState({ x: 10, y: 10, width: 80, height: 80 });
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>("free");
  const [isDragging, setIsDragging] = useState(false);
  const [dragType, setDragType] = useState<"move" | "nw" | "ne" | "sw" | "se" | "n" | "s" | "e" | "w" | null>(null);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [cropStart, setCropStart] = useState({ x: 0, y: 0, width: 0, height: 0 });

  // Load image dimensions
  useEffect(() => {
    getImageDimensions(workingUrl).then(setImageDimensions);
  }, [workingUrl, getImageDimensions]);

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

  // Calculate displayed image size (object-contain)
  const getDisplayedImageSize = useCallback(() => {
    if (!imageDimensions.width || !containerSize.width) {
      return { width: 0, height: 0, offsetX: 0, offsetY: 0 };
    }

    const containerAspect = containerSize.width / containerSize.height;
    const imageAspect = imageDimensions.width / imageDimensions.height;

    let displayWidth: number, displayHeight: number;

    if (imageAspect > containerAspect) {
      // Image is wider - fit to width
      displayWidth = containerSize.width;
      displayHeight = containerSize.width / imageAspect;
    } else {
      // Image is taller - fit to height
      displayHeight = containerSize.height;
      displayWidth = containerSize.height * imageAspect;
    }

    const offsetX = (containerSize.width - displayWidth) / 2;
    const offsetY = (containerSize.height - displayHeight) / 2;

    return { width: displayWidth, height: displayHeight, offsetX, offsetY };
  }, [imageDimensions, containerSize]);

  const displaySize = getDisplayedImageSize();

  // Handle rotation
  const handleRotate = useCallback(
    async (direction: "cw" | "ccw") => {
      const degrees = direction === "cw" ? 90 : -90;
      const newRotation = (((rotation + degrees) % 360) + 360) % 360 as RotationDegrees;
      setRotation(newRotation);

      const rotated = await rotateImage(workingUrl, direction === "cw" ? 90 : 270);
      setWorkingUrl(rotated);

      // Reset crop to full image after rotation
      setCropPercent({ x: 10, y: 10, width: 80, height: 80 });
    },
    [workingUrl, rotation, rotateImage]
  );

  // Handle flip
  const handleFlip = useCallback(
    async (direction: "horizontal" | "vertical") => {
      const flipped = await flipImage(workingUrl, direction);
      setWorkingUrl(flipped);
    },
    [workingUrl, flipImage]
  );

  // Handle aspect ratio change
  const handleAspectRatioChange = useCallback(
    (ratio: AspectRatio) => {
      setAspectRatio(ratio);

      const targetRatio = ASPECT_RATIOS.find((r) => r.id === ratio)?.ratio;
      if (!targetRatio) return; // Free ratio, don't adjust

      // Adjust crop to match aspect ratio, keeping it centered
      const currentCenterX = cropPercent.x + cropPercent.width / 2;
      const currentCenterY = cropPercent.y + cropPercent.height / 2;

      // Calculate new dimensions based on image aspect ratio
      const imageAspect = imageDimensions.width / imageDimensions.height;
      const cropAspectInPercent = targetRatio / imageAspect;

      let newWidth = cropPercent.width;
      let newHeight = cropPercent.height;

      if (cropAspectInPercent > cropPercent.width / cropPercent.height) {
        // Need to increase width or decrease height
        newHeight = newWidth / cropAspectInPercent;
      } else {
        // Need to increase height or decrease width
        newWidth = newHeight * cropAspectInPercent;
      }

      // Keep within bounds
      newWidth = Math.min(newWidth, 100);
      newHeight = Math.min(newHeight, 100);

      // Center the new crop
      let newX = currentCenterX - newWidth / 2;
      let newY = currentCenterY - newHeight / 2;

      // Clamp to bounds
      newX = Math.max(0, Math.min(100 - newWidth, newX));
      newY = Math.max(0, Math.min(100 - newHeight, newY));

      setCropPercent({ x: newX, y: newY, width: newWidth, height: newHeight });
    },
    [cropPercent, imageDimensions]
  );

  // Mouse/touch handlers for crop manipulation
  const handleMouseDown = useCallback(
    (e: React.MouseEvent, type: typeof dragType) => {
      if (disabled) return;
      e.preventDefault();
      setIsDragging(true);
      setDragType(type);
      setDragStart({ x: e.clientX, y: e.clientY });
      setCropStart(cropPercent);
    },
    [disabled, cropPercent]
  );

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!isDragging || !dragType) return;

      const deltaX = ((e.clientX - dragStart.x) / displaySize.width) * 100;
      const deltaY = ((e.clientY - dragStart.y) / displaySize.height) * 100;

      const targetRatio = ASPECT_RATIOS.find((r) => r.id === aspectRatio)?.ratio;
      const imageAspect = imageDimensions.width / imageDimensions.height;
      const aspectInPercent = targetRatio ? targetRatio / imageAspect : null;

      let newCrop = { ...cropStart };

      if (dragType === "move") {
        newCrop.x = Math.max(0, Math.min(100 - cropStart.width, cropStart.x + deltaX));
        newCrop.y = Math.max(0, Math.min(100 - cropStart.height, cropStart.y + deltaY));
      } else {
        // Handle resize
        if (dragType.includes("e")) {
          newCrop.width = Math.max(10, Math.min(100 - cropStart.x, cropStart.width + deltaX));
        }
        if (dragType.includes("w")) {
          const newWidth = Math.max(10, cropStart.width - deltaX);
          const maxWidth = cropStart.x + cropStart.width;
          newCrop.width = Math.min(newWidth, maxWidth);
          newCrop.x = cropStart.x + cropStart.width - newCrop.width;
        }
        if (dragType.includes("s")) {
          newCrop.height = Math.max(10, Math.min(100 - cropStart.y, cropStart.height + deltaY));
        }
        if (dragType.includes("n")) {
          const newHeight = Math.max(10, cropStart.height - deltaY);
          const maxHeight = cropStart.y + cropStart.height;
          newCrop.height = Math.min(newHeight, maxHeight);
          newCrop.y = cropStart.y + cropStart.height - newCrop.height;
        }

        // Enforce aspect ratio if set (we're in resize mode, not move)
        if (aspectInPercent) {
          if (dragType.includes("e") || dragType.includes("w")) {
            newCrop.height = newCrop.width / aspectInPercent;
          } else {
            newCrop.width = newCrop.height * aspectInPercent;
          }
          // Clamp
          if (newCrop.x + newCrop.width > 100) newCrop.width = 100 - newCrop.x;
          if (newCrop.y + newCrop.height > 100) newCrop.height = 100 - newCrop.y;
        }
      }

      setCropPercent(newCrop);
    },
    [isDragging, dragType, dragStart, cropStart, displaySize, aspectRatio, imageDimensions]
  );

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
    setDragType(null);
  }, []);

  // Attach global mouse listeners
  useEffect(() => {
    if (isDragging) {
      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);
      return () => {
        window.removeEventListener("mousemove", handleMouseMove);
        window.removeEventListener("mouseup", handleMouseUp);
      };
    }
  }, [isDragging, handleMouseMove, handleMouseUp]);

  // Handle reset
  const handleReset = useCallback(() => {
    setWorkingUrl(imageUrl);
    setRotation(0);
    setCropPercent({ x: 10, y: 10, width: 80, height: 80 });
    setAspectRatio("free");
  }, [imageUrl]);

  // Handle apply
  const handleApply = useCallback(async () => {
    // Convert percent crop to actual pixels
    const cropArea: CropArea = {
      x: (cropPercent.x / 100) * imageDimensions.width,
      y: (cropPercent.y / 100) * imageDimensions.height,
      width: (cropPercent.width / 100) * imageDimensions.width,
      height: (cropPercent.height / 100) * imageDimensions.height,
    };

    const result = await cropImage(workingUrl, cropArea);
    onApply(result);
  }, [cropPercent, imageDimensions, workingUrl, cropImage, onApply]);

  // Check if there are changes
  const hasChanges =
    workingUrl !== imageUrl ||
    cropPercent.x !== 10 ||
    cropPercent.y !== 10 ||
    cropPercent.width !== 80 ||
    cropPercent.height !== 80;

  return (
    <div className="space-y-4">
      {/* Crop Preview */}
      <div
        ref={containerRef}
        className="relative aspect-video bg-black/90 rounded-lg overflow-hidden cursor-crosshair"
      >
        {/* Image */}
        <img
          src={workingUrl}
          alt="Crop preview"
          className="w-full h-full object-contain pointer-events-none"
        />

        {/* Dark overlay outside crop area */}
        {displaySize.width > 0 && (
          <>
            {/* Top */}
            <div
              className="absolute bg-black/60 pointer-events-none"
              style={{
                left: displaySize.offsetX,
                top: displaySize.offsetY,
                width: displaySize.width,
                height: `${cropPercent.y}%`,
              }}
            />
            {/* Bottom */}
            <div
              className="absolute bg-black/60 pointer-events-none"
              style={{
                left: displaySize.offsetX,
                top: displaySize.offsetY + (displaySize.height * (cropPercent.y + cropPercent.height)) / 100,
                width: displaySize.width,
                height: `${100 - cropPercent.y - cropPercent.height}%`,
              }}
            />
            {/* Left */}
            <div
              className="absolute bg-black/60 pointer-events-none"
              style={{
                left: displaySize.offsetX,
                top: displaySize.offsetY + (displaySize.height * cropPercent.y) / 100,
                width: `${cropPercent.x}%`,
                height: (displaySize.height * cropPercent.height) / 100,
              }}
            />
            {/* Right */}
            <div
              className="absolute bg-black/60 pointer-events-none"
              style={{
                left: displaySize.offsetX + (displaySize.width * (cropPercent.x + cropPercent.width)) / 100,
                top: displaySize.offsetY + (displaySize.height * cropPercent.y) / 100,
                width: `${100 - cropPercent.x - cropPercent.width}%`,
                height: (displaySize.height * cropPercent.height) / 100,
              }}
            />

            {/* Crop box */}
            <div
              className="absolute border-2 border-white shadow-lg"
              style={{
                left: displaySize.offsetX + (displaySize.width * cropPercent.x) / 100,
                top: displaySize.offsetY + (displaySize.height * cropPercent.y) / 100,
                width: (displaySize.width * cropPercent.width) / 100,
                height: (displaySize.height * cropPercent.height) / 100,
                cursor: isDragging && dragType === "move" ? "grabbing" : "grab",
              }}
              onMouseDown={(e) => handleMouseDown(e, "move")}
            >
              {/* Rule of thirds grid */}
              <div className="absolute inset-0 pointer-events-none">
                <div className="absolute left-1/3 top-0 bottom-0 w-px bg-white/30" />
                <div className="absolute left-2/3 top-0 bottom-0 w-px bg-white/30" />
                <div className="absolute top-1/3 left-0 right-0 h-px bg-white/30" />
                <div className="absolute top-2/3 left-0 right-0 h-px bg-white/30" />
              </div>

              {/* Corner handles */}
              {(["nw", "ne", "sw", "se"] as const).map((corner) => (
                <div
                  key={corner}
                  className="absolute w-4 h-4 bg-white border border-gray-400 rounded-sm shadow"
                  style={{
                    top: corner.includes("n") ? -8 : "auto",
                    bottom: corner.includes("s") ? -8 : "auto",
                    left: corner.includes("w") ? -8 : "auto",
                    right: corner.includes("e") ? -8 : "auto",
                    cursor: `${corner}-resize`,
                  }}
                  onMouseDown={(e) => {
                    e.stopPropagation();
                    handleMouseDown(e, corner);
                  }}
                />
              ))}

              {/* Edge handles */}
              {(["n", "s", "e", "w"] as const).map((edge) => (
                <div
                  key={edge}
                  className="absolute bg-white/80"
                  style={{
                    ...(edge === "n" || edge === "s"
                      ? { left: "50%", transform: "translateX(-50%)", width: 32, height: 4 }
                      : { top: "50%", transform: "translateY(-50%)", width: 4, height: 32 }),
                    ...(edge === "n" && { top: -2 }),
                    ...(edge === "s" && { bottom: -2 }),
                    ...(edge === "w" && { left: -2 }),
                    ...(edge === "e" && { right: -2 }),
                    cursor: edge === "n" || edge === "s" ? "ns-resize" : "ew-resize",
                  }}
                  onMouseDown={(e) => {
                    e.stopPropagation();
                    handleMouseDown(e, edge);
                  }}
                />
              ))}
            </div>
          </>
        )}
      </div>

      {/* Controls */}
      <div className="p-4 bg-muted/30 rounded-lg border space-y-4">
        {/* Rotation & Flip */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground w-16">Rotate</span>
          <div className="flex gap-1">
            <Button
              variant="outline"
              size="icon-sm"
              onClick={() => handleRotate("ccw")}
              disabled={disabled}
              title="Rotate left 90°"
            >
              <RotateCcw className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon-sm"
              onClick={() => handleRotate("cw")}
              disabled={disabled}
              title="Rotate right 90°"
            >
              <RotateCw className="h-4 w-4" />
            </Button>
          </div>
          <div className="w-px h-6 bg-border mx-1" />
          <span className="text-xs text-muted-foreground w-10">Flip</span>
          <div className="flex gap-1">
            <Button
              variant="outline"
              size="icon-sm"
              onClick={() => handleFlip("horizontal")}
              disabled={disabled}
              title="Flip horizontal"
            >
              <FlipHorizontal className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon-sm"
              onClick={() => handleFlip("vertical")}
              disabled={disabled}
              title="Flip vertical"
            >
              <FlipVertical className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Aspect Ratio */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground w-16">Aspect</span>
          <div className="flex gap-1">
            {ASPECT_RATIOS.map((ratio) => (
              <Button
                key={ratio.id}
                variant={aspectRatio === ratio.id ? "default" : "outline"}
                size="sm"
                onClick={() => handleAspectRatioChange(ratio.id)}
                disabled={disabled}
                className="px-2 text-xs"
              >
                {ratio.label}
              </Button>
            ))}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2 pt-2 border-t">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleReset}
            disabled={disabled || !hasChanges}
            className="gap-1"
          >
            <ResetIcon className="h-3 w-3" />
            Reset
          </Button>
          <div className="flex-1" />
          <Button variant="outline" size="sm" onClick={onCancel} disabled={disabled}>
            Cancel
          </Button>
          <Button size="sm" onClick={handleApply} disabled={disabled}>
            Apply
          </Button>
        </div>
      </div>
    </div>
  );
}
