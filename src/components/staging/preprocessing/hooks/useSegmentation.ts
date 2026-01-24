"use client";

import { useState, useCallback } from "react";

interface UseSegmentationResult {
  isSegmenting: boolean;
  segmentError: string | null;
  maskUrl: string | null;
  runSegmentation: (prompt: string) => Promise<void>;
  clearSegmentation: () => void;
}

/**
 * Hook to handle AI segmentation API calls
 */
export function useSegmentation(imageUrl: string): UseSegmentationResult {
  const [isSegmenting, setIsSegmenting] = useState(false);
  const [segmentError, setSegmentError] = useState<string | null>(null);
  const [maskUrl, setMaskUrl] = useState<string | null>(null);

  const runSegmentation = useCallback(
    async (textPrompt: string) => {
      if (!textPrompt.trim()) return;

      setIsSegmenting(true);
      setSegmentError(null);

      try {
        let base64: string;
        let mimeType: string;

        if (imageUrl.startsWith("data:")) {
          const matches = imageUrl.match(/^data:([^;]+);base64,(.+)$/);
          if (matches) {
            mimeType = matches[1];
            base64 = matches[2];
          } else {
            throw new Error("Invalid data URL");
          }
        } else {
          const response = await fetch(imageUrl);
          const blob = await response.blob();
          mimeType = blob.type || "image/png";
          base64 = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => {
              const result = reader.result as string;
              resolve(result.split(",")[1]);
            };
            reader.onerror = reject;
            reader.readAsDataURL(blob);
          });
        }

        const apiResponse = await fetch("/api/segment", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            image: base64,
            mimeType,
            prompt: textPrompt,
          }),
        });

        const data = await apiResponse.json();

        if (!apiResponse.ok) {
          throw new Error(data.error || "Segmentation failed");
        }

        if (data.maskDataUrl) {
          setMaskUrl(data.maskDataUrl);
        }
      } catch (err) {
        console.error("[useSegmentation] Error:", err);
        setSegmentError(err instanceof Error ? err.message : "Segmentation failed");
      } finally {
        setIsSegmenting(false);
      }
    },
    [imageUrl]
  );

  const clearSegmentation = useCallback(() => {
    setMaskUrl(null);
    setSegmentError(null);
  }, []);

  return {
    isSegmenting,
    segmentError,
    maskUrl,
    runSegmentation,
    clearSegmentation,
  };
}
