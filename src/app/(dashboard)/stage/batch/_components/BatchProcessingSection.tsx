"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BatchImageCard } from "@/components/staging/BatchImageCard";
import { Loader2 } from "lucide-react";
import type { BatchImageData } from "../_hooks/useBatchProcessing";

interface BatchProcessingSectionProps {
  images: BatchImageData[];
  processingIndex: number;
}

export function BatchProcessingSection({
  images,
  processingIndex,
}: BatchProcessingSectionProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Loader2 className="h-5 w-5 animate-spin" />
          Processing Batch
        </CardTitle>
        <CardDescription>
          Staging image {processingIndex + 1} of {images.length}...
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {images.map((image) => (
            <BatchImageCard key={image.id} image={image} mode="processing" />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
