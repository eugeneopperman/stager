"use client";

import { useTheme } from "next-themes";
import { useHasMounted } from "@/hooks/useHasMounted";
import { cn } from "@/lib/utils";
import { Sun, Moon, Monitor, Check } from "lucide-react";

const themes = [
  {
    id: "light",
    label: "Light",
    description: "Light background with dark text",
    icon: Sun,
  },
  {
    id: "dark",
    label: "Dark",
    description: "Dark background with light text",
    icon: Moon,
  },
  {
    id: "system",
    label: "System",
    description: "Follows your device settings",
    icon: Monitor,
  },
] as const;

export function ThemeSelector() {
  const { theme, setTheme } = useTheme();
  const mounted = useHasMounted();

  if (!mounted) {
    return (
      <div className="grid grid-cols-3 gap-3">
        {themes.map((t) => (
          <div
            key={t.id}
            className={cn(
              "flex flex-col items-center gap-2 p-4 rounded-xl",
              "border-2 border-border/60 dark:border-white/10",
              "animate-pulse bg-muted/50"
            )}
          >
            <div className="h-6 w-6 rounded bg-muted" />
            <div className="h-4 w-12 rounded bg-muted" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-3 gap-3">
      {themes.map((t) => {
        const isSelected = theme === t.id;
        const Icon = t.icon;

        return (
          <button
            key={t.id}
            type="button"
            onClick={() => setTheme(t.id)}
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
              <div className={cn(
                "absolute top-2 right-2 h-5 w-5 rounded-full flex items-center justify-center",
                "bg-primary shadow-sm",
                "animate-in zoom-in-50 duration-200"
              )}>
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
              {t.label}
            </span>
            <span className="text-xs text-muted-foreground">
              {t.description}
            </span>
          </button>
        );
      })}
    </div>
  );
}
