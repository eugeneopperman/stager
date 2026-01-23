"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Loader2, Cpu } from "lucide-react";
import { type StagedVariation } from "./types";

interface ProcessingIndicatorProps {
  variations: StagedVariation[];
  currentIndex: number;
  getStyleLabel: (style: string) => string;
  provider?: string | null;
  compact?: boolean;
}

export function ProcessingIndicator({
  variations,
  currentIndex,
  getStyleLabel,
  provider,
  compact = false,
}: ProcessingIndicatorProps) {
  const progressMessage = variations.find(
    (v) => v.status === "processing" || v.status === "preprocessing"
  )?.progressMessage;

  if (compact) {
    return (
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <Loader2 className="h-5 w-5 animate-spin text-primary" />
            <div className="flex-1">
              <p className="font-medium text-sm">
                Generating {variations.length > 1 ? "variations" : "staging"}...
              </p>
              {currentIndex >= 0 && currentIndex < variations.length && (
                <p className="text-xs text-muted-foreground">
                  Style {currentIndex + 1} of {variations.length}: {getStyleLabel(variations[currentIndex].style)}
                </p>
              )}
              {progressMessage && (
                <p className="text-xs text-muted-foreground mt-1">
                  {progressMessage}
                </p>
              )}
            </div>
            {provider && (
              <div className="flex items-center gap-1 px-2 py-1 bg-muted rounded text-xs text-muted-foreground">
                <Cpu className="h-3 w-3" />
                {provider === "stable-diffusion" ? "SD + ControlNet" : "Gemini"}
              </div>
            )}
          </div>
          <div className="mt-3 flex gap-1.5">
            {variations.map((v) => (
              <div
                key={v.style}
                className={`h-1.5 flex-1 rounded-full transition-colors ${
                  v.status === "completed"
                    ? "bg-green-500"
                    : v.status === "processing"
                    ? "bg-primary animate-pulse"
                    : v.status === "preprocessing"
                    ? "bg-blue-500 animate-pulse"
                    : v.status === "queued"
                    ? "bg-yellow-500"
                    : v.status === "failed"
                    ? "bg-destructive"
                    : "bg-muted"
                }`}
              />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  // Full-page processing indicator (for wizard mode)
  return (
    <Card>
      <CardContent className="p-8">
        <div className="text-center space-y-6">
          <div className="inline-flex p-4 rounded-full bg-primary/10">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>

          <div>
            <h2 className="text-xl font-semibold mb-2">
              Generating Your Staged Variations
            </h2>
            <p className="text-muted-foreground">
              {currentIndex >= 0 && currentIndex < variations.length
                ? `Processing style ${currentIndex + 1} of ${variations.length}: ${getStyleLabel(variations[currentIndex].style)}`
                : "Finishing up..."}
            </p>
            {progressMessage && (
              <p className="text-sm text-muted-foreground mt-2">
                {progressMessage}
              </p>
            )}
          </div>

          {/* Progress bars */}
          <div className="flex gap-2">
            {variations.map((v) => (
              <div
                key={v.style}
                className={`h-2 flex-1 rounded-full transition-colors ${
                  v.status === "completed"
                    ? "bg-green-500"
                    : v.status === "processing"
                    ? "bg-primary animate-pulse"
                    : v.status === "preprocessing"
                    ? "bg-blue-500 animate-pulse"
                    : v.status === "queued"
                    ? "bg-yellow-500"
                    : v.status === "failed"
                    ? "bg-destructive"
                    : "bg-muted"
                }`}
              />
            ))}
          </div>

          {/* Style labels */}
          <div className="flex justify-center gap-4 flex-wrap">
            {variations.map((v) => (
              <div
                key={v.style}
                className={`text-xs px-2 py-1 rounded ${
                  v.status === "completed"
                    ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                    : v.status === "processing" || v.status === "preprocessing"
                    ? "bg-primary/10 text-primary"
                    : v.status === "failed"
                    ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                {getStyleLabel(v.style)}
              </div>
            ))}
          </div>

          {provider && (
            <div className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
              <Cpu className="h-3 w-3" />
              {provider === "stable-diffusion" ? "SD + ControlNet" : "Gemini"}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
