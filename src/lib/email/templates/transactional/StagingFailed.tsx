import { Text, Hr, Link, Section } from "@react-email/components";
import * as React from "react";
import { Layout, Button, Card, styles } from "../components";

interface StagingFailedEmailProps {
  firstName: string;
  roomType: string;
  errorMessage?: string;
  retryUrl: string;
  supportUrl: string;
  appUrl: string;
  unsubscribeUrl: string;
}

export function StagingFailedEmail({
  firstName,
  roomType,
  errorMessage,
  retryUrl,
  supportUrl,
  appUrl,
  unsubscribeUrl,
}: StagingFailedEmailProps) {
  return (
    <Layout
      preview="We hit a snag with your staging - let's try again"
      unsubscribeUrl={unsubscribeUrl}
    >
      <Text style={styles.heading}>We hit a snag with your staging</Text>

      <Text style={styles.paragraph}>
        Hi {firstName},
      </Text>

      <Text style={styles.paragraph}>
        Unfortunately, we encountered an issue while staging your{" "}
        {roomType.toLowerCase()}. Don't worry - your credit has been refunded
        and you can try again.
      </Text>

      {errorMessage && (
        <Card variant="warning">
          <Text style={{ ...styles.smallText, margin: 0 }}>
            <strong>Error details:</strong> {errorMessage}
          </Text>
        </Card>
      )}

      <Card variant="info">
        <Text style={{ ...styles.paragraph, margin: "0 0 12px 0" }}>
          <strong>Tips for better results:</strong>
        </Text>
        <ul style={styles.list}>
          <li style={styles.listItem}>
            Use well-lit photos with clear room boundaries
          </li>
          <li style={styles.listItem}>
            Ensure the room is empty or has minimal furniture
          </li>
          <li style={styles.listItem}>
            Avoid photos with heavy shadows or obstructions
          </li>
          <li style={styles.listItem}>
            Use landscape orientation for best results
          </li>
        </ul>
      </Card>

      <Section style={styles.buttonContainer}>
        <Button href={retryUrl}>Try Again</Button>
      </Section>

      <Hr style={styles.divider} />

      <Text style={styles.smallText}>
        Still having trouble?{" "}
        <Link href={supportUrl} style={styles.link}>
          Contact our support team
        </Link>{" "}
        and we'll help you get staged.
      </Text>
    </Layout>
  );
}

export default StagingFailedEmail;
