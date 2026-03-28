"use client";

import * as React from "react";
import { ToolLayout } from "@/components/tool-layout";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search, Copy, Check, History as HistoryIcon } from "lucide-react";
import { cn } from "@/lib/utils";

const CHARACTER_GROUPS = [
  {
    name: "Common Symbols",
    chars: ["©", "®", "™", "°", "•", "†", "‡", "§", "¶", "€", "£", "¥", "¢", "¤", "±", "×", "÷", "≠", "≈", "∞", "√", "µ", "∆", "∑", "∫", "π", "α", "β", "γ", "δ", "θ", "λ", "Ω"],
  },
  {
    name: "Arrows",
    chars: ["←", "↑", "→", "↓", "↔", "↕", "↖", "↗", "↘", "↙", "⇐", "⇑", "⇒", "⇓", "⇔", "⇕", "⇦", "⇧", "⇨", "⇩", "↺", "↻", "⇄", "⇅", "⇆", "⇇", "⇈", "⇉", "⇊", "⇚", "⇛"],
  },
  {
    name: "Geometry",
    chars: ["■", "□", "▲", "△", "▼", "▽", "◆", "◇", "●", "○", "★", "☆", "▪", "▫", "◆", "◇", "◊", "○", "◌", "◍", "◎", "●", "◐", "◑", "◒", "◓", "◔", "◕", "◖", "◗", "◘", "◙"],
  },
  {
    name: "Punctuation",
    chars: ["«", "»", "‹", "›", "“", "”", "‘", "’", "„", "‚", "—", "–", "…", "¿", "¡", "‽", "⁎", "⁑", "⁂", "⁕", "⁖", "⁗", "⁘", "⁙", "⁚", "⁛", "⁜", "⁝", "⁞"],
  },
  {
    name: "Emojis (Smiley)",
    chars: ["😀", "😃", "😄", "😁", "😆", "😅", "😂", "🤣", "😊", "😇", "🙂", "🙃", "😉", "😌", "😍", "🥰", "😘", "😗", "😙", "😚", "😋", "😛", "😝", "😜", "🤪", "🤨", "🧐", "🤓", "😎", "🤩", "🥳", "😏"],
  },
  {
    name: "Emojis (Nature)",
    chars: ["🐶", "🐱", "🐭", "🐹", "🐰", "🦊", "🐻", "🐼", "🐨", "🐯", "🦁", "🐮", "🐷", "🐵", "🐒", "🐔", "🐧", "🐦", "🐤", "🐣", "🐥", "🦆", "🦅", "🦉", "🦇", "🐺", "🐗", "🐴", "🦄", "🐝", "🐛", "🦋"],
  },
];

export default function CharacterMapPage() {
  const [searchQuery, setSearchQuery] = React.useState("");
  const [history, setHistory] = React.useState<string[]>([]);
  const [copiedChar, setCopiedChar] = React.useState<string | null>(null);

  const filteredGroups = React.useMemo(() => {
    if (!searchQuery) return CHARACTER_GROUPS;
    
    return CHARACTER_GROUPS.map(group => ({
      ...group,
      chars: group.chars.filter(char => char.includes(searchQuery))
    })).filter(group => group.chars.length > 0);
  }, [searchQuery]);

  const handleCopy = async (char: string) => {
    try {
      await navigator.clipboard.writeText(char);
      setCopiedChar(char);
      setHistory(prev => [char, ...prev.filter(c => c !== char)].slice(0, 24));
      setTimeout(() => setCopiedChar(null), 1500);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  return (
    <ToolLayout
      title="Character Map"
      description="Easily find and copy special characters, symbols, and emojis."
    >
      <div className="space-y-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search characters (e.g. ©, arrows, emojis)..."
            className="pl-10 h-12 text-lg"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {history.length > 0 && (
          <Card className="bg-muted/30">
            <CardHeader className="py-3 px-4">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <HistoryIcon className="h-4 w-4" />
                Recently Used
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <div className="flex flex-wrap gap-2">
                {history.map((char, i) => (
                  <button
                    key={i}
                    onClick={() => handleCopy(char)}
                    className="w-10 h-10 flex items-center justify-center text-xl bg-background border rounded-md hover:border-primary transition-colors relative group"
                    title={`Click to copy: ${char}`}
                  >
                    {char}
                    {copiedChar === char && (
                      <div className="absolute inset-0 bg-primary/20 flex items-center justify-center rounded-md animate-in fade-in duration-200">
                        <Check className="h-4 w-4 text-primary" />
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        <div className="space-y-6">
          {filteredGroups.length > 0 ? (
            filteredGroups.map((group) => (
              <div key={group.name} className="space-y-3">
                <h3 className="text-sm font-semibold text-muted-foreground px-1">{group.name}</h3>
                <div className="grid grid-cols-6 sm:grid-cols-8 md:grid-cols-10 lg:grid-cols-12 gap-2">
                  {group.chars.map((char, i) => (
                    <button
                      key={i}
                      onClick={() => handleCopy(char)}
                      className="aspect-square flex items-center justify-center text-2xl bg-card border rounded-lg hover:border-primary hover:shadow-sm transition-all relative group"
                      title={`Click to copy: ${char}`}
                    >
                      {char}
                      <div className="absolute inset-0 bg-primary/0 group-hover:bg-primary/5 transition-colors rounded-lg" />
                      {copiedChar === char && (
                        <div className="absolute inset-0 bg-primary/20 flex items-center justify-center rounded-lg animate-in zoom-in-75 duration-200">
                          <Check className="h-5 w-5 text-primary" />
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-12 bg-muted/20 rounded-lg border-2 border-dashed">
              <p className="text-muted-foreground">No characters match your search query.</p>
              <Button variant="link" onClick={() => setSearchQuery("")}>Clear search</Button>
            </div>
          )}
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Usage Tip</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            Click on any character to copy it to your clipboard. Your recently copied characters will be saved at the top for quick access.
          </CardContent>
        </Card>
      </div>
    </ToolLayout>
  );
}
