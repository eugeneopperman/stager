"use client";

import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Loader2, CheckCircle2, XCircle, Download } from "lucide-react";
import { type StagedVariation } from "./types";

interface VariationThumbnailsProps {
  variations: StagedVariation[];
  selectedStyle?: string;
  getStyleLabel: (style: string) => string;
  onSelect?: (style: string) => void;
  onDownload?: (variation: StagedVariation) => void;
}

export function VariationThumbnails({
  variations,
  selectedStyle,
  getStyleLabel,
  onSelect,
  onDownload,
}: VariationThumbnailsProps) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
      {variations.map((variation) => (
        <div
          key={variation.style}
          className={`relative aspect-video rounded-lg overflow-hidden cursor-pointer border-2 transition-all ${
            selectedStyle === variation.style
              ? "border-primary ring-2 ring-primary"
              : "border-transparent hover:border-border"
          }`}
          onClick={() => onSelect?.(variation.style)}
        >
          {variation.status === "completed" && variation.imageUrl ? (
            <>
              <Image
                src={variation.imageUrl}
                alt={getStyleLabel(variation.style)}
                fill
                className="object-cover"
                unoptimized
              />
              <div className="absolute top-1 right-1">
                <CheckCircle2 className="h-5 w-5 text-green-500 drop-shadow" />
              </div>
              {onDownload && (
                <Button
                  variant="secondary"
                  size="icon"
                  className="absolute bottom-1 right-1 h-7 w-7"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDownload(variation);
                  }}
                >
                  <Download className="h-3 w-3" />
                </Button>
              )}
            </>
          ) : variation.status === "failed" ? (
            <div className="w-full h-full bg-destructive/10 flex items-center justify-center">
              <XCircle className="h-8 w-8 text-destructive" />
            </div>
          ) : (
            <div className="w-full h-full bg-muted flex items-center justify-center">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          )}
          <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/70 to-transparent">
            <p className="text-white text-xs font-medium truncate">
              {getStyleLabel(variation.style)}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}
