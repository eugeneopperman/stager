"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { type RoomType, type FurnitureStyle } from "@/lib/constants";
import { type StagedVariation } from "@/components/staging/shared";
import { useStagingJob } from "./useStagingJob";

interface UseStagingSubmitOptions {
  onComplete?: () => void;
}

interface StagingSubmitParams {
  imageFile: File;
  roomType: RoomType;
  styles: FurnitureStyle[];
  propertyId?: string | null;
  maskDataUrl?: string | null;
  workingFile?: File | null;
}

export function useStagingSubmit(options: UseStagingSubmitOptions = {}) {
  const router = useRouter();
  const [variations, setVariations] = useState<StagedVariation[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingIndex, setProcessingIndex] = useState(-1);
  const [error, setError] = useState<string | null>(null);
  const [currentProvider, setCurrentProvider] = useState<string | null>(null);

  const { startPolling, clearAllPolling } = useStagingJob({
    onAllComplete: () => {
      setIsProcessing(false);
      options.onComplete?.();
    },
  });

  const submitStaging = useCallback(
    async (params: StagingSubmitParams) => {
      const { imageFile, roomType, styles, propertyId, maskDataUrl, workingFile } = params;

      setIsProcessing(true);
      setError(null);
      setCurrentProvider(null);

      // Initialize variations
      const initialVariations: StagedVariation[] = styles.map((style) => ({
        style,
        imageUrl: null,
        status: "pending",
      }));
      setVariations(initialVariations);

      let hasAsyncJobs = false;
      const imageToStage = workingFile || imageFile;

      // Convert file to base64
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          const result = reader.result as string;
          const base64Data = result.split(",")[1];
          resolve(base64Data);
        };
        reader.onerror = reject;
        reader.readAsDataURL(imageToStage);
      });

      // Process each style sequentially
      for (let i = 0; i < styles.length; i++) {
        // Add delay between requests (except for the first)
        if (i > 0) {
          await new Promise((resolve) => setTimeout(resolve, 2000));
        }

        setProcessingIndex(i);

        // Update current variation to processing
        setVariations((prev) =>
          prev.map((v, idx) => (idx === i ? { ...v, status: "processing" } : v))
        );

        try {
          // Extract mask base64 if present
          let maskBase64: string | undefined;
          if (maskDataUrl) {
            const maskMatch = maskDataUrl.match(/^data:[^;]+;base64,(.+)$/);
            if (maskMatch) {
              maskBase64 = maskMatch[1];
            }
          }

          const response = await fetch("/api/staging", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              image: base64,
              mimeType: imageToStage.type,
              roomType,
              style: styles[i],
              propertyId: propertyId || undefined,
              mask: maskBase64,
            }),
          });

          const data = await response.json();

          if (!response.ok) {
            throw new Error(data.error || "Failed to stage image");
          }

          // Set provider on first successful response
          if (data.provider && !currentProvider) {
            setCurrentProvider(data.provider);
          }

          if (data.async) {
            // Handle async job (Replicate provider)
            hasAsyncJobs = true;

            setVariations((prev) =>
              prev.map((v, idx) =>
                idx === i
                  ? {
                      ...v,
                      status: "processing",
                      jobId: data.jobId,
                      provider: data.provider,
                      progressMessage: "Starting AI processing...",
                    }
                  : v
              )
            );

            startPolling(data.jobId, i, setVariations);
          } else {
            // Handle synchronous response (Gemini provider)
            setVariations((prev) =>
              prev.map((v, idx) =>
                idx === i
                  ? {
                      ...v,
                      status: "completed",
                      imageUrl: data.stagedImageUrl,
                      provider: data.provider,
                    }
                  : v
              )
            );
          }
        } catch (err) {
          setVariations((prev) =>
            prev.map((v, idx) =>
              idx === i
                ? {
                    ...v,
                    status: "failed",
                    error: err instanceof Error ? err.message : "Unknown error",
                  }
                : v
            )
          );
        }
      }

      setProcessingIndex(-1);

      // If no async jobs, we're done
      if (!hasAsyncJobs) {
        setIsProcessing(false);
        options.onComplete?.();
        router.refresh();
      }
    },
    [currentProvider, options, router, startPolling]
  );

  const resetStaging = useCallback(() => {
    clearAllPolling();
    setVariations([]);
    setIsProcessing(false);
    setProcessingIndex(-1);
    setError(null);
    setCurrentProvider(null);
  }, [clearAllPolling]);

  return {
    variations,
    setVariations,
    isProcessing,
    processingIndex,
    error,
    setError,
    currentProvider,
    submitStaging,
    resetStaging,
  };
}
