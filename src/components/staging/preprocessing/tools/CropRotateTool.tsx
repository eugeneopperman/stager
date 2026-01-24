"use client";

import { useRef, useCallback, useMemo } from "react";
import Image from "next/image";
import { useContainerSize } from "../hooks/useContainerSize";
import {
  CropPreview,
  TransformControls,
  AspectRatioSelector,
  CropRotateActions,
  useCropArea,
  useImageTransform,
} from "./crop-rotate";

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
  const containerSize = useContainerSize(containerRef);

  // Image transformation state (rotate, flip, crop)
  const {
    workingUrl,
    imageDimensions,
    handleRotate,
    handleFlip,
    applyCrop,
    resetTransform,
  } = useImageTransform({ imageUrl });

  // Calculate displayed image size (object-contain)
  const displaySize = useMemo(() => {
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

  // Crop area state and handlers
  const {
    cropPercent,
    aspectRatio,
    isDragging,
    dragType,
    handleMouseDown,
    handleAspectRatioChange,
    resetCrop,
  } = useCropArea({
    displaySize,
    imageDimensions,
    disabled,
  });

  // Reset crop when image is rotated
  const handleRotateWithReset = useCallback(
    async (direction: "cw" | "ccw") => {
      await handleRotate(direction);
      resetCrop();
    },
    [handleRotate, resetCrop]
  );

  // Handle reset all
  const handleReset = useCallback(() => {
    resetTransform();
    resetCrop();
  }, [resetTransform, resetCrop]);

  // Handle apply
  const handleApply = useCallback(async () => {
    const result = await applyCrop(cropPercent);
    onApply(result);
  }, [cropPercent, applyCrop, onApply]);

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
          onRotate={handleRotateWithReset}
          onFlip={handleFlip}
          disabled={disabled}
        />

        <AspectRatioSelector
          value={aspectRatio}
          onChange={handleAspectRatioChange}
          disabled={disabled}
        />

        <CropRotateActions
          hasChanges={hasChanges}
          disabled={disabled}
          onReset={handleReset}
          onCancel={onCancel}
          onApply={handleApply}
        />
      </div>
    </div>
  );
}
