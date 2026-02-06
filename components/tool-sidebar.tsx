"use client";

import * as React from "react";
import Link from "next/link";
import { Search, X, PanelRightOpen } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { searchTools } from "@/lib/search";
import { Tool } from "@/types/tool";
import * as LucideIcons from "lucide-react";
import { MessageSquare, Plus, History } from "lucide-react";
import { useSidebar } from "@/components/sidebar-context";
import { useTranslation } from "react-i18next";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "@/lib/db";

export function ToolSidebar() {
  const { isOpen, toggle, close } = useSidebar();
  const [searchQuery, setSearchQuery] = React.useState("");
  const { t } = useTranslation("navigation");
  const { t: tTools } = useTranslation("tools");

  const isOllamaConfigured = useLiveQuery(async () => {
    const connected = await db.preferences.where("key").equals("ollama_connected").first();
    const baseUrl = await db.preferences.where("key").equals("ollama_base_url").first();
    const model = await db.preferences.where("key").equals("ollama_model").first();
    return !!(connected?.value === "true" && baseUrl?.value && model?.value);
  }, []);

  const recentChats = useLiveQuery(
    () => db.chatSessions.orderBy("updatedAt").reverse().limit(5).toArray(),
    []
  );

  const { aiTools, generalTools } = React.useMemo(() => {
    const allTools = searchTools(searchQuery);
    return {
      aiTools: isOllamaConfigured ? allTools.filter(tool => tool.category === "ai") : [],
      generalTools: allTools.filter(tool => tool.category !== "ai")
    };
  }, [searchQuery, isOllamaConfigured]);

  // Close sidebar on mobile when clicking a link
  const handleLinkClick = () => {
    if (window.innerWidth < 1024) {
      close();
    }
  };

  const renderToolLink = (tool: Tool) => {
    const IconComponent = tool.icon
      ? (LucideIcons[tool.icon as keyof typeof LucideIcons] as React.ComponentType<{ className?: string }>)
      : null;

    return (
      <Link
        key={tool.id}
        href={tool.path}
        onClick={handleLinkClick}
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
          <div className="font-medium leading-none">
            {tTools(`${tool.id}.name`, { defaultValue: tool.name })}
          </div>
          <div className="text-xs text-muted-foreground line-clamp-2">
            {tTools(`${tool.id}.description`, { defaultValue: tool.description })}
          </div>
          <div className="flex flex-wrap gap-1 mt-1">
            {tool.tags.slice(0, 3).map((tag: string) => (
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
  };

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={close}
        />
      )}

      {/* Mobile toggle button - shown when sidebar is closed */}
      <Button
        variant="outline"
        size="icon"
        onClick={toggle}
        className={`fixed bottom-4 right-4 z-50 lg:hidden shadow-lg ${isOpen ? "hidden" : ""}`}
      >
        <PanelRightOpen className="h-5 w-5" />
        <span className="sr-only">{t("openSidebar")}</span>
      </Button>

      <aside
        className={`fixed right-0 top-14 h-[calc(100vh-3.5rem)] w-80 border-l bg-background overflow-hidden flex flex-col z-50 transition-transform duration-300 ease-in-out ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {/* Sticky Search Bar */}
        <div className="p-4 border-b bg-background">
          <div className="flex items-center gap-2 mb-2 lg:hidden">
            <span className="font-semibold flex-1">{t("tools")}</span>
            <Button variant="ghost" size="icon" onClick={close}>
              <X className="h-5 w-5" />
              <span className="sr-only">{t("closeSidebar")}</span>
            </Button>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder={t("searchPlaceholder")}
              className="pl-9"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            {t("toolsAvailable", { count: aiTools.length + generalTools.length })}
          </p>
        </div>

        {/* Tool List */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-2 space-y-6">
            {/* AI Modules Section */}
            {isOllamaConfigured && (
              <div className="space-y-4">
                <div className="space-y-1">
                  <h3 className="px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                    <LucideIcons.Sparkles className="h-3 w-3 text-yellow-500" />
                    {t("aiModules")}
                  </h3>
                  {aiTools.map(renderToolLink)}
                </div>

                {/* Chat Conversations Sub-menu */}
                <div className="space-y-1">
                  <div className="px-3 flex items-center justify-between">
                    <h4 className="text-[10px] font-bold text-muted-foreground/70 uppercase tracking-widest flex items-center gap-1.5">
                      <History className="h-3 w-3" />
                      {t("recentChats")}
                    </h4>
                    <Link 
                      href="/tools/ai-chat" 
                      onClick={handleLinkClick}
                      className="p-1 rounded-md hover:bg-accent text-muted-foreground hover:text-accent-foreground transition-colors"
                      title={t("newChat")}
                    >
                      <Plus className="h-3 w-3" />
                    </Link>
                  </div>
                  
                  <div className="space-y-0.5">
                    {recentChats && recentChats.length > 0 ? (
                      recentChats.map((chat) => (
                        <Link
                          key={chat.id}
                          href={`/tools/ai-chat?id=${chat.id}`}
                          onClick={handleLinkClick}
                          className="flex items-center gap-2 px-3 py-1.5 text-xs rounded-md hover:bg-accent hover:text-accent-foreground transition-colors group"
                        >
                          <MessageSquare className="h-3 w-3 text-muted-foreground group-hover:text-primary transition-colors" />
                          <span className="flex-1 truncate">
                            {chat.title || t("untitledChat")}
                          </span>
                        </Link>
                      ))
                    ) : (
                      <div className="px-3 py-2 text-[10px] text-muted-foreground italic">
                        {t("noRecentChats")}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* General Tools Section */}
            <div className="space-y-1">
              {isOllamaConfigured && (
                <h3 className="px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  {t("generalTools")}
                </h3>
              )}
              {generalTools.map(renderToolLink)}
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
