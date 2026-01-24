"use client";

import { Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

interface SidebarLogoProps {
  isCollapsed: boolean;
}

export function SidebarLogo({ isCollapsed }: SidebarLogoProps) {
  return (
    <div
      className={cn(
        "flex h-16 items-center border-b border-border/50 dark:border-white/[0.08]",
        isCollapsed ? "justify-center px-2" : "gap-3 px-6"
      )}
    >
      <div className="relative shrink-0">
        <Sparkles className="h-7 w-7 text-primary" />
        <div className="absolute inset-0 blur-md bg-primary/30 -z-10" />
      </div>
      {!isCollapsed && (
        <span className="text-xl font-bold bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text">
          Stager
        </span>
      )}
    </div>
  );
}
