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
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { LOW_CREDITS_THRESHOLD } from "@/lib/constants";

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

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  };

  return (
    <div className={cn(
      "flex h-full w-64 flex-col",
      // Glass background
      "bg-sidebar/80 backdrop-blur-xl",
      // Border
      "border-r border-border/50 dark:border-white/[0.08]"
    )}>
      {/* Logo */}
      <div className="flex h-16 items-center gap-3 px-6 border-b border-border/50 dark:border-white/[0.08]">
        <div className="relative">
          <Sparkles className="h-7 w-7 text-primary" />
          <div className="absolute inset-0 blur-md bg-primary/30 -z-10" />
        </div>
        <span className="text-xl font-bold bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text">
          Stager
        </span>
      </div>

      {/* Credits Badge */}
      <div className="px-4 py-4">
        <div
          className={cn(
            "rounded-xl p-4 relative overflow-hidden",
            "transition-all duration-300 ease-out",
            credits <= LOW_CREDITS_THRESHOLD
              ? "bg-gradient-to-br from-amber-500/90 to-orange-600/90"
              : "bg-gradient-to-br from-primary/90 to-violet-600/90",
            // Shadow glow
            credits <= LOW_CREDITS_THRESHOLD
              ? "shadow-lg shadow-amber-500/20"
              : "shadow-lg shadow-primary/20"
          )}
        >
          {/* Subtle shine effect */}
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
      </div>

      {/* Main Navigation */}
      <nav className="flex-1 space-y-1 px-3 py-4 overflow-y-auto">
        <p className="px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
          Main
        </p>
        {navigation.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "group relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium",
                "transition-all duration-200 ease-out",
                isActive
                  ? "bg-primary/10 text-primary dark:bg-primary/15"
                  : "text-muted-foreground hover:bg-accent/50 hover:text-foreground dark:hover:bg-white/5"
              )}
            >
              {/* Active indicator */}
              {isActive && (
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 bg-primary rounded-r-full" />
              )}
              <item.icon className={cn(
                "h-5 w-5 transition-transform duration-200",
                "group-hover:scale-110",
                isActive && "text-primary"
              )} />
              {item.name}
            </Link>
          );
        })}

        <div className="pt-6">
          <p className="px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
            Account
          </p>
          {secondaryNavigation.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  "group relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium",
                  "transition-all duration-200 ease-out",
                  isActive
                    ? "bg-primary/10 text-primary dark:bg-primary/15"
                    : "text-muted-foreground hover:bg-accent/50 hover:text-foreground dark:hover:bg-white/5"
                )}
              >
                {isActive && (
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 bg-primary rounded-r-full" />
                )}
                <item.icon className={cn(
                  "h-5 w-5 transition-transform duration-200",
                  "group-hover:scale-110",
                  isActive && "text-primary"
                )} />
                {item.name}
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Logout Button */}
      <div className="border-t border-border/50 dark:border-white/[0.08] p-4">
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
      </div>
    </div>
  );
}
