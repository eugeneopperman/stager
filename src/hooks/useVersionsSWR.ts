"use client";

import useSWR, { mutate } from "swr";
import { useCallback } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { fetcher, swrKeys } from "@/lib/swr";
import type { StagingJob } from "@/lib/database.types";

interface VersionsResponse {
  versions: StagingJob[];
  totalVersions: number;
}

interface UseVersionsSWROptions {
  /** Enable fetching (default: true when versionGroupId exists) */
  enabled?: boolean;
}

interface UseVersionsSWRReturn {
  versions: StagingJob[];
  versionCount: number;
  hasVersions: boolean;
  isLoading: boolean;
  isSettingPrimary: boolean;
  error: Error | undefined;
  setAsPrimary: (version: StagingJob) => Promise<void>;
  refetch: () => Promise<void>;
}

export function useVersionsSWR(
  jobId: string,
  versionGroupId: string | null | undefined,
  options: UseVersionsSWROptions = {}
): UseVersionsSWRReturn {
  const { enabled = !!versionGroupId } = options;
  const router = useRouter();

  const cacheKey = enabled && versionGroupId ? swrKeys.stagingVersions(jobId) : null;

  const { data, isLoading, error, isValidating, mutate: mutateSWR } = useSWR<VersionsResponse>(
    cacheKey,
    fetcher,
    {
      revalidateOnFocus: false,
      dedupingInterval: 5000,
    }
  );

  const versions = data?.versions ?? [];
  const versionCount = data?.totalVersions ?? 1;
  const hasVersions = versionCount > 1;

  const setAsPrimary = useCallback(
    async (version: StagingJob) => {
      if (!cacheKey) return;

      // Optimistic update
      await mutateSWR(
        (current) =>
          current
            ? {
                ...current,
                versions: current.versions.map((v) => ({
                  ...v,
                  is_primary_version: v.id === version.id,
                })),
              }
            : undefined,
        false
      );

      try {
        const response = await fetch(`/api/staging/${version.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "set-primary" }),
        });

        if (response.ok) {
          toast.success("Set as primary version");
          // Also invalidate the parent job's cache
          await mutate(swrKeys.stagingJob(jobId));
          router.refresh();
        } else {
          throw new Error("Failed to set primary version");
        }
      } catch {
        // Rollback on error
        await mutateSWR();
        toast.error("Failed to set primary version");
      }
    },
    [cacheKey, jobId, router, mutateSWR]
  );

  const refetch = useCallback(async () => {
    await mutateSWR();
  }, [mutateSWR]);

  return {
    versions,
    versionCount,
    hasVersions,
    isLoading,
    isSettingPrimary: isValidating,
    error,
    setAsPrimary,
    refetch,
  };
}
