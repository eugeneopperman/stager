"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Download, Loader2, FolderDown, Images } from "lucide-react";
import { DownloadOptions } from "./DownloadOptions";
import type { ResolutionPreset } from "@/lib/download/presets";

interface BatchDownloadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  propertyId: string;
  propertyAddress: string;
  imageCount: number;
}

export function BatchDownloadDialog({
  open,
  onOpenChange,
  propertyId,
  propertyAddress,
  imageCount,
}: BatchDownloadDialogProps) {
  const [resolution, setResolution] = useState<ResolutionPreset>("original");
  const [watermark, setWatermark] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [isDownloadingBoth, setIsDownloadingBoth] = useState(false);

  const handleDownload = async (includeClean = false) => {
    const setLoading = includeClean ? setIsDownloadingBoth : setIsDownloading;
    setLoading(true);

    try {
      // Build the download URL
      const params = new URLSearchParams({
        propertyId,
        resolution,
        watermark: includeClean ? "true" : String(watermark),
        includeClean: String(includeClean),
      });

      const response = await fetch(`/api/download/batch?${params.toString()}`);
      if (!response.ok) throw new Error("Failed to download images");

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);

      // Get filename from Content-Disposition header or generate one
      const contentDisposition = response.headers.get("Content-Disposition");
      const sanitizedAddress = propertyAddress.replace(/[^a-z0-9]/gi, "-").substring(0, 50);
      let filename = `${sanitizedAddress}.zip`;
      if (contentDisposition) {
        const match = contentDisposition.match(/filename="(.+)"/);
        if (match) filename = match[1];
      }

      const link = document.createElement("a");
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      onOpenChange(false);
    } catch (error) {
      console.error("Batch download failed:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Download All Images</DialogTitle>
          <DialogDescription>
            Download all staged photos for this property as a ZIP file.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Property Info */}
          <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
            <div className="p-2 rounded-lg bg-primary/10">
              <Images className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="font-medium text-sm">{propertyAddress}</p>
              <p className="text-xs text-muted-foreground">
                {imageCount} staged {imageCount === 1 ? "photo" : "photos"}
              </p>
            </div>
          </div>

          {/* Download Options */}
          <DownloadOptions
            resolution={resolution}
            watermark={watermark}
            onResolutionChange={setResolution}
            onWatermarkChange={setWatermark}
          />
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          {watermark && (
            <Button
              variant="outline"
              onClick={() => handleDownload(true)}
              disabled={isDownloading || isDownloadingBoth}
              className="w-full sm:w-auto"
            >
              {isDownloadingBoth ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <FolderDown className="h-4 w-4 mr-2" />
              )}
              Download Both
            </Button>
          )}
          <Button
            onClick={() => handleDownload(false)}
            disabled={isDownloading || isDownloadingBoth}
            className="w-full sm:w-auto"
          >
            {isDownloading ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Download className="h-4 w-4 mr-2" />
            )}
            Download ZIP
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
