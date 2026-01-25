import { Text, Hr, Link, Section } from "@react-email/components";
import * as React from "react";
import { Layout, Button, Card, styles } from "../components";

interface PaymentSuccessEmailProps {
  firstName: string;
  amount: string;
  creditsAdded: number;
  totalCredits: number;
  receiptUrl?: string;
  appUrl: string;
}

export function PaymentSuccessEmail({
  firstName,
  amount,
  creditsAdded,
  totalCredits,
  receiptUrl,
  appUrl,
}: PaymentSuccessEmailProps) {
  return (
    <Layout preview={`Payment received - ${creditsAdded} credits added to your account`}>
      <Text style={styles.heading}>Payment received - thank you!</Text>

      <Text style={styles.paragraph}>
        Hi {firstName},
      </Text>

      <Text style={styles.paragraph}>
        Your payment of <strong>{amount}</strong> has been processed successfully.
        We've added <strong>{creditsAdded} staging credits</strong> to your account.
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
            {totalCredits}
          </Text>
          <Text style={{ ...styles.smallText, margin: 0 }}>
            total credits available
          </Text>
        </Section>
      </Card>

      <Section style={styles.buttonContainer}>
        <Button href={`${appUrl}/stage`}>Start Staging</Button>
      </Section>

      <Hr style={styles.divider} />

      <Text style={styles.smallText}>
        <strong>Payment details:</strong>
        <br />
        Amount: {amount}
        <br />
        Credits added: {creditsAdded}
        {receiptUrl && (
          <>
            <br />
            <Link href={receiptUrl} style={styles.link}>
              View receipt
            </Link>
          </>
        )}
      </Text>

      <Text style={styles.smallText}>
        Need help?{" "}
        <Link href={`${appUrl}/help`} style={styles.link}>
          Contact support
        </Link>
      </Text>
    </Layout>
  );
}

export default PaymentSuccessEmail;
