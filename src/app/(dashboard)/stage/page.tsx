"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ImageUploader } from "@/components/staging/ImageUploader";
import { PreprocessingToolbar } from "@/components/staging/preprocessing";
import { RoomTypeDropdown } from "@/components/staging/RoomTypeDropdown";
import { StyleGallery } from "@/components/staging/StyleGallery";
import { PropertySelector } from "@/components/staging/PropertySelector";
import { CreditDisplay } from "@/components/staging/CreditDisplay";
import { useDashboard } from "@/contexts/DashboardContext";
import {
  type RoomType,
  type FurnitureStyle,
  FURNITURE_STYLES,
  CREDITS_PER_STAGING,
} from "@/lib/constants";
import {
  Sparkles,
  Loader2,
  AlertCircle,
  Download,
  RotateCcw,
  CheckCircle2,
  XCircle,
  ArrowLeftRight,
  Layers,
  Cpu,
} from "lucide-react";

type StagingState = "upload" | "processing" | "complete" | "error";

interface StagedVariation {
  style: FurnitureStyle;
  imageUrl: string | null;
  status: "pending" | "queued" | "preprocessing" | "processing" | "completed" | "failed";
  error?: string;
  jobId?: string;
  provider?: string;
  progressMessage?: string;
}

export default function StagePage() {
  const router = useRouter();
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
  const [variations, setVariations] = useState<StagedVariation[]>([]);
  const [processingIndex, setProcessingIndex] = useState(-1);
  const [error, setError] = useState<string | null>(null);
  const [compareIndex, setCompareIndex] = useState(0);
  const [sliderPosition, setSliderPosition] = useState(50);
  const [currentProvider, setCurrentProvider] = useState<string | null>(null);
  const pollingRef = useRef<Map<string, NodeJS.Timeout>>(new Map());

  const requiredCredits = styles.length * CREDITS_PER_STAGING;
  const hasEnoughCredits = credits >= requiredCredits;

  // Poll job status for async jobs
  const pollJobStatus = useCallback(async (jobId: string, styleIndex: number) => {
    try {
      const response = await fetch(`/api/staging/${jobId}/status`);
      if (!response.ok) {
        throw new Error("Failed to fetch job status");
      }

      const data = await response.json();

      // Update variation with current status
      setVariations((prev) =>
        prev.map((v, idx) =>
          idx === styleIndex
            ? {
                ...v,
                status: data.status,
                imageUrl: data.stagedImageUrl || v.imageUrl,
                progressMessage: data.progress?.message,
                error: data.error,
              }
            : v
        )
      );

      // Check if job is complete or failed
      if (data.status === "completed" || data.status === "failed") {
        // Clear polling interval
        const interval = pollingRef.current.get(jobId);
        if (interval) {
          clearInterval(interval);
          pollingRef.current.delete(jobId);
        }

        // Check if all jobs are done
        setVariations((prev) => {
          const allDone = prev.every(
            (v) => v.status === "completed" || v.status === "failed"
          );
          if (allDone) {
            setState("complete");
            router.refresh();
          }
          return prev;
        });
      }
    } catch (err) {
      console.error("Error polling job status:", err);
    }
  }, [router]);

  // Cleanup polling on unmount
  useEffect(() => {
    return () => {
      pollingRef.current.forEach((interval) => clearInterval(interval));
      pollingRef.current.clear();
    };
  }, []);

  // Sync propertyId with URL param
  useEffect(() => {
    if (propertyIdParam) {
      setPropertyId(propertyIdParam);
    }
  }, [propertyIdParam]);

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
    setError(null);
    setCurrentProvider(null);

    const initialVariations: StagedVariation[] = styles.map((style) => ({
      style,
      imageUrl: null,
      status: "pending",
    }));
    setVariations(initialVariations);

    // Track if any jobs are async (can't rely on state which updates async)
    let hasAsyncJobs = false;

    // Use preprocessed image if available, otherwise use original
    const imageToStage = workingFile || selectedFile;

    const base64 = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        const base64Data = result.split(",")[1];
        resolve(base64Data);
      };
      reader.onerror = reject;
      reader.readAsDataURL(imageToStage);
    });

    for (let i = 0; i < styles.length; i++) {
      // Add delay between requests to avoid Replicate throttling (skip first request)
      if (i > 0) {
        await new Promise(resolve => setTimeout(resolve, 2000));
      }

      setProcessingIndex(i);

      setVariations((prev) =>
        prev.map((v, idx) => (idx === i ? { ...v, status: "processing" } : v))
      );

      try {
        // Extract mask base64 if present
        let maskBase64: string | undefined;
        if (maskDataUrl) {
          const maskMatch = maskDataUrl.match(/^data:[^;]+;base64,(.+)$/);
          if (maskMatch) {
            maskBase64 = maskMatch[1];
          }
        }

        const response = await fetch("/api/staging", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            image: base64,
            mimeType: imageToStage.type,
            roomType,
            style: styles[i],
            propertyId: propertyId || undefined,
            mask: maskBase64,
          }),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Failed to stage image");
        }

        // Track which provider is being used
        if (data.provider && !currentProvider) {
          setCurrentProvider(data.provider);
        }

        // Handle async response (Stable Diffusion)
        if (data.async) {
          hasAsyncJobs = true; // Track that we have at least one async job

          setVariations((prev) =>
            prev.map((v, idx) =>
              idx === i
                ? {
                    ...v,
                    status: "processing",
                    jobId: data.jobId,
                    provider: data.provider,
                    progressMessage: "Starting AI processing...",
                  }
                : v
            )
          );

          // Start polling for this job
          const pollInterval = setInterval(() => {
            pollJobStatus(data.jobId, i);
          }, 2000); // Poll every 2 seconds

          pollingRef.current.set(data.jobId, pollInterval);

          // Initial poll
          pollJobStatus(data.jobId, i);
        } else {
          // Handle sync response (Gemini)
          setVariations((prev) =>
            prev.map((v, idx) =>
              idx === i
                ? { ...v, status: "completed", imageUrl: data.stagedImageUrl, provider: data.provider }
                : v
            )
          );
        }
      } catch (err) {
        setVariations((prev) =>
          prev.map((v, idx) =>
            idx === i
              ? { ...v, status: "failed", error: err instanceof Error ? err.message : "Unknown error" }
              : v
          )
        );
      }
    }

    setProcessingIndex(-1);

    // Only go to complete if all jobs were sync (Gemini)
    // For async jobs (SD), polling will handle the transition to complete
    if (!hasAsyncJobs) {
      setState("complete");
      router.refresh();
    }
  };

  const handleReset = () => {
    // Clear any active polling intervals
    pollingRef.current.forEach((interval) => clearInterval(interval));
    pollingRef.current.clear();

    setState("upload");
    setSelectedFile(null);
    setPreview(null);
    setWorkingFile(null);
    setWorkingPreview(null);
    setMaskDataUrl(null);
    setRoomType(null);
    setStyles([]);
    setVariations([]);
    setError(null);
    setProcessingIndex(-1);
    setCompareIndex(0);
    setCurrentProvider(null);
  };

  const handleDownload = (variation: StagedVariation) => {
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

  const getStyleLabel = (styleId: FurnitureStyle) => {
    return FURNITURE_STYLES.find((s) => s.id === styleId)?.label || styleId;
  };

  const isProcessing = state === "processing";
  const canStage = selectedFile && roomType && styles.length > 0 && !isProcessing && hasEnoughCredits;
  const completedVariations = variations.filter((v) => v.status === "completed");

  // Complete view with comparison slider
  if (state === "complete" && variations.length > 0 && preview) {
    const currentVariation = completedVariations[compareIndex] || completedVariations[0];

    return (
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-foreground">
              Staging Complete!
            </h1>
            <p className="text-muted-foreground mt-2">
              {completedVariations.length} style variation{completedVariations.length !== 1 ? "s" : ""} generated
            </p>
          </div>
          <div className="flex gap-2">
            {completedVariations.length > 1 && (
              <Button variant="outline" onClick={handleDownloadAll}>
                <Download className="mr-2 h-4 w-4" />
                Download All
              </Button>
            )}
            <Button onClick={handleReset}>
              <RotateCcw className="mr-2 h-4 w-4" />
              Stage Another
            </Button>
          </div>
        </div>

        {completedVariations.length > 1 && (
          <div className="flex gap-2 overflow-x-auto pb-2">
            {completedVariations.map((variation, index) => (
              <Button
                key={variation.style}
                variant={compareIndex === index ? "default" : "outline"}
                size="sm"
                onClick={() => setCompareIndex(index)}
              >
                {getStyleLabel(variation.style)}
              </Button>
            ))}
          </div>
        )}

        {currentVariation?.imageUrl && (
          <Card>
            <CardContent className="p-0">
              <div
                className="relative aspect-video overflow-hidden rounded-lg cursor-ew-resize"
                onMouseMove={(e) => {
                  const rect = e.currentTarget.getBoundingClientRect();
                  const x = ((e.clientX - rect.left) / rect.width) * 100;
                  setSliderPosition(Math.max(0, Math.min(100, x)));
                }}
                onTouchMove={(e) => {
                  const rect = e.currentTarget.getBoundingClientRect();
                  const touch = e.touches[0];
                  const x = ((touch.clientX - rect.left) / rect.width) * 100;
                  setSliderPosition(Math.max(0, Math.min(100, x)));
                }}
              >
                <img
                  src={currentVariation.imageUrl}
                  alt="Staged"
                  className="absolute inset-0 w-full h-full object-cover"
                />

                <div
                  className="absolute inset-0 overflow-hidden"
                  style={{ width: `${sliderPosition}%` }}
                >
                  <img
                    src={preview}
                    alt="Original"
                    className="absolute inset-0 w-full h-full object-cover"
                    style={{ width: `${100 / (sliderPosition / 100)}%`, maxWidth: "none" }}
                  />
                </div>

                <div
                  className="absolute top-0 bottom-0 w-1 bg-white shadow-lg cursor-ew-resize"
                  style={{ left: `${sliderPosition}%`, transform: "translateX(-50%)" }}
                >
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 bg-white rounded-full shadow-lg flex items-center justify-center">
                    <ArrowLeftRight className="h-4 w-4 text-slate-600" />
                  </div>
                </div>

                <div className="absolute bottom-4 left-4 px-3 py-1 bg-black/70 rounded text-white text-sm">
                  Original
                </div>
                <div className="absolute bottom-4 right-4 px-3 py-1 bg-black/70 rounded text-white text-sm">
                  {getStyleLabel(currentVariation.style)}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {variations.map((variation) => (
            <div
              key={variation.style}
              className={`relative aspect-video rounded-lg overflow-hidden cursor-pointer border-2 transition-all ${
                completedVariations[compareIndex]?.style === variation.style
                  ? "border-primary ring-2 ring-primary"
                  : "border-transparent hover:border-border"
              }`}
              onClick={() => {
                const completedIndex = completedVariations.findIndex(
                  (v) => v.style === variation.style
                );
                if (completedIndex >= 0) setCompareIndex(completedIndex);
              }}
            >
              {variation.status === "completed" && variation.imageUrl ? (
                <>
                  <img
                    src={variation.imageUrl}
                    alt={getStyleLabel(variation.style)}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute top-1 right-1">
                    <CheckCircle2 className="h-5 w-5 text-green-500 drop-shadow" />
                  </div>
                  <Button
                    variant="secondary"
                    size="icon"
                    className="absolute bottom-1 right-1 h-7 w-7"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDownload(variation);
                    }}
                  >
                    <Download className="h-3 w-3" />
                  </Button>
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
      </div>
    );
  }

  // Main staging interface - Two-panel layout
  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-foreground">Stage a Photo</h1>
          <p className="text-muted-foreground mt-2">
            Transform empty rooms with AI-powered virtual staging
          </p>
        </div>
        <Button variant="outline" size="sm" asChild>
          <Link href="/stage/batch">
            <Layers className="mr-2 h-4 w-4" />
            Batch Mode
          </Link>
        </Button>
      </div>

      {/* Error Alert */}
      {(error || state === "error") && (
        <Card className="mb-6 border-destructive bg-destructive/10">
          <CardContent className="flex items-center gap-3 p-4">
            <AlertCircle className="h-5 w-5 text-destructive shrink-0" />
            <div className="flex-1">
              <p className="font-medium text-destructive">
                {error || "An unexpected error occurred. Please try again."}
              </p>
            </div>
            <Button variant="outline" size="sm" onClick={handleReset}>
              Try Again
            </Button>
          </CardContent>
        </Card>
      )}

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
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <Loader2 className="h-5 w-5 animate-spin text-primary" />
                  <div className="flex-1">
                    <p className="font-medium text-sm">
                      Generating {styles.length > 1 ? "variations" : "staging"}...
                    </p>
                    {processingIndex >= 0 && processingIndex < styles.length && (
                      <p className="text-xs text-muted-foreground">
                        Style {processingIndex + 1} of {styles.length}: {getStyleLabel(styles[processingIndex])}
                      </p>
                    )}
                    {/* Show current variation progress for async jobs */}
                    {variations.some((v) => v.progressMessage) && (
                      <p className="text-xs text-muted-foreground mt-1">
                        {variations.find((v) => v.status === "processing" || v.status === "preprocessing")?.progressMessage}
                      </p>
                    )}
                  </div>
                  {/* Provider badge */}
                  {currentProvider && (
                    <div className="flex items-center gap-1 px-2 py-1 bg-muted rounded text-xs text-muted-foreground">
                      <Cpu className="h-3 w-3" />
                      {currentProvider === "stable-diffusion" ? "SD + ControlNet" : "Gemini"}
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
