"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BatchImageCard } from "@/components/staging/BatchImageCard";
import {
  CheckCircle2,
  XCircle,
  AlertTriangle,
  FolderDown,
  RotateCcw,
} from "lucide-react";
import type { BatchImageData } from "../_hooks/useBatchProcessing";

interface BatchResultsSectionProps {
  images: BatchImageData[];
  completedCount: number;
  failedCount: number;
  onDownloadSingle: (image: BatchImageData) => void;
  onDownloadAll: () => void;
  onReset: () => void;
}

export function BatchResultsSection({
  images,
  completedCount,
  failedCount,
  onDownloadSingle,
  onDownloadAll,
  onReset,
}: BatchResultsSectionProps) {
  const getStatusIcon = () => {
    if (failedCount === 0) {
      return <CheckCircle2 className="h-5 w-5 text-green-600" />;
    }
    if (failedCount === images.length) {
      return <XCircle className="h-5 w-5 text-red-600" />;
    }
    return <AlertTriangle className="h-5 w-5 text-amber-600" />;
  };

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                {getStatusIcon()}
                Batch Complete
              </CardTitle>
              <CardDescription>
                {completedCount} of {images.length} images staged successfully
                {failedCount > 0 && ` (${failedCount} failed)`}
              </CardDescription>
            </div>
            {completedCount > 0 && (
              <Button onClick={onDownloadAll}>
                <FolderDown className="mr-2 h-4 w-4" />
                Download All ({completedCount})
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {images.map((image) => (
              <BatchImageCard
                key={image.id}
                image={image}
                mode="results"
                onDownload={() => onDownloadSingle(image)}
              />
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-center">
        <Button onClick={onReset}>
          <RotateCcw className="mr-2 h-4 w-4" />
          Stage Another Batch
        </Button>
      </div>
    </>
  );
}
