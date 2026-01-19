"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PreprocessingToolbar } from "@/components/staging/preprocessing";
import { WizardNavigation } from "./WizardNavigation";
import { Crop, SunMedium, Eraser, PaintBucket } from "lucide-react";

interface PrepareStepProps {
  imageUrl: string;
  imageFile: File;
  onImageUpdate: (file: File, previewUrl: string) => void;
  onMaskUpdate: (maskDataUrl: string | null) => void;
  onBack: () => void;
  onNext: () => void;
  onSkip: () => void;
  disabled?: boolean;
}

const TOOL_INFO = [
  {
    icon: Crop,
    title: "Crop & Rotate",
    description: "Adjust framing and orientation",
  },
  {
    icon: SunMedium,
    title: "Adjust",
    description: "Fine-tune brightness and contrast",
  },
  {
    icon: Eraser,
    title: "Declutter",
    description: "Remove unwanted objects from the room",
  },
  {
    icon: PaintBucket,
    title: "Mask",
    description: "Define areas for AI staging focus",
  },
];

export function PrepareStep({
  imageUrl,
  imageFile,
  onImageUpdate,
  onMaskUpdate,
  onBack,
  onNext,
  onSkip,
  disabled = false,
}: PrepareStepProps) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Image with preprocessing toolbar */}
        <div className="lg:col-span-2">
          <Card className="overflow-hidden">
            <CardContent className="p-4">
              <PreprocessingToolbar
                imageUrl={imageUrl}
                imageFile={imageFile}
                onImageUpdate={onImageUpdate}
                onMaskUpdate={onMaskUpdate}
                disabled={disabled}
              />
            </CardContent>
          </Card>
        </div>

        {/* Right: Quick Actions explanation */}
        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {TOOL_INFO.map((tool) => (
                <div key={tool.title} className="flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-muted shrink-0">
                    <tool.icon className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">{tool.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {tool.description}
                    </p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <p className="text-sm text-muted-foreground text-center">
            These tools are optional. Skip to proceed with the original image.
          </p>
        </div>
      </div>

      {/* Navigation */}
      <WizardNavigation
        onBack={onBack}
        onNext={onNext}
        onSkip={onSkip}
        showSkip={true}
        nextLabel="Continue"
      />
    </div>
  );
}
