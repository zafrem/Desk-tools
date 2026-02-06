"use client";

import * as React from "react";
import { ToolLayout } from "@/components/tool-layout";
import { MessageSquare, Sparkles, AlertTriangle, Send, Loader2, User, Bot, Trash2 } from "lucide-react";
import { useLiveQuery } from "dexie-react-hooks";
import { db, ChatMessage } from "@/lib/db";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { useSearchParams, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

export default function AIChatPage() {
  const { t } = useTranslation("tools");
  const searchParams = useSearchParams();
  const router = useRouter();
  const sessionId = searchParams.get("id");

  const [input, setInput] = React.useState("");
  const [isLoading, setIsLoading] = React.useState(false);
  const [currentResponse, setCurrentResponse] = React.useState("");
  const scrollRef = React.useRef<HTMLDivElement>(null);

  // Load configuration
  const config = useLiveQuery(async () => {
    const baseUrl = await db.preferences.where("key").equals("ollama_base_url").first();
    const model = await db.preferences.where("key").equals("ollama_model").first();
    const connected = await db.preferences.where("key").equals("ollama_connected").first();
    return {
      baseUrl: baseUrl?.value || "http://localhost:11434",
      model: model?.value || "llama3",
      isConnected: connected?.value === "true"
    };
  }, []);

  // Load current session
  const session = useLiveQuery(
    () => (sessionId ? db.chatSessions.get(Number(sessionId)) : Promise.resolve(undefined)),
    [sessionId]
  );

  // Scroll to bottom when messages or current response change
  React.useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [session?.messages, currentResponse]);

  const handleSend = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!input.trim() || !config?.isConnected || isLoading) return;

    const userMessage: ChatMessage = {
      role: "user",
      content: input.trim(),
      timestamp: new Date(),
    };

    const targetSessionId = sessionId ? Number(sessionId) : null;
    let activeId: number;

    setIsLoading(true);
    setInput("");

    try {
      // 1. Create session if it doesn't exist
      if (!targetSessionId) {
        activeId = await db.chatSessions.add({
          title: userMessage.content.slice(0, 30) + (userMessage.content.length > 30 ? "..." : ""),
          messages: [userMessage],
          model: config.model,
          createdAt: new Date(),
          updatedAt: new Date(),
        });
        router.push(`/tools/ai-chat?id=${activeId}`);
      } else {
        activeId = targetSessionId;
        const currentSession = await db.chatSessions.get(activeId);
        if (currentSession) {
          await db.chatSessions.update(activeId, {
            messages: [...currentSession.messages, userMessage],
            updatedAt: new Date(),
          });
        }
      }

      // 2. Call Ollama API (Streaming)
      const messagesForApi = session?.messages 
        ? [...session.messages, userMessage] 
        : [userMessage];

      const response = await fetch(`${config.baseUrl}/api/chat`, {
        method: "POST",
        body: JSON.stringify({
          model: config.model,
          messages: messagesForApi.map(m => ({ role: m.role, content: m.content })),
          stream: true,
        }),
      });

      if (!response.ok) throw new Error("Ollama error");

      const reader = response.body?.getReader();
      let accumulatedResponse = "";

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = new TextDecoder().decode(value);
          const lines = chunk.split("\n");
          
          for (const line of lines) {
            if (!line.trim()) continue;
            try {
              const json = JSON.parse(line);
              if (json.message?.content) {
                accumulatedResponse += json.message.content;
                setCurrentResponse(accumulatedResponse);
              }
            } catch (err) {
              console.error("Error parsing JSON chunk", err);
            }
          }
        }
      }

      // 3. Save assistant response
      const assistantMessage: ChatMessage = {
        role: "assistant",
        content: accumulatedResponse,
        timestamp: new Date(),
      };

      const finalSession = await db.chatSessions.get(activeId);
      if (finalSession) {
        await db.chatSessions.update(activeId, {
          messages: [...finalSession.messages, assistantMessage],
          updatedAt: new Date(),
        });
      }
    } catch (error) {
      console.error("Chat error:", error);
    } finally {
      setIsLoading(false);
      setCurrentResponse("");
    }
  };

  const deleteSession = async () => {
    if (sessionId) {
      await db.chatSessions.delete(Number(sessionId));
      router.push("/tools/ai-chat");
    }
  };

  if (config?.isConnected === false) {
    return (
      <ToolLayout title={t("ai-chat.name")} description={t("ai-chat.description")}>
        <div className="flex flex-col items-center justify-center min-h-[400px] text-center space-y-4">
          <div className="p-4 rounded-full bg-yellow-500/10">
            <AlertTriangle className="h-12 w-12 text-yellow-500" />
          </div>
          <div className="space-y-2 max-w-md">
            <h2 className="text-2xl font-bold">{t("ai-chat.connectionRequired")}</h2>
            <p className="text-muted-foreground">{t("ai-chat.connectionMessage")}</p>
          </div>
        </div>
      </ToolLayout>
    );
  }

  return (
    <ToolLayout title={t("ai-chat.name")} description={t("ai-chat.description")}>
      <div className="flex flex-col h-[calc(100vh-12rem)] max-w-4xl mx-auto border rounded-xl bg-card overflow-hidden shadow-sm">
        {/* Chat Header */}
        <div className="p-4 border-b flex items-center justify-between bg-muted/30">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Sparkles className="h-4 w-4 text-primary" />
            </div>
            <div>
              <h3 className="text-sm font-semibold truncate max-w-[200px] md:max-w-md">
                {session?.title || t("ai-chat.newChat")}
              </h3>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">
                Model: {config?.model}
              </p>
            </div>
          </div>
          {sessionId && (
            <Button variant="ghost" size="icon" onClick={deleteSession} className="text-muted-foreground hover:text-destructive">
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </div>

        {/* Message List */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-6">
          {!session && !isLoading && (
            <div className="flex flex-col items-center justify-center h-full text-center space-y-4 text-muted-foreground">
              <MessageSquare className="h-12 w-12 opacity-20" />
              <p>{t("ai-chat.startConversation")}</p>
            </div>
          )}
          
          {session?.messages.map((msg, i) => (
            <div key={i} className={cn("flex gap-3", msg.role === "user" ? "flex-row-reverse" : "flex-row")}>
              <div className={cn("mt-1 p-2 rounded-lg shrink-0", msg.role === "user" ? "bg-primary text-primary-foreground" : "bg-muted")}>
                {msg.role === "user" ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
              </div>
              <Card className={cn("p-3 max-w-[85%] text-sm leading-relaxed shadow-none", msg.role === "user" ? "bg-primary text-primary-foreground border-none" : "bg-muted/50")}>
                <div className="whitespace-pre-wrap">{msg.content}</div>
              </Card>
            </div>
          ))}

          {currentResponse && (
            <div className="flex gap-3">
              <div className="mt-1 p-2 rounded-lg bg-muted shrink-0">
                <Bot className="h-4 w-4" />
              </div>
              <Card className="p-3 max-w-[85%] text-sm bg-muted/50 leading-relaxed shadow-none">
                <div className="whitespace-pre-wrap">
                  {currentResponse}
                  <span className="inline-block w-2 h-4 ml-1 bg-primary animate-pulse align-middle" />
                </div>
              </Card>
            </div>
          )}

          {isLoading && !currentResponse && (
            <div className="flex gap-3">
              <div className="mt-1 p-2 rounded-lg bg-muted shrink-0">
                <Bot className="h-4 w-4" />
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-3 w-3 animate-spin" />
                Thinking...
              </div>
            </div>
          )}
        </div>

        {/* Input Area */}
        <div className="p-4 border-t bg-background">
          <form onSubmit={handleSend} className="flex gap-2">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={t("ai-chat.inputPlaceholder")}
              disabled={isLoading}
              className="flex-1"
            />
            <Button type="submit" disabled={isLoading || !input.trim()} size="icon">
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            </Button>
          </form>
          <p className="text-[10px] text-center text-muted-foreground mt-2">
            AI can make mistakes. Verify important information.
          </p>
        </div>
      </div>
    </ToolLayout>
  );
}