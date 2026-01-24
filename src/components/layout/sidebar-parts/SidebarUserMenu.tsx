"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Settings, CreditCard, LogOut } from "lucide-react";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
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

interface SidebarUserMenuProps {
  user?: {
    email?: string;
    full_name?: string;
  };
  isCollapsed: boolean;
}

export function SidebarUserMenu({ user, isCollapsed }: SidebarUserMenuProps) {
  const router = useRouter();
  const supabase = createClient();

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

  const formatName = (name: string) => {
    return name
      .split(" ")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(" ");
  };

  const displayName = user?.full_name ? formatName(user.full_name) : "User";
  const displayEmail = user?.email?.toLowerCase();

  return (
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
                <AvatarFallback
                  className={cn(
                    "bg-gradient-to-br from-primary to-violet-600",
                    "text-white text-xs font-medium"
                  )}
                >
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
            <p className="text-xs text-muted-foreground truncate">
              {displayEmail}
            </p>
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
  );
}
