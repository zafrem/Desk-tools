"use client";

import * as React from "react";
import { ToolLayout } from "@/components/tool-layout";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Copy, ArrowLeftRight } from "lucide-react";

export default function Base64ConverterPage() {
  const [input, setInput] = React.useState("");
  const [output, setOutput] = React.useState("");
  const [error, setError] = React.useState("");

  const handleEncode = () => {
    try {
      setError("");
      const encoded = btoa(input);
      setOutput(encoded);
    } catch (err) {
      setError("Failed to encode. Check your input for invalid characters.");
      setOutput("");
    }
  };

  const handleDecode = () => {
    try {
      setError("");
      const decoded = atob(input);
      setOutput(decoded);
    } catch (err) {
      setError("Failed to decode. Invalid Base64 string.");
      setOutput("");
    }
  };

  const handleSwap = () => {
    setInput(output);
    setOutput(input);
    setError("");
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(output);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  const handleClear = () => {
    setInput("");
    setOutput("");
    setError("");
  };

  return (
    <ToolLayout
      title="Base64 Converter"
      description="Encode and decode text using Base64 encoding. All processing happens locally in your browser."
    >
      <div className="grid gap-6">
        {/* Input Section */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="input">Input</Label>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClear}
              disabled={!input && !output}
            >
              Clear All
            </Button>
          </div>
          <Textarea
            id="input"
            placeholder="Enter text to encode or Base64 string to decode..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            rows={8}
            className="font-mono text-sm"
          />
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-2">
          <Button onClick={handleEncode} disabled={!input}>
            Encode to Base64
          </Button>
          <Button onClick={handleDecode} disabled={!input}>
            Decode from Base64
          </Button>
          <Button
            variant="outline"
            onClick={handleSwap}
            disabled={!output}
            className="gap-2"
          >
            <ArrowLeftRight className="h-4 w-4" />
            Swap
          </Button>
        </div>

        {/* Error Message */}
        {error && (
          <div className="rounded-md bg-destructive/10 border border-destructive/20 p-3 text-sm text-destructive">
            {error}
          </div>
        )}

        {/* Output Section */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="output">Output</Label>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleCopy}
              disabled={!output}
              className="gap-2"
            >
              <Copy className="h-4 w-4" />
              Copy
            </Button>
          </div>
          <Textarea
            id="output"
            value={output}
            readOnly
            rows={8}
            className="font-mono text-sm bg-muted"
            placeholder="Result will appear here..."
          />
        </div>

        {/* Info Box */}
        <div className="rounded-lg border bg-card p-4 text-sm text-muted-foreground">
          <h3 className="font-semibold text-foreground mb-2">About Base64</h3>
          <p>
            Base64 is a binary-to-text encoding scheme commonly used to encode
            binary data for transmission over text-based protocols. It&apos;s often
            used in data URLs, email attachments, and API responses.
          </p>
          <p className="mt-2">
            <strong>Note:</strong> Base64 is encoding, not encryption. Do not
            use it to protect sensitive data.
          </p>
        </div>
      </div>
    </ToolLayout>
  );
}
