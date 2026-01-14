"use client";

import * as React from "react";
import { ToolLayout } from "@/components/tool-layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Download,
  Eraser,
  Grid3X3,
  PaintBucket,
  Pencil,
  Pipette,
  RotateCcw,
  Trash2,
} from "lucide-react";

type ToolType = "pencil" | "eraser" | "fill" | "picker";

const DEFAULT_SIZE = 16;
const PRESET_COLORS = [
  "#000000", "#ffffff", "#9ca3af", "#ef4444", "#f97316", "#f59e0b",
  "#84cc16", "#10b981", "#06b6d4", "#3b82f6", "#6366f1", "#8b5cf6",
  "#d946ef", "#f43f5e", "#78350f", "#1e293b"
];

export default function PixelArtEditorPage() {
  const [size, setSize] = React.useState(DEFAULT_SIZE);
  const [pixels, setPixels] = React.useState<string[]>(
    new Array(DEFAULT_SIZE * DEFAULT_SIZE).fill("")
  );
  const [selectedColor, setSelectedColor] = React.useState("#000000");
  const [activeTool, setActiveTool] = React.useState<ToolType>("pencil");
  const [isDrawing, setIsDrawing] = React.useState(false);
  const [showGrid, setShowGrid] = React.useState(true);

  // History for Undo
  const [history, setHistory] = React.useState<string[][]>([]);
  
  const addToHistory = (newPixels: string[]) => {
    setHistory((prev) => {
      const newHistory = [...prev, newPixels];
      if (newHistory.length > 20) newHistory.shift(); // Keep last 20
      return newHistory;
    });
  };

  const handleUndo = () => {
    if (history.length === 0) return;
    const previous = history[history.length - 1];
    setPixels(previous);
    setHistory((prev) => prev.slice(0, -1));
  };

  const handleReset = () => {
    addToHistory([...pixels]);
    setPixels(new Array(size * size).fill(""));
  };

  const handleSizeChange = (newSize: number) => {
    if (newSize === size) return;
    addToHistory([...pixels]);
    setSize(newSize);
    setPixels(new Array(newSize * newSize).fill(""));
  };

  const getPixelIndex = (x: number, y: number) => y * size + x;

  const paintPixel = (index: number, overrideTool?: ToolType) => {
    const tool = overrideTool || activeTool;
    
    if (tool === "picker") {
      const color = pixels[index];
      if (color) {
        setSelectedColor(color);
        setActiveTool("pencil");
      }
      return;
    }

    const newPixels = [...pixels];
    const color = tool === "eraser" ? "" : selectedColor;

    if (newPixels[index] === color) return; // No change

    if (tool === "fill") {
      const targetColor = newPixels[index];
      if (targetColor === color) return;

      const queue = [index];
      const visited = new Set([index]);
      
      while (queue.length > 0) {
        const curr = queue.shift()!;
        newPixels[curr] = color;

        const x = curr % size;
        const y = Math.floor(curr / size);

        const neighbors = [
          { x: x + 1, y },
          { x: x - 1, y },
          { x, y: y + 1 },
          { x, y: y - 1 },
        ];

        for (const n of neighbors) {
          if (n.x >= 0 && n.x < size && n.y >= 0 && n.y < size) {
            const nIdx = getPixelIndex(n.x, n.y);
            if (!visited.has(nIdx) && newPixels[nIdx] === targetColor) {
              visited.add(nIdx);
              queue.push(nIdx);
            }
          }
        }
      }
    } else {
      newPixels[index] = color;
    }

    setPixels(newPixels);
  };

  const handleMouseDown = (index: number) => {
    if (activeTool === "fill" || activeTool === "picker") {
      addToHistory([...pixels]); // Save state before fill
      paintPixel(index);
    } else {
      setIsDrawing(true);
      addToHistory([...pixels]); // Save state before stroke
      paintPixel(index);
    }
  };

  const handleMouseEnter = (index: number) => {
    if (isDrawing) {
      paintPixel(index);
    }
  };

  const handleMouseUp = () => {
    setIsDrawing(false);
  };

  const downloadImage = () => {
    const canvas = document.createElement("canvas");
    canvas.width = size * 10; // Export at higher res
    canvas.height = size * 10;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Draw transparent background
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height); // Optional: pure white bg? Or keep transparent?
    // Let's keep it transparent actually, but maybe user wants background? 
    // Usually icons are transparent. Let's clear it.
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    pixels.forEach((color, i) => {
      if (color) {
        const x = (i % size) * 10;
        const y = Math.floor(i / size) * 10;
        ctx.fillStyle = color;
        ctx.fillRect(x, y, 10, 10);
      }
    });

    const link = document.createElement("a");
    link.download = `pixel-art-${size}x${size}.png`;
    link.href = canvas.toDataURL("image/png");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <ToolLayout
      title="Pixel Art Editor"
      description="Create pixel art icons and sprites with this grid-based editor."
    >
      <div className="grid gap-8 lg:grid-cols-[300px_1fr]" onMouseUp={handleMouseUp} onMouseLeave={handleMouseUp}>
        {/* Controls */}
        <div className="space-y-6">
          {/* Tools */}
          <Card>
            <CardContent className="p-4 space-y-4">
              <Label>Tools</Label>
              <div className="grid grid-cols-4 gap-2">
                <Button
                  variant={activeTool === "pencil" ? "default" : "outline"}
                  size="icon"
                  onClick={() => setActiveTool("pencil")}
                  title="Pencil"
                >
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button
                  variant={activeTool === "eraser" ? "default" : "outline"}
                  size="icon"
                  onClick={() => setActiveTool("eraser")}
                  title="Eraser"
                >
                  <Eraser className="h-4 w-4" />
                </Button>
                <Button
                  variant={activeTool === "fill" ? "default" : "outline"}
                  size="icon"
                  onClick={() => setActiveTool("fill")}
                  title="Fill Bucket"
                >
                  <PaintBucket className="h-4 w-4" />
                </Button>
                <Button
                  variant={activeTool === "picker" ? "default" : "outline"}
                  size="icon"
                  onClick={() => setActiveTool("picker")}
                  title="Color Picker"
                >
                  <Pipette className="h-4 w-4" />
                </Button>
              </div>

              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={handleUndo} disabled={history.length === 0} className="flex-1">
                  <RotateCcw className="h-3 w-3 mr-2" /> Undo
                </Button>
                <Button variant="destructive" size="sm" onClick={handleReset} className="flex-1">
                  <Trash2 className="h-3 w-3 mr-2" /> Clear
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Color Palette */}
          <Card>
            <CardContent className="p-4 space-y-4">
              <Label>Color</Label>
              <div className="flex gap-2">
                <div 
                    className="w-10 h-10 rounded border shadow-sm"
                    style={{ backgroundColor: selectedColor }} 
                />
                <Input
                  type="color"
                  value={selectedColor}
                  onChange={(e) => setSelectedColor(e.target.value)}
                  className="flex-1 h-10 cursor-pointer"
                />
              </div>
              <div className="grid grid-cols-8 gap-2">
                {PRESET_COLORS.map((c) => (
                  <button
                    key={c}
                    className={`w-6 h-6 rounded border shadow-sm transition-transform hover:scale-110 ${
                      selectedColor === c ? "ring-2 ring-primary" : ""
                    }`}
                    style={{ backgroundColor: c }}
                    onClick={() => setSelectedColor(c)}
                  />
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Grid Settings */}
          <Card>
            <CardContent className="p-4 space-y-4">
              <Label>Grid Size: {size}x{size}</Label>
              <div className="flex gap-2">
                  {[16, 24, 32, 48, 64].map(s => (
                      <Button 
                        key={s} 
                        variant={size === s ? "default" : "outline"}
                        size="sm"
                        className="flex-1 px-0"
                        onClick={() => handleSizeChange(s)}
                      >
                          {s}
                      </Button>
                  ))}
              </div>
              <div className="flex items-center space-x-2 pt-2">
                 <Button 
                    variant={showGrid ? "secondary" : "ghost"}
                    size="sm"
                    onClick={() => setShowGrid(!showGrid)}
                    className="w-full"
                 >
                     <Grid3X3 className="h-4 w-4 mr-2" /> Toggle Grid
                 </Button>
              </div>
            </CardContent>
          </Card>
          
          <Button className="w-full" onClick={downloadImage}>
             <Download className="mr-2 h-4 w-4" /> Export PNG
          </Button>
        </div>

        {/* Canvas Area */}
        <div className="flex items-start justify-center overflow-auto p-4 bg-muted/20 rounded-lg min-h-[500px]">
          <div 
            className="bg-white shadow-xl select-none"
            style={{
                display: 'grid',
                gridTemplateColumns: `repeat(${size}, 1fr)`,
                width: 'min(600px, 100%)',
                aspectRatio: '1/1',
                backgroundImage: 'linear-gradient(45deg, #ccc 25%, transparent 25%), linear-gradient(-45deg, #ccc 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #ccc 75%), linear-gradient(-45deg, transparent 75%, #ccc 75%)',
                backgroundSize: '20px 20px',
                backgroundPosition: '0 0, 0 10px, 10px -10px, -10px 0px'
            }}
          >
            {pixels.map((color, i) => (
              <div
                key={i}
                onMouseDown={() => handleMouseDown(i)}
                onMouseEnter={() => handleMouseEnter(i)}
                className={`
                    cursor-crosshair
                    ${showGrid ? 'border-[0.5px] border-black/5' : ''}
                `}
                style={{ backgroundColor: color || 'transparent' }}
              />
            ))}
          </div>
        </div>
      </div>
    </ToolLayout>
  );
}
