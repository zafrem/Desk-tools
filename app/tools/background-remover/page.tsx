"use client";

import * as React from "react";
import { ToolLayout } from "@/components/tool-layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import {
  Upload,
  Download,
  Image as ImageIcon,
  Pipette,
  Loader2,
} from "lucide-react";
import {
  removeBackgroundColor,
  hexToRgb,
  rgbToHex,
  getPixelColor,
  parseGifFrames,
  frameToImageData,
  RGB,
} from "@/lib/background-remover";
import GIF from "gif.js";

export default function BackgroundRemoverPage() {
  const [originalImage, setOriginalImage] = React.useState<string | null>(null);
  const [processedImage, setProcessedImage] = React.useState<string | null>(null);
  const [isGif, setIsGif] = React.useState(false);
  const [gifArrayBuffer, setGifArrayBuffer] = React.useState<ArrayBuffer | null>(null);
  const [targetColor, setTargetColor] = React.useState<string>("#ffffff");
  const [tolerance, setTolerance] = React.useState<number>(10);
  const [isProcessing, setIsProcessing] = React.useState(false);
  const [eyedropperActive, setEyedropperActive] = React.useState(false);
  const [fileName, setFileName] = React.useState<string>("image");
  const [isDragging, setIsDragging] = React.useState(false);

  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const originalCanvasRef = React.useRef<HTMLCanvasElement>(null);

  const handleFile = (file: File) => {
    if (!file || !file.type.startsWith("image/")) return;

    const name = file.name.replace(/\.[^/.]+$/, "");
    setFileName(name);

    const isGifFile = file.type === "image/gif";
    setIsGif(isGifFile);

    if (isGifFile) {
      // For GIF, read as ArrayBuffer
      const reader = new FileReader();
      reader.onload = (event) => {
        const buffer = event.target?.result as ArrayBuffer;
        setGifArrayBuffer(buffer);

        // Also create a preview URL
        const blob = new Blob([buffer], { type: "image/gif" });
        const url = URL.createObjectURL(blob);
        setOriginalImage(url);
        setProcessedImage(null);
      };
      reader.readAsArrayBuffer(file);
    } else {
      // For PNG/JPG, read as data URL
      const reader = new FileReader();
      reader.onload = (event) => {
        const result = event.target?.result as string;
        setOriginalImage(result);
        setProcessedImage(null);
        setGifArrayBuffer(null);
        drawOriginalImage(result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.currentTarget.contains(e.relatedTarget as Node)) return;
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  };

  const drawOriginalImage = (src: string) => {
    const img = new Image();
    img.src = src;
    img.onload = () => {
      const canvas = originalCanvasRef.current;
      if (!canvas) return;

      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.drawImage(img, 0, 0);
      }
    };
  };

  const processImage = async () => {
    if (!originalImage) return;

    setIsProcessing(true);
    const rgb = hexToRgb(targetColor);

    try {
      if (isGif && gifArrayBuffer) {
        await processGif(rgb);
      } else {
        await processPng(rgb);
      }
    } catch (error) {
      console.error("Error processing image:", error);
    } finally {
      setIsProcessing(false);
    }
  };

  const processPng = async (rgb: RGB) => {
    const canvas = originalCanvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Get image data from original canvas
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

    // Create a copy of image data to process
    const processedData = new ImageData(
      new Uint8ClampedArray(imageData.data),
      imageData.width,
      imageData.height
    );

    // Process the image
    removeBackgroundColor(processedData, rgb, tolerance);

    // Draw to a new canvas and export
    const processedCanvas = document.createElement("canvas");
    processedCanvas.width = canvas.width;
    processedCanvas.height = canvas.height;
    const processedCtx = processedCanvas.getContext("2d");
    if (processedCtx) {
      processedCtx.putImageData(processedData, 0, 0);
      setProcessedImage(processedCanvas.toDataURL("image/png"));
    }
  };

  const processGif = async (rgb: RGB) => {
    if (!gifArrayBuffer) return;

    const { frames, width, height } = await parseGifFrames(gifArrayBuffer);

    // Create GIF encoder
    const gif = new GIF({
      workers: 2,
      quality: 10,
      width,
      height,
      workerScript: "/gif.worker.js",
      transparent: 0x00000000,
    });

    // Process each frame
    let previousImageData: ImageData | undefined;

    for (const frame of frames) {
      const frameImageData = frameToImageData(frame, width, height, previousImageData);

      // Store for next frame if disposal method requires it
      if (frame.disposalType === 1 || frame.disposalType === 0) {
        previousImageData = frameImageData;
      } else if (frame.disposalType === 2) {
        previousImageData = undefined;
      }

      // Remove background color
      const processedData = removeBackgroundColor(
        new ImageData(
          new Uint8ClampedArray(frameImageData.data),
          frameImageData.width,
          frameImageData.height
        ),
        rgb,
        tolerance
      );

      // Create canvas for this frame
      const frameCanvas = document.createElement("canvas");
      frameCanvas.width = width;
      frameCanvas.height = height;
      const frameCtx = frameCanvas.getContext("2d");
      if (frameCtx) {
        frameCtx.putImageData(processedData, 0, 0);
        gif.addFrame(frameCanvas, { delay: frame.delay * 10, copy: true });
      }
    }

    // Render GIF
    gif.on("finished", (blob: Blob) => {
      const url = URL.createObjectURL(blob);
      setProcessedImage(url);
    });

    gif.render();
  };

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!eyedropperActive) return;

    const canvas = originalCanvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const x = Math.floor((e.clientX - rect.left) * scaleX);
    const y = Math.floor((e.clientY - rect.top) * scaleY);

    const color = getPixelColor(canvas, x, y);
    setTargetColor(rgbToHex(color));
    setEyedropperActive(false);
  };

  const downloadResult = () => {
    if (!processedImage) return;

    const link = document.createElement("a");
    link.href = processedImage;
    link.download = `${fileName}-transparent.${isGif ? "gif" : "png"}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const clearAll = () => {
    setOriginalImage(null);
    setProcessedImage(null);
    setGifArrayBuffer(null);
    setIsGif(false);
    setFileName("image");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <ToolLayout
      title="Background Remover"
      description="Remove backgrounds from PNG and GIF images by selecting a color to make transparent."
    >
      <div className="grid gap-8 lg:grid-cols-[320px_1fr]">
        {/* Left Panel - Controls */}
        <div className="space-y-6">
          {/* File Upload */}
          <div
            className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors cursor-pointer flex flex-col items-center justify-center gap-3 min-h-[160px] ${
              isDragging
                ? "border-primary bg-primary/10"
                : "hover:bg-muted/50"
            }`}
            onClick={() => fileInputRef.current?.click()}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                fileInputRef.current?.click();
              }
            }}
            role="button"
            tabIndex={0}
            onDragOver={handleDragOver}
            onDragEnter={handleDragEnter}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <input
              type="file"
              accept="image/png,image/gif,image/jpeg"
              className="hidden"
              ref={fileInputRef}
              onChange={handleFileChange}
            />
            {originalImage ? (
              <div className="text-sm text-muted-foreground">
                <p className="font-medium text-foreground mb-1">
                  {fileName}.{isGif ? "gif" : "png"}
                </p>
                <p>Click or drag to change file</p>
              </div>
            ) : (
              <>
                <Upload className="h-8 w-8 text-muted-foreground" />
                <div className="text-sm text-muted-foreground">
                  {isDragging ? (
                    "Drop image here"
                  ) : (
                    <>
                      Click or drag to upload
                      <br />
                      (PNG, GIF, JPG)
                    </>
                  )}
                </div>
              </>
            )}
          </div>

          {originalImage && (
            <>
              {/* Color Picker */}
              <div className="space-y-3">
                <Label>Background Color to Remove</Label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <input
                      type="color"
                      value={targetColor}
                      onChange={(e) => setTargetColor(e.target.value)}
                      className="w-full h-10 rounded-md border cursor-pointer"
                    />
                  </div>
                  <Button
                    variant={eyedropperActive ? "default" : "outline"}
                    size="icon"
                    onClick={() => setEyedropperActive(!eyedropperActive)}
                    title="Pick color from image"
                  >
                    <Pipette className="h-4 w-4" />
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  {eyedropperActive
                    ? "Click on the original image to pick a color"
                    : `Selected: ${targetColor}`}
                </p>
              </div>

              {/* Tolerance Slider */}
              <div className="space-y-3">
                <div className="flex justify-between">
                  <Label>Tolerance</Label>
                  <span className="text-sm text-muted-foreground">{tolerance}%</span>
                </div>
                <Slider
                  value={[tolerance]}
                  onValueChange={(v) => setTolerance(v[0])}
                  min={0}
                  max={100}
                  step={1}
                />
                <p className="text-xs text-muted-foreground">
                  Higher values remove more similar colors
                </p>
              </div>

              {/* Action Buttons */}
              <div className="space-y-2">
                <Button
                  onClick={processImage}
                  className="w-full"
                  disabled={isProcessing}
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    "Remove Background"
                  )}
                </Button>

                {processedImage && (
                  <Button onClick={downloadResult} variant="secondary" className="w-full">
                    <Download className="h-4 w-4 mr-2" />
                    Download {isGif ? "GIF" : "PNG"}
                  </Button>
                )}

                <Button onClick={clearAll} variant="outline" className="w-full">
                  Clear
                </Button>
              </div>
            </>
          )}
        </div>

        {/* Right Panel - Preview */}
        <div className="space-y-6">
          {originalImage ? (
            <div className="grid gap-6 md:grid-cols-2">
              {/* Original Image */}
              <Card>
                <CardContent className="p-4">
                  <h3 className="text-sm font-medium mb-3">Original</h3>
                  <div
                    className={`border rounded-md overflow-hidden bg-muted/30 flex items-center justify-center min-h-[200px] ${
                      eyedropperActive ? "cursor-crosshair" : ""
                    }`}
                  >
                    {isGif ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={originalImage}
                        alt="Original"
                        className="max-w-full max-h-[400px] object-contain"
                      />
                    ) : (
                      <canvas
                        ref={originalCanvasRef}
                        onClick={handleCanvasClick}
                        className="max-w-full max-h-[400px] object-contain"
                        style={{ imageRendering: "pixelated" }}
                      />
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Processed Image */}
              <Card>
                <CardContent className="p-4">
                  <h3 className="text-sm font-medium mb-3">Result</h3>
                  <div className="border rounded-md overflow-hidden bg-checkerboard flex items-center justify-center min-h-[200px]">
                    {isProcessing ? (
                      <div className="flex flex-col items-center gap-2 text-muted-foreground">
                        <Loader2 className="h-8 w-8 animate-spin" />
                        <span className="text-sm">Processing{isGif ? " frames" : ""}...</span>
                      </div>
                    ) : processedImage ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={processedImage}
                        alt="Processed"
                        className="max-w-full max-h-[400px] object-contain"
                        style={{ imageRendering: "pixelated" }}
                      />
                    ) : (
                      <div className="text-sm text-muted-foreground p-4 text-center">
                        Click &quot;Remove Background&quot; to see the result
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : (
            <div className="text-center py-16 text-muted-foreground border rounded-lg bg-muted/10">
              <ImageIcon className="h-12 w-12 mx-auto mb-4 opacity-20" />
              <p className="text-lg mb-2">Upload an image to get started</p>
              <p className="text-sm">Supports PNG, GIF (animated), and JPG files</p>
            </div>
          )}
        </div>
      </div>

    </ToolLayout>
  );
}
