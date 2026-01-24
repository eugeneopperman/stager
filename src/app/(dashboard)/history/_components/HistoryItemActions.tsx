"use client";

import { memo } from "react";
import { Star, Download } from "lucide-react";
import { ActionButton } from "@/components/ui/action-button";
import { cn } from "@/lib/utils";

interface HistoryItemActionsProps {
  isCompleted: boolean;
  hasImage: boolean;
  isFavorite: boolean;
  isTogglingFavorite: boolean;
  onToggleFavorite: () => void;
  onDownload: () => void;
}

export const HistoryItemActions = memo(function HistoryItemActions({
  isCompleted,
  hasImage,
  isFavorite,
  isTogglingFavorite,
  onToggleFavorite,
  onDownload,
}: HistoryItemActionsProps) {
  return (
    <div className="flex items-center gap-1">
      {isCompleted && (
        <ActionButton
          icon={Star}
          tooltip={isFavorite ? "Remove from Favorites" : "Add to Favorites"}
          onClick={onToggleFavorite}
          disabled={isTogglingFavorite}
          loading={isTogglingFavorite}
          iconClassName={cn(isFavorite && "text-yellow-500 fill-current")}
        />
      )}

      {isCompleted && hasImage && (
        <ActionButton
          icon={Download}
          tooltip="Download"
          onClick={onDownload}
        />
      )}
    </div>
  );
});
