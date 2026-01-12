"use client";

import { useState } from "react";
import Link from "next/link";
import { Database, LayoutDashboard, StickyNote, PenTool, BookA, Github, ExternalLink, PanelRightClose, PanelRightOpen, Menu, X } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { useSidebar } from "@/components/sidebar-context";

const navItems = [
  { href: "/kanban", icon: LayoutDashboard, label: "Kanban Board" },
  { href: "/notepad", icon: StickyNote, label: "Notepad" },
  { href: "/whiteboard", icon: PenTool, label: "Whiteboard" },
  { href: "/terms", icon: BookA, label: "Terms" },
  { href: "/bookmarks", icon: ExternalLink, label: "Bookmarks" },
];

export function TopNav() {
  const { isOpen, toggle } = useSidebar();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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
          <span className="sr-only">Toggle menu</span>
        </Button>

        {/* Logo/Brand */}
        <div className="mr-4 flex">
          <Link href="/" className="mr-6 flex items-center space-x-2">
            <Database className="h-6 w-6 md:ml-2" />
            <span className="font-bold text-xl hidden sm:inline"> Desk-tools</span>
          </Link>
        </div>

        {/* Core Navigation - Hidden on mobile */}
        <nav className="hidden md:flex items-center gap-4 lg:gap-6 text-sm font-medium flex-1">
          {navItems.map((item) => (
            <Link key={item.href} href={item.href}>
              <Button variant="ghost" className="gap-2">
                <item.icon className="h-4 w-4" />
                <span className="hidden lg:inline">{item.label}</span>
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
            <span>Local Storage</span>
          </div>

          <Link href="https://github.com/zafrem/Desk-tools/issues" target="_blank" rel="noopener noreferrer">
            <Button variant="ghost" size="icon" title="Report an issue on GitHub">
              <Github className="h-5 w-5" />
              <span className="sr-only">GitHub</span>
            </Button>
          </Link>

          {/* Theme toggle */}
          <ThemeToggle />

          {/* Sidebar toggle */}
          <Button
            variant="ghost"
            size="icon"
            onClick={toggle}
            title={isOpen ? "Close sidebar" : "Open sidebar"}
            className="hidden lg:flex"
          >
            {isOpen ? (
              <PanelRightClose className="h-5 w-5" />
            ) : (
              <PanelRightOpen className="h-5 w-5" />
            )}
            <span className="sr-only">Toggle sidebar</span>
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
                  {item.label}
                </Button>
              </Link>
            ))}
          </div>
        </nav>
      )}
    </header>
  );
}
