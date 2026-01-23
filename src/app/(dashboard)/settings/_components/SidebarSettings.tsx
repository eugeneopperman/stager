"use client";

import { useSidebar } from "@/contexts/SidebarContext";
import { useHasMounted } from "@/hooks/useHasMounted";
import { cn } from "@/lib/utils";
import { PanelLeftClose, PanelLeft, Check } from "lucide-react";

const sidebarModes = [
  {
    id: "normal",
    label: "Always Visible",
    description: "Sidebar stays visible and can be collapsed",
    icon: PanelLeft,
  },
  {
    id: "autohide",
    label: "Auto-Hide",
    description: "Sidebar hides and appears on hover",
    icon: PanelLeftClose,
  },
] as const;

export function SidebarSettings() {
  const { isAutoHide, setAutoHide } = useSidebar();
  const mounted = useHasMounted();

  if (!mounted) {
    return (
      <div className="grid grid-cols-2 gap-3">
        {sidebarModes.map((mode) => (
          <div
            key={mode.id}
            className={cn(
              "flex flex-col items-center gap-2 p-4 rounded-xl",
              "border-2 border-border/60 dark:border-white/10",
              "animate-pulse bg-muted/50"
            )}
          >
            <div className="h-6 w-6 rounded bg-muted" />
            <div className="h-4 w-20 rounded bg-muted" />
          </div>
        ))}
      </div>
    );
  }

  const currentMode = isAutoHide ? "autohide" : "normal";

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        {sidebarModes.map((mode) => {
          const isSelected = currentMode === mode.id;
          const Icon = mode.icon;

          return (
            <button
              key={mode.id}
              type="button"
              onClick={() => setAutoHide(mode.id === "autohide")}
              className={cn(
                "relative flex flex-col items-center gap-2 p-4 rounded-xl text-center",
                "border-2",
                "transition-all duration-200 ease-out",
                "hover:scale-[1.02] active:scale-[0.98]",
                isSelected
                  ? "border-primary bg-primary/5 dark:bg-primary/10 shadow-md shadow-primary/10"
                  : "border-border/60 dark:border-white/10 hover:border-border hover:bg-accent/30 dark:hover:bg-white/5"
              )}
            >
              {isSelected && (
                <div
                  className={cn(
                    "absolute top-2 right-2 h-5 w-5 rounded-full flex items-center justify-center",
                    "bg-primary shadow-sm",
                    "animate-in zoom-in-50 duration-200"
                  )}
                >
                  <Check className="h-3 w-3 text-primary-foreground" />
                </div>
              )}
              <Icon
                className={cn(
                  "h-6 w-6 transition-colors duration-200",
                  isSelected ? "text-primary" : "text-muted-foreground"
                )}
              />
              <span
                className={cn(
                  "text-sm font-medium",
                  isSelected ? "text-primary" : "text-foreground"
                )}
              >
                {mode.label}
              </span>
              <span className="text-xs text-muted-foreground">
                {mode.description}
              </span>
            </button>
          );
        })}
      </div>
      <p className="text-xs text-muted-foreground">
        Tip: Press <kbd className="px-1.5 py-0.5 rounded bg-muted font-mono text-[10px]">[</kbd> to toggle the sidebar collapsed state.
      </p>
    </div>
  );
}
