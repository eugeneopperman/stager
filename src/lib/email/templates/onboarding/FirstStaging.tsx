import { Text, Hr, Section, Img } from "@react-email/components";
import * as React from "react";
import { Layout, Button, Card, styles } from "../components";

interface FirstStagingEmailProps {
  firstName: string;
  appUrl: string;
  unsubscribeUrl: string;
}

export function FirstStagingEmail({
  firstName,
  appUrl,
  unsubscribeUrl,
}: FirstStagingEmailProps) {
  return (
    <Layout
      preview="Ready to stage your first photo? Here's how to get started."
      unsubscribeUrl={unsubscribeUrl}
    >
      <Text style={styles.heading}>Ready to stage your first photo?</Text>

      <Text style={styles.paragraph}>
        Hi {firstName},
      </Text>

      <Text style={styles.paragraph}>
        Creating your first virtual staging takes just 3 simple steps. Let me
        walk you through it:
      </Text>

      <Card variant="default">
        <Text style={stepNumber}>1</Text>
        <Text style={stepTitle}>Upload Your Photo</Text>
        <Text style={{ ...styles.smallText, margin: 0 }}>
          Drag and drop or click to upload. Empty rooms work best, but we can
          handle rooms with some existing furniture too.
        </Text>
      </Card>

      <Card variant="default">
        <Text style={stepNumber}>2</Text>
        <Text style={stepTitle}>Choose Your Style</Text>
        <Text style={{ ...styles.smallText, margin: 0 }}>
          Select from 9 professional furniture styles: Modern, Traditional,
          Minimalist, Mid-Century Modern, Scandinavian, Industrial, Coastal,
          Farmhouse, or Luxury.
        </Text>
      </Card>

      <Card variant="default">
        <Text style={stepNumber}>3</Text>
        <Text style={stepTitle}>Generate & Download</Text>
        <Text style={{ ...styles.smallText, margin: 0 }}>
          Click generate and watch the magic happen. Your staged photo will be
          ready in seconds.
        </Text>
      </Card>

      <Section style={styles.buttonContainer}>
        <Button href={`${appUrl}/stage`}>Start Staging Now</Button>
      </Section>

      <Hr style={styles.divider} />

      <Card variant="info">
        <Text style={{ ...styles.paragraph, margin: "0 0 8px 0" }}>
          <strong>Pro tip:</strong> For best results, use photos that are:
        </Text>
        <ul style={{ ...styles.list, margin: 0 }}>
          <li style={styles.listItem}>Well-lit with natural light</li>
          <li style={styles.listItem}>Landscape orientation (wider than tall)</li>
          <li style={styles.listItem}>
            Free of clutter and personal items
          </li>
        </ul>
      </Card>

      <Text style={styles.smallText}>
        Need help? Just reply to this email and we'll guide you through the
        process.
      </Text>
    </Layout>
  );
}

const stepNumber: React.CSSProperties = {
  fontSize: "32px",
  fontWeight: "700",
  color: "#7c3aed",
  margin: "0 0 8px 0",
  lineHeight: "1",
};

const stepTitle: React.CSSProperties = {
  fontSize: "16px",
  fontWeight: "600",
  color: "#18181b",
  margin: "0 0 8px 0",
};

export default FirstStagingEmail;
