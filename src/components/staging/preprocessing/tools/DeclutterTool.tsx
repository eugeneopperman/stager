"use client";

import { useState, useCallback } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Loader2, Eraser, RotateCcw } from "lucide-react";

interface DeclutterToolProps {
  imageUrl: string;
  onApply: (dataUrl: string) => void;
  onCancel: () => void;
  disabled?: boolean;
}

type DeclutterState = "idle" | "processing" | "preview";

export function DeclutterTool({
  imageUrl,
  onApply,
  onCancel,
  disabled = false,
}: DeclutterToolProps) {
  const [state, setState] = useState<DeclutterState>("idle");
  const [declutteredUrl, setDeclutteredUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showOriginal, setShowOriginal] = useState(false);

  const handleDeclutter = useCallback(async () => {
    setState("processing");
    setError(null);

    try {
      let base64: string;
      let mimeType: string;

      // Check if imageUrl is already a data URL
      if (imageUrl.startsWith("data:")) {
        // Extract base64 and mimeType from data URL
        const matches = imageUrl.match(/^data:([^;]+);base64,(.+)$/);
        if (matches) {
          mimeType = matches[1];
          base64 = matches[2];
        } else {
          throw new Error("Invalid data URL format");
        }
      } else {
        // Fetch the image and convert to base64
        const response = await fetch(imageUrl);
        if (!response.ok) {
          throw new Error("Failed to fetch image");
        }
        const blob = await response.blob();
        mimeType = blob.type || "image/png";

        base64 = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => {
            const result = reader.result as string;
            const base64Data = result.split(",")[1];
            if (base64Data) {
              resolve(base64Data);
            } else {
              reject(new Error("Failed to extract base64 data"));
            }
          };
          reader.onerror = () => reject(new Error("Failed to read image"));
          reader.readAsDataURL(blob);
        });
      }

      // Call declutter API
      const apiResponse = await fetch("/api/declutter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          image: base64,
          mimeType,
          stageAfter: false,
        }),
      });

      const data = await apiResponse.json();

      if (!apiResponse.ok) {
        throw new Error(data.error || "Declutter failed");
      }

      if (data.declutteredImageUrl) {
        setDeclutteredUrl(data.declutteredImageUrl);
        setState("preview");
      } else {
        // Log the response for debugging
        console.error("[DeclutterTool] Unexpected response:", data);
        throw new Error(data.error || "No decluttered image returned");
      }
    } catch (err) {
      console.error("[DeclutterTool] Error:", err);
      setError(err instanceof Error ? err.message : "Declutter failed");
      setState("idle");
    }
  }, [imageUrl]);

  const handleApply = useCallback(() => {
    if (declutteredUrl) {
      onApply(declutteredUrl);
    }
  }, [declutteredUrl, onApply]);

  const handleReset = useCallback(() => {
    setState("idle");
    setDeclutteredUrl(null);
    setError(null);
    setShowOriginal(false);
  }, []);

  // Determine which image to show
  const displayUrl = state === "preview" && declutteredUrl && !showOriginal
    ? declutteredUrl
    : imageUrl;

  return (
    <div className="space-y-3">
      {/* Image Preview - always visible */}
      <div className="relative aspect-video rounded-lg overflow-hidden bg-muted">
        <Image
          src={displayUrl}
          alt={state === "preview" && !showOriginal ? "Decluttered" : "Original"}
          fill
          className="object-contain transition-opacity duration-150"
          unoptimized
        />

        {/* Processing overlay */}
        {state === "processing" && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
            <div className="text-center space-y-3">
              <Loader2 className="h-8 w-8 text-white animate-spin mx-auto" />
              <div className="space-y-1">
                <p className="text-sm font-medium text-white">Removing Furniture...</p>
                <p className="text-xs text-white/70">This may take 10-20 seconds</p>
              </div>
            </div>
          </div>
        )}

        {/* Edited label - press to see original */}
        {state === "preview" && declutteredUrl && (
          <button
            type="button"
            className="absolute top-2 left-2 px-2 py-1 bg-primary/90 hover:bg-primary text-primary-foreground text-xs font-medium rounded cursor-pointer select-none transition-colors"
            onMouseDown={() => setShowOriginal(true)}
            onMouseUp={() => setShowOriginal(false)}
            onMouseLeave={() => setShowOriginal(false)}
            onTouchStart={() => setShowOriginal(true)}
            onTouchEnd={() => setShowOriginal(false)}
            title="Hold to see original"
          >
            {showOriginal ? "Original" : "Edited"}
          </button>
        )}
      </div>

      {/* Controls */}
      <div className="p-4 bg-muted/30 rounded-lg border space-y-4">
        {/* Idle state content */}
        {state === "idle" && (
          <>
            <div className="text-center space-y-2">
              <div className="mx-auto w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                <Eraser className="h-5 w-5 text-primary" />
              </div>
              <h4 className="text-sm font-medium">Remove Existing Furniture</h4>
              <p className="text-xs text-muted-foreground max-w-xs mx-auto">
                AI will remove furniture and objects, leaving an empty room for staging.
              </p>
            </div>

            {error && (
              <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
                <p className="text-xs text-destructive text-center">{error}</p>
              </div>
            )}

            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={onCancel}
                disabled={disabled}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={handleDeclutter}
                disabled={disabled}
                className="flex-1"
              >
                <Eraser className="h-4 w-4 mr-2" />
                Declutter
              </Button>
            </div>
          </>
        )}

        {/* Processing state content */}
        {state === "processing" && (
          <div className="text-center py-2">
            <div className="h-1.5 bg-muted rounded-full overflow-hidden">
              <div className="h-full bg-primary rounded-full animate-pulse w-2/3" />
            </div>
          </div>
        )}

        {/* Preview state content */}
        {state === "preview" && (
          <>
            <div className="flex items-center gap-2">
              <p className="text-xs text-muted-foreground flex-1">
                Hold the <strong>Edited</strong> label to compare with original
              </p>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleReset}
                disabled={disabled}
                className="gap-1"
              >
                <RotateCcw className="h-3 w-3" />
                Retry
              </Button>
            </div>

            <div className="flex gap-2 pt-3 border-t">
              <Button
                variant="outline"
                size="sm"
                onClick={onCancel}
                disabled={disabled}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={handleApply}
                disabled={disabled}
                className="flex-1"
              >
                Apply
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
