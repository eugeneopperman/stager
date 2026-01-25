import {
  Html,
  Head,
  Body,
  Container,
  Section,
  Preview,
} from "@react-email/components";
import * as React from "react";
import { Header } from "./Header";
import { Footer } from "./Footer";
import { colors, fontFamily, spacing } from "./styles";

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
  backgroundColor: colors.background,
  fontFamily,
  margin: 0,
  padding: "40px 16px",
};

const container: React.CSSProperties = {
  backgroundColor: colors.background,
  margin: "0 auto",
  maxWidth: "600px",
};

const content: React.CSSProperties = {
  padding: `0 ${spacing.md}`,
};

export default Layout;
