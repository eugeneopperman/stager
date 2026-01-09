"use client";

import { useState, useCallback } from "react";
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
      <div className="relative rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-900">
        <img
          src={preview}
          alt="Uploaded preview"
          className="w-full h-auto max-h-[500px] object-contain"
        />
        {!disabled && (
          <Button
            variant="destructive"
            size="icon"
            className="absolute top-4 right-4 shadow-lg"
            onClick={onImageClear}
          >
            <X className="h-4 w-4" />
          </Button>
        )}
        {disabled && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
            <div className="flex items-center gap-2 text-white">
              <Loader2 className="h-5 w-5 animate-spin" />
              <span>Processing...</span>
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
          "flex flex-col items-center justify-center w-full h-80 border-2 border-dashed rounded-xl cursor-pointer transition-all",
          isDragging
            ? "border-blue-500 bg-blue-50 dark:bg-blue-950/30"
            : "border-slate-300 dark:border-slate-700 hover:border-blue-400 hover:bg-slate-50 dark:hover:bg-slate-900",
          disabled && "opacity-50 cursor-not-allowed"
        )}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
      >
        <div className="flex flex-col items-center justify-center py-8 px-4 text-center">
          <div
            className={cn(
              "p-4 rounded-full mb-4 transition-colors",
              isDragging
                ? "bg-blue-100 dark:bg-blue-900"
                : "bg-slate-100 dark:bg-slate-800"
            )}
          >
            {isDragging ? (
              <Upload className="h-10 w-10 text-blue-600" />
            ) : (
              <ImageIcon className="h-10 w-10 text-slate-400" />
            )}
          </div>
          <p className="text-lg font-medium text-slate-700 dark:text-slate-300 mb-1">
            {isDragging ? "Drop your image here" : "Upload a room photo"}
          </p>
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
            Drag and drop or click to browse
          </p>
          <p className="text-xs text-slate-400 dark:text-slate-500">
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
        <p className="mt-2 text-sm text-red-600 dark:text-red-400">{error}</p>
      )}
    </div>
  );
}
