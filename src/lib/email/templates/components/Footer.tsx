import { Section, Text, Link, Hr } from "@react-email/components";
import * as React from "react";

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
      <Hr style={divider} />
      <Text style={companyText}>
        <Link href={APP_URL} style={footerLink}>
          Stager
        </Link>{" "}
        - AI-Powered Virtual Staging for Real Estate
      </Text>
      <Text style={linksText}>
        <Link href={preferencesUrl || defaultPreferencesUrl} style={footerLink}>
          Email Preferences
        </Link>
        {" | "}
        <Link href={unsubscribeUrl || defaultUnsubscribeUrl} style={footerLink}>
          Unsubscribe
        </Link>
        {" | "}
        <Link href={`${APP_URL}/help`} style={footerLink}>
          Help Center
        </Link>
      </Text>
      <Text style={addressText}>
        Stager Inc.
        <br />
        123 Real Estate Lane, San Francisco, CA 94105
      </Text>
      <Text style={copyrightText}>
        &copy; {new Date().getFullYear()} Stager. All rights reserved.
      </Text>
    </Section>
  );
}

const footer: React.CSSProperties = {
  padding: "0 24px 24px",
  textAlign: "center" as const,
};

const divider: React.CSSProperties = {
  borderColor: "#e4e4e7",
  borderWidth: "1px",
  margin: "0 0 24px 0",
};

const companyText: React.CSSProperties = {
  color: "#71717a",
  fontSize: "14px",
  margin: "0 0 12px 0",
};

const linksText: React.CSSProperties = {
  color: "#71717a",
  fontSize: "12px",
  margin: "0 0 12px 0",
};

const footerLink: React.CSSProperties = {
  color: "#7c3aed",
  textDecoration: "none",
};

const addressText: React.CSSProperties = {
  color: "#a1a1aa",
  fontSize: "11px",
  margin: "0 0 8px 0",
  lineHeight: "1.5",
};

const copyrightText: React.CSSProperties = {
  color: "#a1a1aa",
  fontSize: "11px",
  margin: 0,
};

export default Footer;
