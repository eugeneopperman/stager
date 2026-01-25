import { Text, Hr, Section } from "@react-email/components";
import * as React from "react";
import { Layout, Button, Card, styles } from "../components";

interface TeamInvitationEmailProps {
  inviterName: string;
  organizationName: string;
  initialCredits: number;
  acceptUrl: string;
  expiresInDays: number;
  appUrl: string;
}

export function TeamInvitationEmail({
  inviterName,
  organizationName,
  initialCredits,
  acceptUrl,
  expiresInDays,
  appUrl,
}: TeamInvitationEmailProps) {
  return (
    <Layout preview={`You've been invited to join ${organizationName} on Stager`}>
      <Text style={styles.heading}>You're invited to join a team!</Text>

      <Text style={styles.paragraph}>
        <strong>{inviterName}</strong> has invited you to join{" "}
        <strong>{organizationName}</strong> on Stager, the AI-powered virtual
        staging platform.
      </Text>

      {initialCredits > 0 && (
        <Card variant="success">
          <Section style={{ textAlign: "center" as const }}>
            <Text
              style={{
                fontSize: "36px",
                fontWeight: "700",
                color: "#10b981",
                margin: "0 0 4px 0",
              }}
            >
              {initialCredits}
            </Text>
            <Text style={{ ...styles.smallText, margin: 0 }}>
              staging credits allocated to you
            </Text>
          </Section>
        </Card>
      )}

      <Card variant="highlight">
        <Text style={{ ...styles.paragraph, margin: "0 0 12px 0" }}>
          <strong>With Stager, you can:</strong>
        </Text>
        <ul style={styles.list}>
          <li style={styles.listItem}>
            Transform empty rooms into beautifully staged spaces
          </li>
          <li style={styles.listItem}>Choose from 9 professional furniture styles</li>
          <li style={styles.listItem}>Get results in seconds, not days</li>
          <li style={styles.listItem}>Collaborate with your team on property listings</li>
        </ul>
      </Card>

      <Section style={styles.buttonContainer}>
        <Button href={acceptUrl}>Accept Invitation</Button>
      </Section>

      <Text style={styles.smallText}>
        This invitation expires in{" "}
        <strong>
          {expiresInDays} day{expiresInDays !== 1 ? "s" : ""}
        </strong>
        .
      </Text>

      <Hr style={styles.divider} />

      <Text style={styles.smallText}>
        If you didn't expect this invitation, you can safely ignore this email.
      </Text>
    </Layout>
  );
}

export default TeamInvitationEmail;
