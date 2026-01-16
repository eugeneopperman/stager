"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  Home,
  ImagePlus,
  Images,
  Building2,
  History,
  Settings,
  CreditCard,
  LogOut,
  AlertTriangle,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  Coins,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { LOW_CREDITS_THRESHOLD } from "@/lib/constants";
import { useSidebar } from "@/contexts/SidebarContext";

const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: Home },
  { name: "Stage Photo", href: "/stage", icon: ImagePlus },
  { name: "Batch Stage", href: "/stage/batch", icon: Images },
  { name: "Properties", href: "/properties", icon: Building2 },
  { name: "History", href: "/history", icon: History },
];

const secondaryNavigation = [
  { name: "Settings", href: "/settings", icon: Settings },
  { name: "Billing", href: "/billing", icon: CreditCard },
];

interface SidebarProps {
  credits?: number;
}

export function Sidebar({ credits = 0 }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();
  const { isCollapsed, toggleCollapsed } = useSidebar();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  };

  return (
    <div className={cn(
      "flex h-full flex-col",
      "transition-all duration-300 ease-out",
      isCollapsed ? "w-16" : "w-64",
      // Glass background
      "bg-sidebar/80 backdrop-blur-xl",
      // Border
      "border-r border-border/50 dark:border-white/[0.08]"
    )}>
      {/* Logo */}
      <div className={cn(
        "flex h-16 items-center border-b border-border/50 dark:border-white/[0.08]",
        isCollapsed ? "justify-center px-2" : "gap-3 px-6"
      )}>
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

      {/* Credits Badge */}
      <div className={cn("py-4", isCollapsed ? "px-2" : "px-4")}>
        {isCollapsed ? (
          // Collapsed: Icon-only credits badge
          <Tooltip>
            <TooltipTrigger asChild>
              <Link
                href="/billing"
                className={cn(
                  "flex flex-col items-center justify-center rounded-2xl p-2 relative overflow-hidden",
                  "transition-all duration-300 ease-out",
                  credits <= LOW_CREDITS_THRESHOLD
                    ? "bg-gradient-to-br from-amber-500/90 to-orange-600/90"
                    : "bg-gradient-to-br from-primary/90 to-violet-600/90",
                  credits <= LOW_CREDITS_THRESHOLD
                    ? "shadow-md shadow-amber-500/25"
                    : "shadow-md shadow-primary/25"
                )}
              >
                <div className="absolute inset-0 bg-gradient-to-tr from-white/0 via-white/10 to-white/0" />
                <div className="relative flex flex-col items-center">
                  {credits <= LOW_CREDITS_THRESHOLD ? (
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
        ) : (
          // Expanded: Full credits badge
          <div
            className={cn(
              "rounded-2xl p-4 relative overflow-hidden",
              "transition-all duration-300 ease-out",
              credits <= LOW_CREDITS_THRESHOLD
                ? "bg-gradient-to-br from-amber-500/90 to-orange-600/90"
                : "bg-gradient-to-br from-primary/90 to-violet-600/90",
              credits <= LOW_CREDITS_THRESHOLD
                ? "shadow-lg shadow-amber-500/25"
                : "shadow-lg shadow-primary/25"
            )}
          >
            <div className="absolute inset-0 bg-gradient-to-tr from-white/0 via-white/10 to-white/0" />
            <div className="relative">
              <div className="flex items-center gap-2">
                {credits <= LOW_CREDITS_THRESHOLD && (
                  <AlertTriangle className="h-4 w-4 text-amber-100 animate-pulse" />
                )}
                <p
                  className={cn(
                    "text-xs font-medium",
                    credits <= LOW_CREDITS_THRESHOLD ? "text-amber-100" : "text-blue-100"
                  )}
                >
                  {credits <= LOW_CREDITS_THRESHOLD ? "Low Credits" : "Available Credits"}
                </p>
              </div>
              <p className="text-2xl font-bold text-white mt-1">{credits}</p>
              <Link
                href="/billing"
                className={cn(
                  "mt-2 inline-flex items-center gap-1 text-xs font-medium transition-all duration-200",
                  "hover:gap-2",
                  credits <= LOW_CREDITS_THRESHOLD
                    ? "text-amber-100 hover:text-white"
                    : "text-blue-100 hover:text-white"
                )}
              >
                {credits <= LOW_CREDITS_THRESHOLD ? "Buy more credits" : "Get more credits"}
                <span className="transition-transform duration-200">→</span>
              </Link>
            </div>
          </div>
        )}
      </div>

      {/* Main Navigation */}
      <nav className={cn(
        "flex-1 space-y-1 py-4 overflow-y-auto",
        isCollapsed ? "px-2" : "px-3"
      )}>
        {!isCollapsed && (
          <p className="px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
            Main
          </p>
        )}
        {navigation.map((item) => {
          const isActive = pathname === item.href;
          const navLink = (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "group relative flex items-center rounded-full py-2.5 text-sm font-medium",
                "transition-all duration-200 ease-out",
                isCollapsed ? "justify-center px-2.5" : "gap-3 px-4",
                isActive
                  ? "bg-primary/10 text-primary dark:bg-primary/20"
                  : "text-muted-foreground hover:bg-accent/30 hover:text-foreground dark:hover:bg-white/8"
              )}
            >
              {/* Active indicator - pill dot */}
              {isActive && !isCollapsed && (
                <div className="absolute left-1.5 top-1/2 -translate-y-1/2 w-1 h-4 bg-primary rounded-full" />
              )}
              <item.icon className={cn(
                "h-5 w-5 shrink-0 transition-transform duration-200",
                "group-hover:scale-105",
                isActive && "text-primary"
              )} />
              {!isCollapsed && <span>{item.name}</span>}
            </Link>
          );

          return isCollapsed ? (
            <Tooltip key={item.name}>
              <TooltipTrigger asChild>{navLink}</TooltipTrigger>
              <TooltipContent side="right">{item.name}</TooltipContent>
            </Tooltip>
          ) : (
            navLink
          );
        })}

        <div className={cn("pt-6", isCollapsed && "pt-4")}>
          {!isCollapsed && (
            <p className="px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
              Account
            </p>
          )}
          {isCollapsed && (
            <div className="border-t border-border/50 dark:border-white/[0.08] mb-4" />
          )}
          {secondaryNavigation.map((item) => {
            const isActive = pathname === item.href;
            const navLink = (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  "group relative flex items-center rounded-full py-2.5 text-sm font-medium",
                  "transition-all duration-200 ease-out",
                  isCollapsed ? "justify-center px-2.5" : "gap-3 px-4",
                  isActive
                    ? "bg-primary/10 text-primary dark:bg-primary/20"
                    : "text-muted-foreground hover:bg-accent/30 hover:text-foreground dark:hover:bg-white/8"
                )}
              >
                {isActive && !isCollapsed && (
                  <div className="absolute left-1.5 top-1/2 -translate-y-1/2 w-1 h-4 bg-primary rounded-full" />
                )}
                <item.icon className={cn(
                  "h-5 w-5 shrink-0 transition-transform duration-200",
                  "group-hover:scale-105",
                  isActive && "text-primary"
                )} />
                {!isCollapsed && <span>{item.name}</span>}
              </Link>
            );

            return isCollapsed ? (
              <Tooltip key={item.name}>
                <TooltipTrigger asChild>{navLink}</TooltipTrigger>
                <TooltipContent side="right">{item.name}</TooltipContent>
              </Tooltip>
            ) : (
              navLink
            );
          })}
        </div>
      </nav>

      {/* Collapse Toggle & Logout */}
      <div className={cn(
        "border-t border-border/50 dark:border-white/[0.08]",
        isCollapsed ? "p-2" : "p-4"
      )}>
        {/* Collapse toggle button */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size={isCollapsed ? "icon" : "default"}
              className={cn(
                isCollapsed ? "w-full h-10" : "w-full justify-start mb-2",
                "text-muted-foreground hover:text-foreground",
                "hover:bg-accent/50 dark:hover:bg-white/5",
                "transition-all duration-200"
              )}
              onClick={toggleCollapsed}
            >
              {isCollapsed ? (
                <ChevronRight className="h-5 w-5" />
              ) : (
                <>
                  <ChevronLeft className="mr-3 h-5 w-5" />
                  Collapse
                </>
              )}
            </Button>
          </TooltipTrigger>
          {isCollapsed && (
            <TooltipContent side="right">Expand sidebar</TooltipContent>
          )}
        </Tooltip>

        {/* Logout button */}
        {isCollapsed ? (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className={cn(
                  "w-full h-10 mt-1",
                  "text-muted-foreground hover:text-foreground",
                  "hover:bg-accent/50 dark:hover:bg-white/5",
                  "transition-all duration-200"
                )}
                onClick={handleLogout}
              >
                <LogOut className="h-5 w-5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="right">Sign out</TooltipContent>
          </Tooltip>
        ) : (
          <Button
            variant="ghost"
            className={cn(
              "w-full justify-start",
              "text-muted-foreground hover:text-foreground",
              "hover:bg-accent/50 dark:hover:bg-white/5",
              "transition-all duration-200"
            )}
            onClick={handleLogout}
          >
            <LogOut className="mr-3 h-5 w-5" />
            Sign out
          </Button>
        )}
      </div>
    </div>
  );
}
