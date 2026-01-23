"use client";

import { useState, useCallback, memo, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ActionButton } from "@/components/ui/action-button";
import {
  Download,
  Clock,
  CheckCircle2,
  XCircle,
  Loader2,
  ArrowLeftRight,
  Plus,
  Check,
  Trash2,
  Star,
  MoreHorizontal,
} from "lucide-react";
import type { StagingJob } from "@/lib/database.types";
import { cn } from "@/lib/utils";
import { ComparisonSlider } from "@/components/staging/shared/ComparisonSlider";
import { useStagingJobMutations } from "@/hooks";
import { formatRoomType, formatStyle, formatFullDate } from "@/lib/formatters";

interface PropertyOption {
  id: string;
  address: string;
}

interface HistoryListItemProps {
  job: StagingJob;
  properties: PropertyOption[];
}

export const HistoryListItem = memo(function HistoryListItem({ job, properties }: HistoryListItemProps) {
  const [showDetail, setShowDetail] = useState(false);
  const [showComparison, setShowComparison] = useState(false);

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

  const hasOriginalImage = job.original_image_url && !job.original_image_url.includes("...");
  const isCompleted = job.status === "completed";
  const isProcessing = job.status === "processing";
  const isFailed = job.status === "failed";
  const isPending = job.status === "pending";

  const roomTypeLabel = formatRoomType(job.room_type);
  const styleLabel = formatStyle(job.style);

  const handleDownload = useCallback((e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (job.staged_image_url) {
      const link = document.createElement("a");
      link.href = job.staged_image_url;
      link.download = `staged-${job.room_type}-${job.style}-${job.id}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  }, [job.staged_image_url, job.room_type, job.style, job.id]);

  const handleToggleFavorite = useCallback(() => {
    void toggleFavorite();
  }, [toggleFavorite]);

  const handleDelete = useCallback(() => {
    void deleteJob();
  }, [deleteJob]);

  const statusBadge = useMemo(() => {
    if (isCompleted) {
      return (
        <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-500/30">
          <CheckCircle2 className="h-3 w-3 mr-1" />
          Completed
        </Badge>
      );
    }
    if (isProcessing) {
      return (
        <Badge variant="outline" className="bg-amber-500/10 text-amber-600 border-amber-500/30">
          <Loader2 className="h-3 w-3 mr-1 animate-spin" />
          Processing
        </Badge>
      );
    }
    if (isFailed) {
      return (
        <Badge variant="outline" className="bg-red-500/10 text-red-600 border-red-500/30">
          <XCircle className="h-3 w-3 mr-1" />
          Failed
        </Badge>
      );
    }
    if (isPending) {
      return (
        <Badge variant="outline" className="bg-slate-500/10 text-slate-600 border-slate-500/30">
          <Clock className="h-3 w-3 mr-1" />
          Pending
        </Badge>
      );
    }
    return null;
  }, [isCompleted, isProcessing, isFailed, isPending]);

  const displayImageUrl = job.staged_image_url || job.original_image_url;

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
        {/* Thumbnail */}
        <div className="relative h-16 w-24 rounded-lg overflow-hidden flex-shrink-0 bg-muted">
          {displayImageUrl ? (
            <Image
              src={displayImageUrl}
              alt={`${roomTypeLabel} - ${styleLabel}`}
              fill
              className="object-cover"
              unoptimized
            />
          ) : (
            <div className="h-full w-full bg-muted" />
          )}
          {/* Favorite indicator */}
          {isFavorite && (
            <div className="absolute top-1 right-1">
              <Star className="h-3 w-3 text-yellow-400 fill-yellow-400" />
            </div>
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-medium text-foreground truncate">
              {roomTypeLabel}
            </h3>
            <span className="text-muted-foreground text-sm">•</span>
            <span className="text-sm text-muted-foreground truncate">
              {styleLabel}
            </span>
          </div>
          <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
            <span>{formatFullDate(job.created_at)}</span>
            {currentProperty && (
              <>
                <span>•</span>
                <span className="truncate">{currentProperty.address}</span>
              </>
            )}
          </div>
        </div>

        {/* Status */}
        <div className="flex-shrink-0 hidden sm:block">
          {statusBadge}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
          {/* Favorite */}
          {isCompleted && (
            <ActionButton
              icon={Star}
              tooltip={isFavorite ? "Remove from Favorites" : "Add to Favorites"}
              onClick={handleToggleFavorite}
              disabled={isTogglingFavorite}
              loading={isTogglingFavorite}
              iconClassName={cn(isFavorite && "text-yellow-500 fill-current")}
            />
          )}

          {/* Download */}
          {isCompleted && job.staged_image_url && (
            <ActionButton
              icon={Download}
              tooltip="Download"
              onClick={handleDownload}
            />
          )}

          {/* More Actions */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              {isCompleted && (
                <>
                  <DropdownMenuLabel>Add to Property</DropdownMenuLabel>
                  {properties.length > 0 ? (
                    <>
                      {properties.map((property) => (
                        <DropdownMenuItem
                          key={property.id}
                          onClick={() => assignToProperty(property.id)}
                          className="flex items-center justify-between"
                        >
                          <span className="truncate">{property.address}</span>
                          {currentPropertyId === property.id && (
                            <Check className="h-4 w-4 text-green-600 shrink-0 ml-2" />
                          )}
                        </DropdownMenuItem>
                      ))}
                      {currentPropertyId && (
                        <DropdownMenuItem
                          onClick={() => assignToProperty(null)}
                          className="text-muted-foreground"
                        >
                          Remove from property
                        </DropdownMenuItem>
                      )}
                    </>
                  ) : (
                    <DropdownMenuItem asChild>
                      <Link href="/properties" className="flex items-center">
                        <Plus className="h-4 w-4 mr-2" />
                        Create a property first
                      </Link>
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator />
                </>
              )}
              <DropdownMenuItem
                onClick={handleDelete}
                disabled={isDeleting}
                className="text-red-600 focus:text-red-600"
              >
                {isDeleting ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Trash2 className="h-4 w-4 mr-2" />
                )}
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Detail Dialog */}
      <Dialog open={showDetail} onOpenChange={setShowDetail}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>
              {roomTypeLabel} - {styleLabel}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {/* Toggle - only show if original image exists */}
            {hasOriginalImage && (
              <div className="flex justify-center">
                <Button
                  variant={showComparison ? "default" : "outline"}
                  size="sm"
                  onClick={() => setShowComparison(!showComparison)}
                >
                  <ArrowLeftRight className="h-4 w-4 mr-2" />
                  {showComparison ? "Hide Comparison" : "Compare Before/After"}
                </Button>
              </div>
            )}

            {/* Image Display */}
            {showComparison && hasOriginalImage ? (
              <ComparisonSlider
                originalImage={job.original_image_url || ""}
                stagedImage={job.staged_image_url || ""}
                objectFit="contain"
                labelPosition="top"
                bare
              />
            ) : (
              <div className="relative rounded-lg overflow-hidden bg-muted aspect-video">
                <Image
                  src={job.staged_image_url || ""}
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
                Created {formatFullDate(job.created_at)}
                {currentProperty && (
                  <span className="ml-2">
                    •{" "}
                    <Link
                      href={`/properties/${currentProperty.id}`}
                      className="text-primary hover:underline"
                    >
                      {currentProperty.address}
                    </Link>
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
    </>
  );
});
