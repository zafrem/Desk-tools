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

  useEffect(() => {
    if (queryUrl) {
      setUrl(queryUrl);
      setCurrentUrl(queryUrl);
    }
  }, [queryUrl]);

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
    >
      <div className="space-y-4 h-full flex flex-col">
        <div className="flex gap-2">
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
          <Button variant="outline" asChild>
            <a href={currentUrl} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="h-4 w-4 mr-2" />
              Open
            </a>
          </Button>
        </div>

        <Card className="flex-1 min-h-[500px] overflow-hidden bg-white">
          <iframe
            src={currentUrl}
            className="w-full h-full border-0"
            title="External Content"
            sandbox="allow-same-origin allow-scripts allow-forms allow-popups"
          />
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
