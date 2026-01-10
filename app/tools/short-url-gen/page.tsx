"use client";

import * as React from "react";
import { ToolLayout } from "@/components/tool-layout";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Copy, Link, ExternalLink } from "lucide-react";

export default function ShortUrlGenPage() {
  const [longUrl, setLongUrl] = React.useState("");
  const [shortUrl, setShortUrl] = React.useState("");
  
  // Since this is a static client-side app, we can't persist real short URLs without a backend.
  // We will simulate the behavior or use a hash-based approach for demonstration/utility within the app context if applicable (e.g. sharing tool state).
  // For a general "Short URL Gen" tool, usually it connects to an API (bit.ly, tinyurl).
  // Here we'll simulate a shortened format or offer a "mock" shortener for UI demonstration, 
  // OR we can implement a simple hash-based shortener if we use local storage (not shareable globally).
  
  // Let's implement a simulation that generates a hash and explains the limitation, 
  // or maybe use a free public API if possible without keys? No, avoiding external deps without keys is safer.
  // We'll simulate the "generation" UX.

  const generateShortUrl = () => {
    if (!longUrl) return;
    // Mock hash
    const hash = Math.random().toString(36).substring(2, 8);
    setShortUrl(`https://short.link/${hash}`);
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(shortUrl);
  };

  return (
    <ToolLayout
      title="Short URL Generator"
      description="Create shorter aliases for long URLs (Simulation)."
    >
      <div className="max-w-2xl mx-auto space-y-8">
        <Card>
            <CardContent className="p-8 space-y-6">
                <div className="space-y-2">
                    <Label htmlFor="long-url">Enter a long URL</Label>
                    <div className="flex gap-2">
                        <Input 
                            id="long-url"
                            value={longUrl} 
                            onChange={(e) => setLongUrl(e.target.value)} 
                            placeholder="https://very-long-website.com/some/path/..." 
                        />
                        <Button onClick={generateShortUrl}>Shorten</Button>
                    </div>
                </div>

                {shortUrl && (
                    <div className="p-4 bg-muted/50 rounded-lg border flex items-center justify-between animate-in fade-in slide-in-from-top-2">
                        <div className="flex items-center gap-3 overflow-hidden">
                            <Link className="h-5 w-5 text-primary shrink-0" />
                            <div className="grid gap-0.5">
                                <div className="text-sm font-medium text-primary break-all">{shortUrl}</div>
                                <div className="text-xs text-muted-foreground truncate max-w-[300px]">{longUrl}</div>
                            </div>
                        </div>
                        <div className="flex gap-2 shrink-0">
                            <Button variant="ghost" size="icon" onClick={copyToClipboard} title="Copy">
                                <Copy className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" asChild title="Open">
                                <a href={longUrl} target="_blank" rel="noopener noreferrer">
                                    <ExternalLink className="h-4 w-4" />
                                </a>
                            </Button>
                        </div>
                    </div>
                )}

                <div className="text-xs text-muted-foreground bg-yellow-50 dark:bg-yellow-900/20 p-3 rounded text-center">
                    Note: This is a client-side simulation. Real URL shortening requires a server database.
                </div>
            </CardContent>
        </Card>
      </div>
    </ToolLayout>
  );
}
