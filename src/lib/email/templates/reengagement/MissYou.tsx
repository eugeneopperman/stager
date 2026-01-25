import { Text, Section } from "@react-email/components";
import * as React from "react";
import { Layout, Button, Card, GradientAccent, styles, colors, spacing } from "../components";

interface MissYouEmailProps {
  firstName: string;
  credits: number;
  appUrl?: string;
  unsubscribeUrl?: string;
}

export function MissYouEmail({
  firstName = "there",
  credits = 10,
  appUrl = "https://stager.app",
  unsubscribeUrl,
}: MissYouEmailProps) {
  return (
    <Layout
      preview={`We miss you! You still have ${credits} staging credits waiting.`}
      unsubscribeUrl={unsubscribeUrl}
    >
      {/* Hero Card */}
      <Card>
        <GradientAccent variant="alt" />
        <Text style={styles.heading}>We miss you, {firstName}!</Text>
        <Text style={styles.paragraph}>
          It's been a little while since you last staged a photo. Your credits are
          ready and waiting to transform your property listings.
        </Text>
      </Card>

      {/* Credits Card */}
      <Card variant="feature">
        <Section style={{ textAlign: "center" as const }}>
          <Text style={creditsEmoji}>👋</Text>
          <Text style={creditsValue}>{credits}</Text>
          <Text style={creditsLabel}>staging credits waiting for you</Text>
        </Section>
      </Card>

      {/* Benefits Card */}
      <Card>
        <Text style={styles.subheading}>Virtual staging can help you</Text>

        <table cellPadding="0" cellSpacing="0" style={{ width: "100%" }}>
          <tbody>
            <tr>
              <td style={benefitIconCell}>
                <div style={benefitIcon}>
                  <Text style={benefitIconText}>🚀</Text>
                </div>
              </td>
              <td style={benefitTextCell}>
                <Text style={benefitTitle}>Sell faster</Text>
                <Text style={benefitDesc}>Staged homes sell 73% faster on average</Text>
              </td>
            </tr>
            <tr>
              <td style={benefitIconCell}>
                <div style={benefitIcon}>
                  <Text style={benefitIconText}>💰</Text>
                </div>
              </td>
              <td style={benefitTextCell}>
                <Text style={benefitTitle}>Get higher offers</Text>
                <Text style={benefitDesc}>Buyers can visualize the space</Text>
              </td>
            </tr>
            <tr>
              <td style={benefitIconCell}>
                <div style={benefitIcon}>
                  <Text style={benefitIconText}>⭐</Text>
                </div>
              </td>
              <td style={benefitTextCell}>
                <Text style={benefitTitle}>Stand out</Text>
                <Text style={benefitDesc}>Make your listings memorable</Text>
              </td>
            </tr>
          </tbody>
        </table>

        <Section style={styles.buttonContainer}>
          <Button href={`${appUrl}/stage`}>Stage a Photo Now</Button>
        </Section>
      </Card>

      {/* Help Card */}
      <Card>
        <Text style={{ ...styles.smallText, margin: 0, textAlign: "center" as const }}>
          Need help getting started? Just reply to this email - we're here for you.
        </Text>
      </Card>
    </Layout>
  );
}

const creditsEmoji: React.CSSProperties = {
  fontSize: "32px",
  margin: "0 0 8px 0",
};

const creditsValue: React.CSSProperties = {
  fontSize: "48px",
  fontWeight: "700",
  color: colors.primaryBlue,
  margin: "0 0 4px 0",
  lineHeight: "1.1",
};

const creditsLabel: React.CSSProperties = {
  fontSize: "14px",
  color: colors.textSecondary,
  margin: 0,
};

const benefitIconCell: React.CSSProperties = {
  width: "48px",
  paddingBottom: spacing.md,
  verticalAlign: "top",
};

const benefitIcon: React.CSSProperties = {
  width: "40px",
  height: "40px",
  backgroundColor: colors.softBlue,
  borderRadius: "10px",
  textAlign: "center" as const,
  lineHeight: "40px",
};

const benefitIconText: React.CSSProperties = {
  fontSize: "18px",
  margin: 0,
  lineHeight: "40px",
};

const benefitTextCell: React.CSSProperties = {
  paddingBottom: spacing.md,
  paddingLeft: spacing.sm,
  verticalAlign: "top",
};

const benefitTitle: React.CSSProperties = {
  fontSize: "15px",
  fontWeight: "600",
  color: colors.textPrimary,
  margin: "0 0 2px 0",
};

const benefitDesc: React.CSSProperties = {
  fontSize: "14px",
  color: colors.textMuted,
  margin: 0,
};

export default MissYouEmail;
