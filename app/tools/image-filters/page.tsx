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
  RotateCcw,
  Undo,
} from "lucide-react";

interface FilterState {
  brightness: number;
  contrast: number;
  grayscale: number;
  sepia: number;
  saturate: number;
  hueRotate: number;
  invert: number;
  blur: number;
  opacity: number;
}

const DEFAULT_FILTERS: FilterState = {
  brightness: 100,
  contrast: 100,
  grayscale: 0,
  sepia: 0,
  saturate: 100,
  hueRotate: 0,
  invert: 0,
  blur: 0,
  opacity: 100,
};

export default function ImageFiltersPage() {
  const [image, setImage] = React.useState<string | null>(null);
  const [fileName, setFileName] = React.useState<string>("image");
  const [filters, setFilters] = React.useState<FilterState>(DEFAULT_FILTERS);
  const [isDragging, setIsDragging] = React.useState(false);
  
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const canvasRef = React.useRef<HTMLCanvasElement>(null);

  // Apply filters whenever they change
  React.useEffect(() => {
    if (image) {
      drawCanvas();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [image, filters]);

  const handleFile = (file: File) => {
    if (!file || !file.type.startsWith("image/")) return;

    const name = file.name.replace(/\.[^/.]+$/, "");
    setFileName(name);

    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      setImage(result);
      setFilters(DEFAULT_FILTERS); // Reset filters for new image
    };
    reader.readAsDataURL(file);
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

  const getFilterString = () => {
    return `brightness(${filters.brightness}%) contrast(${filters.contrast}%) grayscale(${filters.grayscale}%) sepia(${filters.sepia}%) saturate(${filters.saturate}%) hue-rotate(${filters.hueRotate}deg) invert(${filters.invert}%) blur(${filters.blur}px) opacity(${filters.opacity}%)`;
  };

  const drawCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas || !image) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const img = new Image();
    img.src = image;
    img.onload = () => {
      // Set canvas dimensions to match image
      canvas.width = img.width;
      canvas.height = img.height;

      // Apply filters
      ctx.filter = getFilterString();
      
      // Clear and draw
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0);
    };
  };

  const updateFilter = (key: keyof FilterState, value: number) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const resetFilters = () => {
    setFilters(DEFAULT_FILTERS);
  };

  const downloadImage = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const link = document.createElement("a");
    link.download = `${fileName}-filtered.png`;
    link.href = canvas.toDataURL("image/png");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const FilterControl = ({ 
    label, 
    filterKey, 
    min, 
    max, 
    step = 1,
    unit = "%"
  }: { 
    label: string; 
    filterKey: keyof FilterState; 
    min: number; 
    max: number; 
    step?: number;
    unit?: string;
  }) => (
    <div className="space-y-3">
      <div className="flex justify-between">
        <Label>{label}</Label>
        <span className="text-sm text-muted-foreground w-12 text-right">
          {filters[filterKey]}{unit}
        </span>
      </div>
      <div className="flex items-center gap-4">
        <Slider
          value={[filters[filterKey]]}
          onValueChange={(v) => updateFilter(filterKey, v[0])}
          min={min}
          max={max}
          step={step}
          className="flex-1"
        />
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 shrink-0"
          onClick={() => updateFilter(filterKey, DEFAULT_FILTERS[filterKey])}
          disabled={filters[filterKey] === DEFAULT_FILTERS[filterKey]}
          title="Reset this filter"
        >
          <Undo className="h-3 w-3" />
        </Button>
      </div>
    </div>
  );

  return (
    <ToolLayout
      title="Image Filters"
      description="Apply multiple filters to your images including brightness, contrast, grayscale, and more."
    >
      <div className="grid gap-8 lg:grid-cols-[350px_1fr]">
        {/* Controls Panel */}
        <div className="space-y-6 h-fit lg:sticky lg:top-20">
          {!image ? (
             <div
             className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors cursor-pointer flex flex-col items-center justify-center gap-3 min-h-[200px] ${
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
               accept="image/*"
               className="hidden"
               ref={fileInputRef}
               onChange={handleFileChange}
             />
             <Upload className="h-10 w-10 text-muted-foreground" />
             <div className="text-sm text-muted-foreground">
               {isDragging ? (
                 "Drop image here"
               ) : (
                 <>
                   Click or drag to upload
                   <br />
                   (JPG, PNG, WebP)
                 </>
               )}
             </div>
           </div>
          ) : (
            <div className="space-y-6">
               <div className="flex gap-2">
                 <Button onClick={() => fileInputRef.current?.click()} variant="outline" className="flex-1">
                    <Upload className="mr-2 h-4 w-4" /> Change Image
                 </Button>
                 <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                  />
                  <Button onClick={resetFilters} variant="outline" size="icon" title="Reset all filters">
                    <RotateCcw className="h-4 w-4" />
                  </Button>
               </div>

               <div className="space-y-6 pr-2 max-h-[calc(100vh-300px)] overflow-y-auto">
                  <FilterControl label="Brightness" filterKey="brightness" min={0} max={200} />
                  <FilterControl label="Contrast" filterKey="contrast" min={0} max={200} />
                  <FilterControl label="Saturation" filterKey="saturate" min={0} max={200} />
                  <FilterControl label="Grayscale" filterKey="grayscale" min={0} max={100} />
                  <FilterControl label="Sepia" filterKey="sepia" min={0} max={100} />
                  <FilterControl label="Hue Rotate" filterKey="hueRotate" min={0} max={360} unit="deg" />
                  <FilterControl label="Invert" filterKey="invert" min={0} max={100} />
                  <FilterControl label="Blur" filterKey="blur" min={0} max={20} step={0.5} unit="px" />
                  <FilterControl label="Opacity" filterKey="opacity" min={0} max={100} />
               </div>

               <Button onClick={downloadImage} className="w-full">
                 <Download className="mr-2 h-4 w-4" /> Download Result
               </Button>
            </div>
          )}
        </div>

        {/* Preview Panel */}
        <div className="space-y-6">
           <Card className="overflow-hidden">
             <CardContent className="p-0 min-h-[500px] flex items-center justify-center bg-muted/30 relative">
               {!image ? (
                  <div className="text-center text-muted-foreground p-8">
                    <ImageIcon className="h-16 w-16 mx-auto mb-4 opacity-20" />
                    <p className="text-lg">Upload an image to start editing</p>
                  </div>
               ) : (
                 <div className="relative max-w-full overflow-auto p-4 flex justify-center">
                    <canvas 
                      ref={canvasRef}
                      className="max-w-full max-h-[80vh] h-auto object-contain shadow-md"
                    />
                 </div>
               )}
             </CardContent>
           </Card>
        </div>
      </div>
    </ToolLayout>
  );
}
