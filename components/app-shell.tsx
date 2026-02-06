"use client";

import * as React from "react";
import dynamic from "next/dynamic";
import { SidebarProvider, useSidebar } from "@/components/sidebar-context";
import { TopNav } from "@/components/top-nav";

const ToolSidebar = dynamic(() => import("@/components/tool-sidebar").then(mod => mod.ToolSidebar), {
  ssr: false,
});

function AppShellInner({ children }: { children: React.ReactNode }) {
  const { isOpen } = useSidebar();

  return (
    <div className="relative min-h-screen">
      <TopNav />
      <div className="flex">
        {/* Main content area */}
        <main
          className={`flex-1 transition-[margin] duration-300 ease-in-out ${
            isOpen ? "mr-0 lg:mr-80" : "mr-0"
          }`}
        >
          {children}
        </main>
        {/* Right sidebar */}
        <ToolSidebar />
      </div>
    </div>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
      <AppShellInner>{children}</AppShellInner>
    </SidebarProvider>
  );
}
