"use client";

import { forwardRef } from "react";
import { type LucideIcon, Loader2 } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ActionButtonProps {
  icon: LucideIcon;
  tooltip: string;
  onClick?: (e: React.MouseEvent) => void;
  disabled?: boolean;
  loading?: boolean;
  active?: boolean;
  variant?: "default" | "destructive" | "ghost" | "outline";
  size?: "default" | "sm" | "lg" | "icon";
  className?: string;
  iconClassName?: string;
}

/**
 * ActionButton - A button with an icon and tooltip
 * Used throughout the app for action buttons in cards and toolbars
 */
export const ActionButton = forwardRef<HTMLButtonElement, ActionButtonProps>(
  (
    {
      icon: Icon,
      tooltip,
      onClick,
      disabled,
      loading,
      active,
      variant = "ghost",
      size = "sm",
      className,
      iconClassName,
    },
    ref
  ) => {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            ref={ref}
            variant={variant}
            size={size}
            onClick={onClick}
            disabled={disabled || loading}
            className={cn(
              "h-8 w-8 p-0",
              active && "bg-accent",
              className
            )}
          >
            {loading ? (
              <Loader2 className={cn("h-4 w-4 animate-spin", iconClassName)} />
            ) : (
              <Icon className={cn("h-4 w-4", iconClassName)} />
            )}
          </Button>
        </TooltipTrigger>
        <TooltipContent>{tooltip}</TooltipContent>
      </Tooltip>
    );
  }
);

ActionButton.displayName = "ActionButton";

/**
 * HoverActionButton - A round button optimized for hover action bars
 * Has a smaller size and white text on dark backgrounds
 */
interface HoverActionButtonProps {
  icon: LucideIcon;
  tooltip: string;
  onClick?: (e: React.MouseEvent) => void;
  disabled?: boolean;
  loading?: boolean;
  active?: boolean;
  destructive?: boolean;
  className?: string;
  iconClassName?: string;
}

export const HoverActionButton = forwardRef<HTMLButtonElement, HoverActionButtonProps>(
  (
    {
      icon: Icon,
      tooltip,
      onClick,
      disabled,
      loading,
      active,
      destructive,
      className,
      iconClassName,
    },
    ref
  ) => {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            ref={ref}
            onClick={onClick}
            disabled={disabled || loading}
            className={cn(
              "p-1.5 rounded-full transition-colors",
              "hover:bg-white/20 text-white",
              active && "bg-white/20",
              destructive && "hover:bg-red-500/50",
              disabled && "opacity-50 cursor-not-allowed",
              className
            )}
          >
            {loading ? (
              <Loader2 className={cn("h-4 w-4 animate-spin", iconClassName)} />
            ) : (
              <Icon className={cn("h-4 w-4", iconClassName)} />
            )}
          </button>
        </TooltipTrigger>
        <TooltipContent>{tooltip}</TooltipContent>
      </Tooltip>
    );
  }
);

HoverActionButton.displayName = "HoverActionButton";
