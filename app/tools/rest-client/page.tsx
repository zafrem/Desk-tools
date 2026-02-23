"use client";

import React, { useState } from "react";
import { ToolLayout } from "@/components/tool-layout";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Play, Copy, Trash2, Plus, ShieldCheck } from "lucide-react";

interface Header {
  key: string;
  value: string;
}

interface ResponseState {
  status: number;
  statusText: string;
  time: string;
  headers: [string, string][];
  data: unknown;
}

export default function RestClientPage() {
  const [method, setMethod] = useState("GET");
  const [url, setUrl] = useState("https://jsonplaceholder.typicode.com/todos/1");
  const [headers, setHeaders] = useState<Header[]>([{ key: "Content-Type", value: "application/json" }]);
  const [body, setBody] = useState("");
  const [response, setResponse] = useState<ResponseState | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [useProxy, setUseProxy] = useState(false);

  const addHeader = () => setHeaders([...headers, { key: "", value: "" }]);
  const removeHeader = (index: number) => setHeaders(headers.filter((_, i) => i !== index));
  const updateHeader = (index: number, field: "key" | "value", val: string) => {
    const newHeaders = [...headers];
    newHeaders[index][field] = val;
    setHeaders(newHeaders);
  };

  const generateCurl = () => {
    let curl = `curl -X ${method} "${url}"`;
    headers.forEach((h) => {
      if (h.key) curl += ` \\\n  -H "${h.key}: ${h.value}"`;
    });
    if (body && ["POST", "PUT", "PATCH"].includes(method)) {
      curl += ` \\\n  -d '${body}'`;
    }
    return curl;
  };

  const handleSend = async () => {
    setLoading(true);
    setError(null);
    setResponse(null);

    try {
      const headerObj: Record<string, string> = {};
      headers.forEach((h) => {
        if (h.key) headerObj[h.key] = h.value;
      });

      const requestUrl = useProxy 
        ? `https://corsproxy.io/?${encodeURIComponent(url)}` 
        : url;

      const startTime = Date.now();
      const res = await fetch(requestUrl, {
        method,
        headers: headerObj,
        body: ["GET", "HEAD"].includes(method) ? null : body || null,
      });
      const endTime = Date.now();

      const data = await res.json().catch(() => null);
      
      setResponse({
        status: res.status,
        statusText: res.statusText,
        time: `${endTime - startTime}ms`,
        headers: Array.from(res.headers.entries()),
        data: data || "No JSON response body",
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch. This might be due to CORS or an invalid URL.");
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  return (
    <ToolLayout
      title="REST API Client"
      description="Test REST APIs and generate curl commands. Use the Proxy to bypass CORS errors."
    >
      <div className="space-y-6">
        <div className="flex flex-col gap-4">
          <div className="flex gap-2">
            <Select value={method} onValueChange={setMethod}>
              <SelectTrigger className="w-[120px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {["GET", "POST", "PUT", "DELETE", "PATCH", "HEAD"].map((m) => (
                  <SelectItem key={m} value={m}>{m}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Input
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="Enter Request URL"
              className="flex-1"
            />
            <Button onClick={handleSend} disabled={loading}>
              {loading ? "Sending..." : <><Play className="h-4 w-4 mr-2" /> Send</>}
            </Button>
          </div>
          
          <div className="flex items-center space-x-2 bg-muted/50 p-2 rounded-lg w-fit px-4 border border-dashed">
            <Checkbox 
              id="useProxy" 
              checked={useProxy} 
              onCheckedChange={(checked) => setUseProxy(!!checked)} 
            />
            <label 
              htmlFor="useProxy" 
              className="text-sm font-medium leading-none cursor-pointer flex items-center gap-2"
            >
              <ShieldCheck className="h-4 w-4 text-primary" />
              Use CORS Proxy (Bypass browser restrictions)
            </label>
          </div>
        </div>

        <Tabs defaultValue="headers" className="w-full">
          <TabsList>
            <TabsTrigger value="headers">Headers</TabsTrigger>
            <TabsTrigger value="body">Body</TabsTrigger>
            <TabsTrigger value="curl">Curl Command</TabsTrigger>
          </TabsList>
          
          <TabsContent value="headers" className="space-y-4 pt-4">
            {headers.map((header, index) => (
              <div key={index} className="flex gap-2 items-center">
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
            <Label className="mb-2 block">Request Body (JSON/Raw)</Label>
            <Textarea
              className="font-mono min-h-[150px]"
              placeholder='{"key": "value"}'
              value={body}
              onChange={(e) => setBody(e.target.value)}
            />
          </TabsContent>

          <TabsContent value="curl" className="pt-4">
            <div className="relative group">
              <pre className="p-4 bg-muted rounded-lg overflow-x-auto text-xs font-mono whitespace-pre-wrap">
                {generateCurl()}
              </pre>
              <Button
                variant="outline"
                size="icon"
                className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={() => copyToClipboard(generateCurl())}
              >
                <Copy className="h-4 w-4" />
              </Button>
            </div>
          </TabsContent>
        </Tabs>

        {error && (
          <div className="p-4 bg-destructive/10 text-destructive rounded-lg text-sm border border-destructive/20">
            <strong>Error:</strong> {error}
            <p className="mt-1 text-xs opacity-80">
              Note: Browsers block cross-origin requests (CORS). If the server doesn&apos;t allow your domain, the request will fail even if it works in Terminal. Try enabling the &quot;Use CORS Proxy&quot; option above.
            </p>
          </div>
        )}

        {response && (
          <Card className="p-4 space-y-4">
            <div className="flex justify-between items-center border-b pb-2">
              <h3 className="font-semibold">Response</h3>
              <div className="flex gap-4 text-sm">
                <span className={response.status >= 200 && response.status < 300 ? "text-green-500" : "text-red-500"}>
                  Status: {response.status} {response.statusText}
                </span>
                <span className="text-muted-foreground">Time: {response.time}</span>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label className="text-xs uppercase text-muted-foreground">Body</Label>
              <pre className="p-4 bg-muted rounded-lg overflow-x-auto text-xs font-mono max-h-[400px]">
                {JSON.stringify(response.data, null, 2)}
              </pre>
            </div>
          </Card>
        )}
      </div>
    </ToolLayout>
  );
}
