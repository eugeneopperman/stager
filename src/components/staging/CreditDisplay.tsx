"use client";

import { cn } from "@/lib/utils";
import { CreditCard, AlertTriangle } from "lucide-react";
import { LOW_CREDITS_THRESHOLD } from "@/lib/constants";

interface CreditDisplayProps {
  credits: number;
  creditsToUse: number;
  className?: string;
}

export function CreditDisplay({
  credits,
  creditsToUse,
  className,
}: CreditDisplayProps) {
  const hasEnoughCredits = credits >= creditsToUse;
  const isLowCredits = credits <= LOW_CREDITS_THRESHOLD;
  const percentUsed = creditsToUse > 0 ? Math.min((creditsToUse / credits) * 100, 100) : 0;

  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex items-center justify-between text-sm">
        <div className="flex items-center gap-1.5">
          {!hasEnoughCredits ? (
            <AlertTriangle className="h-3.5 w-3.5 text-destructive" />
          ) : isLowCredits ? (
            <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />
          ) : (
            <CreditCard className="h-3.5 w-3.5 text-muted-foreground" />
          )}
          <span className={cn(
            "font-medium",
            !hasEnoughCredits && "text-destructive",
            hasEnoughCredits && isLowCredits && "text-amber-600 dark:text-amber-500"
          )}>
            {credits} credits
          </span>
        </div>
        {creditsToUse > 0 && (
          <span className={cn(
            "text-xs",
            !hasEnoughCredits ? "text-destructive" : "text-muted-foreground"
          )}>
            {hasEnoughCredits
              ? `Using ${creditsToUse} credit${creditsToUse !== 1 ? "s" : ""}`
              : `Need ${creditsToUse}, have ${credits}`}
          </span>
        )}
      </div>

      {/* Progress bar */}
      <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
        <div
          className={cn(
            "h-full rounded-full transition-all duration-300",
            !hasEnoughCredits
              ? "bg-destructive"
              : isLowCredits
              ? "bg-amber-500"
              : "bg-primary"
          )}
          style={{ width: `${100 - percentUsed}%` }}
        />
      </div>
    </div>
  );
}
