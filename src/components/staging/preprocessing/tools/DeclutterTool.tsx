"use client";

import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Loader2, Eraser, ArrowLeftRight, RotateCcw } from "lucide-react";

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
  const [sliderPosition, setSliderPosition] = useState(50);

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
    setSliderPosition(50);
  }, []);

  // Idle state - show declutter button
  if (state === "idle") {
    return (
      <div className="p-4 bg-muted/30 rounded-lg border space-y-4">
        <div className="text-center space-y-2">
          <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
            <Eraser className="h-6 w-6 text-primary" />
          </div>
          <h4 className="text-sm font-medium">Remove Existing Furniture</h4>
          <p className="text-xs text-muted-foreground max-w-xs mx-auto">
            AI will remove furniture and objects from the room, leaving an empty space ready for virtual staging.
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
      </div>
    );
  }

  // Processing state - show loading
  if (state === "processing") {
    return (
      <div className="p-4 bg-muted/30 rounded-lg border">
        <div className="text-center space-y-4">
          <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
            <Loader2 className="h-6 w-6 text-primary animate-spin" />
          </div>
          <div className="space-y-1">
            <h4 className="text-sm font-medium">Removing Furniture...</h4>
            <p className="text-xs text-muted-foreground">
              This may take 10-20 seconds
            </p>
          </div>
          <div className="h-1.5 bg-muted rounded-full overflow-hidden">
            <div className="h-full bg-primary rounded-full animate-pulse w-2/3" />
          </div>
        </div>
      </div>
    );
  }

  // Preview state - show before/after comparison
  return (
    <div className="space-y-4">
      {/* Before/After Comparison Slider */}
      <div
        className="relative aspect-video rounded-lg overflow-hidden cursor-ew-resize bg-muted"
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
        {/* Decluttered image (right/after) */}
        <img
          src={declutteredUrl!}
          alt="Decluttered"
          className="absolute inset-0 w-full h-full object-contain"
        />

        {/* Original image (left/before) with clip */}
        <div
          className="absolute inset-0 overflow-hidden"
          style={{ width: `${sliderPosition}%` }}
        >
          <img
            src={imageUrl}
            alt="Original"
            className="absolute inset-0 w-full h-full object-contain"
            style={{
              width: `${100 / (sliderPosition / 100)}%`,
              maxWidth: "none",
            }}
          />
        </div>

        {/* Slider line */}
        <div
          className="absolute top-0 bottom-0 w-0.5 bg-white shadow-lg"
          style={{ left: `${sliderPosition}%`, transform: "translateX(-50%)" }}
        >
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 bg-white rounded-full shadow-lg flex items-center justify-center">
            <ArrowLeftRight className="h-4 w-4 text-slate-600" />
          </div>
        </div>

        {/* Labels */}
        <div className="absolute bottom-3 left-3 px-2 py-1 bg-black/70 rounded text-white text-xs font-medium">
          Before
        </div>
        <div className="absolute bottom-3 right-3 px-2 py-1 bg-black/70 rounded text-white text-xs font-medium">
          After
        </div>
      </div>

      {/* Controls */}
      <div className="p-4 bg-muted/30 rounded-lg border">
        <div className="flex items-center gap-2">
          <p className="text-xs text-muted-foreground flex-1">
            Drag the slider to compare before and after
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

        <div className="flex gap-2 mt-3 pt-3 border-t">
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
      </div>
    </div>
  );
}
