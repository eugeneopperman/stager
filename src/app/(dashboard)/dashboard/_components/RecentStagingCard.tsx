"use client";

import { memo } from "react";
import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import { ImagePlus, Clock } from "lucide-react";
import { cn } from "@/lib/utils";

interface StagingJob {
  id: string;
  room_type: string;
  style: string;
  status: string;
  staged_image_url: string | null;
  created_at: string;
}

interface RecentStagingCardProps {
  job: StagingJob;
}

function getStatusBadge(status: string) {
  switch (status) {
    case "completed":
      return <Badge variant="success">Completed</Badge>;
    case "processing":
      return <Badge variant="warning">Processing</Badge>;
    case "failed":
      return <Badge variant="destructive">Failed</Badge>;
    default:
      return <Badge variant="secondary">Pending</Badge>;
  }
}

export const RecentStagingCard = memo(function RecentStagingCard({
  job,
}: RecentStagingCardProps) {
  return (
    <div
      className={cn(
        "flex items-center justify-between p-4 rounded-xl",
        "bg-muted/50 dark:bg-white/5",
        "border border-border/50 dark:border-white/5",
        "transition-all duration-200",
        "hover:bg-muted/80 dark:hover:bg-white/8"
      )}
    >
      <div className="flex items-center gap-4">
        {job.staged_image_url && job.status === "completed" ? (
          <a
            href={job.staged_image_url}
            target="_blank"
            rel="noopener noreferrer"
            className={cn(
              "relative h-12 w-12 rounded-lg overflow-hidden flex-shrink-0",
              "bg-muted dark:bg-white/10",
              "ring-1 ring-border/50 dark:ring-white/10",
              "transition-all duration-200",
              "hover:ring-2 hover:ring-primary hover:scale-105"
            )}
          >
            <Image
              src={job.staged_image_url}
              alt={`${job.room_type} staged`}
              fill
              className="object-cover"
              unoptimized
            />
          </a>
        ) : (
          <div
            className={cn(
              "h-12 w-12 rounded-lg flex items-center justify-center flex-shrink-0",
              "bg-muted dark:bg-white/10"
            )}
          >
            <ImagePlus className="h-6 w-6 text-muted-foreground" />
          </div>
        )}
        <div>
          <p className="font-medium text-foreground capitalize">
            {job.room_type.replace("-", " ")}
          </p>
          <p className="text-sm text-muted-foreground capitalize">
            {job.style} style
          </p>
        </div>
      </div>
      <div className="flex items-center gap-4">
        {getStatusBadge(job.status)}
        <div className="text-right">
          <p className="text-sm text-muted-foreground flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {new Date(job.created_at).toLocaleDateString()}
          </p>
        </div>
      </div>
    </div>
  );
});
