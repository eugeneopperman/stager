"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { FolderDown } from "lucide-react";
import { BatchDownloadDialog } from "./BatchDownloadDialog";

interface BatchDownloadButtonProps {
  propertyId: string;
  propertyAddress: string;
  imageCount: number;
  variant?: "default" | "outline";
  size?: "default" | "sm" | "lg";
  showCount?: boolean;
}

export function BatchDownloadButton({
  propertyId,
  propertyAddress,
  imageCount,
  variant = "outline",
  size = "default",
  showCount = false,
}: BatchDownloadButtonProps) {
  const [showDialog, setShowDialog] = useState(false);

  return (
    <>
      <Button variant={variant} size={size} onClick={() => setShowDialog(true)}>
        <FolderDown className="mr-2 h-4 w-4" />
        Download All{showCount && ` (${imageCount})`}
      </Button>

      <BatchDownloadDialog
        open={showDialog}
        onOpenChange={setShowDialog}
        propertyId={propertyId}
        propertyAddress={propertyAddress}
        imageCount={imageCount}
      />
    </>
  );
}
