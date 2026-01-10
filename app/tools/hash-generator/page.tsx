"use client";

import * as React from "react";
import { ToolLayout } from "@/components/tool-layout";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Copy, Check, RefreshCw } from "lucide-react";
import CryptoJS from "crypto-js";

interface HashResultProps {
  label: string;
  value: string;
}

function HashResult({ label, value }: HashResultProps) {
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
    <div className="grid grid-cols-[120px_1fr_auto] gap-4 py-3 border-b last:border-0 items-center">
      <div className="text-sm font-semibold text-muted-foreground">{label}</div>
      <div className="font-mono text-xs md:text-sm break-all bg-muted/50 p-2 rounded border">
        {value || <span className="text-muted-foreground opacity-50">Hash will appear here...</span>}
      </div>
      <Button
        variant="ghost"
        size="sm"
        onClick={handleCopy}
        disabled={!value}
        className="h-8 w-8 p-0"
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

export default function HashGeneratorPage() {
  const [input, setInput] = React.useState("");
  const [hmacKey, setHmacKey] = React.useState("");
  
  // Basic Hashes
  const [md5, setMd5] = React.useState("");
  const [sha1, setSha1] = React.useState("");
  const [sha256, setSha256] = React.useState("");
  const [sha512, setSha512] = React.useState("");
  const [sha3, setSha3] = React.useState("");
  const [ripemd160, setRipemd160] = React.useState("");

  React.useEffect(() => {
    if (!input) {
      setMd5("");
      setSha1("");
      setSha256("");
      setSha512("");
      setSha3("");
      setRipemd160("");
      return;
    }

    if (hmacKey) {
       // HMAC Mode
       setMd5(CryptoJS.HmacMD5(input, hmacKey).toString());
       setSha1(CryptoJS.HmacSHA1(input, hmacKey).toString());
       setSha256(CryptoJS.HmacSHA256(input, hmacKey).toString());
       setSha512(CryptoJS.HmacSHA512(input, hmacKey).toString());
       setSha3(CryptoJS.HmacSHA3(input, hmacKey).toString());
       setRipemd160(CryptoJS.HmacRIPEMD160(input, hmacKey).toString());
    } else {
       // Normal Hash Mode
       setMd5(CryptoJS.MD5(input).toString());
       setSha1(CryptoJS.SHA1(input).toString());
       setSha256(CryptoJS.SHA256(input).toString());
       setSha512(CryptoJS.SHA512(input).toString());
       setSha3(CryptoJS.SHA3(input).toString());
       setRipemd160(CryptoJS.RIPEMD160(input).toString());
    }
  }, [input, hmacKey]);

  return (
    <ToolLayout
      title="Hash Generator"
      description="Generate cryptographic hashes (MD5, SHA, etc.) and HMACs."
    >
      <div className="space-y-6">
        {/* Input Section */}
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="input">Input Text</Label>
            <Textarea
              id="input"
              placeholder="Enter text to hash..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              className="font-mono text-sm min-h-[100px]"
            />
            <div className="flex justify-end text-xs text-muted-foreground">
              Length: {input.length} | Bytes: {new Blob([input]).size}
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
                <Label htmlFor="hmac-key">HMAC Secret Key (Optional)</Label>
                {hmacKey && (
                    <Button variant="ghost" size="sm" onClick={() => setHmacKey("")} className="h-5 px-2 text-xs">
                        Clear Key
                    </Button>
                )}
            </div>
            <Input
              id="hmac-key"
              type="password"
              placeholder="Enter key to generate HMAC..."
              value={hmacKey}
              onChange={(e) => setHmacKey(e.target.value)}
              className="font-mono"
            />
            <p className="text-[10px] text-muted-foreground">
                If a key is provided, HMAC (Hash-based Message Authentication Code) will be generated instead of standard hashes.
            </p>
          </div>
        </div>

        {/* Results Section */}
        <div className="rounded-lg border bg-card">
          <div className="border-b bg-muted/50 px-4 py-3 flex items-center justify-between">
            <h3 className="font-semibold flex items-center gap-2">
                Generated Hashes
                {hmacKey && <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">HMAC Mode</span>}
            </h3>
            <Button variant="ghost" size="sm" onClick={() => setInput("")} disabled={!input}>
                <RefreshCw className="h-3 w-3 mr-2" /> Reset
            </Button>
          </div>
          <div className="p-4">
            <HashResult label="MD5" value={md5} />
            <HashResult label="SHA-1" value={sha1} />
            <HashResult label="SHA-256" value={sha256} />
            <HashResult label="SHA-512" value={sha512} />
            <HashResult label="SHA-3" value={sha3} />
            <HashResult label="RIPEMD-160" value={ripemd160} />
          </div>
        </div>
      </div>
    </ToolLayout>
  );
}
