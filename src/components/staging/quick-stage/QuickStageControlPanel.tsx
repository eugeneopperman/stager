"use client";

import { memo } from "react";
import { Button } from "@/components/ui/button";
import { RoomTypeDropdown } from "@/components/staging/RoomTypeDropdown";
import { StyleGallery } from "@/components/staging/StyleGallery";
import { PropertySelector } from "@/components/staging/PropertySelector";
import { CreditDisplay } from "@/components/staging/CreditDisplay";
import { Sparkles } from "lucide-react";
import type { RoomType, FurnitureStyle } from "@/lib/constants";

interface QuickStageControlPanelProps {
  roomType: RoomType | null;
  styles: FurnitureStyle[];
  propertyId: string | null;
  credits: number;
  requiredCredits: number;
  hasEnoughCredits: boolean;
  canStage: boolean;
  isProcessing: boolean;
  selectedFile: File | null;
  onRoomTypeChange: (roomType: RoomType | null) => void;
  onStylesChange: (styles: FurnitureStyle[]) => void;
  onPropertyChange: (id: string | null) => void;
  onStage: () => void;
}

export const QuickStageControlPanel = memo(function QuickStageControlPanel({
  roomType,
  styles,
  propertyId,
  credits,
  requiredCredits,
  hasEnoughCredits,
  canStage,
  isProcessing,
  selectedFile,
  onRoomTypeChange,
  onStylesChange,
  onPropertyChange,
  onStage,
}: QuickStageControlPanelProps) {
  const getButtonText = () => {
    if (styles.length === 0) return "Select a Style";
    if (!selectedFile) return "Upload an Image";
    if (!roomType) return "Select Room Type";
    if (!hasEnoughCredits) return "Insufficient Credits";
    return `Generate ${styles.length} Variation${styles.length !== 1 ? "s" : ""}`;
  };

  return (
    <div className="space-y-5">
      {/* Room Type */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-foreground">Room Type</label>
        <RoomTypeDropdown
          value={roomType}
          onChange={onRoomTypeChange}
          disabled={isProcessing}
        />
      </div>

      {/* Style Gallery */}
      <StyleGallery
        value={styles}
        onChange={onStylesChange}
        disabled={isProcessing}
      />

      {/* Property Selector */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-foreground">
          Property{" "}
          <span className="text-muted-foreground font-normal">(optional)</span>
        </label>
        <PropertySelector
          value={propertyId}
          onChange={(id) => onPropertyChange(id)}
          disabled={isProcessing}
        />
      </div>

      {/* Credit Display */}
      <CreditDisplay credits={credits} creditsToUse={requiredCredits} />

      {/* Generate Button */}
      <Button size="lg" className="w-full" onClick={onStage} disabled={!canStage}>
        <Sparkles className="mr-2 h-5 w-5" />
        {getButtonText()}
      </Button>

      {/* Quick tip */}
      {selectedFile && roomType && styles.length === 0 && (
        <p className="text-xs text-center text-muted-foreground">
          Select 1-3 furniture styles above to continue
        </p>
      )}
    </div>
  );
});
