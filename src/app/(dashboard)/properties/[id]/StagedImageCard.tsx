"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Download, Eye, ArrowLeftRight, RefreshCw, Star, Loader2 } from "lucide-react";
import type { StagingJob } from "@/lib/database.types";
import { cn } from "@/lib/utils";
import { DownloadDialog } from "@/components/download/DownloadDialog";
import { RemixDialog } from "@/components/staging/RemixDialog";
import { VersionThumbnailStrip } from "@/components/staging/VersionThumbnailStrip";
import { VersionBadge } from "@/components/staging/VersionBadge";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

interface StagedImageCardProps {
  job: StagingJob;
  propertyAddress: string;
}

export function StagedImageCard({ job, propertyAddress }: StagedImageCardProps) {
  const router = useRouter();
  const [showDetail, setShowDetail] = useState(false);
  const [showComparison, setShowComparison] = useState(false);
  const [sliderPosition, setSliderPosition] = useState(50);
  const [showOriginal, setShowOriginal] = useState(false);
  const [showDownloadDialog, setShowDownloadDialog] = useState(false);
  const [showRemixDialog, setShowRemixDialog] = useState(false);
  const [versions, setVersions] = useState<StagingJob[]>([]);
  const [currentJob, setCurrentJob] = useState<StagingJob>(job);
  const [isSettingPrimary, setIsSettingPrimary] = useState(false);

  // Fetch versions when job has a version group
  useEffect(() => {
    if (job.version_group_id) {
      fetchVersions();
    }
  }, [job.version_group_id]);

  const fetchVersions = async () => {
    try {
      const response = await fetch(`/api/staging/versions?jobId=${job.id}`);
      if (response.ok) {
        const data = await response.json();
        setVersions(data.versions || []);
      }
    } catch (error) {
      console.error("Failed to fetch versions:", error);
    }
  };

  const handleSetPrimary = async (version: StagingJob) => {
    setIsSettingPrimary(true);
    try {
      const response = await fetch(`/api/staging/${version.id}/primary`, {
        method: "PUT",
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
    } catch (error) {
      toast.error("Failed to set primary version");
    } finally {
      setIsSettingPrimary(false);
    }
  };

  const handleVersionSelect = (version: StagingJob) => {
    setCurrentJob(version);
  };

  const handleRemix = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowRemixDialog(true);
  };

  const formatRoomType = (roomType: string) => {
    return roomType
      .split("-")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  const formatStyle = (style: string) => {
    return style
      .split("-")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  const formatShortDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
  };

  const handleSliderMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percentage = (x / rect.width) * 100;
    setSliderPosition(Math.max(0, Math.min(100, percentage)));
  };

  const handleDownload = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (job.staged_image_url) {
      setShowDownloadDialog(true);
    }
  };

  const handleToggleCompare = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowOriginal(!showOriginal);
  };

  const hasOriginalImage = currentJob.original_image_url && !currentJob.original_image_url.includes("...");
  const displayImageUrl = showOriginal && hasOriginalImage
    ? currentJob.original_image_url
    : currentJob.staged_image_url;
  const hasVersions = versions.length > 1;

  return (
    <>
      {/* Stacked card wrapper for version effect */}
      <div
        className={cn(
          "relative",
          hasVersions && [
            "before:absolute before:inset-0 before:translate-x-1 before:translate-y-1",
            "before:rounded-2xl before:bg-card before:border before:border-border/50",
            "before:-z-10 before:opacity-60",
          ],
          hasVersions && versions.length > 2 && [
            "after:absolute after:inset-0 after:translate-x-2 after:translate-y-2",
            "after:rounded-2xl after:bg-card after:border after:border-border/30",
            "after:-z-20 after:opacity-30",
          ]
        )}
      >
        <div
          className={cn(
            "group relative aspect-[4/3] rounded-2xl overflow-hidden",
            "transition-all duration-300 ease-out",
            "hover:scale-[1.02] hover:shadow-xl cursor-pointer",
            "bg-card" // Ensure solid background for stacked effect
          )}
          onClick={() => setShowDetail(true)}
        >
        {/* Background Image */}
        {displayImageUrl && (
          <img
            src={displayImageUrl}
            alt={`${formatRoomType(job.room_type)} - ${job.style}`}
            className="absolute inset-0 w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        )}

        {/* Version Badge */}
        {hasVersions && !showOriginal && (
          <div className="absolute top-3 left-3 z-10">
            <VersionBadge
              count={versions.length}
              onClick={(e) => {
                e.stopPropagation();
                setShowDetail(true);
              }}
            />
          </div>
        )}

        {/* Original Badge (when comparing) */}
        {showOriginal && hasOriginalImage && (
          <div className="absolute top-3 left-3 px-2 py-1 bg-black/70 backdrop-blur-sm rounded text-white text-xs font-medium z-10">
            Original
          </div>
        )}

        {/* Hover Action Bar */}
        <div
          className={cn(
            "absolute top-3 right-3 z-20",
            "opacity-0 group-hover:opacity-100",
            "translate-y-1 group-hover:translate-y-0",
            "transition-all duration-200",
            "flex items-center gap-1 px-2 py-1.5 rounded-full",
            "bg-black/60 backdrop-blur-xl"
          )}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Compare (only if original exists) */}
          {hasOriginalImage && (
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={handleToggleCompare}
                  className={cn(
                    "p-1.5 rounded-full transition-colors",
                    "hover:bg-white/20 text-white",
                    showOriginal && "bg-white/20"
                  )}
                >
                  <ArrowLeftRight className="h-4 w-4" />
                </button>
              </TooltipTrigger>
              <TooltipContent>Compare Before/After</TooltipContent>
            </Tooltip>
          )}

          {/* Remix */}
          {hasOriginalImage && (
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={handleRemix}
                  className="p-1.5 rounded-full transition-colors hover:bg-white/20 text-white"
                >
                  <RefreshCw className="h-4 w-4" />
                </button>
              </TooltipTrigger>
              <TooltipContent>Remix with Different Style</TooltipContent>
            </Tooltip>
          )}

          {/* View */}
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={() => setShowDetail(true)}
                className="p-1.5 rounded-full transition-colors hover:bg-white/20 text-white"
              >
                <Eye className="h-4 w-4" />
              </button>
            </TooltipTrigger>
            <TooltipContent>View</TooltipContent>
          </Tooltip>

          {/* Download */}
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={handleDownload}
                className="p-1.5 rounded-full transition-colors hover:bg-white/20 text-white"
              >
                <Download className="h-4 w-4" />
              </button>
            </TooltipTrigger>
            <TooltipContent>Download</TooltipContent>
          </Tooltip>
        </div>

        {/* Bottom Gradient + Info */}
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-4 pt-12">
          <div className="flex items-center justify-between">
            <div className="min-w-0 flex-1">
              <h3 className="text-white font-semibold text-sm">
                {formatRoomType(currentJob.room_type)}
              </h3>
              <p className="text-white/70 text-xs">
                {formatStyle(currentJob.style)} • {formatShortDate(currentJob.created_at)}
              </p>
            </div>
            {/* Primary badge */}
            {currentJob.is_primary_version && (
              <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-yellow-500/80 backdrop-blur-sm">
                <Star className="h-3 w-3 text-white fill-current" />
                <span className="text-[10px] text-white font-medium">Primary</span>
              </div>
            )}
          </div>
        </div>
        </div>
      </div>

      {/* Detail Dialog */}
      <Dialog open={showDetail} onOpenChange={setShowDetail}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>
              {formatRoomType(currentJob.room_type)} - {formatStyle(currentJob.style)}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {/* Version strip in dialog */}
            {hasVersions && (
              <VersionThumbnailStrip
                versions={versions}
                currentVersionId={currentJob.id}
                onVersionSelect={handleVersionSelect}
                onSetPrimary={handleSetPrimary}
                isSettingPrimary={isSettingPrimary}
              />
            )}

            {/* Toggle - only show if original image exists */}
            {hasOriginalImage && (
              <div className="flex justify-center gap-2">
                <Button
                  variant={showComparison ? "default" : "outline"}
                  size="sm"
                  onClick={() => setShowComparison(!showComparison)}
                >
                  <ArrowLeftRight className="h-4 w-4 mr-2" />
                  {showComparison ? "Hide Comparison" : "Compare Before/After"}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowRemixDialog(true)}
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Remix
                </Button>
              </div>
            )}

            {/* Image Display */}
            {showComparison && hasOriginalImage ? (
              <div
                className="relative aspect-video cursor-col-resize select-none rounded-lg overflow-hidden"
                onMouseMove={handleSliderMove}
              >
                <img
                  src={currentJob.original_image_url}
                  alt="Original"
                  className="absolute inset-0 w-full h-full object-contain bg-muted"
                />
                <div
                  className="absolute inset-0 overflow-hidden"
                  style={{ width: `${sliderPosition}%` }}
                >
                  <img
                    src={currentJob.staged_image_url || ""}
                    alt="Staged"
                    className="absolute inset-0 w-full h-full object-contain bg-muted"
                    style={{ width: `${100 / (sliderPosition / 100)}%`, maxWidth: "none" }}
                  />
                </div>
                <div
                  className="absolute top-0 bottom-0 w-1 bg-white shadow-lg"
                  style={{ left: `${sliderPosition}%`, transform: "translateX(-50%)" }}
                >
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 bg-white rounded-full shadow-lg flex items-center justify-center">
                    <ArrowLeftRight className="h-4 w-4 text-slate-600" />
                  </div>
                </div>
                <div className="absolute top-2 left-2 px-2 py-1 bg-black/70 text-white text-xs rounded">
                  Staged
                </div>
                <div className="absolute top-2 right-2 px-2 py-1 bg-black/70 text-white text-xs rounded">
                  Original
                </div>
              </div>
            ) : (
              <div className="rounded-lg overflow-hidden bg-muted">
                <img
                  src={currentJob.staged_image_url || ""}
                  alt="Staged room"
                  className="w-full h-auto max-h-[70vh] object-contain"
                />
              </div>
            )}

            {/* Info & Actions */}
            <div className="flex items-center justify-between pt-4 border-t">
              <div className="text-sm text-muted-foreground">
                {formatStyle(currentJob.style)} style • {formatShortDate(currentJob.created_at)}
                {currentJob.is_primary_version && (
                  <span className="ml-2 inline-flex items-center gap-1 text-yellow-600 dark:text-yellow-400">
                    <Star className="h-3 w-3 fill-current" />
                    Primary
                  </span>
                )}
              </div>
              <Button onClick={() => handleDownload()}>
                <Download className="h-4 w-4 mr-2" />
                Download
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Download Dialog */}
      {currentJob.staged_image_url && (
        <DownloadDialog
          open={showDownloadDialog}
          onOpenChange={setShowDownloadDialog}
          jobId={currentJob.id}
          imageUrl={currentJob.staged_image_url}
          roomType={currentJob.room_type}
          style={currentJob.style}
        />
      )}

      {/* Remix Dialog */}
      {hasOriginalImage && (
        <RemixDialog
          open={showRemixDialog}
          onOpenChange={setShowRemixDialog}
          job={currentJob}
          onRemixComplete={() => {
            fetchVersions();
            router.refresh();
          }}
        />
      )}
    </>
  );
}
