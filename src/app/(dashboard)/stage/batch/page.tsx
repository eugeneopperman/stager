"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { type BatchImage } from "@/components/staging/BatchImageUploader";
import { useDashboard } from "@/contexts/DashboardContext";
import type { Property } from "@/lib/database.types";
import {
  type FurnitureStyle,
  CREDITS_PER_STAGING,
  LOW_CREDITS_THRESHOLD,
} from "@/lib/constants";
import {
  AlertCircle,
  AlertTriangle,
  CreditCard,
  ArrowLeft,
} from "lucide-react";
import { useBatchProcessing } from "./_hooks/useBatchProcessing";
import {
  BatchUploadSection,
  BatchConfigureSection,
  BatchProcessingSection,
  BatchResultsSection,
} from "./_components";

type BatchState = "upload" | "configure" | "processing" | "complete";

export default function BatchStagePage() {
  const { credits } = useDashboard();

  const [state, setState] = useState<BatchState>("upload");
  const [uploadedImages, setUploadedImages] = useState<BatchImage[]>([]);
  const [style, setStyle] = useState<FurnitureStyle | null>(null);
  const [propertyId, setPropertyId] = useState<string | null>(null);
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
  const [error, setError] = useState<string | null>(null);

  const {
    images,
    processingIndex,
    completedCount,
    failedCount,
    initializeImages,
    updateRoomType,
    processImages,
    downloadSingle,
    downloadAll,
    reset: resetProcessing,
  } = useBatchProcessing({
    onComplete: () => setState("complete"),
  });

  const requiredCredits = images.length * CREDITS_PER_STAGING;
  const hasEnoughCredits = credits >= requiredCredits;
  const isLowCredits = credits <= LOW_CREDITS_THRESHOLD;

  // Handle images added from uploader
  const handleImagesAdd = useCallback((newImages: BatchImage[]) => {
    setUploadedImages((prev) => [...prev, ...newImages]);
  }, []);

  // Handle image removal
  const handleImageRemove = useCallback((id: string) => {
    setUploadedImages((prev) => prev.filter((img) => img.id !== id));
  }, []);

  // Move from upload to configure
  const handleContinueToConfigure = () => {
    if (uploadedImages.length === 0) {
      setError("Please upload at least one image");
      return;
    }

    initializeImages(uploadedImages);
    setState("configure");
    setError(null);
  };

  // Check if all images are configured
  const allConfigured = images.every((img) => img.roomType !== null) && style !== null;

  // Start batch processing
  const handleStartStaging = async () => {
    if (!allConfigured || !style) {
      setError("Please select a room type for each image and choose a style");
      return;
    }

    if (!hasEnoughCredits) {
      setError(`Insufficient credits. You need ${requiredCredits} credits but have ${credits}.`);
      return;
    }

    setState("processing");
    setError(null);
    await processImages(style, propertyId);
  };

  // Download handlers
  const handleDownloadSingle = (image: typeof images[0]) => {
    if (style) {
      downloadSingle(image, style);
    }
  };

  const handleDownloadAll = async () => {
    if (style) {
      await downloadAll(style);
    }
  };

  // Reset to start
  const handleReset = () => {
    setState("upload");
    setUploadedImages([]);
    setStyle(null);
    setPropertyId(null);
    setSelectedProperty(null);
    setError(null);
    resetProcessing();
  };

  // Go back from configure to upload
  const handleBackToUpload = () => {
    setState("upload");
    resetProcessing();
    setError(null);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-foreground">
            Batch Staging
          </h1>
          <p className="text-muted-foreground mt-2">
            Stage multiple rooms at once with a single style
          </p>
        </div>
        <Button variant="outline" asChild>
          <Link href="/stage">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Single Photo
          </Link>
        </Button>
      </div>

      {/* Error Alert */}
      {error && (
        <Card className="border-red-200 bg-red-50 dark:bg-red-950/50 dark:border-red-900">
          <CardContent className="flex items-center gap-3 p-4">
            <AlertCircle className="h-5 w-5 text-red-600 shrink-0" />
            <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
          </CardContent>
        </Card>
      )}

      {/* Credit Warnings */}
      {state === "configure" && !hasEnoughCredits && (
        <Card className="border-red-200 bg-red-50 dark:bg-red-950/50 dark:border-red-900">
          <CardContent className="flex items-center gap-3 p-4">
            <CreditCard className="h-5 w-5 text-red-600 shrink-0" />
            <div className="flex-1">
              <p className="font-medium text-red-800 dark:text-red-200">
                Insufficient Credits
              </p>
              <p className="text-sm text-red-600 dark:text-red-400">
                You need {requiredCredits} credits but have {credits}. Remove some images or purchase more credits.
              </p>
            </div>
            <Button asChild size="sm">
              <Link href="/billing">Buy Credits</Link>
            </Button>
          </CardContent>
        </Card>
      )}

      {state === "configure" && hasEnoughCredits && isLowCredits && (
        <Card className="border-amber-200 bg-amber-50 dark:bg-amber-950/50 dark:border-amber-900">
          <CardContent className="flex items-center gap-3 p-4">
            <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0" />
            <p className="text-sm text-amber-600 dark:text-amber-400">
              This batch will use {requiredCredits} of your {credits} remaining credits.
            </p>
          </CardContent>
        </Card>
      )}

      {/* State-based content */}
      {state === "upload" && (
        <BatchUploadSection
          images={uploadedImages}
          onImagesAdd={handleImagesAdd}
          onImageRemove={handleImageRemove}
          onContinue={handleContinueToConfigure}
        />
      )}

      {state === "configure" && (
        <BatchConfigureSection
          images={images}
          style={style}
          propertyId={propertyId}
          selectedProperty={selectedProperty}
          requiredCredits={requiredCredits}
          hasEnoughCredits={hasEnoughCredits}
          onRoomTypeChange={updateRoomType}
          onStyleChange={setStyle}
          onPropertyChange={(id, property) => {
            setPropertyId(id);
            setSelectedProperty(property || null);
          }}
          onBack={handleBackToUpload}
          onStart={handleStartStaging}
        />
      )}

      {state === "processing" && (
        <BatchProcessingSection
          images={images}
          processingIndex={processingIndex}
        />
      )}

      {state === "complete" && (
        <BatchResultsSection
          images={images}
          completedCount={completedCount}
          failedCount={failedCount}
          onDownloadSingle={handleDownloadSingle}
          onDownloadAll={handleDownloadAll}
          onReset={handleReset}
        />
      )}
    </div>
  );
}
