import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { TopNav } from "@/components/top-nav";
import { ToolSidebar } from "@/components/tool-sidebar";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

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
      <body className={`${inter.className} ${inter.variable} font-sans`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <div className="relative min-h-screen">
            <TopNav />
            <div className="flex">
              {/* Main content area */}
              <main className="flex-1 mr-80">
                {children}
              </main>
              {/* Right sidebar */}
              <ToolSidebar />
            </div>
          </div>
        </ThemeProvider>
      </body>
    </html>
  );
}