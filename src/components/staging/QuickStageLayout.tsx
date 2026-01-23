"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ImageUploader } from "@/components/staging/ImageUploader";
import { PreprocessingToolbar } from "@/components/staging/preprocessing";
import { RoomTypeDropdown } from "@/components/staging/RoomTypeDropdown";
import { StyleGallery } from "@/components/staging/StyleGallery";
import { PropertySelector } from "@/components/staging/PropertySelector";
import { CreditDisplay } from "@/components/staging/CreditDisplay";
import {
  ProcessingIndicator,
  ResultsView,
  StagingErrorAlert,
} from "@/components/staging/shared";
import { useStagingSubmit } from "@/hooks";
import { useDashboard } from "@/contexts/DashboardContext";
import {
  type RoomType,
  type FurnitureStyle,
  FURNITURE_STYLES,
  CREDITS_PER_STAGING,
} from "@/lib/constants";
import { Sparkles } from "lucide-react";

type StagingState = "upload" | "processing" | "complete" | "error";

export function QuickStageLayout() {
  const searchParams = useSearchParams();
  const propertyIdParam = searchParams.get("property");
  const { credits } = useDashboard();

  const [state, setState] = useState<StagingState>("upload");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [workingFile, setWorkingFile] = useState<File | null>(null);
  const [workingPreview, setWorkingPreview] = useState<string | null>(null);
  const [maskDataUrl, setMaskDataUrl] = useState<string | null>(null);
  const [roomType, setRoomType] = useState<RoomType | null>(null);
  const [styles, setStyles] = useState<FurnitureStyle[]>([]);
  const [propertyId, setPropertyId] = useState<string | null>(propertyIdParam);
  const [compareIndex, setCompareIndex] = useState(0);

  const {
    variations,
    isProcessing,
    processingIndex,
    error,
    setError,
    currentProvider,
    submitStaging,
    resetStaging,
  } = useStagingSubmit({
    onComplete: () => setState("complete"),
  });

  const requiredCredits = styles.length * CREDITS_PER_STAGING;
  const hasEnoughCredits = credits >= requiredCredits;

  const handleImageSelect = (file: File, previewUrl: string) => {
    setSelectedFile(file);
    setPreview(previewUrl);
    setError(null);
  };

  const handleImageClear = () => {
    setSelectedFile(null);
    setPreview(null);
    setWorkingFile(null);
    setWorkingPreview(null);
    setMaskDataUrl(null);
    setError(null);
  };

  const handlePreprocessedImageUpdate = (file: File, previewUrl: string) => {
    setWorkingFile(file);
    setWorkingPreview(previewUrl);
  };

  const handleMaskUpdate = (mask: string | null) => {
    setMaskDataUrl(mask);
    console.log("[Stage] Mask updated:", mask ? "mask set" : "mask cleared");
  };

  const handleStage = async () => {
    if (!selectedFile || !roomType || styles.length === 0) {
      setError("Please upload an image, select room type, and choose at least one style");
      return;
    }

    if (!hasEnoughCredits) {
      setError(`Insufficient credits. You need ${requiredCredits} but have ${credits}.`);
      return;
    }

    setState("processing");
    await submitStaging({
      imageFile: selectedFile,
      roomType,
      styles,
      propertyId,
      maskDataUrl,
      workingFile,
    });
  };

  const handleReset = () => {
    resetStaging();
    setState("upload");
    setSelectedFile(null);
    setPreview(null);
    setWorkingFile(null);
    setWorkingPreview(null);
    setMaskDataUrl(null);
    setRoomType(null);
    setStyles([]);
    setCompareIndex(0);
  };

  const handleDownload = (variation: { style: FurnitureStyle; imageUrl: string | null }) => {
    if (variation.imageUrl) {
      const link = document.createElement("a");
      link.href = variation.imageUrl;
      link.download = `staged-${roomType}-${variation.style}-${Date.now()}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const handleDownloadAll = () => {
    variations
      .filter((v) => v.status === "completed" && v.imageUrl)
      .forEach((v, i) => {
        setTimeout(() => handleDownload(v), i * 500);
      });
  };

  const getStyleLabel = (styleId: string) => {
    return FURNITURE_STYLES.find((s) => s.id === styleId)?.label || styleId;
  };

  const canStage = selectedFile && roomType && styles.length > 0 && !isProcessing && hasEnoughCredits;

  // Complete view with comparison slider
  if (state === "complete" && variations.length > 0 && preview) {
    return (
      <ResultsView
        variations={variations}
        originalPreview={preview}
        compareIndex={compareIndex}
        onCompareIndexChange={setCompareIndex}
        onDownload={handleDownload}
        onDownloadAll={handleDownloadAll}
        onReset={handleReset}
      />
    );
  }

  // Main staging interface - Two-panel layout
  return (
    <div>
      {/* Error Alert */}
      <StagingErrorAlert
        error={error || (state === "error" ? "An unexpected error occurred. Please try again." : null)}
        onRetry={handleReset}
        className="mb-6"
      />

      {/* Two-panel layout - 2/3 image, 1/3 controls */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Panel - Image Upload & Preprocessing (2/3 width) */}
        <div className="lg:col-span-2 space-y-4">
          <Card className="overflow-hidden">
            <CardContent className="p-4">
              {!preview ? (
                <ImageUploader
                  onImageSelect={handleImageSelect}
                  onImageClear={handleImageClear}
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
                      onClick={handleImageClear}
                      disabled={isProcessing}
                      className="text-xs"
                    >
                      Change Image
                    </Button>
                  </div>
                  <PreprocessingToolbar
                    imageUrl={workingPreview || preview}
                    imageFile={workingFile || selectedFile!}
                    onImageUpdate={handlePreprocessedImageUpdate}
                    onMaskUpdate={handleMaskUpdate}
                    disabled={isProcessing}
                  />
                </div>
              )}
            </CardContent>
          </Card>

          {/* Processing indicator */}
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

        {/* Right Panel - Controls */}
        <div className="space-y-5">
          {/* Room Type */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">
              Room Type
            </label>
            <RoomTypeDropdown
              value={roomType}
              onChange={setRoomType}
              disabled={isProcessing}
            />
          </div>

          {/* Style Gallery */}
          <StyleGallery
            value={styles}
            onChange={setStyles}
            disabled={isProcessing}
          />

          {/* Property Selector */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">
              Property <span className="text-muted-foreground font-normal">(optional)</span>
            </label>
            <PropertySelector
              value={propertyId}
              onChange={(id) => setPropertyId(id)}
              disabled={isProcessing}
            />
          </div>

          {/* Credit Display */}
          <CreditDisplay
            credits={credits}
            creditsToUse={requiredCredits}
          />

          {/* Generate Button */}
          <Button
            size="lg"
            className="w-full"
            onClick={handleStage}
            disabled={!canStage}
          >
            <Sparkles className="mr-2 h-5 w-5" />
            {styles.length === 0
              ? "Select a Style"
              : !selectedFile
              ? "Upload an Image"
              : !roomType
              ? "Select Room Type"
              : !hasEnoughCredits
              ? "Insufficient Credits"
              : `Generate ${styles.length} Variation${styles.length !== 1 ? "s" : ""}`}
          </Button>

          {/* Quick tip */}
          {selectedFile && roomType && styles.length === 0 && (
            <p className="text-xs text-center text-muted-foreground">
              Select 1-3 furniture styles above to continue
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
