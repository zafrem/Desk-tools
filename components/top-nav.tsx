"use client";

import { useState } from "react";
import Link from "next/link";
import { Database, LayoutDashboard, StickyNote, PenTool, BookA, Github, ExternalLink, PanelRightClose, PanelRightOpen, Menu, X, ListTodo } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import { LanguageSwitcher } from "@/components/language-switcher";
import { Button } from "@/components/ui/button";
import { useSidebar } from "@/components/sidebar-context";
import { useTranslation } from "react-i18next";

const navItems = [
  { href: "/kanban", icon: LayoutDashboard, labelKey: "kanban" },
  { href: "/notepad", icon: StickyNote, labelKey: "notepad" },
  { href: "/daily-tasks", icon: ListTodo, labelKey: "dailyTasks" },
  { href: "/whiteboard", icon: PenTool, labelKey: "whiteboard" },
  { href: "/terms", icon: BookA, labelKey: "terms" },
  { href: "/bookmarks", icon: ExternalLink, labelKey: "bookmarks" },
];

export function TopNav() {
  const { isOpen, toggle } = useSidebar();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { t } = useTranslation("navigation");

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 max-w-screen-2xl items-center">
        {/* Mobile menu button */}
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden mr-2"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
          {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          <span className="sr-only">{t("toggleMenu")}</span>
        </Button>

        {/* Logo/Brand */}
        <div className="mr-4 flex">
          <Link href="/" className="mr-6 flex items-center space-x-2">
            <Database className="h-6 w-6 md:ml-2" />
            <span className="font-bold text-xl hidden sm:inline"> {t("brand")}</span>
          </Link>
        </div>

        {/* Core Navigation - Hidden on mobile */}
        <nav className="hidden md:flex items-center gap-4 lg:gap-6 text-sm font-medium flex-1">
          {navItems.map((item) => (
            <Link key={item.href} href={item.href}>
              <Button variant="ghost" className="gap-2">
                <item.icon className="h-4 w-4" />
                <span className="hidden lg:inline">{t(item.labelKey)}</span>
              </Button>
            </Link>
          ))}
        </nav>

        {/* Spacer for mobile */}
        <div className="flex-1 md:hidden" />

        {/* Right side controls */}
        <div className="flex items-center gap-2">
          {/* Local storage indicator */}
          <div className="hidden md:flex items-center gap-2 text-xs text-muted-foreground mr-4">
            <div className="h-2 w-2 rounded-full bg-green-500" />
            <span>{t("localStorage")}</span>
          </div>

          <Link href="https://github.com/zafrem/Desk-tools/issues" target="_blank" rel="noopener noreferrer">
            <Button variant="ghost" size="icon" title={t("github")}>
              <Github className="h-5 w-5" />
              <span className="sr-only">{t("github")}</span>
            </Button>
          </Link>

          {/* Language switcher */}
          <LanguageSwitcher />

          {/* Theme toggle */}
          <ThemeToggle />

          {/* Sidebar toggle */}
          <Button
            variant="ghost"
            size="icon"
            onClick={toggle}
            title={isOpen ? t("closeSidebar") : t("openSidebar")}
            className="hidden lg:flex"
          >
            {isOpen ? (
              <PanelRightClose className="h-5 w-5" />
            ) : (
              <PanelRightOpen className="h-5 w-5" />
            )}
            <span className="sr-only">{t("toggleSidebar")}</span>
          </Button>
        </div>
      </div>

      {/* Mobile dropdown menu */}
      {mobileMenuOpen && (
        <nav className="md:hidden border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="container py-2 flex flex-col gap-1">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileMenuOpen(false)}
              >
                <Button variant="ghost" className="w-full justify-start gap-2">
                  <item.icon className="h-4 w-4" />
                  {t(item.labelKey)}
                </Button>
              </Link>
            ))}
          </div>
        </nav>
      )}
    </header>
  );
}
