"use client";

import * as React from "react";
import { ToolLayout } from "@/components/tool-layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Upload, CheckCircle2, AlertCircle, Eye, Download } from "lucide-react";

// Magic numbers and MIME types
const MAGIC_NUMBERS: Record<string, { name: string; ext: string; mime: string; isText: boolean }> = {
  "89504E47": { name: "PNG Image", ext: "png", mime: "image/png", isText: false },
  "FFD8FF": { name: "JPEG Image", ext: "jpg", mime: "image/jpeg", isText: false },
  "25504446": { name: "PDF Document", ext: "pdf", mime: "application/pdf", isText: false },
  "47494638": { name: "GIF Image", ext: "gif", mime: "image/gif", isText: false },
  "504B0304": { name: "ZIP Archive", ext: "zip", mime: "application/zip", isText: false },
  "7B": { name: "JSON Data", ext: "json", mime: "application/json", isText: true }, // {
  "3C": { name: "XML/HTML Document", ext: "xml", mime: "application/xml", isText: true }, // <
};

export default function BlobDecoderPage() {
  const [textInput, setTextInput] = React.useState("");
  const [fileBytes, setFileBytes] = React.useState<Uint8Array | null>(null);
  const [fileName, setFileName] = React.useState<string>("");
  
  // Detection outcomes
  const [detectedType, setDetectedType] = React.useState<{ name: string; ext: string; mime: string; isText: boolean } | null>(null);
  const [outputText, setOutputText] = React.useState("");
  const [previewUrl, setPreviewUrl] = React.useState<string | null>(null);

  // Helper to convert base64 to Uint8Array
  const base64ToBytes = (base64: string): Uint8Array | null => {
    try {
      const cleaned = base64.replace(/\s/g, "");
      if (!/^[A-Za-z0-9+/=]+$/.test(cleaned)) return null;
      const binary = atob(cleaned);
      const bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) {
        bytes[i] = binary.charCodeAt(i);
      }
      return bytes;
    } catch {
      return null;
    }
  };

  // Helper to convert hex to Uint8Array
  const hexToBytes = (hex: string): Uint8Array | null => {
    try {
      const cleaned = hex.replace(/\s/g, "");
      if (!/^[0-9a-fA-F]+$/.test(cleaned) || cleaned.length % 2 !== 0) return null;
      const bytes = new Uint8Array(cleaned.length / 2);
      for (let i = 0; i < cleaned.length; i += 2) {
        bytes[i / 2] = parseInt(cleaned.substr(i, 2), 16);
      }
      return bytes;
    } catch {
      return null;
    }
  };

  // Analyze the raw bytes
  const analyzeBytes = React.useCallback((bytes: Uint8Array, sourceName: string) => {
    // Read the first 4 bytes for magic numbers
    let header = "";
    const limit = Math.min(bytes.length, 4);
    for (let i = 0; i < limit; i++) {
      header += bytes[i].toString(16).toUpperCase().padStart(2, "0");
    }

    let typeInfo = null;
    for (const [magic, info] of Object.entries(MAGIC_NUMBERS)) {
      if (header.startsWith(magic)) {
        typeInfo = info;
        break;
      }
    }

    setDetectedType(typeInfo);

    if (typeInfo) {
      // Print notification to console/command line as requested
      console.log(`\n=================================================`);
      console.log(`>> [Blob Decoder] TARGET FILE TYPE DETECTED!`);
      console.log(`>> Source: ${sourceName}`);
      console.log(`>> Extension: .${typeInfo.ext}`);
      console.log(`>> MIME Type: ${typeInfo.mime}`);
      console.log(`=================================================\n`);

      if (typeInfo.isText) {
        // Decode as text
        const decoded = new TextDecoder().decode(bytes);
        setOutputText(decoded);
        setPreviewUrl(null);
      } else {
        // Generate blob preview URL for images/binaries
        const blob = new Blob([bytes.buffer as ArrayBuffer], { type: typeInfo.mime });
        const url = URL.createObjectURL(blob);
        setPreviewUrl(url);
        setOutputText(`[Binary Data - ${typeInfo.name}]`);
      }
    } else {
      // Fallback: decode as direct UTF-8 text and render on screen
      try {
        const decoded = new TextDecoder("utf-8", { fatal: true }).decode(bytes);
        setOutputText(decoded);
      } catch {
        setOutputText("[Binary data - Unrecognized binary format]");
      }
      setPreviewUrl(null);
    }
  }, []);

  // Handle direct file upload
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    setTextInput(""); // Clear text input to prioritize file

    const buffer = await file.arrayBuffer();
    const bytes = new Uint8Array(buffer);
    setFileBytes(bytes);
    analyzeBytes(bytes, file.name);
  };

  // Handle manual text/code entry (e.g. hex, base64, or raw text)
  const handleTextChange = (val: string) => {
    setTextInput(val);
    if (!val.trim()) {
      setFileBytes(null);
      setDetectedType(null);
      setOutputText("");
      setPreviewUrl(null);
      return;
    }

    setFileName("Text Input Area");

    // Attempt to decode as hex first
    const hexBytes = hexToBytes(val);
    if (hexBytes && hexBytes.length >= 2) {
      setFileBytes(hexBytes);
      analyzeBytes(hexBytes, "Hex String Input");
      return;
    }

    // Attempt to decode as base64
    const b64Bytes = base64ToBytes(val);
    if (b64Bytes && b64Bytes.length >= 2) {
      setFileBytes(b64Bytes);
      analyzeBytes(b64Bytes, "Base64 String Input");
      return;
    }

    // Fallback: treat as raw text
    const rawBytes = new TextEncoder().encode(val);
    setFileBytes(rawBytes);
    analyzeBytes(rawBytes, "Raw Text Input");
  };

  // Clean up Object URL
  React.useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  const handleDownloadDecoded = () => {
    if (!fileBytes || !detectedType) return;
    const blob = new Blob([fileBytes.buffer as ArrayBuffer], { type: detectedType.mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `decoded-file.${detectedType.ext}`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <ToolLayout
      title="Blob Decoder"
      description="Analyze raw files, Hex strings, or Base64 sequences using binary signatures (magic numbers) to reconstruct, recommend, and view target contents."
    >
      <div className="space-y-6">
        <div className="grid md:grid-cols-2 gap-6">
          {/* Inputs Section */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="file-input" className="font-semibold">Option 1: Upload Binary File / Blob</Label>
              <div className="relative">
                <Input
                  id="file-input"
                  type="file"
                  onChange={handleFileUpload}
                  className="pr-10"
                />
                <Upload className="absolute right-3 top-2.5 h-4 w-4 text-muted-foreground pointer-events-none" />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="text-input" className="font-semibold">Option 2: Paste Raw Data (Hex, Base64, or Text)</Label>
              <Textarea
                id="text-input"
                value={textInput}
                onChange={(e) => handleTextChange(e.target.value)}
                placeholder="Paste hexadecimal, base64 encoded strings, or raw text here..."
                className="min-h-[220px] font-mono text-sm"
              />
            </div>
          </div>

          {/* Analysis & Preview Section */}
          <div className="space-y-4">
            <Label className="font-semibold">Analysis Results</Label>

            {detectedType ? (
              <div className="rounded-lg border border-primary/20 bg-primary/5 p-4 space-y-3">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                  <div>
                    <h3 className="font-semibold text-primary">Recommended Format Detected!</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      Magic signature match: <span className="font-bold text-foreground">{detectedType.name} (.{detectedType.ext})</span>
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      MIME Type: {detectedType.mime}
                    </p>
                    <p className="text-[10px] text-primary/80 mt-2 font-mono">
                      * Notification printed to Developer Console command line *
                    </p>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button size="sm" onClick={handleDownloadDecoded} className="gap-1.5 text-xs">
                    <Download className="h-3.5 w-3.5" />
                    Download File
                  </Button>
                </div>
              </div>
            ) : fileBytes ? (
              <div className="rounded-lg border border-dashed p-4 flex items-start gap-3 bg-muted/20">
                <AlertCircle className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-semibold text-muted-foreground">Standard Text Input</h3>
                  <p className="text-xs text-muted-foreground mt-1">
                    No magic signature match. Content loaded as standard text sequence.
                  </p>
                </div>
              </div>
            ) : (
              <div className="rounded-lg border border-dashed p-12 text-center text-sm text-muted-foreground bg-muted/10">
                Provide file or paste input to start analysis
              </div>
            )}

            {/* Preview Area (Alive Visual Preview!) */}
            {previewUrl && detectedType && detectedType.mime.startsWith("image/") && (
              <div className="space-y-2">
                <Label className="text-xs flex items-center gap-1.5 text-muted-foreground">
                  <Eye className="h-3.5 w-3.5" />
                  Live Preview
                </Label>
                <div className="rounded-lg border bg-muted/30 overflow-hidden flex items-center justify-center p-4 min-h-[150px]">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={previewUrl} alt="Decoded File Preview" className="max-h-[250px] max-w-full rounded shadow-sm object-contain" />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Decoded Output Pane */}
        <div className="space-y-2">
          <Label htmlFor="output" className="font-semibold">Decoded Output Pane</Label>
          <Card className="min-h-[250px] bg-muted/30">
            <CardContent className="p-4 font-mono text-sm whitespace-pre-wrap break-all">
              {outputText || "Awaiting file upload or text input..."}
            </CardContent>
          </Card>
        </div>
      </div>
    </ToolLayout>
  );
}
