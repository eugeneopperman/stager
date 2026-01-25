import {
  Html,
  Head,
  Body,
  Container,
  Section,
  Preview,
  Font,
} from "@react-email/components";
import * as React from "react";
import { Header } from "./Header";
import { Footer } from "./Footer";

interface LayoutProps {
  preview: string;
  children: React.ReactNode;
  showHeader?: boolean;
  showFooter?: boolean;
  unsubscribeUrl?: string;
  preferencesUrl?: string;
}

export function Layout({
  preview,
  children,
  showHeader = true,
  showFooter = true,
  unsubscribeUrl,
  preferencesUrl,
}: LayoutProps) {
  return (
    <Html>
      <Head>
        <Font
          fontFamily="Inter"
          fallbackFontFamily="Helvetica"
          webFont={{
            url: "https://fonts.gstatic.com/s/inter/v13/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuLyfAZ9hiJ-Ek-_EeA.woff2",
            format: "woff2",
          }}
          fontWeight={400}
          fontStyle="normal"
        />
        <meta name="color-scheme" content="light dark" />
        <meta name="supported-color-schemes" content="light dark" />
      </Head>
      <Preview>{preview}</Preview>
      <Body style={body}>
        <Container style={container}>
          {showHeader && <Header />}
          <Section style={content}>{children}</Section>
          {showFooter && (
            <Footer
              unsubscribeUrl={unsubscribeUrl}
              preferencesUrl={preferencesUrl}
            />
          )}
        </Container>
      </Body>
    </Html>
  );
}

const body: React.CSSProperties = {
  backgroundColor: "#f4f4f5",
  fontFamily:
    "Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
  margin: 0,
  padding: "40px 20px",
};

const container: React.CSSProperties = {
  backgroundColor: "#ffffff",
  margin: "0 auto",
  maxWidth: "600px",
  borderRadius: "12px",
  overflow: "hidden",
  boxShadow: "0 1px 3px rgba(0, 0, 0, 0.1)",
};

const content: React.CSSProperties = {
  padding: "32px 24px",
};

export default Layout;
