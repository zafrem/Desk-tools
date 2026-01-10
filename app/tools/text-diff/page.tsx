"use client";

import * as React from "react";
import { ToolLayout } from "@/components/tool-layout";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { diffChars, diffWords, diffLines, Change } from "diff";

export default function TextDiffPage() {
  const [oldText, setOldText] = React.useState("The quick brown fox jumps over the lazy dog.");
  const [newText, setNewText] = React.useState("The quick red fox jumped over the lazy dog.");
  const [diffMode, setDiffMode] = React.useState<"chars" | "words" | "lines">("words");
  const [diffResult, setDiffResult] = React.useState<Change[]>([]);

  React.useEffect(() => {
    let result;
    if (diffMode === "chars") result = diffChars(oldText, newText);
    else if (diffMode === "words") result = diffWords(oldText, newText);
    else result = diffLines(oldText, newText);
    
    setDiffResult(result);
  }, [oldText, newText, diffMode]);

  return (
    <ToolLayout
      title="Text Diff"
      description="Compare two texts and highlight the differences."
    >
      <div className="space-y-6">
        {/* Controls */}
        <div className="flex gap-2 justify-center">
            <Button 
                variant={diffMode === "chars" ? "default" : "outline"} 
                onClick={() => setDiffMode("chars")}
            >
                Chars
            </Button>
            <Button 
                variant={diffMode === "words" ? "default" : "outline"} 
                onClick={() => setDiffMode("words")}
            >
                Words
            </Button>
            <Button 
                variant={diffMode === "lines" ? "default" : "outline"} 
                onClick={() => setDiffMode("lines")}
            >
                Lines
            </Button>
        </div>

        {/* Inputs */}
        <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-2">
                <Label>Original Text</Label>
                <Textarea 
                    value={oldText} 
                    onChange={(e) => setOldText(e.target.value)} 
                    className="min-h-[200px] font-mono text-sm"
                />
            </div>
            <div className="space-y-2">
                <Label>New Text</Label>
                <Textarea 
                    value={newText} 
                    onChange={(e) => setNewText(e.target.value)} 
                    className="min-h-[200px] font-mono text-sm"
                />
            </div>
        </div>

        {/* Output */}
        <Card>
            <CardHeader>
                <CardTitle>Comparison Result</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="p-4 bg-muted/30 rounded-lg font-mono text-sm whitespace-pre-wrap break-all leading-relaxed">
                    {diffResult.map((part, index) => {
                        const color = part.added ? "bg-green-200 dark:bg-green-900 text-green-800 dark:text-green-100" :
                                      part.removed ? "bg-red-200 dark:bg-red-900 text-red-800 dark:text-red-100 line-through decoration-red-500" : 
                                      "text-muted-foreground";
                        return (
                            <span key={index} className={`${color} px-0.5 rounded`}>
                                {part.value}
                            </span>
                        );
                    })}
                </div>
            </CardContent>
        </Card>
      </div>
    </ToolLayout>
  );
}
