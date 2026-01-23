"use client";

import { useState } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Download, RefreshCw, ArrowLeftRight } from "lucide-react";
import { ComparisonSlider } from "./shared/ComparisonSlider";

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

  return (
    <div className="space-y-6">
      {/* Result Display */}
      <Card className="overflow-hidden">
        <CardContent className="p-0">
          {showComparison ? (
            <ComparisonSlider
              originalImage={originalImage}
              stagedImage={stagedImage}
              objectFit="contain"
              labelPosition="top"
              bare
            />
          ) : (
            // Staged Image Only
            <div className="relative aspect-video bg-slate-100 dark:bg-slate-900">
              <Image
                src={stagedImage}
                alt="Staged result"
                fill
                className="object-contain"
                unoptimized
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
