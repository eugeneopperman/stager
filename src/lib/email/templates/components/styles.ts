/**
 * Email Design System Styles
 *
 * Centralized color palette and shared styles for consistent email design.
 * Based on modern, clean aesthetic with soft colors and rounded elements.
 */

import * as React from "react";

// ============================================
// Color Palette
// ============================================

export const colors = {
  // Backgrounds
  background: "#f0f4f8",
  cardWhite: "#ffffff",
  cardHover: "#f8fafc",

  // Text
  textPrimary: "#1e293b",
  textSecondary: "#64748b",
  textMuted: "#94a3b8",

  // Accent Colors
  primaryBlue: "#2563eb",
  primaryHover: "#1d4ed8",
  softPink: "#fce7f3",
  softBlue: "#dbeafe",
  softPurple: "#f3e8ff",

  // Status Colors
  success: "#10b981",
  successBg: "#ecfdf5",
  warning: "#f59e0b",
  warningBg: "#fffbeb",
  error: "#ef4444",
  errorBg: "#fef2f2",
  info: "#3b82f6",
  infoBg: "#eff6ff",

  // Borders & Dividers
  border: "#e2e8f0",
  divider: "#e2e8f0",
};

// ============================================
// Typography
// ============================================

export const fontFamily =
  "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif";

export const typography = {
  heroHeading: {
    fontSize: "28px",
    fontWeight: "700",
    color: colors.textPrimary,
    lineHeight: "1.2",
    margin: "0 0 16px 0",
  } as React.CSSProperties,

  sectionHeading: {
    fontSize: "22px",
    fontWeight: "600",
    color: colors.textPrimary,
    lineHeight: "1.3",
    margin: "0 0 12px 0",
  } as React.CSSProperties,

  cardTitle: {
    fontSize: "18px",
    fontWeight: "600",
    color: colors.textPrimary,
    lineHeight: "1.4",
    margin: "0 0 8px 0",
  } as React.CSSProperties,

  bodyText: {
    fontSize: "16px",
    fontWeight: "400",
    color: colors.textSecondary,
    lineHeight: "1.6",
    margin: "0 0 16px 0",
  } as React.CSSProperties,

  smallText: {
    fontSize: "14px",
    fontWeight: "400",
    color: colors.textMuted,
    lineHeight: "1.5",
    margin: "0 0 8px 0",
  } as React.CSSProperties,

  label: {
    fontSize: "12px",
    fontWeight: "500",
    color: colors.textMuted,
    textTransform: "uppercase" as const,
    letterSpacing: "0.5px",
    margin: "0 0 4px 0",
  } as React.CSSProperties,
};

// ============================================
// Gradients
// ============================================

export const gradients = {
  accent: "linear-gradient(135deg, #fce7f3 0%, #dbeafe 100%)",
  accentAlt: "linear-gradient(135deg, #dbeafe 0%, #f3e8ff 100%)",
  header: "linear-gradient(135deg, #2563eb 0%, #3b82f6 100%)",
};

// ============================================
// Shadows
// ============================================

export const shadows = {
  card: "0 1px 3px rgba(0, 0, 0, 0.05), 0 1px 2px rgba(0, 0, 0, 0.03)",
  cardHover: "0 4px 6px rgba(0, 0, 0, 0.07), 0 2px 4px rgba(0, 0, 0, 0.05)",
  button: "0 1px 2px rgba(0, 0, 0, 0.05)",
};

// ============================================
// Spacing
// ============================================

export const spacing = {
  xs: "4px",
  sm: "8px",
  md: "16px",
  lg: "24px",
  xl: "32px",
  xxl: "48px",
};

// ============================================
// Border Radius
// ============================================

export const radius = {
  sm: "6px",
  md: "8px",
  lg: "12px",
  xl: "16px",
  full: "9999px",
};

// ============================================
// Common Component Styles
// ============================================

export const componentStyles = {
  // Main container on the body background
  body: {
    backgroundColor: colors.background,
    fontFamily,
    margin: 0,
    padding: "40px 16px",
  } as React.CSSProperties,

  // Main email container
  container: {
    backgroundColor: colors.background,
    margin: "0 auto",
    maxWidth: "600px",
  } as React.CSSProperties,

  // White content card
  contentCard: {
    backgroundColor: colors.cardWhite,
    borderRadius: radius.xl,
    boxShadow: shadows.card,
    padding: spacing.xl,
    margin: `0 0 ${spacing.md} 0`,
  } as React.CSSProperties,

  // Link styles
  link: {
    color: colors.primaryBlue,
    textDecoration: "none",
  } as React.CSSProperties,

  // Divider
  divider: {
    borderColor: colors.divider,
    borderWidth: "1px",
    borderStyle: "solid",
    borderTop: "none",
    borderLeft: "none",
    borderRight: "none",
    margin: `${spacing.lg} 0`,
  } as React.CSSProperties,
};
