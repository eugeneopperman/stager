"use client";

import { useCallback, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { type StagedVariation } from "@/components/staging/shared";

interface UseStagingJobOptions {
  onAllComplete?: () => void;
}

export function useStagingJob(options: UseStagingJobOptions = {}) {
  const router = useRouter();
  const pollingRef = useRef<Map<string, NodeJS.Timeout>>(new Map());

  // Cleanup polling on unmount
  useEffect(() => {
    const polling = pollingRef.current;
    return () => {
      polling.forEach((interval) => clearInterval(interval));
      polling.clear();
    };
  }, []);

  const pollJobStatus = useCallback(
    async (
      jobId: string,
      styleIndex: number,
      setVariations: React.Dispatch<React.SetStateAction<StagedVariation[]>>
    ) => {
      try {
        const response = await fetch(`/api/staging/${jobId}`);
        if (!response.ok) {
          throw new Error("Failed to fetch job status");
        }

        const data = await response.json();

        // Update variation with current status
        setVariations((prev) =>
          prev.map((v, idx) =>
            idx === styleIndex
              ? {
                  ...v,
                  status: data.status,
                  imageUrl: data.stagedImageUrl || v.imageUrl,
                  progressMessage: data.progress?.message,
                  error: data.error,
                }
              : v
          )
        );

        // Check if job is complete or failed
        if (data.status === "completed" || data.status === "failed") {
          // Clear polling interval
          const interval = pollingRef.current.get(jobId);
          if (interval) {
            clearInterval(interval);
            pollingRef.current.delete(jobId);
          }

          // Check if all jobs are done
          setVariations((prev) => {
            const allDone = prev.every(
              (v) => v.status === "completed" || v.status === "failed"
            );
            if (allDone) {
              options.onAllComplete?.();
              router.refresh();
            }
            return prev;
          });
        }
      } catch (err) {
        console.error("Error polling job status:", err);
      }
    },
    [router, options]
  );

  const startPolling = useCallback(
    (
      jobId: string,
      styleIndex: number,
      setVariations: React.Dispatch<React.SetStateAction<StagedVariation[]>>
    ) => {
      // Start polling for this job
      const pollInterval = setInterval(() => {
        pollJobStatus(jobId, styleIndex, setVariations);
      }, 2000); // Poll every 2 seconds

      pollingRef.current.set(jobId, pollInterval);

      // Initial poll
      pollJobStatus(jobId, styleIndex, setVariations);
    },
    [pollJobStatus]
  );

  const clearAllPolling = useCallback(() => {
    pollingRef.current.forEach((interval) => clearInterval(interval));
    pollingRef.current.clear();
  }, []);

  return {
    startPolling,
    clearAllPolling,
    pollingRef,
  };
}
