"use client";

import { memo } from "react";
import { Button } from "@/components/ui/button";
import { RotateCcw } from "lucide-react";

interface CropRotateActionsProps {
  hasChanges: boolean;
  disabled: boolean;
  onReset: () => void;
  onCancel: () => void;
  onApply: () => void;
}

export const CropRotateActions = memo(function CropRotateActions({
  hasChanges,
  disabled,
  onReset,
  onCancel,
  onApply,
}: CropRotateActionsProps) {
  return (
    <div className="flex gap-2 pt-2 border-t">
      <Button
        variant="ghost"
        size="sm"
        onClick={onReset}
        disabled={disabled || !hasChanges}
        className="gap-1"
      >
        <RotateCcw className="h-3 w-3" />
        Reset
      </Button>
      <div className="flex-1" />
      <Button variant="outline" size="sm" onClick={onCancel} disabled={disabled}>
        Cancel
      </Button>
      <Button size="sm" onClick={onApply} disabled={disabled}>
        Apply
      </Button>
    </div>
  );
});
