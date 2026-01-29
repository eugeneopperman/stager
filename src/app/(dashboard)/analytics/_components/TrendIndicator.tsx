"use client";

import { cn } from "@/lib/utils";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

interface TrendIndicatorProps {
  value: number;
  className?: string;
  showIcon?: boolean;
}

export function TrendIndicator({ value, className, showIcon = true }: TrendIndicatorProps) {
  const isPositive = value > 0;
  const isNegative = value < 0;
  const isNeutral = value === 0;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 text-sm font-medium",
        isPositive && "text-emerald-600 dark:text-emerald-400",
        isNegative && "text-red-600 dark:text-red-400",
        isNeutral && "text-muted-foreground",
        className
      )}
    >
      {showIcon && (
        <>
          {isPositive && <TrendingUp className="h-3.5 w-3.5" />}
          {isNegative && <TrendingDown className="h-3.5 w-3.5" />}
          {isNeutral && <Minus className="h-3.5 w-3.5" />}
        </>
      )}
      {isPositive && "+"}
      {value}%
    </span>
  );
}
