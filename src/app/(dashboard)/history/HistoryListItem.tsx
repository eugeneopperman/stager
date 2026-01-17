"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
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
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Download,
  Clock,
  CheckCircle2,
  XCircle,
  Loader2,
  ArrowLeftRight,
  Building2,
  Plus,
  Check,
  Trash2,
  Star,
  MoreHorizontal,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import type { StagingJob } from "@/lib/database.types";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface PropertyOption {
  id: string;
  address: string;
}

interface HistoryListItemProps {
  job: StagingJob;
  properties: PropertyOption[];
}

export function HistoryListItem({ job, properties }: HistoryListItemProps) {
  const router = useRouter();
  const [showDetail, setShowDetail] = useState(false);
  const [showComparison, setShowComparison] = useState(false);
  const [sliderPosition, setSliderPosition] = useState(50);
  const [isAssigning, setIsAssigning] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isTogglingFavorite, setIsTogglingFavorite] = useState(false);
  const [currentPropertyId, setCurrentPropertyId] = useState<string | null>(job.property_id);
  const [isFavorite, setIsFavorite] = useState(job.is_favorite || false);

  const currentProperty = properties.find((p) => p.id === currentPropertyId);
  const hasOriginalImage = job.original_image_url && !job.original_image_url.includes("...");
  const isCompleted = job.status === "completed";
  const isProcessing = job.status === "processing";
  const isFailed = job.status === "failed";
  const isPending = job.status === "pending";

  const roomTypeLabel = job.room_type
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");

  const styleLabel = job.style
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  };

  const handleDownload = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (job.staged_image_url) {
      const link = document.createElement("a");
      link.href = job.staged_image_url;
      link.download = `staged-${job.room_type}-${job.style}-${job.id}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const handleSliderMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percentage = (x / rect.width) * 100;
    setSliderPosition(Math.max(0, Math.min(100, percentage)));
  };

  const handleAssignToProperty = async (propertyId: string | null) => {
    setIsAssigning(true);
    const supabase = createClient();

    const { error } = await supabase
      .from("staging_jobs")
      .update({ property_id: propertyId })
      .eq("id", job.id);

    if (error) {
      console.error("Failed to assign property:", error);
      toast.error("Failed to update property");
    } else {
      setCurrentPropertyId(propertyId);
      const property = properties.find((p) => p.id === propertyId);
      if (propertyId && property) {
        toast.success(`Added to ${property.address}`);
      } else {
        toast.success("Removed from property");
      }
      router.refresh();
    }

    setIsAssigning(false);
  };

  const handleToggleFavorite = async (e?: React.MouseEvent) => {
    e?.stopPropagation();
    setIsTogglingFavorite(true);
    const supabase = createClient();

    const newValue = !isFavorite;
    const { error } = await supabase
      .from("staging_jobs")
      .update({ is_favorite: newValue })
      .eq("id", job.id);

    if (error) {
      console.error("Failed to toggle favorite:", error);
      toast.error("Failed to update favorite");
    } else {
      setIsFavorite(newValue);
      toast.success(newValue ? "Added to favorites" : "Removed from favorites");
    }

    setIsTogglingFavorite(false);
  };

  const handleDelete = async (e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (!confirm("Are you sure you want to delete this staging job? This action cannot be undone.")) {
      return;
    }

    setIsDeleting(true);
    const supabase = createClient();

    const { error } = await supabase
      .from("staging_jobs")
      .delete()
      .eq("id", job.id);

    if (error) {
      console.error("Failed to delete staging job:", error);
      toast.error("Failed to delete staging job. Please try again.");
      setIsDeleting(false);
    } else {
      toast.success("Staging job deleted");
      router.refresh();
    }
  };

  const getStatusBadge = () => {
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
  };

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
            <img
              src={displayImageUrl}
              alt={`${roomTypeLabel} - ${styleLabel}`}
              className="h-full w-full object-cover"
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
            <span>{formatDate(job.created_at)}</span>
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
          {getStatusBadge()}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
          {/* Favorite */}
          {isCompleted && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleToggleFavorite}
                  disabled={isTogglingFavorite}
                  className={cn(
                    "h-8 w-8 p-0",
                    isFavorite && "text-yellow-500"
                  )}
                >
                  <Star className={cn("h-4 w-4", isFavorite && "fill-current")} />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                {isFavorite ? "Remove from Favorites" : "Add to Favorites"}
              </TooltipContent>
            </Tooltip>
          )}

          {/* Download */}
          {isCompleted && job.staged_image_url && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleDownload}
                  className="h-8 w-8 p-0"
                >
                  <Download className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Download</TooltipContent>
            </Tooltip>
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
                          onClick={() => handleAssignToProperty(property.id)}
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
                          onClick={() => handleAssignToProperty(null)}
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
              <div
                className="relative aspect-video cursor-col-resize select-none rounded-lg overflow-hidden"
                onMouseMove={handleSliderMove}
              >
                <img
                  src={job.original_image_url}
                  alt="Original"
                  className="absolute inset-0 w-full h-full object-contain bg-muted"
                />
                <div
                  className="absolute inset-0 overflow-hidden"
                  style={{ width: `${sliderPosition}%` }}
                >
                  <img
                    src={job.staged_image_url || ""}
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
                  src={job.staged_image_url || ""}
                  alt="Staged room"
                  className="w-full h-auto max-h-[70vh] object-contain"
                />
              </div>
            )}

            {/* Info & Actions */}
            <div className="flex items-center justify-between pt-4 border-t">
              <div className="text-sm text-muted-foreground">
                Created {formatDate(job.created_at)}
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
}
