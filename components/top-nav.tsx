"use client";

import Link from "next/link";
import { Database, Calendar, StickyNote } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";

export function TopNav() {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 max-w-screen-2xl items-center">
        {/* Logo/Brand */}
        <div className="mr-4 flex">
          <Link href="/" className="mr-6 flex items-center space-x-2">
            <Database className="h-6 w-6 ml-2" />
            <span className="font-bold text-xl"> Desk-tools</span>
          </Link>
        </div>

        {/* Core Navigation */}
        <nav className="flex items-center gap-6 text-sm font-medium flex-1">
          <Link href="/gantt">
            <Button variant="ghost" className="gap-2">
              <Calendar className="h-4 w-4" />
              Gantt Chart
            </Button>
          </Link>
          <Link href="/notepad">
            <Button variant="ghost" className="gap-2">
              <StickyNote className="h-4 w-4" />
              Notepad
            </Button>
          </Link>
        </nav>

        {/* Right side controls */}
        <div className="flex items-center gap-2">
          {/* Local storage indicator */}
          <div className="hidden md:flex items-center gap-2 text-xs text-muted-foreground mr-4">
            <div className="h-2 w-2 rounded-full bg-green-500" />
            <span>Local Storage</span>
          </div>

          {/* Theme toggle */}
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
