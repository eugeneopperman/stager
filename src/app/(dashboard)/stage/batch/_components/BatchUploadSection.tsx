"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BatchImageUploader, type BatchImage } from "@/components/staging/BatchImageUploader";

interface BatchUploadSectionProps {
  images: BatchImage[];
  onImagesAdd: (images: BatchImage[]) => void;
  onImageRemove: (id: string) => void;
  onContinue: () => void;
}

export function BatchUploadSection({
  images,
  onImagesAdd,
  onImageRemove,
  onContinue,
}: BatchUploadSectionProps) {
  return (
    <>
      <Card data-tour="batch-upload">
        <CardHeader>
          <CardTitle>Upload Room Photos</CardTitle>
          <CardDescription>
            Upload up to 10 photos of empty or unfurnished rooms
          </CardDescription>
        </CardHeader>
        <CardContent>
          <BatchImageUploader
            images={images}
            onImagesAdd={onImagesAdd}
            onImageRemove={onImageRemove}
          />
        </CardContent>
      </Card>

      {images.length > 0 && (
        <div className="flex justify-end">
          <Button onClick={onContinue}>
            Continue to Configure ({images.length} image{images.length !== 1 ? "s" : ""})
          </Button>
        </div>
      )}
    </>
  );
}
