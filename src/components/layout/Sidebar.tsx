"use client";

import { cn } from "@/lib/utils";
import { useSidebar } from "@/contexts/SidebarContext";
import {
  SidebarLogo,
  SidebarNavigation,
  SidebarCredits,
  SidebarCollapseButton,
  SidebarUserMenu,
} from "./sidebar-parts";

interface SidebarProps {
  credits?: number;
  user?: {
    email?: string;
    full_name?: string;
  };
  isEnterprise?: boolean;
  onNavigate?: () => void;
}

export function Sidebar({
  credits = 0,
  user,
  isEnterprise = false,
  onNavigate,
}: SidebarProps) {
  const { isCollapsed, toggleCollapsed } = useSidebar();

  return (
    <nav
      aria-label="Main navigation"
      className={cn(
        "flex h-full flex-col",
        "transition-all duration-300 ease-out",
        isCollapsed ? "w-16" : "w-64",
        // Glass background
        "bg-sidebar/80 backdrop-blur-xl",
        // Border
        "border-r border-border/50 dark:border-white/[0.08]"
      )}
    >
      {/* Logo */}
      <SidebarLogo isCollapsed={isCollapsed} />

      {/* Main Navigation */}
      <SidebarNavigation
        isCollapsed={isCollapsed}
        isEnterprise={isEnterprise}
        onNavigate={onNavigate}
      />

      {/* Bottom Section: Credits, Collapse, Avatar */}
      <div
        className={cn(
          "border-t border-border/50 dark:border-white/[0.08]",
          isCollapsed ? "p-2" : "p-4",
          "space-y-2"
        )}
      >
        {/* Credits Badge */}
        <SidebarCredits credits={credits} isCollapsed={isCollapsed} onNavigate={onNavigate} />

        {/* Collapse toggle button */}
        <SidebarCollapseButton
          isCollapsed={isCollapsed}
          onToggle={toggleCollapsed}
        />

        {/* User Avatar with Dropdown */}
        <SidebarUserMenu user={user} isCollapsed={isCollapsed} onNavigate={onNavigate} />
      </div>
    </nav>
  );
}
