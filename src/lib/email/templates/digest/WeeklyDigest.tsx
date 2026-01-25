import { Text, Hr, Section, Row, Column, Img, Link } from "@react-email/components";
import * as React from "react";
import { Layout, Button, Card, StatCard, styles } from "../components";

export interface WeeklyDigestProps {
  firstName: string;
  stagingsThisWeek: number;
  stagingsLastWeek: number;
  creditsRemaining: number;
  topStagings?: Array<{
    id: string;
    thumbnail_url: string;
    room_type: string;
    style: string;
  }>;
  newFeatures?: Array<{
    title: string;
    description: string;
  }>;
  appUrl: string;
  unsubscribeUrl: string;
  preferencesUrl: string;
}

export function WeeklyDigestEmail({
  firstName,
  stagingsThisWeek,
  stagingsLastWeek,
  creditsRemaining,
  topStagings = [],
  newFeatures = [],
  appUrl,
  unsubscribeUrl,
  preferencesUrl,
}: WeeklyDigestProps) {
  const changePercent = stagingsLastWeek > 0
    ? Math.round(((stagingsThisWeek - stagingsLastWeek) / stagingsLastWeek) * 100)
    : stagingsThisWeek > 0 ? 100 : 0;

  const isPositive = stagingsThisWeek >= stagingsLastWeek;

  return (
    <Layout
      preview={`Your Stager Week: ${stagingsThisWeek} stagings completed`}
      unsubscribeUrl={unsubscribeUrl}
      preferencesUrl={preferencesUrl}
    >
      <Text style={styles.heading}>Your Week in Stager</Text>

      <Text style={styles.paragraph}>
        Hi {firstName}, here's your weekly staging summary:
      </Text>

      {/* Stats Row */}
      <Section style={statsContainer}>
        <Row>
          <Column style={{ width: "33%", padding: "0 4px" }}>
            <Section style={statBox}>
              <Text style={statValue}>{stagingsThisWeek}</Text>
              <Text style={statLabel}>Stagings</Text>
              {changePercent !== 0 && (
                <Text
                  style={{
                    ...changeText,
                    color: isPositive ? "#16a34a" : "#dc2626",
                  }}
                >
                  {isPositive ? "+" : ""}
                  {changePercent}%
                </Text>
              )}
            </Section>
          </Column>
          <Column style={{ width: "33%", padding: "0 4px" }}>
            <Section style={statBox}>
              <Text style={statValue}>{creditsRemaining}</Text>
              <Text style={statLabel}>Credits Left</Text>
            </Section>
          </Column>
          <Column style={{ width: "33%", padding: "0 4px" }}>
            <Section style={statBox}>
              <Text style={statValue}>{stagingsLastWeek}</Text>
              <Text style={statLabel}>Last Week</Text>
            </Section>
          </Column>
        </Row>
      </Section>

      {/* Recent Stagings */}
      {topStagings.length > 0 && (
        <>
          <Text style={styles.subheading}>Recent Stagings</Text>
          <Section style={stagingsGrid}>
            <Row>
              {topStagings.slice(0, 3).map((staging) => (
                <Column key={staging.id} style={stagingColumn}>
                  <Link href={`${appUrl}/history?job=${staging.id}`}>
                    <Img
                      src={staging.thumbnail_url}
                      alt={`${staging.room_type} - ${staging.style}`}
                      width={170}
                      style={stagingImage}
                    />
                  </Link>
                  <Text style={stagingCaption}>
                    {staging.room_type} - {staging.style}
                  </Text>
                </Column>
              ))}
            </Row>
          </Section>
        </>
      )}

      {/* New Features */}
      {newFeatures.length > 0 && (
        <>
          <Hr style={styles.divider} />
          <Text style={styles.subheading}>What's New</Text>
          {newFeatures.map((feature, index) => (
            <Card key={index} variant="info">
              <Text style={featureTitle}>{feature.title}</Text>
              <Text style={{ ...styles.smallText, margin: 0 }}>
                {feature.description}
              </Text>
            </Card>
          ))}
        </>
      )}

      {/* CTA */}
      <Section style={styles.buttonContainer}>
        <Button href={`${appUrl}/stage`}>
          {stagingsThisWeek === 0 ? "Stage Your First Photo" : "Stage More Photos"}
        </Button>
      </Section>

      {/* Credits Warning */}
      {creditsRemaining <= 5 && creditsRemaining > 0 && (
        <Card variant="warning">
          <Text style={{ ...styles.paragraph, margin: "0 0 8px 0" }}>
            <strong>Running low on credits!</strong>
          </Text>
          <Text style={{ ...styles.smallText, margin: 0 }}>
            You have {creditsRemaining} credit{creditsRemaining !== 1 ? "s" : ""}{" "}
            remaining.{" "}
            <Link href={`${appUrl}/billing`} style={styles.link}>
              Add more credits
            </Link>
          </Text>
        </Card>
      )}

      <Hr style={styles.divider} />

      <Text style={styles.smallText}>
        Want to adjust what emails you receive?{" "}
        <Link href={preferencesUrl} style={styles.link}>
          Manage your preferences
        </Link>
      </Text>
    </Layout>
  );
}

const statsContainer: React.CSSProperties = {
  margin: "24px 0",
};

const statBox: React.CSSProperties = {
  backgroundColor: "#f4f4f5",
  borderRadius: "8px",
  padding: "16px 8px",
  textAlign: "center" as const,
};

const statValue: React.CSSProperties = {
  fontSize: "32px",
  fontWeight: "700",
  color: "#18181b",
  margin: 0,
  lineHeight: "1.2",
};

const statLabel: React.CSSProperties = {
  fontSize: "12px",
  color: "#71717a",
  margin: "4px 0 0 0",
  textTransform: "uppercase" as const,
  letterSpacing: "0.5px",
};

const changeText: React.CSSProperties = {
  fontSize: "12px",
  fontWeight: "600",
  margin: "4px 0 0 0",
};

const stagingsGrid: React.CSSProperties = {
  margin: "16px 0",
};

const stagingColumn: React.CSSProperties = {
  width: "33%",
  padding: "0 4px",
  textAlign: "center" as const,
};

const stagingImage: React.CSSProperties = {
  borderRadius: "6px",
  width: "100%",
  height: "auto",
  border: "1px solid #e4e4e7",
};

const stagingCaption: React.CSSProperties = {
  fontSize: "11px",
  color: "#71717a",
  margin: "6px 0 0 0",
  lineHeight: "1.3",
};

const featureTitle: React.CSSProperties = {
  fontSize: "14px",
  fontWeight: "600",
  color: "#18181b",
  margin: "0 0 4px 0",
};

export default WeeklyDigestEmail;
