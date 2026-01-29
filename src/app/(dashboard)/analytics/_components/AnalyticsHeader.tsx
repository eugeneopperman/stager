"use client";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { PeriodOption } from "@/lib/analytics/types";

interface AnalyticsHeaderProps {
  selectedPeriod: PeriodOption;
  onPeriodChange: (period: PeriodOption) => void;
}

export function AnalyticsHeader({ selectedPeriod, onPeriodChange }: AnalyticsHeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h1 className="text-foreground">Analytics</h1>
        <p className="text-muted-foreground mt-2">
          Understand your staging patterns and usage trends
        </p>
      </div>
      <div className="flex items-center gap-2 bg-card/60 backdrop-blur-sm rounded-lg p-1 border border-border/50">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onPeriodChange(7)}
          className={cn(
            "px-4",
            selectedPeriod === 7 &&
              "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground"
          )}
        >
          7 days
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onPeriodChange(30)}
          className={cn(
            "px-4",
            selectedPeriod === 30 &&
              "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground"
          )}
        >
          30 days
        </Button>
      </div>
    </div>
  );
}
