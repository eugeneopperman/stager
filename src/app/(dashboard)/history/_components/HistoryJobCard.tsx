"use client";

import { useState, useCallback, memo } from "react";
import Image from "next/image";
import { Star } from "lucide-react";
import type { StagingJob } from "@/lib/database.types";
import { cn } from "@/lib/utils";
import { DownloadDialog } from "@/components/download/DownloadDialog";
import { RemixDialog } from "@/components/staging/RemixDialog";
import { VersionBadge } from "@/components/staging/VersionBadge";
import { useVersionManagement, useStagingJobMutations } from "@/hooks";
import { formatRoomType, formatStyle } from "@/lib/formatters";
import { HoverActionBar, CardStatusOverlay, JobDetailDialog } from "./job-card";

interface PropertyOption {
  id: string;
  address: string;
}

interface HistoryJobCardProps {
  job: StagingJob;
  properties: PropertyOption[];
}

export const HistoryJobCard = memo(function HistoryJobCard({ job, properties }: HistoryJobCardProps) {
  const [showDetail, setShowDetail] = useState(false);
  const [showComparison, setShowComparison] = useState(false);
  const [showOriginal, setShowOriginal] = useState(false);
  const [showDownloadDialog, setShowDownloadDialog] = useState(false);
  const [showRemixDialog, setShowRemixDialog] = useState(false);

  const { versionCount, hasVersions } = useVersionManagement({
    jobId: job.id,
    versionGroupId: job.version_group_id,
  });

  const {
    currentPropertyId,
    currentProperty,
    isFavorite,
    isAssigning,
    isTogglingFavorite,
    isDeleting,
    assignToProperty,
    toggleFavorite,
    deleteJob,
  } = useStagingJobMutations({
    jobId: job.id,
    initialPropertyId: job.property_id,
    initialIsFavorite: job.is_favorite || false,
    properties,
  });

  const hasOriginalImage = job.original_image_url && !job.original_image_url.includes("...");
  const isCompleted = job.status === "completed";
  const roomTypeLabel = formatRoomType(job.room_type);
  const styleLabel = formatStyle(job.style);

  const handleDownload = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    if (job.staged_image_url) {
      setShowDownloadDialog(true);
    }
  }, [job.staged_image_url]);

  const handleToggleFavorite = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    void toggleFavorite();
  }, [toggleFavorite]);

  const handleToggleCompare = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    setShowOriginal(prev => !prev);
  }, []);

  const handleRemix = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    setShowRemixDialog(true);
  }, []);

  const handleDelete = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    void deleteJob();
  }, [deleteJob]);

  // Determine which image to display
  const displayImageUrl = showOriginal && hasOriginalImage
    ? job.original_image_url
    : job.staged_image_url;

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
          hasVersions && versionCount > 2 && [
            "after:absolute after:inset-0 after:translate-x-2 after:translate-y-2",
            "after:rounded-2xl after:bg-card after:border after:border-border/30",
            "after:-z-20 after:opacity-30",
          ]
        )}
      >
        {/* Card */}
        <div
          className={cn(
            "group relative aspect-[4/3] rounded-2xl overflow-hidden",
            "transition-all duration-300 ease-out",
            "hover:scale-[1.02] hover:shadow-xl",
            "bg-card",
            isCompleted && job.staged_image_url && "cursor-pointer"
          )}
          onClick={() => isCompleted && job.staged_image_url && setShowDetail(true)}
        >
          {/* Background Image */}
          {displayImageUrl ? (
            <Image
              src={displayImageUrl}
              alt={`${roomTypeLabel} - ${styleLabel}`}
              fill
              className="object-cover transition-opacity duration-300"
              unoptimized
            />
          ) : (
            <div className="absolute inset-0 bg-muted" />
          )}

          {/* Version Badge */}
          {hasVersions && isCompleted && !showOriginal && (
            <div className="absolute top-3 left-3 z-10">
              <VersionBadge
                count={versionCount}
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

          {/* Status Overlay */}
          <CardStatusOverlay status={job.status} errorMessage={job.error_message} />

          {/* Hover Action Bar */}
          <HoverActionBar
            isCompleted={isCompleted}
            hasOriginalImage={!!hasOriginalImage}
            hasStagedImage={!!job.staged_image_url}
            isFavorite={isFavorite}
            showOriginal={showOriginal}
            currentPropertyId={currentPropertyId}
            properties={properties}
            isTogglingFavorite={isTogglingFavorite}
            isAssigning={isAssigning}
            isDeleting={isDeleting}
            onToggleFavorite={handleToggleFavorite}
            onToggleCompare={handleToggleCompare}
            onRemix={handleRemix}
            onDownload={handleDownload}
            onAssignToProperty={assignToProperty}
            onDelete={handleDelete}
          />

          {/* Bottom Gradient + Info */}
          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-4 pt-12">
            <div className="flex items-center justify-between">
              <div className="min-w-0 flex-1">
                <h3 className="text-white font-semibold text-sm">{roomTypeLabel}</h3>
                <p className="text-white/70 text-xs truncate">
                  {styleLabel}
                  {currentProperty && ` • ${currentProperty.address}`}
                </p>
              </div>
              {/* Primary badge */}
              {job.is_primary_version && hasVersions && (
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
      <JobDetailDialog
        open={showDetail}
        onOpenChange={setShowDetail}
        job={job}
        currentProperty={currentProperty}
        hasOriginalImage={!!hasOriginalImage}
        showComparison={showComparison}
        onToggleComparison={() => setShowComparison(!showComparison)}
        onDownload={handleDownload}
      />

      {/* Download Dialog */}
      {job.staged_image_url && (
        <DownloadDialog
          open={showDownloadDialog}
          onOpenChange={setShowDownloadDialog}
          jobId={job.id}
          imageUrl={job.staged_image_url}
          roomType={job.room_type}
          style={job.style}
        />
      )}

      {/* Remix Dialog */}
      {isCompleted && hasOriginalImage && (
        <RemixDialog
          open={showRemixDialog}
          onOpenChange={setShowRemixDialog}
          job={job}
        />
      )}
    </>
  );
});
