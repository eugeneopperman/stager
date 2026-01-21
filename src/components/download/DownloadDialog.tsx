"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Download, Loader2, FolderDown } from "lucide-react";
import { DownloadOptions } from "./DownloadOptions";
import type { ResolutionPreset } from "@/lib/download/presets";

interface DownloadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  jobId: string;
  imageUrl: string;
  roomType: string;
  style: string;
}

export function DownloadDialog({
  open,
  onOpenChange,
  jobId,
  imageUrl,
  roomType,
  style,
}: DownloadDialogProps) {
  const [resolution, setResolution] = useState<ResolutionPreset>("original");
  const [watermark, setWatermark] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [isDownloadingBoth, setIsDownloadingBoth] = useState(false);

  const formatLabel = (str: string) =>
    str
      .split("-")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");

  const handleDownload = async (includeClean = false) => {
    const setLoading = includeClean ? setIsDownloadingBoth : setIsDownloading;
    setLoading(true);

    try {
      // Build the download URL
      const params = new URLSearchParams({
        jobId,
        resolution,
        watermark: includeClean ? "true" : String(watermark),
      });

      if (includeClean) {
        // For "Download Both", we need to download twice and create a client-side zip
        // Or we use a different endpoint. For simplicity, let's download both versions
        // one at a time

        // Download watermarked version
        const watermarkedResponse = await fetch(`/api/download/image?${params.toString()}`);
        if (!watermarkedResponse.ok) throw new Error("Failed to download watermarked image");
        const watermarkedBlob = await watermarkedResponse.blob();

        // Download clean version
        params.set("watermark", "false");
        const cleanResponse = await fetch(`/api/download/image?${params.toString()}`);
        if (!cleanResponse.ok) throw new Error("Failed to download clean image");
        const cleanBlob = await cleanResponse.blob();

        // Create a simple ZIP with both files using JSZip
        const JSZip = (await import("jszip")).default;
        const zip = new JSZip();

        const baseName = `${formatLabel(roomType)}-${formatLabel(style)}`;
        zip.file(`watermarked/${baseName}.jpg`, watermarkedBlob);
        zip.file(`clean/${baseName}.jpg`, cleanBlob);

        const zipBlob = await zip.generateAsync({ type: "blob" });
        const url = URL.createObjectURL(zipBlob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `${baseName}-both.zip`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      } else {
        // Single download
        const response = await fetch(`/api/download/image?${params.toString()}`);
        if (!response.ok) throw new Error("Failed to download image");

        const blob = await response.blob();
        const url = URL.createObjectURL(blob);

        // Get filename from Content-Disposition header or generate one
        const contentDisposition = response.headers.get("Content-Disposition");
        let filename = `${formatLabel(roomType)}-${formatLabel(style)}${watermark ? "-watermarked" : ""}.jpg`;
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
      }

      onOpenChange(false);
    } catch (error) {
      console.error("Download failed:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Download Image</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Image Preview */}
          <div className="aspect-video rounded-lg overflow-hidden bg-muted">
            <img
              src={imageUrl}
              alt={`${formatLabel(roomType)} - ${formatLabel(style)}`}
              className="w-full h-full object-cover"
            />
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
            Download
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
