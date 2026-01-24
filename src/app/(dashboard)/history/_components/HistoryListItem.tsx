"use client";

import { useState, useCallback, memo } from "react";
import type { StagingJob } from "@/lib/database.types";
import { cn } from "@/lib/utils";
import { useStagingJobMutations } from "@/hooks";
import { formatRoomType, formatStyle } from "@/lib/formatters";
import { StatusBadge } from "./StatusBadge";
import { HistoryItemThumbnail } from "./HistoryItemThumbnail";
import { HistoryItemInfo } from "./HistoryItemInfo";
import { HistoryItemActions } from "./HistoryItemActions";
import { HistoryItemMenu } from "./HistoryItemMenu";
import { HistoryDetailDialog } from "./HistoryDetailDialog";

interface PropertyOption {
  id: string;
  address: string;
}

interface HistoryListItemProps {
  job: StagingJob;
  properties: PropertyOption[];
}

export const HistoryListItem = memo(function HistoryListItem({
  job,
  properties,
}: HistoryListItemProps) {
  const [showDetail, setShowDetail] = useState(false);

  const {
    currentPropertyId,
    currentProperty,
    isFavorite,
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

  const isCompleted = job.status === "completed";
  const roomTypeLabel = formatRoomType(job.room_type);
  const styleLabel = formatStyle(job.style);
  const displayImageUrl = job.staged_image_url || job.original_image_url;

  const handleDownload = useCallback(
    (e?: React.MouseEvent) => {
      e?.stopPropagation();
      if (job.staged_image_url) {
        const link = document.createElement("a");
        link.href = job.staged_image_url;
        link.download = `staged-${job.room_type}-${job.style}-${job.id}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
    },
    [job.staged_image_url, job.room_type, job.style, job.id]
  );

  const handleToggleFavorite = useCallback(() => {
    void toggleFavorite();
  }, [toggleFavorite]);

  const handleDelete = useCallback(() => {
    void deleteJob();
  }, [deleteJob]);

  return (
    <>
      {/* List Item */}
      <div
        className={cn(
          "flex items-center gap-4 p-3 rounded-xl border bg-card/60 backdrop-blur-sm",
          "transition-all duration-200 hover:bg-card hover:shadow-md",
          isCompleted && job.staged_image_url && "cursor-pointer"
        )}
        onClick={() => isCompleted && job.staged_image_url && setShowDetail(true)}
      >
        <HistoryItemThumbnail
          imageUrl={displayImageUrl}
          alt={`${roomTypeLabel} - ${styleLabel}`}
          isFavorite={isFavorite}
        />

        <HistoryItemInfo
          roomType={job.room_type}
          style={job.style}
          createdAt={job.created_at}
          property={currentProperty}
        />

        {/* Status */}
        <div className="flex-shrink-0 hidden sm:block">
          <StatusBadge status={job.status as "completed" | "processing" | "failed" | "pending"} />
        </div>

        {/* Actions */}
        <div
          className="flex items-center gap-1 flex-shrink-0"
          onClick={(e) => e.stopPropagation()}
        >
          <HistoryItemActions
            isCompleted={isCompleted}
            hasImage={!!job.staged_image_url}
            isFavorite={isFavorite}
            isTogglingFavorite={isTogglingFavorite}
            onToggleFavorite={handleToggleFavorite}
            onDownload={handleDownload}
          />

          <HistoryItemMenu
            isCompleted={isCompleted}
            properties={properties}
            currentPropertyId={currentPropertyId}
            isDeleting={isDeleting}
            onAssignProperty={assignToProperty}
            onDelete={handleDelete}
          />
        </div>
      </div>

      {/* Detail Dialog */}
      <HistoryDetailDialog
        open={showDetail}
        onOpenChange={setShowDetail}
        roomTypeLabel={roomTypeLabel}
        styleLabel={styleLabel}
        originalImageUrl={job.original_image_url}
        stagedImageUrl={job.staged_image_url}
        createdAt={job.created_at}
        property={currentProperty}
        onDownload={() => handleDownload()}
      />
    </>
  );
});
