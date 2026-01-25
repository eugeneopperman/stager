import { Text, Hr, Link, Section } from "@react-email/components";
import * as React from "react";
import { Layout, Button, Card, ImagePreview, styles } from "../components";

interface StagingCompleteEmailProps {
  firstName: string;
  roomType: string;
  style: string;
  stagedImageUrl: string;
  viewUrl: string;
  propertyName?: string;
  appUrl: string;
  unsubscribeUrl: string;
}

export function StagingCompleteEmail({
  firstName,
  roomType,
  style,
  stagedImageUrl,
  viewUrl,
  propertyName,
  appUrl,
  unsubscribeUrl,
}: StagingCompleteEmailProps) {
  return (
    <Layout
      preview={`Your ${roomType} is ready! View your beautifully staged photo now.`}
      unsubscribeUrl={unsubscribeUrl}
    >
      <Text style={styles.heading}>Your staged photo is ready!</Text>

      <Text style={styles.paragraph}>
        Hi {firstName},
      </Text>

      <Text style={styles.paragraph}>
        Great news! Your {roomType.toLowerCase()} has been beautifully staged in the{" "}
        <strong>{style}</strong> style.
        {propertyName && (
          <>
            {" "}This staging is for <strong>{propertyName}</strong>.
          </>
        )}
      </Text>

      <ImagePreview
        imageUrl={stagedImageUrl}
        alt={`Staged ${roomType}`}
        caption={`${roomType} - ${style} style`}
      />

      <Section style={styles.buttonContainer}>
        <Button href={viewUrl}>View Full Result</Button>
      </Section>

      <Card variant="highlight">
        <Text style={{ ...styles.paragraph, margin: 0 }}>
          <strong>Pro tip:</strong> Not quite right? You can remix this staging
          with different furniture styles or room layouts.
        </Text>
      </Card>

      <Hr style={styles.divider} />

      <Text style={styles.smallText}>
        Want to stage more photos?{" "}
        <Link href={`${appUrl}/stage`} style={styles.link}>
          Start a new staging
        </Link>
      </Text>
    </Layout>
  );
}

export default StagingCompleteEmail;
