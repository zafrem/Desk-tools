"use client";

import * as React from "react";
import { ToolLayout } from "@/components/tool-layout";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent } from "@/components/ui/card";

import { PII_PATTERNS } from "@/lib/pii-patterns";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Upload, FileCode, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";

// Magic numbers for common file types
const MAGIC_NUMBERS: Record<string, { ext: string; mime: string }> = {
  "89504E47": { ext: "png", mime: "image/png" },
  "FFD8FF": { ext: "jpg", mime: "image/jpeg" },
  "25504446": { ext: "pdf", mime: "application/pdf" },
  "47494638": { ext: "gif", mime: "image/gif" },
  "504B0304": { ext: "zip", mime: "application/zip" },
  "7B": { ext: "json", mime: "application/json" }, // {
  "3C": { ext: "xml/html", mime: "text/html" }, // <
};

export default function RegexTesterPage() {
  const [pattern, setPattern] = React.useState("[a-zA-Z]+");
  const [flags, setFlags] = React.useState("g");
  const [text, setText] = React.useState("Hello world! This is a simple regex test.");
  const [highlighted, setHighlighted] = React.useState<React.ReactNode>(text);
  const [detectedType, setDetectedType] = React.useState<string | null>(null);

  const handlePatternChange = (label: string) => {
    const pii = PII_PATTERNS.find(p => p.label === label);
    if (pii) {
        setPattern(pii.pattern);
        setText(pii.example);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check magic numbers
    const reader = new FileReader();
    reader.onload = async (event) => {
      const arr = new Uint8Array(event.target?.result as ArrayBuffer).subarray(0, 4);
      let header = "";
      for (let i = 0; i < arr.length; i++) {
        header += arr[i].toString(16).toUpperCase().padStart(2, "0");
      }

      let type = "unknown";
      for (const [magic, info] of Object.entries(MAGIC_NUMBERS)) {
        if (header.startsWith(magic)) {
          type = info.ext;
          break;
        }
      }
      setDetectedType(type);

      // Convert to text for regex testing
      const textContent = await file.text();
      setText(textContent);
    };
    reader.readAsArrayBuffer(file.slice(0, 4));
  };

  const handleCreateFileFromText = () => {
    const blob = new Blob([text], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `regex-test-content.${detectedType || 'txt'}`;
    a.click();
    URL.revokeObjectURL(url);
  };

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
      description="Test regular expressions in real-time with highlighting. Includes PII patterns and file-to-text conversion."
    >
      <div className="space-y-6">
        {/* Controls Grid */}
        <div className="grid md:grid-cols-2 gap-4">
            {/* Pattern Selection */}
            <div className="space-y-2">
                <Label>Predefined Format (PII Dictionary)</Label>
                <Select onValueChange={handlePatternChange}>
                    <SelectTrigger>
                        <SelectValue placeholder="Select a PII pattern..." />
                    </SelectTrigger>
                    <SelectContent>
                        {PII_PATTERNS.map((p) => (
                            <SelectItem key={p.label} value={p.label}>{p.label}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            {/* File Actions */}
            <div className="space-y-2">
                <Label>File Operations (Magic Number Check)</Label>
                <div className="flex gap-2">
                    <div className="relative flex-1">
                        <Input
                            type="file"
                            onChange={handleFileUpload}
                            className="pr-10"
                        />
                        <Upload className="absolute right-3 top-2.5 h-4 w-4 text-muted-foreground pointer-events-none" />
                    </div>
                    <Button variant="outline" size="icon" onClick={handleCreateFileFromText} title="Export as File">
                        <FileCode className="h-4 w-4" />
                    </Button>
                </div>
                {detectedType && (
                    <p className="text-[10px] text-muted-foreground">
                        Detected magic number signature: <span className="font-bold text-primary uppercase">{detectedType}</span>
                    </p>
                )}
            </div>
        </div>

        {/* Pattern Input */}
        <div className="space-y-2 p-4 bg-muted/20 rounded-lg border">
            <Label className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Regex Pattern
            </Label>
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
            <div className="flex flex-wrap gap-4 pt-2">
                {['g', 'i', 'm', 's', 'u', 'y'].map(f => (
                    <div key={f} className="flex items-center space-x-2">
                        <Checkbox 
                            id={`flag-${f}`} 
                            checked={flags.includes(f)} 
                            onCheckedChange={() => toggleFlag(f)}
                        />
                        <Label htmlFor={`flag-${f}`} className="font-mono text-xs">{f}</Label>
                    </div>
                ))}
            </div>
        </div>

        {/* Text Input */}
        <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-2">
                <Label>Test String / File Content</Label>
                <Textarea 
                    value={text} 
                    onChange={(e) => setText(e.target.value)} 
                    className="min-h-[300px] font-mono whitespace-pre text-sm"
                    placeholder="Paste text here or upload a file above..."
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
