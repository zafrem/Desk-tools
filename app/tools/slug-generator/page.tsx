"use client";

import * as React from "react";
import { ToolLayout } from "@/components/tool-layout";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent } from "@/components/ui/card";
import { Copy } from "lucide-react";

export default function SlugGeneratorPage() {
  const [input, setInput] = React.useState("");
  const [slug, setSlug] = React.useState("");
  const [lowercase, setLowercase] = React.useState(true);
  const [separator, setSeparator] = React.useState("-");
  const [removeStopWords, setRemoveStopWords] = React.useState(false);

  const generateSlug = React.useCallback(() => {
    let result = input;

    if (lowercase) {
      result = result.toLowerCase();
    }

    // Remove stop words (simple list)
    if (removeStopWords) {
        const stopWords = ["a", "an", "the", "and", "or", "but", "of", "to", "in", "on", "at", "with", "for"];
        const regex = new RegExp(`\\b(${stopWords.join("|")})\\b`, "gi");
        result = result.replace(regex, "");
    }

    result = result
      .trim()
      .normalize("NFD") // Split accented characters
      .replace(/[̀-ͯ]/g, "") // Remove accents
      .replace(/[^a-z0-9\s-]/gi, "") // Remove special chars
      .replace(/\s+/g, separator) // Replace spaces
      .replace(new RegExp(`\\${separator}+`, "g"), separator); // Remove duplicate separators

    setSlug(result);
  }, [input, lowercase, separator, removeStopWords]);

  React.useEffect(() => {
    generateSlug();
  }, [generateSlug]);

  const copyToClipboard = () => {
    navigator.clipboard.writeText(slug);
  };

  return (
    <ToolLayout
      title="Slug Generator"
      description="Convert titles and text into SEO-friendly URL slugs."
    >
      <div className="max-w-2xl mx-auto space-y-8">
        <div className="space-y-4">
            <Label htmlFor="input">Input Text</Label>
            <Input 
                id="input"
                value={input} 
                onChange={(e) => setInput(e.target.value)} 
                placeholder="Enter text to slugify (e.g. Hello World!)" 
                className="text-lg p-6"
            />
        </div>

        <Card className="bg-muted/50 border-primary/20">
            <CardContent className="p-6 flex items-center gap-4">
                <div className="flex-1 font-mono text-xl break-all text-primary">
                    {slug || "your-slug-here"}
                </div>
                <Button size="icon" variant="ghost" onClick={copyToClipboard} disabled={!slug} title="Copy">
                    <Copy className="h-5 w-5" />
                </Button>
            </CardContent>
        </Card>

        <Card>
            <CardContent className="p-6 space-y-6">
                <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider">Options</h3>
                
                <div className="grid grid-cols-2 gap-6">
                    <div className="flex items-center space-x-2">
                        <Checkbox id="lowercase" checked={lowercase} onCheckedChange={(c) => setLowercase(!!c)} />
                        <Label htmlFor="lowercase">Lowercase</Label>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                        <Checkbox id="stop-words" checked={removeStopWords} onCheckedChange={(c) => setRemoveStopWords(!!c)} />
                        <Label htmlFor="stop-words">Remove Stop Words (a, an, the...)</Label>
                    </div>
                </div>

                <div className="space-y-2">
                    <Label>Separator</Label>
                    <div className="flex gap-2">
                        {["-", "_", "."].map(sep => (
                            <Button 
                                key={sep}
                                variant={separator === sep ? "default" : "outline"}
                                size="sm"
                                onClick={() => setSeparator(sep)}
                                className="w-10 font-mono"
                            >
                                {sep}
                            </Button>
                        ))}
                    </div>
                </div>
            </CardContent>
        </Card>
      </div>
    </ToolLayout>
  );
}
