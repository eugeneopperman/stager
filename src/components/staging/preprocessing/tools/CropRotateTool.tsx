"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { RotateCcw as ResetIcon } from "lucide-react";
import { useImageCanvas, type CropArea, type RotationDegrees } from "../hooks/useImageCanvas";
import { CropPreview, TransformControls, AspectRatioSelector, ASPECT_RATIOS, type AspectRatio } from "./crop-rotate";

type DragType = "move" | "nw" | "ne" | "sw" | "se" | "n" | "s" | "e" | "w" | null;

interface CropRotateToolProps {
  imageUrl: string;
  onApply: (dataUrl: string) => void;
  onCancel: () => void;
  disabled?: boolean;
}

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
  const [dragType, setDragType] = useState<DragType>(null);
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
      displayWidth = containerSize.width;
      displayHeight = containerSize.width / imageAspect;
    } else {
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
      if (!targetRatio) return;

      const currentCenterX = cropPercent.x + cropPercent.width / 2;
      const currentCenterY = cropPercent.y + cropPercent.height / 2;

      const imageAspect = imageDimensions.width / imageDimensions.height;
      const cropAspectInPercent = targetRatio / imageAspect;

      let newWidth = cropPercent.width;
      let newHeight = cropPercent.height;

      if (cropAspectInPercent > cropPercent.width / cropPercent.height) {
        newHeight = newWidth / cropAspectInPercent;
      } else {
        newWidth = newHeight * cropAspectInPercent;
      }

      newWidth = Math.min(newWidth, 100);
      newHeight = Math.min(newHeight, 100);

      let newX = currentCenterX - newWidth / 2;
      let newY = currentCenterY - newHeight / 2;

      newX = Math.max(0, Math.min(100 - newWidth, newX));
      newY = Math.max(0, Math.min(100 - newHeight, newY));

      setCropPercent({ x: newX, y: newY, width: newWidth, height: newHeight });
    },
    [cropPercent, imageDimensions]
  );

  // Mouse handlers for crop manipulation
  const handleMouseDown = useCallback(
    (e: React.MouseEvent, type: DragType) => {
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

      const newCrop = { ...cropStart };

      if (dragType === "move") {
        newCrop.x = Math.max(0, Math.min(100 - cropStart.width, cropStart.x + deltaX));
        newCrop.y = Math.max(0, Math.min(100 - cropStart.height, cropStart.y + deltaY));
      } else {
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

        if (aspectInPercent) {
          if (dragType.includes("e") || dragType.includes("w")) {
            newCrop.height = newCrop.width / aspectInPercent;
          } else {
            newCrop.width = newCrop.height * aspectInPercent;
          }
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
    const cropArea: CropArea = {
      x: (cropPercent.x / 100) * imageDimensions.width,
      y: (cropPercent.y / 100) * imageDimensions.height,
      width: (cropPercent.width / 100) * imageDimensions.width,
      height: (cropPercent.height / 100) * imageDimensions.height,
    };

    const result = await cropImage(workingUrl, cropArea);
    onApply(result);
  }, [cropPercent, imageDimensions, workingUrl, cropImage, onApply]);

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
        <Image
          src={workingUrl}
          alt="Crop preview"
          fill
          className="object-contain pointer-events-none"
          unoptimized
        />

        <CropPreview
          cropPercent={cropPercent}
          displaySize={displaySize}
          isDragging={isDragging}
          dragType={dragType}
          onMouseDown={handleMouseDown}
        />
      </div>

      {/* Controls */}
      <div className="p-4 bg-muted/30 rounded-lg border space-y-4">
        <TransformControls
          onRotate={handleRotate}
          onFlip={handleFlip}
          disabled={disabled}
        />

        <AspectRatioSelector
          value={aspectRatio}
          onChange={handleAspectRatioChange}
          disabled={disabled}
        />

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
