"use client";

import { Button } from "@/components/ui/button";
import {
  Square,
  RectangleHorizontal,
  Monitor,
} from "lucide-react";

export type AspectRatio = "free" | "1:1" | "4:3" | "16:9";

export const ASPECT_RATIOS: { id: AspectRatio; label: string; icon: React.ElementType; ratio: number | null }[] = [
  { id: "free", label: "Free", icon: RectangleHorizontal, ratio: null },
  { id: "1:1", label: "1:1", icon: Square, ratio: 1 },
  { id: "4:3", label: "4:3", icon: RectangleHorizontal, ratio: 4 / 3 },
  { id: "16:9", label: "16:9", icon: Monitor, ratio: 16 / 9 },
];

interface AspectRatioSelectorProps {
  value: AspectRatio;
  onChange: (ratio: AspectRatio) => void;
  disabled?: boolean;
}

export function AspectRatioSelector({
  value,
  onChange,
  disabled = false,
}: AspectRatioSelectorProps) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-muted-foreground w-16">Aspect</span>
      <div className="flex gap-1">
        {ASPECT_RATIOS.map((ratio) => (
          <Button
            key={ratio.id}
            variant={value === ratio.id ? "default" : "outline"}
            size="sm"
            onClick={() => onChange(ratio.id)}
            disabled={disabled}
            className="px-2 text-xs"
          >
            {ratio.label}
          </Button>
        ))}
      </div>
    </div>
  );
}
