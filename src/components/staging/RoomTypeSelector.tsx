"use client";

import { cn } from "@/lib/utils";
import { ROOM_TYPES, type RoomType } from "@/lib/constants";
import {
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
      <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
        Room Type
      </label>
      <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-5 gap-2">
        {ROOM_TYPES.map((room) => {
          const Icon = iconMap[room.icon] || Sofa;
          const isSelected = value === room.id;

          return (
            <button
              key={room.id}
              type="button"
              onClick={() => onChange(room.id)}
              disabled={disabled}
              className={cn(
                "flex flex-col items-center gap-2 p-3 rounded-lg border-2 transition-all text-center",
                isSelected
                  ? "border-blue-600 bg-blue-50 dark:bg-blue-950/50"
                  : "border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600",
                disabled && "opacity-50 cursor-not-allowed"
              )}
            >
              <Icon
                className={cn(
                  "h-5 w-5",
                  isSelected
                    ? "text-blue-600"
                    : "text-slate-400 dark:text-slate-500"
                )}
              />
              <span
                className={cn(
                  "text-xs font-medium",
                  isSelected
                    ? "text-blue-700 dark:text-blue-400"
                    : "text-slate-600 dark:text-slate-400"
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
