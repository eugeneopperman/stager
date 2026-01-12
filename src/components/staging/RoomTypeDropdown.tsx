"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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

interface RoomTypeDropdownProps {
  value: RoomType | null;
  onChange: (value: RoomType) => void;
  disabled?: boolean;
}

export function RoomTypeDropdown({
  value,
  onChange,
  disabled = false,
}: RoomTypeDropdownProps) {
  return (
    <Select
      value={value || undefined}
      onValueChange={(val) => onChange(val as RoomType)}
      disabled={disabled}
    >
      <SelectTrigger className="w-full h-11">
        <SelectValue placeholder="Select room type">
          {value && (
            <span className="flex items-center gap-2">
              {(() => {
                const room = ROOM_TYPES.find((r) => r.id === value);
                if (!room) return null;
                const Icon = iconMap[room.icon] || Sofa;
                return (
                  <>
                    <Icon className="h-4 w-4 text-muted-foreground" />
                    <span>{room.label}</span>
                  </>
                );
              })()}
            </span>
          )}
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        {ROOM_TYPES.map((room) => {
          const Icon = iconMap[room.icon] || Sofa;
          return (
            <SelectItem key={room.id} value={room.id}>
              <span className="flex items-center gap-2">
                <Icon className="h-4 w-4 text-muted-foreground" />
                <span>{room.label}</span>
              </span>
            </SelectItem>
          );
        })}
      </SelectContent>
    </Select>
  );
}
