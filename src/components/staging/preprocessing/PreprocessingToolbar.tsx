"use client";

import { useCallback, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
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
import { MaskingTool } from "./tools/MaskingTool";

interface PreprocessingToolbarProps {
  imageUrl: string;
  imageFile: File;
  onImageUpdate: (file: File, previewUrl: string) => void;
  onMaskUpdate?: (maskDataUrl: string | null) => void;
  disabled?: boolean;
}

const TOOLS: { id: PreprocessingTool; label: string; icon: React.ElementType; implemented: boolean }[] = [
  { id: "crop-rotate", label: "Crop", icon: Crop, implemented: true },
  { id: "adjustments", label: "Adjust", icon: SunMedium, implemented: true },
  { id: "declutter", label: "Declutter", icon: Eraser, implemented: true },
  { id: "masking", label: "Mask", icon: PaintBucket, implemented: true },
];

export function PreprocessingToolbar({
  imageUrl,
  imageFile,
  onImageUpdate,
  onMaskUpdate,
  disabled = false,
}: PreprocessingToolbarProps) {
  const [activeTool, setActiveTool] = useState<PreprocessingTool | null>(null);
  const [workingImageUrl, setWorkingImageUrl] = useState<string | null>(null);
  const [adjustments, setAdjustments] = useState<ImageAdjustments>(DEFAULT_ADJUSTMENTS);
  const [history, setHistory] = useState<string[]>([]);
  const [currentMask, setCurrentMask] = useState<string | null>(null);
  const [showOriginal, setShowOriginal] = useState(false);

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
    async (dataUrl: string, maskDataUrl?: string) => {
      // Add current image to history
      setHistory((prev) => [...prev.slice(-9), currentImageUrl]);

      // Convert data URL to file
      const response = await fetch(dataUrl);
      const blob = await response.blob();
      const newFile = new File([blob], `preprocessed-${Date.now()}.png`, {
        type: "image/png",
      });

      // Store and propagate mask if provided
      if (maskDataUrl) {
        console.log("[PreprocessingToolbar] Mask applied for staging");
        setCurrentMask(maskDataUrl);
        onMaskUpdate?.(maskDataUrl);
      }

      // Update working image
      setWorkingImageUrl(dataUrl);
      setActiveTool(null);
      setAdjustments(DEFAULT_ADJUSTMENTS);

      // Notify parent
      onImageUpdate(newFile, dataUrl);
    },
    [currentImageUrl, onImageUpdate, onMaskUpdate]
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
    setCurrentMask(null);
    onMaskUpdate?.(null);
    onImageUpdate(imageFile, imageUrl);
  }, [imageFile, imageUrl, onImageUpdate, onMaskUpdate]);

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

  // Determine which image to display (for peek functionality)
  const displayImageUrl = hasChanges && showOriginal ? imageUrl : currentImageUrl;

  return (
    <div className="space-y-3">
      {/* Preview Area - Tool-specific previews or main preview */}
      {activeTool === "crop-rotate" ? (
        <CropRotateTool
          imageUrl={currentImageUrl}
          onApply={handleApply}
          onCancel={handleCancel}
          disabled={disabled}
        />
      ) : activeTool === "masking" ? (
        <MaskingTool
          imageUrl={currentImageUrl}
          onApply={handleApply}
          onCancel={handleCancel}
          disabled={disabled}
        />
      ) : activeTool === "declutter" ? (
        <DeclutterTool
          imageUrl={currentImageUrl}
          onApply={handleApply}
          onCancel={handleCancel}
          disabled={disabled}
        />
      ) : (
        /* Main Image Preview */
        <div className="relative aspect-video rounded-lg overflow-hidden bg-muted">
          <img
            src={displayImageUrl}
            alt="Preview"
            className="w-full h-full object-contain transition-all duration-150"
            style={previewStyle}
          />
          {hasChanges && (
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
      )}

      {/* Tool Buttons - always in same position */}
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
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={handleUndo}
                disabled={disabled || !canUndo}
              >
                <Undo2 className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Undo</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={handleReset}
                disabled={disabled || !hasChanges}
              >
                <RotateCcw className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Reset Image</TooltipContent>
          </Tooltip>
        </div>
      </div>

      {/* Tool Control Panel (no preview, just controls) */}
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
    </div>
  );
}
