export { Layout } from "./Layout";
export { Header } from "./Header";
export { Footer } from "./Footer";
export { Button } from "./Button";
export { Card, StatCard } from "./Card";
export { ImagePreview, BeforeAfterPreview } from "./ImagePreview";

// Shared styles for use in templates
export const styles = {
  heading: {
    fontSize: "24px",
    fontWeight: "700",
    color: "#18181b",
    margin: "0 0 16px 0",
    lineHeight: "1.3",
  } as React.CSSProperties,

  subheading: {
    fontSize: "18px",
    fontWeight: "600",
    color: "#27272a",
    margin: "24px 0 12px 0",
    lineHeight: "1.4",
  } as React.CSSProperties,

  paragraph: {
    fontSize: "16px",
    lineHeight: "1.6",
    color: "#3f3f46",
    margin: "0 0 16px 0",
  } as React.CSSProperties,

  smallText: {
    fontSize: "14px",
    lineHeight: "1.5",
    color: "#71717a",
    margin: "0 0 12px 0",
  } as React.CSSProperties,

  list: {
    fontSize: "16px",
    lineHeight: "1.8",
    color: "#3f3f46",
    paddingLeft: "20px",
    margin: "0 0 16px 0",
  } as React.CSSProperties,

  listItem: {
    marginBottom: "8px",
  } as React.CSSProperties,

  link: {
    color: "#7c3aed",
    textDecoration: "underline",
  } as React.CSSProperties,

  bold: {
    fontWeight: "600",
    color: "#18181b",
  } as React.CSSProperties,

  highlight: {
    backgroundColor: "#faf5ff",
    padding: "2px 6px",
    borderRadius: "4px",
    color: "#7c3aed",
    fontWeight: "500",
  } as React.CSSProperties,

  divider: {
    borderColor: "#e4e4e7",
    borderWidth: "1px",
    margin: "24px 0",
  } as React.CSSProperties,

  center: {
    textAlign: "center" as const,
  } as React.CSSProperties,

  buttonContainer: {
    margin: "24px 0",
    textAlign: "center" as const,
  } as React.CSSProperties,
};
