"use client";

import * as React from "react";

interface SidebarContextType {
  isOpen: boolean;
  toggle: () => void;
  open: () => void;
  close: () => void;
}

const SidebarContext = React.createContext<SidebarContextType | undefined>(undefined);

export function SidebarProvider({ children }: { children: React.ReactNode }) {
  // Start closed on mobile (< 1024px), open on desktop
  const [isOpen, setIsOpen] = React.useState(false);

  // Set initial state based on screen size after mount
  React.useEffect(() => {
    setIsOpen(window.innerWidth >= 1024);
  }, []);

  const toggle = React.useCallback(() => setIsOpen((prev) => !prev), []);
  const open = React.useCallback(() => setIsOpen(true), []);
  const close = React.useCallback(() => setIsOpen(false), []);

  return (
    <SidebarContext.Provider value={{ isOpen, toggle, open, close }}>
      {children}
    </SidebarContext.Provider>
  );
}

export function useSidebar() {
  const context = React.useContext(SidebarContext);
  if (context === undefined) {
    throw new Error("useSidebar must be used within a SidebarProvider");
  }
  return context;
}
