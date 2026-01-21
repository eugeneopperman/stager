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
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import type { StagingJob } from "@/lib/database.types";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { DownloadDialog } from "@/components/download/DownloadDialog";

interface PropertyOption {
  id: string;
  address: string;
}

interface HistoryJobCardProps {
  job: StagingJob;
  properties: PropertyOption[];
}

export function HistoryJobCard({ job, properties }: HistoryJobCardProps) {
  const router = useRouter();
  const [showDetail, setShowDetail] = useState(false);
  const [showComparison, setShowComparison] = useState(false);
  const [sliderPosition, setSliderPosition] = useState(50);
  const [isAssigning, setIsAssigning] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isTogglingFavorite, setIsTogglingFavorite] = useState(false);
  const [currentPropertyId, setCurrentPropertyId] = useState<string | null>(job.property_id);
  const [isFavorite, setIsFavorite] = useState(job.is_favorite || false);
  const [showOriginal, setShowOriginal] = useState(false);
  const [showDownloadDialog, setShowDownloadDialog] = useState(false);

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

  const handleDownload = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (job.staged_image_url) {
      setShowDownloadDialog(true);
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

  const handleToggleFavorite = async (e: React.MouseEvent) => {
    e.stopPropagation();
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

  const handleToggleCompare = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowOriginal(!showOriginal);
  };

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
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

  // Determine which image to display
  const displayImageUrl = showOriginal && hasOriginalImage
    ? job.original_image_url
    : job.staged_image_url;

  return (
    <>
      {/* Card */}
      <div
        className={cn(
          "group relative aspect-[4/3] rounded-2xl overflow-hidden",
          "transition-all duration-300 ease-out",
          "hover:scale-[1.02] hover:shadow-xl",
          isCompleted && job.staged_image_url && "cursor-pointer"
        )}
        onClick={() => isCompleted && job.staged_image_url && setShowDetail(true)}
      >
        {/* Background Image */}
        {displayImageUrl ? (
          <img
            src={displayImageUrl}
            alt={`${roomTypeLabel} - ${styleLabel}`}
            className="absolute inset-0 w-full h-full object-cover transition-opacity duration-300"
          />
        ) : (
          <div className="absolute inset-0 bg-muted" />
        )}

        {/* Original Badge (when comparing) */}
        {showOriginal && hasOriginalImage && (
          <div className="absolute top-3 left-3 px-2 py-1 bg-black/70 backdrop-blur-sm rounded text-white text-xs font-medium z-10">
            Original
          </div>
        )}

        {/* Processing Overlay */}
        {isProcessing && (
          <div className="absolute inset-0 bg-black/50 backdrop-blur-[2px] flex flex-col items-center justify-center z-10">
            <Loader2 className="h-8 w-8 text-white animate-spin mb-2" />
            <span className="text-white text-sm font-medium">Processing...</span>
          </div>
        )}

        {/* Failed Overlay */}
        {isFailed && (
          <div className="absolute inset-0 bg-red-500/30 backdrop-blur-[2px] flex flex-col items-center justify-center z-10">
            <XCircle className="h-8 w-8 text-white mb-2" />
            <span className="text-white text-sm font-medium">Failed</span>
            {job.error_message && (
              <span className="text-white/70 text-xs mt-1 px-4 text-center truncate max-w-full">
                {job.error_message}
              </span>
            )}
          </div>
        )}

        {/* Pending Overlay */}
        {isPending && (
          <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px] flex flex-col items-center justify-center z-10">
            <Clock className="h-8 w-8 text-white mb-2" />
            <span className="text-white text-sm font-medium">Pending...</span>
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
          {/* Favorite */}
          {isCompleted && (
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={handleToggleFavorite}
                  disabled={isTogglingFavorite}
                  className={cn(
                    "p-1.5 rounded-full transition-colors",
                    "hover:bg-white/20",
                    isFavorite ? "text-yellow-400" : "text-white"
                  )}
                >
                  <Star className={cn("h-4 w-4", isFavorite && "fill-current")} />
                </button>
              </TooltipTrigger>
              <TooltipContent>
                {isFavorite ? "Remove from Favorites" : "Add to Favorites"}
              </TooltipContent>
            </Tooltip>
          )}

          {/* Compare (only if original exists) */}
          {isCompleted && hasOriginalImage && (
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

          {/* Download */}
          {isCompleted && job.staged_image_url && (
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
          )}

          {/* Property Dropdown */}
          {isCompleted && (
            <DropdownMenu>
              <Tooltip>
                <TooltipTrigger asChild>
                  <DropdownMenuTrigger asChild>
                    <button
                      disabled={isAssigning}
                      className={cn(
                        "p-1.5 rounded-full transition-colors",
                        "hover:bg-white/20 text-white",
                        currentPropertyId && "text-blue-400"
                      )}
                    >
                      {isAssigning ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Building2 className="h-4 w-4" />
                      )}
                    </button>
                  </DropdownMenuTrigger>
                </TooltipTrigger>
                <TooltipContent>Add to Property</TooltipContent>
              </Tooltip>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>Add to Property</DropdownMenuLabel>
                <DropdownMenuSeparator />
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
                      <>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => handleAssignToProperty(null)}
                          className="text-muted-foreground"
                        >
                          Remove from property
                        </DropdownMenuItem>
                      </>
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
              </DropdownMenuContent>
            </DropdownMenu>
          )}

          {/* Delete */}
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={handleDelete}
                disabled={isDeleting}
                className="p-1.5 rounded-full transition-colors hover:bg-red-500/50 text-white"
              >
                {isDeleting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Trash2 className="h-4 w-4" />
                )}
              </button>
            </TooltipTrigger>
            <TooltipContent>Delete</TooltipContent>
          </Tooltip>
        </div>

        {/* Bottom Gradient + Info */}
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-4 pt-12">
          <h3 className="text-white font-semibold text-sm">{roomTypeLabel}</h3>
          <p className="text-white/70 text-xs truncate">
            {styleLabel}
            {currentProperty && ` • ${currentProperty.address}`}
          </p>
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
              <Button onClick={(e) => handleDownload(e)}>
                <Download className="h-4 w-4 mr-2" />
                Download
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

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
    </>
  );
}
