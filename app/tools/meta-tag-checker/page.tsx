"use client";

import * as React from "react";
import { ToolLayout } from "@/components/tool-layout";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

// SEO Standards (approximate)
const TITLE_MAX_CHARS = 60;
const TITLE_MAX_PIXELS = 580;
const DESC_MAX_CHARS = 160;
const DESC_MAX_PIXELS = 920; // Mobile view often cuts off earlier, desktop around 920-990

// Helper to estimate pixel width (rough approximation for Arial 18px/14px)
// A canvas measurement would be accurate, but this is a fast server-side friendly heuristic if canvas isn't used.
// We will use a canvas ref for accurate measurement client-side.

export default function MetaTagCheckerPage() {
  const [title, setTitle] = React.useState("");
  const [description, setDescription] = React.useState("");
  
  const [titleWidth, setTitleWidth] = React.useState(0);
  const [descWidth, setDescWidth] = React.useState(0);

  // Canvas for measuring text width
  const canvasRef = React.useRef<HTMLCanvasElement>(null);

  React.useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Measure Title (Approx Google Title font: Arial, 20px - actually typically 18-20px sans-serif)
    ctx.font = "20px Arial, sans-serif";
    setTitleWidth(Math.round(ctx.measureText(title).width));

    // Measure Description (Approx Google Desc font: Arial, 14px)
    ctx.font = "14px Arial, sans-serif";
    setDescWidth(Math.round(ctx.measureText(description).width));
  }, [title, description]);

  return (
    <ToolLayout
      title="Meta Tag Checker"
      description="Preview how your web page will look in Google search results and check character limits."
    >
      <div className="grid gap-8 lg:grid-cols-[1fr_400px]">
        {/* Left: Inputs */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Meta Tags</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Title Input */}
              <div className="space-y-3">
                <div className="flex justify-between">
                  <Label htmlFor="title">Page Title</Label>
                  <span className={cn("text-xs font-mono", title.length > TITLE_MAX_CHARS ? "text-destructive" : "text-muted-foreground")}>
                    {title.length} / {TITLE_MAX_CHARS} chars
                  </span>
                </div>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Enter page title..."
                  className={cn(title.length > TITLE_MAX_CHARS && "border-destructive focus-visible:ring-destructive")}
                />
                <div className="space-y-1">
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Pixel Width</span>
                    <span className={cn(titleWidth > TITLE_MAX_PIXELS ? "text-destructive" : "")}>
                        {titleWidth}px / {TITLE_MAX_PIXELS}px
                    </span>
                  </div>
                  <Progress 
                    value={Math.min((titleWidth / TITLE_MAX_PIXELS) * 100, 100)} 
                    className={cn("h-1.5", titleWidth > TITLE_MAX_PIXELS ? "bg-destructive/20 [&>div]:bg-destructive" : "")}
                  />
                </div>
              </div>

              {/* Description Input */}
              <div className="space-y-3">
                <div className="flex justify-between">
                  <Label htmlFor="description">Meta Description</Label>
                  <span className={cn("text-xs font-mono", description.length > DESC_MAX_CHARS ? "text-destructive" : "text-muted-foreground")}>
                    {description.length} / {DESC_MAX_CHARS} chars
                  </span>
                </div>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Enter meta description..."
                  className={cn("min-h-[100px]", description.length > DESC_MAX_CHARS && "border-destructive focus-visible:ring-destructive")}
                />
                <div className="space-y-1">
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Pixel Width</span>
                    <span className={cn(descWidth > DESC_MAX_PIXELS ? "text-destructive" : "")}>
                        {descWidth}px / {DESC_MAX_PIXELS}px
                    </span>
                  </div>
                  <Progress 
                    value={Math.min((descWidth / DESC_MAX_PIXELS) * 100, 100)} 
                    className={cn("h-1.5", descWidth > DESC_MAX_PIXELS ? "bg-destructive/20 [&>div]:bg-destructive" : "")}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right: Preview */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>SERP Preview</CardTitle>
            </CardHeader>
            <CardContent>
              {/* Google Search Result Simulation */}
              <div className="font-sans max-w-[600px] select-none">
                {/* Mobile Preview Style */}
                <div className="mb-6">
                    <div className="text-xs text-muted-foreground mb-2 uppercase tracking-wider font-semibold">Google Mobile View</div>
                    <div className="bg-white dark:bg-[#202124] p-4 rounded-lg border shadow-sm">
                        <div className="flex items-center gap-2 mb-1">
                            <div className="w-6 h-6 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-[10px]">
                                🌐
                            </div>
                            <div className="flex flex-col">
                                <span className="text-xs text-[#202124] dark:text-[#dadce0]">example.com</span>
                                <span className="text-xs text-[#5f6368] dark:text-[#bdc1c6]">https://example.com › page</span>
                            </div>
                        </div>
                        <div className="text-[#1a0dab] dark:text-[#8ab4f8] text-lg leading-6 truncate hover:underline cursor-pointer">
                            {title || "Page Title"}
                        </div>
                        <div className="text-[#4d5156] dark:text-[#bdc1c6] text-sm leading-5 mt-1 line-clamp-2 break-words">
                            {description || "This is how your page description will appear in search results. Keep it concise and relevant to improve click-through rates."}
                        </div>
                    </div>
                </div>

                {/* Desktop Preview Style */}
                <div>
                    <div className="text-xs text-muted-foreground mb-2 uppercase tracking-wider font-semibold">Google Desktop View</div>
                    <div className="bg-white dark:bg-[#202124] p-4 rounded-lg border shadow-sm">
                        <div className="text-sm text-[#202124] dark:text-[#dadce0] mb-1">
                            https://example.com <span className="text-[#5f6368] dark:text-[#bdc1c6]">› page</span>
                        </div>
                        <div className="text-[#1a0dab] dark:text-[#8ab4f8] text-xl leading-snug truncate hover:underline cursor-pointer mb-1">
                            {title || "Page Title"}
                        </div>
                        <div className="text-[#4d5156] dark:text-[#bdc1c6] text-sm leading-5 max-w-[600px]">
                            {description || "This is how your page description will appear in search results. Keep it concise and relevant to improve click-through rates."}
                        </div>
                    </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Hidden Canvas for Measurements */}
          <canvas ref={canvasRef} className="hidden" />
        </div>
      </div>
    </ToolLayout>
  );
}
