"use client";

import { useState, useEffect } from "react";
import { Menu } from "lucide-react";
import { Sidebar } from "@/components/layout/Sidebar";
import { FloatingControls } from "@/components/layout/FloatingControls";
import { DashboardProvider } from "@/contexts/DashboardContext";
import { SidebarProvider, useSidebar } from "@/contexts/SidebarContext";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useObservability } from "@/lib/observability/hooks";
import { ProductTour, OPEN_MOBILE_SIDEBAR_EVENT } from "@/components/onboarding";

interface DashboardShellProps {
  children: React.ReactNode;
  user?: {
    id?: string;
    email?: string;
    full_name?: string;
    plan?: string;
  };
  credits?: number;
  isEnterprise?: boolean;
  showOnboarding?: boolean;
}

function DashboardContent({ children, user, credits = 0, isEnterprise = false, showOnboarding = false }: DashboardShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { isCollapsed, isAutoHide, isHovered, setHovered } = useSidebar();

  // Identify user for observability (Sentry)
  useObservability(user?.id ? { id: user.id, email: user.email, plan: user.plan } : null);

  // Listen for event to open mobile sidebar (used by product tour)
  useEffect(() => {
    const handleOpenSidebar = () => {
      setSidebarOpen(true);
    };

    window.addEventListener(OPEN_MOBILE_SIDEBAR_EVENT, handleOpenSidebar);
    return () => {
      window.removeEventListener(OPEN_MOBILE_SIDEBAR_EVENT, handleOpenSidebar);
    };
  }, []);

  // Calculate sidebar width for layout
  const sidebarWidth = isCollapsed ? "w-16" : "w-64";

  return (
    <>
      {/* Interactive Product Tour */}
      {showOnboarding && (
        <ProductTour
          autoStart={true}
          credits={credits}
        />
      )}

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
          "hidden lg:block shrink-0",
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
        <Sidebar credits={credits} user={user} isEnterprise={isEnterprise} />
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
          <Sidebar credits={credits} user={user} isEnterprise={isEnterprise} onNavigate={() => setSidebarOpen(false)} />
        </div>
      </div>

      {/* Floating Controls - Search & Notifications */}
      <FloatingControls />

      {/* Mobile Menu Button - 44px touch target for accessibility */}
      <Button
        variant="ghost"
        size="icon"
        className={cn(
          "fixed top-3 left-3 sm:top-4 sm:left-4 z-50 lg:hidden",
          "h-11 w-11 rounded-full",
          "bg-card/80 backdrop-blur-xl",
          "border border-black/[0.08] dark:border-white/[0.12]",
          "shadow-lg"
        )}
        onClick={() => setSidebarOpen(true)}
      >
        <Menu className="h-5 w-5" />
      </Button>

      {/* Main content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        <main className={cn(
          "flex-1 overflow-y-auto",
          // Responsive padding - tighter on mobile
          "px-4 sm:px-6 pt-16 sm:pt-24 pb-4 sm:pb-6",
          // Smooth scroll
          "scroll-smooth"
        )}>
          <div className="max-w-7xl mx-auto w-full">
            {children}
          </div>
        </main>
      </div>
    </div>
    </>
  );
}

export function DashboardShell({ children, user, credits = 0, isEnterprise = false, showOnboarding = false }: DashboardShellProps) {
  return (
    <DashboardProvider credits={credits} user={user}>
      <SidebarProvider>
        <DashboardContent user={user} credits={credits} isEnterprise={isEnterprise} showOnboarding={showOnboarding}>
          {children}
        </DashboardContent>
      </SidebarProvider>
    </DashboardProvider>
  );
}
