"use client";

import * as React from "react";
import { ToolLayout } from "@/components/tool-layout";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { AlignLeft, Type, Hash, FileText } from "lucide-react";

export default function WordCounterPage() {
  const [text, setText] = React.useState("");

  const stats = React.useMemo(() => {
    const trimmed = text.trim();
    if (!trimmed) return { words: 0, chars: 0, charsNoSpace: 0, sentences: 0, paragraphs: 0 };

    const words = trimmed.split(/\s+/).length;
    const chars = text.length;
    const charsNoSpace = text.replace(/\s/g, "").length;
    const sentences = trimmed.split(/[.!?]+/).length - 1 || 1;
    const paragraphs = text.split(/\n\s*\n/).filter(Boolean).length;

    return { words, chars, charsNoSpace, sentences, paragraphs };
  }, [text]);

  return (
    <ToolLayout
      title="Word Counter"
      description="Count words, characters, sentences, and paragraphs in your text."
    >
      <div className="grid gap-8 lg:grid-cols-[1fr_300px]">
        <div className="space-y-4">
            <Label htmlFor="input">Input Text</Label>
            <Textarea 
                id="input"
                value={text} 
                onChange={(e) => setText(e.target.value)} 
                className="min-h-[500px] font-mono text-sm leading-relaxed p-6"
                placeholder="Start typing or paste text here..."
            />
        </div>

        <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
                <Card>
                    <CardContent className="p-4 flex flex-col items-center justify-center text-center">
                        <Type className="h-6 w-6 mb-2 text-primary" />
                        <div className="text-3xl font-bold">{stats.words}</div>
                        <div className="text-xs text-muted-foreground">Words</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-4 flex flex-col items-center justify-center text-center">
                        <Hash className="h-6 w-6 mb-2 text-primary" />
                        <div className="text-3xl font-bold">{stats.chars}</div>
                        <div className="text-xs text-muted-foreground">Characters</div>
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardContent className="p-4 space-y-4">
                    <div className="flex justify-between items-center border-b pb-2">
                        <span className="text-sm text-muted-foreground flex items-center gap-2">
                            <AlignLeft className="h-4 w-4" /> Chars (no space)
                        </span>
                        <span className="font-bold">{stats.charsNoSpace}</span>
                    </div>
                    <div className="flex justify-between items-center border-b pb-2">
                        <span className="text-sm text-muted-foreground flex items-center gap-2">
                            <FileText className="h-4 w-4" /> Sentences
                        </span>
                        <span className="font-bold">{stats.sentences}</span>
                    </div>
                    <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground flex items-center gap-2">
                            <AlignLeft className="h-4 w-4" /> Paragraphs
                        </span>
                        <span className="font-bold">{stats.paragraphs}</span>
                    </div>
                </CardContent>
            </Card>
        </div>
      </div>
    </ToolLayout>
  );
}
