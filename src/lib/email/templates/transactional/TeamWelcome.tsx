import { Text, Hr, Section } from "@react-email/components";
import * as React from "react";
import { Layout, Button, Card, styles } from "../components";

interface TeamWelcomeEmailProps {
  firstName: string;
  organizationName: string;
  credits: number;
  dashboardUrl: string;
  stageUrl: string;
  appUrl: string;
}

export function TeamWelcomeEmail({
  firstName,
  organizationName,
  credits,
  dashboardUrl,
  stageUrl,
  appUrl,
}: TeamWelcomeEmailProps) {
  return (
    <Layout preview={`Welcome to ${organizationName} on Stager!`}>
      <Text style={styles.heading}>Welcome to {organizationName}!</Text>

      <Text style={styles.paragraph}>
        Hi {firstName},
      </Text>

      <Text style={styles.paragraph}>
        You've successfully joined <strong>{organizationName}</strong> on Stager.
        You're all set to start creating stunning virtual stagings for your
        property listings.
      </Text>

      <Card variant="success">
        <Section style={{ textAlign: "center" as const }}>
          <Text
            style={{
              fontSize: "48px",
              fontWeight: "700",
              color: "#10b981",
              margin: "0 0 8px 0",
            }}
          >
            {credits}
          </Text>
          <Text style={{ ...styles.smallText, margin: 0 }}>
            staging credits available
          </Text>
        </Section>
      </Card>

      <Text style={styles.subheading}>Getting started is easy:</Text>

      <ol style={styles.list}>
        <li style={styles.listItem}>
          <strong>Upload</strong> a photo of an empty room
        </li>
        <li style={styles.listItem}>
          <strong>Choose</strong> your preferred furniture style
        </li>
        <li style={styles.listItem}>
          <strong>Generate</strong> your staged photo in seconds
        </li>
      </ol>

      <Section style={styles.buttonContainer}>
        <Button href={stageUrl}>Stage Your First Photo</Button>
      </Section>

      <Hr style={styles.divider} />

      <Text style={styles.smallText}>
        Questions? Visit your{" "}
        <a href={dashboardUrl} style={styles.link}>
          dashboard
        </a>{" "}
        or contact your team admin.
      </Text>
    </Layout>
  );
}

export default TeamWelcomeEmail;
