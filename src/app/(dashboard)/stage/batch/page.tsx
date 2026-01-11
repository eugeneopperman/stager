"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import JSZip from "jszip";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BatchImageUploader, type BatchImage } from "@/components/staging/BatchImageUploader";
import { BatchImageCard, type BatchImageData, type BatchImageStatus } from "@/components/staging/BatchImageCard";
import { StyleSelector } from "@/components/staging/StyleSelector";
import { PropertySelector } from "@/components/staging/PropertySelector";
import { useDashboard } from "@/contexts/DashboardContext";
import type { Property } from "@/lib/database.types";
import {
  type RoomType,
  type FurnitureStyle,
  CREDITS_PER_STAGING,
  LOW_CREDITS_THRESHOLD,
} from "@/lib/constants";
import {
  Sparkles,
  Loader2,
  AlertCircle,
  AlertTriangle,
  CreditCard,
  FolderDown,
  ArrowLeft,
  CheckCircle2,
  XCircle,
  RotateCcw,
  Building2,
} from "lucide-react";

type BatchState = "upload" | "configure" | "processing" | "complete";

interface ConfiguredImage extends BatchImageData {
  file: File;
}

export default function BatchStagePage() {
  const router = useRouter();
  const { credits } = useDashboard();

  const [state, setState] = useState<BatchState>("upload");
  const [uploadedImages, setUploadedImages] = useState<BatchImage[]>([]);
  const [configuredImages, setConfiguredImages] = useState<ConfiguredImage[]>([]);
  const [style, setStyle] = useState<FurnitureStyle | null>(null);
  const [propertyId, setPropertyId] = useState<string | null>(null);
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [processingIndex, setProcessingIndex] = useState<number>(-1);

  const requiredCredits = configuredImages.length * CREDITS_PER_STAGING;
  const hasEnoughCredits = credits >= requiredCredits;
  const isLowCredits = credits <= LOW_CREDITS_THRESHOLD;

  const completedCount = configuredImages.filter((img) => img.status === "completed").length;
  const failedCount = configuredImages.filter((img) => img.status === "failed").length;

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

    const configured: ConfiguredImage[] = uploadedImages.map((img) => ({
      id: img.id,
      file: img.file,
      preview: img.preview,
      roomType: null,
      status: "configuring" as BatchImageStatus,
    }));

    setConfiguredImages(configured);
    setState("configure");
    setError(null);
  };

  // Handle room type change for an image
  const handleRoomTypeChange = useCallback((id: string, roomType: RoomType) => {
    setConfiguredImages((prev) =>
      prev.map((img) => (img.id === id ? { ...img, roomType } : img))
    );
  }, []);

  // Check if all images are configured
  const allConfigured = configuredImages.every((img) => img.roomType !== null) && style !== null;

  // Start batch processing
  const handleStartStaging = async () => {
    if (!allConfigured) {
      setError("Please select a room type for each image and choose a style");
      return;
    }

    if (!hasEnoughCredits) {
      setError(`Insufficient credits. You need ${requiredCredits} credits but have ${credits}.`);
      return;
    }

    setState("processing");
    setError(null);

    // Set all images to pending
    setConfiguredImages((prev) =>
      prev.map((img) => ({ ...img, status: "pending" as BatchImageStatus }))
    );

    // Process images sequentially
    for (let i = 0; i < configuredImages.length; i++) {
      setProcessingIndex(i);

      // Update current image to processing
      setConfiguredImages((prev) =>
        prev.map((img, idx) =>
          idx === i ? { ...img, status: "processing" as BatchImageStatus } : img
        )
      );

      try {
        // Convert file to base64
        const base64 = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => {
            const result = reader.result as string;
            const base64Data = result.split(",")[1];
            resolve(base64Data);
          };
          reader.onerror = reject;
          reader.readAsDataURL(configuredImages[i].file);
        });

        const response = await fetch("/api/staging", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            image: base64,
            mimeType: configuredImages[i].file.type,
            roomType: configuredImages[i].roomType,
            style,
            propertyId: propertyId || undefined,
          }),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Failed to stage image");
        }

        // Update image as completed
        setConfiguredImages((prev) =>
          prev.map((img, idx) =>
            idx === i
              ? {
                  ...img,
                  status: "completed" as BatchImageStatus,
                  stagedImageUrl: data.stagedImageUrl,
                  jobId: data.jobId,
                }
              : img
          )
        );
      } catch (err) {
        // Update image as failed
        setConfiguredImages((prev) =>
          prev.map((img, idx) =>
            idx === i
              ? {
                  ...img,
                  status: "failed" as BatchImageStatus,
                  error: err instanceof Error ? err.message : "Unknown error",
                }
              : img
          )
        );
      }
    }

    setProcessingIndex(-1);
    setState("complete");
    router.refresh(); // Refresh to update credits
  };

  // Download single image
  const handleDownloadSingle = (image: ConfiguredImage) => {
    if (image.stagedImageUrl) {
      const link = document.createElement("a");
      link.href = image.stagedImageUrl;
      link.download = `staged-${image.roomType}-${style}-${image.id}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  // Download all as ZIP
  const handleDownloadAll = async () => {
    const zip = new JSZip();
    const completedImages = configuredImages.filter((img) => img.status === "completed");

    for (const image of completedImages) {
      if (image.stagedImageUrl) {
        try {
          const response = await fetch(image.stagedImageUrl);
          const blob = await response.blob();
          const roomLabel = image.roomType?.replace(/-/g, "-") || "room";
          zip.file(`staged-${roomLabel}-${style}.png`, blob);
        } catch (err) {
          console.error("Error adding image to zip:", err);
        }
      }
    }

    const content = await zip.generateAsync({ type: "blob" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(content);
    link.download = `batch-staging-${Date.now()}.zip`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Reset to start
  const handleReset = () => {
    setState("upload");
    setUploadedImages([]);
    setConfiguredImages([]);
    setStyle(null);
    setPropertyId(null);
    setSelectedProperty(null);
    setError(null);
    setProcessingIndex(-1);
  };

  // Go back from configure to upload
  const handleBackToUpload = () => {
    setState("upload");
    setConfiguredImages([]);
    setError(null);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
            Batch Staging
          </h1>
          <p className="text-slate-600 dark:text-slate-400 mt-1">
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

      {/* UPLOAD STATE */}
      {state === "upload" && (
        <>
          <Card>
            <CardHeader>
              <CardTitle>Upload Room Photos</CardTitle>
              <CardDescription>
                Upload up to 10 photos of empty or unfurnished rooms
              </CardDescription>
            </CardHeader>
            <CardContent>
              <BatchImageUploader
                images={uploadedImages}
                onImagesAdd={handleImagesAdd}
                onImageRemove={handleImageRemove}
              />
            </CardContent>
          </Card>

          {uploadedImages.length > 0 && (
            <div className="flex justify-end">
              <Button onClick={handleContinueToConfigure}>
                Continue to Configure ({uploadedImages.length} image{uploadedImages.length !== 1 ? "s" : ""})
              </Button>
            </div>
          )}
        </>
      )}

      {/* CONFIGURE STATE */}
      {state === "configure" && (
        <>
          {/* Property Selection */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                Assign to Property
              </CardTitle>
              <CardDescription>
                Optionally assign all staged photos to a property
              </CardDescription>
            </CardHeader>
            <CardContent>
              <PropertySelector
                value={propertyId}
                onChange={(id, property) => {
                  setPropertyId(id);
                  setSelectedProperty(property || null);
                }}
              />
              {selectedProperty && (
                <p className="mt-2 text-sm text-slate-500">
                  All staged photos will be linked to: {selectedProperty.address}
                </p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Configure Room Types</CardTitle>
              <CardDescription>
                Select the room type for each photo
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {configuredImages.map((image) => (
                  <BatchImageCard
                    key={image.id}
                    image={image}
                    mode="configure"
                    onRoomTypeChange={(roomType) => handleRoomTypeChange(image.id, roomType)}
                  />
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Choose Furniture Style</CardTitle>
              <CardDescription>
                This style will be applied to all photos
              </CardDescription>
            </CardHeader>
            <CardContent>
              <StyleSelector value={style} onChange={setStyle} />
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-blue-600 to-blue-700 border-0">
            <CardContent className="p-6">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="text-white text-center sm:text-left">
                  <h3 className="font-semibold">Ready to stage {configuredImages.length} photos?</h3>
                  <p className="text-blue-100 text-sm">
                    This will use {requiredCredits} credit{requiredCredits !== 1 ? "s" : ""} from your account
                    {selectedProperty && ` • Assigned to ${selectedProperty.address}`}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button variant="secondary" onClick={handleBackToUpload}>
                    Back
                  </Button>
                  <Button
                    variant="secondary"
                    onClick={handleStartStaging}
                    disabled={!allConfigured || !hasEnoughCredits}
                  >
                    <Sparkles className="mr-2 h-5 w-5" />
                    Start Staging
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </>
      )}

      {/* PROCESSING STATE */}
      {state === "processing" && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Loader2 className="h-5 w-5 animate-spin" />
              Processing Batch
            </CardTitle>
            <CardDescription>
              Staging image {processingIndex + 1} of {configuredImages.length}...
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {configuredImages.map((image) => (
                <BatchImageCard key={image.id} image={image} mode="processing" />
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* COMPLETE STATE */}
      {state === "complete" && (
        <>
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    {failedCount === 0 ? (
                      <CheckCircle2 className="h-5 w-5 text-green-600" />
                    ) : failedCount === configuredImages.length ? (
                      <XCircle className="h-5 w-5 text-red-600" />
                    ) : (
                      <AlertTriangle className="h-5 w-5 text-amber-600" />
                    )}
                    Batch Complete
                  </CardTitle>
                  <CardDescription>
                    {completedCount} of {configuredImages.length} images staged successfully
                    {failedCount > 0 && ` (${failedCount} failed)`}
                  </CardDescription>
                </div>
                {completedCount > 0 && (
                  <Button onClick={handleDownloadAll}>
                    <FolderDown className="mr-2 h-4 w-4" />
                    Download All ({completedCount})
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {configuredImages.map((image) => (
                  <BatchImageCard
                    key={image.id}
                    image={image}
                    mode="results"
                    onDownload={() => handleDownloadSingle(image)}
                  />
                ))}
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-center">
            <Button onClick={handleReset}>
              <RotateCcw className="mr-2 h-4 w-4" />
              Stage Another Batch
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
