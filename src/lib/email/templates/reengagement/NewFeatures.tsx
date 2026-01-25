import { Text, Hr, Section } from "@react-email/components";
import * as React from "react";
import { Layout, Button, Card, styles } from "../components";

interface NewFeaturesEmailProps {
  firstName: string;
  appUrl: string;
  unsubscribeUrl: string;
}

export function NewFeaturesEmail({
  firstName,
  appUrl,
  unsubscribeUrl,
}: NewFeaturesEmailProps) {
  return (
    <Layout
      preview="See what's new in Stager - exciting updates you'll love"
      unsubscribeUrl={unsubscribeUrl}
    >
      <Text style={styles.heading}>See What's New in Stager</Text>

      <Text style={styles.paragraph}>
        Hi {firstName},
      </Text>

      <Text style={styles.paragraph}>
        We've been busy improving Stager based on feedback from agents like you.
        Here's what's new:
      </Text>

      <Card variant="success">
        <Text style={featureTitle}>Batch Staging</Text>
        <Text style={{ ...styles.smallText, margin: 0 }}>
          Stage up to 10 photos at once. Perfect for full property photoshoots.
          Just upload, select your style, and let Stager do the rest.
        </Text>
      </Card>

      <Card variant="success">
        <Text style={featureTitle}>Remix Feature</Text>
        <Text style={{ ...styles.smallText, margin: 0 }}>
          Not happy with the result? Remix lets you try a different arrangement
          without using another credit. Iterate until it's perfect.
        </Text>
      </Card>

      <Card variant="success">
        <Text style={featureTitle}>Property Organization</Text>
        <Text style={{ ...styles.smallText, margin: 0 }}>
          Keep your stagings organized by property. Download all photos for a
          listing with a single click.
        </Text>
      </Card>

      <Card variant="success">
        <Text style={featureTitle}>Before/After Comparisons</Text>
        <Text style={{ ...styles.smallText, margin: 0 }}>
          Use our interactive slider to showcase transformations to clients.
          Great for listing presentations.
        </Text>
      </Card>

      <Section style={styles.buttonContainer}>
        <Button href={`${appUrl}/stage`}>Try the New Features</Button>
      </Section>

      <Hr style={styles.divider} />

      <Text style={styles.smallText}>
        Got feature ideas? We'd love to hear them - just reply to this email.
      </Text>
    </Layout>
  );
}

const featureTitle: React.CSSProperties = {
  fontSize: "16px",
  fontWeight: "600",
  color: "#18181b",
  margin: "0 0 8px 0",
};

export default NewFeaturesEmail;
