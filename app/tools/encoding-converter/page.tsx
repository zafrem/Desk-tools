"use client";

import * as React from "react";
import { ToolLayout } from "@/components/tool-layout";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Copy, Check, ArrowDown, RefreshCw } from "lucide-react";

// Common character encodings supported by browsers
const ENCODINGS = [
  { value: "utf-8", label: "UTF-8 (Unicode)", group: "Unicode" },
  { value: "utf-16le", label: "UTF-16 LE", group: "Unicode" },
  { value: "utf-16be", label: "UTF-16 BE", group: "Unicode" },
  { value: "iso-8859-1", label: "ISO-8859-1 (Latin-1)", group: "Western European" },
  { value: "iso-8859-15", label: "ISO-8859-15 (Latin-9)", group: "Western European" },
  { value: "windows-1252", label: "Windows-1252 (CP1252)", group: "Western European" },
  { value: "iso-8859-2", label: "ISO-8859-2 (Latin-2)", group: "Central European" },
  { value: "windows-1250", label: "Windows-1250 (CP1250)", group: "Central European" },
  { value: "iso-8859-5", label: "ISO-8859-5 (Cyrillic)", group: "Cyrillic" },
  { value: "windows-1251", label: "Windows-1251 (CP1251)", group: "Cyrillic" },
  { value: "koi8-r", label: "KOI8-R (Russian)", group: "Cyrillic" },
  { value: "koi8-u", label: "KOI8-U (Ukrainian)", group: "Cyrillic" },
  { value: "iso-8859-7", label: "ISO-8859-7 (Greek)", group: "Greek" },
  { value: "windows-1253", label: "Windows-1253 (CP1253)", group: "Greek" },
  { value: "iso-8859-9", label: "ISO-8859-9 (Turkish)", group: "Turkish" },
  { value: "windows-1254", label: "Windows-1254 (CP1254)", group: "Turkish" },
  { value: "euc-kr", label: "EUC-KR (Korean)", group: "Korean" },
  { value: "iso-2022-kr", label: "ISO-2022-KR (Korean)", group: "Korean" },
  { value: "shift_jis", label: "Shift-JIS (Japanese)", group: "Japanese" },
  { value: "euc-jp", label: "EUC-JP (Japanese)", group: "Japanese" },
  { value: "iso-2022-jp", label: "ISO-2022-JP (Japanese)", group: "Japanese" },
  { value: "gb2312", label: "GB2312 (Simplified Chinese)", group: "Chinese" },
  { value: "gbk", label: "GBK (Simplified Chinese)", group: "Chinese" },
  { value: "gb18030", label: "GB18030 (Chinese)", group: "Chinese" },
  { value: "big5", label: "Big5 (Traditional Chinese)", group: "Chinese" },
  { value: "iso-8859-8", label: "ISO-8859-8 (Hebrew)", group: "Hebrew" },
  { value: "windows-1255", label: "Windows-1255 (CP1255)", group: "Hebrew" },
  { value: "iso-8859-6", label: "ISO-8859-6 (Arabic)", group: "Arabic" },
  { value: "windows-1256", label: "Windows-1256 (CP1256)", group: "Arabic" },
  { value: "windows-874", label: "Windows-874 (Thai)", group: "Thai" },
  { value: "windows-1258", label: "Windows-1258 (Vietnamese)", group: "Vietnamese" },
];

// Common mojibake patterns and their likely encoding combinations
const COMMON_FIXES = [
  {
    label: "UTF-8 as Latin-1",
    description: "UTF-8 text incorrectly decoded as ISO-8859-1/Windows-1252",
    misread: "iso-8859-1",
    original: "utf-8",
  },
  {
    label: "Latin-1 as UTF-8",
    description: "ISO-8859-1/Windows-1252 text incorrectly decoded as UTF-8",
    misread: "utf-8",
    original: "iso-8859-1",
  },
  {
    label: "Korean EUC-KR as UTF-8",
    description: "Korean text incorrectly decoded as UTF-8",
    misread: "utf-8",
    original: "euc-kr",
  },
  {
    label: "Japanese Shift-JIS as UTF-8",
    description: "Japanese text incorrectly decoded as UTF-8",
    misread: "utf-8",
    original: "shift_jis",
  },
  {
    label: "Chinese GBK as UTF-8",
    description: "Chinese text incorrectly decoded as UTF-8",
    misread: "utf-8",
    original: "gbk",
  },
  {
    label: "Russian Windows-1251 as UTF-8",
    description: "Russian text incorrectly decoded as UTF-8",
    misread: "utf-8",
    original: "windows-1251",
  },
];

// Convert text by re-encoding and decoding
function convertEncoding(
  text: string,
  fromEncoding: string,
  toEncoding: string
): { result: string; error: string | null } {
  try {
    // First, encode the broken text back to bytes using the wrong encoding
    const encoder = new TextEncoder(); // Always UTF-8

    // For "misread as" encoding, we need to get the raw bytes
    // by encoding the text as if it were in that encoding
    let bytes: Uint8Array;

    if (fromEncoding === "utf-8") {
      bytes = encoder.encode(text);
    } else {
      // Convert each character to its byte value based on the "misread" encoding
      // For single-byte encodings, we can approximate by getting char codes
      // Try to map the garbled characters back to bytes
      // This works by assuming each character represents a byte in the original encoding
      const charCodes: number[] = [];
      for (let i = 0; i < text.length; i++) {
        charCodes.push(text.charCodeAt(i) & 0xff);
      }
      bytes = new Uint8Array(charCodes);
    }

    // Now decode those bytes using the correct encoding
    const decoder = new TextDecoder(toEncoding, { fatal: false });
    const result = decoder.decode(bytes);

    return { result, error: null };
  } catch (e) {
    return {
      result: "",
      error: e instanceof Error ? e.message : "Conversion failed",
    };
  }
}

// Try multiple encoding combinations to find the best fix
function tryAutoFix(text: string): Array<{ label: string; result: string; confidence: string }> {
  const results: Array<{ label: string; result: string; confidence: string }> = [];

  for (const fix of COMMON_FIXES) {
    const { result, error } = convertEncoding(text, fix.misread, fix.original);
    if (!error && result && result !== text) {
      // Check if result looks "better" (fewer replacement characters, more readable)
      const replacementChars = (result.match(/\ufffd/g) || []).length;
      const originalReplacementChars = (text.match(/\ufffd/g) || []).length;

      let confidence = "Low";
      if (replacementChars < originalReplacementChars) {
        confidence = "High";
      } else if (replacementChars === 0 && result.length > 0) {
        confidence = "Medium";
      }

      results.push({
        label: fix.label,
        result,
        confidence,
      });
    }
  }

  return results;
}

export default function EncodingConverterPage() {
  const [input, setInput] = React.useState("");
  const [misreadAs, setMisreadAs] = React.useState("iso-8859-1");
  const [originalEncoding, setOriginalEncoding] = React.useState("utf-8");
  const [output, setOutput] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);
  const [autoResults, setAutoResults] = React.useState<Array<{ label: string; result: string; confidence: string }>>([]);
  const [copied, setCopied] = React.useState(false);
  const [mode, setMode] = React.useState<"manual" | "auto">("manual");

  const handleConvert = React.useCallback(() => {
    if (!input) {
      setOutput("");
      setError(null);
      return;
    }
    const { result, error: convError } = convertEncoding(input, misreadAs, originalEncoding);
    setOutput(result);
    setError(convError);
  }, [input, misreadAs, originalEncoding]);

  const handleAutoDetect = React.useCallback(() => {
    if (!input) {
      setAutoResults([]);
      return;
    }
    const results = tryAutoFix(input);
    setAutoResults(results);
  }, [input]);

  React.useEffect(() => {
    if (mode === "manual") {
      handleConvert();
    } else {
      handleAutoDetect();
    }
  }, [mode, handleConvert, handleAutoDetect]);

  const handleCopy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  const handleSwap = () => {
    const temp = misreadAs;
    setMisreadAs(originalEncoding);
    setOriginalEncoding(temp);
  };

  const handleApplyAutoResult = (result: string) => {
    setOutput(result);
    setMode("manual");
  };

  return (
    <ToolLayout
      title="Encoding Converter"
      description="Fix broken text (mojibake) by converting between character encodings"
    >
      <div className="space-y-6">
        {/* Mode Toggle */}
        <div className="flex gap-2">
          <Button
            variant={mode === "manual" ? "default" : "outline"}
            onClick={() => setMode("manual")}
            size="sm"
          >
            Manual
          </Button>
          <Button
            variant={mode === "auto" ? "default" : "outline"}
            onClick={() => setMode("auto")}
            size="sm"
          >
            Auto Detect
          </Button>
        </div>

        {/* Input Section */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="input">
              Input (Broken/Garbled Text)
            </Label>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setInput("")}
              disabled={!input}
            >
              Clear
            </Button>
          </div>
          <Textarea
            id="input"
            placeholder="Paste your broken/garbled text here...&#10;Example: cafÃ© (should be café)"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            rows={5}
            className="font-mono text-sm"
          />
        </div>

        {mode === "manual" ? (
          <>
            {/* Encoding Selection */}
            <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_1fr] gap-4 items-end">
              <div className="space-y-2">
                <Label>Misinterpreted As (Wrong Encoding)</Label>
                <Select value={misreadAs} onValueChange={setMisreadAs}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ENCODINGS.map((enc) => (
                      <SelectItem key={enc.value} value={enc.value}>
                        {enc.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Button
                variant="outline"
                size="icon"
                onClick={handleSwap}
                className="mb-0.5"
                title="Swap encodings"
              >
                <RefreshCw className="h-4 w-4" />
              </Button>

              <div className="space-y-2">
                <Label>Original Encoding (Correct)</Label>
                <Select value={originalEncoding} onValueChange={setOriginalEncoding}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ENCODINGS.map((enc) => (
                      <SelectItem key={enc.value} value={enc.value}>
                        {enc.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Arrow */}
            <div className="flex justify-center">
              <ArrowDown className="h-6 w-6 text-muted-foreground" />
            </div>

            {/* Output Section */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="output">Fixed Text</Label>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleCopy(output)}
                  disabled={!output}
                  className="gap-2"
                >
                  {copied ? (
                    <>
                      <Check className="h-4 w-4 text-green-500" />
                      Copied
                    </>
                  ) : (
                    <>
                      <Copy className="h-4 w-4" />
                      Copy
                    </>
                  )}
                </Button>
              </div>
              {error ? (
                <div className="p-4 rounded-lg border border-destructive bg-destructive/10 text-destructive text-sm">
                  {error}
                </div>
              ) : (
                <Textarea
                  id="output"
                  value={output}
                  readOnly
                  rows={5}
                  className="font-mono text-sm bg-muted"
                />
              )}
            </div>

            {/* Quick Fix Buttons */}
            <div className="space-y-2">
              <Label>Quick Fix Presets</Label>
              <div className="flex flex-wrap gap-2">
                {COMMON_FIXES.map((fix) => (
                  <Button
                    key={fix.label}
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setMisreadAs(fix.misread);
                      setOriginalEncoding(fix.original);
                    }}
                    title={fix.description}
                  >
                    {fix.label}
                  </Button>
                ))}
              </div>
            </div>
          </>
        ) : (
          /* Auto Detect Results */
          <div className="space-y-4">
            <Label>Auto-Detected Fixes</Label>
            {autoResults.length === 0 ? (
              <div className="p-4 rounded-lg border bg-muted/50 text-sm text-muted-foreground">
                {input ? "No automatic fixes found. Try manual mode." : "Enter text above to auto-detect encoding issues."}
              </div>
            ) : (
              <div className="space-y-3">
                {autoResults.map((result, index) => (
                  <div
                    key={index}
                    className="p-4 rounded-lg border bg-card space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{result.label}</span>
                        <span
                          className={`text-xs px-2 py-0.5 rounded ${
                            result.confidence === "High"
                              ? "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300"
                              : result.confidence === "Medium"
                              ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300"
                              : "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300"
                          }`}
                        >
                          {result.confidence} confidence
                        </span>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleCopy(result.result)}
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleApplyAutoResult(result.result)}
                        >
                          Use This
                        </Button>
                      </div>
                    </div>
                    <div className="font-mono text-sm p-2 bg-muted rounded">
                      {result.result}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Info Box */}
        <div className="rounded-lg border bg-card p-4 text-sm text-muted-foreground space-y-3">
          <h3 className="font-semibold text-foreground">What is Mojibake?</h3>
          <p>
            <strong>Mojibake</strong> (文字化け) is garbled text that appears when text is decoded
            using a different character encoding than the one it was encoded with.
          </p>
          <p>
            <strong>Common Examples:</strong>
          </p>
          <ul className="list-disc list-inside space-y-1 ml-2">
            <li><code className="bg-muted px-1 rounded">cafÃ©</code> → <code className="bg-muted px-1 rounded">café</code> (UTF-8 as Latin-1)</li>
            <li><code className="bg-muted px-1 rounded">ë¬¸ì</code> → Korean text (EUC-KR as UTF-8)</li>
            <li><code className="bg-muted px-1 rounded">æ–‡å­—</code> → Chinese text (GBK as UTF-8)</li>
          </ul>
          <p className="mt-2">
            <strong>How to use:</strong> Paste your broken text, select the encoding it was
            incorrectly read as, then select the correct original encoding.
          </p>
        </div>
      </div>
    </ToolLayout>
  );
}
