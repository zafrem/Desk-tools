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
import { Copy, Download, Upload, Wand2 } from "lucide-react";
import {
  formatCode,
  SAMPLE_CODE,
  LANGUAGE_INFO,
  type Language,
  type FormatOptions,
} from "@/lib/code-formatter";

export default function CodeFormatterPage() {
  const [language, setLanguage] = React.useState<Language>("javascript");
  const [input, setInput] = React.useState("");
  const [output, setOutput] = React.useState("");
  const [error, setError] = React.useState("");
  const [isFormatting, setIsFormatting] = React.useState(false);

  // Format options
  const [printWidth, setPrintWidth] = React.useState(80);
  const [tabWidth, setTabWidth] = React.useState(2);
  const [useTabs, setUseTabs] = React.useState(false);
  const [semi, setSemi] = React.useState(true);
  const [singleQuote, setSingleQuote] = React.useState(false);
  const [trailingComma, setTrailingComma] = React.useState<"none" | "es5" | "all">("es5");

  const handleFormat = async () => {
    setIsFormatting(true);
    setError("");

    const options: FormatOptions = {
      printWidth,
      tabWidth,
      useTabs,
      semi,
      singleQuote,
      trailingComma,
    };

    const result = await formatCode(input, language, options);

    if (result.success) {
      setOutput(result.formatted);
      setError("");
    } else {
      setOutput("");
      setError(result.error || "Formatting failed");
    }

    setIsFormatting(false);
  };

  const handleLoadSample = () => {
    setInput(SAMPLE_CODE[language]);
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
    link.download = `formatted${LANGUAGE_INFO[language].ext}`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const languages: Language[] = [
    "javascript",
    "typescript",
    "jsx",
    "tsx",
    "json",
    "html",
    "css",
    "scss",
    "less",
    "python",
    "markdown",
    "yaml",
    "graphql",
  ];

  return (
    <ToolLayout
      title="Code Formatter"
      description="Format and beautify code for multiple programming languages"
    >
      <div className="space-y-6">
        {/* Language & Options */}
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-2">
            <Label className="text-sm">Language:</Label>
            <Select value={language} onValueChange={(v) => setLanguage(v as Language)}>
              <SelectTrigger className="w-[180px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {languages.map((lang) => (
                  <SelectItem key={lang} value={lang}>
                    {LANGUAGE_INFO[lang].name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="h-6 w-px bg-border" />

          <div className="flex items-center gap-2">
            <Label className="text-sm">Width:</Label>
            <Select value={printWidth.toString()} onValueChange={(v) => setPrintWidth(Number(v))}>
              <SelectTrigger className="w-[100px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="80">80</SelectItem>
                <SelectItem value="100">100</SelectItem>
                <SelectItem value="120">120</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-2">
            <Label className="text-sm">Indent:</Label>
            <Select value={tabWidth.toString()} onValueChange={(v) => setTabWidth(Number(v))}>
              <SelectTrigger className="w-[100px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="2">2 spaces</SelectItem>
                <SelectItem value="4">4 spaces</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-2">
            <Label className="text-sm">Quotes:</Label>
            <Select value={singleQuote ? "single" : "double"} onValueChange={(v) => setSingleQuote(v === "single")}>
              <SelectTrigger className="w-[100px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="double">Double</SelectItem>
                <SelectItem value="single">Single</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-2">
            <Label className="text-sm">Semicolons:</Label>
            <Select value={semi ? "yes" : "no"} onValueChange={(v) => setSemi(v === "yes")}>
              <SelectTrigger className="w-[80px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="yes">Yes</SelectItem>
                <SelectItem value="no">No</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Input Section */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="input">
              Input ({LANGUAGE_INFO[language].name})
            </Label>
            <div className="flex gap-2">
              <Button variant="ghost" size="sm" onClick={handleLoadSample}>
                Sample Code
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
                accept=".js,.ts,.jsx,.tsx,.json,.html,.css,.scss,.less,.py,.md,.yaml,.yml,.graphql"
              />
            </div>
          </div>
          <Textarea
            id="input"
            placeholder={`Enter ${LANGUAGE_INFO[language].name} code...`}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            rows={14}
            className="font-mono text-sm"
          />
        </div>

        {/* Format Button */}
        <div className="flex justify-center">
          <Button
            onClick={handleFormat}
            disabled={!input || isFormatting}
            size="lg"
            className="gap-2"
          >
            <Wand2 className="h-5 w-5" />
            {isFormatting ? "Formatting..." : "Format Code"}
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
              Formatted Output
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
            rows={14}
            className="font-mono text-sm bg-muted"
            placeholder="Formatted code will appear here..."
          />
        </div>
      </div>
    </ToolLayout>
  );
}
