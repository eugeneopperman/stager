"use client";

import { cn } from "@/lib/utils";
import { FURNITURE_STYLES, type FurnitureStyle } from "@/lib/constants";
import { Check } from "lucide-react";

const MAX_STYLES = 3;

interface MultiStyleSelectorProps {
  value: FurnitureStyle[];
  onChange: (value: FurnitureStyle[]) => void;
  disabled?: boolean;
  maxStyles?: number;
}

export function MultiStyleSelector({
  value,
  onChange,
  disabled = false,
  maxStyles = MAX_STYLES,
}: MultiStyleSelectorProps) {
  const handleToggle = (styleId: FurnitureStyle) => {
    if (value.includes(styleId)) {
      // Remove style
      onChange(value.filter((s) => s !== styleId));
    } else if (value.length < maxStyles) {
      // Add style
      onChange([...value, styleId]);
    }
  };

  const isMaxSelected = value.length >= maxStyles;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
          Furniture Styles
        </label>
        <span className="text-sm text-slate-500">
          {value.length} of {maxStyles} selected
        </span>
      </div>
      <p className="text-xs text-slate-500">
        Select up to {maxStyles} styles to generate variations
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {FURNITURE_STYLES.map((style) => {
          const isSelected = value.includes(style.id);
          const isDisabled = disabled || (isMaxSelected && !isSelected);

          return (
            <button
              key={style.id}
              type="button"
              onClick={() => handleToggle(style.id)}
              disabled={isDisabled}
              className={cn(
                "relative flex flex-col items-start gap-1 p-4 rounded-lg border-2 transition-all text-left",
                isSelected
                  ? "border-blue-600 bg-blue-50 dark:bg-blue-950/50"
                  : "border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600",
                isDisabled && !isSelected && "opacity-50 cursor-not-allowed"
              )}
            >
              {isSelected && (
                <div className="absolute top-2 right-2 h-5 w-5 rounded-full bg-blue-600 flex items-center justify-center">
                  <Check className="h-3 w-3 text-white" />
                </div>
              )}
              <span
                className={cn(
                  "font-medium",
                  isSelected
                    ? "text-blue-700 dark:text-blue-400"
                    : "text-slate-700 dark:text-slate-300"
                )}
              >
                {style.label}
              </span>
              <span className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2">
                {style.description}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
