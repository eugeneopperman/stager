"use client";

import useSWR from "swr";
import { useEffect, useRef, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { fetcher, swrKeys, stagingJobPollingConfig } from "@/lib/swr";

type StagingStatus = "pending" | "processing" | "completed" | "failed";

interface StagingJobData {
  id: string;
  status: StagingStatus;
  stagedImageUrl?: string;
  originalImageUrl?: string;
  roomType?: string;
  furnitureStyle?: string;
  progress?: {
    message: string;
  };
  error?: string;
}

interface UseStagingJobSWROptions {
  /** Called when the job completes */
  onComplete?: (job: StagingJobData) => void;
  /** Called when the job fails */
  onError?: (error: string) => void;
  /** Whether to enable polling (default: true for pending/processing jobs) */
  enablePolling?: boolean;
}

interface UseStagingJobSWRReturn {
  job: StagingJobData | undefined;
  isLoading: boolean;
  isPolling: boolean;
  error: Error | undefined;
  refetch: () => Promise<void>;
}

export function useStagingJobSWR(
  jobId: string | null,
  options: UseStagingJobSWROptions = {}
): UseStagingJobSWRReturn {
  const { onComplete, onError, enablePolling = true } = options;
  const router = useRouter();
  const hasCalledComplete = useRef(false);
  const hasCalledError = useRef(false);

  const cacheKey = jobId ? swrKeys.stagingJob(jobId) : null;

  const { data: job, isLoading, error, mutate } = useSWR<StagingJobData>(
    cacheKey,
    fetcher,
    {
      ...stagingJobPollingConfig,
      // Start with polling enabled, will be managed by refreshInterval callback
      refreshInterval: enablePolling ? 2000 : 0,
    }
  );

  // Determine if we're actively polling (job is pending or processing)
  const shouldPoll =
    enablePolling &&
    job?.status != null &&
    (job.status === "pending" || job.status === "processing");

  // Stop polling when job is complete or failed by using conditional fetching
  const isPolling = shouldPoll;

  // Handle completion callback
  useEffect(() => {
    if (job?.status === "completed" && onComplete && !hasCalledComplete.current) {
      hasCalledComplete.current = true;
      onComplete(job);
      router.refresh();
    }
  }, [job, onComplete, router]);

  // Handle error callback
  useEffect(() => {
    if (job?.status === "failed" && job.error && onError && !hasCalledError.current) {
      hasCalledError.current = true;
      onError(job.error);
    }
  }, [job, onError]);

  // Reset flags when job ID changes
  useEffect(() => {
    hasCalledComplete.current = false;
    hasCalledError.current = false;
  }, [jobId]);

  const refetch = useCallback(async () => {
    await mutate();
  }, [mutate]);

  return {
    job,
    isLoading,
    isPolling,
    error,
    refetch,
  };
}

/**
 * Hook for tracking multiple staging jobs with automatic polling
 */
interface MultiJobState {
  jobId: string;
  status: StagingStatus;
  imageUrl?: string;
  progressMessage?: string;
  error?: string;
}

interface UseMultipleStagingJobsOptions {
  onAllComplete?: () => void;
}

export function useMultipleStagingJobsSWR(
  jobIds: string[],
  options: UseMultipleStagingJobsOptions = {}
) {
  const { onAllComplete } = options;
  const router = useRouter();
  const hasCalledAllComplete = useRef(false);

  // Track all jobs using individual SWR hooks via fetcher
  const jobs = jobIds.map((jobId) => {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const { data, isLoading, error } = useSWR<StagingJobData>(
      swrKeys.stagingJob(jobId),
      fetcher,
      stagingJobPollingConfig
    );
    return { jobId, data, isLoading, error };
  });

  // Check if all jobs are complete
  useEffect(() => {
    const allDone = jobs.every(
      (j) => j.data?.status === "completed" || j.data?.status === "failed"
    );

    if (allDone && jobs.length > 0 && !hasCalledAllComplete.current) {
      hasCalledAllComplete.current = true;
      onAllComplete?.();
      router.refresh();
    }
  }, [jobs, onAllComplete, router]);

  // Serialize job IDs for dependency tracking
  const jobIdsKey = useMemo(() => jobIds.join(","), [jobIds]);

  // Reset flag when job IDs change
  useEffect(() => {
    hasCalledAllComplete.current = false;
  }, [jobIdsKey]);

  const jobStates: MultiJobState[] = jobs.map((j) => ({
    jobId: j.jobId,
    status: j.data?.status ?? "pending",
    imageUrl: j.data?.stagedImageUrl,
    progressMessage: j.data?.progress?.message,
    error: j.data?.error,
  }));

  const isLoading = jobs.some((j) => j.isLoading);
  const isPolling = jobs.some(
    (j) => j.data?.status === "pending" || j.data?.status === "processing"
  );

  return {
    jobs: jobStates,
    isLoading,
    isPolling,
  };
}
