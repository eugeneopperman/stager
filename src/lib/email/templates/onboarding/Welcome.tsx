import { Text, Section } from "@react-email/components";
import * as React from "react";
import { Layout, Button, Card, GradientAccent, styles, colors, spacing } from "../components";

interface WelcomeEmailProps {
  firstName: string;
  credits: number;
  appUrl?: string;
  unsubscribeUrl?: string;
}

export function WelcomeEmail({
  firstName = "there",
  credits = 10,
  appUrl = "https://stager.app",
  unsubscribeUrl,
}: WelcomeEmailProps) {
  return (
    <Layout
      preview="Welcome to Stager! Transform empty rooms into beautifully staged spaces."
      unsubscribeUrl={unsubscribeUrl}
    >
      {/* Hero Card */}
      <Card>
        <GradientAccent />
        <Text style={styles.heading}>Welcome to Stager, {firstName}!</Text>
        <Text style={styles.paragraph}>
          You've just unlocked the power of AI-driven virtual staging. Transform
          empty property photos into beautifully staged spaces in seconds.
        </Text>
        <Section style={styles.buttonContainer}>
          <Button href={`${appUrl}/stage`}>Stage Your First Photo</Button>
        </Section>
      </Card>

      {/* Credits Card */}
      <Card variant="feature">
        <Section style={{ textAlign: "center" as const }}>
          <Text style={creditsValue}>{credits}</Text>
          <Text style={creditsLabel}>staging credits ready to use</Text>
        </Section>
      </Card>

      {/* Features Card */}
      <Card>
        <Text style={styles.subheading}>Here's what you can do</Text>

        <table cellPadding="0" cellSpacing="0" style={{ width: "100%" }}>
          <tbody>
            <tr>
              <td style={featureIconCell}>
                <div style={featureIcon}>
                  <Text style={featureIconText}>📸</Text>
                </div>
              </td>
              <td style={featureTextCell}>
                <Text style={featureTitle}>Upload any property photo</Text>
                <Text style={featureDesc}>Empty rooms work best for stunning results</Text>
              </td>
            </tr>
            <tr>
              <td style={featureIconCell}>
                <div style={featureIcon}>
                  <Text style={featureIconText}>🎨</Text>
                </div>
              </td>
              <td style={featureTextCell}>
                <Text style={featureTitle}>Choose from 9 furniture styles</Text>
                <Text style={featureDesc}>Modern, Farmhouse, Scandinavian, and more</Text>
              </td>
            </tr>
            <tr>
              <td style={featureIconCell}>
                <div style={featureIcon}>
                  <Text style={featureIconText}>⚡</Text>
                </div>
              </td>
              <td style={featureTextCell}>
                <Text style={featureTitle}>Get professional staging in seconds</Text>
                <Text style={featureDesc}>AI does the heavy lifting for you</Text>
              </td>
            </tr>
            <tr>
              <td style={featureIconCell}>
                <div style={featureIcon}>
                  <Text style={featureIconText}>🔄</Text>
                </div>
              </td>
              <td style={featureTextCell}>
                <Text style={featureTitle}>Remix and iterate</Text>
                <Text style={featureDesc}>Try different styles until it's perfect</Text>
              </td>
            </tr>
          </tbody>
        </table>
      </Card>

      {/* Help Card */}
      <Card>
        <Text style={{ ...styles.smallText, margin: 0, textAlign: "center" as const }}>
          Questions? Just reply to this email - we're here to help!
        </Text>
      </Card>
    </Layout>
  );
}

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

const featureIconCell: React.CSSProperties = {
  width: "48px",
  paddingBottom: spacing.md,
  verticalAlign: "top",
};

const featureIcon: React.CSSProperties = {
  width: "40px",
  height: "40px",
  backgroundColor: colors.softBlue,
  borderRadius: "10px",
  textAlign: "center" as const,
  lineHeight: "40px",
};

const featureIconText: React.CSSProperties = {
  fontSize: "18px",
  margin: 0,
  lineHeight: "40px",
};

const featureTextCell: React.CSSProperties = {
  paddingBottom: spacing.md,
  paddingLeft: spacing.sm,
  verticalAlign: "top",
};

const featureTitle: React.CSSProperties = {
  fontSize: "15px",
  fontWeight: "600",
  color: colors.textPrimary,
  margin: "0 0 2px 0",
};

const featureDesc: React.CSSProperties = {
  fontSize: "14px",
  color: colors.textMuted,
  margin: 0,
};

export default WelcomeEmail;
