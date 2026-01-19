"use client";

import { cn } from "@/lib/utils";
import { Check, Upload, Wrench, Palette, Sparkles } from "lucide-react";

export type WizardStep = "upload" | "prepare" | "style" | "generate" | "processing" | "complete";

interface Step {
  id: WizardStep;
  label: string;
  icon: React.ElementType;
  number: number;
}

const STEPS: Step[] = [
  { id: "upload", label: "Upload", icon: Upload, number: 1 },
  { id: "prepare", label: "Prepare", icon: Wrench, number: 2 },
  { id: "style", label: "Style", icon: Palette, number: 3 },
  { id: "generate", label: "Generate", icon: Sparkles, number: 4 },
];

interface WizardStepIndicatorProps {
  currentStep: WizardStep;
  className?: string;
}

export function WizardStepIndicator({
  currentStep,
  className,
}: WizardStepIndicatorProps) {
  const getStepIndex = (step: WizardStep): number => {
    if (step === "processing" || step === "complete") return 4;
    return STEPS.findIndex((s) => s.id === step) + 1;
  };

  const currentIndex = getStepIndex(currentStep);

  return (
    <div className={cn("w-full", className)}>
      <div className="flex items-center justify-between">
        {STEPS.map((step, index) => {
          const isCompleted = currentIndex > step.number;
          const isCurrent = currentIndex === step.number;
          const isUpcoming = currentIndex < step.number;

          return (
            <div key={step.id} className="flex items-center flex-1">
              {/* Step indicator */}
              <div className="flex flex-col items-center gap-2">
                <div
                  className={cn(
                    "relative flex h-10 w-10 items-center justify-center rounded-full border-2 transition-all duration-300",
                    isCompleted && "border-primary bg-primary text-primary-foreground",
                    isCurrent && "border-primary bg-primary/10 text-primary ring-4 ring-primary/20",
                    isUpcoming && "border-border bg-muted text-muted-foreground"
                  )}
                >
                  {isCompleted ? (
                    <Check className="h-5 w-5" />
                  ) : (
                    <step.icon className="h-5 w-5" />
                  )}
                </div>
                {/* Label - hidden on mobile, visible on sm+ */}
                <span
                  className={cn(
                    "text-xs font-medium transition-colors hidden sm:block",
                    isCompleted && "text-primary",
                    isCurrent && "text-primary",
                    isUpcoming && "text-muted-foreground"
                  )}
                >
                  {step.label}
                </span>
              </div>

              {/* Connector line (except for last step) */}
              {index < STEPS.length - 1 && (
                <div className="flex-1 px-2 sm:px-4">
                  <div
                    className={cn(
                      "h-0.5 w-full rounded-full transition-colors duration-300",
                      currentIndex > step.number + 1
                        ? "bg-primary"
                        : currentIndex > step.number
                        ? "bg-gradient-to-r from-primary to-border"
                        : "bg-border"
                    )}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
