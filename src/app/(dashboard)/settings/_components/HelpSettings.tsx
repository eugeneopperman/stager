"use client";

import { Button } from "@/components/ui/button";
import { Play } from "lucide-react";
import { startTour } from "@/components/onboarding";

interface HelpSettingsProps {
  credits: number;
  userName?: string;
}

export function HelpSettings({ credits }: HelpSettingsProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="font-medium">Product Tour</p>
          <p className="text-sm text-muted-foreground">
            Take a guided tour of Stager&apos;s features
          </p>
        </div>
        <Button variant="outline" onClick={() => startTour(credits)}>
          <Play className="mr-2 h-4 w-4" />
          Start Tour
        </Button>
      </div>
    </div>
  );
}
