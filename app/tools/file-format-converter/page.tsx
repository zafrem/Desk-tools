"use client";

import * as React from "react";
import { ToolLayout } from "@/components/tool-layout";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Copy, Download, Upload, ArrowRight, FileText } from "lucide-react";
import {
  convertFormat,
  SAMPLE_DATA,
  FORMAT_INFO,
  type Format,
} from "@/lib/format-converters";

export default function FileFormatConverterPage() {
  const [fromFormat, setFromFormat] = React.useState<Format>("json");
  const [toFormat, setToFormat] = React.useState<Format>("yaml");
  const [input, setInput] = React.useState("");
  const [output, setOutput] = React.useState("");
  const [error, setError] = React.useState("");
  const [indent, setIndent] = React.useState(2);

  const handleConvert = () => {
    const result = convertFormat(input, fromFormat, toFormat, indent);

    if (result.success) {
      setOutput(result.output);
      setError("");
    } else {
      setOutput("");
      setError(result.error || "Conversion failed");
    }
  };

  const handleLoadSample = () => {
    setInput(SAMPLE_DATA[fromFormat]);
    setError("");
    setOutput("");
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      setInput(text);
      setError("");
      setOutput("");
    };
    reader.readAsText(file);
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(output);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  const handleDownload = () => {
    const blob = new Blob([output], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `converted${FORMAT_INFO[toFormat].ext}`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const formats: Format[] = ["json", "yaml", "csv", "tsv", "xml", "toml"];

  return (
    <ToolLayout
      title="File Format Converter"
      description="Freely convert between JSON, YAML, CSV, TSV, XML, and TOML formats"
    >
      <div className="space-y-6">
        {/* Format Selectors & Options */}
        <div className="flex items-center gap-4 flex-wrap">
          <Select value={fromFormat} onValueChange={(v) => setFromFormat(v as Format)}>
            <SelectTrigger className="w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {formats.map((format) => (
                <SelectItem key={format} value={format}>
                  {FORMAT_INFO[format].name} {FORMAT_INFO[format].ext}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <ArrowRight className="h-5 w-5 text-muted-foreground" />

          <Select value={toFormat} onValueChange={(v) => setToFormat(v as Format)}>
            <SelectTrigger className="w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {formats.map((format) => (
                <SelectItem key={format} value={format}>
                  {FORMAT_INFO[format].name} {FORMAT_INFO[format].ext}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <div className="h-6 w-px bg-border mx-2" />

          <Label className="text-sm">Conversion Options:</Label>
          <Select
            value={indent.toString()}
            onValueChange={(v) => setIndent(Number(v))}
          >
            <SelectTrigger className="w-[120px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="2">2 spaces</SelectItem>
              <SelectItem value="4">4 spaces</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Input Section */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="input">
              Input ({FORMAT_INFO[fromFormat].name})
            </Label>
            <div className="flex gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleLoadSample}
              >
                Sample Data
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => document.getElementById("file-upload")?.click()}
                className="gap-2"
              >
                <Upload className="h-4 w-4" />
                File
              </Button>
              <input
                id="file-upload"
                type="file"
                className="hidden"
                onChange={handleFileUpload}
                accept=".json,.yaml,.yml,.csv,.tsv,.xml,.toml"
              />
            </div>
          </div>
          <Textarea
            id="input"
            placeholder={`Enter ${FORMAT_INFO[fromFormat].name} data...`}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            rows={12}
            className="font-mono text-sm"
          />
        </div>

        {/* Convert Button */}
        <div className="flex justify-center">
          <Button
            onClick={handleConvert}
            disabled={!input}
            size="lg"
            className="gap-2"
          >
            <ArrowRight className="h-5 w-5" />
            Convert
          </Button>
        </div>

        {/* Error Message */}
        {error && (
          <div className="rounded-md bg-destructive/10 border border-destructive/20 p-3 text-sm text-destructive">
            {error}
          </div>
        )}

        {/* Output Section */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="output">
              Output ({FORMAT_INFO[toFormat].name})
            </Label>
            <div className="flex gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleCopy}
                disabled={!output}
                className="gap-2"
              >
                <Copy className="h-4 w-4" />
                Copy
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleDownload}
                disabled={!output}
                className="gap-2"
              >
                <Download className="h-4 w-4" />
                Download
              </Button>
            </div>
          </div>
          <Textarea
            id="output"
            value={output}
            readOnly
            rows={12}
            className="font-mono text-sm bg-muted"
            placeholder="Converted data will appear here..."
          />
        </div>

        {/* Format Information */}
        <div className="rounded-lg border bg-card">
          <div className="border-b bg-muted/50 px-4 py-3">
            <h3 className="font-semibold">Supported Formats</h3>
            <p className="text-sm text-muted-foreground">
              Characteristics and use cases for each format
            </p>
          </div>
          <div className="p-4 grid gap-4 md:grid-cols-2">
            {formats.map((format) => (
              <div key={format} className="space-y-1">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  <span className="font-semibold">
                    {FORMAT_INFO[format].name}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {FORMAT_INFO[format].ext}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground">
                  {FORMAT_INFO[format].description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </ToolLayout>
  );
}
