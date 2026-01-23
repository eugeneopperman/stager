"use client";

import { Button } from "@/components/ui/button";
import { Sparkles, Brush } from "lucide-react";

type ToolMode = "ai" | "brush";

interface ToolModeToggleProps {
  mode: ToolMode;
  onChange: (mode: ToolMode) => void;
  disabled?: boolean;
}

export function ToolModeToggle({
  mode,
  onChange,
  disabled = false,
}: ToolModeToggleProps) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-muted-foreground w-16">Tool</span>
      <div className="flex gap-1 flex-1">
        <Button
          variant={mode === "ai" ? "default" : "outline"}
          size="sm"
          onClick={() => onChange("ai")}
          disabled={disabled}
          className="flex-1 gap-1.5"
        >
          <Sparkles className="h-4 w-4" />
          AI Detect
        </Button>
        <Button
          variant={mode === "brush" ? "default" : "outline"}
          size="sm"
          onClick={() => onChange("brush")}
          disabled={disabled}
          className="flex-1 gap-1.5"
        >
          <Brush className="h-4 w-4" />
          Brush
        </Button>
      </div>
    </div>
  );
}
