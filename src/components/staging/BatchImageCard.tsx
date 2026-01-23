"use client";

import Image from "next/image";
import { cn } from "@/lib/utils";
import { ROOM_TYPES, type RoomType } from "@/lib/constants";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import {
  Loader2,
  CheckCircle2,
  XCircle,
  Clock,
  Download,
  RotateCcw,
  Sofa,
  Bed,
  Baby,
  UtensilsCrossed,
  CookingPot,
  Briefcase,
  Bath,
  Trees,
  LucideIcon,
} from "lucide-react";

const iconMap: Record<string, LucideIcon> = {
  sofa: Sofa,
  bed: Bed,
  baby: Baby,
  utensils: UtensilsCrossed,
  "cooking-pot": CookingPot,
  briefcase: Briefcase,
  bath: Bath,
  trees: Trees,
};

export type BatchImageStatus = "pending" | "configuring" | "processing" | "completed" | "failed";

export interface BatchImageData {
  id: string;
  preview: string;
  roomType: RoomType | null;
  status: BatchImageStatus;
  stagedImageUrl?: string;
  error?: string;
  jobId?: string;
}

interface BatchImageCardProps {
  image: BatchImageData;
  onRoomTypeChange?: (roomType: RoomType) => void;
  onDownload?: () => void;
  onRetry?: () => void;
  mode: "configure" | "processing" | "results";
}

export function BatchImageCard({
  image,
  onRoomTypeChange,
  onDownload,
  onRetry,
  mode,
}: BatchImageCardProps) {
  const roomTypeInfo = ROOM_TYPES.find((r) => r.id === image.roomType);
  const RoomIcon = roomTypeInfo ? iconMap[roomTypeInfo.icon] || Sofa : null;

  return (
    <div
      className={cn(
        "relative rounded-lg overflow-hidden border bg-white dark:bg-slate-900",
        image.status === "failed"
          ? "border-red-300 dark:border-red-800"
          : image.status === "completed"
          ? "border-green-300 dark:border-green-800"
          : "border-slate-200 dark:border-slate-700"
      )}
    >
      {/* Image */}
      <div className="relative aspect-video">
        <Image
          src={mode === "results" && image.stagedImageUrl ? image.stagedImageUrl : image.preview}
          alt={roomTypeInfo?.label || "Room"}
          fill
          className="object-cover"
          unoptimized
        />

        {/* Status Overlay */}
        {mode === "processing" && (
          <div
            className={cn(
              "absolute inset-0 flex items-center justify-center",
              image.status === "pending" && "bg-slate-900/50",
              image.status === "processing" && "bg-blue-900/50",
              image.status === "completed" && "bg-green-900/50",
              image.status === "failed" && "bg-red-900/50"
            )}
          >
            {image.status === "pending" && (
              <div className="flex items-center gap-2 text-white">
                <Clock className="h-5 w-5" />
                <span className="text-sm font-medium">Waiting...</span>
              </div>
            )}
            {image.status === "processing" && (
              <div className="flex items-center gap-2 text-white">
                <Loader2 className="h-5 w-5 animate-spin" />
                <span className="text-sm font-medium">Staging...</span>
              </div>
            )}
            {image.status === "completed" && (
              <CheckCircle2 className="h-10 w-10 text-green-400" />
            )}
            {image.status === "failed" && (
              <XCircle className="h-10 w-10 text-red-400" />
            )}
          </div>
        )}

        {/* Results mode - completed badge */}
        {mode === "results" && image.status === "completed" && (
          <div className="absolute top-2 right-2">
            <CheckCircle2 className="h-6 w-6 text-green-500 drop-shadow-lg" />
          </div>
        )}

        {/* Results mode - failed badge */}
        {mode === "results" && image.status === "failed" && (
          <div className="absolute inset-0 bg-red-900/70 flex items-center justify-center">
            <div className="text-center text-white p-2">
              <XCircle className="h-8 w-8 mx-auto mb-1" />
              <p className="text-xs">Failed</p>
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="p-2">
        {mode === "configure" && (
          <Select
            value={image.roomType || ""}
            onValueChange={(value) => onRoomTypeChange?.(value as RoomType)}
          >
            <SelectTrigger className="h-8 text-xs">
              <SelectValue placeholder="Select room type" />
            </SelectTrigger>
            <SelectContent>
              {ROOM_TYPES.map((room) => {
                const Icon = iconMap[room.icon] || Sofa;
                return (
                  <SelectItem key={room.id} value={room.id}>
                    <div className="flex items-center gap-2">
                      <Icon className="h-3 w-3" />
                      <span>{room.label}</span>
                    </div>
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>
        )}

        {mode === "processing" && (
          <div className="flex items-center gap-2 h-8">
            {RoomIcon && <RoomIcon className="h-4 w-4 text-slate-400" />}
            <span className="text-xs text-slate-600 dark:text-slate-400 truncate">
              {roomTypeInfo?.label || "Unknown"}
            </span>
          </div>
        )}

        {mode === "results" && (
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              {RoomIcon && <RoomIcon className="h-4 w-4 text-slate-400 flex-shrink-0" />}
              <span className="text-xs text-slate-600 dark:text-slate-400 truncate">
                {roomTypeInfo?.label || "Unknown"}
              </span>
            </div>
            {image.status === "completed" && onDownload && (
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 flex-shrink-0"
                onClick={onDownload}
              >
                <Download className="h-3 w-3" />
              </Button>
            )}
            {image.status === "failed" && onRetry && (
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 flex-shrink-0 text-red-500 hover:text-red-600"
                onClick={onRetry}
              >
                <RotateCcw className="h-3 w-3" />
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
