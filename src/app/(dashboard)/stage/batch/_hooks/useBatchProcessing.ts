"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import JSZip from "jszip";
import type { FurnitureStyle, RoomType } from "@/lib/constants";

export type BatchImageStatus = "configuring" | "pending" | "processing" | "completed" | "failed";

export interface BatchImageData {
  id: string;
  file: File;
  preview: string;
  roomType: RoomType | null;
  status: BatchImageStatus;
  stagedImageUrl?: string;
  jobId?: string;
  error?: string;
}

interface UseBatchProcessingOptions {
  onComplete?: () => void;
}

export function useBatchProcessing(options: UseBatchProcessingOptions = {}) {
  const router = useRouter();
  const [images, setImages] = useState<BatchImageData[]>([]);
  const [processingIndex, setProcessingIndex] = useState<number>(-1);
  const [isProcessing, setIsProcessing] = useState(false);

  const completedCount = images.filter((img) => img.status === "completed").length;
  const failedCount = images.filter((img) => img.status === "failed").length;

  const initializeImages = useCallback((uploadedImages: { id: string; file: File; preview: string }[]) => {
    const configured: BatchImageData[] = uploadedImages.map((img) => ({
      id: img.id,
      file: img.file,
      preview: img.preview,
      roomType: null,
      status: "configuring" as BatchImageStatus,
    }));
    setImages(configured);
  }, []);

  const updateRoomType = useCallback((id: string, roomType: RoomType) => {
    setImages((prev) =>
      prev.map((img) => (img.id === id ? { ...img, roomType } : img))
    );
  }, []);

  const processImages = useCallback(
    async (style: FurnitureStyle, propertyId: string | null) => {
      setIsProcessing(true);

      // Set all images to pending
      setImages((prev) =>
        prev.map((img) => ({ ...img, status: "pending" as BatchImageStatus }))
      );

      // Process images sequentially
      for (let i = 0; i < images.length; i++) {
        setProcessingIndex(i);

        // Update current image to processing
        setImages((prev) =>
          prev.map((img, idx) =>
            idx === i ? { ...img, status: "processing" as BatchImageStatus } : img
          )
        );

        try {
          // Convert file to base64
          const base64 = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => {
              const result = reader.result as string;
              const base64Data = result.split(",")[1];
              resolve(base64Data);
            };
            reader.onerror = reject;
            reader.readAsDataURL(images[i].file);
          });

          const response = await fetch("/api/staging", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              image: base64,
              mimeType: images[i].file.type,
              roomType: images[i].roomType,
              style,
              propertyId: propertyId || undefined,
            }),
          });

          const data = await response.json();

          if (!response.ok) {
            throw new Error(data.error || "Failed to stage image");
          }

          // Update image as completed
          setImages((prev) =>
            prev.map((img, idx) =>
              idx === i
                ? {
                    ...img,
                    status: "completed" as BatchImageStatus,
                    stagedImageUrl: data.stagedImageUrl,
                    jobId: data.jobId,
                  }
                : img
            )
          );
        } catch (err) {
          // Update image as failed
          setImages((prev) =>
            prev.map((img, idx) =>
              idx === i
                ? {
                    ...img,
                    status: "failed" as BatchImageStatus,
                    error: err instanceof Error ? err.message : "Unknown error",
                  }
                : img
            )
          );
        }
      }

      setProcessingIndex(-1);
      setIsProcessing(false);
      options.onComplete?.();
      router.refresh();
    },
    [images, options, router]
  );

  const downloadSingle = useCallback(
    (image: BatchImageData, style: FurnitureStyle) => {
      if (image.stagedImageUrl) {
        const link = document.createElement("a");
        link.href = image.stagedImageUrl;
        link.download = `staged-${image.roomType}-${style}-${image.id}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
    },
    []
  );

  const downloadAll = useCallback(
    async (style: FurnitureStyle) => {
      const zip = new JSZip();
      const completedImages = images.filter((img) => img.status === "completed");

      for (const image of completedImages) {
        if (image.stagedImageUrl) {
          try {
            const response = await fetch(image.stagedImageUrl);
            const blob = await response.blob();
            const roomLabel = image.roomType?.replace(/-/g, "-") || "room";
            zip.file(`staged-${roomLabel}-${style}.png`, blob);
          } catch (err) {
            console.error("Error adding image to zip:", err);
          }
        }
      }

      const content = await zip.generateAsync({ type: "blob" });
      const link = document.createElement("a");
      link.href = URL.createObjectURL(content);
      link.download = `batch-staging-${Date.now()}.zip`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    },
    [images]
  );

  const reset = useCallback(() => {
    setImages([]);
    setProcessingIndex(-1);
    setIsProcessing(false);
  }, []);

  return {
    images,
    processingIndex,
    isProcessing,
    completedCount,
    failedCount,
    initializeImages,
    updateRoomType,
    processImages,
    downloadSingle,
    downloadAll,
    reset,
  };
}
