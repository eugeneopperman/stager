"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";
import { Loader2 } from "lucide-react";

interface CreditAllocationSliderProps {
  currentAllocation: number;
  usedCredits: number;
  maxCredits: number;
  isLoading?: boolean;
  onSave: (credits: number) => void;
  onCancel: () => void;
}

export function CreditAllocationSlider({
  currentAllocation,
  usedCredits,
  maxCredits,
  isLoading,
  onSave,
  onCancel,
}: CreditAllocationSliderProps) {
  const [credits, setCredits] = useState(currentAllocation);
  const minCredits = usedCredits; // Can't go below used credits

  const handleSliderChange = (value: number[]) => {
    setCredits(value[0]);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value, 10);
    if (!isNaN(value)) {
      setCredits(Math.max(minCredits, Math.min(maxCredits, value)));
    }
  };

  const hasChanged = credits !== currentAllocation;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">Allocate Credits</span>
        <div className="flex items-center gap-2">
          <Input
            type="number"
            value={credits}
            onChange={handleInputChange}
            min={minCredits}
            max={maxCredits}
            className="w-20 h-8 text-center"
          />
          <span className="text-sm text-muted-foreground">/ {maxCredits}</span>
        </div>
      </div>

      <Slider
        value={[credits]}
        onValueChange={handleSliderChange}
        min={minCredits}
        max={maxCredits}
        step={1}
        className="w-full"
      />

      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>Min: {minCredits} (already used)</span>
        <span>Available: {maxCredits}</span>
      </div>

      <div className="flex justify-end gap-2">
        <Button variant="outline" size="sm" onClick={onCancel} disabled={isLoading}>
          Cancel
        </Button>
        <Button
          size="sm"
          onClick={() => onSave(credits)}
          disabled={!hasChanged || isLoading}
        >
          {isLoading ? (
            <>
              <Loader2 className="h-4 w-4 mr-1 animate-spin" />
              Saving...
            </>
          ) : (
            "Save"
          )}
        </Button>
      </div>
    </div>
  );
}
