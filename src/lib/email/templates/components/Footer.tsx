import { Section, Text, Link, Hr } from "@react-email/components";
import * as React from "react";
import { colors, radius, shadows, spacing } from "./styles";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://stager.app";

interface FooterProps {
  unsubscribeUrl?: string;
  preferencesUrl?: string;
}

export function Footer({ unsubscribeUrl, preferencesUrl }: FooterProps) {
  const defaultPreferencesUrl = `${APP_URL}/settings?tab=notifications`;
  const defaultUnsubscribeUrl = `${APP_URL}/api/email/unsubscribe`;

  return (
    <Section style={footer}>
      {/* Social Icons */}
      <table cellPadding="0" cellSpacing="0" style={socialTable}>
        <tbody>
          <tr>
            <td style={socialIconCell}>
              <Link href="https://twitter.com/stagerapp" style={socialLink}>
                <div style={socialIcon}>
                  <Text style={socialIconText}>X</Text>
                </div>
              </Link>
            </td>
            <td style={socialIconCell}>
              <Link href="https://facebook.com/stagerapp" style={socialLink}>
                <div style={socialIcon}>
                  <Text style={socialIconText}>f</Text>
                </div>
              </Link>
            </td>
            <td style={socialIconCell}>
              <Link href="https://linkedin.com/company/stagerapp" style={socialLink}>
                <div style={socialIcon}>
                  <Text style={socialIconText}>in</Text>
                </div>
              </Link>
            </td>
          </tr>
        </tbody>
      </table>

      <Hr style={divider} />

      {/* Company Info */}
      <Text style={companyText}>
        &copy; {new Date().getFullYear()} Stager. All rights reserved.
      </Text>

      <Text style={addressText}>
        Stager Inc. &middot; 123 Real Estate Lane, San Francisco, CA 94105
      </Text>

      {/* Links */}
      <table cellPadding="0" cellSpacing="0" style={linksTable}>
        <tbody>
          <tr>
            <td style={linkCell}>
              <Link href={preferencesUrl || defaultPreferencesUrl} style={footerLink}>
                Preferences
              </Link>
            </td>
            <td style={linkDividerCell}>
              <Text style={linkDivider}>&middot;</Text>
            </td>
            <td style={linkCell}>
              <Link href={unsubscribeUrl || defaultUnsubscribeUrl} style={footerLink}>
                Unsubscribe
              </Link>
            </td>
            <td style={linkDividerCell}>
              <Text style={linkDivider}>&middot;</Text>
            </td>
            <td style={linkCell}>
              <Link href={`${APP_URL}/help`} style={footerLink}>
                Help
              </Link>
            </td>
          </tr>
        </tbody>
      </table>
    </Section>
  );
}

const footer: React.CSSProperties = {
  backgroundColor: colors.cardWhite,
  borderRadius: radius.xl,
  boxShadow: shadows.card,
  padding: spacing.xl,
  marginTop: spacing.md,
  textAlign: "center" as const,
};

const socialTable: React.CSSProperties = {
  margin: "0 auto 16px auto",
};

const socialIconCell: React.CSSProperties = {
  padding: "0 6px",
};

const socialLink: React.CSSProperties = {
  textDecoration: "none",
};

const socialIcon: React.CSSProperties = {
  width: "36px",
  height: "36px",
  backgroundColor: colors.background,
  borderRadius: radius.full,
  display: "inline-block",
  textAlign: "center" as const,
  lineHeight: "36px",
};

const socialIconText: React.CSSProperties = {
  color: colors.textMuted,
  fontSize: "14px",
  fontWeight: "600",
  margin: 0,
  lineHeight: "36px",
};

const divider: React.CSSProperties = {
  borderColor: colors.divider,
  borderWidth: "1px",
  margin: "16px 0",
};

const companyText: React.CSSProperties = {
  color: colors.textMuted,
  fontSize: "13px",
  margin: "0 0 4px 0",
};

const addressText: React.CSSProperties = {
  color: colors.textMuted,
  fontSize: "12px",
  margin: "0 0 16px 0",
};

const linksTable: React.CSSProperties = {
  margin: "0 auto",
};

const linkCell: React.CSSProperties = {
  padding: "0",
};

const linkDividerCell: React.CSSProperties = {
  padding: "0 8px",
};

const linkDivider: React.CSSProperties = {
  color: colors.textMuted,
  fontSize: "12px",
  margin: 0,
};

const footerLink: React.CSSProperties = {
  color: colors.primaryBlue,
  fontSize: "12px",
  textDecoration: "none",
};

export default Footer;
