"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Download, RefreshCw, ArrowLeftRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface StagingResultProps {
  originalImage: string;
  stagedImage: string;
  onReset: () => void;
  onDownload: () => void;
}

export function StagingResult({
  originalImage,
  stagedImage,
  onReset,
  onDownload,
}: StagingResultProps) {
  const [showComparison, setShowComparison] = useState(false);
  const [sliderPosition, setSliderPosition] = useState(50);

  const handleSliderMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percentage = (x / rect.width) * 100;
    setSliderPosition(Math.max(0, Math.min(100, percentage)));
  };

  return (
    <div className="space-y-6">
      {/* Result Display */}
      <Card className="overflow-hidden">
        <CardContent className="p-0">
          {showComparison ? (
            // Before/After Comparison Slider
            <div
              className="relative aspect-video cursor-col-resize select-none"
              onMouseMove={handleSliderMove}
            >
              {/* Original Image (Background) */}
              <img
                src={originalImage}
                alt="Original"
                className="absolute inset-0 w-full h-full object-contain bg-slate-100 dark:bg-slate-900"
              />

              {/* Staged Image (Foreground with clip) */}
              <div
                className="absolute inset-0 overflow-hidden"
                style={{ width: `${sliderPosition}%` }}
              >
                <img
                  src={stagedImage}
                  alt="Staged"
                  className="absolute inset-0 w-full h-full object-contain bg-slate-100 dark:bg-slate-900"
                  style={{ width: `${100 / (sliderPosition / 100)}%`, maxWidth: 'none' }}
                />
              </div>

              {/* Slider Line */}
              <div
                className="absolute top-0 bottom-0 w-1 bg-white shadow-lg cursor-col-resize"
                style={{ left: `${sliderPosition}%`, transform: 'translateX(-50%)' }}
              >
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-10 h-10 bg-white rounded-full shadow-lg flex items-center justify-center">
                  <ArrowLeftRight className="h-5 w-5 text-slate-600" />
                </div>
              </div>

              {/* Labels */}
              <div className="absolute top-4 left-4 px-2 py-1 bg-black/70 text-white text-xs font-medium rounded">
                Staged
              </div>
              <div className="absolute top-4 right-4 px-2 py-1 bg-black/70 text-white text-xs font-medium rounded">
                Original
              </div>
            </div>
          ) : (
            // Staged Image Only
            <div className="relative">
              <img
                src={stagedImage}
                alt="Staged result"
                className="w-full h-auto max-h-[600px] object-contain bg-slate-100 dark:bg-slate-900"
              />
              <div className="absolute top-4 left-4 px-3 py-1.5 bg-green-600 text-white text-sm font-medium rounded-full">
                Staged
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex flex-wrap gap-3">
        <Button
          variant="outline"
          onClick={() => setShowComparison(!showComparison)}
        >
          <ArrowLeftRight className="mr-2 h-4 w-4" />
          {showComparison ? "Hide Comparison" : "Compare"}
        </Button>
        <Button variant="outline" onClick={onReset}>
          <RefreshCw className="mr-2 h-4 w-4" />
          Stage Another
        </Button>
        <Button onClick={onDownload}>
          <Download className="mr-2 h-4 w-4" />
          Download
        </Button>
      </div>
    </div>
  );
}
