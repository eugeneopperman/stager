"use client";

import { Button } from "@/components/ui/button";
import {
  RotateCw,
  RotateCcw,
  FlipHorizontal,
  FlipVertical,
} from "lucide-react";

interface TransformControlsProps {
  onRotate: (direction: "cw" | "ccw") => void;
  onFlip: (direction: "horizontal" | "vertical") => void;
  disabled?: boolean;
}

export function TransformControls({
  onRotate,
  onFlip,
  disabled = false,
}: TransformControlsProps) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-muted-foreground w-16">Rotate</span>
      <div className="flex gap-1">
        <Button
          variant="outline"
          size="icon-sm"
          onClick={() => onRotate("ccw")}
          disabled={disabled}
          title="Rotate left 90°"
        >
          <RotateCcw className="h-4 w-4" />
        </Button>
        <Button
          variant="outline"
          size="icon-sm"
          onClick={() => onRotate("cw")}
          disabled={disabled}
          title="Rotate right 90°"
        >
          <RotateCw className="h-4 w-4" />
        </Button>
      </div>
      <div className="w-px h-6 bg-border mx-1" />
      <span className="text-xs text-muted-foreground w-10">Flip</span>
      <div className="flex gap-1">
        <Button
          variant="outline"
          size="icon-sm"
          onClick={() => onFlip("horizontal")}
          disabled={disabled}
          title="Flip horizontal"
        >
          <FlipHorizontal className="h-4 w-4" />
        </Button>
        <Button
          variant="outline"
          size="icon-sm"
          onClick={() => onFlip("vertical")}
          disabled={disabled}
          title="Flip vertical"
        >
          <FlipVertical className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
