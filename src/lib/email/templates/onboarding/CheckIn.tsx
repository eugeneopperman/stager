import { Text, Hr, Section, Link } from "@react-email/components";
import * as React from "react";
import { Layout, Button, Card, styles } from "../components";

interface CheckInEmailProps {
  firstName: string;
  appUrl: string;
  unsubscribeUrl: string;
}

export function CheckInEmail({
  firstName,
  appUrl,
  unsubscribeUrl,
}: CheckInEmailProps) {
  return (
    <Layout
      preview="How's your Stager experience going? We're here to help."
      unsubscribeUrl={unsubscribeUrl}
    >
      <Text style={styles.heading}>How's it going, {firstName}?</Text>

      <Text style={styles.paragraph}>
        You've been with Stager for a week now, and we wanted to check in. Have
        you had a chance to stage your first property photo?
      </Text>

      <Card variant="info">
        <Text style={{ ...styles.paragraph, margin: "0 0 12px 0" }}>
          <strong>We're here to help with:</strong>
        </Text>
        <ul style={{ ...styles.list, margin: 0 }}>
          <li style={styles.listItem}>
            Getting started with your first staging
          </li>
          <li style={styles.listItem}>
            Choosing the right style for your listings
          </li>
          <li style={styles.listItem}>
            Understanding how credits work
          </li>
          <li style={styles.listItem}>
            Any technical questions or issues
          </li>
        </ul>
      </Card>

      <Text style={styles.paragraph}>
        Just reply to this email with any questions - I personally read every
        response.
      </Text>

      <Section style={styles.buttonContainer}>
        <Button href={`${appUrl}/stage`}>Start Staging</Button>
      </Section>

      <Hr style={styles.divider} />

      <Card variant="default">
        <Text style={{ ...styles.paragraph, margin: "0 0 8px 0" }}>
          <strong>Quick links:</strong>
        </Text>
        <Text style={{ ...styles.smallText, margin: 0 }}>
          <Link href={`${appUrl}/dashboard`} style={styles.link}>
            Dashboard
          </Link>
          {" | "}
          <Link href={`${appUrl}/stage`} style={styles.link}>
            Stage a Photo
          </Link>
          {" | "}
          <Link href={`${appUrl}/help`} style={styles.link}>
            Help Center
          </Link>
          {" | "}
          <Link href={`${appUrl}/billing`} style={styles.link}>
            Billing
          </Link>
        </Text>
      </Card>

      <Text style={styles.smallText}>
        Thanks for choosing Stager. We're excited to help you create stunning
        property presentations!
      </Text>

      <Text style={{ ...styles.smallText, marginTop: "16px" }}>
        Best,
        <br />
        The Stager Team
      </Text>
    </Layout>
  );
}

export default CheckInEmail;
