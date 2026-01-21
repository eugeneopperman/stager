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
import { Download, Loader2 } from "lucide-react";
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
  const [includeWatermark, setIncludeWatermark] = useState(false);
  const [includeClean, setIncludeClean] = useState(true);
  const [isDownloading, setIsDownloading] = useState(false);

  const formatLabel = (str: string) =>
    str
      .split("-")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");

  const handleDownload = async () => {
    setIsDownloading(true);

    try {
      const baseName = `${formatLabel(roomType)}-${formatLabel(style)}`;
      const needsBoth = includeWatermark && includeClean;

      if (needsBoth) {
        // Download both versions and create ZIP
        const JSZip = (await import("jszip")).default;
        const zip = new JSZip();

        // Download watermarked version
        const watermarkedParams = new URLSearchParams({
          jobId,
          resolution,
          watermark: "true",
        });
        const watermarkedResponse = await fetch(`/api/download/image?${watermarkedParams.toString()}`);
        if (!watermarkedResponse.ok) throw new Error("Failed to download watermarked image");
        const watermarkedBlob = await watermarkedResponse.blob();

        // Download clean version
        const cleanParams = new URLSearchParams({
          jobId,
          resolution,
          watermark: "false",
        });
        const cleanResponse = await fetch(`/api/download/image?${cleanParams.toString()}`);
        if (!cleanResponse.ok) throw new Error("Failed to download clean image");
        const cleanBlob = await cleanResponse.blob();

        zip.file(`watermarked/${baseName}.jpg`, watermarkedBlob);
        zip.file(`clean/${baseName}.jpg`, cleanBlob);

        const zipBlob = await zip.generateAsync({ type: "blob" });
        const url = URL.createObjectURL(zipBlob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `${baseName}.zip`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      } else {
        // Single download
        const params = new URLSearchParams({
          jobId,
          resolution,
          watermark: String(includeWatermark),
        });

        const response = await fetch(`/api/download/image?${params.toString()}`);
        if (!response.ok) throw new Error("Failed to download image");

        const blob = await response.blob();
        const url = URL.createObjectURL(blob);

        const suffix = includeWatermark ? "-watermarked" : "";
        const filename = `${baseName}${suffix}.jpg`;

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
      setIsDownloading(false);
    }
  };

  const needsZip = includeWatermark && includeClean;

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
            includeWatermark={includeWatermark}
            includeClean={includeClean}
            onResolutionChange={setResolution}
            onIncludeWatermarkChange={setIncludeWatermark}
            onIncludeCleanChange={setIncludeClean}
          />
        </div>

        <DialogFooter>
          <Button
            onClick={handleDownload}
            disabled={isDownloading}
            className="w-full"
          >
            {isDownloading ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Download className="h-4 w-4 mr-2" />
            )}
            {needsZip ? "Download ZIP" : "Download"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
