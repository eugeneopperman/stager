"use client";

import Image from "next/image";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PropertySelector } from "@/components/staging/PropertySelector";
import { CreditDisplay } from "@/components/staging/CreditDisplay";
import { WizardNavigation } from "./WizardNavigation";
import {
  type RoomType,
  type FurnitureStyle,
  FURNITURE_STYLES,
  ROOM_TYPES,
  CREDITS_PER_STAGING,
  STAGING_TIME_ESTIMATE,
} from "@/lib/constants";
import { Sparkles, Clock, Check } from "lucide-react";

interface GenerateStepProps {
  preview: string;
  roomType: RoomType;
  styles: FurnitureStyle[];
  propertyId: string | null;
  onPropertyChange: (id: string | null) => void;
  credits: number;
  onBack: () => void;
  onGenerate: () => void;
  disabled?: boolean;
}

export function GenerateStep({
  preview,
  roomType,
  styles,
  propertyId,
  onPropertyChange,
  credits,
  onBack,
  onGenerate,
  disabled = false,
}: GenerateStepProps) {
  const requiredCredits = styles.length * CREDITS_PER_STAGING;
  const hasEnoughCredits = credits >= requiredCredits;

  const roomLabel = ROOM_TYPES.find((r) => r.id === roomType)?.label || roomType;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Final preview */}
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
                {/* Preview overlay showing selection */}
                <div className="absolute bottom-4 left-4 right-4 flex gap-2 flex-wrap">
                  <div className="px-3 py-1.5 bg-black/70 backdrop-blur-sm rounded-lg text-white text-sm">
                    {roomLabel}
                  </div>
                  {styles.map((style) => (
                    <div
                      key={style}
                      className="px-3 py-1.5 bg-primary/90 backdrop-blur-sm rounded-lg text-primary-foreground text-sm flex items-center gap-1.5"
                    >
                      <Check className="h-3 w-3" />
                      {FURNITURE_STYLES.find((s) => s.id === style)?.label}
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right: Summary and generate */}
        <div className="space-y-5">
          {/* Summary card */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Ready to Generate</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Room type */}
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Room Type</span>
                <span className="font-medium">{roomLabel}</span>
              </div>

              {/* Styles */}
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Styles</span>
                <span className="font-medium">{styles.length} selected</span>
              </div>

              {/* Time estimate */}
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground flex items-center gap-1.5">
                  <Clock className="h-3.5 w-3.5" />
                  Estimated time
                </span>
                <span className="font-medium">
                  {styles.length > 1
                    ? `${styles.length} × ${STAGING_TIME_ESTIMATE}`
                    : STAGING_TIME_ESTIMATE}
                </span>
              </div>

              <div className="border-t pt-4">
                <CreditDisplay
                  credits={credits}
                  creditsToUse={requiredCredits}
                />
              </div>
            </CardContent>
          </Card>

          {/* Property selector (optional) */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">
              Property{" "}
              <span className="text-muted-foreground font-normal">(optional)</span>
            </label>
            <PropertySelector
              value={propertyId}
              onChange={onPropertyChange}
              disabled={disabled}
            />
          </div>

          {/* Generate button */}
          <Button
            size="lg"
            className="w-full gap-2"
            onClick={onGenerate}
            disabled={disabled || !hasEnoughCredits}
          >
            <Sparkles className="h-5 w-5" />
            {!hasEnoughCredits
              ? "Insufficient Credits"
              : `Generate ${styles.length} Variation${styles.length !== 1 ? "s" : ""}`}
          </Button>

          {!hasEnoughCredits && (
            <p className="text-xs text-center text-destructive">
              You need {requiredCredits} credits but only have {credits}
            </p>
          )}
        </div>
      </div>

      {/* Navigation - Back only, Generate button above handles proceed */}
      <WizardNavigation onBack={onBack} showBack={true} />
    </div>
  );
}
