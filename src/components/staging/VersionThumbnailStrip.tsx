"use client";

import Image from "next/image";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Star, Loader2, MoreVertical } from "lucide-react";
import type { StagingJob } from "@/lib/database.types";

interface VersionThumbnailStripProps {
  versions: StagingJob[];
  currentVersionId: string;
  onVersionSelect: (version: StagingJob) => void;
  onSetPrimary?: (version: StagingJob) => void;
  isSettingPrimary?: boolean;
  className?: string;
}

export function VersionThumbnailStrip({
  versions,
  currentVersionId,
  onVersionSelect,
  onSetPrimary,
  isSettingPrimary = false,
  className,
}: VersionThumbnailStripProps) {
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

  if (versions.length <= 1) {
    return null;
  }

  return (
    <div className={cn("flex items-center gap-2 overflow-x-auto py-2", className)}>
      {versions.map((version) => {
        const isSelected = version.id === currentVersionId;
        const isPrimary = version.is_primary_version;
        const isCompleted = version.status === "completed";

        return (
          <div key={version.id} className="relative group flex-shrink-0">
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={() => isCompleted && onVersionSelect(version)}
                  disabled={!isCompleted}
                  aria-label={`${formatRoomType(version.room_type)} - ${formatStyle(version.style)}${isPrimary ? " (primary)" : ""}${isSelected ? " (selected)" : ""}`}
                  aria-current={isSelected ? "true" : undefined}
                  className={cn(
                    "relative w-[50px] h-[50px] rounded-lg overflow-hidden",
                    "transition-all duration-200",
                    "focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2",
                    isSelected
                      ? "ring-2 ring-primary ring-offset-2 ring-offset-background"
                      : "hover:ring-2 hover:ring-border hover:ring-offset-1",
                    !isCompleted && "opacity-50 cursor-not-allowed"
                  )}
                >
                  {version.staged_image_url ? (
                    <Image
                      src={version.staged_image_url}
                      alt={`${formatRoomType(version.room_type)} - ${formatStyle(version.style)}`}
                      fill
                      className="object-cover"
                      unoptimized
                    />
                  ) : (
                    <div className="w-full h-full bg-muted flex items-center justify-center">
                      <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                    </div>
                  )}

                  {/* Primary badge */}
                  {isPrimary && (
                    <div className="absolute top-0.5 right-0.5 p-0.5 rounded-full bg-yellow-500 shadow-sm">
                      <Star className="h-2.5 w-2.5 text-white fill-current" />
                    </div>
                  )}

                  {/* Selection indicator */}
                  {isSelected && (
                    <div className="absolute inset-0 bg-primary/20 pointer-events-none" />
                  )}
                </button>
              </TooltipTrigger>
              <TooltipContent side="top" className="text-xs">
                <div className="font-medium">{formatRoomType(version.room_type)}</div>
                <div className="text-muted-foreground">{formatStyle(version.style)}</div>
                {isPrimary && (
                  <div className="text-yellow-500 flex items-center gap-1 mt-1">
                    <Star className="h-3 w-3 fill-current" />
                    Primary
                  </div>
                )}
              </TooltipContent>
            </Tooltip>

            {/* Dropdown menu for actions - shown on hover */}
            {onSetPrimary && isCompleted && !isPrimary && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    aria-label={`Version options for ${formatRoomType(version.room_type)} - ${formatStyle(version.style)}`}
                    className={cn(
                      "absolute -top-1 -right-1 p-0.5 rounded-full",
                      "bg-black/60 backdrop-blur-sm text-white",
                      "opacity-0 group-hover:opacity-100 focus:opacity-100",
                      "transition-opacity duration-200",
                      "hover:bg-black/80",
                      "focus:outline-none focus:ring-2 focus:ring-primary"
                    )}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <MoreVertical className="h-3 w-3" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-40">
                  <DropdownMenuItem
                    onClick={() => onSetPrimary(version)}
                    disabled={isSettingPrimary}
                  >
                    <Star className="h-4 w-4 mr-2" />
                    Set as Primary
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        );
      })}
    </div>
  );
}
