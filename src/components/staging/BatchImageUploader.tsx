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
            "flex flex-col items-center justify-center w-full border-2 border-dashed rounded-xl cursor-pointer transition-all",
            images.length === 0 ? "h-64" : "h-32",
            isDragging
              ? "border-blue-500 bg-blue-50 dark:bg-blue-950/30"
              : "border-slate-300 dark:border-slate-700 hover:border-blue-400 hover:bg-slate-50 dark:hover:bg-slate-900",
            disabled && "opacity-50 cursor-not-allowed"
          )}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
        >
          <div className="flex flex-col items-center justify-center py-4 px-4 text-center">
            <div
              className={cn(
                "p-3 rounded-full mb-3 transition-colors",
                isDragging
                  ? "bg-blue-100 dark:bg-blue-900"
                  : "bg-slate-100 dark:bg-slate-800"
              )}
            >
              {isDragging ? (
                <Upload className="h-6 w-6 text-blue-600" />
              ) : images.length === 0 ? (
                <Images className="h-6 w-6 text-slate-400" />
              ) : (
                <Plus className="h-6 w-6 text-slate-400" />
              )}
            </div>
            <p className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              {isDragging
                ? "Drop images here"
                : images.length === 0
                ? "Upload room photos"
                : "Add more photos"}
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400">
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
        <div className="text-center py-2 px-4 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg">
          <p className="text-sm text-amber-700 dark:text-amber-400">
            Maximum {MAX_BATCH_SIZE} images reached
          </p>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
      )}

      {/* Image Grid */}
      {images.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
          {images.map((image) => (
            <div
              key={image.id}
              className="relative aspect-video rounded-lg overflow-hidden bg-slate-100 dark:bg-slate-900 group"
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
                  className="absolute top-1 right-1 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
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
