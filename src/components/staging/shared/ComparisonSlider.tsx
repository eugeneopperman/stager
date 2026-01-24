"use client";

import { useState, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeftRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface ComparisonSliderProps {
  originalImage: string;
  stagedImage: string;
  originalLabel?: string;
  stagedLabel?: string;
  className?: string;
  /** Use object-contain instead of object-cover */
  objectFit?: "cover" | "contain";
  /** Hide the Card wrapper */
  bare?: boolean;
  /** Label position: "bottom" (default) or "top" */
  labelPosition?: "bottom" | "top";
}

export function ComparisonSlider({
  originalImage,
  stagedImage,
  originalLabel = "Original",
  stagedLabel = "Staged",
  className,
  objectFit = "cover",
  bare = false,
  labelPosition = "bottom",
}: ComparisonSliderProps) {
  const [sliderPosition, setSliderPosition] = useState(50);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    setSliderPosition(Math.max(0, Math.min(100, x)));
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const touch = e.touches[0];
    const x = ((touch.clientX - rect.left) / rect.width) * 100;
    setSliderPosition(Math.max(0, Math.min(100, x)));
  };

  // Keyboard navigation for accessibility
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    const step = e.shiftKey ? 10 : 5; // Larger steps with shift key
    switch (e.key) {
      case "ArrowLeft":
        e.preventDefault();
        setSliderPosition((prev) => Math.max(0, prev - step));
        break;
      case "ArrowRight":
        e.preventDefault();
        setSliderPosition((prev) => Math.min(100, prev + step));
        break;
      case "Home":
        e.preventDefault();
        setSliderPosition(0);
        break;
      case "End":
        e.preventDefault();
        setSliderPosition(100);
        break;
    }
  }, []);

  const labelPositionClass = labelPosition === "top" ? "top-2" : "bottom-4";
  const objectFitClass = objectFit === "contain" ? "object-contain" : "object-cover";

  const sliderContent = (
    <div
      role="slider"
      aria-label={`Image comparison slider. ${stagedLabel} on left, ${originalLabel} on right. Use arrow keys to adjust.`}
      aria-valuenow={Math.round(sliderPosition)}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuetext={`${Math.round(sliderPosition)}% ${stagedLabel}, ${Math.round(100 - sliderPosition)}% ${originalLabel}`}
      tabIndex={0}
      className={cn(
        "relative aspect-video overflow-hidden rounded-lg cursor-ew-resize select-none",
        "focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2",
        objectFit === "contain" && "bg-muted"
      )}
      onMouseMove={handleMouseMove}
      onTouchMove={handleTouchMove}
      onKeyDown={handleKeyDown}
    >
      {/* Original image (background - right side) */}
      {/* eslint-disable-next-line @next/next/no-img-element -- Slider clipping effect requires dynamic sizing */}
      <img
        src={originalImage}
        alt="Original"
        className={cn("absolute inset-0 w-full h-full", objectFitClass)}
      />

      {/* Staged image (clipped overlay - left side) */}
      <div
        className="absolute inset-0 overflow-hidden"
        style={{ width: `${sliderPosition}%` }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element -- Slider clipping effect requires dynamic width calculation */}
        <img
          src={stagedImage}
          alt="Staged"
          className={cn("absolute inset-0 w-full h-full", objectFitClass)}
          style={{ width: `${100 / (sliderPosition / 100)}%`, maxWidth: "none" }}
        />
      </div>

      {/* Slider handle */}
      <div
        className="absolute top-0 bottom-0 w-1 bg-white shadow-lg cursor-ew-resize"
        style={{ left: `${sliderPosition}%`, transform: "translateX(-50%)" }}
      >
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 bg-white rounded-full shadow-lg flex items-center justify-center">
          <ArrowLeftRight className="h-4 w-4 text-slate-600" />
        </div>
      </div>

      {/* Labels */}
      <div className={cn("absolute left-2 px-2 py-1 bg-black/70 rounded text-white text-xs", labelPositionClass)}>
        {stagedLabel}
      </div>
      <div className={cn("absolute right-2 px-2 py-1 bg-black/70 rounded text-white text-xs", labelPositionClass)}>
        {originalLabel}
      </div>
    </div>
  );

  if (bare) {
    return <div className={className}>{sliderContent}</div>;
  }

  return (
    <Card className={className}>
      <CardContent className="p-0">{sliderContent}</CardContent>
    </Card>
  );
}
