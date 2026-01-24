"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface SidebarCollapseButtonProps {
  isCollapsed: boolean;
  onToggle: () => void;
}

export function SidebarCollapseButton({
  isCollapsed,
  onToggle,
}: SidebarCollapseButtonProps) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant="ghost"
          size={isCollapsed ? "icon" : "default"}
          className={cn(
            isCollapsed ? "w-full h-10" : "w-full justify-start",
            "text-muted-foreground hover:text-foreground",
            "hover:bg-accent/30 dark:hover:bg-white/5",
            "transition-all duration-200"
          )}
          onClick={onToggle}
        >
          {isCollapsed ? (
            <ChevronRight className="h-5 w-5" />
          ) : (
            <>
              <ChevronLeft className="mr-3 h-5 w-5" />
              Collapse
            </>
          )}
        </Button>
      </TooltipTrigger>
      {isCollapsed && (
        <TooltipContent side="right">Expand sidebar</TooltipContent>
      )}
    </Tooltip>
  );
}
