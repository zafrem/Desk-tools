"use client";

import * as React from "react";
import { ToolLayout } from "@/components/tool-layout";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import {
  Link2,
  Link2Off,
  Columns,
  Rows,
  Smartphone,
  SmartphoneNfc,
  Laptop,
  Monitor,
  RefreshCw,
  Info,
  ExternalLink,
} from "lucide-react";

// Common viewport size presets
const VIEWPORT_PRESETS = {
  desktop: { name: "Desktop (1440x900)", width: 1440, height: 900, icon: Monitor },
  laptop: { name: "Laptop (1024x768)", width: 1024, height: 768, icon: Laptop },
  tablet: { name: "Tablet (768x1024)", width: 768, height: 1024, icon: SmartphoneNfc },
  mobile: { name: "Mobile (375x812)", width: 375, height: 812, icon: Smartphone },
  custom: { name: "Custom Size", width: 500, height: 600, icon: Monitor },
};

type PresetKey = keyof typeof VIEWPORT_PRESETS;

export default function ScreenComparatorPage() {
  const [urlLeft, setUrlLeft] = React.useState("https://example.com");
  const [urlRight, setUrlRight] = React.useState("https://example.com");
  const [isSynced, setIsSynced] = React.useState(true);
  const [isVerticalSplit, setIsVerticalSplit] = React.useState(false);

  // Left Viewport States
  const [presetLeft, setPresetLeft] = React.useState<PresetKey>("desktop");
  const [widthLeft, setWidthLeft] = React.useState(1440);
  const [heightLeft, setHeightLeft] = React.useState(900);
  const [isPortraitLeft, setIsPortraitLeft] = React.useState(false);

  // Right Viewport States
  const [presetRight, setPresetRight] = React.useState<PresetKey>("mobile");
  const [widthRight, setWidthRight] = React.useState(375);
  const [heightRight, setHeightRight] = React.useState(812);
  const [isPortraitRight, setIsPortraitRight] = React.useState(true);

  // Reference hooks to force iframe reloads
  const iframeLeftRef = React.useRef<HTMLIFrameElement>(null);
  const iframeRightRef = React.useRef<HTMLIFrameElement>(null);

  // URL Sync Handlers
  const handleUrlLeftChange = (val: string) => {
    setUrlLeft(val);
    if (isSynced) {
      setUrlRight(val);
    }
  };

  const handleUrlRightChange = (val: string) => {
    setUrlRight(val);
    if (isSynced) {
      setUrlLeft(val);
    }
  };

  const toggleSync = () => {
    setIsSynced(!isSynced);
    if (!isSynced) {
      setUrlRight(urlLeft);
    }
  };

  // Preset Handlers
  const applyPresetLeft = (key: PresetKey) => {
    setPresetLeft(key);
    if (key !== "custom") {
      setWidthLeft(VIEWPORT_PRESETS[key].width);
      setHeightLeft(VIEWPORT_PRESETS[key].height);
    }
  };

  const applyPresetRight = (key: PresetKey) => {
    setPresetRight(key);
    if (key !== "custom") {
      setWidthRight(VIEWPORT_PRESETS[key].width);
      setHeightRight(VIEWPORT_PRESETS[key].height);
    }
  };

  // Rotate Orientations (Portrait / Landscape)
  const toggleOrientationLeft = () => {
    setIsPortraitLeft(!isPortraitLeft);
    const w = widthLeft;
    const h = heightLeft;
    setWidthLeft(h);
    setHeightLeft(w);
  };

  const toggleOrientationRight = () => {
    setIsPortraitRight(!isPortraitRight);
    const w = widthRight;
    const h = heightRight;
    setWidthRight(h);
    setHeightRight(w);
  };

  // Refresh Iframes
  const refreshIframeLeft = () => {
    if (iframeLeftRef.current) {
      // Re-assign src to force reload
      iframeLeftRef.current.src = urlLeft;
    }
  };

  const refreshIframeRight = () => {
    if (iframeRightRef.current) {
      iframeRightRef.current.src = urlRight;
    }
  };

  return (
    <ToolLayout
      title="Screen Comparator"
      description="Load and compare two URL screens side-by-side or stacked. Fully test responsive web layouts and environments."
    >
      <div className="space-y-6">
        {/* Iframe Restriction Alert Info Box */}
        <div className="rounded-lg border bg-yellow-500/5 border-yellow-500/20 p-4 flex gap-3 text-sm text-yellow-600 dark:text-yellow-400">
          <Info className="h-5 w-5 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h4 className="font-semibold">Iframe Connection Notice</h4>
            <p className="text-xs text-muted-foreground leading-normal">
              Many major websites (like Google, Naver, or GitHub) restrict loading inside iframes via security headers (`X-Frame-Options` or `CSP`). 
              If the iframe displays blank, please test using your own local developments (`http://localhost:3000`) or domains you manage.
            </p>
          </div>
        </div>

        {/* Global Controls Toolbar */}
        <Card className="bg-muted/10 border">
          <CardContent className="p-4 space-y-4">
            {/* Split and Sync Toggles */}
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <Button
                  variant={isSynced ? "default" : "outline"}
                  onClick={toggleSync}
                  className="gap-1.5 text-xs h-9"
                  title="Toggle URL Syncing"
                >
                  {isSynced ? <Link2 className="h-4 w-4" /> : <Link2Off className="h-4 w-4" />}
                  {isSynced ? "URLs Linked" : "Sync Disconnected"}
                </Button>

                <Button
                  variant="outline"
                  onClick={() => setIsVerticalSplit(!isVerticalSplit)}
                  size="icon"
                  className="h-9 w-9"
                  title={isVerticalSplit ? "Switch to Side-by-Side Split" : "Switch to Vertical Stack Split"}
                >
                  {isVerticalSplit ? <Columns className="h-4 w-4" /> : <Rows className="h-4 w-4" />}
                </Button>
              </div>

              <div className="flex gap-2 text-xs">
                <Button variant="ghost" size="sm" onClick={refreshIframeLeft} className="gap-1 h-8 text-muted-foreground">
                  <RefreshCw className="h-3.5 w-3.5" /> Reload Left
                </Button>
                <Button variant="ghost" size="sm" onClick={refreshIframeRight} className="gap-1 h-8 text-muted-foreground">
                  <RefreshCw className="h-3.5 w-3.5" /> Reload Right
                </Button>
              </div>
            </div>

            {/* Inputs Grid */}
            <div className="grid md:grid-cols-2 gap-6">
              {/* Left Control Input Block */}
              <div className="space-y-3">
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <Label className="font-semibold text-xs text-muted-foreground">Left Screen URL</Label>
                    <a href={urlLeft} target="_blank" rel="noreferrer" className="text-[10px] text-primary flex items-center gap-1 hover:underline">
                      Open Direct <ExternalLink className="h-2.5 w-2.5" />
                    </a>
                  </div>
                  <Input
                    type="url"
                    value={urlLeft}
                    onChange={(e) => handleUrlLeftChange(e.target.value)}
                    placeholder="https://example.com"
                    className="h-9 bg-background"
                  />
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  <Select value={presetLeft} onValueChange={(v) => applyPresetLeft(v as PresetKey)}>
                    <SelectTrigger className="w-[180px] h-8 text-xs bg-background">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(VIEWPORT_PRESETS).map(([key, item]) => (
                        <SelectItem key={key} value={key} className="text-xs">
                          {item.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  {presetLeft === "custom" ? (
                    <div className="flex items-center gap-1 text-xs">
                      <Input
                        type="number"
                        value={widthLeft}
                        onChange={(e) => setWidthLeft(Number(e.target.value))}
                        className="w-16 h-8 p-1 text-center bg-background"
                        placeholder="W"
                      />
                      <span className="text-muted-foreground">x</span>
                      <Input
                        type="number"
                        value={heightLeft}
                        onChange={(e) => setHeightLeft(Number(e.target.value))}
                        className="w-16 h-8 p-1 text-center bg-background"
                        placeholder="H"
                      />
                    </div>
                  ) : (
                    <Button variant="ghost" size="sm" onClick={toggleOrientationLeft} className="text-[10px] h-8 text-muted-foreground px-2">
                      {isPortraitLeft ? "Landscape" : "Portrait"}
                    </Button>
                  )}
                </div>
              </div>

              {/* Right Control Input Block */}
              <div className="space-y-3">
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <Label className="font-semibold text-xs text-muted-foreground">Right Screen URL</Label>
                    <a href={urlRight} target="_blank" rel="noreferrer" className="text-[10px] text-primary flex items-center gap-1 hover:underline">
                      Open Direct <ExternalLink className="h-2.5 w-2.5" />
                    </a>
                  </div>
                  <Input
                    type="url"
                    value={urlRight}
                    disabled={isSynced}
                    onChange={(e) => handleUrlRightChange(e.target.value)}
                    placeholder="https://example.com"
                    className="h-9 bg-background disabled:opacity-60"
                  />
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  <Select value={presetRight} onValueChange={(v) => applyPresetRight(v as PresetKey)}>
                    <SelectTrigger className="w-[180px] h-8 text-xs bg-background">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(VIEWPORT_PRESETS).map(([key, item]) => (
                        <SelectItem key={key} value={key} className="text-xs">
                          {item.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  {presetRight === "custom" ? (
                    <div className="flex items-center gap-1 text-xs">
                      <Input
                        type="number"
                        value={widthRight}
                        onChange={(e) => setWidthRight(Number(e.target.value))}
                        className="w-16 h-8 p-1 text-center bg-background"
                        placeholder="W"
                      />
                      <span className="text-muted-foreground">x</span>
                      <Input
                        type="number"
                        value={heightRight}
                        onChange={(e) => setHeightRight(Number(e.target.value))}
                        className="w-16 h-8 p-1 text-center bg-background"
                        placeholder="H"
                      />
                    </div>
                  ) : (
                    <Button variant="ghost" size="sm" onClick={toggleOrientationRight} className="text-[10px] h-8 text-muted-foreground px-2">
                      {isPortraitRight ? "Landscape" : "Portrait"}
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Dynamic Display Screens */}
        <div
          className={`flex ${
            isVerticalSplit ? "flex-col items-center space-y-8" : "flex-col lg:flex-row items-center lg:items-start lg:justify-center gap-8"
          } overflow-auto p-4 bg-muted/5 rounded-xl border border-dashed min-h-[500px]`}
        >
          {/* Left Screen Wrapper */}
          <div className="flex flex-col items-center">
            <span className="text-xs text-muted-foreground font-semibold mb-2 uppercase tracking-widest bg-muted/60 border px-3 py-1 rounded-full">
              Left Screen ({widthLeft}x{heightLeft})
            </span>
            <div
              className="border rounded-xl shadow-lg bg-background overflow-hidden relative"
              style={{ width: `${widthLeft}px`, height: `${heightLeft}px` }}
            >
              <iframe
                ref={iframeLeftRef}
                src={urlLeft}
                className="w-full h-full border-none"
                sandbox="allow-same-origin allow-scripts allow-popups allow-forms"
              />
            </div>
          </div>

          {/* Right Screen Wrapper */}
          <div className="flex flex-col items-center">
            <span className="text-xs text-muted-foreground font-semibold mb-2 uppercase tracking-widest bg-muted/60 border px-3 py-1 rounded-full">
              Right Screen ({widthRight}x{heightRight})
            </span>
            <div
              className="border rounded-xl shadow-lg bg-background overflow-hidden relative"
              style={{ width: `${widthRight}px`, height: `${heightRight}px` }}
            >
              <iframe
                ref={iframeRightRef}
                src={urlRight}
                className="w-full h-full border-none"
                sandbox="allow-same-origin allow-scripts allow-popups allow-forms"
              />
            </div>
          </div>
        </div>
      </div>
    </ToolLayout>
  );
}
