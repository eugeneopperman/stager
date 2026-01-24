"use client";

import { useState, useCallback } from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { Upload, X, Image as ImageIcon, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ACCEPTED_IMAGE_TYPES, MAX_IMAGE_SIZE } from "@/lib/constants";

interface ImageUploaderProps {
  onImageSelect: (file: File, preview: string) => void;
  onImageClear: () => void;
  preview: string | null;
  disabled?: boolean;
}

export function ImageUploader({
  onImageSelect,
  onImageClear,
  preview,
  disabled = false,
}: ImageUploaderProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const validateFile = (file: File): string | null => {
    if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
      return "Please upload a valid image (JPEG, PNG, or WebP)";
    }
    if (file.size > MAX_IMAGE_SIZE) {
      return "Image must be less than 10MB";
    }
    return null;
  };

  const handleFile = useCallback(
    (file: File) => {
      setError(null);
      const validationError = validateFile(file);
      if (validationError) {
        setError(validationError);
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        onImageSelect(file, result);
      };
      reader.readAsDataURL(file);
    },
    [onImageSelect]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);

      if (disabled) return;

      const file = e.dataTransfer.files[0];
      if (file) {
        handleFile(file);
      }
    },
    [disabled, handleFile]
  );

  const handleDragOver = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      if (!disabled) {
        setIsDragging(true);
      }
    },
    [disabled]
  );

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        handleFile(file);
      }
    },
    [handleFile]
  );

  if (preview) {
    return (
      <div className={cn(
        "relative rounded-xl overflow-hidden",
        "bg-muted/50 dark:bg-white/5",
        "ring-1 ring-border/50 dark:ring-white/10",
        "aspect-video"
      )}>
        <Image
          src={preview}
          alt="Uploaded room photo ready for staging"
          fill
          className="object-contain"
          unoptimized
        />
        {!disabled && (
          <Button
            variant="destructive"
            size="icon"
            className="absolute top-4 right-4 shadow-lg"
            onClick={onImageClear}
            aria-label="Remove uploaded image"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </Button>
        )}
        {disabled && (
          <div className={cn(
            "absolute inset-0 flex items-center justify-center",
            "bg-black/40 backdrop-blur-sm"
          )} role="status" aria-live="polite">
            <div className={cn(
              "flex items-center gap-3 px-5 py-3 rounded-xl",
              "bg-background/80 backdrop-blur-md",
              "border border-border/50 shadow-xl"
            )}>
              <Loader2 className="h-5 w-5 animate-spin text-primary" aria-hidden="true" />
              <span className="text-sm font-medium">Processing...</span>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div>
      <label
        className={cn(
          "flex flex-col items-center justify-center w-full h-64 sm:h-80 rounded-xl cursor-pointer",
          // Border
          "border-2 border-dashed",
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
        <div className="flex flex-col items-center justify-center py-8 px-4 text-center">
          <div
            className={cn(
              "p-4 rounded-full mb-4 transition-all duration-200",
              isDragging
                ? "bg-primary/15 dark:bg-primary/20 scale-110"
                : "bg-muted/80 dark:bg-white/5"
            )}
          >
            {isDragging ? (
              <Upload className="h-10 w-10 text-primary" aria-hidden="true" />
            ) : (
              <ImageIcon className="h-10 w-10 text-muted-foreground" aria-hidden="true" />
            )}
          </div>
          <p className="text-lg font-medium text-foreground mb-1">
            {isDragging ? "Drop your image here" : "Upload a room photo"}
          </p>
          <p className="text-sm text-muted-foreground mb-4">
            Drag and drop or click to browse
          </p>
          <p className="text-xs text-muted-foreground/70">
            JPEG, PNG, or WebP up to 10MB
          </p>
        </div>
        <input
          type="file"
          className="hidden"
          accept={ACCEPTED_IMAGE_TYPES.join(",")}
          onChange={handleInputChange}
          disabled={disabled}
        />
      </label>
      {error && (
        <p className="mt-2 text-sm text-destructive" role="alert" aria-live="assertive">{error}</p>
      )}
    </div>
  );
}
