"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ImageUploader } from "@/components/staging/ImageUploader";
import { RoomTypeSelector } from "@/components/staging/RoomTypeSelector";
import { MultiStyleSelector } from "@/components/staging/MultiStyleSelector";
import { useDashboard } from "@/contexts/DashboardContext";
import { createClient } from "@/lib/supabase/client";
import {
  type RoomType,
  type FurnitureStyle,
  FURNITURE_STYLES,
  LOW_CREDITS_THRESHOLD,
  CREDITS_PER_STAGING,
} from "@/lib/constants";
import type { Property } from "@/lib/database.types";
import {
  Sparkles,
  Loader2,
  AlertCircle,
  AlertTriangle,
  CreditCard,
  MapPin,
  X,
  Download,
  RotateCcw,
  CheckCircle2,
  XCircle,
  ArrowLeftRight,
} from "lucide-react";

type StagingState = "upload" | "processing" | "complete" | "error";

interface StagedVariation {
  style: FurnitureStyle;
  imageUrl: string | null;
  status: "pending" | "processing" | "completed" | "failed";
  error?: string;
}

export default function StagePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const propertyId = searchParams.get("property");
  const { credits } = useDashboard();

  const [state, setState] = useState<StagingState>("upload");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [roomType, setRoomType] = useState<RoomType | null>(null);
  const [styles, setStyles] = useState<FurnitureStyle[]>([]);
  const [variations, setVariations] = useState<StagedVariation[]>([]);
  const [processingIndex, setProcessingIndex] = useState(-1);
  const [error, setError] = useState<string | null>(null);
  const [property, setProperty] = useState<Property | null>(null);
  const [compareIndex, setCompareIndex] = useState(0);
  const [sliderPosition, setSliderPosition] = useState(50);

  const requiredCredits = styles.length * CREDITS_PER_STAGING;
  const hasEnoughCredits = credits >= requiredCredits;
  const isLowCredits = credits <= LOW_CREDITS_THRESHOLD;

  // Fetch property details if propertyId is provided
  useEffect(() => {
    async function fetchProperty() {
      if (!propertyId) {
        setProperty(null);
        return;
      }

      const supabase = createClient();
      const { data } = await supabase
        .from("properties")
        .select("*")
        .eq("id", propertyId)
        .single();

      setProperty(data);
    }

    fetchProperty();
  }, [propertyId]);

  const handleImageSelect = (file: File, previewUrl: string) => {
    setSelectedFile(file);
    setPreview(previewUrl);
    setError(null);
  };

  const handleImageClear = () => {
    setSelectedFile(null);
    setPreview(null);
    setError(null);
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

    // Initialize variations
    const initialVariations: StagedVariation[] = styles.map((style) => ({
      style,
      imageUrl: null,
      status: "pending",
    }));
    setVariations(initialVariations);

    // Convert file to base64 once
    const base64 = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        const base64Data = result.split(",")[1];
        resolve(base64Data);
      };
      reader.onerror = reject;
      reader.readAsDataURL(selectedFile);
    });

    // Process each style sequentially
    for (let i = 0; i < styles.length; i++) {
      setProcessingIndex(i);

      // Update status to processing
      setVariations((prev) =>
        prev.map((v, idx) => (idx === i ? { ...v, status: "processing" } : v))
      );

      try {
        const response = await fetch("/api/staging", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            image: base64,
            mimeType: selectedFile.type,
            roomType,
            style: styles[i],
            propertyId: propertyId || undefined,
          }),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Failed to stage image");
        }

        // Update with result
        setVariations((prev) =>
          prev.map((v, idx) =>
            idx === i
              ? { ...v, status: "completed", imageUrl: data.stagedImageUrl }
              : v
          )
        );
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
    setState("complete");
    router.refresh(); // Refresh to update credits
  };

  const handleReset = () => {
    setState("upload");
    setSelectedFile(null);
    setPreview(null);
    setRoomType(null);
    setStyles([]);
    setVariations([]);
    setError(null);
    setProcessingIndex(-1);
    setCompareIndex(0);
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

  // Show result view
  if (state === "complete" && variations.length > 0 && preview) {
    const currentVariation = completedVariations[compareIndex] || completedVariations[0];

    return (
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
              Staging Complete!
            </h1>
            <p className="text-slate-600 dark:text-slate-400 mt-1">
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

        {/* Style Tabs */}
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

        {/* Comparison Slider */}
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
                {/* Staged Image (Background) */}
                <img
                  src={currentVariation.imageUrl}
                  alt="Staged"
                  className="absolute inset-0 w-full h-full object-cover"
                />

                {/* Original Image (Foreground, clipped) */}
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

                {/* Slider Line */}
                <div
                  className="absolute top-0 bottom-0 w-1 bg-white shadow-lg cursor-ew-resize"
                  style={{ left: `${sliderPosition}%`, transform: "translateX(-50%)" }}
                >
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 bg-white rounded-full shadow-lg flex items-center justify-center">
                    <ArrowLeftRight className="h-4 w-4 text-slate-600" />
                  </div>
                </div>

                {/* Labels */}
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

        {/* All Variations Grid */}
        <Card>
          <CardHeader>
            <CardTitle>All Variations</CardTitle>
            <CardDescription>Click on any variation to compare with the original</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {variations.map((variation, index) => (
                <div
                  key={variation.style}
                  className={`relative aspect-video rounded-lg overflow-hidden cursor-pointer border-2 transition-all ${
                    completedVariations[compareIndex]?.style === variation.style
                      ? "border-blue-500 ring-2 ring-blue-500"
                      : "border-transparent hover:border-slate-300"
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
                    <div className="w-full h-full bg-red-100 dark:bg-red-950 flex items-center justify-center">
                      <XCircle className="h-8 w-8 text-red-500" />
                    </div>
                  ) : (
                    <div className="w-full h-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                      <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
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
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
          Stage a Photo
        </h1>
        <p className="text-slate-600 dark:text-slate-400 mt-1">
          Upload an empty room photo and transform it with AI
        </p>
      </div>

      {/* Property Info */}
      {property && (
        <Card className="border-blue-200 bg-blue-50 dark:bg-blue-950/30 dark:border-blue-900">
          <CardContent className="flex items-center gap-3 p-4">
            <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900">
              <MapPin className="h-5 w-5 text-blue-600" />
            </div>
            <div className="flex-1">
              <p className="font-medium text-blue-800 dark:text-blue-200">
                Staging for Property
              </p>
              <p className="text-sm text-blue-600 dark:text-blue-400">
                {property.address}
              </p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="text-blue-600 hover:text-blue-800 hover:bg-blue-100"
              onClick={() => router.push("/stage")}
            >
              <X className="h-4 w-4" />
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Credit Warnings */}
      {styles.length > 0 && !hasEnoughCredits && (
        <Card className="border-red-200 bg-red-50 dark:bg-red-950/50 dark:border-red-900">
          <CardContent className="flex items-center gap-3 p-4">
            <CreditCard className="h-5 w-5 text-red-600 shrink-0" />
            <div className="flex-1">
              <p className="font-medium text-red-800 dark:text-red-200">
                Insufficient Credits
              </p>
              <p className="text-sm text-red-600 dark:text-red-400">
                You need {requiredCredits} credits for {styles.length} style{styles.length !== 1 ? "s" : ""} but have {credits}.
              </p>
            </div>
            <Button asChild size="sm">
              <Link href="/billing">Buy Credits</Link>
            </Button>
          </CardContent>
        </Card>
      )}

      {isLowCredits && hasEnoughCredits && styles.length > 0 && (
        <Card className="border-amber-200 bg-amber-50 dark:bg-amber-950/50 dark:border-amber-900">
          <CardContent className="flex items-center gap-3 p-4">
            <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0" />
            <p className="text-sm text-amber-600 dark:text-amber-400">
              This will use {requiredCredits} of your {credits} remaining credits.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Error Alert */}
      {(error || state === "error") && (
        <Card className="border-red-200 bg-red-50 dark:bg-red-950/50 dark:border-red-900">
          <CardContent className="flex items-center gap-3 p-4">
            <AlertCircle className="h-5 w-5 text-red-600 shrink-0" />
            <div>
              <p className="font-medium text-red-800 dark:text-red-200">
                Staging Failed
              </p>
              <p className="text-sm text-red-600 dark:text-red-400">
                {error || "An unexpected error occurred. Please try again."}
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="ml-auto shrink-0"
              onClick={handleReset}
            >
              Try Again
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Upload Section */}
      <Card>
        <CardHeader>
          <CardTitle>1. Upload Your Photo</CardTitle>
          <CardDescription>
            Upload a photo of an empty or unfurnished room
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ImageUploader
            onImageSelect={handleImageSelect}
            onImageClear={handleImageClear}
            preview={preview}
            disabled={isProcessing}
          />
        </CardContent>
      </Card>

      {/* Room Type Section */}
      <Card>
        <CardHeader>
          <CardTitle>2. Select Room Type</CardTitle>
          <CardDescription>
            Choose the type of room in your photo
          </CardDescription>
        </CardHeader>
        <CardContent>
          <RoomTypeSelector
            value={roomType}
            onChange={setRoomType}
            disabled={isProcessing}
          />
        </CardContent>
      </Card>

      {/* Style Section - Now Multi-Select */}
      <Card>
        <CardHeader>
          <CardTitle>3. Choose Furniture Styles</CardTitle>
          <CardDescription>
            Select up to 3 styles to generate variations
          </CardDescription>
        </CardHeader>
        <CardContent>
          <MultiStyleSelector
            value={styles}
            onChange={setStyles}
            disabled={isProcessing}
          />
        </CardContent>
      </Card>

      {/* Processing Progress */}
      {isProcessing && (
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
              <div>
                <p className="font-medium text-slate-900 dark:text-white">
                  Generating variations...
                </p>
                <p className="text-sm text-slate-500">
                  Processing style {processingIndex + 1} of {styles.length}:{" "}
                  {getStyleLabel(styles[processingIndex])}
                </p>
              </div>
            </div>
            <div className="mt-4 flex gap-2">
              {variations.map((v, i) => (
                <div
                  key={v.style}
                  className={`h-2 flex-1 rounded-full ${
                    v.status === "completed"
                      ? "bg-green-500"
                      : v.status === "processing"
                      ? "bg-blue-500 animate-pulse"
                      : v.status === "failed"
                      ? "bg-red-500"
                      : "bg-slate-200 dark:bg-slate-700"
                  }`}
                />
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Stage Button */}
      {!isProcessing && (
        <Card className="bg-gradient-to-r from-blue-600 to-blue-700 border-0">
          <CardContent className="p-6">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="text-white text-center sm:text-left">
                <h3 className="font-semibold">Ready to stage?</h3>
                <p className="text-blue-100 text-sm">
                  {styles.length === 0
                    ? "Select at least one style"
                    : `This will use ${requiredCredits} credit${requiredCredits !== 1 ? "s" : ""} for ${styles.length} variation${styles.length !== 1 ? "s" : ""}`}
                </p>
              </div>
              <Button
                size="lg"
                variant="secondary"
                onClick={handleStage}
                disabled={!canStage}
                className="w-full sm:w-auto"
              >
                <Sparkles className="mr-2 h-5 w-5" />
                Generate {styles.length > 1 ? `${styles.length} Variations` : "Staging"}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
