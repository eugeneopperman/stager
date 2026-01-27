"use client";

import { usePathname } from "next/navigation";
import { HelpCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { hasPageTour, startPageTour } from "@/components/onboarding";

export function HelpButton() {
  const pathname = usePathname();

  // Don't render the button if no tour exists for this page
  if (!hasPageTour(pathname)) {
    return null;
  }

  const handleClick = () => {
    // Small delay to ensure any UI animations are complete
    setTimeout(() => {
      startPageTour(pathname);
    }, 100);
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleClick}
            className="h-9 w-9 rounded-full bg-card/80 backdrop-blur-md border border-border/50 shadow-sm hover:bg-accent/80 hover:border-border transition-all"
            aria-label="Page help"
            data-tour="help"
          >
            <HelpCircle className="h-[18px] w-[18px] text-muted-foreground" />
          </Button>
        </TooltipTrigger>
        <TooltipContent side="bottom" align="end">
          <p>Page Help</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
