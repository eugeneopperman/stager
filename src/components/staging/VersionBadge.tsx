"use client";

import { cn } from "@/lib/utils";
import { Layers } from "lucide-react";

interface VersionBadgeProps {
  count: number;
  onClick?: (e: React.MouseEvent) => void;
  className?: string;
}

export function VersionBadge({ count, onClick, className }: VersionBadgeProps) {
  if (count <= 1) return null;

  return (
    <button
      onClick={onClick}
      className={cn(
        "flex items-center gap-1 px-1.5 py-0.5 rounded-full",
        "bg-black/70 backdrop-blur-sm",
        "text-white text-[10px] font-medium",
        "transition-all duration-200",
        "hover:bg-black/80 hover:scale-105",
        "focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-1",
        className
      )}
    >
      <Layers className="h-3 w-3" />
      <span>{count}</span>
    </button>
  );
}
