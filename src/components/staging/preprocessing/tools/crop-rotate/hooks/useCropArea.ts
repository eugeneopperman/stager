"use client";

import { useState, useCallback, useEffect } from "react";
import { ASPECT_RATIOS, type AspectRatio } from "../AspectRatioSelector";

export type DragType =
  | "move"
  | "nw"
  | "ne"
  | "sw"
  | "se"
  | "n"
  | "s"
  | "e"
  | "w"
  | null;

interface CropPercent {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface DisplaySize {
  width: number;
  height: number;
  offsetX: number;
  offsetY: number;
}

interface UseCropAreaOptions {
  displaySize: DisplaySize;
  imageDimensions: { width: number; height: number };
  disabled?: boolean;
}

interface UseCropAreaResult {
  cropPercent: CropPercent;
  aspectRatio: AspectRatio;
  isDragging: boolean;
  dragType: DragType;
  setCropPercent: (crop: CropPercent) => void;
  setAspectRatio: (ratio: AspectRatio) => void;
  handleMouseDown: (e: React.MouseEvent, type: DragType) => void;
  handleAspectRatioChange: (ratio: AspectRatio) => void;
  resetCrop: () => void;
}

const DEFAULT_CROP: CropPercent = { x: 10, y: 10, width: 80, height: 80 };

export function useCropArea({
  displaySize,
  imageDimensions,
  disabled = false,
}: UseCropAreaOptions): UseCropAreaResult {
  const [cropPercent, setCropPercent] = useState<CropPercent>(DEFAULT_CROP);
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>("free");
  const [isDragging, setIsDragging] = useState(false);
  const [dragType, setDragType] = useState<DragType>(null);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [cropStart, setCropStart] = useState<CropPercent>(DEFAULT_CROP);

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
        newCrop.x = Math.max(
          0,
          Math.min(100 - cropStart.width, cropStart.x + deltaX)
        );
        newCrop.y = Math.max(
          0,
          Math.min(100 - cropStart.height, cropStart.y + deltaY)
        );
      } else {
        if (dragType.includes("e")) {
          newCrop.width = Math.max(
            10,
            Math.min(100 - cropStart.x, cropStart.width + deltaX)
          );
        }
        if (dragType.includes("w")) {
          const newWidth = Math.max(10, cropStart.width - deltaX);
          const maxWidth = cropStart.x + cropStart.width;
          newCrop.width = Math.min(newWidth, maxWidth);
          newCrop.x = cropStart.x + cropStart.width - newCrop.width;
        }
        if (dragType.includes("s")) {
          newCrop.height = Math.max(
            10,
            Math.min(100 - cropStart.y, cropStart.height + deltaY)
          );
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
          if (newCrop.y + newCrop.height > 100)
            newCrop.height = 100 - newCrop.y;
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

  const resetCrop = useCallback(() => {
    setCropPercent(DEFAULT_CROP);
    setAspectRatio("free");
  }, []);

  return {
    cropPercent,
    aspectRatio,
    isDragging,
    dragType,
    setCropPercent,
    setAspectRatio,
    handleMouseDown,
    handleAspectRatioChange,
    resetCrop,
  };
}
