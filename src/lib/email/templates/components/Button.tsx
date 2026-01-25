import { Button as EmailButton } from "@react-email/components";
import * as React from "react";

interface ButtonProps {
  href: string;
  children: React.ReactNode;
  variant?: "primary" | "secondary" | "outline";
  fullWidth?: boolean;
}

export function Button({
  href,
  children,
  variant = "primary",
  fullWidth = false,
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
    </EmailButton>
  );
}

const primaryButton: React.CSSProperties = {
  backgroundColor: "#7c3aed",
  borderRadius: "8px",
  color: "#ffffff",
  fontSize: "16px",
  fontWeight: "600",
  padding: "14px 28px",
  textDecoration: "none",
  textAlign: "center" as const,
  display: "inline-block",
  border: "none",
  cursor: "pointer",
};

const secondaryButton: React.CSSProperties = {
  backgroundColor: "#f4f4f5",
  borderRadius: "8px",
  color: "#18181b",
  fontSize: "16px",
  fontWeight: "600",
  padding: "14px 28px",
  textDecoration: "none",
  textAlign: "center" as const,
  display: "inline-block",
  border: "1px solid #e4e4e7",
  cursor: "pointer",
};

const outlineButton: React.CSSProperties = {
  backgroundColor: "transparent",
  borderRadius: "8px",
  color: "#7c3aed",
  fontSize: "16px",
  fontWeight: "600",
  padding: "14px 28px",
  textDecoration: "none",
  textAlign: "center" as const,
  display: "inline-block",
  border: "2px solid #7c3aed",
  cursor: "pointer",
};

export default Button;
