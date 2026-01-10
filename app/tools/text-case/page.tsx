"use client";

import * as React from "react";
import { ToolLayout } from "@/components/tool-layout";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Copy } from "lucide-react";

export default function TextCasePage() {
  const [text, setText] = React.useState("Hello World! This is a test.");

  // Helper to copy text
  const copy = (val: string) => {
    navigator.clipboard.writeText(val);
  };

  // Transformation functions
  const transformations = [
    {
        name: "UPPER CASE",
        transform: (s: string) => s.toUpperCase(),
    },
    {
        name: "lower case",
        transform: (s: string) => s.toLowerCase(),
    },
    {
        name: "Capitalized Case",
        transform: (s: string) => s.replace(/\b\w/g, l => l.toUpperCase()),
    },
    {
        name: "Sentence case",
        transform: (s: string) => s.toLowerCase().replace(/(^\s*\w|[.!?]\s*\w)/g, c => c.toUpperCase()),
    },
    {
        name: "camelCase",
        transform: (s: string) => s
            .replace(/(?:^\w|[A-Z]|\b\w)/g, (word, index) => 
                index === 0 ? word.toLowerCase() : word.toUpperCase()
            )
            .replace(/\s+/g, ''),
    },
    {
        name: "PascalCase",
        transform: (s: string) => s
            .replace(/\w+/g, w => w[0].toUpperCase() + w.slice(1).toLowerCase())
            .replace(/\s+/g, ''),
    },
    {
        name: "snake_case",
        transform: (s: string) => s && s.match(/[A-Z]{2,}(?=[A-Z][a-z]+[0-9]*|\b)|[A-Z]?[a-z]+[0-9]*|[A-Z]|[0-9]+/g)!
            .map(x => x.toLowerCase())
            .join('_'),
    },
    {
        name: "kebab-case",
        transform: (s: string) => s && s.match(/[A-Z]{2,}(?=[A-Z][a-z]+[0-9]*|\b)|[A-Z]?[a-z]+[0-9]*|[A-Z]|[0-9]+/g)!
            .map(x => x.toLowerCase())
            .join('-'),
    },
    {
        name: "Alternating cAsE",
        transform: (s: string) => s.split('').map((c, i) => i % 2 === 0 ? c.toUpperCase() : c.toLowerCase()).join(''),
    },
    {
        name: "Title Case",
        transform: (s: string) => s.replace(
            /\w\S*/g,
            (txt) => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase()
        )
    }
  ];

  return (
    <ToolLayout
      title="Text Case Converter"
      description="Easily convert text between different cases (upper, lower, camel, snake, etc.)."
    >
      <div className="grid gap-8 lg:grid-cols-[1fr_400px]">
        {/* Input */}
        <div className="space-y-4">
            <Label htmlFor="input">Input Text</Label>
            <Textarea 
                id="input"
                value={text} 
                onChange={(e) => setText(e.target.value)} 
                className="min-h-[200px] text-lg"
                placeholder="Type something..."
            />
            <div className="flex gap-2 justify-end">
                <Button variant="outline" size="sm" onClick={() => setText("")}>Clear</Button>
                <Button variant="outline" size="sm" onClick={() => setText("The quick brown fox jumps over the lazy dog")}>Sample</Button>
            </div>
        </div>

        {/* Outputs */}
        <div className="space-y-4">
            <Label>Conversions</Label>
            <div className="grid gap-3">
                {transformations.map((t) => {
                    const result = text ? t.transform(text) : "";
                    return (
                        <Card key={t.name} className="overflow-hidden">
                            <CardContent className="p-3 flex items-center justify-between gap-3 bg-muted/30 hover:bg-muted/50 transition-colors">
                                <div className="min-w-0 flex-1">
                                    <div className="text-xs text-muted-foreground mb-0.5">{t.name}</div>
                                    <div className="font-medium truncate text-sm select-all">{result || "..."}</div>
                                </div>
                                <Button size="icon" variant="ghost" onClick={() => copy(result)} disabled={!result}>
                                    <Copy className="h-4 w-4" />
                                </Button>
                            </CardContent>
                        </Card>
                    );
                })}
            </div>
        </div>
      </div>
    </ToolLayout>
  );
}
