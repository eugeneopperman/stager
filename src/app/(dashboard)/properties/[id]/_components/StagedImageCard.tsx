"use client";

import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { HoverActionButton } from "@/components/ui/action-button";
import { Download, Eye, ArrowLeftRight, RefreshCw, Star } from "lucide-react";
import type { StagingJob } from "@/lib/database.types";
import { cn } from "@/lib/utils";
import { DownloadDialog } from "@/components/download/DownloadDialog";
import { RemixDialog } from "@/components/staging/RemixDialog";
import { VersionThumbnailStrip } from "@/components/staging/VersionThumbnailStrip";
import { VersionBadge } from "@/components/staging/VersionBadge";
import { ComparisonSlider } from "@/components/staging/shared/ComparisonSlider";
import { useVersionManagement } from "@/hooks";
import { formatRoomType, formatStyle, formatShortDate } from "@/lib/formatters";

interface StagedImageCardProps {
  job: StagingJob;
  propertyAddress: string;
}

export function StagedImageCard({ job }: StagedImageCardProps) {
  const router = useRouter();
  const [showDetail, setShowDetail] = useState(false);
  const [showComparison, setShowComparison] = useState(false);
  const [showOriginal, setShowOriginal] = useState(false);
  const [showDownloadDialog, setShowDownloadDialog] = useState(false);
  const [showRemixDialog, setShowRemixDialog] = useState(false);
  const [currentJob, setCurrentJob] = useState<StagingJob>(job);

  const {
    versions,
    hasVersions,
    isSettingPrimary,
    fetchVersions,
    setAsPrimary,
  } = useVersionManagement({
    jobId: job.id,
    versionGroupId: job.version_group_id,
  });

  const handleVersionSelect = (version: StagingJob) => {
    setCurrentJob(version);
  };

  const handleRemix = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowRemixDialog(true);
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
            "bg-card"
          )}
          onClick={() => setShowDetail(true)}
        >
          {/* Background Image */}
          {displayImageUrl && (
            <Image
              src={displayImageUrl}
              alt={`${formatRoomType(job.room_type)} - ${job.style}`}
              fill
              className="object-cover transition-transform duration-300 group-hover:scale-105"
              unoptimized
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
              <HoverActionButton
                icon={ArrowLeftRight}
                tooltip="Compare Before/After"
                onClick={handleToggleCompare}
                active={showOriginal}
              />
            )}

            {/* Remix */}
            {hasOriginalImage && (
              <HoverActionButton
                icon={RefreshCw}
                tooltip="Remix with Different Style"
                onClick={handleRemix}
              />
            )}

            {/* View */}
            <HoverActionButton
              icon={Eye}
              tooltip="View"
              onClick={() => setShowDetail(true)}
            />

            {/* Download */}
            <HoverActionButton
              icon={Download}
              tooltip="Download"
              onClick={handleDownload}
            />
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
                onSetPrimary={setAsPrimary}
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
              <ComparisonSlider
                originalImage={currentJob.original_image_url || ""}
                stagedImage={currentJob.staged_image_url || ""}
                objectFit="contain"
                labelPosition="top"
                bare
              />
            ) : (
              <div className="relative rounded-lg overflow-hidden bg-muted aspect-video">
                <Image
                  src={currentJob.staged_image_url || ""}
                  alt="Staged room"
                  fill
                  className="object-contain"
                  unoptimized
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
