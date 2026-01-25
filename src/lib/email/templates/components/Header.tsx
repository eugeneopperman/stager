import { Section, Text, Link } from "@react-email/components";
import * as React from "react";
import { colors, radius, shadows, spacing } from "./styles";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://stager.app";

export function Header() {
  return (
    <Section style={header}>
      <Link href={APP_URL} style={logoLink}>
        <table cellPadding="0" cellSpacing="0" style={{ margin: "0 auto" }}>
          <tbody>
            <tr>
              <td style={logoIconCell}>
                <div style={logoIcon}>
                  <Text style={logoLetter}>S</Text>
                </div>
              </td>
              <td>
                <Text style={logoText}>Stager</Text>
              </td>
            </tr>
          </tbody>
        </table>
      </Link>
    </Section>
  );
}

const header: React.CSSProperties = {
  backgroundColor: colors.cardWhite,
  borderRadius: radius.xl,
  boxShadow: shadows.card,
  padding: spacing.lg,
  marginBottom: spacing.md,
  textAlign: "center" as const,
};

const logoLink: React.CSSProperties = {
  textDecoration: "none",
};

const logoIconCell: React.CSSProperties = {
  paddingRight: "10px",
  verticalAlign: "middle",
};

const logoIcon: React.CSSProperties = {
  width: "36px",
  height: "36px",
  backgroundColor: colors.primaryBlue,
  borderRadius: radius.md,
  display: "inline-block",
  textAlign: "center" as const,
  lineHeight: "36px",
};

const logoLetter: React.CSSProperties = {
  color: "#ffffff",
  fontSize: "20px",
  fontWeight: "700",
  margin: 0,
  lineHeight: "36px",
};

const logoText: React.CSSProperties = {
  color: colors.textPrimary,
  fontSize: "24px",
  fontWeight: "700",
  margin: 0,
  letterSpacing: "-0.5px",
  verticalAlign: "middle",
};

export default Header;
