"use client";

import * as React from "react";
import { ToolLayout } from "@/components/tool-layout";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowDown, Copy, RefreshCw } from "lucide-react";

const COMMON_ENTITIES = [
  { char: "&", entity: "&amp;", name: "Ampersand" },
  { char: "<", entity: "&lt;", name: "Less than" },
  { char: ">", entity: "&gt;", name: "Greater than" },
  { char: '"', entity: "&quot;", name: "Double quote" },
  { char: "'", entity: "&#39;", name: "Single quote" },
  { char: " ", entity: "&nbsp;", name: "Non-breaking space" },
  { char: "©", entity: "&copy;", name: "Copyright" },
  { char: "®", entity: "&reg;", name: "Registered" },
  { char: "™", entity: "&trade;", name: "Trademark" },
  { char: "€", entity: "&euro;", name: "Euro" },
  { char: "£", entity: "&pound;", name: "Pound" },
  { char: "¥", entity: "&yen;", name: "Yen" },
  { char: "°", entity: "&deg;", name: "Degree" },
  { char: "±", entity: "&plusmn;", name: "Plus-minus" },
  { char: "×", entity: "&times;", name: "Multiply" },
  { char: "÷", entity: "&divide;", name: "Divide" },
  { char: "≠", entity: "&ne;", name: "Not equal" },
  { char: "≤", entity: "&le;", name: "Less or equal" },
  { char: "≥", entity: "&ge;", name: "Greater or equal" },
  { char: "…", entity: "&hellip;", name: "Ellipsis" },
  { char: "—", entity: "&mdash;", name: "Em dash" },
  { char: "–", entity: "&ndash;", name: "En dash" },
  { char: "‘", entity: "&lsquo;", name: "Left single quote" },
  { char: "’", entity: "&rsquo;", name: "Right single quote" },
  { char: "“", entity: "&ldquo;", name: "Left double quote" },
  { char: "”", entity: "&rdquo;", name: "Right double quote" },
  { char: "•", entity: "&bull;", name: "Bullet" },
  { char: "←", entity: "&larr;", name: "Left arrow" },
  { char: "→", entity: "&rarr;", name: "Right arrow" },
  { char: "↑", entity: "&uarr;", name: "Up arrow" },
  { char: "↓", entity: "&darr;", name: "Down arrow" },
  { char: "♥", entity: "&hearts;", name: "Heart" },
  { char: "♦", entity: "&diams;", name: "Diamond" },
  { char: "♣", entity: "&clubs;", name: "Club" },
  { char: "♠", entity: "&spades;", name: "Spade" },
];

export default function HtmlEntitiesPage() {
  const [input, setInput] = React.useState("");
  const [output, setOutput] = React.useState("");
  const [mode, setMode] = React.useState<"encode" | "decode">("encode");

  const handleEncode = (text: string) => {
    // Use DOM div to handle full range for encoding
    const div = document.createElement('div');
    div.innerText = text;
    setOutput(div.innerHTML);
  };

  const handleDecode = (text: string) => {
    const txt = document.createElement("textarea");
    txt.innerHTML = text;
    setOutput(txt.value);
  };

  const process = () => {
    if (mode === "encode") {
      handleEncode(input);
    } else {
      handleDecode(input);
    }
  };

  React.useEffect(() => {
    process();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [input, mode]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(output);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  const handleReplace = () => {
    setInput(output);
  };

  const insertChar = (char: string) => {
    setInput((prev) => prev + char);
  };

  return (
    <ToolLayout
      title="HTML Entities"
      description="Encode special characters to HTML entities or decode them back."
    >
      <Tabs defaultValue="encode" onValueChange={(v) => setMode(v as "encode" | "decode")}>
        <TabsList className="grid w-full grid-cols-2 lg:w-[400px]">
          <TabsTrigger value="encode">Encode (Char → Entity)</TabsTrigger>
          <TabsTrigger value="decode">Decode (Entity → Char)</TabsTrigger>
        </TabsList>

        <div className="grid lg:grid-cols-[1fr_300px] gap-6 mt-6">
          <div className="space-y-6">
            <div className="space-y-2">
              <div className="flex justify-between">
                <Label>{mode === "encode" ? "Text Input" : "HTML Entity Input"}</Label>
                <Button variant="ghost" size="sm" onClick={() => setInput("")} className="h-6 text-xs">
                  Clear
                </Button>
              </div>
              <Textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={mode === "encode" ? "Enter text like <div class='box'>..." : "Enter entities like &lt;div&gt;..."}
                className="min-h-[150px] font-mono"
              />
            </div>

            <div className="flex justify-center">
               <ArrowDown className="text-muted-foreground animate-bounce" />
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center">
                 <Label>Result</Label>
                 <div className="flex gap-2">
                    <Button variant="secondary" size="sm" onClick={handleReplace} disabled={!output} title="Use result as input">
                        <RefreshCw className="h-3 w-3 mr-1" /> Replace Input
                    </Button>
                    <Button variant="default" size="sm" onClick={handleCopy} disabled={!output}>
                        <Copy className="h-3 w-3 mr-1" /> Copy
                    </Button>
                 </div>
              </div>
              <Textarea
                readOnly
                value={output}
                className="min-h-[150px] font-mono bg-muted"
                placeholder="Result will appear here..."
              />
            </div>
          </div>

          <div className="space-y-4">
             <div className="rounded-lg border bg-card">
                 <div className="p-3 border-b bg-muted/30">
                     <h3 className="font-semibold text-sm">Common Entities</h3>
                     <p className="text-xs text-muted-foreground">Click to append to input</p>
                 </div>
                 <div className="h-[500px] overflow-y-auto p-2">
                     <div className="grid grid-cols-1 gap-1">
                         {COMMON_ENTITIES.map((item) => (
                             <button
                                key={item.name}
                                onClick={() => insertChar(item.char)}
                                className="flex items-center gap-3 p-2 hover:bg-accent rounded text-left group transition-colors"
                             >
                                 <div className="w-8 h-8 flex items-center justify-center bg-muted rounded border font-serif text-lg group-hover:bg-background">
                                     {item.char}
                                 </div>
                                 <div className="flex-1 min-w-0">
                                     <div className="font-mono text-xs font-medium text-primary">{item.entity}</div>
                                     <div className="text-xs text-muted-foreground truncate">{item.name}</div>
                                 </div>
                             </button>
                         ))}
                     </div>
                 </div>
             </div>
          </div>
        </div>
      </Tabs>
    </ToolLayout>
  );
}