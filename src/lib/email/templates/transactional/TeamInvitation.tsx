import { Text, Section } from "@react-email/components";
import * as React from "react";
import { Layout, Button, Card, GradientAccent, styles, colors, spacing } from "../components";

interface TeamInvitationEmailProps {
  inviterName: string;
  organizationName: string;
  initialCredits: number;
  acceptUrl: string;
  expiresInDays: number;
  appUrl?: string;
}

export function TeamInvitationEmail({
  inviterName = "Alex",
  organizationName = "Acme Realty",
  initialCredits = 20,
  acceptUrl = "https://stager.app/invite/accept?token=xxx",
  expiresInDays = 7,
  appUrl = "https://stager.app",
}: TeamInvitationEmailProps) {
  return (
    <Layout preview={`You've been invited to join ${organizationName} on Stager`}>
      {/* Hero Card */}
      <Card>
        <GradientAccent />
        <Section style={{ textAlign: "center" as const }}>
          <div style={inviteIcon}>
            <Text style={inviteIconText}>🎉</Text>
          </div>
          <Text style={styles.heading}>You're invited!</Text>
        </Section>
        <Text style={{ ...styles.paragraph, textAlign: "center" as const }}>
          <strong>{inviterName}</strong> has invited you to join{" "}
          <strong>{organizationName}</strong> on Stager.
        </Text>
      </Card>

      {/* Credits Card */}
      {initialCredits > 0 && (
        <Card variant="success">
          <Section style={{ textAlign: "center" as const }}>
            <Text style={creditsValue}>{initialCredits}</Text>
            <Text style={creditsLabel}>staging credits allocated to you</Text>
          </Section>
        </Card>
      )}

      {/* Features Card */}
      <Card>
        <Text style={styles.subheading}>With Stager, you can</Text>

        <table cellPadding="0" cellSpacing="0" style={{ width: "100%" }}>
          <tbody>
            <tr>
              <td style={featureIconCell}>
                <div style={featureIcon}>
                  <Text style={featureIconText}>🏠</Text>
                </div>
              </td>
              <td style={featureTextCell}>
                <Text style={featureText}>Transform empty rooms into beautifully staged spaces</Text>
              </td>
            </tr>
            <tr>
              <td style={featureIconCell}>
                <div style={featureIcon}>
                  <Text style={featureIconText}>🎨</Text>
                </div>
              </td>
              <td style={featureTextCell}>
                <Text style={featureText}>Choose from 9 professional furniture styles</Text>
              </td>
            </tr>
            <tr>
              <td style={featureIconCell}>
                <div style={featureIcon}>
                  <Text style={featureIconText}>⚡</Text>
                </div>
              </td>
              <td style={featureTextCell}>
                <Text style={featureText}>Get results in seconds, not days</Text>
              </td>
            </tr>
            <tr>
              <td style={featureIconCell}>
                <div style={featureIcon}>
                  <Text style={featureIconText}>👥</Text>
                </div>
              </td>
              <td style={featureTextCell}>
                <Text style={featureText}>Collaborate with your team on property listings</Text>
              </td>
            </tr>
          </tbody>
        </table>

        <Section style={styles.buttonContainer}>
          <Button href={acceptUrl}>Accept Invitation</Button>
        </Section>

        <Text style={expiresText}>
          This invitation expires in{" "}
          <strong>{expiresInDays} day{expiresInDays !== 1 ? "s" : ""}</strong>
        </Text>
      </Card>

      {/* Info Card */}
      <Card>
        <Text style={{ ...styles.smallText, margin: 0, textAlign: "center" as const }}>
          If you didn't expect this invitation, you can safely ignore this email.
        </Text>
      </Card>
    </Layout>
  );
}

const inviteIcon: React.CSSProperties = {
  width: "56px",
  height: "56px",
  backgroundColor: colors.softBlue,
  borderRadius: "50%",
  margin: "0 auto 16px auto",
  textAlign: "center" as const,
  lineHeight: "56px",
};

const inviteIconText: React.CSSProperties = {
  fontSize: "28px",
  margin: 0,
  lineHeight: "56px",
};

const creditsValue: React.CSSProperties = {
  fontSize: "36px",
  fontWeight: "700",
  color: colors.success,
  margin: "0 0 4px 0",
  lineHeight: "1.1",
};

const creditsLabel: React.CSSProperties = {
  fontSize: "14px",
  color: colors.textSecondary,
  margin: 0,
};

const featureIconCell: React.CSSProperties = {
  width: "40px",
  paddingBottom: spacing.sm,
  verticalAlign: "middle",
};

const featureIcon: React.CSSProperties = {
  width: "32px",
  height: "32px",
  backgroundColor: colors.softBlue,
  borderRadius: "8px",
  textAlign: "center" as const,
  lineHeight: "32px",
};

const featureIconText: React.CSSProperties = {
  fontSize: "14px",
  margin: 0,
  lineHeight: "32px",
};

const featureTextCell: React.CSSProperties = {
  paddingBottom: spacing.sm,
  paddingLeft: spacing.sm,
  verticalAlign: "middle",
};

const featureText: React.CSSProperties = {
  fontSize: "14px",
  color: colors.textSecondary,
  margin: 0,
};

const expiresText: React.CSSProperties = {
  fontSize: "13px",
  color: colors.textMuted,
  textAlign: "center" as const,
  margin: 0,
};

export default TeamInvitationEmail;
