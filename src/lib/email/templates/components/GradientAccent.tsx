import { Section } from "@react-email/components";
import * as React from "react";
import { gradients, radius, spacing } from "./styles";

interface GradientAccentProps {
  variant?: "default" | "alt";
  height?: string;
  marginBottom?: string;
}

export function GradientAccent({
  variant = "default",
  height = "4px",
  marginBottom = spacing.lg,
}: GradientAccentProps) {
  return (
    <Section
      style={{
        background: variant === "default" ? gradients.accent : gradients.accentAlt,
        height,
        borderRadius: radius.sm,
        marginBottom,
      }}
    />
  );
}

export default GradientAccent;
