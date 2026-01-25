import { Text, Hr, Section } from "@react-email/components";
import * as React from "react";
import { Layout, Button, Card, styles } from "../components";

interface TipsEmailProps {
  firstName: string;
  appUrl: string;
  unsubscribeUrl: string;
}

export function TipsEmail({
  firstName,
  appUrl,
  unsubscribeUrl,
}: TipsEmailProps) {
  return (
    <Layout
      preview="5 pro tips for stunning virtual staging results"
      unsubscribeUrl={unsubscribeUrl}
    >
      <Text style={styles.heading}>5 Pro Tips for Stunning Virtual Staging</Text>

      <Text style={styles.paragraph}>
        Hi {firstName},
      </Text>

      <Text style={styles.paragraph}>
        Want to get the most out of Stager? Here are insider tips from our
        top-performing real estate agents:
      </Text>

      <Card variant="highlight">
        <Text style={tipNumber}>1</Text>
        <Text style={tipTitle}>Match Style to Property Type</Text>
        <Text style={{ ...styles.smallText, margin: 0 }}>
          Modern/Minimalist works great for urban condos, while Farmhouse suits
          suburban homes. Luxury style is perfect for high-end listings.
        </Text>
      </Card>

      <Card variant="highlight">
        <Text style={tipNumber}>2</Text>
        <Text style={tipTitle}>Stage the Hero Rooms First</Text>
        <Text style={{ ...styles.smallText, margin: 0 }}>
          Living room, master bedroom, and kitchen get the most views. Focus your
          credits on these high-impact spaces.
        </Text>
      </Card>

      <Card variant="highlight">
        <Text style={tipNumber}>3</Text>
        <Text style={tipTitle}>Use the Remix Feature</Text>
        <Text style={{ ...styles.smallText, margin: 0 }}>
          Not loving the result? Use remix to try a different arrangement without
          using another credit. Small tweaks can make a big difference.
        </Text>
      </Card>

      <Card variant="highlight">
        <Text style={tipNumber}>4</Text>
        <Text style={tipTitle}>Organize by Property</Text>
        <Text style={{ ...styles.smallText, margin: 0 }}>
          Create properties in Stager to keep your stagings organized. Download
          all photos for a listing with one click.
        </Text>
      </Card>

      <Card variant="highlight">
        <Text style={tipNumber}>5</Text>
        <Text style={tipTitle}>Before/After Comparisons</Text>
        <Text style={{ ...styles.smallText, margin: 0 }}>
          Use the comparison slider to show clients the transformation. It's a
          powerful selling tool in your listing presentations.
        </Text>
      </Card>

      <Section style={styles.buttonContainer}>
        <Button href={`${appUrl}/stage`}>Put These Tips to Work</Button>
      </Section>

      <Hr style={styles.divider} />

      <Text style={styles.smallText}>
        Have a staging tip to share? Reply to this email - we'd love to hear
        from you!
      </Text>
    </Layout>
  );
}

const tipNumber: React.CSSProperties = {
  fontSize: "24px",
  fontWeight: "700",
  color: "#7c3aed",
  margin: "0 0 4px 0",
  lineHeight: "1",
};

const tipTitle: React.CSSProperties = {
  fontSize: "16px",
  fontWeight: "600",
  color: "#18181b",
  margin: "0 0 8px 0",
};

export default TipsEmail;
