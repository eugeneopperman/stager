import { Section, Text } from "@react-email/components";
import * as React from "react";

interface CardProps {
  children: React.ReactNode;
  variant?: "default" | "success" | "warning" | "info" | "highlight";
}

export function Card({ children, variant = "default" }: CardProps) {
  const styles = {
    default: defaultCard,
    success: successCard,
    warning: warningCard,
    info: infoCard,
    highlight: highlightCard,
  };

  return <Section style={styles[variant]}>{children}</Section>;
}

interface StatCardProps {
  label: string;
  value: string | number;
  change?: string;
  isPositive?: boolean;
}

export function StatCard({ label, value, change, isPositive }: StatCardProps) {
  return (
    <Section style={statCard}>
      <Text style={statLabel}>{label}</Text>
      <Text style={statValue}>{value}</Text>
      {change && (
        <Text
          style={{
            ...statChange,
            color: isPositive ? "#16a34a" : "#dc2626",
          }}
        >
          {isPositive ? "+" : ""}
          {change}
        </Text>
      )}
    </Section>
  );
}

const defaultCard: React.CSSProperties = {
  backgroundColor: "#f4f4f5",
  borderRadius: "8px",
  padding: "20px",
  margin: "16px 0",
};

const successCard: React.CSSProperties = {
  backgroundColor: "#ecfdf5",
  borderRadius: "8px",
  padding: "20px",
  margin: "16px 0",
  borderLeft: "4px solid #10b981",
};

const warningCard: React.CSSProperties = {
  backgroundColor: "#fffbeb",
  borderRadius: "8px",
  padding: "20px",
  margin: "16px 0",
  borderLeft: "4px solid #f59e0b",
};

const infoCard: React.CSSProperties = {
  backgroundColor: "#eff6ff",
  borderRadius: "8px",
  padding: "20px",
  margin: "16px 0",
  borderLeft: "4px solid #3b82f6",
};

const highlightCard: React.CSSProperties = {
  backgroundColor: "#faf5ff",
  borderRadius: "8px",
  padding: "20px",
  margin: "16px 0",
  borderLeft: "4px solid #7c3aed",
};

const statCard: React.CSSProperties = {
  backgroundColor: "#ffffff",
  borderRadius: "8px",
  padding: "16px",
  margin: "8px",
  border: "1px solid #e4e4e7",
  textAlign: "center" as const,
  display: "inline-block",
  minWidth: "120px",
};

const statLabel: React.CSSProperties = {
  color: "#71717a",
  fontSize: "12px",
  fontWeight: "500",
  margin: "0 0 4px 0",
  textTransform: "uppercase" as const,
  letterSpacing: "0.5px",
};

const statValue: React.CSSProperties = {
  color: "#18181b",
  fontSize: "28px",
  fontWeight: "700",
  margin: 0,
  lineHeight: "1.2",
};

const statChange: React.CSSProperties = {
  fontSize: "12px",
  fontWeight: "600",
  margin: "4px 0 0 0",
};

export default Card;
