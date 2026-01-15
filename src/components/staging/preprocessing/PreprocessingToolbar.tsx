"use client";

import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Crop,
  SunMedium,
  Eraser,
  PaintBucket,
  RotateCcw,
  Undo2,
} from "lucide-react";
import { type PreprocessingTool, type ImageAdjustments, DEFAULT_ADJUSTMENTS } from "./types";
import { AdjustmentsTool } from "./tools/AdjustmentsTool";
import { CropRotateTool } from "./tools/CropRotateTool";
import { DeclutterTool } from "./tools/DeclutterTool";

interface PreprocessingToolbarProps {
  imageUrl: string;
  imageFile: File;
  onImageUpdate: (file: File, previewUrl: string) => void;
  disabled?: boolean;
}

const TOOLS: { id: PreprocessingTool; label: string; icon: React.ElementType; implemented: boolean }[] = [
  { id: "crop-rotate", label: "Crop", icon: Crop, implemented: true },
  { id: "adjustments", label: "Adjust", icon: SunMedium, implemented: true },
  { id: "declutter", label: "Declutter", icon: Eraser, implemented: true },
  { id: "masking", label: "Mask", icon: PaintBucket, implemented: false },
];

export function PreprocessingToolbar({
  imageUrl,
  imageFile,
  onImageUpdate,
  disabled = false,
}: PreprocessingToolbarProps) {
  const [activeTool, setActiveTool] = useState<PreprocessingTool | null>(null);
  const [workingImageUrl, setWorkingImageUrl] = useState<string | null>(null);
  const [adjustments, setAdjustments] = useState<ImageAdjustments>(DEFAULT_ADJUSTMENTS);
  const [history, setHistory] = useState<string[]>([]);

  // The current display image (working or original)
  const currentImageUrl = workingImageUrl || imageUrl;

  // CSS filter style for live preview (adjustments only)
  const previewStyle =
    activeTool === "adjustments"
      ? {
          filter: `brightness(${1 + adjustments.brightness / 100}) contrast(${1 + adjustments.contrast / 100})`,
        }
      : {};

  const handleToolClick = useCallback(
    (toolId: PreprocessingTool) => {
      if (activeTool === toolId) {
        // Toggle off
        setActiveTool(null);
        setAdjustments(DEFAULT_ADJUSTMENTS);
      } else {
        // Switch to new tool
        setActiveTool(toolId);
        setAdjustments(DEFAULT_ADJUSTMENTS);
      }
    },
    [activeTool]
  );

  const handleApply = useCallback(
    async (dataUrl: string) => {
      // Add current image to history
      setHistory((prev) => [...prev.slice(-9), currentImageUrl]);

      // Convert data URL to file
      const response = await fetch(dataUrl);
      const blob = await response.blob();
      const newFile = new File([blob], `preprocessed-${Date.now()}.png`, {
        type: "image/png",
      });

      // Update working image
      setWorkingImageUrl(dataUrl);
      setActiveTool(null);
      setAdjustments(DEFAULT_ADJUSTMENTS);

      // Notify parent
      onImageUpdate(newFile, dataUrl);
    },
    [currentImageUrl, onImageUpdate]
  );

  const handleCancel = useCallback(() => {
    setActiveTool(null);
    setAdjustments(DEFAULT_ADJUSTMENTS);
  }, []);

  const handleReset = useCallback(() => {
    setWorkingImageUrl(null);
    setActiveTool(null);
    setAdjustments(DEFAULT_ADJUSTMENTS);
    setHistory([]);
    onImageUpdate(imageFile, imageUrl);
  }, [imageFile, imageUrl, onImageUpdate]);

  const handleUndo = useCallback(() => {
    if (history.length === 0) return;

    const previousUrl = history[history.length - 1];
    setHistory((prev) => prev.slice(0, -1));

    if (history.length === 1) {
      // Going back to original
      setWorkingImageUrl(null);
      onImageUpdate(imageFile, imageUrl);
    } else {
      setWorkingImageUrl(previousUrl);
      // Create file from previous URL
      fetch(previousUrl)
        .then((res) => res.blob())
        .then((blob) => {
          const file = new File([blob], `preprocessed.png`, { type: "image/png" });
          onImageUpdate(file, previousUrl);
        });
    }
  }, [history, imageFile, imageUrl, onImageUpdate]);

  const canUndo = history.length > 0;
  const hasChanges = workingImageUrl !== null;

  return (
    <div className="space-y-3">
      {/* Image Preview - hidden when crop tool is active (it has its own preview) */}
      {activeTool !== "crop-rotate" && (
        <div className="relative aspect-video rounded-lg overflow-hidden bg-muted">
          <img
            src={currentImageUrl}
            alt="Preview"
            className="w-full h-full object-contain transition-all duration-150"
            style={previewStyle}
          />
          {hasChanges && (
            <div className="absolute top-2 left-2 px-2 py-1 bg-primary/90 text-primary-foreground text-xs font-medium rounded">
              Edited
            </div>
          )}
        </div>
      )}

      {/* Tool Buttons */}
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1 flex-1">
          {TOOLS.map((tool) => (
            <Button
              key={tool.id}
              variant={activeTool === tool.id ? "default" : "outline"}
              size="sm"
              onClick={() => handleToolClick(tool.id)}
              disabled={disabled || !tool.implemented}
              className="gap-1.5"
              title={!tool.implemented ? "Coming soon" : tool.label}
            >
              <tool.icon className="h-4 w-4" />
              <span className="hidden sm:inline">{tool.label}</span>
            </Button>
          ))}
        </div>

        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={handleUndo}
            disabled={disabled || !canUndo}
            title="Undo"
          >
            <Undo2 className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={handleReset}
            disabled={disabled || !hasChanges}
            title="Reset to original"
          >
            <RotateCcw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Tool Panel */}
      {activeTool === "adjustments" && (
        <AdjustmentsTool
          imageUrl={currentImageUrl}
          adjustments={adjustments}
          onAdjustmentsChange={setAdjustments}
          onApply={handleApply}
          onCancel={handleCancel}
          disabled={disabled}
        />
      )}

      {/* Crop & Rotate Tool */}
      {activeTool === "crop-rotate" && (
        <CropRotateTool
          imageUrl={currentImageUrl}
          onApply={handleApply}
          onCancel={handleCancel}
          disabled={disabled}
        />
      )}
      {/* Declutter Tool */}
      {activeTool === "declutter" && (
        <DeclutterTool
          imageUrl={currentImageUrl}
          onApply={handleApply}
          onCancel={handleCancel}
          disabled={disabled}
        />
      )}
      {activeTool === "masking" && (
        <div className="p-4 bg-muted/30 rounded-lg border text-center text-sm text-muted-foreground">
          Masking tool coming soon
        </div>
      )}
    </div>
  );
}
