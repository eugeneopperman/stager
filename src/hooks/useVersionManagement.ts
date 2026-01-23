"use client";

import { useState, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import type { StagingJob } from "@/lib/database.types";

interface UseVersionManagementOptions {
  jobId: string;
  versionGroupId?: string | null;
}

export function useVersionManagement(options: UseVersionManagementOptions) {
  const { jobId, versionGroupId } = options;
  const router = useRouter();

  const [versions, setVersions] = useState<StagingJob[]>([]);
  const [versionCount, setVersionCount] = useState<number>(1);
  const [isLoading, setIsLoading] = useState(false);
  const [isSettingPrimary, setIsSettingPrimary] = useState(false);

  const fetchVersions = useCallback(async () => {
    if (!versionGroupId) return;

    setIsLoading(true);
    try {
      const response = await fetch(`/api/staging/versions?jobId=${jobId}`);
      if (response.ok) {
        const data = await response.json();
        setVersions(data.versions || []);
        setVersionCount(data.totalVersions || 1);
      }
    } catch (error) {
      console.error("Failed to fetch versions:", error);
    } finally {
      setIsLoading(false);
    }
  }, [jobId, versionGroupId]);

  // Fetch version count on mount when version group exists
  useEffect(() => {
    if (versionGroupId) {
      void fetchVersions();
    }
  }, [versionGroupId, fetchVersions]);

  const setAsPrimary = useCallback(
    async (version: StagingJob) => {
      setIsSettingPrimary(true);
      try {
        const response = await fetch(`/api/staging/${version.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "set-primary" }),
        });

        if (response.ok) {
          toast.success("Set as primary version");
          // Update local state
          setVersions((prev) =>
            prev.map((v) => ({
              ...v,
              is_primary_version: v.id === version.id,
            }))
          );
          router.refresh();
        } else {
          throw new Error("Failed to set primary version");
        }
      } catch {
        toast.error("Failed to set primary version");
      } finally {
        setIsSettingPrimary(false);
      }
    },
    [router]
  );

  const hasVersions = versionCount > 1;

  return {
    versions,
    versionCount,
    hasVersions,
    isLoading,
    isSettingPrimary,
    fetchVersions,
    setAsPrimary,
  };
}
