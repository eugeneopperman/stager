"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";
import { AlertTriangle, Coins } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { LOW_CREDITS_THRESHOLD } from "@/lib/constants";

interface SidebarCreditsProps {
  credits: number;
  isCollapsed: boolean;
  onNavigate?: () => void;
}

export function SidebarCredits({ credits, isCollapsed, onNavigate }: SidebarCreditsProps) {
  const isLow = credits <= LOW_CREDITS_THRESHOLD;

  if (isCollapsed) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <Link
            href="/billing"
            onClick={onNavigate}
            data-tour="credits"
            className={cn(
              "flex flex-col items-center justify-center rounded-2xl p-2 relative overflow-hidden",
              "transition-all duration-300 ease-out",
              isLow
                ? "bg-gradient-to-br from-amber-500/90 to-orange-600/90"
                : "bg-gradient-to-br from-primary/90 to-violet-600/90",
              isLow
                ? "shadow-md shadow-amber-500/25"
                : "shadow-md shadow-primary/25"
            )}
          >
            <div className="absolute inset-0 bg-gradient-to-tr from-white/0 via-white/10 to-white/0" />
            <div className="relative flex flex-col items-center">
              {isLow ? (
                <AlertTriangle className="h-5 w-5 text-amber-100 animate-pulse" />
              ) : (
                <Coins className="h-5 w-5 text-blue-100" />
              )}
              <span className="text-xs font-bold text-white mt-1">{credits}</span>
            </div>
          </Link>
        </TooltipTrigger>
        <TooltipContent side="right">
          <p>{credits} credits available</p>
        </TooltipContent>
      </Tooltip>
    );
  }

  return (
    <div
      data-tour="credits"
      className={cn(
        "rounded-2xl p-4 relative overflow-hidden",
        "transition-all duration-300 ease-out",
        isLow
          ? "bg-gradient-to-br from-amber-500/90 to-orange-600/90"
          : "bg-gradient-to-br from-primary/90 to-violet-600/90",
        isLow
          ? "shadow-lg shadow-amber-500/25"
          : "shadow-lg shadow-primary/25"
      )}
    >
      <div className="absolute inset-0 bg-gradient-to-tr from-white/0 via-white/10 to-white/0" />
      <div className="relative">
        <div className="flex items-center gap-2">
          {isLow && (
            <AlertTriangle className="h-4 w-4 text-amber-100 animate-pulse" />
          )}
          <p
            className={cn(
              "text-xs font-medium",
              isLow ? "text-amber-100" : "text-blue-100"
            )}
          >
            {isLow ? "Low Credits" : "Available Credits"}
          </p>
        </div>
        <p className="text-2xl font-bold text-white mt-1">{credits}</p>
        <Link
          href="/billing"
          onClick={onNavigate}
          className={cn(
            "mt-2 inline-flex items-center gap-1 text-xs font-medium transition-all duration-200",
            "hover:gap-2",
            isLow
              ? "text-amber-100 hover:text-white"
              : "text-blue-100 hover:text-white"
          )}
        >
          {isLow ? "Buy more credits" : "Get more credits"}
          <span className="transition-transform duration-200">→</span>
        </Link>
      </div>
    </div>
  );
}
