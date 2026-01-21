"use client";

import { forwardRef } from "react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { RefreshCw, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface RemixButtonProps {
  variant?: "icon" | "button" | "menuItem";
  onClick: () => void;
  disabled?: boolean;
  isLoading?: boolean;
  className?: string;
}

export const RemixButton = forwardRef<HTMLButtonElement, RemixButtonProps>(
  function RemixButton(
    { variant = "icon", onClick, disabled = false, isLoading = false, className },
    ref
  ) {
    if (variant === "icon") {
      return (
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              ref={ref}
              onClick={onClick}
              disabled={disabled || isLoading}
              className={cn(
                "p-1.5 rounded-full transition-colors",
                "hover:bg-white/20 text-white",
                disabled && "opacity-50 cursor-not-allowed",
                className
              )}
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
            </button>
          </TooltipTrigger>
          <TooltipContent>Remix with Different Style</TooltipContent>
        </Tooltip>
      );
    }

    if (variant === "button") {
      return (
        <Button
          ref={ref}
          onClick={onClick}
          disabled={disabled || isLoading}
          variant="outline"
          className={className}
        >
          {isLoading ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <RefreshCw className="h-4 w-4 mr-2" />
          )}
          Remix
        </Button>
      );
    }

    // menuItem variant - for use in dropdown menus
    return (
      <button
        ref={ref}
        onClick={onClick}
        disabled={disabled || isLoading}
        className={cn(
          "flex items-center w-full px-2 py-1.5 text-sm",
          "hover:bg-accent hover:text-accent-foreground",
          "cursor-pointer rounded-sm",
          disabled && "opacity-50 cursor-not-allowed",
          className
        )}
      >
        {isLoading ? (
          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
        ) : (
          <RefreshCw className="h-4 w-4 mr-2" />
        )}
        Remix with Different Style
      </button>
    );
  }
);
