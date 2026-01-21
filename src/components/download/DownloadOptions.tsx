"use client";

import { cn } from "@/lib/utils";
import { Check, Home } from "lucide-react";
import { RESOLUTION_OPTIONS, type ResolutionPreset } from "@/lib/download/presets";

interface DownloadOptionsProps {
  resolution: ResolutionPreset;
  watermark: boolean;
  onResolutionChange: (resolution: ResolutionPreset) => void;
  onWatermarkChange: (watermark: boolean) => void;
}

export function DownloadOptions({
  resolution,
  watermark,
  onResolutionChange,
  onWatermarkChange,
}: DownloadOptionsProps) {
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

      {/* Watermark Toggle */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-foreground">Watermark</label>
        <button
          type="button"
          onClick={() => onWatermarkChange(!watermark)}
          className={cn(
            "w-full flex items-center gap-3 p-3 rounded-xl",
            "border-2 transition-all duration-200",
            watermark
              ? "border-primary bg-primary/5 dark:bg-primary/10"
              : "border-border/60 dark:border-white/10 hover:border-border hover:bg-accent/30 dark:hover:bg-white/5"
          )}
        >
          <div
            className={cn(
              "flex items-center justify-center w-5 h-5 rounded border-2",
              "transition-colors duration-200",
              watermark
                ? "bg-primary border-primary"
                : "border-muted-foreground/40"
            )}
          >
            {watermark && <Check className="h-3 w-3 text-primary-foreground" />}
          </div>
          <span className="text-sm text-foreground">
            Add &quot;Virtually staged&quot; watermark
          </span>
        </button>

        {/* Watermark Preview */}
        {watermark && (
          <div className="mt-3 p-3 rounded-lg bg-muted/50">
            <p className="text-xs text-muted-foreground mb-2">Watermark preview:</p>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-black/60 text-white text-xs">
              <Home className="h-3.5 w-3.5" />
              <span>Virtually staged with AI</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
