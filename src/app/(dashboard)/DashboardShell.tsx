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
      <div className="flex h-screen bg-slate-50 dark:bg-slate-950">
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
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/50"
            onClick={() => setSidebarOpen(false)}
          />
          {/* Sidebar */}
          <div className="fixed inset-y-0 left-0 w-64">
            <Sidebar credits={credits} />
          </div>
        </div>

        {/* Main content */}
        <div className="flex flex-1 flex-col overflow-hidden">
          <Header user={user} onMenuClick={() => setSidebarOpen(true)} />
          <main className="flex-1 overflow-y-auto p-6">{children}</main>
        </div>
      </div>
    </DashboardProvider>
  );
}
