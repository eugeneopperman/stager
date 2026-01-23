"use client";

import { cn } from "@/lib/utils";
import { ROOM_TYPES, ROOM_TYPE_ICONS, type RoomType } from "@/lib/constants";
import { Sofa } from "lucide-react";

interface RoomTypeSelectorProps {
  value: RoomType | null;
  onChange: (value: RoomType) => void;
  disabled?: boolean;
}

export function RoomTypeSelector({
  value,
  onChange,
  disabled = false,
}: RoomTypeSelectorProps) {
  return (
    <div className="space-y-3">
      <label className="text-sm font-medium text-foreground">
        Room Type
      </label>
      <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-5 gap-2">
        {ROOM_TYPES.map((room) => {
          const Icon = ROOM_TYPE_ICONS[room.icon] || Sofa;
          const isSelected = value === room.id;

          return (
            <button
              key={room.id}
              type="button"
              onClick={() => onChange(room.id)}
              disabled={disabled}
              className={cn(
                "flex flex-col items-center gap-2 p-3 rounded-xl text-center",
                // Border
                "border-2",
                // Transitions
                "transition-all duration-200 ease-out",
                // Hover/Press effects
                "hover:scale-[1.03] active:scale-[0.97]",
                // States
                isSelected
                  ? "border-primary bg-primary/5 dark:bg-primary/10 shadow-md shadow-primary/10"
                  : "border-border/60 dark:border-white/10 hover:border-border hover:bg-accent/30 dark:hover:bg-white/5",
                disabled && "opacity-50 cursor-not-allowed hover:scale-100 active:scale-100"
              )}
            >
              <Icon
                className={cn(
                  "h-5 w-5 transition-transform duration-200",
                  isSelected
                    ? "text-primary scale-110"
                    : "text-muted-foreground"
                )}
              />
              <span
                className={cn(
                  "text-xs font-medium",
                  isSelected
                    ? "text-primary"
                    : "text-muted-foreground"
                )}
              >
                {room.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
