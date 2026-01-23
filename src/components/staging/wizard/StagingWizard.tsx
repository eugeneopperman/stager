"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useDashboard } from "@/contexts/DashboardContext";
import {
  type RoomType,
  type FurnitureStyle,
  FURNITURE_STYLES,
  CREDITS_PER_STAGING,
} from "@/lib/constants";
import {
  ProcessingIndicator,
  ResultsView,
} from "@/components/staging/shared";
import { useStagingSubmit } from "@/hooks";
import {
  WizardStepIndicator,
  type WizardStep,
} from "./WizardStepIndicator";
import { UploadStep } from "./UploadStep";
import { PrepareStep } from "./PrepareStep";
import { StyleStep } from "./StyleStep";
import { GenerateStep } from "./GenerateStep";
import { AlertCircle } from "lucide-react";

export function StagingWizard() {
  const searchParams = useSearchParams();
  const propertyIdParam = searchParams.get("property");
  const { credits } = useDashboard();

  // Wizard step
  const [step, setStep] = useState<WizardStep>("upload");

  // Image state
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [workingFile, setWorkingFile] = useState<File | null>(null);
  const [workingPreview, setWorkingPreview] = useState<string | null>(null);
  const [maskDataUrl, setMaskDataUrl] = useState<string | null>(null);

  // Configuration
  const [roomType, setRoomType] = useState<RoomType | null>(null);
  const [styles, setStyles] = useState<FurnitureStyle[]>([]);
  const [propertyId, setPropertyId] = useState<string | null>(propertyIdParam);

  // Results view state
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
    onComplete: () => setStep("complete"),
  });

  const requiredCredits = styles.length * CREDITS_PER_STAGING;
  const hasEnoughCredits = credits >= requiredCredits;

  // Handlers
  const handleImageSelect = (file: File, previewUrl: string) => {
    setSelectedFile(file);
    setPreview(previewUrl);
    setWorkingFile(null);
    setWorkingPreview(null);
    setMaskDataUrl(null);
    setError(null);
    setStep("prepare");
  };

  const handleImageClear = () => {
    setSelectedFile(null);
    setPreview(null);
    setWorkingFile(null);
    setWorkingPreview(null);
    setMaskDataUrl(null);
    setError(null);
    setStep("upload");
  };

  const handlePreprocessedImageUpdate = (file: File, previewUrl: string) => {
    setWorkingFile(file);
    setWorkingPreview(previewUrl);
  };

  const handleMaskUpdate = (mask: string | null) => {
    setMaskDataUrl(mask);
  };

  const handleGenerate = async () => {
    if (!selectedFile || !roomType || styles.length === 0) {
      setError("Please complete all required fields");
      return;
    }

    if (!hasEnoughCredits) {
      setError(`Insufficient credits. You need ${requiredCredits} but have ${credits}.`);
      return;
    }

    setStep("processing");
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
    setStep("upload");
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

  const handleTryDifferentStyle = () => {
    setStyles([]);
    resetStaging();
    setCompareIndex(0);
    setStep("style");
  };

  const getStyleLabel = (styleId: string) => {
    return FURNITURE_STYLES.find((s) => s.id === styleId)?.label || styleId;
  };

  const currentPreview = workingPreview || preview;

  // Processing view
  if (step === "processing") {
    return (
      <div className="max-w-3xl mx-auto space-y-6">
        <WizardStepIndicator currentStep={step} />
        <ProcessingIndicator
          variations={variations}
          currentIndex={processingIndex}
          getStyleLabel={getStyleLabel}
          provider={currentProvider}
        />
      </div>
    );
  }

  // Complete view with comparison slider
  if (step === "complete" && variations.length > 0 && preview) {
    return (
      <ResultsView
        variations={variations}
        originalPreview={preview}
        compareIndex={compareIndex}
        onCompareIndexChange={setCompareIndex}
        onDownload={handleDownload}
        onDownloadAll={handleDownloadAll}
        onReset={handleReset}
        onRetry={handleTryDifferentStyle}
        showRetry
      />
    );
  }

  // Main wizard steps
  return (
    <div className="space-y-6">
      {/* Step indicator */}
      <WizardStepIndicator currentStep={step} className="max-w-2xl mx-auto" />

      {/* Error alert */}
      {error && (
        <Card className="max-w-2xl mx-auto border-destructive bg-destructive/10">
          <CardContent className="flex items-center gap-3 p-4">
            <AlertCircle className="h-5 w-5 text-destructive shrink-0" />
            <div className="flex-1">
              <p className="font-medium text-destructive">{error}</p>
            </div>
            <Button variant="outline" size="sm" onClick={() => setError(null)}>
              Dismiss
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Step content */}
      {step === "upload" && (
        <UploadStep
          onImageSelect={handleImageSelect}
          onImageClear={handleImageClear}
          preview={preview}
          disabled={isProcessing}
        />
      )}

      {step === "prepare" && selectedFile && preview && (
        <PrepareStep
          imageUrl={workingPreview || preview}
          imageFile={workingFile || selectedFile}
          onImageUpdate={handlePreprocessedImageUpdate}
          onMaskUpdate={handleMaskUpdate}
          onBack={() => setStep("upload")}
          onNext={() => setStep("style")}
          onSkip={() => setStep("style")}
          disabled={isProcessing}
        />
      )}

      {step === "style" && currentPreview && (
        <StyleStep
          preview={currentPreview}
          roomType={roomType}
          onRoomTypeChange={setRoomType}
          styles={styles}
          onStylesChange={setStyles}
          onBack={() => setStep("prepare")}
          onNext={() => setStep("generate")}
          disabled={isProcessing}
        />
      )}

      {step === "generate" && currentPreview && roomType && (
        <GenerateStep
          preview={currentPreview}
          roomType={roomType}
          styles={styles}
          propertyId={propertyId}
          onPropertyChange={setPropertyId}
          credits={credits}
          onBack={() => setStep("style")}
          onGenerate={handleGenerate}
          disabled={isProcessing}
        />
      )}
    </div>
  );
}
