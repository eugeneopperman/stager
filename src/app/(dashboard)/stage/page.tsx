"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { StagingWizard } from "@/components/staging/wizard";
import { QuickStageLayout } from "@/components/staging/QuickStageLayout";
import { Layers, Wand2, Zap } from "lucide-react";
import { cn } from "@/lib/utils";

type StagingMode = "guided" | "quick";

const STORAGE_KEY = "stager-staging-mode";

export default function StagePage() {
  const [mode, setMode] = useState<StagingMode>("guided");
  const [mounted, setMounted] = useState(false);

  // Load preference from localStorage on mount
  useEffect(() => {
    setMounted(true);
    const stored = localStorage.getItem(STORAGE_KEY) as StagingMode | null;
    if (stored === "guided" || stored === "quick") {
      setMode(stored);
    }
  }, []);

  // Save preference to localStorage
  const handleModeChange = (newMode: StagingMode) => {
    setMode(newMode);
    localStorage.setItem(STORAGE_KEY, newMode);
  };

  // Avoid hydration mismatch
  if (!mounted) {
    return null;
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-foreground">Stage a Photo</h1>
          <p className="text-muted-foreground mt-2">
            Transform empty rooms with AI-powered virtual staging
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/* Mode toggle */}
          <div className="flex items-center p-1 bg-muted rounded-lg">
            <button
              onClick={() => handleModeChange("guided")}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-all",
                mode === "guided"
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Wand2 className="h-4 w-4" />
              <span className="hidden sm:inline">Guided</span>
            </button>
            <button
              onClick={() => handleModeChange("quick")}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-all",
                mode === "quick"
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Zap className="h-4 w-4" />
              <span className="hidden sm:inline">Quick</span>
            </button>
          </div>

          {/* Batch mode link */}
          <Button variant="outline" size="sm" asChild>
            <Link href="/stage/batch">
              <Layers className="mr-2 h-4 w-4" />
              Batch Mode
            </Link>
          </Button>
        </div>
      </div>

      {/* Content based on mode */}
      {mode === "guided" ? <StagingWizard /> : <QuickStageLayout />}
    </div>
  );
}
