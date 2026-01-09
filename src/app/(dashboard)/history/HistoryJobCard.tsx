"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Download,
  Eye,
  Clock,
  CheckCircle2,
  XCircle,
  Loader2,
  ArrowLeftRight,
} from "lucide-react";
import type { StagingJob } from "@/lib/database.types";

interface HistoryJobCardProps {
  job: StagingJob;
}

export function HistoryJobCard({ job }: HistoryJobCardProps) {
  const [showDetail, setShowDetail] = useState(false);
  const [showComparison, setShowComparison] = useState(false);
  const [sliderPosition, setSliderPosition] = useState(50);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return (
          <Badge className="bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-400">
            <CheckCircle2 className="h-3 w-3 mr-1" />
            Completed
          </Badge>
        );
      case "processing":
        return (
          <Badge className="bg-yellow-100 text-yellow-700 dark:bg-yellow-950 dark:text-yellow-400">
            <Loader2 className="h-3 w-3 mr-1 animate-spin" />
            Processing
          </Badge>
        );
      case "failed":
        return (
          <Badge className="bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400">
            <XCircle className="h-3 w-3 mr-1" />
            Failed
          </Badge>
        );
      default:
        return (
          <Badge className="bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400">
            <Clock className="h-3 w-3 mr-1" />
            Pending
          </Badge>
        );
    }
  };

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

  const handleDownload = () => {
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

  const roomTypeLabel = job.room_type
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");

  const styleLabel = job.style
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");

  return (
    <>
      <Card className="overflow-hidden hover:shadow-lg transition-shadow">
        {/* Image Preview */}
        <div className="relative aspect-video bg-slate-100 dark:bg-slate-900">
          {job.staged_image_url ? (
            <img
              src={job.staged_image_url}
              alt="Staged room"
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="flex items-center justify-center h-full">
              {job.status === "processing" ? (
                <Loader2 className="h-8 w-8 text-slate-400 animate-spin" />
              ) : (
                <XCircle className="h-8 w-8 text-slate-300" />
              )}
            </div>
          )}
          {/* Status Badge Overlay */}
          <div className="absolute top-2 right-2">
            {getStatusBadge(job.status)}
          </div>
        </div>

        <CardContent className="p-4">
          {/* Room Type & Style */}
          <div className="mb-3">
            <h3 className="font-semibold text-slate-900 dark:text-white">
              {roomTypeLabel}
            </h3>
            <p className="text-sm text-slate-500">{styleLabel} style</p>
          </div>

          {/* Date */}
          <p className="text-xs text-slate-400 mb-4">
            {formatDate(job.created_at)}
          </p>

          {/* Actions */}
          {job.status === "completed" && job.staged_image_url && (
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                className="flex-1"
                onClick={() => setShowDetail(true)}
              >
                <Eye className="h-4 w-4 mr-1" />
                View
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="flex-1"
                onClick={handleDownload}
              >
                <Download className="h-4 w-4 mr-1" />
                Download
              </Button>
            </div>
          )}

          {job.status === "failed" && job.error_message && (
            <p className="text-xs text-red-500 truncate" title={job.error_message}>
              {job.error_message}
            </p>
          )}
        </CardContent>
      </Card>

      {/* Detail Dialog */}
      <Dialog open={showDetail} onOpenChange={setShowDetail}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>
              {roomTypeLabel} - {styleLabel}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {/* Toggle */}
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

            {/* Image Display */}
            {showComparison && job.original_image_url && !job.original_image_url.includes("...") ? (
              <div
                className="relative aspect-video cursor-col-resize select-none rounded-lg overflow-hidden"
                onMouseMove={handleSliderMove}
              >
                <img
                  src={job.original_image_url}
                  alt="Original"
                  className="absolute inset-0 w-full h-full object-contain bg-slate-100 dark:bg-slate-900"
                />
                <div
                  className="absolute inset-0 overflow-hidden"
                  style={{ width: `${sliderPosition}%` }}
                >
                  <img
                    src={job.staged_image_url || ""}
                    alt="Staged"
                    className="absolute inset-0 w-full h-full object-contain bg-slate-100 dark:bg-slate-900"
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
              <div className="rounded-lg overflow-hidden bg-slate-100 dark:bg-slate-900">
                <img
                  src={job.staged_image_url || ""}
                  alt="Staged room"
                  className="w-full h-auto max-h-[70vh] object-contain"
                />
              </div>
            )}

            {/* Info & Actions */}
            <div className="flex items-center justify-between pt-4 border-t">
              <div className="text-sm text-slate-500">
                Created {formatDate(job.created_at)}
              </div>
              <Button onClick={handleDownload}>
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
