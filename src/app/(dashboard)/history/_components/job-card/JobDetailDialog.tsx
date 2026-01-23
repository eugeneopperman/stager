"use client";

import Image from "next/image";
import Link from "next/link";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ArrowLeftRight, Download } from "lucide-react";
import type { StagingJob } from "@/lib/database.types";
import { ComparisonSlider } from "@/components/staging/shared/ComparisonSlider";
import { formatRoomType, formatStyle, formatFullDate } from "@/lib/formatters";

interface PropertyOption {
  id: string;
  address: string;
}

interface JobDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  job: StagingJob;
  currentProperty: PropertyOption | undefined;
  hasOriginalImage: boolean;
  showComparison: boolean;
  onToggleComparison: () => void;
  onDownload: (e: React.MouseEvent) => void;
}

export function JobDetailDialog({
  open,
  onOpenChange,
  job,
  currentProperty,
  hasOriginalImage,
  showComparison,
  onToggleComparison,
  onDownload,
}: JobDetailDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>
            {formatRoomType(job.room_type)} - {formatStyle(job.style)}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Toggle - only show if original image exists */}
          {hasOriginalImage && (
            <div className="flex justify-center">
              <Button
                variant={showComparison ? "default" : "outline"}
                size="sm"
                onClick={onToggleComparison}
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
            <Button onClick={onDownload}>
              <Download className="h-4 w-4 mr-2" />
              Download
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
