"use client";

import { memo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Download, ArrowLeftRight } from "lucide-react";
import { ComparisonSlider } from "@/components/staging/shared/ComparisonSlider";
import { formatFullDate } from "@/lib/formatters";

interface PropertyOption {
  id: string;
  address: string;
}

interface HistoryDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  roomTypeLabel: string;
  styleLabel: string;
  originalImageUrl: string | null;
  stagedImageUrl: string | null;
  createdAt: string;
  property?: PropertyOption | null;
  onDownload: () => void;
}

export const HistoryDetailDialog = memo(function HistoryDetailDialog({
  open,
  onOpenChange,
  roomTypeLabel,
  styleLabel,
  originalImageUrl,
  stagedImageUrl,
  createdAt,
  property,
  onDownload,
}: HistoryDetailDialogProps) {
  const [showComparison, setShowComparison] = useState(false);
  const hasOriginalImage = originalImageUrl && !originalImageUrl.includes("...");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
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
              originalImage={originalImageUrl || ""}
              stagedImage={stagedImageUrl || ""}
              objectFit="contain"
              labelPosition="top"
              bare
            />
          ) : (
            <div className="relative rounded-lg overflow-hidden bg-muted aspect-video">
              <Image
                src={stagedImageUrl || ""}
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
              Created {formatFullDate(createdAt)}
              {property && (
                <span className="ml-2">
                  •{" "}
                  <Link
                    href={`/properties/${property.id}`}
                    className="text-primary hover:underline"
                  >
                    {property.address}
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
});
