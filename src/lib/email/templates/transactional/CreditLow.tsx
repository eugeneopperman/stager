import { Text, Hr, Link, Section } from "@react-email/components";
import * as React from "react";
import { Layout, Button, Card, styles } from "../components";

interface CreditLowEmailProps {
  firstName: string;
  creditsRemaining: number;
  billingUrl: string;
  appUrl: string;
  unsubscribeUrl: string;
}

export function CreditLowEmail({
  firstName,
  creditsRemaining,
  billingUrl,
  appUrl,
  unsubscribeUrl,
}: CreditLowEmailProps) {
  return (
    <Layout
      preview={`You have ${creditsRemaining} staging credits remaining`}
      unsubscribeUrl={unsubscribeUrl}
    >
      <Text style={styles.heading}>Running low on credits</Text>

      <Text style={styles.paragraph}>
        Hi {firstName},
      </Text>

      <Text style={styles.paragraph}>
        Just a heads up - you have{" "}
        <strong>
          {creditsRemaining} staging credit{creditsRemaining !== 1 ? "s" : ""}
        </strong>{" "}
        remaining. Top up now to keep staging without interruption.
      </Text>

      <Card variant="warning">
        <Section style={{ textAlign: "center" as const }}>
          <Text
            style={{
              fontSize: "48px",
              fontWeight: "700",
              color: "#f59e0b",
              margin: "0 0 8px 0",
            }}
          >
            {creditsRemaining}
          </Text>
          <Text style={{ ...styles.smallText, margin: 0 }}>
            credits remaining
          </Text>
        </Section>
      </Card>

      <Section style={styles.buttonContainer}>
        <Button href={billingUrl}>Add More Credits</Button>
      </Section>

      <Hr style={styles.divider} />

      <Text style={styles.smallText}>
        Questions about credits?{" "}
        <Link href={`${appUrl}/help`} style={styles.link}>
          Visit our help center
        </Link>
      </Text>
    </Layout>
  );
}

export default CreditLowEmail;
