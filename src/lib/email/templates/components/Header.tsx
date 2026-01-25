import { Section, Img, Text, Link } from "@react-email/components";
import * as React from "react";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://stager.app";

interface HeaderProps {
  showTagline?: boolean;
}

export function Header({ showTagline = true }: HeaderProps) {
  return (
    <Section style={header}>
      <Link href={APP_URL} style={logoLink}>
        <div style={logoContainer}>
          <div style={logoIcon}>
            <Text style={logoLetter}>S</Text>
          </div>
          <Text style={logoText}>Stager</Text>
        </div>
      </Link>
      {showTagline && (
        <Text style={tagline}>AI-Powered Virtual Staging</Text>
      )}
    </Section>
  );
}

const header: React.CSSProperties = {
  background: "linear-gradient(135deg, #7c3aed 0%, #a855f7 100%)",
  padding: "24px",
  textAlign: "center" as const,
};

const logoLink: React.CSSProperties = {
  textDecoration: "none",
};

const logoContainer: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  gap: "8px",
};

const logoIcon: React.CSSProperties = {
  width: "36px",
  height: "36px",
  backgroundColor: "rgba(255, 255, 255, 0.2)",
  borderRadius: "8px",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
};

const logoLetter: React.CSSProperties = {
  color: "#ffffff",
  fontSize: "20px",
  fontWeight: "700",
  margin: 0,
  lineHeight: "36px",
};

const logoText: React.CSSProperties = {
  color: "#ffffff",
  fontSize: "24px",
  fontWeight: "700",
  margin: 0,
  letterSpacing: "-0.5px",
};

const tagline: React.CSSProperties = {
  color: "rgba(255, 255, 255, 0.9)",
  fontSize: "14px",
  margin: "8px 0 0 0",
};

export default Header;
