"use client";

import * as React from "react";
import { ToolLayout } from "@/components/tool-layout";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Copy, ArrowRightLeft } from "lucide-react";

export default function UrlEncoderPage() {
  const [input, setInput] = React.useState("");
  const [output, setOutput] = React.useState("");
  const [mode, setMode] = React.useState<"encode" | "decode">("encode");

  React.useEffect(() => {
    try {
        if (mode === "encode") {
            setOutput(encodeURIComponent(input));
        } else {
            setOutput(decodeURIComponent(input));
        }
    } catch {
        setOutput("Error: Malformed URI sequence");
    }
  }, [input, mode]);

  const toggleMode = () => {
      setMode(prev => prev === "encode" ? "decode" : "encode");
      setInput(output); // Swap content for continuous workflow
  };

  const copyToClipboard = () => {
      navigator.clipboard.writeText(output);
  };

  return (
    <ToolLayout
      title="URL Encoder / Decoder"
      description="Encode or decode URLs to handle special characters safely."
    >
      <div className="grid gap-8 lg:grid-cols-[1fr_auto_1fr]">
        <div className="space-y-2">
            <Label>{mode === "encode" ? "Decoded URL" : "Encoded URL"}</Label>
            <Textarea 
                value={input} 
                onChange={(e) => setInput(e.target.value)} 
                className="min-h-[300px]"
                placeholder="Enter text..."
            />
        </div>

        <div className="flex flex-col items-center justify-center gap-4">
            <Button variant="outline" onClick={toggleMode} className="gap-2">
                <ArrowRightLeft className="h-4 w-4" />
                {mode === "encode" ? "Encode >" : "< Decode"}
            </Button>
        </div>

        <div className="space-y-2">
            <div className="flex justify-between items-center">
                <Label>{mode === "encode" ? "Encoded URL" : "Decoded URL"}</Label>
                <Button variant="ghost" size="sm" onClick={copyToClipboard}>
                    <Copy className="h-4 w-4 mr-2" /> Copy
                </Button>
            </div>
            <Textarea 
                readOnly 
                value={output} 
                className="min-h-[300px] bg-muted/50"
                placeholder="Result..."
            />
        </div>
      </div>
    </ToolLayout>
  );
}
