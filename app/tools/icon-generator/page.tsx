"use client";

import * as React from "react";
import { ToolLayout } from "@/components/tool-layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Upload, Download, Image as ImageIcon } from "lucide-react";

const ICON_SIZES = [
  { size: 16, name: "favicon-16x16.png" },
  { size: 32, name: "favicon-32x32.png" },
  { size: 48, name: "icon-48x48.png" },
  { size: 64, name: "icon-64x64.png" },
  { size: 128, name: "icon-128x128.png" },
  { size: 192, name: "android-chrome-192x192.png" },
  { size: 256, name: "icon-256x256.png" },
  { size: 512, name: "android-chrome-512x512.png" },
];

export default function IconGeneratorPage() {
  const [image, setImage] = React.useState<string | null>(null);
  const [previewUrls, setPreviewUrls] = React.useState<Record<number, string>>({});
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const result = event.target?.result as string;
        setImage(result);
        generateIcons(result);
      };
      reader.readAsDataURL(file);
    }
  };

  const generateIcons = (src: string) => {
    const img = new Image();
    img.src = src;
    img.onload = () => {
      const urls: Record<number, string> = {};
      ICON_SIZES.forEach(({ size }) => {
        const canvas = document.createElement("canvas");
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.drawImage(img, 0, 0, size, size);
          urls[size] = canvas.toDataURL("image/png");
        }
      });
      setPreviewUrls(urls);
    };
  };

  const downloadIcon = (size: number, filename: string) => {
    const url = previewUrls[size];
    if (url) {
      const link = document.createElement("a");
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const downloadAll = () => {
    ICON_SIZES.forEach(({ size, name }) => {
        // Add slight delay to prevent browser blocking multiple downloads
        setTimeout(() => downloadIcon(size, name), 100); 
    });
  };

  return (
    <ToolLayout
      title="Icon Generator"
      description="Upload an image to generate favicons and app icons in various standard sizes."
    >
      <div className="grid gap-8 lg:grid-cols-[300px_1fr]">
        <div className="space-y-6">
          <div 
            className="border-2 border-dashed rounded-lg p-8 text-center hover:bg-muted/50 transition-colors cursor-pointer flex flex-col items-center justify-center gap-4 min-h-[200px]"
            onClick={() => fileInputRef.current?.click()}
          >
            <input 
                type="file" 
                accept="image/*" 
                className="hidden" 
                ref={fileInputRef}
                onChange={handleFileChange}
            />
            {image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={image} alt="Preview" className="max-w-full max-h-[150px] object-contain rounded-md shadow-sm" />
            ) : (
                <>
                    <Upload className="h-10 w-10 text-muted-foreground" />
                    <div className="text-sm text-muted-foreground">
                        Click to upload image<br/>(PNG, JPG, SVG)
                    </div>
                </>
            )}
          </div>
          
          {image && (
              <Button onClick={() => setImage(null)} variant="outline" className="w-full">
                  Clear
              </Button>
          )}
        </div>

        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold">Generated Icons</h3>
                {image && (
                    <Button onClick={downloadAll} size="sm">
                        <Download className="h-4 w-4 mr-2" /> Download All
                    </Button>
                )}
            </div>

            {image ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                    {ICON_SIZES.map(({ size, name }) => (
                        <Card key={size} className="overflow-hidden">
                            <CardContent className="p-4 flex flex-col items-center gap-3">
                                <div className="border border-border/50 bg-checkerboard rounded-md flex items-center justify-center w-full aspect-square">
                                    {previewUrls[size] ? (
                                        // eslint-disable-next-line @next/next/no-img-element
                                        <img src={previewUrls[size]} alt={name} className="max-w-full max-h-full object-contain" />
                                    ) : (
                                        <div className="animate-pulse bg-muted w-1/2 h-1/2 rounded" />
                                    )}
                                </div>
                                <div className="text-center w-full">
                                    <div className="text-xs font-mono mb-1 truncate" title={name}>{name}</div>
                                    <div className="text-[10px] text-muted-foreground">{size}x{size}</div>
                                </div>
                                <Button 
                                    variant="secondary" 
                                    size="sm" 
                                    className="w-full h-8 text-xs"
                                    onClick={() => downloadIcon(size, name)}
                                >
                                    <Download className="h-3 w-3 mr-1" /> Save
                                </Button>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            ) : (
                <div className="text-center py-12 text-muted-foreground border rounded-lg bg-muted/10">
                    <ImageIcon className="h-10 w-10 mx-auto mb-3 opacity-20" />
                    <p>Upload an image to see generated icons.</p>
                </div>
            )}
        </div>
      </div>
    </ToolLayout>
  );
}
