"use client";

import { useCallback } from "react";

export type RotationDegrees = 0 | 90 | 180 | 270;
export type FlipDirection = "horizontal" | "vertical";

export interface CropArea {
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
 * Hook providing canvas-based image manipulation utilities
 */
export function useImageCanvas() {
  /**
   * Load an image from a URL and return it as an HTMLImageElement
   */
  const loadImage = useCallback((src: string): Promise<HTMLImageElement> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = src;
    });
  }, []);

  /**
   * Crop an image to the specified area
   */
  const cropImage = useCallback(
    async (imageUrl: string, crop: CropArea): Promise<string> => {
      const img = await loadImage(imageUrl);

      const canvas = document.createElement("canvas");
      canvas.width = crop.width;
      canvas.height = crop.height;

      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("Failed to get canvas context");

      ctx.drawImage(
        img,
        crop.x,
        crop.y,
        crop.width,
        crop.height,
        0,
        0,
        crop.width,
        crop.height
      );

      return canvas.toDataURL("image/png");
    },
    [loadImage]
  );

  /**
   * Rotate an image by the specified degrees (0, 90, 180, 270)
   */
  const rotateImage = useCallback(
    async (imageUrl: string, degrees: RotationDegrees): Promise<string> => {
      if (degrees === 0) return imageUrl;

      const img = await loadImage(imageUrl);

      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("Failed to get canvas context");

      // For 90 or 270 rotation, swap width and height
      if (degrees === 90 || degrees === 270) {
        canvas.width = img.height;
        canvas.height = img.width;
      } else {
        canvas.width = img.width;
        canvas.height = img.height;
      }

      ctx.translate(canvas.width / 2, canvas.height / 2);
      ctx.rotate((degrees * Math.PI) / 180);
      ctx.drawImage(img, -img.width / 2, -img.height / 2);

      return canvas.toDataURL("image/png");
    },
    [loadImage]
  );

  /**
   * Flip an image horizontally or vertically
   */
  const flipImage = useCallback(
    async (imageUrl: string, direction: FlipDirection): Promise<string> => {
      const img = await loadImage(imageUrl);

      const canvas = document.createElement("canvas");
      canvas.width = img.width;
      canvas.height = img.height;

      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("Failed to get canvas context");

      if (direction === "horizontal") {
        ctx.translate(canvas.width, 0);
        ctx.scale(-1, 1);
      } else {
        ctx.translate(0, canvas.height);
        ctx.scale(1, -1);
      }

      ctx.drawImage(img, 0, 0);

      return canvas.toDataURL("image/png");
    },
    [loadImage]
  );

  /**
   * Get the natural dimensions of an image
   */
  const getImageDimensions = useCallback(
    async (imageUrl: string): Promise<{ width: number; height: number }> => {
      const img = await loadImage(imageUrl);
      return { width: img.naturalWidth, height: img.naturalHeight };
    },
    [loadImage]
  );

  /**
   * Apply crop and rotation in one operation
   */
  const cropAndRotate = useCallback(
    async (
      imageUrl: string,
      crop: CropArea,
      rotation: RotationDegrees
    ): Promise<string> => {
      // First crop
      const croppedUrl = await cropImage(imageUrl, crop);

      // Then rotate if needed
      if (rotation !== 0) {
        return rotateImage(croppedUrl, rotation);
      }

      return croppedUrl;
    },
    [cropImage, rotateImage]
  );

  return {
    loadImage,
    cropImage,
    rotateImage,
    flipImage,
    getImageDimensions,
    cropAndRotate,
  };
}
