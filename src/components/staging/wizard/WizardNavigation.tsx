"use client";

import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, SkipForward } from "lucide-react";
import { cn } from "@/lib/utils";

interface WizardNavigationProps {
  onBack?: () => void;
  onNext?: () => void;
  onSkip?: () => void;
  showBack?: boolean;
  showSkip?: boolean;
  nextLabel?: string;
  nextDisabled?: boolean;
  isLoading?: boolean;
  className?: string;
}

export function WizardNavigation({
  onBack,
  onNext,
  onSkip,
  showBack = true,
  showSkip = false,
  nextLabel = "Continue",
  nextDisabled = false,
  isLoading = false,
  className,
}: WizardNavigationProps) {
  return (
    <div className={cn("flex items-center justify-between gap-4", className)}>
      {/* Back button */}
      <div className="flex-1">
        {showBack && onBack && (
          <Button
            variant="ghost"
            onClick={onBack}
            disabled={isLoading}
            className="gap-2"
          >
            <ChevronLeft className="h-4 w-4" />
            Back
          </Button>
        )}
      </div>

      {/* Skip and Next buttons */}
      <div className="flex items-center gap-2">
        {showSkip && onSkip && (
          <Button
            variant="ghost"
            onClick={onSkip}
            disabled={isLoading}
            className="gap-2 text-muted-foreground hover:text-foreground"
          >
            Skip
            <SkipForward className="h-4 w-4" />
          </Button>
        )}
        {onNext && (
          <Button
            onClick={onNext}
            disabled={nextDisabled || isLoading}
            className="gap-2 min-w-[120px]"
          >
            {nextLabel}
            <ChevronRight className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
}
