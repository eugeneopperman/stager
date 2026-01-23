"use client";

import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Circle } from "lucide-react";

type BrushMode = "stage" | "preserve";

interface BrushControlsProps {
  mode: BrushMode;
  brushSize: number;
  onModeChange: (mode: BrushMode) => void;
  onBrushSizeChange: (size: number) => void;
  disabled?: boolean;
}

export function BrushControls({
  mode,
  brushSize,
  onModeChange,
  onBrushSizeChange,
  disabled = false,
}: BrushControlsProps) {
  return (
    <>
      {/* Mode Toggle */}
      <div className="flex items-center gap-2">
        <span className="text-xs text-muted-foreground w-16">Mode</span>
        <div className="flex gap-1 flex-1">
          <Button
            variant={mode === "stage" ? "default" : "outline"}
            size="sm"
            onClick={() => onModeChange("stage")}
            disabled={disabled}
            className={`flex-1 gap-1.5 ${mode === "stage" ? "bg-green-600 hover:bg-green-700" : ""}`}
          >
            <div className="w-3 h-3 rounded-full bg-green-500" />
            Stage
          </Button>
          <Button
            variant={mode === "preserve" ? "default" : "outline"}
            size="sm"
            onClick={() => onModeChange("preserve")}
            disabled={disabled}
            className={`flex-1 gap-1.5 ${mode === "preserve" ? "bg-red-600 hover:bg-red-700" : ""}`}
          >
            <div className="w-3 h-3 rounded-full bg-red-500" />
            Preserve
          </Button>
        </div>
      </div>

      {/* Brush Size */}
      <div className="flex items-center gap-3">
        <span className="text-xs text-muted-foreground w-16">Brush</span>
        <Circle className="h-3 w-3 text-muted-foreground" />
        <Slider
          value={[brushSize]}
          onValueChange={(v) => onBrushSizeChange(v[0])}
          min={10}
          max={100}
          step={5}
          disabled={disabled}
          className="flex-1"
        />
        <Circle className="h-5 w-5 text-muted-foreground" />
        <span className="text-xs text-muted-foreground w-8 text-right">{brushSize}px</span>
      </div>
    </>
  );
}
