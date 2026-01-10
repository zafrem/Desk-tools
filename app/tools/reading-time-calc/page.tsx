"use client";

import * as React from "react";
import { ToolLayout } from "@/components/tool-layout";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Clock, FileText, AlignLeft, BookOpen } from "lucide-react";

export default function ReadingTimeCalcPage() {
  const [text, setText] = React.useState("");
  const [wpm] = React.useState(200);

  const stats = React.useMemo(() => {
    const trimmed = text.trim();
    if (!trimmed) return { words: 0, chars: 0, sentences: 0, time: 0 };

    const wordCount = trimmed.split(/\s+/).length;
    const charCount = trimmed.length;
    const sentenceCount = trimmed.split(/[.!?]+/).length - 1 || 1;
    const time = Math.ceil(wordCount / wpm);

    return { words: wordCount, chars: charCount, sentences: sentenceCount, time };
  }, [text, wpm]);

  return (
    <ToolLayout
      title="Reading Time Calculator"
      description="Estimate reading time for your content based on word count."
    >
      <div className="grid gap-8 lg:grid-cols-[1fr_300px]">
        <div className="space-y-4">
            <Label htmlFor="content">Content</Label>
            <Textarea 
                id="content"
                value={text} 
                onChange={(e) => setText(e.target.value)} 
                placeholder="Paste your article here..." 
                className="min-h-[400px] font-mono text-sm leading-relaxed"
            />
        </div>

        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Clock className="h-5 w-5" /> Reading Time
                    </CardTitle>
                </CardHeader>
                <CardContent className="text-center py-8">
                    <div className="text-5xl font-bold text-primary">{stats.time}</div>
                    <div className="text-sm text-muted-foreground mt-2">Minutes</div>
                    <div className="text-xs text-muted-foreground mt-4">
                        based on {wpm} WPM
                    </div>
                </CardContent>
            </Card>

            <div className="grid grid-cols-2 gap-4">
                <Card>
                    <CardContent className="p-4 flex flex-col items-center justify-center text-center">
                        <FileText className="h-6 w-6 mb-2 text-muted-foreground" />
                        <div className="text-2xl font-bold">{stats.words}</div>
                        <div className="text-xs text-muted-foreground">Words</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-4 flex flex-col items-center justify-center text-center">
                        <AlignLeft className="h-6 w-6 mb-2 text-muted-foreground" />
                        <div className="text-2xl font-bold">{stats.chars}</div>
                        <div className="text-xs text-muted-foreground">Characters</div>
                    </CardContent>
                </Card>
                <Card className="col-span-2">
                    <CardContent className="p-4 flex flex-col items-center justify-center text-center">
                        <BookOpen className="h-6 w-6 mb-2 text-muted-foreground" />
                        <div className="text-2xl font-bold">{stats.sentences}</div>
                        <div className="text-xs text-muted-foreground">Sentences (Approx)</div>
                    </CardContent>
                </Card>
            </div>
        </div>
      </div>
    </ToolLayout>
  );
}
