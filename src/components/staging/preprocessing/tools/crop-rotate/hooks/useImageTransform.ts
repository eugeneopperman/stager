"use client";

import { useState, useCallback, useEffect } from "react";
import {
  useImageCanvas,
  type CropArea,
  type RotationDegrees,
} from "../../../hooks/useImageCanvas";

interface UseImageTransformOptions {
  imageUrl: string;
}

interface UseImageTransformResult {
  workingUrl: string;
  rotation: RotationDegrees;
  imageDimensions: { width: number; height: number };
  handleRotate: (direction: "cw" | "ccw") => Promise<void>;
  handleFlip: (direction: "horizontal" | "vertical") => Promise<void>;
  applyCrop: (cropPercent: {
    x: number;
    y: number;
    width: number;
    height: number;
  }) => Promise<string>;
  resetTransform: () => void;
}

export function useImageTransform({
  imageUrl,
}: UseImageTransformOptions): UseImageTransformResult {
  const { rotateImage, flipImage, cropImage, getImageDimensions } =
    useImageCanvas();

  const [workingUrl, setWorkingUrl] = useState(imageUrl);
  const [rotation, setRotation] = useState<RotationDegrees>(0);
  const [imageDimensions, setImageDimensions] = useState({
    width: 0,
    height: 0,
  });

  // Load image dimensions when working URL changes
  useEffect(() => {
    getImageDimensions(workingUrl).then(setImageDimensions);
  }, [workingUrl, getImageDimensions]);

  // Reset when source image changes
  useEffect(() => {
    setWorkingUrl(imageUrl);
    setRotation(0);
  }, [imageUrl]);

  const handleRotate = useCallback(
    async (direction: "cw" | "ccw") => {
      const degrees = direction === "cw" ? 90 : -90;
      const newRotation = ((((rotation + degrees) % 360) + 360) %
        360) as RotationDegrees;
      setRotation(newRotation);

      const rotated = await rotateImage(
        workingUrl,
        direction === "cw" ? 90 : 270
      );
      setWorkingUrl(rotated);
    },
    [workingUrl, rotation, rotateImage]
  );

  const handleFlip = useCallback(
    async (direction: "horizontal" | "vertical") => {
      const flipped = await flipImage(workingUrl, direction);
      setWorkingUrl(flipped);
    },
    [workingUrl, flipImage]
  );

  const applyCrop = useCallback(
    async (cropPercent: {
      x: number;
      y: number;
      width: number;
      height: number;
    }) => {
      const cropArea: CropArea = {
        x: (cropPercent.x / 100) * imageDimensions.width,
        y: (cropPercent.y / 100) * imageDimensions.height,
        width: (cropPercent.width / 100) * imageDimensions.width,
        height: (cropPercent.height / 100) * imageDimensions.height,
      };

      return cropImage(workingUrl, cropArea);
    },
    [imageDimensions, workingUrl, cropImage]
  );

  const resetTransform = useCallback(() => {
    setWorkingUrl(imageUrl);
    setRotation(0);
  }, [imageUrl]);

  return {
    workingUrl,
    rotation,
    imageDimensions,
    handleRotate,
    handleFlip,
    applyCrop,
    resetTransform,
  };
}
