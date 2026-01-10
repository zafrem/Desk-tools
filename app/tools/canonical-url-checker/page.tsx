"use client";

import { ToolLayout } from "@/components/tool-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { AlertCircle, CheckCircle2, Globe, FileCode, Link as LinkIcon, ExternalLink } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

export default function CanonicalUrlChecker() {
  const [url, setUrl] = useState("");
  const [html, setHtml] = useState("");
  const [activeTab, setActiveTab] = useState("url");
  const [result, setResult] = useState<{ 
    found: boolean;
    canonical?: string;
    error?: string;
    match?: boolean; // Only for URL mode
  } | null>(null);
  const [loading, setLoading] = useState(false);

  const checkUrl = async () => {
    if (!url) return;
    setLoading(true);
    setResult(null);

    try {
      const response = await fetch(url);
      const text = await response.text();
      parseHtml(text, url);
    } catch (err) {
      setResult({
        found: false,
        error: "Could not fetch URL. This is likely due to CORS restrictions on the target website. The browser blocks requests to other domains that don't explicitly allow it. Please verify the URL or try the 'Paste HTML' method.",
      });
    } finally {
      setLoading(false);
    }
  };

  const checkHtml = () => {
    if (!html) return;
    setLoading(true);
    setResult(null);
    // Small delay to show loading state for better UX
    setTimeout(() => {
        parseHtml(html);
        setLoading(false);
    }, 500);
  };

  const parseHtml = (htmlString: string, originalUrl?: string) => {
    try {
      const parser = new DOMParser();
      const doc = parser.parseFromString(htmlString, "text/html");
      const canonicalTag = doc.querySelector('link[rel="canonical"]');
      const canonicalHref = canonicalTag?.getAttribute("href");

      if (canonicalHref) {
        let isMatch = undefined;
        let finalCanonical = canonicalHref;

        if (originalUrl) {
            try {
                // Resolve relative URLs
                finalCanonical = new URL(canonicalHref, originalUrl).href;
                
                const normOriginal = new URL(originalUrl).href.replace(/\$\/$/, "");
                const normCanonical = finalCanonical.replace(/\$\/$/, "");
                isMatch = normOriginal === normCanonical;
            } catch (e) {
                console.error("URL parsing error", e);
            }
        }

        setResult({
          found: true,
          canonical: finalCanonical,
          match: isMatch,
        });
      } else {
        setResult({
          found: false,
          error: "No <link rel=\"canonical\"> tag found in the provided HTML.",
        });
      }
    } catch (e) {
      setResult({
        found: false,
        error: "Failed to parse HTML content.",
      });
    }
  };

  return (
    <ToolLayout
      title="Canonical URL Checker"
      description="Validate and check canonical tags to prevent duplicate content issues."
    >
      <div className="grid gap-6">
        <Tabs defaultValue="url" className="w-full" onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="url" className="flex items-center gap-2">
                <Globe className="h-4 w-4" />
                Fetch URL
            </TabsTrigger>
            <TabsTrigger value="html" className="flex items-center gap-2">
                <FileCode className="h-4 w-4" />
                Paste HTML
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="url">
            <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-6 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="url">Page URL</Label>
                <div className="flex gap-2">
                  <Input 
                    id="url" 
                    placeholder="https://example.com/page"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && checkUrl()}
                  />
                  <Button onClick={checkUrl} disabled={loading || !url}>
                    {loading ? "Checking..." : "Check"}
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                    Note: Many websites block direct browser requests (CORS). If this fails, view the page source (Ctrl+U) and use the &quot;Paste HTML&quot; tab.
                </p>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="html">
            <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-6 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="html">HTML Source Code</Label>
                <Textarea 
                    id="html" 
                    placeholder="Paste the page source code (or just the <head> section) here..."
                    className="min-h-[200px] font-mono text-sm"
                    value={html}
                    onChange={(e) => setHtml(e.target.value)}
                />
                <Button onClick={checkHtml} disabled={loading || !html} className="w-full">
                    {loading ? "Processing..." : "Extract Canonical URL"}
                </Button>
              </div>
            </div>
          </TabsContent>
        </Tabs>

        {result && (
            <div className={cn(
                "rounded-lg border p-6 animate-in fade-in slide-in-from-bottom-2",
                result.error ? "bg-destructive/10 border-destructive/20" : "bg-card shadow-sm"
            )}>
                {result.error ? (
                    <div className="flex items-start gap-3 text-destructive">
                        <AlertCircle className="h-5 w-5 mt-0.5 shrink-0" />
                        <div>
                            <h3 className="font-semibold">Check Failed</h3>
                            <p className="text-sm mt-1 opacity-90">{result.error}</p>
                        </div>
                    </div>
                ) : (
                    <div className="space-y-4">
                        <div className="flex items-center gap-2 text-green-600 dark:text-green-500 mb-2">
                            <CheckCircle2 className="h-5 w-5" />
                            <h3 className="font-semibold">Canonical Tag Found</h3>
                        </div>

                        <div className="space-y-1">
                            <Label className="text-muted-foreground text-xs uppercase tracking-wider">Canonical URL</Label>
                            <div className="flex items-center gap-2 p-3 bg-muted rounded-md border font-mono text-sm break-all">
                                <LinkIcon className="h-4 w-4 shrink-0 opacity-50" />
                                {result.canonical}
                                <a 
                                    href={result.canonical}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="ml-auto shrink-0 hover:text-primary"
                                    title="Open URL"
                                >
                                    <ExternalLink className="h-4 w-4" />
                                </a>
                            </div>
                        </div>

                        {activeTab === 'url' && result.match !== undefined && (
                             <div className={cn(
                                "text-sm p-3 rounded-md flex items-center gap-2",
                                result.match 
                                    ? "bg-green-100/50 text-green-700 dark:bg-green-900/20 dark:text-green-300" 
                                    : "bg-yellow-100/50 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-300"
                             )}>
                                {result.match ? (
                                    <>
                                        <CheckCircle2 className="h-4 w-4" />
                                        <span>Matches the current page URL (Self-referencing).</span>
                                    </>
                                ) : (
                                    <>
                                        <AlertCircle className="h-4 w-4" />
                                        <span>Points to a different URL (Canonicalizes to another page).</span>
                                    </>
                                )}
                             </div>
                        )}
                    </div>
                )}
            </div>
        )}
      </div>
    </ToolLayout>
  );
}
