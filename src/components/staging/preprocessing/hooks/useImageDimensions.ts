"use client";

import { useState, useEffect, useMemo } from "react";

interface ImageSize {
  width: number;
  height: number;
}

interface DisplaySize {
  width: number;
  height: number;
  offsetX: number;
  offsetY: number;
}

interface UseImageDimensionsResult {
  imageSize: ImageSize;
  displaySize: DisplaySize;
}

/**
 * Hook to load image dimensions and calculate display size with object-contain behavior
 */
export function useImageDimensions(
  imageUrl: string,
  containerSize: { width: number; height: number }
): UseImageDimensionsResult {
  const [imageSize, setImageSize] = useState<ImageSize>({ width: 0, height: 0 });

  // Load image dimensions
  useEffect(() => {
    const img = new Image();
    img.onload = () => {
      setImageSize({ width: img.naturalWidth, height: img.naturalHeight });
    };
    img.src = imageUrl;
  }, [imageUrl]);

  // Calculate displayed image size (object-contain behavior)
  const displaySize = useMemo<DisplaySize>(() => {
    if (!imageSize.width || !containerSize.width) {
      return { width: 0, height: 0, offsetX: 0, offsetY: 0 };
    }

    const containerAspect = containerSize.width / containerSize.height;
    const imageAspect = imageSize.width / imageSize.height;

    let displayWidth: number;
    let displayHeight: number;

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
  }, [imageSize, containerSize]);

  return { imageSize, displaySize };
}
