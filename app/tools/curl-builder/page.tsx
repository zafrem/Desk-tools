"use client";

import React, { useState, useMemo } from "react";
import { ToolLayout } from "@/components/tool-layout";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Copy, Terminal, Trash2, Plus, Code } from "lucide-react";

interface KV {
  key: string;
  value: string;
}

export default function CurlBuilderPage() {
  const [method, setMethod] = useState("GET");
  const [url, setUrl] = useState("https://api.example.com/v1/resource");
  const [headers, setHeaders] = useState<KV[]>([{ key: "Content-Type", value: "application/json" }]);
  const [body, setBody] = useState("");
  const [auth, setAuth] = useState({ type: "none", username: "", password: "", token: "" });
  const [options, setOptions] = useState({
    insecure: false,
    verbose: false,
    followRedirects: true,
    compressed: false,
  });

  const addHeader = () => setHeaders([...headers, { key: "", value: "" }]);
  const removeHeader = (index: number) => setHeaders(headers.filter((_, i) => i !== index));
  const updateHeader = (index: number, field: "key" | "value", val: string) => {
    const newHeaders = [...headers];
    newHeaders[index][field] = val;
    setHeaders(newHeaders);
  };

  const curlCommand = useMemo(() => {
    let parts = ["curl"];
    
    // Method
    if (method !== "GET") {
      parts.push(`-X ${method}`);
    }

    // URL
    parts.push(`"${url}"`);

    // Headers
    headers.forEach((h) => {
      if (h.key) parts.push(`-H "${h.key}: ${h.value}"`);
    });

    // Auth
    if (auth.type === "basic" && auth.username) {
      parts.push(`-u "${auth.username}:${auth.password}"`);
    } else if (auth.type === "bearer" && auth.token) {
      parts.push(`-H "Authorization: Bearer ${auth.token}"`);
    }

    // Body
    if (body && ["POST", "PUT", "PATCH"].includes(method)) {
      // Escape single quotes for shell
      const escapedBody = body.replace(/'/g, "'''");
      parts.push(`-d '${escapedBody}'`);
    }

    // Options
    if (options.insecure) parts.push("-k");
    if (options.verbose) parts.push("-v");
    if (options.followRedirects) parts.push("-L");
    if (options.compressed) parts.push("--compressed");

    return parts.join(" 
  ");
  }, [method, url, headers, body, auth, options]);

  const copyToClipboard = () => {
    // Single line version for copying
    const singleLine = curlCommand.replace(/ 
  /g, " ");
    navigator.clipboard.writeText(singleLine);
  };

  return (
    <ToolLayout
      title="CURL Command Builder"
      description="Visually construct complex CURL commands for terminal use."
    >
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-full">
        {/* Configuration Side */}
        <div className="space-y-6 overflow-y-auto pb-10">
          <div className="space-y-4">
            <div className="grid grid-cols-4 gap-2">
              <div className="col-span-1">
                <Label>Method</Label>
                <Select value={method} onValueChange={setMethod}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {["GET", "POST", "PUT", "DELETE", "PATCH", "HEAD", "OPTIONS"].map((m) => (
                      <SelectItem key={m} value={m}>{m}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="col-span-3">
                <Label>URL</Label>
                <Input
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="https://api.example.com"
                />
              </div>
            </div>

            <Tabs defaultValue="headers">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="headers">Headers</TabsTrigger>
                <TabsTrigger value="body">Body</TabsTrigger>
                <TabsTrigger value="auth">Auth</TabsTrigger>
              </TabsList>

              <TabsContent value="headers" className="space-y-3 pt-4">
                {headers.map((header, index) => (
                  <div key={index} className="flex gap-2">
                    <Input
                      placeholder="Key"
                      value={header.key}
                      onChange={(e) => updateHeader(index, "key", e.target.value)}
                    />
                    <Input
                      placeholder="Value"
                      value={header.value}
                      onChange={(e) => updateHeader(index, "value", e.target.value)}
                    />
                    <Button variant="ghost" size="icon" onClick={() => removeHeader(index)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                <Button variant="outline" size="sm" onClick={addHeader}>
                  <Plus className="h-4 w-4 mr-2" /> Add Header
                </Button>
              </TabsContent>

              <TabsContent value="body" className="pt-4">
                <Textarea
                  className="font-mono min-h-[150px]"
                  placeholder='{"data": "example"}'
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                />
              </TabsContent>

              <TabsContent value="auth" className="space-y-4 pt-4">
                <Select value={auth.type} onValueChange={(v) => setAuth({ ...auth, type: v })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Auth Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No Auth</SelectItem>
                    <SelectItem value="basic">Basic Auth</SelectItem>
                    <SelectItem value="bearer">Bearer Token</SelectItem>
                  </SelectContent>
                </Select>

                {auth.type === "basic" && (
                  <div className="grid grid-cols-2 gap-2">
                    <Input
                      placeholder="Username"
                      value={auth.username}
                      onChange={(e) => setAuth({ ...auth, username: e.target.value })}
                    />
                    <Input
                      type="password"
                      placeholder="Password"
                      value={auth.password}
                      onChange={(e) => setAuth({ ...auth, password: e.target.value })}
                    />
                  </div>
                )}

                {auth.type === "bearer" && (
                  <Input
                    placeholder="Token"
                    value={auth.token}
                    onChange={(e) => setAuth({ ...auth, token: e.target.value })}
                  />
                )}
              </TabsContent>
            </Tabs>

            <div className="space-y-3 border-t pt-4">
              <Label>Options</Label>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="insecure" 
                    checked={options.insecure} 
                    onCheckedChange={(v) => setOptions({...options, insecure: !!v})} 
                  />
                  <label htmlFor="insecure" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                    Insecure (-k)
                  </label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="verbose" 
                    checked={options.verbose} 
                    onCheckedChange={(v) => setOptions({...options, verbose: !!v})} 
                  />
                  <label htmlFor="verbose" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                    Verbose (-v)
                  </label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="redirects" 
                    checked={options.followRedirects} 
                    onCheckedChange={(v) => setOptions({...options, followRedirects: !!v})} 
                  />
                  <label htmlFor="redirects" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                    Follow Redirects (-L)
                  </label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="compressed" 
                    checked={options.compressed} 
                    onCheckedChange={(v) => setOptions({...options, compressed: !!v})} 
                  />
                  <label htmlFor="compressed" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                    Compressed (--compressed)
                  </label>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Output Side */}
        <div className="flex flex-col space-y-4">
          <div className="flex items-center justify-between">
            <Label className="flex items-center gap-2">
              <Terminal className="h-4 w-4" /> Generated Command
            </Label>
            <Button size="sm" onClick={copyToClipboard}>
              <Copy className="h-4 w-4 mr-2" /> Copy to Terminal
            </Button>
          </div>
          <div className="flex-1 bg-zinc-950 text-zinc-100 p-6 rounded-xl font-mono text-sm border shadow-inner overflow-auto whitespace-pre">
            {curlCommand}
          </div>
        </div>
      </div>
    </ToolLayout>
  );
}
