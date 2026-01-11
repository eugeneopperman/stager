import * as React from "react"

import { cn } from "@/lib/utils"

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        // Base styles
        "h-10 w-full min-w-0 rounded-lg border bg-background/50 px-3 py-2 text-base shadow-sm",
        // Placeholder and file styles
        "file:text-foreground placeholder:text-muted-foreground/70 selection:bg-primary/20 selection:text-foreground",
        // Glass effect in dark mode
        "dark:bg-white/5 dark:backdrop-blur-sm",
        // Border styles
        "border-border/60 dark:border-white/10",
        // Transitions
        "transition-all duration-200 ease-out",
        // Focus states with glow
        "focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:outline-none",
        "dark:focus-visible:ring-primary/30 dark:focus-visible:border-primary/50",
        // Hover states
        "hover:border-border hover:bg-background/70 dark:hover:bg-white/8 dark:hover:border-white/15",
        // Invalid states
        "aria-invalid:border-destructive aria-invalid:ring-destructive/20",
        // Disabled
        "disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50",
        // File input styles
        "file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium",
        "md:text-sm",
        className
      )}
      {...props}
    />
  )
}

export { Input }
