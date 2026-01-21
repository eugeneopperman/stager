"use client";

import { cn } from "@/lib/utils";
import { Check, Home } from "lucide-react";
import { RESOLUTION_OPTIONS, type ResolutionPreset } from "@/lib/download/presets";

interface DownloadOptionsProps {
  resolution: ResolutionPreset;
  includeWatermark: boolean;
  includeClean: boolean;
  onResolutionChange: (resolution: ResolutionPreset) => void;
  onIncludeWatermarkChange: (include: boolean) => void;
  onIncludeCleanChange: (include: boolean) => void;
}

export function DownloadOptions({
  resolution,
  includeWatermark,
  includeClean,
  onResolutionChange,
  onIncludeWatermarkChange,
  onIncludeCleanChange,
}: DownloadOptionsProps) {
  // Ensure at least one option is selected
  const handleWatermarkChange = (checked: boolean) => {
    if (!checked && !includeClean) {
      // If unchecking watermark and clean is also unchecked, check clean
      onIncludeCleanChange(true);
    }
    onIncludeWatermarkChange(checked);
  };

  const handleCleanChange = (checked: boolean) => {
    if (!checked && !includeWatermark) {
      // If unchecking clean and watermark is also unchecked, check watermark
      onIncludeWatermarkChange(true);
    }
    onIncludeCleanChange(checked);
  };

  return (
    <div className="space-y-5">
      {/* Resolution Selection */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-foreground">Resolution</label>
        <div className="grid grid-cols-3 gap-2">
          {RESOLUTION_OPTIONS.map((preset) => {
            const isSelected = resolution === preset.id;

            return (
              <button
                key={preset.id}
                type="button"
                onClick={() => onResolutionChange(preset.id as ResolutionPreset)}
                className={cn(
                  "relative flex flex-col items-center gap-1 p-3 rounded-xl text-center",
                  "border-2",
                  "transition-all duration-200 ease-out",
                  "hover:scale-[1.02] active:scale-[0.98]",
                  isSelected
                    ? "border-primary bg-primary/5 dark:bg-primary/10 shadow-md shadow-primary/10"
                    : "border-border/60 dark:border-white/10 hover:border-border hover:bg-accent/30 dark:hover:bg-white/5"
                )}
              >
                {isSelected && (
                  <div
                    className={cn(
                      "absolute top-1.5 right-1.5 h-4 w-4 rounded-full flex items-center justify-center",
                      "bg-primary shadow-sm",
                      "animate-in zoom-in-50 duration-200"
                    )}
                  >
                    <Check className="h-2.5 w-2.5 text-primary-foreground" />
                  </div>
                )}
                <span
                  className={cn(
                    "text-sm font-medium",
                    isSelected ? "text-primary" : "text-foreground"
                  )}
                >
                  {preset.label}
                </span>
                <span className="text-xs text-muted-foreground">
                  {preset.description}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Watermark Options */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-foreground">Include in download</label>
        <div className="space-y-2">
          {/* With Watermark */}
          <button
            type="button"
            onClick={() => handleWatermarkChange(!includeWatermark)}
            className={cn(
              "w-full flex items-center gap-3 p-3 rounded-xl",
              "border-2 transition-all duration-200",
              includeWatermark
                ? "border-primary bg-primary/5 dark:bg-primary/10"
                : "border-border/60 dark:border-white/10 hover:border-border hover:bg-accent/30 dark:hover:bg-white/5"
            )}
          >
            <div
              className={cn(
                "flex items-center justify-center w-5 h-5 rounded border-2",
                "transition-colors duration-200",
                includeWatermark
                  ? "bg-primary border-primary"
                  : "border-muted-foreground/40"
              )}
            >
              {includeWatermark && <Check className="h-3 w-3 text-primary-foreground" />}
            </div>
            <div className="flex-1 text-left">
              <span className="text-sm text-foreground">With watermark</span>
              <div className="flex items-center gap-1.5 mt-1">
                <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-black/40 text-white text-[10px]">
                  <Home className="h-2.5 w-2.5" />
                  <span>Virtually staged with AI</span>
                </div>
              </div>
            </div>
          </button>

          {/* Without Watermark */}
          <button
            type="button"
            onClick={() => handleCleanChange(!includeClean)}
            className={cn(
              "w-full flex items-center gap-3 p-3 rounded-xl",
              "border-2 transition-all duration-200",
              includeClean
                ? "border-primary bg-primary/5 dark:bg-primary/10"
                : "border-border/60 dark:border-white/10 hover:border-border hover:bg-accent/30 dark:hover:bg-white/5"
            )}
          >
            <div
              className={cn(
                "flex items-center justify-center w-5 h-5 rounded border-2",
                "transition-colors duration-200",
                includeClean
                  ? "bg-primary border-primary"
                  : "border-muted-foreground/40"
              )}
            >
              {includeClean && <Check className="h-3 w-3 text-primary-foreground" />}
            </div>
            <span className="text-sm text-foreground">Without watermark</span>
          </button>
        </div>

        {/* Info text when both selected */}
        {includeWatermark && includeClean && (
          <p className="text-xs text-muted-foreground mt-2">
            ZIP will contain both watermarked and clean versions in separate folders.
          </p>
        )}
      </div>
    </div>
  );
}
