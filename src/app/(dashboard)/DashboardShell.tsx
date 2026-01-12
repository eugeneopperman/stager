"use client";

import { useState } from "react";
import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";
import { DashboardProvider } from "@/contexts/DashboardContext";
import { SidebarProvider, useSidebar } from "@/contexts/SidebarContext";
import { cn } from "@/lib/utils";

interface DashboardShellProps {
  children: React.ReactNode;
  user?: {
    email?: string;
    full_name?: string;
  };
  credits?: number;
}

function DashboardContent({ children, user, credits = 0 }: DashboardShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { isCollapsed, isAutoHide, isHovered, setHovered } = useSidebar();

  // Calculate sidebar width for layout
  const sidebarWidth = isCollapsed ? "w-16" : "w-64";

  return (
    <div className={cn(
      "flex h-screen",
      // Base background
      "bg-background",
      // Gradient mesh background
      "bg-mesh"
    )}>
      {/* Auto-hide trigger zone - only when auto-hide is enabled and sidebar is hidden */}
      {isAutoHide && !isHovered && (
        <div
          className="fixed left-0 top-0 w-4 h-full z-50 cursor-pointer"
          onMouseEnter={() => setHovered(true)}
          aria-hidden="true"
        />
      )}

      {/* Desktop Sidebar */}
      <div
        className={cn(
          "hidden lg:block",
          "transition-all duration-300 ease-out",
          // Auto-hide mode: fixed positioning, slides in/out
          isAutoHide
            ? cn(
                "fixed left-0 top-0 h-full z-40",
                isHovered ? "translate-x-0" : "-translate-x-full"
              )
            : sidebarWidth
        )}
        onMouseEnter={() => isAutoHide && setHovered(true)}
        onMouseLeave={() => isAutoHide && setHovered(false)}
      >
        <Sidebar credits={credits} />
      </div>

      {/* Spacer for non-auto-hide mode */}
      {!isAutoHide && (
        <div className={cn(
          "hidden lg:block shrink-0",
          "transition-all duration-300 ease-out",
          sidebarWidth
        )} />
      )}

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
  );
}

export function DashboardShell({ children, user, credits = 0 }: DashboardShellProps) {
  return (
    <DashboardProvider credits={credits} user={user}>
      <SidebarProvider>
        <DashboardContent user={user} credits={credits}>
          {children}
        </DashboardContent>
      </SidebarProvider>
    </DashboardProvider>
  );
}
