"use client";

import { useState } from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { FURNITURE_STYLES, type FurnitureStyle } from "@/lib/constants";
import { Check, ImageIcon } from "lucide-react";

const MAX_STYLES = 3;

interface StyleGalleryProps {
  value: FurnitureStyle[];
  onChange: (value: FurnitureStyle[]) => void;
  disabled?: boolean;
  maxStyles?: number;
}

export function StyleGallery({
  value,
  onChange,
  disabled = false,
  maxStyles = MAX_STYLES,
}: StyleGalleryProps) {
  const [imageErrors, setImageErrors] = useState<Record<string, boolean>>({});

  const handleToggle = (styleId: FurnitureStyle) => {
    if (disabled) return;

    if (value.includes(styleId)) {
      onChange(value.filter((s) => s !== styleId));
    } else if (value.length < maxStyles) {
      onChange([...value, styleId]);
    }
  };

  const isMaxSelected = value.length >= maxStyles;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium text-foreground">
          Furniture Styles
        </label>
        <span className="text-xs text-muted-foreground">
          {value.length}/{maxStyles} selected
        </span>
      </div>

      <div className="grid grid-cols-3 gap-2">
        {FURNITURE_STYLES.map((style) => {
          const isSelected = value.includes(style.id);
          const isDisabled = disabled || (isMaxSelected && !isSelected);
          const hasImageError = imageErrors[style.id];

          return (
            <button
              key={style.id}
              type="button"
              onClick={() => handleToggle(style.id)}
              disabled={isDisabled}
              className={cn(
                "group relative flex flex-col overflow-hidden rounded-lg",
                "border-2 transition-all duration-200",
                "focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2",
                isSelected
                  ? "border-primary ring-1 ring-primary shadow-md"
                  : "border-border/50 hover:border-border",
                isDisabled && !isSelected && "opacity-40 cursor-not-allowed"
              )}
            >
              {/* Image container */}
              <div className="relative aspect-[4/3] w-full bg-muted overflow-hidden">
                {!hasImageError ? (
                  <Image
                    src={style.image}
                    alt={style.label}
                    fill
                    sizes="(max-width: 768px) 33vw, 150px"
                    className={cn(
                      "object-cover transition-transform duration-300",
                      !isDisabled && "group-hover:scale-105"
                    )}
                    onError={() => setImageErrors((prev) => ({ ...prev, [style.id]: true }))}
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center bg-muted">
                    <ImageIcon className="h-8 w-8 text-muted-foreground/50" />
                  </div>
                )}

                {/* Selection indicator */}
                {isSelected && (
                  <div className="absolute top-1.5 right-1.5 h-5 w-5 rounded-full bg-primary flex items-center justify-center shadow-sm">
                    <Check className="h-3 w-3 text-primary-foreground" />
                  </div>
                )}

                {/* Hover overlay */}
                <div
                  className={cn(
                    "absolute inset-0 bg-black/0 transition-colors duration-200",
                    !isDisabled && "group-hover:bg-black/10",
                    isSelected && "bg-primary/10"
                  )}
                />
              </div>

              {/* Label */}
              <div className={cn(
                "px-2 py-1.5 text-center transition-colors",
                isSelected
                  ? "bg-primary/10 dark:bg-primary/20"
                  : "bg-card"
              )}>
                <span
                  className={cn(
                    "text-xs font-medium leading-tight",
                    isSelected ? "text-primary" : "text-foreground"
                  )}
                >
                  {style.label}
                </span>
              </div>
            </button>
          );
        })}
      </div>

      <p className="text-xs text-muted-foreground">
        Select up to {maxStyles} styles to generate variations
      </p>
    </div>
  );
}
