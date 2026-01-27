"use client";

import { memo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ImageUploader } from "@/components/staging/ImageUploader";
import { PreprocessingToolbar } from "@/components/staging/preprocessing";
import { ProcessingIndicator, type StagedVariation } from "@/components/staging/shared";

interface QuickStageImagePanelProps {
  preview: string | null;
  workingPreview: string | null;
  selectedFile: File | null;
  workingFile: File | null;
  isProcessing: boolean;
  variations: StagedVariation[];
  processingIndex: number;
  currentProvider: string | null;
  onImageSelect: (file: File, previewUrl: string) => void;
  onImageClear: () => void;
  onPreprocessedImageUpdate: (file: File, previewUrl: string) => void;
  onMaskUpdate: (mask: string | null) => void;
  getStyleLabel: (styleId: string) => string;
}

export const QuickStageImagePanel = memo(function QuickStageImagePanel({
  preview,
  workingPreview,
  selectedFile,
  workingFile,
  isProcessing,
  variations,
  processingIndex,
  currentProvider,
  onImageSelect,
  onImageClear,
  onPreprocessedImageUpdate,
  onMaskUpdate,
  getStyleLabel,
}: QuickStageImagePanelProps) {
  return (
    <div className="lg:col-span-2 space-y-4">
      <Card className="overflow-hidden">
        <CardContent className="p-4" data-tour="stage-upload">
          {!preview ? (
            <ImageUploader
              onImageSelect={onImageSelect}
              onImageClear={onImageClear}
              preview={preview}
              disabled={isProcessing}
            />
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium text-muted-foreground">
                  Preprocessing Tools
                </h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onImageClear}
                  disabled={isProcessing}
                  className="text-xs"
                >
                  Change Image
                </Button>
              </div>
              <PreprocessingToolbar
                imageUrl={workingPreview || preview}
                imageFile={workingFile || selectedFile!}
                onImageUpdate={onPreprocessedImageUpdate}
                onMaskUpdate={onMaskUpdate}
                disabled={isProcessing}
              />
            </div>
          )}
        </CardContent>
      </Card>

      {isProcessing && (
        <ProcessingIndicator
          variations={variations}
          currentIndex={processingIndex}
          getStyleLabel={getStyleLabel}
          provider={currentProvider}
          compact
        />
      )}
    </div>
  );
});
