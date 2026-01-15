"use client";

import * as React from "react";
import { ToolLayout } from "@/components/tool-layout";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ArrowLeftRight,
  ClipboardPaste,
  RotateCcw,
  Copy,
  Check,
  Upload,
  Download,
} from "lucide-react";

type ConversionMode = "binary-to-hex" | "hex-to-binary";

export default function BinaryHexConverterPage() {
  const [mode, setMode] = React.useState<ConversionMode>("binary-to-hex");
  const [input, setInput] = React.useState("");
  const [output, setOutput] = React.useState("");
  const [copied, setCopied] = React.useState(false);
  const [error, setError] = React.useState("");
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  // Convert based on current mode
  const convert = React.useCallback(
    (value: string, currentMode: ConversionMode) => {
      if (!value.trim()) {
        setOutput("");
        setError("");
        return;
      }

      try {
        if (currentMode === "binary-to-hex") {
          // Binary to HEX
          const binary = value.replace(/\s/g, "");
          if (!/^[01]+$/.test(binary)) {
            throw new Error("Invalid binary input. Use only 0 and 1.");
          }
          // Pad to multiple of 8
          const padded = binary.padStart(Math.ceil(binary.length / 8) * 8, "0");
          let hex = "";
          for (let i = 0; i < padded.length; i += 8) {
            const byte = padded.substr(i, 8);
            hex += parseInt(byte, 2).toString(16).toUpperCase().padStart(2, "0");
            if (i + 8 < padded.length) hex += " ";
          }
          setOutput(hex);
          setError("");
        } else {
          // HEX to Binary
          const hex = value.replace(/\s/g, "").toUpperCase();
          if (!/^[0-9A-F]+$/.test(hex)) {
            throw new Error("Invalid HEX input. Use only 0-9 and A-F.");
          }
          let binary = "";
          for (let i = 0; i < hex.length; i += 2) {
            const byte = hex.substr(i, 2);
            binary += parseInt(byte, 16).toString(2).padStart(8, "0");
            if (i + 2 < hex.length) binary += " ";
          }
          setOutput(binary);
          setError("");
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Conversion error");
        setOutput("");
      }
    },
    []
  );

  // Handle input change
  const handleInputChange = (value: string) => {
    setInput(value);
    convert(value, mode);
  };

  // Handle mode change
  const handleModeChange = (newMode: string) => {
    const m = newMode as ConversionMode;
    setMode(m);
    setInput("");
    setOutput("");
    setError("");
  };

  // Swap input and output
  const handleSwap = () => {
    const newInput = output;
    const newMode: ConversionMode =
      mode === "binary-to-hex" ? "hex-to-binary" : "binary-to-hex";
    setMode(newMode);
    setInput(newInput);
    convert(newInput, newMode);
  };

  // Paste from clipboard
  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      setInput(text);
      convert(text, mode);
    } catch (err) {
      console.error("Failed to paste:", err);
    }
  };

  // Reset all
  const handleReset = () => {
    setInput("");
    setOutput("");
    setError("");
  };

  // Copy output
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(output);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  // Handle file upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const arrayBuffer = reader.result as ArrayBuffer;
      const bytes = new Uint8Array(arrayBuffer);

      if (mode === "binary-to-hex") {
        // Convert file bytes to binary string
        const binary = Array.from(bytes)
          .map((b) => b.toString(2).padStart(8, "0"))
          .join(" ");
        setInput(binary);
        convert(binary, mode);
      } else {
        // Convert file bytes to hex string
        const hex = Array.from(bytes)
          .map((b) => b.toString(16).toUpperCase().padStart(2, "0"))
          .join(" ");
        setInput(hex);
        convert(hex, mode);
      }
    };
    reader.readAsArrayBuffer(file);
    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // Download as binary file
  const handleDownload = () => {
    if (!output) return;

    let bytes: Uint8Array;
    if (mode === "binary-to-hex") {
      // Output is HEX, convert to bytes
      const hex = output.replace(/\s/g, "");
      bytes = new Uint8Array(hex.length / 2);
      for (let i = 0; i < hex.length; i += 2) {
        bytes[i / 2] = parseInt(hex.substr(i, 2), 16);
      }
    } else {
      // Output is Binary, convert to bytes
      const binary = output.replace(/\s/g, "");
      bytes = new Uint8Array(binary.length / 8);
      for (let i = 0; i < binary.length; i += 8) {
        bytes[i / 8] = parseInt(binary.substr(i, 8), 2);
      }
    }

    const blob = new Blob([bytes.buffer as ArrayBuffer], { type: "application/octet-stream" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "output.bin";
    a.click();
    URL.revokeObjectURL(url);
  };

  const inputLabel = mode === "binary-to-hex" ? "Binary" : "HEX";
  const outputLabel = mode === "binary-to-hex" ? "HEX" : "Binary";
  const inputPlaceholder =
    mode === "binary-to-hex"
      ? "Enter binary... (e.g., 01001000 01100101)"
      : "Enter HEX... (e.g., 48 65 6C 6C 6F)";

  return (
    <ToolLayout
      title="Binary ↔ HEX Converter"
      description="Convert between Binary and Hexadecimal formats"
    >
      <div className="space-y-6">
        {/* Mode Tabs */}
        <Tabs value={mode} onValueChange={handleModeChange}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="binary-to-hex">Binary → HEX</TabsTrigger>
            <TabsTrigger value="hex-to-binary">HEX → Binary</TabsTrigger>
          </TabsList>
        </Tabs>

        {/* File Upload & Download */}
        <div className="flex items-center gap-4 p-4 rounded-lg border bg-card">
          <input
            ref={fileInputRef}
            type="file"
            onChange={handleFileUpload}
            className="hidden"
            id="file-upload"
          />
          <label htmlFor="file-upload">
            <Button variant="outline" className="gap-2 cursor-pointer" asChild>
              <span>
                <Upload className="h-4 w-4" />
                Upload File
              </span>
            </Button>
          </label>
          <Button
            variant="outline"
            className="gap-2"
            onClick={handleDownload}
            disabled={!output}
          >
            <Download className="h-4 w-4" />
            Download .bin
          </Button>
          <span className="text-sm text-muted-foreground">
            Upload a file to auto-convert. Download result as binary file.
          </span>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          <Button variant="outline" className="gap-2" onClick={handleSwap}>
            <ArrowLeftRight className="h-4 w-4" />
            Swap
          </Button>
          <Button variant="outline" className="gap-2" onClick={handlePaste}>
            <ClipboardPaste className="h-4 w-4" />
            Paste
          </Button>
          <Button variant="outline" className="gap-2" onClick={handleReset}>
            <RotateCcw className="h-4 w-4" />
            Reset
          </Button>
          <Button
            variant="outline"
            className="gap-2"
            onClick={handleCopy}
            disabled={!output}
          >
            {copied ? (
              <Check className="h-4 w-4 text-green-500" />
            ) : (
              <Copy className="h-4 w-4" />
            )}
            Copy
          </Button>
        </div>

        {/* Input */}
        <div className="space-y-2">
          <Label htmlFor="input">{inputLabel} Input</Label>
          <Textarea
            id="input"
            placeholder={inputPlaceholder}
            value={input}
            onChange={(e) => handleInputChange(e.target.value)}
            rows={6}
            className="font-mono text-sm"
          />
        </div>

        {/* Error */}
        {error && (
          <div className="p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
            {error}
          </div>
        )}

        {/* Output */}
        <div className="space-y-2">
          <Label htmlFor="output">{outputLabel} Output</Label>
          <Textarea
            id="output"
            placeholder="Result will appear here..."
            value={output}
            readOnly
            rows={6}
            className="font-mono text-sm bg-muted"
          />
        </div>

        {/* Info Box */}
        <div className="rounded-lg border bg-card p-4 text-sm text-muted-foreground">
          <h3 className="font-semibold text-foreground mb-2">About This Tool</h3>
          <p>
            Convert between binary (base-2) and hexadecimal (base-16) number systems.
            All processing happens locally in your browser.
          </p>
          <ul className="mt-2 list-disc list-inside space-y-1">
            <li>Binary input accepts 0 and 1, spaces are ignored</li>
            <li>HEX input accepts 0-9 and A-F (case insensitive), spaces are ignored</li>
            <li>Upload binary files to see their hex representation</li>
          </ul>
        </div>
      </div>
    </ToolLayout>
  );
}
