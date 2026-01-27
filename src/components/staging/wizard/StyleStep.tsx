"use client";

import Image from "next/image";
import { Card, CardContent } from "@/components/ui/card";
import { RoomTypeDropdown } from "@/components/staging/RoomTypeDropdown";
import { StyleGallery } from "@/components/staging/StyleGallery";
import { WizardNavigation } from "./WizardNavigation";
import { cn } from "@/lib/utils";
import { type RoomType, type FurnitureStyle } from "@/lib/constants";

interface StyleStepProps {
  preview: string;
  roomType: RoomType | null;
  onRoomTypeChange: (value: RoomType) => void;
  styles: FurnitureStyle[];
  onStylesChange: (value: FurnitureStyle[]) => void;
  onBack: () => void;
  onNext: () => void;
  disabled?: boolean;
}

export function StyleStep({
  preview,
  roomType,
  onRoomTypeChange,
  styles,
  onStylesChange,
  onBack,
  onNext,
  disabled = false,
}: StyleStepProps) {
  const canProceed = roomType !== null && styles.length > 0;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Image preview */}
        <div className="lg:col-span-2">
          <Card className="overflow-hidden">
            <CardContent className="p-0">
              <div className="relative aspect-video bg-muted">
                <Image
                  src={preview}
                  alt="Room to stage"
                  fill
                  className="object-contain"
                  unoptimized
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right: Configuration */}
        <div className="space-y-5">
          {/* Room Type */}
          <div className="space-y-2" data-tour="stage-room-type">
            <label className="text-sm font-medium text-foreground">
              Room Type
            </label>
            <RoomTypeDropdown
              value={roomType}
              onChange={onRoomTypeChange}
              disabled={disabled}
            />
            <p className="text-xs text-muted-foreground">
              Help the AI understand the room layout
            </p>
          </div>

          {/* Style Gallery */}
          <div data-tour="stage-styles">
            <StyleGallery
              value={styles}
              onChange={onStylesChange}
              disabled={disabled}
            />
          </div>

          {/* Selection summary */}
          {roomType && styles.length > 0 && (
            <div className={cn(
              "p-3 rounded-lg bg-primary/5 border border-primary/20",
              "text-sm text-foreground"
            )}>
              <p>
                <span className="font-medium">{styles.length}</span> style
                {styles.length !== 1 ? "s" : ""} selected for your{" "}
                <span className="font-medium lowercase">{roomType.replace("-", " ")}</span>
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Navigation */}
      <WizardNavigation
        onBack={onBack}
        onNext={onNext}
        nextLabel="Continue"
        nextDisabled={!canProceed}
      />

      {/* Validation hint */}
      {!canProceed && (
        <p className="text-xs text-center text-muted-foreground">
          {!roomType
            ? "Select a room type to continue"
            : "Select at least one furniture style"}
        </p>
      )}
    </div>
  );
}
