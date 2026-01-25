import { Text, Hr, Section } from "@react-email/components";
import * as React from "react";
import { Layout, Button, Card, styles } from "../components";

interface SpecialOfferEmailProps {
  firstName: string;
  credits: number;
  appUrl: string;
  unsubscribeUrl: string;
}

export function SpecialOfferEmail({
  firstName,
  credits,
  appUrl,
  unsubscribeUrl,
}: SpecialOfferEmailProps) {
  return (
    <Layout
      preview="We'd love to have you back - here's something special"
      unsubscribeUrl={unsubscribeUrl}
    >
      <Text style={styles.heading}>We'd Love to Have You Back</Text>

      <Text style={styles.paragraph}>
        Hi {firstName},
      </Text>

      <Text style={styles.paragraph}>
        It's been a while since you've used Stager. We know the real estate
        business gets busy, but we want you to know we're here when you need us.
      </Text>

      {credits > 0 && (
        <Card variant="highlight">
          <Section style={{ textAlign: "center" as const }}>
            <Text style={{ ...styles.smallText, margin: "0 0 8px 0" }}>
              You still have
            </Text>
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
              staging credits ready to use
            </Text>
          </Section>
        </Card>
      )}

      <Text style={styles.paragraph}>
        Here's a quick reminder of why agents love Stager:
      </Text>

      <ul style={styles.list}>
        <li style={styles.listItem}>
          <strong>Instant results</strong> - No waiting for furniture companies
        </li>
        <li style={styles.listItem}>
          <strong>Fraction of the cost</strong> - Save thousands per listing
        </li>
        <li style={styles.listItem}>
          <strong>Multiple styles</strong> - Try different looks instantly
        </li>
        <li style={styles.listItem}>
          <strong>Professional quality</strong> - MLS-ready results
        </li>
      </ul>

      <Card variant="success">
        <Text style={{ ...styles.paragraph, margin: "0 0 8px 0" }}>
          <strong>Ready when you are</strong>
        </Text>
        <Text style={{ ...styles.smallText, margin: 0 }}>
          Your account is active and your credits are waiting. Just upload a
          photo and we'll handle the rest.
        </Text>
      </Card>

      <Section style={styles.buttonContainer}>
        <Button href={`${appUrl}/stage`}>Stage a Photo</Button>
      </Section>

      <Hr style={styles.divider} />

      <Text style={styles.smallText}>
        Questions or feedback? We'd love to hear from you - just reply to this
        email.
      </Text>
    </Layout>
  );
}

export default SpecialOfferEmail;
