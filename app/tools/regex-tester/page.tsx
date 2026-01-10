"use client";

import * as React from "react";
import { ToolLayout } from "@/components/tool-layout";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent } from "@/components/ui/card";

export default function RegexTesterPage() {
  const [pattern, setPattern] = React.useState("[a-zA-Z]+");
  const [flags, setFlags] = React.useState("g");
  const [text, setText] = React.useState("Hello world! This is a simple regex test.");
  const [highlighted, setHighlighted] = React.useState<React.ReactNode>(text);

  React.useEffect(() => {
    try {
      if (!pattern) {
        setHighlighted(text);
        return;
      }
      // const regex = new RegExp(pattern, flags); // Unused
      const parts = [];
      let lastIndex = 0;

      // Reset lastIndex for global searches manually if needed, 
      // but exec() does it automatically for 'g'
      
      // We need to clone regex to avoid side effects or infinite loops if 'g' is missing 
      // but we iterate manually? No, split logic is safer.
      
      const safeRegex = new RegExp(pattern, flags.includes('g') ? flags : flags + 'g'); 
      // Force 'g' for highlighting all occurrences, unless user specifically wants one? 
      // Usually regex testers highlight all.

      const matches = [...text.matchAll(safeRegex)];
      
      if (matches.length === 0) {
          setHighlighted(text);
          return;
      }

      matches.forEach((m, i) => {
          if (m.index === undefined) return;
          // Non-match part
          if (m.index > lastIndex) {
              parts.push(<span key={`t-${i}`}>{text.slice(lastIndex, m.index)}</span>);
          }
          // Match part
          parts.push(
              <span key={`m-${i}`} className="bg-yellow-200 dark:bg-yellow-900 text-black dark:text-yellow-100 rounded px-0.5 border border-yellow-300 dark:border-yellow-700">
                  {m[0]}
              </span>
          );
          lastIndex = m.index + m[0].length;
      });

      if (lastIndex < text.length) {
          parts.push(<span key="end">{text.slice(lastIndex)}</span>);
      }

      setHighlighted(<>{parts}</>);
    } catch {
      setHighlighted(<span className="text-destructive">Invalid Regex</span>);
    }
  }, [pattern, flags, text]);

  const toggleFlag = (flag: string) => {
    if (flags.includes(flag)) {
      setFlags(flags.replace(flag, ""));
    } else {
      setFlags(flags + flag);
    }
  };

  return (
    <ToolLayout
      title="Regex Tester"
      description="Test regular expressions in real-time with highlighting."
    >
      <div className="space-y-6">
        {/* Pattern Input */}
        <div className="space-y-2">
            <Label>Pattern</Label>
            <div className="flex items-center gap-2">
                <span className="font-mono text-lg text-muted-foreground">/</span>
                <Input 
                    value={pattern} 
                    onChange={(e) => setPattern(e.target.value)} 
                    className="font-mono text-lg"
                    placeholder="Pattern..."
                />
                <span className="font-mono text-lg text-muted-foreground">/</span>
                <Input 
                    value={flags} 
                    onChange={(e) => setFlags(e.target.value)} 
                    className="w-20 font-mono text-lg"
                    placeholder="flags"
                />
            </div>
            <div className="flex gap-4 pt-2">
                {['g', 'i', 'm', 's', 'u', 'y'].map(f => (
                    <div key={f} className="flex items-center space-x-2">
                        <Checkbox 
                            id={`flag-${f}`} 
                            checked={flags.includes(f)} 
                            onCheckedChange={() => toggleFlag(f)}
                        />
                        <Label htmlFor={`flag-${f}`} className="font-mono">{f}</Label>
                    </div>
                ))}
            </div>
        </div>

        {/* Text Input */}
        <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-2">
                <Label>Test String</Label>
                <Textarea 
                    value={text} 
                    onChange={(e) => setText(e.target.value)} 
                    className="min-h-[300px] font-mono whitespace-pre text-sm"
                />
            </div>

            <div className="space-y-2">
                <Label>Match Result</Label>
                <Card className="min-h-[300px] bg-muted/30">
                    <CardContent className="p-4 font-mono whitespace-pre-wrap break-all text-sm">
                        {highlighted}
                    </CardContent>
                </Card>
            </div>
        </div>
      </div>
    </ToolLayout>
  );
}
