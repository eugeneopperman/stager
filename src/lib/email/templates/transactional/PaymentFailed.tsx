import { Text, Hr, Link, Section } from "@react-email/components";
import * as React from "react";
import { Layout, Button, Card, styles } from "../components";

interface PaymentFailedEmailProps {
  firstName: string;
  amount: string;
  errorMessage?: string;
  updatePaymentUrl: string;
  supportUrl: string;
  appUrl: string;
}

export function PaymentFailedEmail({
  firstName,
  amount,
  errorMessage,
  updatePaymentUrl,
  supportUrl,
  appUrl,
}: PaymentFailedEmailProps) {
  return (
    <Layout preview="Payment issue - please update your payment method">
      <Text style={styles.heading}>Payment issue - please update</Text>

      <Text style={styles.paragraph}>
        Hi {firstName},
      </Text>

      <Text style={styles.paragraph}>
        We were unable to process your payment of <strong>{amount}</strong>.
        Please update your payment method to continue using Stager.
      </Text>

      {errorMessage && (
        <Card variant="warning">
          <Text style={{ ...styles.smallText, margin: 0 }}>
            <strong>Error:</strong> {errorMessage}
          </Text>
        </Card>
      )}

      <Card variant="info">
        <Text style={{ ...styles.paragraph, margin: "0 0 12px 0" }}>
          <strong>Common reasons for payment failure:</strong>
        </Text>
        <ul style={styles.list}>
          <li style={styles.listItem}>Insufficient funds</li>
          <li style={styles.listItem}>Expired card</li>
          <li style={styles.listItem}>Incorrect billing information</li>
          <li style={styles.listItem}>Bank declined the transaction</li>
        </ul>
      </Card>

      <Section style={styles.buttonContainer}>
        <Button href={updatePaymentUrl}>Update Payment Method</Button>
      </Section>

      <Hr style={styles.divider} />

      <Text style={styles.smallText}>
        Having trouble?{" "}
        <Link href={supportUrl} style={styles.link}>
          Contact our support team
        </Link>{" "}
        and we'll help you resolve this.
      </Text>
    </Layout>
  );
}

export default PaymentFailedEmail;
