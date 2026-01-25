import { Text, Hr, Section } from "@react-email/components";
import * as React from "react";
import { Layout, Button, Card, styles } from "../components";

interface WelcomeEmailProps {
  firstName: string;
  credits: number;
  appUrl: string;
  unsubscribeUrl: string;
}

export function WelcomeEmail({
  firstName,
  credits,
  appUrl,
  unsubscribeUrl,
}: WelcomeEmailProps) {
  return (
    <Layout
      preview="Welcome to Stager! Transform empty rooms into beautifully staged spaces."
      unsubscribeUrl={unsubscribeUrl}
    >
      <Text style={styles.heading}>Welcome to Stager, {firstName}!</Text>

      <Text style={styles.paragraph}>
        You've just unlocked the power of AI-driven virtual staging. Transform
        empty property photos into beautifully staged spaces in seconds - no
        photographers, no furniture rentals, no waiting.
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
            staging credits ready to use
          </Text>
        </Section>
      </Card>

      <Text style={styles.subheading}>Here's what you can do:</Text>

      <Card variant="highlight">
        <ul style={{ ...styles.list, margin: 0 }}>
          <li style={styles.listItem}>
            <strong>Upload any property photo</strong> - empty rooms work best
          </li>
          <li style={styles.listItem}>
            <strong>Choose from 9 furniture styles</strong> - Modern, Farmhouse,
            Scandinavian, and more
          </li>
          <li style={styles.listItem}>
            <strong>Get professional staging in seconds</strong> - AI does the
            heavy lifting
          </li>
          <li style={styles.listItem}>
            <strong>Remix and iterate</strong> - Try different styles until it's
            perfect
          </li>
        </ul>
      </Card>

      <Section style={styles.buttonContainer}>
        <Button href={`${appUrl}/stage`}>Stage Your First Photo</Button>
      </Section>

      <Hr style={styles.divider} />

      <Text style={styles.smallText}>
        Questions? Just reply to this email - we're here to help you succeed
        with Stager.
      </Text>
    </Layout>
  );
}

export default WelcomeEmail;
