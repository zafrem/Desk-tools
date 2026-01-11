"use client";

import * as React from "react";
import dynamic from "next/dynamic";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Pen, Eraser, Download, Trash2, Undo, Redo, Square, Circle as CircleIcon } from "lucide-react";

// Dynamically import the canvas component to avoid SSR issues
const WhiteboardCanvas = dynamic(() => import("@/components/whiteboard-canvas"), { 
  ssr: false,
  loading: () => <div className="w-full h-full flex items-center justify-center bg-muted/10">Loading Canvas...</div>
});

interface LineData {
  tool: string;
  points: number[];
  color: string;
  size: number;
}

interface ShapeData {
  id: string;
  type: "rect" | "circle";
  x: number;
  y: number;
  width?: number;
  height?: number;
  radius?: number;
  color: string;
}

export default function WhiteboardPage() {
  const [tool, setTool] = React.useState<"pen" | "eraser" | "rect" | "circle">("pen");
  const [lines, setLines] = React.useState<LineData[]>([]);
  const [shapes, setShapes] = React.useState<ShapeData[]>([]);
  const [color, setColor] = React.useState("#000000");
  const [size, setSize] = React.useState(5);
  
  // History for Undo/Redo
  const [history, setHistory] = React.useState<{lines: LineData[], shapes: ShapeData[]}[]>([]);
  const [historyStep, setHistoryStep] = React.useState(-1);

  // References
  const stageRef = React.useRef<any>(null); // eslint-disable-line @typescript-eslint/no-explicit-any

  const onDrawStart = () => {
      // Logic for start if needed (e.g. tracking active state)
  };

  const onDrawEnd = () => {
    const newHistory = history.slice(0, historyStep + 1);
    newHistory.push({ lines: [...lines], shapes: [...shapes] });
    setHistory(newHistory);
    setHistoryStep(newHistory.length - 1);
  };

  const handleUndo = () => {
    if (historyStep > 0) {
      const prev = history[historyStep - 1];
      setLines(prev.lines);
      setShapes(prev.shapes);
      setHistoryStep(historyStep - 1);
    } else if (historyStep === 0) {
      setLines([]);
      setShapes([]);
      setHistoryStep(-1);
    }
  };

  const handleRedo = () => {
    if (historyStep < history.length - 1) {
      const next = history[historyStep + 1];
      setLines(next.lines);
      setShapes(next.shapes);
      setHistoryStep(historyStep + 1);
    }
  };

  const handleClear = () => {
    setLines([]);
    setShapes([]);
    onDrawEnd();
  };

  const handleDownload = () => {
    if (stageRef.current) {
        const uri = stageRef.current.toDataURL();
        const link = document.createElement("a");
        link.download = "whiteboard.png";
        link.href = uri;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
  };

  return (
    <div className="container mx-auto p-4 max-w-7xl h-[calc(100vh-4rem)] flex flex-col">
      <div className="mb-4 flex items-center justify-between">
        <div>
            <h1 className="text-2xl font-bold">Whiteboard</h1>
            <p className="text-muted-foreground text-sm">Draw, sketch, and visualize ideas.</p>
        </div>
        <div className="flex gap-2">
            <Button variant="outline" size="icon" onClick={handleUndo} disabled={historyStep < 0}>
                <Undo className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="icon" onClick={handleRedo} disabled={historyStep >= history.length - 1}>
                <Redo className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={handleClear}>
                <Trash2 className="h-4 w-4 mr-2" /> Clear
            </Button>
            <Button variant="outline" size="sm" onClick={handleDownload}>
                <Download className="h-4 w-4 mr-2" /> Export
            </Button>
        </div>
      </div>

      <div className="flex gap-4 flex-1 overflow-hidden">
        {/* Toolbar */}
        <Card className="p-2 flex flex-col gap-2 h-fit">
            <Button 
                variant={tool === "pen" ? "default" : "ghost"} 
                size="icon" 
                onClick={() => setTool("pen")}
                title="Pen"
            >
                <Pen className="h-4 w-4" />
            </Button>
            <Button 
                variant={tool === "eraser" ? "default" : "ghost"} 
                size="icon" 
                onClick={() => setTool("eraser")}
                title="Eraser"
            >
                <Eraser className="h-4 w-4" />
            </Button>
            <div className="h-px bg-border my-1" />
            <Button 
                variant={tool === "rect" ? "default" : "ghost"} 
                size="icon" 
                onClick={() => setTool("rect")}
                title="Rectangle"
            >
                <Square className="h-4 w-4" />
            </Button>
            <Button 
                variant={tool === "circle" ? "default" : "ghost"} 
                size="icon" 
                onClick={() => setTool("circle")}
                title="Circle"
            >
                <CircleIcon className="h-4 w-4" />
            </Button>
            
            <div className="h-px bg-border my-1" />
            
            <input 
                type="color" 
                value={color} 
                onChange={(e) => setColor(e.target.value)}
                className="w-9 h-9 p-1 rounded cursor-pointer border"
                title="Color"
            />
            
            <input 
                type="range" 
                min="1" 
                max="20" 
                value={size} 
                onChange={(e) => setSize(Number(e.target.value))}
                className="w-24 -rotate-90 mt-10 mb-10"
                title="Size"
            />
        </Card>

        {/* Canvas Area */}
        <div className="flex-1 bg-white rounded-lg border shadow-sm overflow-hidden touch-none relative">
            <WhiteboardCanvas 
                tool={tool}
                color={color}
                size={size}
                lines={lines}
                setLines={setLines}
                shapes={shapes}
                setShapes={setShapes}
                onDrawStart={onDrawStart}
                onDrawEnd={onDrawEnd}
                stageRef={stageRef}
            />
            
            <div className="absolute bottom-4 right-4 text-xs text-muted-foreground pointer-events-none select-none">
                Canvas Size: 1200x800
            </div>
        </div>
      </div>
    </div>
  );
}