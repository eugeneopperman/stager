import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center justify-center rounded-full border px-2.5 py-0.5 text-xs font-medium w-fit whitespace-nowrap shrink-0 [&>svg]:size-3 gap-1 [&>svg]:pointer-events-none transition-all duration-150 ease-out overflow-hidden",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-primary/90 text-primary-foreground shadow-sm [a&]:hover:bg-primary [a&]:hover:shadow-md",
        secondary:
          "border-transparent bg-secondary/80 text-secondary-foreground backdrop-blur-sm [a&]:hover:bg-secondary",
        destructive:
          "border-transparent bg-destructive/90 text-white shadow-sm [a&]:hover:bg-destructive",
        outline:
          "border-border/60 bg-background/50 backdrop-blur-sm text-foreground [a&]:hover:bg-accent/50 [a&]:hover:border-border dark:border-white/10 dark:bg-white/5",
        // Status variants
        success:
          "border-transparent bg-emerald-500/15 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400",
        warning:
          "border-transparent bg-amber-500/15 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400",
        info:
          "border-transparent bg-blue-500/15 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

function Badge({
  className,
  variant,
  asChild = false,
  ...props
}: React.ComponentProps<"span"> &
  VariantProps<typeof badgeVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot : "span"

  return (
    <Comp
      data-slot="badge"
      className={cn(badgeVariants({ variant }), className)}
      {...props}
    />
  )
}

export { Badge, badgeVariants }
