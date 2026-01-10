/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import * as React from "react";
import { ToolLayout } from "@/components/tool-layout";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Upload, FileText, Download, X } from "lucide-react";
import { PDFDocument } from "pdf-lib";

export default function PdfToolsPage() {
  const [files, setFiles] = React.useState<File[]>([]);
  const [isProcessing, setIsProcessing] = React.useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFiles((prev) => [...prev, ...Array.from(e.target.files!)]);
    }
  };

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const mergePdfs = async () => {
    if (files.length < 2) return;
    setIsProcessing(true);
    try {
      const mergedPdf = await PDFDocument.create();
      
      for (const file of files) {
        const fileBuffer = await file.arrayBuffer();
        const pdf = await PDFDocument.load(fileBuffer);
        const copiedPages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
        copiedPages.forEach((page) => mergedPdf.addPage(page));
      }

      const pdfBytes = await mergedPdf.save();
      const blob = new Blob([pdfBytes as any], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "merged.pdf";
      link.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("PDF Merge failed:", err);
      alert("Failed to merge PDFs. Please ensure they are valid PDF files.");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <ToolLayout
      title="PDF Tools"
      description="Merge multiple PDF files into a single document entirely in your browser."
    >
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Upload Area */}
        <div className="border-2 border-dashed rounded-lg p-12 text-center hover:bg-muted/50 transition-colors">
            <input 
                id="file-upload"
                type="file" 
                accept=".pdf" 
                multiple
                className="hidden" 
                onChange={handleFileChange}
            />
            <Label htmlFor="file-upload" className="cursor-pointer flex flex-col items-center gap-2">
                <Upload className="h-10 w-10 text-muted-foreground" />
                <h3 className="font-semibold text-lg">Upload PDFs</h3>
                <p className="text-sm text-muted-foreground">Click to select files (Select multiple)</p>
            </Label>
        </div>

        {/* File List */}
        {files.length > 0 && (
            <div className="space-y-4">
                <div className="flex justify-between items-center">
                    <h3 className="font-semibold">Selected Files ({files.length})</h3>
                    <Button onClick={() => setFiles([])} variant="ghost" size="sm" className="text-destructive">
                        Clear All
                    </Button>
                </div>
                <div className="grid gap-2">
                    {files.map((file, idx) => (
                        <Card key={idx}>
                            <CardContent className="p-3 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <FileText className="h-5 w-5 text-red-500" />
                                    <span className="text-sm font-medium truncate max-w-[300px]">{file.name}</span>
                                    <span className="text-xs text-muted-foreground">
                                        {(file.size / 1024 / 1024).toFixed(2)} MB
                                    </span>
                                </div>
                                <Button size="icon" variant="ghost" onClick={() => removeFile(idx)}>
                                    <X className="h-4 w-4" />
                                </Button>
                            </CardContent>
                        </Card>
                    ))}
                </div>

                <div className="flex justify-end pt-4">
                    <Button onClick={mergePdfs} disabled={files.length < 2 || isProcessing} size="lg">
                        {isProcessing ? "Merging..." : "Merge PDFs"}
                        {!isProcessing && <Download className="ml-2 h-4 w-4" />}
                    </Button>
                </div>
            </div>
        )}
        
        {files.length === 0 && (
            <div className="text-center text-sm text-muted-foreground mt-8">
                Add at least 2 PDF files to merge them.
            </div>
        )}
      </div>
    </ToolLayout>
  );
}
