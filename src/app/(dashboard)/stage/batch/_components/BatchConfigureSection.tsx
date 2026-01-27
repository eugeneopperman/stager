"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BatchImageCard } from "@/components/staging/BatchImageCard";
import { StyleSelector } from "@/components/staging/StyleSelector";
import { PropertySelector } from "@/components/staging/PropertySelector";
import type { Property } from "@/lib/database.types";
import type { FurnitureStyle, RoomType } from "@/lib/constants";
import { Building2, Sparkles } from "lucide-react";
import type { BatchImageData } from "../_hooks/useBatchProcessing";

interface BatchConfigureSectionProps {
  images: BatchImageData[];
  style: FurnitureStyle | null;
  propertyId: string | null;
  selectedProperty: Property | null;
  requiredCredits: number;
  hasEnoughCredits: boolean;
  onRoomTypeChange: (id: string, roomType: RoomType) => void;
  onStyleChange: (style: FurnitureStyle | null) => void;
  onPropertyChange: (id: string | null, property?: Property) => void;
  onBack: () => void;
  onStart: () => void;
}

export function BatchConfigureSection({
  images,
  style,
  propertyId,
  selectedProperty,
  requiredCredits,
  hasEnoughCredits,
  onRoomTypeChange,
  onStyleChange,
  onPropertyChange,
  onBack,
  onStart,
}: BatchConfigureSectionProps) {
  const allConfigured = images.every((img) => img.roomType !== null) && style !== null;

  return (
    <>
      {/* Property Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Assign to Property
          </CardTitle>
          <CardDescription>
            Optionally assign all staged photos to a property
          </CardDescription>
        </CardHeader>
        <CardContent>
          <PropertySelector
            value={propertyId}
            onChange={(id, property) => {
              onPropertyChange(id, property || undefined);
            }}
          />
          {selectedProperty && (
            <p className="mt-2 text-sm text-slate-500">
              All staged photos will be linked to: {selectedProperty.address}
            </p>
          )}
        </CardContent>
      </Card>

      {/* Room Types Configuration */}
      <Card data-tour="batch-room-types">
        <CardHeader>
          <CardTitle>Configure Room Types</CardTitle>
          <CardDescription>
            Select the room type for each photo
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {images.map((image) => (
              <BatchImageCard
                key={image.id}
                image={image}
                mode="configure"
                onRoomTypeChange={(roomType) => onRoomTypeChange(image.id, roomType)}
              />
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Style Selection */}
      <Card data-tour="batch-style">
        <CardHeader>
          <CardTitle>Choose Furniture Style</CardTitle>
          <CardDescription>
            This style will be applied to all photos
          </CardDescription>
        </CardHeader>
        <CardContent>
          <StyleSelector value={style} onChange={onStyleChange} />
        </CardContent>
      </Card>

      {/* Action Card */}
      <Card className="bg-gradient-to-r from-blue-600 to-blue-700 border-0" data-tour="batch-credits">
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-white text-center sm:text-left">
              <h3 className="font-semibold">Ready to stage {images.length} photos?</h3>
              <p className="text-blue-100 text-sm">
                This will use {requiredCredits} credit{requiredCredits !== 1 ? "s" : ""} from your account
                {selectedProperty && ` • Assigned to ${selectedProperty.address}`}
              </p>
            </div>
            <div className="flex gap-2">
              <Button variant="secondary" onClick={onBack}>
                Back
              </Button>
              <Button
                variant="secondary"
                onClick={onStart}
                disabled={!allConfigured || !hasEnoughCredits}
                data-tour="batch-process"
              >
                <Sparkles className="mr-2 h-5 w-5" />
                Start Staging
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </>
  );
}
