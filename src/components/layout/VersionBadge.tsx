"use client";

import { APP_VERSION } from "@/lib/version";

export function VersionBadge() {
  return (
    <div className="fixed bottom-2 right-2 text-xs text-muted-foreground/50 font-mono z-50">
      Beta v{APP_VERSION}
    </div>
  );
}
