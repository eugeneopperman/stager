import { Text, Hr, Section } from "@react-email/components";
import * as React from "react";
import { Layout, Button, Card, styles } from "../components";

interface MissYouEmailProps {
  firstName: string;
  credits: number;
  appUrl: string;
  unsubscribeUrl: string;
}

export function MissYouEmail({
  firstName,
  credits,
  appUrl,
  unsubscribeUrl,
}: MissYouEmailProps) {
  return (
    <Layout
      preview={`We miss you! You still have ${credits} staging credits waiting.`}
      unsubscribeUrl={unsubscribeUrl}
    >
      <Text style={styles.heading}>We miss you, {firstName}!</Text>

      <Text style={styles.paragraph}>
        It's been a little while since you last staged a photo. Your credits are
        ready and waiting to transform your property listings.
      </Text>

      <Card variant="highlight">
        <Section style={{ textAlign: "center" as const }}>
          <Text
            style={{
              fontSize: "48px",
              fontWeight: "700",
              color: "#7c3aed",
              margin: "0 0 8px 0",
            }}
          >
            {credits}
          </Text>
          <Text style={{ ...styles.smallText, margin: 0 }}>
            staging credits waiting for you
          </Text>
        </Section>
      </Card>

      <Text style={styles.paragraph}>
        Have a new listing coming up? Virtual staging can help you:
      </Text>

      <ul style={styles.list}>
        <li style={styles.listItem}>
          <strong>Sell faster</strong> - Staged homes sell 73% faster on average
        </li>
        <li style={styles.listItem}>
          <strong>Get higher offers</strong> - Buyers can visualize the space
        </li>
        <li style={styles.listItem}>
          <strong>Stand out</strong> - Make your listings memorable
        </li>
      </ul>

      <Section style={styles.buttonContainer}>
        <Button href={`${appUrl}/stage`}>Stage a Photo Now</Button>
      </Section>

      <Hr style={styles.divider} />

      <Text style={styles.smallText}>
        Need help getting started? Just reply to this email - we're here for
        you.
      </Text>
    </Layout>
  );
}

export default MissYouEmail;
