"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type { LucideIcon } from "lucide-react";

interface SidebarNavItemProps {
  name: string;
  href: string;
  icon: LucideIcon;
  isActive: boolean;
  isCollapsed: boolean;
  onNavigate?: () => void;
  tourId?: string;
}

export function SidebarNavItem({
  name,
  href,
  icon: Icon,
  isActive,
  isCollapsed,
  onNavigate,
  tourId,
}: SidebarNavItemProps) {
  const navLink = (
    <Link
      href={href}
      onClick={onNavigate}
      data-tour={tourId}
      className={cn(
        "group relative flex items-center rounded-full py-2.5 text-sm font-medium",
        "transition-all duration-200 ease-out",
        isCollapsed ? "justify-center px-2.5" : "gap-3 px-4",
        isActive
          ? "bg-primary/10 text-primary dark:bg-primary/20"
          : "text-muted-foreground hover:bg-accent/30 hover:text-foreground dark:hover:bg-white/8"
      )}
    >
      <Icon
        className={cn(
          "h-5 w-5 shrink-0 transition-transform duration-200",
          "group-hover:scale-105",
          isActive && "text-primary"
        )}
      />
      {!isCollapsed && <span>{name}</span>}
    </Link>
  );

  if (isCollapsed) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>{navLink}</TooltipTrigger>
        <TooltipContent side="right">{name}</TooltipContent>
      </Tooltip>
    );
  }

  return navLink;
}
