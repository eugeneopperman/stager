import type { Metadata, Viewport } from "next";
import { Outfit, Lato } from "next/font/google";
import { ThemeProvider } from "@/components/providers/ThemeProvider";
import { SWRProvider } from "@/components/providers/SWRProvider";
import { Toaster } from "@/components/ui/sonner";
import { VersionBadge } from "@/components/layout/VersionBadge";
import "./globals.css";

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const lato = Lato({
  variable: "--font-lato",
  subsets: ["latin"],
  weight: ["400", "700"],
});

export const metadata: Metadata = {
  title: "Stager - AI Virtual Staging",
  description: "Transform empty rooms into beautifully staged spaces with AI",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${outfit.variable} ${lato.variable} antialiased font-sans`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <SWRProvider>
            {children}
            <Toaster position="bottom-right" />
            <VersionBadge />
          </SWRProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
