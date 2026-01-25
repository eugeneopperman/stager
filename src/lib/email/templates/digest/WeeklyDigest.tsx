import { Text, Link, Section, Img } from "@react-email/components";
import * as React from "react";
import { Layout, Button, Card, StatsRow, StatCard, GradientAccent, ThumbnailGrid, styles, colors, radius, spacing } from "../components";

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
  // Support both single feature and array for backwards compatibility
  newFeature?: {
    title: string;
    description: string;
  };
  newFeatures?: Array<{
    title: string;
    description: string;
  }>;
  appUrl?: string;
  unsubscribeUrl?: string;
  preferencesUrl?: string;
}

export function WeeklyDigestEmail({
  firstName = "there",
  stagingsThisWeek = 5,
  stagingsLastWeek = 3,
  creditsRemaining = 15,
  topStagings = [],
  newFeature,
  newFeatures,
  appUrl = "https://stager.app",
  unsubscribeUrl,
  preferencesUrl,
}: WeeklyDigestProps) {
  const changePercent = stagingsLastWeek > 0
    ? Math.round(((stagingsThisWeek - stagingsLastWeek) / stagingsLastWeek) * 100)
    : stagingsThisWeek > 0 ? 100 : 0;

  const isPositive = stagingsThisWeek >= stagingsLastWeek;
  const weekRange = getWeekRange();

  // Support both single feature and array
  const feature = newFeature || (newFeatures && newFeatures.length > 0 ? newFeatures[0] : undefined);

  return (
    <Layout
      preview={`Your Stager Week: ${stagingsThisWeek} stagings completed`}
      unsubscribeUrl={unsubscribeUrl}
      preferencesUrl={preferencesUrl}
    >
      {/* Header Card */}
      <Card>
        <GradientAccent />
        <Text style={styles.heading}>Your week in review</Text>
        <Text style={dateRange}>{weekRange}</Text>
      </Card>

      {/* Stats Card */}
      <StatsRow>
        <StatCard
          label="Stagings"
          value={stagingsThisWeek}
          trend={changePercent !== 0 ? `${Math.abs(changePercent)}%` : undefined}
          isPositive={isPositive}
        />
        <StatCard
          label="Credits left"
          value={creditsRemaining}
        />
      </StatsRow>

      {/* Recent Stagings */}
      {topStagings.length > 0 && (
        <Card>
          <Text style={styles.subheading}>Your staged photos</Text>
          <ThumbnailGrid
            images={topStagings.map((s) => ({
              src: s.thumbnail_url,
              alt: `${s.room_type} - ${s.style}`,
              href: `${appUrl}/history?job=${s.id}`,
            }))}
            columns={4}
            size={100}
          />
          <Section style={{ textAlign: "center" as const, marginTop: spacing.md }}>
            <Button href={`${appUrl}/history`} variant="outline">
              View All in History
            </Button>
          </Section>
        </Card>
      )}

      {/* New Feature Card */}
      {feature && (
        <Card variant="feature">
          <table cellPadding="0" cellSpacing="0" style={{ width: "100%" }}>
            <tbody>
              <tr>
                <td style={featureIconCell}>
                  <div style={featureIcon}>
                    <Text style={featureIconText}>✨</Text>
                  </div>
                </td>
                <td>
                  <Text style={featureLabel}>New Feature</Text>
                  <Text style={featureTitle}>{feature.title}</Text>
                  <Text style={featureDesc}>{feature.description}</Text>
                </td>
              </tr>
            </tbody>
          </table>
        </Card>
      )}

      {/* CTA Card */}
      <Card>
        <Section style={styles.buttonContainer}>
          <Button href={`${appUrl}/stage`}>
            {stagingsThisWeek === 0 ? "Stage Your First Photo" : "Stage More Photos"}
          </Button>
        </Section>
      </Card>

      {/* Credits Warning */}
      {creditsRemaining <= 5 && creditsRemaining > 0 && (
        <Card variant="warning">
          <table cellPadding="0" cellSpacing="0" style={{ width: "100%" }}>
            <tbody>
              <tr>
                <td style={warningIconCell}>
                  <Text style={warningIcon}>⚠️</Text>
                </td>
                <td>
                  <Text style={warningTitle}>Running low on credits</Text>
                  <Text style={warningText}>
                    You have {creditsRemaining} credit{creditsRemaining !== 1 ? "s" : ""} remaining.{" "}
                    <Link href={`${appUrl}/billing`} style={styles.link}>
                      Add more credits →
                    </Link>
                  </Text>
                </td>
              </tr>
            </tbody>
          </table>
        </Card>
      )}

      {/* Preferences Card */}
      <Card>
        <Text style={{ ...styles.smallText, margin: 0, textAlign: "center" as const }}>
          Want to adjust what emails you receive?{" "}
          <Link href={preferencesUrl || `${appUrl}/settings?tab=notifications`} style={styles.link}>
            Manage preferences →
          </Link>
        </Text>
      </Card>
    </Layout>
  );
}

function getWeekRange(): string {
  const now = new Date();
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const options: Intl.DateTimeFormatOptions = { month: "short", day: "numeric" };
  return `${weekAgo.toLocaleDateString("en-US", options)} - ${now.toLocaleDateString("en-US", options)}, ${now.getFullYear()}`;
}

const dateRange: React.CSSProperties = {
  fontSize: "14px",
  color: colors.textMuted,
  margin: 0,
};

const featureIconCell: React.CSSProperties = {
  width: "48px",
  verticalAlign: "top",
  paddingRight: "12px",
};

const featureIcon: React.CSSProperties = {
  width: "40px",
  height: "40px",
  backgroundColor: "rgba(255, 255, 255, 0.6)",
  borderRadius: "10px",
  textAlign: "center" as const,
  lineHeight: "40px",
};

const featureIconText: React.CSSProperties = {
  fontSize: "20px",
  margin: 0,
  lineHeight: "40px",
};

const featureLabel: React.CSSProperties = {
  fontSize: "11px",
  fontWeight: "600",
  color: colors.primaryBlue,
  textTransform: "uppercase" as const,
  letterSpacing: "0.5px",
  margin: "0 0 4px 0",
};

const featureTitle: React.CSSProperties = {
  fontSize: "16px",
  fontWeight: "600",
  color: colors.textPrimary,
  margin: "0 0 4px 0",
};

const featureDesc: React.CSSProperties = {
  fontSize: "14px",
  color: colors.textSecondary,
  margin: 0,
  lineHeight: "1.5",
};

const warningIconCell: React.CSSProperties = {
  width: "40px",
  verticalAlign: "top",
  paddingRight: "12px",
};

const warningIcon: React.CSSProperties = {
  fontSize: "24px",
  margin: 0,
};

const warningTitle: React.CSSProperties = {
  fontSize: "15px",
  fontWeight: "600",
  color: colors.textPrimary,
  margin: "0 0 4px 0",
};

const warningText: React.CSSProperties = {
  fontSize: "14px",
  color: colors.textSecondary,
  margin: 0,
  lineHeight: "1.5",
};

export default WeeklyDigestEmail;
