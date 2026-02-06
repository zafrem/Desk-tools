"use client";

import { useState } from "react";
import Link from "next/link";
import { Database, LayoutDashboard, StickyNote, PenTool, BookA, Github, ExternalLink, PanelRightClose, PanelRightOpen, Menu, X, ListTodo, CalendarClock, Download, Upload } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import { LanguageSwitcher } from "@/components/language-switcher";
import { SettingsDialog } from "@/components/settings-dialog";
import { Button } from "@/components/ui/button";
import { useSidebar } from "@/components/sidebar-context";
import { useTranslation } from "react-i18next";
import { db } from "@/lib/db";

const navItems = [
  { href: "/kanban", icon: LayoutDashboard, labelKey: "kanban" },
  { href: "/notepad", icon: StickyNote, labelKey: "notepad" },
  { href: "/daily-tasks", icon: ListTodo, labelKey: "dailyTasks" },
  { href: "/whiteboard", icon: PenTool, labelKey: "whiteboard" },
  { href: "/weekly-scheduler", icon: CalendarClock, labelKey: "weeklyScheduler" },
  { href: "/terms", icon: BookA, labelKey: "terms" },
  { href: "/bookmarks", icon: ExternalLink, labelKey: "bookmarks" },
];

export function TopNav() {
  const { isOpen, toggle } = useSidebar();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { t } = useTranslation("navigation");

  const handleExportAll = async () => {
    try {
      const exportData = await db.transaction('r', db.tables, async () => {
        const data: Record<string, unknown[]> = {};
        for (const table of db.tables) {
          data[table.name] = await table.toArray();
        }
        return data;
      });

      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `desk-tools-backup-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error("Export failed:", error);
      alert("Export failed");
    }
  };

  const handleImportAll = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "application/json";
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;

      try {
        const text = await file.text();
        const data = JSON.parse(text);
        
        await db.transaction('rw', db.tables, async () => {
           for (const tableName of Object.keys(data)) {
              const table = db.table(tableName);
              if (table) {
                 await table.bulkPut(data[tableName]); 
              }
           }
        });
        alert("Import successful! Please refresh the page.");
        window.location.reload();
      } catch (error) {
         console.error("Import failed:", error);
         alert("Import failed");
      }
    };
    input.click();
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 max-w-screen-2xl items-center px-6 md:px-8">
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
        <div className="mr-2 flex">
          <Link href="/" className="mr-4 flex items-center space-x-2">
            <Database className="h-5 w-5 md:ml-1" />
            <span className="font-bold text-lg hidden sm:inline whitespace-nowrap"> {t("brand")}</span>
          </Link>
        </div>

        {/* Spacer to push everything to the right */}
        <div className="flex-1" />

        {/* Core Navigation - Hidden on mobile */}
        <nav className="hidden md:flex items-center gap-1 lg:gap-2 text-sm font-medium mr-4">
          {navItems.map((item) => (
            <Link key={item.href} href={item.href}>
              <Button variant="ghost" className="gap-2 px-2 lg:px-3">
                <item.icon className="h-4 w-4" />
                <span className="hidden xl:inline">{t(item.labelKey)}</span>
              </Button>
            </Link>
          ))}
        </nav>

        {/* Right side controls */}
        <div className="flex items-center gap-1 sm:gap-2">
          {/* Local storage indicator */}
          <div className="hidden md:flex items-center gap-1.5 text-[11px] text-muted-foreground mr-2 whitespace-nowrap">
            <div className="h-1.5 w-1.5 rounded-full bg-green-500" />
            <span>{t("localStorage")}</span>
          </div>

          <div className="hidden md:flex items-center gap-1">
            <Button variant="ghost" size="icon" title="Export All Data" onClick={handleExportAll}>
              <Download className="h-5 w-5" />
              <span className="sr-only">Export All Data</span>
            </Button>
            <Button variant="ghost" size="icon" title="Import All Data" onClick={handleImportAll}>
              <Upload className="h-5 w-5" />
              <span className="sr-only">Import All Data</span>
            </Button>
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

          {/* Settings dialog */}
          <SettingsDialog />

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
