import type { Metadata } from "next";
import { Inter, Noto_Sans_KR, Noto_Sans_SC, Noto_Sans_JP } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { I18nProvider } from "@/components/i18n-provider";
import { AppShell } from "@/components/app-shell";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const notoKR = Noto_Sans_KR({ subsets: ["latin"], weight: ["400", "700"], variable: "--font-noto-kr" });
const notoSC = Noto_Sans_SC({ subsets: ["latin"], weight: ["400", "700"], variable: "--font-noto-sc" });
const notoJP = Noto_Sans_JP({ subsets: ["latin"], weight: ["400", "700"], variable: "--font-noto-jp" });

export const metadata: Metadata = {
  title: "Desk-tools - Local-First Utility Platform",
  description: "High-performance, privacy-focused developer tools running entirely in your browser",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.className} ${inter.variable} ${notoKR.variable} ${notoSC.variable} ${notoJP.variable} font-sans`}>
        <I18nProvider>
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            <AppShell>{children}</AppShell>
          </ThemeProvider>
        </I18nProvider>
      </body>
    </html>
  );
}