"use client";

import { memo } from "react";

interface WelcomeHeaderProps {
  greeting: string;
}

export const WelcomeHeader = memo(function WelcomeHeader({
  greeting,
}: WelcomeHeaderProps) {
  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
      <h1 className="text-foreground">{greeting}</h1>
      <p className="text-muted-foreground mt-2 text-lg">
        Here&apos;s an overview of your staging activity
      </p>
    </div>
  );
});
