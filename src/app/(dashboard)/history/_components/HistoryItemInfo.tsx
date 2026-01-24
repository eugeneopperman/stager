import { memo } from "react";
import { formatRoomType, formatStyle, formatFullDate } from "@/lib/formatters";

interface PropertyOption {
  id: string;
  address: string;
}

interface HistoryItemInfoProps {
  roomType: string;
  style: string;
  createdAt: string;
  property?: PropertyOption | null;
}

export const HistoryItemInfo = memo(function HistoryItemInfo({
  roomType,
  style,
  createdAt,
  property,
}: HistoryItemInfoProps) {
  const roomTypeLabel = formatRoomType(roomType);
  const styleLabel = formatStyle(style);

  return (
    <div className="flex-1 min-w-0">
      <div className="flex items-center gap-2">
        <h3 className="text-sm font-medium text-foreground truncate">
          {roomTypeLabel}
        </h3>
        <span className="text-muted-foreground text-sm">•</span>
        <span className="text-sm text-muted-foreground truncate">
          {styleLabel}
        </span>
      </div>
      <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
        <span>{formatFullDate(createdAt)}</span>
        {property && (
          <>
            <span>•</span>
            <span className="truncate">{property.address}</span>
          </>
        )}
      </div>
    </div>
  );
});
