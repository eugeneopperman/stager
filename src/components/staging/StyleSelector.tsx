"use client";

import { cn } from "@/lib/utils";
import { FURNITURE_STYLES, type FurnitureStyle } from "@/lib/constants";
import { Check } from "lucide-react";

interface StyleSelectorProps {
  value: FurnitureStyle | null;
  onChange: (value: FurnitureStyle) => void;
  disabled?: boolean;
}

export function StyleSelector({
  value,
  onChange,
  disabled = false,
}: StyleSelectorProps) {
  return (
    <div className="space-y-3">
      <label className="text-sm font-medium text-foreground">
        Furniture Style
      </label>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {FURNITURE_STYLES.map((style) => {
          const isSelected = value === style.id;

          return (
            <button
              key={style.id}
              type="button"
              onClick={() => onChange(style.id)}
              disabled={disabled}
              className={cn(
                "relative flex flex-col items-start gap-1.5 p-4 rounded-xl text-left",
                // Border
                "border-2",
                // Transitions
                "transition-all duration-200 ease-out",
                // Hover/Press effects
                "hover:scale-[1.02] active:scale-[0.98]",
                // States
                isSelected
                  ? "border-primary bg-primary/5 dark:bg-primary/10 shadow-md shadow-primary/10"
                  : "border-border/60 dark:border-white/10 hover:border-border hover:bg-accent/30 dark:hover:bg-white/5",
                disabled && "opacity-50 cursor-not-allowed hover:scale-100 active:scale-100"
              )}
            >
              {isSelected && (
                <div className={cn(
                  "absolute top-2.5 right-2.5 h-5 w-5 rounded-full flex items-center justify-center",
                  "bg-primary shadow-sm",
                  "animate-in zoom-in-50 duration-200"
                )}>
                  <Check className="h-3 w-3 text-primary-foreground" />
                </div>
              )}
              <span
                className={cn(
                  "font-medium",
                  isSelected
                    ? "text-primary"
                    : "text-foreground"
                )}
              >
                {style.label}
              </span>
              <span className="text-xs text-muted-foreground line-clamp-2">
                {style.description}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
