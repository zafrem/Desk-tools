import { TopNav } from "@/components/top-nav";
import { ToolSidebar } from "@/components/tool-sidebar";

interface AppLayoutProps {
  children: React.ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  return (
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
  );
}
