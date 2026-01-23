"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const QUICK_PROMPTS = [
  "furniture",
  "sofa",
  "table",
  "chairs",
  "bed",
  "rug",
  "lamp",
  "curtains",
];

interface AIDetectionControlsProps {
  prompt: string;
  onPromptChange: (prompt: string) => void;
  onDetect: () => void;
  onQuickPrompt: (prompt: string) => void;
  isSegmenting: boolean;
  disabled?: boolean;
}

export function AIDetectionControls({
  prompt,
  onPromptChange,
  onDetect,
  onQuickPrompt,
  isSegmenting,
  disabled = false,
}: AIDetectionControlsProps) {
  return (
    <>
      {/* Text prompt input */}
      <div className="flex gap-2">
        <Input
          placeholder="Type objects to select (e.g., sofa, table)"
          value={prompt}
          onChange={(e) => onPromptChange(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && onDetect()}
          disabled={disabled || isSegmenting}
          className="flex-1"
        />
        <Button
          size="sm"
          onClick={onDetect}
          disabled={disabled || isSegmenting || !prompt.trim()}
        >
          Detect
        </Button>
      </div>

      {/* Quick prompts */}
      <div className="flex flex-wrap gap-1">
        {QUICK_PROMPTS.map((qp) => (
          <Button
            key={qp}
            variant="outline"
            size="sm"
            onClick={() => onQuickPrompt(qp)}
            disabled={disabled || isSegmenting}
            className="text-xs h-7 px-2"
          >
            {qp}
          </Button>
        ))}
      </div>
    </>
  );
}
