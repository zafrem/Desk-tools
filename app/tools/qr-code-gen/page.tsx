"use client";

import * as React from "react";
import { ToolLayout } from "@/components/tool-layout";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Card, CardContent } from "@/components/ui/card";
import { Download } from "lucide-react";
import { QRCodeCanvas } from "qrcode.react";

export default function QrCodeGenPage() {
  const [value, setValue] = React.useState("https://example.com");
  const [size, setSize] = React.useState(256);
  const [fgColor, setFgColor] = React.useState("#000000");
  const [bgColor, setBgColor] = React.useState("#ffffff");

  const downloadQr = () => {
    const canvas = document.getElementById("qr-canvas") as HTMLCanvasElement;
    if (canvas) {
      const pngUrl = canvas.toDataURL("image/png").replace("image/png", "image/octet-stream");
      const downloadLink = document.createElement("a");
      downloadLink.href = pngUrl;
      downloadLink.download = "qrcode.png";
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);
    }
  };

  return (
    <ToolLayout
      title="QR Code Generator"
      description="Create custom QR codes for links, text, and more."
    >
      <div className="grid gap-8 lg:grid-cols-[350px_1fr]">
        <div className="space-y-6">
          <Card>
            <CardContent className="p-6 space-y-4">
              <div className="space-y-2">
                <Label>Content</Label>
                <Input value={value} onChange={(e) => setValue(e.target.value)} placeholder="Enter URL or text" />
              </div>

              <div className="space-y-2">
                <Label>Size (px): {size}</Label>
                <Slider value={[size]} min={128} max={512} step={8} onValueChange={(v) => setSize(v[0])} />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label>Foreground</Label>
                    <div className="flex gap-2">
                        <Input type="color" value={fgColor} onChange={(e) => setFgColor(e.target.value)} className="w-10 p-1" />
                        <Input value={fgColor} onChange={(e) => setFgColor(e.target.value)} className="font-mono" />
                    </div>
                </div>
                <div className="space-y-2">
                    <Label>Background</Label>
                    <div className="flex gap-2">
                        <Input type="color" value={bgColor} onChange={(e) => setBgColor(e.target.value)} className="w-10 p-1" />
                        <Input value={bgColor} onChange={(e) => setBgColor(e.target.value)} className="font-mono" />
                    </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="flex flex-col items-center justify-center space-y-6">
            <Card className="bg-white p-8 inline-block shadow-sm">
                <QRCodeCanvas 
                    id="qr-canvas"
                    value={value} 
                    size={size} 
                    fgColor={fgColor} 
                    bgColor={bgColor} 
                    level={"H"}
                    includeMargin={true}
                />
            </Card>
            <Button onClick={downloadQr} size="lg">
                <Download className="mr-2 h-4 w-4" /> Download PNG
            </Button>
        </div>
      </div>
    </ToolLayout>
  );
}
