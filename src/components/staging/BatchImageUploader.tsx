"use client";

import { useState, useCallback } from "react";
import { cn } from "@/lib/utils";
import { Upload, X, Images, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ACCEPTED_IMAGE_TYPES, MAX_IMAGE_SIZE, MAX_BATCH_SIZE } from "@/lib/constants";

export interface BatchImage {
  id: string;
  file: File;
  preview: string;
}

interface BatchImageUploaderProps {
  images: BatchImage[];
  onImagesAdd: (newImages: BatchImage[]) => void;
  onImageRemove: (id: string) => void;
  disabled?: boolean;
}

export function BatchImageUploader({
  images,
  onImagesAdd,
  onImageRemove,
  disabled = false,
}: BatchImageUploaderProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const validateFile = (file: File): string | null => {
    if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
      return `${file.name}: Invalid format (use JPEG, PNG, or WebP)`;
    }
    if (file.size > MAX_IMAGE_SIZE) {
      return `${file.name}: File too large (max 10MB)`;
    }
    return null;
  };

  const handleFiles = useCallback(
    async (files: FileList) => {
      setError(null);
      const remainingSlots = MAX_BATCH_SIZE - images.length;

      if (files.length > remainingSlots) {
        setError(`Can only add ${remainingSlots} more image${remainingSlots !== 1 ? 's' : ''} (max ${MAX_BATCH_SIZE})`);
        return;
      }

      const newImages: BatchImage[] = [];
      const errors: string[] = [];

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const validationError = validateFile(file);

        if (validationError) {
          errors.push(validationError);
          continue;
        }

        const preview = await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onload = (e) => resolve(e.target?.result as string);
          reader.readAsDataURL(file);
        });

        newImages.push({
          id: `${Date.now()}-${i}-${Math.random().toString(36).substr(2, 9)}`,
          file,
          preview,
        });
      }

      if (errors.length > 0) {
        setError(errors.join("; "));
      }

      if (newImages.length > 0) {
        onImagesAdd(newImages);
      }
    },
    [images.length, onImagesAdd]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      if (disabled) return;
      handleFiles(e.dataTransfer.files);
    },
    [disabled, handleFiles]
  );

  const handleDragOver = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      if (!disabled) setIsDragging(true);
    },
    [disabled]
  );

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files) {
        handleFiles(e.target.files);
      }
      e.target.value = "";
    },
    [handleFiles]
  );

  const isFull = images.length >= MAX_BATCH_SIZE;

  return (
    <div className="space-y-4">
      {/* Upload Zone */}
      {!isFull && (
        <label
          className={cn(
            "flex flex-col items-center justify-center w-full rounded-xl cursor-pointer",
            // Border
            "border-2 border-dashed",
            // Height
            images.length === 0 ? "h-64" : "h-32",
            // Transitions
            "transition-all duration-200 ease-out",
            // States
            isDragging
              ? "border-primary bg-primary/5 dark:bg-primary/10 scale-[1.01] shadow-lg shadow-primary/10"
              : "border-border/60 dark:border-white/10 hover:border-primary/50 hover:bg-accent/30 dark:hover:bg-white/5",
            disabled && "opacity-50 cursor-not-allowed"
          )}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
        >
          <div className="flex flex-col items-center justify-center py-4 px-4 text-center">
            <div
              className={cn(
                "p-3 rounded-full mb-3 transition-all duration-200",
                isDragging
                  ? "bg-primary/15 dark:bg-primary/20 scale-110"
                  : "bg-muted/80 dark:bg-white/5"
              )}
            >
              {isDragging ? (
                <Upload className="h-6 w-6 text-primary" />
              ) : images.length === 0 ? (
                <Images className="h-6 w-6 text-muted-foreground" />
              ) : (
                <Plus className="h-6 w-6 text-muted-foreground" />
              )}
            </div>
            <p className="text-sm font-medium text-foreground mb-1">
              {isDragging
                ? "Drop images here"
                : images.length === 0
                ? "Upload room photos"
                : "Add more photos"}
            </p>
            <p className="text-xs text-muted-foreground">
              {images.length === 0
                ? "Drag and drop or click to browse (up to 10 images)"
                : `${images.length} of ${MAX_BATCH_SIZE} images`}
            </p>
          </div>
          <input
            type="file"
            className="hidden"
            accept={ACCEPTED_IMAGE_TYPES.join(",")}
            onChange={handleInputChange}
            disabled={disabled}
            multiple
          />
        </label>
      )}

      {/* Image Counter when full */}
      {isFull && (
        <div className={cn(
          "text-center py-2.5 px-4 rounded-xl",
          "bg-amber-500/10 dark:bg-amber-500/15",
          "border border-amber-500/20 dark:border-amber-500/30"
        )}>
          <p className="text-sm font-medium text-amber-700 dark:text-amber-400">
            Maximum {MAX_BATCH_SIZE} images reached
          </p>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <p className="text-sm text-destructive">{error}</p>
      )}

      {/* Image Grid */}
      {images.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
          {images.map((image) => (
            <div
              key={image.id}
              className={cn(
                "relative aspect-video rounded-xl overflow-hidden group",
                "bg-muted/50 dark:bg-white/5",
                "ring-1 ring-border/50 dark:ring-white/10",
                "transition-all duration-200",
                "hover:ring-border hover:shadow-md"
              )}
            >
              <img
                src={image.preview}
                alt="Upload preview"
                className="w-full h-full object-cover"
              />
              {!disabled && (
                <Button
                  variant="destructive"
                  size="icon"
                  className={cn(
                    "absolute top-1.5 right-1.5 h-6 w-6",
                    "opacity-0 group-hover:opacity-100",
                    "transition-all duration-200",
                    "scale-90 group-hover:scale-100"
                  )}
                  onClick={() => onImageRemove(image.id)}
                >
                  <X className="h-3 w-3" />
                </Button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
