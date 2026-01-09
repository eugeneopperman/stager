"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  Home,
  ImagePlus,
  Building2,
  History,
  Settings,
  CreditCard,
  LogOut,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: Home },
  { name: "Stage Photo", href: "/stage", icon: ImagePlus },
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
    <div className="flex h-full w-64 flex-col bg-slate-900">
      {/* Logo */}
      <div className="flex h-16 items-center gap-2 px-6 border-b border-slate-800">
        <Home className="h-8 w-8 text-blue-500" />
        <span className="text-xl font-bold text-white">Stager</span>
      </div>

      {/* Credits Badge */}
      <div className="px-4 py-4">
        <div className="rounded-lg bg-gradient-to-r from-blue-600 to-blue-700 p-4">
          <p className="text-xs font-medium text-blue-200">Available Credits</p>
          <p className="text-2xl font-bold text-white">{credits}</p>
          <Link
            href="/billing"
            className="mt-2 inline-block text-xs text-blue-200 hover:text-white transition-colors"
          >
            Get more credits →
          </Link>
        </div>
      </div>

      {/* Main Navigation */}
      <nav className="flex-1 space-y-1 px-3 py-4">
        <p className="px-3 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
          Main
        </p>
        {navigation.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                isActive
                  ? "bg-slate-800 text-white"
                  : "text-slate-400 hover:bg-slate-800 hover:text-white"
              )}
            >
              <item.icon className="h-5 w-5" />
              {item.name}
            </Link>
          );
        })}

        <div className="pt-6">
          <p className="px-3 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
            Account
          </p>
          {secondaryNavigation.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-slate-800 text-white"
                    : "text-slate-400 hover:bg-slate-800 hover:text-white"
                )}
              >
                <item.icon className="h-5 w-5" />
                {item.name}
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Logout Button */}
      <div className="border-t border-slate-800 p-4">
        <Button
          variant="ghost"
          className="w-full justify-start text-slate-400 hover:text-white hover:bg-slate-800"
          onClick={handleLogout}
        >
          <LogOut className="mr-3 h-5 w-5" />
          Sign out
        </Button>
      </div>
    </div>
  );
}
