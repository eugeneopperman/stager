"use client";

import { memo } from "react";
import { Button } from "@/components/ui/button";
import { RotateCcw } from "lucide-react";

interface MaskingToolActionsProps {
  hasMask: boolean;
  disabled: boolean;
  onClear: () => void;
  onCancel: () => void;
  onApply: () => void;
}

export const MaskingToolActions = memo(function MaskingToolActions({
  hasMask,
  disabled,
  onClear,
  onCancel,
  onApply,
}: MaskingToolActionsProps) {
  return (
    <div className="flex gap-2 pt-2 border-t">
      <Button
        variant="ghost"
        size="sm"
        onClick={onClear}
        disabled={disabled || !hasMask}
        className="gap-1"
      >
        <RotateCcw className="h-3 w-3" />
        Clear
      </Button>
      <div className="flex-1" />
      <Button variant="outline" size="sm" onClick={onCancel} disabled={disabled}>
        Cancel
      </Button>
      <Button size="sm" onClick={onApply} disabled={disabled || !hasMask}>
        Apply Mask
      </Button>
    </div>
  );
});
