import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import { Clock, Sparkles } from "lucide-react";
import { CREDITS_PER_STAGING } from "@/lib/constants";

interface UsageHistoryItemProps {
  job: {
    id: string;
    created_at: string;
    credits_used: number | null;
    room_type: string;
    style: string;
    staged_image_url: string | null;
  };
}

function formatDate(dateString: string) {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function formatRoomType(roomType: string) {
  return roomType
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

export function UsageHistoryItem({ job }: UsageHistoryItemProps) {
  return (
    <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50 dark:bg-slate-900">
      <div className="flex items-center gap-3">
        <div className="relative h-12 w-12 rounded-lg bg-slate-200 dark:bg-slate-800 overflow-hidden flex-shrink-0">
          {job.staged_image_url ? (
            <Image
              src={job.staged_image_url}
              alt={`${formatRoomType(job.room_type)} staging`}
              fill
              className="object-cover"
              unoptimized
            />
          ) : (
            <div className="h-full w-full flex items-center justify-center">
              <Sparkles className="h-5 w-5 text-slate-400" />
            </div>
          )}
        </div>
        <div>
          <p className="font-medium text-slate-900 dark:text-white">
            {formatRoomType(job.room_type)} Staging
          </p>
          <p className="text-xs text-slate-500 flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {formatDate(job.created_at)}
          </p>
        </div>
      </div>
      <Badge variant="outline" className="text-red-600 border-red-200">
        -{job.credits_used || CREDITS_PER_STAGING} credit
      </Badge>
    </div>
  );
}
