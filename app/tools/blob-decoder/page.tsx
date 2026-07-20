"use client";

import * as React from "react";
import { ToolLayout } from "@/components/tool-layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Upload, FileText, Code, File } from "lucide-react";
import { detectFileType } from "@/lib/file-utils";

export default function BlobDecoderPage() {
  const [fileInfo, setFileInfo] = React.useState<{ ext: string; mime: string; isText: boolean } | null>(null);
  const [content, setContent] = React.useState<string>("");
  const [decodeMethod, setDecodeMethod] = React.useState<"text" | "base64" | "dataurl">("text");

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const info = await detectFileType(file);
    setFileInfo(info);

    if (decodeMethod === "text") {
      const text = await file.text();
      setContent(text);
    } else if (decodeMethod === "base64") {
      const reader = new FileReader();
      reader.onload = (event) => {
        const base64 = (event.target?.result as string).split(",")[1];
        setContent(base64);
      };
      reader.readAsDataURL(file);
    } else if (decodeMethod === "dataurl") {
      const reader = new FileReader();
      reader.onload = (event) => {
        setContent(event.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <ToolLayout title="Blob Decoder" description="Upload a file to identify its type and decode its content.">
      <div className="space-y-6">
        <div className="grid md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Select Decoding Method</Label>
            <div className="flex gap-2">
              <Button variant={decodeMethod === "text" ? "default" : "outline"} onClick={() => setDecodeMethod("text")}>Text</Button>
              <Button variant={decodeMethod === "base64" ? "default" : "outline"} onClick={() => setDecodeMethod("base64")}>Base64</Button>
              <Button variant={decodeMethod === "dataurl" ? "default" : "outline"} onClick={() => setDecodeMethod("dataurl")}>Data URL</Button>
            </div>
          </div>
          <div className="space-y-2">
            <Label>Upload File</Label>
            <div className="relative">
                <input type="file" onChange={handleFileUpload} className="w-full p-2 border rounded-md" />
            </div>
          </div>
        </div>

        {fileInfo && (
          <div className="p-4 bg-muted/50 rounded-lg border">
            <h3 className="font-semibold">Detected File Type</h3>
            <p className="text-sm">Extension: {fileInfo.ext}</p>
            <p className="text-sm">MIME: {fileInfo.mime}</p>
          </div>
        )}

        <div className="space-y-2">
          <Label>Decoded Content</Label>
          <Card className="min-h-[300px] bg-muted/30">
            <CardContent className="p-4 font-mono whitespace-pre-wrap break-all text-sm">
              {content || "Upload a file to see decoded content..."}
            </CardContent>
          </Card>
        </div>
      </div>
    </ToolLayout>
  );
}
