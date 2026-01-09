"use client";

import * as React from "react";
import { ToolLayout } from "@/components/tool-layout";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Copy, Check } from "lucide-react";
import * as Encoders from "@/lib/encoders";

interface ResultItemProps {
  label: string;
  value: string;
}

function ResultItem({ label, value }: ResultItemProps) {
  const [copied, setCopied] = React.useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  return (
    <div className="grid grid-cols-[180px_1fr_auto] gap-4 py-2 border-b last:border-0 items-start">
      <div className="text-sm font-medium">{label}</div>
      <div className="text-sm font-mono break-all">{value}</div>
      <Button
        variant="ghost"
        size="sm"
        onClick={handleCopy}
        className="h-8 w-8 p-0 hover:bg-accent"
        title="Copy to clipboard"
      >
        {copied ? (
          <Check className="h-4 w-4 text-green-500" />
        ) : (
          <Copy className="h-4 w-4" />
        )}
      </Button>
    </div>
  );
}

interface ResultSectionProps {
  title: string;
  children: React.ReactNode;
}

function ResultSection({ title, children }: ResultSectionProps) {
  return (
    <div className="rounded-lg border bg-card">
      <div className="border-b bg-muted/50 px-4 py-3">
        <h3 className="font-semibold">{title}</h3>
      </div>
      <div className="p-4">{children}</div>
    </div>
  );
}

export default function AllInOneEncoderPage() {
  const [input, setInput] = React.useState("");

  const charCount = input.length;
  const byteCount = new Blob([input]).size;

  return (
    <ToolLayout
      title="Text Encoder"
      description="Enter text to see various encoding/decoding results at once"
    >
      <div className="space-y-6">
        {/* Input Section */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="input">
              Input
              <span className="ml-2 text-xs text-muted-foreground">
                {charCount} characters / {byteCount} bytes
              </span>
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
            placeholder="Enter text to encode/decode..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            rows={6}
            className="font-mono text-sm"
          />
        </div>

        {/* Encoding Results */}
        <ResultSection title="Encoding">
          <ResultItem label="Base64" value={Encoders.toBase64(input)} />
          <ResultItem label="Base32" value={Encoders.toBase32(input)} />
          <ResultItem label="URL Encoding" value={Encoders.toURLEncoded(input)} />
          <ResultItem label="HTML Escape" value={Encoders.toHTMLEscape(input)} />
          <ResultItem label="HTML Entity" value={Encoders.toHTMLEntity(input)} />
          <ResultItem label="Hex String" value={Encoders.toHexString(input)} />
          <ResultItem label="Binary String" value={Encoders.toBinaryString(input)} />
        </ResultSection>

        {/* Decoding Results */}
        <ResultSection title="Decoding">
          <ResultItem label="Base64" value={Encoders.fromBase64(input)} />
          <ResultItem label="Base32" value={Encoders.fromBase32(input)} />
          <ResultItem label="URL Decoding" value={Encoders.fromURLEncoded(input)} />
          <ResultItem label="HTML Unescape" value={Encoders.fromHTMLEscape(input)} />
          <ResultItem label="Hex String" value={Encoders.fromHexString(input)} />
          <ResultItem label="Binary String" value={Encoders.fromBinaryString(input)} />
        </ResultSection>

        {/* String Transformations */}
        <ResultSection title="String Transformations">
          <ResultItem label="UPPER CASE" value={Encoders.toUpperCase(input)} />
          <ResultItem label="lower case" value={Encoders.toLowerCase(input)} />
          <ResultItem label="Swap Case" value={Encoders.toSwapCase(input)} />
          <ResultItem label="Capitalize" value={Encoders.toCapitalize(input)} />
          <ResultItem label="aLtErNaTiNg" value={Encoders.toAlternating(input)} />
          <ResultItem label="UpperCamelCase" value={Encoders.toUpperCamelCase(input)} />
          <ResultItem label="lowerCamelCase" value={Encoders.toLowerCamelCase(input)} />
          <ResultItem label="UPPER_SNAKE_CASE" value={Encoders.toUpperSnakeCase(input)} />
          <ResultItem label="lower_snake_case" value={Encoders.toLowerSnakeCase(input)} />
          <ResultItem label="UPPER-KEBAB-CASE" value={Encoders.toUpperKebabCase(input)} />
          <ResultItem label="lower-kebab-case" value={Encoders.toLowerKebabCase(input)} />
          <ResultItem label="Initials" value={Encoders.toInitials(input)} />
          <ResultItem label="Reverse" value={Encoders.toReverse(input)} />
        </ResultSection>

        {/* Ciphers */}
        <ResultSection title="Ciphers">
          <ResultItem label="ROT13 (A-Z)" value={Encoders.toROT13(input)} />
          <ResultItem label="ROT18 (A-Z, 0-9)" value={Encoders.toROT18(input)} />
          <ResultItem label="ROT47 (!-~)" value={Encoders.toROT47(input)} />
          <ResultItem label="Atbash" value={Encoders.toAtbash(input)} />
          <ResultItem label="Caesar +1" value={Encoders.toCaesar(input, 1)} />
          <ResultItem label="Caesar +3" value={Encoders.toCaesar(input, 3)} />
          <ResultItem label="Caesar -1" value={Encoders.toCaesar(input, -1)} />
          <ResultItem label="Caesar -3" value={Encoders.toCaesar(input, -3)} />
        </ResultSection>

        {/* Morse Code */}
        <ResultSection title="Morse Code">
          <ResultItem label="Morse Encode" value={Encoders.toMorse(input)} />
          <ResultItem label="Morse Decode" value={Encoders.fromMorse(input)} />
        </ResultSection>

        {/* Hash Functions */}
        <ResultSection title="Hash Functions">
          <ResultItem label="MD5" value={Encoders.toMD5(input)} />
          <ResultItem label="SHA-1" value={Encoders.toSHA1(input)} />
          <ResultItem label="SHA-256" value={Encoders.toSHA256(input)} />
          <ResultItem label="SHA-384" value={Encoders.toSHA384(input)} />
          <ResultItem label="SHA-512" value={Encoders.toSHA512(input)} />
        </ResultSection>

        {/* Info Box */}
        <div className="rounded-lg border bg-card p-4 text-sm text-muted-foreground">
          <h3 className="font-semibold text-foreground mb-2">About This Tool</h3>
          <p>
            This tool automatically encodes and decodes your input text in multiple
            formats. All processing happens locally in your browser - your data never
            leaves your device.
          </p>
          <p className="mt-2">
            <strong>Note:</strong> Some decoding operations may fail if the input is
            not in the expected format. These will show an error message.
          </p>
        </div>
      </div>
    </ToolLayout>
  );
}
