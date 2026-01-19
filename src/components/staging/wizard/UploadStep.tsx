"use client";

import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { ImageUploader } from "@/components/staging/ImageUploader";
import { Clock, Layers, Zap } from "lucide-react";
import { STAGING_TIME_ESTIMATE } from "@/lib/constants";

interface UploadStepProps {
  onImageSelect: (file: File, preview: string) => void;
  onImageClear: () => void;
  preview: string | null;
  disabled?: boolean;
}

export function UploadStep({
  onImageSelect,
  onImageClear,
  preview,
  disabled = false,
}: UploadStepProps) {
  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Upload area */}
      <Card className="overflow-hidden">
        <CardContent className="p-6">
          <ImageUploader
            onImageSelect={onImageSelect}
            onImageClear={onImageClear}
            preview={preview}
            disabled={disabled}
          />
        </CardContent>
      </Card>

      {/* Info cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="flex items-center gap-3 p-4 rounded-lg bg-muted/50 border border-border/50">
          <div className="p-2 rounded-full bg-primary/10">
            <Zap className="h-4 w-4 text-primary" />
          </div>
          <div>
            <p className="text-sm font-medium">AI-Powered</p>
            <p className="text-xs text-muted-foreground">Smart furniture placement</p>
          </div>
        </div>

        <div className="flex items-center gap-3 p-4 rounded-lg bg-muted/50 border border-border/50">
          <div className="p-2 rounded-full bg-primary/10">
            <Clock className="h-4 w-4 text-primary" />
          </div>
          <div>
            <p className="text-sm font-medium">{STAGING_TIME_ESTIMATE}</p>
            <p className="text-xs text-muted-foreground">Per variation</p>
          </div>
        </div>

        <Link
          href="/stage/batch"
          className="flex items-center gap-3 p-4 rounded-lg bg-muted/50 border border-border/50 hover:bg-muted hover:border-border transition-colors"
        >
          <div className="p-2 rounded-full bg-primary/10">
            <Layers className="h-4 w-4 text-primary" />
          </div>
          <div>
            <p className="text-sm font-medium">Batch Mode</p>
            <p className="text-xs text-muted-foreground">Stage multiple photos</p>
          </div>
        </Link>
      </div>
    </div>
  );
}
