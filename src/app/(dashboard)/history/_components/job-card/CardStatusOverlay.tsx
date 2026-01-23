"use client";

import { Clock, XCircle, Loader2 } from "lucide-react";
import type { StagingJobStatus } from "@/lib/database.types";

interface CardStatusOverlayProps {
  status: StagingJobStatus;
  errorMessage?: string | null;
}

export function CardStatusOverlay({ status, errorMessage }: CardStatusOverlayProps) {
  // Active processing states
  if (status === "processing" || status === "queued" || status === "preprocessing" || status === "uploading") {
    const label = status === "queued" ? "Queued..." :
                  status === "preprocessing" ? "Preparing..." :
                  status === "uploading" ? "Uploading..." : "Processing...";
    return (
      <div className="absolute inset-0 bg-black/50 backdrop-blur-[2px] flex flex-col items-center justify-center z-10">
        <Loader2 className="h-8 w-8 text-white animate-spin mb-2" />
        <span className="text-white text-sm font-medium">{label}</span>
      </div>
    );
  }

  if (status === "failed") {
    return (
      <div className="absolute inset-0 bg-red-500/30 backdrop-blur-[2px] flex flex-col items-center justify-center z-10">
        <XCircle className="h-8 w-8 text-white mb-2" />
        <span className="text-white text-sm font-medium">Failed</span>
        {errorMessage && (
          <span className="text-white/70 text-xs mt-1 px-4 text-center truncate max-w-full">
            {errorMessage}
          </span>
        )}
      </div>
    );
  }

  if (status === "pending") {
    return (
      <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px] flex flex-col items-center justify-center z-10">
        <Clock className="h-8 w-8 text-white mb-2" />
        <span className="text-white text-sm font-medium">Pending...</span>
      </div>
    );
  }

  return null;
}
