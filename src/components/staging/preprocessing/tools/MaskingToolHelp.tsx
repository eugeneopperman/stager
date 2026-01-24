"use client";

import { memo } from "react";

interface MaskingToolHelpProps {
  mode: "ai" | "brush";
}

export const MaskingToolHelp = memo(function MaskingToolHelp({ mode }: MaskingToolHelpProps) {
  return (
    <p className="text-xs text-muted-foreground text-center">
      {mode === "ai" ? (
        <>
          Type object names and click <strong>Detect</strong> to auto-select them.
        </>
      ) : (
        <>
          <span className="text-green-600 font-medium">Green</span> areas will be staged.{" "}
          <span className="text-red-600 font-medium">Red</span> areas preserved.
        </>
      )}
    </p>
  );
});
