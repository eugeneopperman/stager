"use client";

import { useState } from "react";
import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";
import { DashboardProvider } from "@/contexts/DashboardContext";
import { cn } from "@/lib/utils";

interface DashboardShellProps {
  children: React.ReactNode;
  user?: {
    email?: string;
    full_name?: string;
  };
  credits?: number;
}

export function DashboardShell({ children, user, credits = 0 }: DashboardShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <DashboardProvider credits={credits} user={user}>
      <div className={cn(
        "flex h-screen",
        // Base background
        "bg-background",
        // Gradient mesh background
        "bg-mesh"
      )}>
        {/* Desktop Sidebar */}
        <div className="hidden lg:block">
          <Sidebar credits={credits} />
        </div>

        {/* Mobile Sidebar */}
        <div
          className={cn(
            "fixed inset-0 z-50 lg:hidden",
            sidebarOpen ? "block" : "hidden"
          )}
        >
          {/* Backdrop with blur */}
          <div
            className={cn(
              "fixed inset-0",
              "bg-black/40 backdrop-blur-sm",
              "transition-opacity duration-300",
              sidebarOpen ? "opacity-100" : "opacity-0"
            )}
            onClick={() => setSidebarOpen(false)}
          />
          {/* Sidebar with slide animation */}
          <div className={cn(
            "fixed inset-y-0 left-0 w-64",
            "transition-transform duration-300 ease-out",
            sidebarOpen ? "translate-x-0" : "-translate-x-full"
          )}>
            <Sidebar credits={credits} />
          </div>
        </div>

        {/* Main content */}
        <div className="flex flex-1 flex-col overflow-hidden">
          <Header user={user} onMenuClick={() => setSidebarOpen(true)} />
          <main className={cn(
            "flex-1 overflow-y-auto p-6",
            // Smooth scroll
            "scroll-smooth"
          )}>
            {children}
          </main>
        </div>
      </div>
    </DashboardProvider>
  );
}
