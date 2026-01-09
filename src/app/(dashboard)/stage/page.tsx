"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ImageUploader } from "@/components/staging/ImageUploader";
import { RoomTypeSelector } from "@/components/staging/RoomTypeSelector";
import { StyleSelector } from "@/components/staging/StyleSelector";
import { StagingResult } from "@/components/staging/StagingResult";
import { type RoomType, type FurnitureStyle } from "@/lib/constants";
import { Sparkles, Loader2, AlertCircle } from "lucide-react";

type StagingState = "upload" | "processing" | "complete" | "error";

export default function StagePage() {
  const router = useRouter();
  const [state, setState] = useState<StagingState>("upload");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [roomType, setRoomType] = useState<RoomType | null>(null);
  const [style, setStyle] = useState<FurnitureStyle | null>(null);
  const [stagedImage, setStagedImage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

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
    if (!selectedFile || !roomType || !style) {
      setError("Please upload an image and select room type and style");
      return;
    }

    setState("processing");
    setError(null);

    try {
      // Convert file to base64
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          const result = reader.result as string;
          // Remove the data URL prefix to get just the base64
          const base64Data = result.split(",")[1];
          resolve(base64Data);
        };
        reader.onerror = reject;
        reader.readAsDataURL(selectedFile);
      });

      const response = await fetch("/api/staging", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          image: base64,
          mimeType: selectedFile.type,
          roomType,
          style,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to stage image");
      }

      if (data.stagedImageUrl) {
        setStagedImage(data.stagedImageUrl);
        setState("complete");
        router.refresh(); // Refresh to update credits
      } else {
        throw new Error("No staged image returned");
      }
    } catch (err) {
      console.error("Staging error:", err);
      setError(err instanceof Error ? err.message : "An error occurred");
      setState("error");
    }
  };

  const handleReset = () => {
    setState("upload");
    setSelectedFile(null);
    setPreview(null);
    setRoomType(null);
    setStyle(null);
    setStagedImage(null);
    setError(null);
  };

  const handleDownload = () => {
    if (stagedImage) {
      const link = document.createElement("a");
      link.href = stagedImage;
      link.download = `staged-${roomType}-${style}-${Date.now()}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const isProcessing = state === "processing";
  const canStage = selectedFile && roomType && style && !isProcessing;

  // Show result view
  if (state === "complete" && stagedImage && preview) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
            Staging Complete!
          </h1>
          <p className="text-slate-600 dark:text-slate-400 mt-1">
            Your room has been beautifully staged
          </p>
        </div>

        <StagingResult
          originalImage={preview}
          stagedImage={stagedImage}
          onReset={handleReset}
          onDownload={handleDownload}
        />
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

      {/* Style Section */}
      <Card>
        <CardHeader>
          <CardTitle>3. Choose Furniture Style</CardTitle>
          <CardDescription>
            Select a design style for the virtual staging
          </CardDescription>
        </CardHeader>
        <CardContent>
          <StyleSelector
            value={style}
            onChange={setStyle}
            disabled={isProcessing}
          />
        </CardContent>
      </Card>

      {/* Stage Button */}
      <Card className="bg-gradient-to-r from-blue-600 to-blue-700 border-0">
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-white text-center sm:text-left">
              <h3 className="font-semibold">Ready to stage?</h3>
              <p className="text-blue-100 text-sm">
                This will use 1 credit from your account
              </p>
            </div>
            <Button
              size="lg"
              variant="secondary"
              onClick={handleStage}
              disabled={!canStage}
              className="w-full sm:w-auto"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 h-5 w-5" />
                  Stage This Room
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
