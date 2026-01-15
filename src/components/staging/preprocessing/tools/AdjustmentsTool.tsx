"use client";

import { useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { RotateCcw } from "lucide-react";
import { type ImageAdjustments, DEFAULT_ADJUSTMENTS } from "../types";

interface AdjustmentsToolProps {
  imageUrl: string;
  adjustments: ImageAdjustments;
  onAdjustmentsChange: (adjustments: ImageAdjustments) => void;
  onApply: (dataUrl: string) => void;
  onCancel: () => void;
  disabled?: boolean;
}

export function AdjustmentsTool({
  imageUrl,
  adjustments,
  onAdjustmentsChange,
  onApply,
  onCancel,
  disabled = false,
}: AdjustmentsToolProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const handleBrightnessChange = useCallback(
    (value: number[]) => {
      onAdjustmentsChange({ ...adjustments, brightness: value[0] });
    },
    [adjustments, onAdjustmentsChange]
  );

  const handleContrastChange = useCallback(
    (value: number[]) => {
      onAdjustmentsChange({ ...adjustments, contrast: value[0] });
    },
    [adjustments, onAdjustmentsChange]
  );

  const handleReset = useCallback(() => {
    onAdjustmentsChange(DEFAULT_ADJUSTMENTS);
  }, [onAdjustmentsChange]);

  const handleApply = useCallback(async () => {
    // Create canvas and apply filters
    const img = new Image();
    img.crossOrigin = "anonymous";

    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const ctx = canvas.getContext("2d");

      if (!ctx) return;

      // Apply CSS filter equivalent
      const brightnessValue = 1 + adjustments.brightness / 100;
      const contrastValue = 1 + adjustments.contrast / 100;
      ctx.filter = `brightness(${brightnessValue}) contrast(${contrastValue})`;

      ctx.drawImage(img, 0, 0);

      // Get data URL and apply
      const dataUrl = canvas.toDataURL("image/png");
      onApply(dataUrl);
    };

    img.src = imageUrl;
  }, [imageUrl, adjustments, onApply]);

  const hasChanges =
    adjustments.brightness !== 0 || adjustments.contrast !== 0;

  return (
    <div className="space-y-4 p-4 bg-muted/30 rounded-lg border">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-medium">Adjustments</h4>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleReset}
          disabled={disabled || !hasChanges}
          className="h-7 px-2 text-xs"
        >
          <RotateCcw className="h-3 w-3 mr-1" />
          Reset
        </Button>
      </div>

      {/* Brightness Slider */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-xs text-muted-foreground">Brightness</label>
          <span className="text-xs font-mono text-muted-foreground w-8 text-right">
            {adjustments.brightness > 0 ? "+" : ""}
            {adjustments.brightness}
          </span>
        </div>
        <Slider
          value={[adjustments.brightness]}
          onValueChange={handleBrightnessChange}
          min={-100}
          max={100}
          step={1}
          disabled={disabled}
        />
      </div>

      {/* Contrast Slider */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-xs text-muted-foreground">Contrast</label>
          <span className="text-xs font-mono text-muted-foreground w-8 text-right">
            {adjustments.contrast > 0 ? "+" : ""}
            {adjustments.contrast}
          </span>
        </div>
        <Slider
          value={[adjustments.contrast]}
          onValueChange={handleContrastChange}
          min={-100}
          max={100}
          step={1}
          disabled={disabled}
        />
      </div>

      {/* Action Buttons */}
      <div className="flex gap-2 pt-2">
        <Button
          variant="outline"
          size="sm"
          onClick={onCancel}
          disabled={disabled}
          className="flex-1"
        >
          Cancel
        </Button>
        <Button
          size="sm"
          onClick={handleApply}
          disabled={disabled || !hasChanges}
          className="flex-1"
        >
          Apply
        </Button>
      </div>

      {/* Hidden canvas for processing */}
      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
}
