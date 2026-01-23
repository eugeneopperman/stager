"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { RoomTypeDropdown } from "./RoomTypeDropdown";
import { StyleGallery } from "./StyleGallery";
import {
  type RoomType,
  type FurnitureStyle,
  FREE_REMIXES_PER_IMAGE,
  VERSION_WARNING_THRESHOLD,
} from "@/lib/constants";
import { Loader2, AlertTriangle, Gift, Coins } from "lucide-react";
import { toast } from "sonner";
import type { StagingJob } from "@/lib/database.types";
import { cn } from "@/lib/utils";

interface RemixDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  job: StagingJob;
  onRemixComplete?: (newJob: StagingJob) => void;
}

export function RemixDialog({
  open,
  onOpenChange,
  job,
  onRemixComplete,
}: RemixDialogProps) {
  const router = useRouter();
  const [roomType, setRoomType] = useState<RoomType>(job.room_type as RoomType);
  const [style, setStyle] = useState<FurnitureStyle[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [freeRemixesRemaining, setFreeRemixesRemaining] = useState<number | null>(null);
  const [totalVersions, setTotalVersions] = useState<number | null>(null);

  // Fetch version info when dialog opens
  useEffect(() => {
    if (!open) return;

    const fetchVersionInfo = async () => {
      try {
        const response = await fetch(`/api/staging/versions?jobId=${job.id}`);
        if (response.ok) {
          const data = await response.json();
          setFreeRemixesRemaining(data.freeRemixesRemaining);
          setTotalVersions(data.totalVersions);
        }
      } catch (error) {
        console.error("Failed to fetch version info:", error);
      }
    };

    void fetchVersionInfo();
  }, [open, job.id]);

  const handleGenerate = async () => {
    if (!roomType || style.length === 0) {
      toast.error("Please select a room type and style");
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch(`/api/staging/${job.id}/remix`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          roomType,
          style: style[0], // Use first selected style
          propertyId: job.property_id,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to create remix");
      }

      if (data.async) {
        // For async jobs, show a toast and close dialog
        toast.success("Remix started! Check your history for progress.");
      } else {
        // For sync jobs, the remix is complete
        toast.success("Remix complete!");
      }

      onOpenChange(false);
      router.refresh();

      if (onRemixComplete && data.jobId) {
        // Fetch the new job details
        const jobResponse = await fetch(`/api/staging/${data.jobId}`);
        if (jobResponse.ok) {
          const jobData = await jobResponse.json();
          onRemixComplete(jobData);
        }
      }
    } catch (error) {
      console.error("Remix failed:", error);
      toast.error(error instanceof Error ? error.message : "Failed to create remix");
    } finally {
      setIsLoading(false);
    }
  };

  const hasOriginalImage = job.original_image_url && !job.original_image_url.includes("...");
  const isFreeRemix = freeRemixesRemaining !== null && freeRemixesRemaining > 0;
  const showVersionWarning = totalVersions !== null && totalVersions >= VERSION_WARNING_THRESHOLD;

  const formatRoomType = (rt: string) => {
    return rt
      .split("-")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  const formatStyle = (s: string) => {
    return s
      .split("-")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Remix This Staging</DialogTitle>
          <DialogDescription>
            Generate a new version with different settings using the same original image.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Original image preview */}
          {hasOriginalImage && (
            <div className="flex gap-4">
              <div className="relative w-32 h-24 rounded-lg overflow-hidden flex-shrink-0">
                <Image
                  src={job.original_image_url!}
                  alt="Original"
                  fill
                  className="object-cover"
                  unoptimized
                />
                <div className="absolute bottom-0 inset-x-0 bg-black/60 px-2 py-0.5">
                  <span className="text-[10px] text-white">Original</span>
                </div>
              </div>
              <div className="flex-1">
                <div className="text-sm text-muted-foreground">
                  Current: {formatRoomType(job.room_type)} - {formatStyle(job.style)}
                </div>

                {/* Free remix indicator */}
                {freeRemixesRemaining !== null && (
                  <div
                    className={cn(
                      "mt-2 inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium",
                      isFreeRemix
                        ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                        : "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
                    )}
                  >
                    {isFreeRemix ? (
                      <>
                        <Gift className="h-3 w-3" />
                        {freeRemixesRemaining} of {FREE_REMIXES_PER_IMAGE} free remixes remaining
                      </>
                    ) : (
                      <>
                        <Coins className="h-3 w-3" />
                        1 credit per remix
                      </>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Version warning */}
          {showVersionWarning && (
            <div className="flex items-start gap-2 p-3 rounded-lg bg-amber-50 dark:bg-amber-900/20 text-amber-800 dark:text-amber-200">
              <AlertTriangle className="h-4 w-4 mt-0.5 flex-shrink-0" />
              <div className="text-sm">
                You have {totalVersions} versions of this image. Consider organizing them or
                setting a primary version for clarity.
              </div>
            </div>
          )}

          {/* Room type selector */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Room Type</label>
            <RoomTypeDropdown
              value={roomType}
              onChange={setRoomType}
              disabled={isLoading}
            />
          </div>

          {/* Style selector */}
          <StyleGallery
            value={style}
            onChange={setStyle}
            disabled={isLoading}
            maxStyles={1}
          />
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button
            onClick={handleGenerate}
            disabled={isLoading || style.length === 0}
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Generating...
              </>
            ) : (
              <>Generate Remix</>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
