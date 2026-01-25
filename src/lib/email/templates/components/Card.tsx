import { Section, Text } from "@react-email/components";
import * as React from "react";
import { colors, radius, shadows, spacing, typography } from "./styles";

interface CardProps {
  children: React.ReactNode;
  variant?: "default" | "success" | "warning" | "info" | "feature" | "highlight";
  noPadding?: boolean;
}

export function Card({ children, variant = "default", noPadding = false }: CardProps) {
  const styles = {
    default: defaultCard,
    success: successCard,
    warning: warningCard,
    info: infoCard,
    feature: featureCard,
    highlight: featureCard, // Alias for backwards compatibility
  };

  return (
    <Section style={{ ...styles[variant], ...(noPadding ? { padding: 0 } : {}) }}>
      {children}
    </Section>
  );
}

interface StatCardProps {
  label: string;
  value: string | number;
  trend?: string;
  isPositive?: boolean;
}

export function StatCard({ label, value, trend, isPositive }: StatCardProps) {
  return (
    <td style={statCardCell}>
      <div style={statCardInner}>
        <Text style={statValue}>{value}</Text>
        <Text style={statLabel}>{label}</Text>
        {trend && (
          <Text
            style={{
              ...statTrend,
              color: isPositive ? colors.success : colors.error,
            }}
          >
            {isPositive ? "↑" : "↓"} {trend}
          </Text>
        )}
      </div>
    </td>
  );
}

interface StatsRowProps {
  children: React.ReactNode;
}

export function StatsRow({ children }: StatsRowProps) {
  return (
    <table cellPadding="0" cellSpacing="0" style={statsTable}>
      <tbody>
        <tr>{children}</tr>
      </tbody>
    </table>
  );
}

// Base card style
const baseCard: React.CSSProperties = {
  backgroundColor: colors.cardWhite,
  borderRadius: radius.xl,
  boxShadow: shadows.card,
  padding: spacing.xl,
  marginBottom: spacing.md,
};

const defaultCard: React.CSSProperties = {
  ...baseCard,
};

const successCard: React.CSSProperties = {
  ...baseCard,
  borderLeft: `4px solid ${colors.success}`,
};

const warningCard: React.CSSProperties = {
  ...baseCard,
  borderLeft: `4px solid ${colors.warning}`,
};

const infoCard: React.CSSProperties = {
  ...baseCard,
  borderLeft: `4px solid ${colors.info}`,
};

const featureCard: React.CSSProperties = {
  ...baseCard,
  background: `linear-gradient(135deg, ${colors.softPink} 0%, ${colors.softBlue} 100%)`,
  boxShadow: "none",
};

// Stats styles
const statsTable: React.CSSProperties = {
  width: "100%",
  marginBottom: spacing.md,
};

const statCardCell: React.CSSProperties = {
  width: "50%",
  padding: "8px",
  verticalAlign: "top",
};

const statCardInner: React.CSSProperties = {
  backgroundColor: colors.cardWhite,
  borderRadius: radius.lg,
  boxShadow: shadows.card,
  padding: spacing.lg,
  textAlign: "center" as const,
};

const statValue: React.CSSProperties = {
  ...typography.heroHeading,
  fontSize: "32px",
  margin: "0 0 4px 0",
};

const statLabel: React.CSSProperties = {
  ...typography.smallText,
  margin: 0,
};

const statTrend: React.CSSProperties = {
  fontSize: "13px",
  fontWeight: "600",
  margin: "8px 0 0 0",
};

export default Card;
