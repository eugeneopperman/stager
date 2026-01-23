"use client";

import { Button } from "@/components/ui/button";
import { Download, RotateCcw, RefreshCw } from "lucide-react";
import { ComparisonSlider } from "./ComparisonSlider";
import { VariationThumbnails } from "./VariationThumbnails";
import { type StagedVariation } from "./types";
import { FURNITURE_STYLES } from "@/lib/constants";

interface ResultsViewProps {
  variations: StagedVariation[];
  originalPreview: string;
  compareIndex: number;
  onCompareIndexChange: (index: number) => void;
  onDownload: (variation: StagedVariation) => void;
  onDownloadAll: () => void;
  onReset: () => void;
  onRetry?: () => void;
  showRetry?: boolean;
  title?: string;
  className?: string;
}

/**
 * ResultsView - Displays staging results with comparison slider and thumbnails
 * Used in both QuickStageLayout and StagingWizard
 */
export function ResultsView({
  variations,
  originalPreview,
  compareIndex,
  onCompareIndexChange,
  onDownload,
  onDownloadAll,
  onReset,
  onRetry,
  showRetry = false,
  title = "Staging Complete!",
  className,
}: ResultsViewProps) {
  const completedVariations = variations.filter((v) => v.status === "completed");
  const currentVariation = completedVariations[compareIndex] || completedVariations[0];

  const getStyleLabel = (styleId: string) => {
    return FURNITURE_STYLES.find((s) => s.id === styleId)?.label || styleId;
  };

  if (completedVariations.length === 0) {
    return null;
  }

  return (
    <div className={`max-w-5xl mx-auto space-y-6 ${className || ""}`}>
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-foreground">{title}</h1>
          <p className="text-muted-foreground mt-2">
            {completedVariations.length} style variation
            {completedVariations.length !== 1 ? "s" : ""} generated
          </p>
        </div>
        <div className="flex gap-2">
          {completedVariations.length > 1 && (
            <Button variant="outline" onClick={onDownloadAll}>
              <Download className="mr-2 h-4 w-4" />
              Download All
            </Button>
          )}
          {showRetry && onRetry && (
            <Button variant="outline" onClick={onRetry}>
              <RefreshCw className="mr-2 h-4 w-4" />
              Try Different Style
            </Button>
          )}
          <Button onClick={onReset}>
            <RotateCcw className="mr-2 h-4 w-4" />
            Stage Another
          </Button>
        </div>
      </div>

      {/* Style Selection Buttons (for multiple variations) */}
      {completedVariations.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-2">
          {completedVariations.map((variation, index) => (
            <Button
              key={variation.style}
              variant={compareIndex === index ? "default" : "outline"}
              size="sm"
              onClick={() => onCompareIndexChange(index)}
            >
              {getStyleLabel(variation.style)}
            </Button>
          ))}
        </div>
      )}

      {/* Comparison Slider */}
      {currentVariation?.imageUrl && (
        <ComparisonSlider
          originalImage={originalPreview}
          stagedImage={currentVariation.imageUrl}
          stagedLabel={getStyleLabel(currentVariation.style)}
        />
      )}

      {/* Variation Thumbnails */}
      <VariationThumbnails
        variations={variations}
        selectedStyle={completedVariations[compareIndex]?.style}
        getStyleLabel={getStyleLabel}
        onSelect={(style) => {
          const completedIndex = completedVariations.findIndex((v) => v.style === style);
          if (completedIndex >= 0) onCompareIndexChange(completedIndex);
        }}
        onDownload={onDownload}
      />
    </div>
  );
}
