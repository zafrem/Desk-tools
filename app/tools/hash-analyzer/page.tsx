"use client";

import * as React from "react";
import { ToolLayout } from "@/components/tool-layout";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { AlertCircle, Info, ShieldCheck, ShieldAlert, Shield } from "lucide-react";
import { calculateShannonEntropy, identifyHashTypes } from "@/lib/hash-analyzer";

export default function HashAnalyzerPage() {
  const [hash, setHash] = React.useState("");

  const trimmedHash = hash.trim();
  const isHex = /^[0-9a-fA-F]+$/.test(trimmedHash);
  const length = trimmedHash.length;
  
  const possibleTypes = React.useMemo(() => identifyHashTypes(trimmedHash), [trimmedHash]);

  const entropy = React.useMemo(() => calculateShannonEntropy(trimmedHash), [trimmedHash]);
  
  // Max entropy for hex is 4 (log2(16))
  const maxEntropy = isHex ? 4 : Math.log2(256); // Assume ASCII if not hex
  const entropyPercentage = Math.min((entropy / maxEntropy) * 100, 100);

  const getStrength = () => {
    if (length === 0) return { label: "None", color: "text-muted-foreground", icon: Shield };
    if (!isHex) return { label: "Invalid Format", color: "text-destructive", icon: AlertCircle };
    
    if (length < 32) return { label: "Very Weak", color: "text-destructive", icon: ShieldAlert };
    if (length === 32) return { label: "Weak (Legacy)", color: "text-orange-500", icon: ShieldAlert };
    if (length === 40) return { label: "Moderate", color: "text-yellow-600", icon: Shield };
    if (length > 40 && length < 64) return { label: "Moderate (Modern)", color: "text-yellow-600", icon: Shield };
    if (length >= 64) return { label: "Strong", color: "text-green-600", icon: ShieldCheck };
    return { label: "Unknown", color: "text-muted-foreground", icon: Info };
  };

  const strength = getStrength();
  const StrengthIcon = strength.icon;

  return (
    <ToolLayout
      title="Hash Analyzer"
      description="Analyze a hash to identify its algorithm and check its cryptographic strength."
    >
      <div className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="hash-input">Hash String</Label>
          <Textarea
            id="hash-input"
            placeholder="Paste your hash here (e.g. 5e884898da28047151d0e56f8dc6292773603d0d6aabbdd62a11ef721d1542d8)"
            value={hash}
            onChange={(e) => setHash(e.target.value)}
            className="font-mono text-sm min-h-[100px]"
          />
        </div>

        {trimmedHash && (
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Info className="h-5 w-5 text-primary" />
                  Properties
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center border-b pb-2">
                  <span className="text-sm font-medium text-muted-foreground">Length</span>
                  <span className="font-mono">{length} characters</span>
                </div>
                <div className="flex justify-between items-center border-b pb-2">
                  <span className="text-sm font-medium text-muted-foreground">Format</span>
                  <Badge variant={isHex ? "outline" : "destructive"}>
                    {isHex ? "Hexadecimal" : "Unknown / Not Hex"}
                  </Badge>
                </div>
                <div className="flex justify-between items-center border-b pb-2">
                  <span className="text-sm font-medium text-muted-foreground">Bit Length</span>
                  <span className="font-mono">{isHex ? length * 4 : length * 8} bits</span>
                </div>
                <div className="space-y-2 pt-2">
                  <div className="flex justify-between items-center text-sm">
                    <span className="font-medium text-muted-foreground">Shannon Entropy</span>
                    <span className="font-mono">{entropy.toFixed(4)} bits/char</span>
                  </div>
                  <Progress value={entropyPercentage} className="h-2" />
                  <p className="text-[10px] text-muted-foreground">
                    Measures character randomness. Higher values indicate better distribution.
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center gap-2">
                  <StrengthIcon className={`h-5 w-5 ${strength.color}`} />
                  Strength & Type
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-1">
                  <span className="text-sm font-medium text-muted-foreground">Estimated Strength</span>
                  <div className={`text-xl font-bold ${strength.color}`}>
                    {strength.label}
                  </div>
                </div>

                <div className="space-y-2">
                  <span className="text-sm font-medium text-muted-foreground">Possible Hash Algorithms</span>
                  {isHex ? (
                    <div className="space-y-2">
                      {possibleTypes.length > 0 ? (
                        possibleTypes.map((t) => (
                          <div key={t.name} className="p-2 rounded border bg-muted/30">
                            <div className="flex items-center justify-between">
                              <span className="font-bold text-sm">{t.name}</span>
                              <Badge variant="secondary" className="text-[10px]">
                                {t.length * 4}-bit
                              </Badge>
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">{t.description}</p>
                          </div>
                        ))
                      ) : (
                        <div className="text-sm text-muted-foreground italic bg-muted/30 p-3 rounded border">
                          No common hash algorithm matches this length ({length}).
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-sm text-destructive bg-destructive/10 p-3 rounded border border-destructive/20 flex items-start gap-2">
                      <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                      <span>Hashes are typically hexadecimal strings. This input contains invalid characters.</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">How it works</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground space-y-2">
            <p>
              This tool analyzes hashes based on their structural properties:
            </p>
            <ul className="list-disc pl-5 space-y-1">
              <li><strong>Length:</strong> Most cryptographic hashes have a fixed output length (e.g., 32 hex chars for MD5, 64 for SHA-256).</li>
              <li><strong>Entropy:</strong> Shannon entropy measures the randomness of characters. Cryptographic hashes should have high entropy (close to 4.0 bits/char for hex) to avoid patterns.</li>
              <li><strong>Format:</strong> Valid hashes are usually represented in hexadecimal (0-9, a-f).</li>
            </ul>
            <p className="pt-2 italic">
              Note: This tool cannot &quot;reverse&quot; or &quot;crack&quot; a hash. It only identifies the possible algorithm used to create it.
            </p>
          </CardContent>
        </Card>
      </div>
    </ToolLayout>
  );
}
