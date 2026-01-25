import { Text, Link, Section } from "@react-email/components";
import * as React from "react";
import { Layout, Button, Card, ImagePreview, GradientAccent, styles, colors } from "../components";

interface StagingCompleteEmailProps {
  firstName: string;
  roomType: string;
  style: string;
  stagedImageUrl: string;
  viewUrl?: string;
  jobId?: string;
  propertyName?: string;
  appUrl?: string;
  unsubscribeUrl?: string;
}

export function StagingCompleteEmail({
  firstName = "there",
  roomType = "Living Room",
  style = "Modern",
  stagedImageUrl = "https://placehold.co/600x400/e2e8f0/64748b?text=Staged+Photo",
  viewUrl,
  jobId = "123",
  propertyName,
  appUrl = "https://stager.app",
  unsubscribeUrl,
}: StagingCompleteEmailProps) {
  const finalViewUrl = viewUrl || `${appUrl}/history?job=${jobId}`;

  return (
    <Layout
      preview={`Your ${roomType} is ready! View your beautifully staged photo now.`}
      unsubscribeUrl={unsubscribeUrl}
    >
      {/* Success Card */}
      <Card variant="success">
        <Section style={{ textAlign: "center" as const }}>
          <div style={successIcon}>
            <Text style={successIconText}>✓</Text>
          </div>
          <Text style={successTitle}>Your staging is ready!</Text>
        </Section>
      </Card>

      {/* Image Card */}
      <Card>
        <Text style={styles.paragraph}>
          Hi {firstName}, your {roomType.toLowerCase()} has been beautifully staged in the{" "}
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
          caption={`${roomType} • ${style} style`}
        />

        <Section style={styles.buttonContainer}>
          <Button href={finalViewUrl}>View Full Image</Button>
        </Section>
      </Card>

      {/* Pro Tip Card */}
      <Card variant="feature">
        <table cellPadding="0" cellSpacing="0" style={{ width: "100%" }}>
          <tbody>
            <tr>
              <td style={tipIconCell}>
                <Text style={tipIcon}>💡</Text>
              </td>
              <td>
                <Text style={tipTitle}>Pro tip</Text>
                <Text style={tipText}>
                  Not quite right? You can remix this staging with different furniture styles or try a different room type.
                </Text>
              </td>
            </tr>
          </tbody>
        </table>
      </Card>

      {/* Stage More Card */}
      <Card>
        <Text style={{ ...styles.smallText, margin: 0, textAlign: "center" as const }}>
          Want to stage more photos?{" "}
          <Link href={`${appUrl}/stage`} style={styles.link}>
            Start a new staging →
          </Link>
        </Text>
      </Card>
    </Layout>
  );
}

const successIcon: React.CSSProperties = {
  width: "48px",
  height: "48px",
  backgroundColor: colors.success,
  borderRadius: "50%",
  margin: "0 auto 12px auto",
  textAlign: "center" as const,
  lineHeight: "48px",
};

const successIconText: React.CSSProperties = {
  color: "#ffffff",
  fontSize: "24px",
  fontWeight: "700",
  margin: 0,
  lineHeight: "48px",
};

const successTitle: React.CSSProperties = {
  fontSize: "20px",
  fontWeight: "600",
  color: colors.success,
  margin: 0,
};

const tipIconCell: React.CSSProperties = {
  width: "40px",
  verticalAlign: "top",
  paddingRight: "12px",
};

const tipIcon: React.CSSProperties = {
  fontSize: "24px",
  margin: 0,
};

const tipTitle: React.CSSProperties = {
  fontSize: "15px",
  fontWeight: "600",
  color: colors.textPrimary,
  margin: "0 0 4px 0",
};

const tipText: React.CSSProperties = {
  fontSize: "14px",
  color: colors.textSecondary,
  margin: 0,
  lineHeight: "1.5",
};

export default StagingCompleteEmail;
