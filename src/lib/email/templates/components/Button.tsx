import { Button as EmailButton } from "@react-email/components";
import * as React from "react";
import { colors, radius, shadows } from "./styles";

interface ButtonProps {
  href: string;
  children: React.ReactNode;
  variant?: "primary" | "secondary" | "outline";
  fullWidth?: boolean;
  showArrow?: boolean;
}

export function Button({
  href,
  children,
  variant = "primary",
  fullWidth = false,
  showArrow = true,
}: ButtonProps) {
  const styles = {
    primary: primaryButton,
    secondary: secondaryButton,
    outline: outlineButton,
  };

  return (
    <EmailButton
      href={href}
      style={{
        ...styles[variant],
        ...(fullWidth ? { width: "100%", textAlign: "center" as const } : {}),
      }}
    >
      {children}
      {showArrow && " →"}
    </EmailButton>
  );
}

const primaryButton: React.CSSProperties = {
  backgroundColor: colors.primaryBlue,
  borderRadius: radius.md,
  color: "#ffffff",
  fontSize: "14px",
  fontWeight: "600",
  padding: "12px 24px",
  textDecoration: "none",
  textAlign: "center" as const,
  display: "inline-block",
  border: "none",
  boxShadow: shadows.button,
};

const secondaryButton: React.CSSProperties = {
  backgroundColor: colors.background,
  borderRadius: radius.md,
  color: colors.textPrimary,
  fontSize: "14px",
  fontWeight: "600",
  padding: "12px 24px",
  textDecoration: "none",
  textAlign: "center" as const,
  display: "inline-block",
  border: `1px solid ${colors.border}`,
};

const outlineButton: React.CSSProperties = {
  backgroundColor: "transparent",
  borderRadius: radius.md,
  color: colors.primaryBlue,
  fontSize: "14px",
  fontWeight: "600",
  padding: "12px 24px",
  textDecoration: "none",
  textAlign: "center" as const,
  display: "inline-block",
  border: `1px solid ${colors.border}`,
};

export default Button;
