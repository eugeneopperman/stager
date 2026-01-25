export { Layout } from "./Layout";
export { Header } from "./Header";
export { Footer } from "./Footer";
export { Button } from "./Button";
export { Card, StatCard, StatsRow } from "./Card";
export { ImagePreview, BeforeAfterPreview } from "./ImagePreview";
export { GradientAccent } from "./GradientAccent";
export { ThumbnailGrid, Thumbnail, ImageShowcase } from "./ThumbnailGrid";

// Re-export colors and typography for direct access
export { colors, typography, gradients, radius, spacing, shadows } from "./styles";

// Shared styles for use in templates (using new design system)
import { colors, radius, spacing } from "./styles";

export const styles = {
  heading: {
    fontSize: "28px",
    fontWeight: "700",
    color: colors.textPrimary,
    margin: "0 0 16px 0",
    lineHeight: "1.2",
  } as React.CSSProperties,

  subheading: {
    fontSize: "20px",
    fontWeight: "600",
    color: colors.textPrimary,
    margin: "24px 0 12px 0",
    lineHeight: "1.3",
  } as React.CSSProperties,

  paragraph: {
    fontSize: "16px",
    lineHeight: "1.6",
    color: colors.textSecondary,
    margin: "0 0 16px 0",
  } as React.CSSProperties,

  smallText: {
    fontSize: "14px",
    lineHeight: "1.5",
    color: colors.textMuted,
    margin: "0 0 12px 0",
  } as React.CSSProperties,

  list: {
    fontSize: "16px",
    lineHeight: "1.8",
    color: colors.textSecondary,
    paddingLeft: "20px",
    margin: "0 0 16px 0",
  } as React.CSSProperties,

  listItem: {
    marginBottom: "8px",
  } as React.CSSProperties,

  link: {
    color: colors.primaryBlue,
    textDecoration: "none",
  } as React.CSSProperties,

  bold: {
    fontWeight: "600",
    color: colors.textPrimary,
  } as React.CSSProperties,

  highlight: {
    backgroundColor: colors.softBlue,
    padding: "2px 6px",
    borderRadius: radius.sm,
    color: colors.primaryBlue,
    fontWeight: "500",
  } as React.CSSProperties,

  divider: {
    borderColor: colors.divider,
    borderWidth: "1px",
    margin: `${spacing.lg} 0`,
  } as React.CSSProperties,

  center: {
    textAlign: "center" as const,
  } as React.CSSProperties,

  buttonContainer: {
    margin: `${spacing.lg} 0`,
    textAlign: "center" as const,
  } as React.CSSProperties,
};
