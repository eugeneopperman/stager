"use client";

import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  Home,
  ImagePlus,
  Images,
  Building2,
  History,
  BarChart3,
  Users,
} from "lucide-react";
import { SidebarNavItem } from "./SidebarNavItem";

const baseNavigation = [
  { name: "Dashboard", href: "/dashboard", icon: Home, tourId: "dashboard" },
  { name: "Stage Photo", href: "/stage", icon: ImagePlus, tourId: "stage-photo" },
  { name: "Batch Stage", href: "/stage/batch", icon: Images, tourId: "batch-stage" },
  { name: "Properties", href: "/properties", icon: Building2, tourId: "properties" },
  { name: "History", href: "/history", icon: History, tourId: "history" },
  { name: "Analytics", href: "/analytics", icon: BarChart3, tourId: "analytics" },
];

const teamNavItem = { name: "Team", href: "/team", icon: Users, tourId: "team" };

interface SidebarNavigationProps {
  isCollapsed: boolean;
  isEnterprise: boolean;
  onNavigate?: () => void;
}

export function SidebarNavigation({
  isCollapsed,
  isEnterprise,
  onNavigate,
}: SidebarNavigationProps) {
  const pathname = usePathname();

  const navigation = isEnterprise
    ? [...baseNavigation, teamNavItem]
    : baseNavigation;

  return (
    <nav
      className={cn(
        "flex-1 space-y-1 py-4 overflow-y-auto",
        isCollapsed ? "px-2" : "px-3"
      )}
    >
      {navigation.map((item) => (
        <SidebarNavItem
          key={item.name}
          name={item.name}
          href={item.href}
          icon={item.icon}
          isActive={pathname === item.href}
          isCollapsed={isCollapsed}
          onNavigate={onNavigate}
          tourId={item.tourId}
        />
      ))}
    </nav>
  );
}
