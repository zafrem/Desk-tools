"use client";

import * as React from "react";
import { ToolLayout } from "@/components/tool-layout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Copy, Check, Palette, Image as ImageIcon, Droplet, Upload, Loader2 } from "lucide-react";

// --- Color Utils ---

function hexToRgb(hex: string) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : null;
}

function rgbToHex(r: number, g: number, b: number) {
  return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
}

function rgbToHsl(r: number, g: number, b: number) {
  r /= 255;
  g /= 255;
  b /= 255;
  const max = Math.max(r, g, b),
    min = Math.min(r, g, b);
  let h = 0,
    s;
  const l = (max + min) / 2;

  if (max === min) {
    h = s = 0; // achromatic
  } else {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r:
        h = (g - b) / d + (g < b ? 6 : 0);
        break;
      case g:
        h = (b - r) / d + 2;
        break;
      case b:
        h = (r - g) / d + 4;
        break;
    }
    h /= 6;
  }

  return { h: Math.round(h * 360), s: Math.round(s * 100), l: Math.round(l * 100) };
}

function hslToRgb(h: number, s: number, l: number) {
  h /= 360;
  s /= 100;
  l /= 100;
  let r, g, b;

  if (s === 0) {
    r = g = b = l; // achromatic
  } else {
    const hue2rgb = (p: number, q: number, t: number) => {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1 / 6) return p + (q - p) * 6 * t;
      if (t < 1 / 2) return q;
      if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
      return p;
    };

    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    r = hue2rgb(p, q, h + 1 / 3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1 / 3);
  }

  return {
    r: Math.round(r * 255),
    g: Math.round(g * 255),
    b: Math.round(b * 255),
  };
}

// --- Components ---

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = React.useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Button
      variant="ghost"
      size="icon"
      className="h-8 w-8"
      onClick={handleCopy}
      title="Copy"
    >
      {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
    </Button>
  );
}

export default function DesignToolsPage() {
  // Color State
  const [color, setColor] = React.useState("#3b82f6");
  const [rgb, setRgb] = React.useState({ r: 59, g: 130, b: 246 });
  const [hsl, setHsl] = React.useState({ h: 217, s: 91, l: 60 });

  // Placeholder State
  const [width, setWidth] = React.useState(600);
  const [height, setHeight] = React.useState(400);
  const [bgColor, setBgColor] = React.useState("#e2e8f0");
  const [textColor, setTextColor] = React.useState("#475569");
  const [text, setText] = React.useState("Placeholder");

  // Extract State
  const [extractedColors, setExtractedColors] = React.useState<string[]>([]);
  const [imagePreview, setImagePreview] = React.useState<string | null>(null);
  const [isExtracting, setIsExtracting] = React.useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleHexChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setColor(val);
    const rgbVal = hexToRgb(val);
    if (rgbVal) {
      setRgb(rgbVal);
      setHsl(rgbToHsl(rgbVal.r, rgbVal.g, rgbVal.b));
    }
  };

  const handleRgbChange = (key: 'r' | 'g' | 'b', val: number) => {
    const newRgb = { ...rgb, [key]: val };
    setRgb(newRgb);
    setColor(rgbToHex(newRgb.r, newRgb.g, newRgb.b));
    setHsl(rgbToHsl(newRgb.r, newRgb.g, newRgb.b));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const result = event.target?.result as string;
        setImagePreview(result);
        extractColors(result);
      };
      reader.readAsDataURL(file);
    }
  };

  const extractColors = (imageSrc: string) => {
    setIsExtracting(true);
    const img = new Image();
    img.src = imageSrc;
    img.crossOrigin = "Anonymous";
    img.onload = () => {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      // Resize for faster processing
      const MAX_SIZE = 100; 
      const scale = Math.min(MAX_SIZE / img.width, MAX_SIZE / img.height);
      canvas.width = img.width * scale;
      canvas.height = img.height * scale;

      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
      
      const colorMap = new Map<string, number>();
      
      // Simple quantization
      for (let i = 0; i < imageData.length; i += 4) {
         if (imageData[i + 3] < 128) continue; // Skip transparent
         
         // Round to nearest 10 to group similar colors
         const r = Math.round(imageData[i] / 10) * 10;
         const g = Math.round(imageData[i + 1] / 10) * 10;
         const b = Math.round(imageData[i + 2] / 10) * 10;
         
         const key = `${r},${g},${b}`;
         colorMap.set(key, (colorMap.get(key) || 0) + 1);
      }

      const sortedColors = Array.from(colorMap.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 8)
        .map(([key]) => {
            const [r, g, b] = key.split(',').map(Number);
            return rgbToHex(r, g, b);
        });

      setExtractedColors(sortedColors);
      setIsExtracting(false);
    };
  };

  return (
    <ToolLayout
      title="Design Tools"
      description="Collection of useful tools for designers and frontend developers."
    >
      <Tabs defaultValue="color" className="w-full">
        <TabsList className="grid w-full grid-cols-3 lg:w-[600px]">
          <TabsTrigger value="color" className="flex items-center gap-2">
            <Palette className="h-4 w-4" />
            Color Picker
          </TabsTrigger>
          <TabsTrigger value="image" className="flex items-center gap-2">
            <ImageIcon className="h-4 w-4" />
            Placeholder
          </TabsTrigger>
          <TabsTrigger value="extract" className="flex items-center gap-2">
            <Droplet className="h-4 w-4" />
            Extractor
          </TabsTrigger>
        </TabsList>

        {/* Color Tools Tab */}
        <TabsContent value="color" className="space-y-6 mt-6">
          <div className="grid md:grid-cols-2 gap-8">
            {/* Picker & Preview */}
            <div className="space-y-6">
              <div className="space-y-2">
                <Label>Color Picker</Label>
                <div className="flex gap-4 items-center">
                  <div
                    className="w-24 h-24 rounded-lg border shadow-sm shrink-0 transition-colors"
                    style={{ backgroundColor: color }}
                  />
                  <div className="space-y-3 flex-1">
                    <div className="flex gap-2">
                      <Input
                        type="color"
                        value={color}
                        onChange={handleHexChange}
                        className="w-12 h-10 p-1 cursor-pointer"
                      />
                      <Input
                        value={color}
                        onChange={handleHexChange}
                        className="font-mono uppercase"
                        maxLength={7}
                      />
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Pick a color or enter HEX code
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <Label>RGB Channels</Label>
                <div className="space-y-4">
                  {['r', 'g', 'b'].map((c) => (
                    <div key={c} className="flex items-center gap-4">
                      <span className="w-4 text-sm font-mono uppercase font-bold text-muted-foreground">{c}</span>
                      <Slider
                        value={[rgb[c as keyof typeof rgb]]}
                        max={255}
                        step={1}
                        onValueChange={(val) => handleRgbChange(c as keyof typeof rgb, val[0])}
                        className="flex-1"
                      />
                      <span className="w-8 text-sm font-mono text-right">{rgb[c as keyof typeof rgb]}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Conversions & Palette */}
            <div className="space-y-6">
              <div className="rounded-lg border bg-card text-card-foreground shadow-sm">
                <div className="p-6 pb-3 border-b">
                  <h3 className="font-semibold">Values</h3>
                </div>
                <div className="p-6 grid gap-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-muted-foreground">HEX</span>
                    <div className="flex items-center gap-2">
                      <code className="bg-muted px-2 py-1 rounded text-sm">{color}</code>
                      <CopyButton text={color} />
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-muted-foreground">RGB</span>
                    <div className="flex items-center gap-2">
                      <code className="bg-muted px-2 py-1 rounded text-sm">rgb({rgb.r}, {rgb.g}, {rgb.b})</code>
                      <CopyButton text={`rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`} />
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-muted-foreground">HSL</span>
                    <div className="flex items-center gap-2">
                      <code className="bg-muted px-2 py-1 rounded text-sm">hsl({hsl.h}, {hsl.s}%, {hsl.l}%)</code>
                      <CopyButton text={`hsl(${hsl.h}, ${hsl.s}%, ${hsl.l}%)`} />
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Shades Generator</Label>
                <div className="grid grid-cols-5 gap-2">
                  {[10, 30, 50, 70, 90].map((lightness) => {
                     const sRgb = hslToRgb(hsl.h, hsl.s, lightness);
                     const sHex = rgbToHex(sRgb.r, sRgb.g, sRgb.b);
                     return (
                       <div key={lightness} className="space-y-1 text-center group cursor-pointer" onClick={() => {
                           setColor(sHex);
                           setRgb(sRgb);
                           setHsl({ h: hsl.h, s: hsl.s, l: lightness });
                       }}>
                         <div 
                            className="w-full aspect-square rounded-md border shadow-sm group-hover:scale-105 transition-transform"
                            style={{ backgroundColor: sHex }}
                         />
                         <div className="text-[10px] font-mono text-muted-foreground">{sHex}</div>
                       </div>
                     )
                  })}
                </div>
              </div>
            </div>
          </div>
        </TabsContent>

        {/* Image Tools Tab */}
        <TabsContent value="image" className="space-y-6 mt-6">
          <div className="grid md:grid-cols-[300px_1fr] gap-8">
            {/* Controls */}
            <div className="space-y-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Dimensions (px)</Label>
                  <div className="flex gap-2">
                    <Input 
                      type="number" 
                      value={width} 
                      onChange={(e) => setWidth(Number(e.target.value))}
                      placeholder="Width"
                    />
                    <span className="py-2 text-muted-foreground">x</span>
                    <Input 
                      type="number" 
                      value={height} 
                      onChange={(e) => setHeight(Number(e.target.value))}
                      placeholder="Height"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Background Color</Label>
                  <div className="flex gap-2">
                    <Input 
                      type="color" 
                      value={bgColor} 
                      onChange={(e) => setBgColor(e.target.value)}
                      className="w-12 h-10 p-1 cursor-pointer"
                    />
                    <Input 
                      value={bgColor} 
                      onChange={(e) => setBgColor(e.target.value)}
                      className="uppercase"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Text Color</Label>
                  <div className="flex gap-2">
                    <Input 
                      type="color" 
                      value={textColor} 
                      onChange={(e) => setTextColor(e.target.value)}
                      className="w-12 h-10 p-1 cursor-pointer"
                    />
                    <Input 
                      value={textColor} 
                      onChange={(e) => setTextColor(e.target.value)}
                      className="uppercase"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Text</Label>
                  <Input 
                    value={text} 
                    onChange={(e) => setText(e.target.value)}
                    placeholder="Placeholder Text"
                  />
                </div>
              </div>
            </div>

            {/* Preview */}
            <div className="space-y-4">
              <div className="rounded-lg border bg-muted/20 p-8 flex items-center justify-center min-h-[400px] overflow-auto">
                 <div 
                    style={{ 
                        width: `${width}px`, 
                        height: `${height}px`,
                        backgroundColor: bgColor,
                        color: textColor,
                    }}
                    className="flex items-center justify-center font-medium text-xl shadow-lg transition-all"
                 >
                    {text} <br/>
                    <span className="text-sm opacity-75 ml-2">({width} x {height})</span>
                 </div>
              </div>
              <div className="flex justify-between items-center bg-muted p-3 rounded-md text-sm">
                 <div className="font-mono text-muted-foreground truncate max-w-[500px]">
                    https://via.placeholder.com/{width}x{height}/{bgColor.slice(1)}/{textColor.slice(1)}?text={encodeURIComponent(text)}
                 </div>
                 <Button variant="ghost" size="sm" onClick={() => {
                     // Note: Ideally we would generate a real image blob here, but for now we provide a link format often used or just the visual
                     // Actually, let's just copy the data URL logic or SVG if we wanted "real" export. 
                     // For a prototype, let's just imply it's a "Generator" and the user can screenshot or we could add canvas export later.
                     // But let's act as a URL generator for services like placeholder.com as a fallback feature? 
                     // Or better, let's implement a simple SVG download.
                 }}>
                    <Copy className="h-4 w-4 mr-2" /> URL
                 </Button>
              </div>
            </div>
          </div>
        </TabsContent>

        {/* Extract Tab */}
        <TabsContent value="extract" className="space-y-6 mt-6">
            <div className="grid md:grid-cols-2 gap-8">
                <div className="space-y-6">
                     <div className="border-2 border-dashed rounded-lg p-12 text-center hover:bg-muted/50 transition-colors cursor-pointer"
                          onClick={() => fileInputRef.current?.click()}>
                        <input 
                            type="file" 
                            accept="image/*" 
                            className="hidden" 
                            ref={fileInputRef}
                            onChange={handleFileChange}
                        />
                        <div className="flex flex-col items-center gap-2">
                             <Upload className="h-10 w-10 text-muted-foreground" />
                             <h3 className="font-semibold text-lg">Upload Image</h3>
                             <p className="text-sm text-muted-foreground">Click to upload (JPG, PNG)</p>
                        </div>
                     </div>

                     {imagePreview && (
                         <div className="rounded-lg border overflow-hidden bg-muted/20">
                             <img src={imagePreview} alt="Preview" className="w-full h-auto object-contain max-h-[400px]" />
                         </div>
                     )}
                </div>

                <div className="space-y-6">
                     <div className="flex items-center justify-between">
                         <Label className="text-base font-semibold">Extracted Palette</Label>
                         {isExtracting && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
                     </div>

                     {extractedColors.length > 0 ? (
                         <div className="grid gap-4">
                             {extractedColors.map((hex, i) => (
                                 <div key={i} className="flex items-center justify-between p-3 rounded-md border bg-card">
                                     <div className="flex items-center gap-3">
                                         <div 
                                            className="w-12 h-12 rounded-md shadow-sm border"
                                            style={{ backgroundColor: hex }}
                                         />
                                         <div>
                                             <div className="font-mono font-medium">{hex}</div>
                                             <div className="text-xs text-muted-foreground">
                                                 {(() => {
                                                     const r = parseInt(hex.slice(1,3), 16);
                                                     const g = parseInt(hex.slice(3,5), 16);
                                                     const b = parseInt(hex.slice(5,7), 16);
                                                     return `rgb(${r}, ${g}, ${b})`;
                                                 })()}
                                             </div>
                                         </div>
                                     </div>
                                     <Button 
                                        variant="ghost" 
                                        size="sm"
                                        onClick={() => {
                                            setColor(hex);
                                            const rgbVal = hexToRgb(hex);
                                            if (rgbVal) {
                                                setRgb(rgbVal);
                                                setHsl(rgbToHsl(rgbVal.r, rgbVal.g, rgbVal.b));
                                            }
                                        }}
                                     >
                                         Use
                                     </Button>
                                 </div>
                             ))}
                         </div>
                     ) : (
                         <div className="text-center p-12 text-muted-foreground bg-muted/20 rounded-lg border">
                             <Palette className="h-10 w-10 mx-auto mb-3 opacity-20" />
                             <p>Upload an image to extract dominant colors</p>
                         </div>
                     )}
                </div>
            </div>
        </TabsContent>
      </Tabs>
    </ToolLayout>
  );
}