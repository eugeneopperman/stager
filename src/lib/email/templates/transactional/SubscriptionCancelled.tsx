import { Text, Hr, Link, Section } from "@react-email/components";
import * as React from "react";
import { Layout, Button, Card, styles } from "../components";

interface SubscriptionCancelledEmailProps {
  firstName: string;
  planName: string;
  creditsRemaining: number;
  expiresAt: string;
  reactivateUrl: string;
  feedbackUrl?: string;
  appUrl: string;
}

export function SubscriptionCancelledEmail({
  firstName,
  planName,
  creditsRemaining,
  expiresAt,
  reactivateUrl,
  feedbackUrl,
  appUrl,
}: SubscriptionCancelledEmailProps) {
  return (
    <Layout preview="We're sorry to see you go">
      <Text style={styles.heading}>We're sorry to see you go</Text>

      <Text style={styles.paragraph}>
        Hi {firstName},
      </Text>

      <Text style={styles.paragraph}>
        Your <strong>{planName}</strong> subscription has been cancelled.
        We're sad to see you go, but we understand.
      </Text>

      <Card variant="info">
        <Text style={{ ...styles.paragraph, margin: "0 0 12px 0" }}>
          <strong>What happens next:</strong>
        </Text>
        <ul style={styles.list}>
          <li style={styles.listItem}>
            Your access continues until <strong>{expiresAt}</strong>
          </li>
          <li style={styles.listItem}>
            You still have <strong>{creditsRemaining} credits</strong> to use
          </li>
          <li style={styles.listItem}>
            Your staged photos remain accessible in your account
          </li>
        </ul>
      </Card>

      <Text style={styles.paragraph}>
        Changed your mind? You can reactivate your subscription at any time.
      </Text>

      <Section style={styles.buttonContainer}>
        <Button href={reactivateUrl}>Reactivate Subscription</Button>
      </Section>

      <Hr style={styles.divider} />

      {feedbackUrl && (
        <Text style={styles.smallText}>
          We'd love to hear why you cancelled.{" "}
          <Link href={feedbackUrl} style={styles.link}>
            Share your feedback
          </Link>{" "}
          to help us improve.
        </Text>
      )}

      <Text style={styles.smallText}>
        Thanks for being a Stager customer. We hope to see you again!
      </Text>
    </Layout>
  );
}

export default SubscriptionCancelledEmail;
