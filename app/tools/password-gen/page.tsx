"use client";

import * as React from "react";
import { ToolLayout } from "@/components/tool-layout";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Slider } from "@/components/ui/slider";
import { Card, CardContent } from "@/components/ui/card";
import { Copy, RefreshCw } from "lucide-react";

export default function PasswordGenPage() {
  const [length, setLength] = React.useState(16);
  const [useUpper, setUseUpper] = React.useState(true);
  const [useLower, setUseLower] = React.useState(true);
  const [useNumbers, setUseNumbers] = React.useState(true);
  const [useSymbols, setUseSymbols] = React.useState(true);
  const [password, setPassword] = React.useState("");

  const generate = React.useCallback(() => {
    const u = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    const l = "abcdefghijklmnopqrstuvwxyz";
    const n = "0123456789";
    const s = "!@#$%^&*()_+~`|}{[]:;?><,./-=";

    let chars = "";
    if (useUpper) chars += u;
    if (useLower) chars += l;
    if (useNumbers) chars += n;
    if (useSymbols) chars += s;

    if (!chars) {
      setPassword("");
      return;
    }

    let pass = "";
    // Ensure at least one of each selected type
    const mandatory = [];
    if (useUpper) mandatory.push(u[Math.floor(Math.random() * u.length)]);
    if (useLower) mandatory.push(l[Math.floor(Math.random() * l.length)]);
    if (useNumbers) mandatory.push(n[Math.floor(Math.random() * n.length)]);
    if (useSymbols) mandatory.push(s[Math.floor(Math.random() * s.length)]);

    // Fill the rest
    for (let i = 0; i < length - mandatory.length; i++) {
      pass += chars.charAt(Math.floor(Math.random() * chars.length));
    }

    // Insert mandatory chars at random positions
    const passArr = pass.split('');
    mandatory.forEach(char => {
        const pos = Math.floor(Math.random() * (passArr.length + 1));
        passArr.splice(pos, 0, char);
    });
    
    // Trim to length if over (rare case logic, but safe)
    pass = passArr.join('').slice(0, length);
    
    setPassword(pass);
  }, [length, useUpper, useLower, useNumbers, useSymbols]);

  React.useEffect(() => {
    generate();
  }, [generate]);

  const copyToClipboard = () => {
    navigator.clipboard.writeText(password);
  };

  return (
    <ToolLayout
      title="Password Generator"
      description="Generate strong, secure, and random passwords."
    >
      <div className="max-w-2xl mx-auto space-y-8">
        {/* Display */}
        <Card className="bg-muted/50">
            <CardContent className="p-6 flex items-center gap-4">
                <div className="flex-1 text-center font-mono text-3xl tracking-wider break-all">
                    {password || "Select Options"}
                </div>
                <Button size="icon" variant="ghost" onClick={copyToClipboard} title="Copy">
                    <Copy className="h-5 w-5" />
                </Button>
                <Button size="icon" onClick={generate} title="Regenerate">
                    <RefreshCw className="h-5 w-5" />
                </Button>
            </CardContent>
        </Card>

        {/* Controls */}
        <div className="space-y-6 bg-card p-6 rounded-lg border">
            <div className="space-y-4">
                <div className="flex justify-between items-center">
                    <Label>Password Length: {length}</Label>
                </div>
                <Slider 
                    value={[length]} 
                    min={6} max={64} step={1} 
                    onValueChange={(v) => setLength(v[0])} 
                />
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center space-x-2">
                    <Checkbox id="upper" checked={useUpper} onCheckedChange={(c) => setUseUpper(!!c)} />
                    <Label htmlFor="upper">Uppercase (A-Z)</Label>
                </div>
                <div className="flex items-center space-x-2">
                    <Checkbox id="lower" checked={useLower} onCheckedChange={(c) => setUseLower(!!c)} />
                    <Label htmlFor="lower">Lowercase (a-z)</Label>
                </div>
                <div className="flex items-center space-x-2">
                    <Checkbox id="number" checked={useNumbers} onCheckedChange={(c) => setUseNumbers(!!c)} />
                    <Label htmlFor="number">Numbers (0-9)</Label>
                </div>
                <div className="flex items-center space-x-2">
                    <Checkbox id="symbol" checked={useSymbols} onCheckedChange={(c) => setUseSymbols(!!c)} />
                    <Label htmlFor="symbol">Symbols (!@#$)</Label>
                </div>
            </div>
        </div>
      </div>
    </ToolLayout>
  );
}
