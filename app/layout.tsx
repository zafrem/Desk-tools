import type { Metadata, Viewport } from "next";
import { Inter, Noto_Sans_KR, Noto_Sans_SC, Noto_Sans_JP } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { I18nProvider } from "@/components/i18n-provider";
import { AppShell } from "@/components/app-shell";
import { ServiceWorkerRegistration } from "@/components/service-worker-registration";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const notoKR = Noto_Sans_KR({ subsets: ["latin"], weight: ["400", "700"], variable: "--font-noto-kr" });
const notoSC = Noto_Sans_SC({ subsets: ["latin"], weight: ["400", "700"], variable: "--font-noto-sc" });
const notoJP = Noto_Sans_JP({ subsets: ["latin"], weight: ["400", "700"], variable: "--font-noto-jp" });

export const metadata: Metadata = {
  title: "Desk-tools - Local-First Utility Platform",
  description: "High-performance, privacy-focused developer tools running entirely in your browser",
  manifest: "./manifest.json",
  icons: {
    icon: [
      { url: "./favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "./icon-192.png", sizes: "192x192", type: "image/png" },
    ],
    apple: "./apple-touch-icon.png",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Desk-tools",
  },
  formatDetection: {
    telephone: false,
  },
};

export const viewport: Viewport = {
  themeColor: "#0a0a0a",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
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
            <ServiceWorkerRegistration />
          </ThemeProvider>
        </I18nProvider>
      </body>
    </html>
  );
}