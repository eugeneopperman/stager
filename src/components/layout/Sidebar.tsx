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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { LOW_CREDITS_THRESHOLD } from "@/lib/constants";
import { useSidebar } from "@/contexts/SidebarContext";

const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: Home },
  { name: "Stage Photo", href: "/stage", icon: ImagePlus },
  { name: "Batch Stage", href: "/stage/batch", icon: Images },
  { name: "Properties", href: "/properties", icon: Building2 },
  { name: "History", href: "/history", icon: History },
];

interface SidebarProps {
  credits?: number;
  user?: {
    email?: string;
    full_name?: string;
  };
  onNavigate?: () => void;
}

export function Sidebar({ credits = 0, user, onNavigate }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();
  const { isCollapsed, toggleCollapsed } = useSidebar();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  };

  const initials = user?.full_name
    ? user.full_name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
    : user?.email?.[0]?.toUpperCase() || "U";

  // Format name as Title Case
  const formatName = (name: string) => {
    return name
      .split(" ")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(" ");
  };

  const displayName = user?.full_name ? formatName(user.full_name) : "User";
  const displayEmail = user?.email?.toLowerCase();

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

      {/* Main Navigation */}
      <nav className={cn(
        "flex-1 space-y-1 py-4 overflow-y-auto",
        isCollapsed ? "px-2" : "px-3"
      )}>
        {navigation.map((item) => {
          const isActive = pathname === item.href;
          const navLink = (
            <Link
              key={item.name}
              href={item.href}
              onClick={onNavigate}
              className={cn(
                "group relative flex items-center rounded-full py-2.5 text-sm font-medium",
                "transition-all duration-200 ease-out",
                isCollapsed ? "justify-center px-2.5" : "gap-3 px-4",
                isActive
                  ? "bg-primary/10 text-primary dark:bg-primary/20"
                  : "text-muted-foreground hover:bg-accent/30 hover:text-foreground dark:hover:bg-white/8"
              )}
            >
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
      </nav>

      {/* Bottom Section: Credits, Collapse, Avatar */}
      <div className={cn(
        "border-t border-border/50 dark:border-white/[0.08]",
        isCollapsed ? "p-2" : "p-4",
        "space-y-2"
      )}>
        {/* Credits Badge */}
        {isCollapsed ? (
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

        {/* Collapse toggle button */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size={isCollapsed ? "icon" : "default"}
              className={cn(
                isCollapsed ? "w-full h-10" : "w-full justify-start",
                "text-muted-foreground hover:text-foreground",
                "hover:bg-accent/30 dark:hover:bg-white/5",
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

        {/* User Avatar with Dropdown */}
        <DropdownMenu>
          <Tooltip>
            <TooltipTrigger asChild>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size={isCollapsed ? "icon" : "default"}
                  className={cn(
                    isCollapsed ? "w-full h-10" : "w-full justify-start",
                    "hover:bg-accent/30 dark:hover:bg-white/5",
                    "transition-all duration-200"
                  )}
                >
                  <Avatar className={cn(isCollapsed ? "h-8 w-8" : "h-8 w-8 mr-3")}>
                    <AvatarFallback className={cn(
                      "bg-gradient-to-br from-primary to-violet-600",
                      "text-white text-xs font-medium"
                    )}>
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                  {!isCollapsed && (
                    <span className="text-muted-foreground">Account</span>
                  )}
                </Button>
              </DropdownMenuTrigger>
            </TooltipTrigger>
            {isCollapsed && (
              <TooltipContent side="right">
                {user?.full_name || user?.email || "Account"}
              </TooltipContent>
            )}
          </Tooltip>
          <DropdownMenuContent
            align={isCollapsed ? "center" : "start"}
            side="top"
            className="min-w-[240px] mb-2"
          >
            <DropdownMenuLabel className="normal-case">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium">{displayName}</p>
                <p className="text-xs text-muted-foreground truncate">{displayEmail}</p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href="/settings">
                <Settings className="mr-2 h-4 w-4" />
                Settings
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/billing">
                <CreditCard className="mr-2 h-4 w-4" />
                Billing
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout} variant="destructive">
              <LogOut className="mr-2 h-4 w-4" />
              Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
