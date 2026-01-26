"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Play } from "lucide-react";
import { WelcomeOnboardingModal } from "@/components/onboarding";

interface HelpSettingsProps {
  credits: number;
  userName?: string;
}

export function HelpSettings({ credits, userName }: HelpSettingsProps) {
  const [showModal, setShowModal] = useState(false);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="font-medium">Product Walkthrough</p>
          <p className="text-sm text-muted-foreground">
            Re-watch the introduction to Stager
          </p>
        </div>
        <Button variant="outline" onClick={() => setShowModal(true)}>
          <Play className="mr-2 h-4 w-4" />
          Restart
        </Button>
      </div>

      {showModal && (
        <WelcomeOnboardingModal
          isOpen={true}
          onClose={() => setShowModal(false)}
          credits={credits}
          userName={userName}
          skipDbUpdate={true}
        />
      )}
    </div>
  );
}
