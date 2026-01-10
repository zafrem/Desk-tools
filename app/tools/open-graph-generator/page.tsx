"use client";

import * as React from "react";
import { ToolLayout } from "@/components/tool-layout";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Copy } from "lucide-react";

export default function OpenGraphGeneratorPage() {
  const [ogTitle, setOgTitle] = React.useState("");
  const [ogDesc, setOgDesc] = React.useState("");
  const [ogUrl, setOgUrl] = React.useState("");
  const [ogImage, setOgImage] = React.useState("");
  const [ogSiteName, setOgSiteName] = React.useState("");

  const generatedTags = `
<meta property="og:title" content="${ogTitle}" />
<meta property="og:description" content="${ogDesc}" />
<meta property="og:url" content="${ogUrl}" />
<meta property="og:image" content="${ogImage}" />
<meta property="og:type" content="website" />
<meta property="og:site_name" content="${ogSiteName}" />
<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:title" content="${ogTitle}" />
<meta name="twitter:description" content="${ogDesc}" />
<meta name="twitter:image" content="${ogImage}" />
  `.trim();

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(generatedTags);
    } catch (err) { console.error(err); }
  };

  return (
    <ToolLayout
      title="Open Graph Generator"
      description="Generate Open Graph and Twitter Card meta tags for better social media sharing."
    >
      <div className="grid gap-8 lg:grid-cols-2">
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Title</Label>
                <Input value={ogTitle} onChange={(e) => setOgTitle(e.target.value)} placeholder="Page Title" />
              </div>
              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea value={ogDesc} onChange={(e) => setOgDesc(e.target.value)} placeholder="Brief description..." />
              </div>
              <div className="space-y-2">
                <Label>URL</Label>
                <Input value={ogUrl} onChange={(e) => setOgUrl(e.target.value)} placeholder="https://example.com/page" />
              </div>
              <div className="space-y-2">
                <Label>Image URL</Label>
                <Input value={ogImage} onChange={(e) => setOgImage(e.target.value)} placeholder="https://example.com/image.jpg" />
              </div>
              <div className="space-y-2">
                <Label>Site Name</Label>
                <Input value={ogSiteName} onChange={(e) => setOgSiteName(e.target.value)} placeholder="My Website" />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Preview (Facebook/LinkedIn)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="border rounded-lg overflow-hidden max-w-md mx-auto bg-gray-100 dark:bg-zinc-900">
                <div className="aspect-[1.91/1] bg-gray-300 dark:bg-zinc-800 w-full flex items-center justify-center overflow-hidden relative">
                  {ogImage ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={ogImage} alt="OG Preview" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-gray-500">No Image</span>
                  )}
                </div>
                <div className="p-3 bg-white dark:bg-zinc-900 border-t">
                  <div className="text-xs text-gray-500 uppercase truncate mb-1">{ogUrl ? new URL(ogUrl).hostname : "EXAMPLE.COM"}</div>
                  <div className="font-bold text-base leading-tight mb-1 truncate text-black dark:text-white">{ogTitle || "Page Title"}</div>
                  <div className="text-sm text-gray-500 line-clamp-1">{ogDesc || "Description will appear here..."}</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="relative">
            <Label className="mb-2 block">Generated Meta Tags</Label>
            <Textarea readOnly value={generatedTags} className="font-mono text-xs h-[250px] bg-muted" />
            <Button variant="outline" size="sm" className="absolute top-8 right-2 h-7" onClick={handleCopy}>
                <Copy className="h-3 w-3 mr-1" /> Copy
            </Button>
          </div>
        </div>
      </div>
    </ToolLayout>
  );
}
