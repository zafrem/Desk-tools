"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { ToolLayout } from "@/components/tool-layout";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ExternalLink, RefreshCw } from "lucide-react";

function IframeViewerContent() {
  const searchParams = useSearchParams();
  const queryUrl = searchParams.get("url");
  
  const [url, setUrl] = useState("https://www.wikipedia.org");
  const [currentUrl, setCurrentUrl] = useState("https://www.wikipedia.org");
  const [customWidth, setCustomWidth] = useState<string>("");
  const [customHeight, setCustomHeight] = useState<string>("");
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const iframeRef = React.useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    if (queryUrl) {
      setUrl(queryUrl);
      setCurrentUrl(queryUrl);
    }
  }, [queryUrl]);

  useEffect(() => {
    if (!iframeRef.current) return;

    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        // contentRect gives the size of the content box (inner size)
        const { width, height } = entry.contentRect;
        setDimensions({ 
          width: Math.round(width), 
          height: Math.round(height) 
        });
      }
    });

    observer.observe(iframeRef.current);
    return () => observer.disconnect();
  }, []);

  const handleLoad = () => {
    let formattedUrl = url.trim();
    if (formattedUrl && !/^https?:\/\//i.test(formattedUrl)) {
      formattedUrl = "https://" + formattedUrl;
    }
    setCurrentUrl(formattedUrl);
  };

  return (
    <ToolLayout
      title="Iframe Viewer"
      description="Preview external websites within an iframe. Note: Many sites block embedding (X-Frame-Options)."
      fullWidth
      extraActions={
        <div className="text-sm font-mono bg-muted px-3 py-1 rounded-md border shadow-sm">
          {dimensions.width} x {dimensions.height}
        </div>
      }
    >
      <div className="space-y-4 h-full flex flex-col">
        <div className="flex flex-wrap gap-2">
          <div className="flex-1 min-w-[300px] flex gap-2">
            <Input
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="Enter URL (e.g., https://example.com)"
              onKeyDown={(e) => e.key === "Enter" && handleLoad()}
            />
            <Button onClick={handleLoad}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Load
            </Button>
          </div>
          <div className="flex gap-2 items-center">
            <Input
              value={customWidth}
              onChange={(e) => setCustomWidth(e.target.value)}
              placeholder="Width"
              className="w-24 h-9 text-xs"
            />
            <span className="text-muted-foreground text-xs">x</span>
            <Input
              value={customHeight}
              onChange={(e) => setCustomHeight(e.target.value)}
              placeholder="Height"
              className="w-24 h-9 text-xs"
            />
            <Button variant="outline" size="sm" asChild>
              <a href={currentUrl} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="h-4 w-4 mr-2" />
                Open
              </a>
            </Button>
          </div>
        </div>

        <Card 
          className="flex-1 min-h-[700px] bg-muted/20 flex flex-col items-center overflow-auto p-4"
        >
          <div 
            className="bg-white shadow-lg border relative flex flex-col w-full"
            style={{
              maxWidth: customWidth ? (customWidth.includes("%") ? customWidth : `${customWidth}px`) : "100%",
              height: customHeight ? (customHeight.includes("%") ? customHeight : `${customHeight}px`) : "700px",
              flexShrink: 0
            }}
          >
            <iframe
              ref={iframeRef}
              src={currentUrl}
              className="flex-1 w-full border-0 block"
              title="External Content"
              sandbox="allow-same-origin allow-scripts allow-forms allow-popups"
            />
          </div>
        </Card>
        
        <div className="text-xs text-muted-foreground">
          <p>
            Warning: Some sites (like Google, Facebook, GitHub) prevent being embedded in an iframe for security reasons. 
            If you see a blank screen or a connection error, the site likely has a &quot;Content-Security-Policy&quot; or &quot;X-Frame-Options&quot; header.
          </p>
        </div>
      </div>
    </ToolLayout>
  );
}

export default function IframeViewerPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <IframeViewerContent />
    </Suspense>
  );
}
