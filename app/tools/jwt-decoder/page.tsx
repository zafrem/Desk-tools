/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import * as React from "react";
import { ToolLayout } from "@/components/tool-layout";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { ArrowDown, Copy, CheckCircle, AlertCircle } from "lucide-react";

function base64UrlDecode(str: string): string {
  let output = str.replace(/-/g, "+").replace(/_/g, "/");
  switch (output.length % 4) {
    case 0:
      break;
    case 2:
      output += "==";
      break;
    case 3:
      output += "=";
      break;
    default:
      throw new Error("Illegal base64url string!");
  }
  return decodeURIComponent(
    escape(window.atob(output)) // escape/decodeURIComponent to handle UTF-8
  );
}

export default function JwtDecoderPage() {
  const [token, setToken] = React.useState("");
  const [header, setHeader] = React.useState("");
  const [payload, setPayload] = React.useState("");
  const [signature, setSignature] = React.useState("");
  const [error, setError] = React.useState("");
  const [isExpired, setIsExpired] = React.useState<boolean | null>(null);

  const decodeToken = (input: string) => {
    setError("");
    setIsExpired(null);
    setHeader("");
    setPayload("");
    setSignature("");

    if (!input.trim()) return;

    try {
      const parts = input.split(".");
      if (parts.length !== 3) {
        throw new Error("Invalid JWT structure. Expected 3 parts (Header.Payload.Signature).");
      }

      // Header
      const decodedHeader = base64UrlDecode(parts[0]);
      setHeader(JSON.stringify(JSON.parse(decodedHeader), null, 2));

      // Payload
      const decodedPayload = base64UrlDecode(parts[1]);
      const payloadObj = JSON.parse(decodedPayload);
      setPayload(JSON.stringify(payloadObj, null, 2));

      // Signature (just display raw/encoded part usually)
      setSignature(parts[2]);

      // Expiration Check
      if (payloadObj.exp) {
        const exp = new Date(payloadObj.exp * 1000);
        setIsExpired(exp < new Date());
      }
    } catch (err: any) {
      setError(err.message || "Failed to decode JWT.");
    }
  };

  React.useEffect(() => {
    decodeToken(token);
  }, [token]);

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch (err) { console.error(err); }
  };

  return (
    <ToolLayout
      title="JWT Decoder"
      description="Decode and inspect JSON Web Tokens (JWT) without sending them to a server."
    >
      <div className="space-y-6">
        {/* Input */}
        <div className="space-y-2">
          <Label htmlFor="token-input">JWT Token</Label>
          <Textarea
            id="token-input"
            value={token}
            onChange={(e) => setToken(e.target.value)}
            placeholder="Paste your JWT here (e.g., eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...)"
            className="font-mono text-xs h-[100px]"
          />
          <p className="text-xs text-muted-foreground">
             Tokens are decoded locally in your browser. Sensitive data is never sent to any server.
          </p>
        </div>

        {error && (
            <div className="p-4 rounded-md bg-destructive/10 text-destructive flex items-center gap-2 text-sm font-medium">
                <AlertCircle className="h-4 w-4" />
                {error}
            </div>
        )}

        <div className="flex justify-center">
            <ArrowDown className="text-muted-foreground animate-bounce" />
        </div>

        {/* Output Grid */}
        <div className="grid md:grid-cols-2 gap-6">
           {/* Header */}
           <div className="space-y-2">
              <div className="flex justify-between items-center">
                  <Label className="text-muted-foreground">Header (Algorithm & Type)</Label>
                  <Button variant="ghost" size="icon" onClick={() => copyToClipboard(header)} disabled={!header}>
                      <Copy className="h-3 w-3" />
                  </Button>
              </div>
              <Textarea 
                readOnly 
                value={header} 
                className="font-mono text-xs bg-muted min-h-[150px] resize-none text-red-600 dark:text-red-400" 
              />
           </div>

           {/* Payload */}
           <div className="space-y-2">
              <div className="flex justify-between items-center">
                  <Label className="text-muted-foreground">Payload (Data)</Label>
                  <Button variant="ghost" size="icon" onClick={() => copyToClipboard(payload)} disabled={!payload}>
                      <Copy className="h-3 w-3" />
                  </Button>
              </div>
              <Textarea 
                readOnly 
                value={payload} 
                className="font-mono text-xs bg-muted min-h-[150px] resize-none text-purple-600 dark:text-purple-400" 
              />
           </div>
        </div>
        
        {/* Footer Info */}
        <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-2">
               <Label className="text-muted-foreground">Signature (Raw)</Label>
               <div className="p-3 bg-muted rounded-md border font-mono text-xs break-all text-blue-600 dark:text-blue-400">
                  {signature || "..."}
               </div>
            </div>

            <div className="space-y-2">
                <Label className="text-muted-foreground">Status</Label>
                {isExpired !== null ? (
                    <div className={`p-3 rounded-md border flex items-center gap-2 text-sm font-medium ${
                        isExpired 
                        ? "bg-red-50 text-red-700 border-red-200 dark:bg-red-900/20 dark:text-red-300 dark:border-red-900/50" 
                        : "bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-300 dark:border-green-900/50"
                    }`}>
                        {isExpired ? (
                            <>
                                <AlertCircle className="h-4 w-4" /> Token Expired
                            </>
                        ) : (
                            <>
                                <CheckCircle className="h-4 w-4" /> Token Active
                            </>
                        )}
                    </div>
                ) : (
                    <div className="p-3 rounded-md border bg-muted/50 text-muted-foreground text-sm">
                        Waiting for token...
                    </div>
                )}
            </div>
        </div>
      </div>
    </ToolLayout>
  );
}
