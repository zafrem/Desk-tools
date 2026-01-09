"use client";

import * as React from "react";
import Link from "next/link";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { searchTools } from "@/lib/search";
import { Tool } from "@/types/tool";
import * as LucideIcons from "lucide-react";

export function ToolSidebar() {
  const [searchQuery, setSearchQuery] = React.useState("");
  const [filteredTools, setFilteredTools] = React.useState<Tool[]>([]);

  React.useEffect(() => {
    const results = searchTools(searchQuery);
    setFilteredTools(results);
  }, [searchQuery]);

  return (
    <aside className="fixed right-0 top-14 h-[calc(100vh-3.5rem)] w-80 border-l bg-background overflow-hidden flex flex-col">
      {/* Sticky Search Bar */}
      <div className="p-4 border-b bg-background">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search tools..."
            className="pl-9"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <p className="text-xs text-muted-foreground mt-2">
          {filteredTools.length} tools available
        </p>
      </div>

      {/* Tool List */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-2 space-y-1">
          {filteredTools.map((tool) => {
            const IconComponent = tool.icon
              ? (LucideIcons[tool.icon as keyof typeof LucideIcons] as React.ComponentType<{ className?: string }>)
              : null;

            return (
              <Link
                key={tool.id}
                href={tool.path}
                className="flex items-start gap-3 rounded-lg px-3 py-2 text-sm hover:bg-accent hover:text-accent-foreground transition-colors"
              >
                <div className="mt-0.5">
                  {IconComponent ? (
                    <IconComponent className="h-4 w-4" />
                  ) : (
                    <div className="h-4 w-4" />
                  )}
                </div>
                <div className="flex-1 space-y-1">
                  <div className="font-medium leading-none">{tool.name}</div>
                  <div className="text-xs text-muted-foreground line-clamp-2">
                    {tool.description}
                  </div>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {tool.tags.slice(0, 3).map((tag) => (
                      <span
                        key={tag}
                        className="inline-flex items-center rounded-md bg-secondary px-1.5 py-0.5 text-xs font-medium text-secondary-foreground"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </aside>
  );
}
