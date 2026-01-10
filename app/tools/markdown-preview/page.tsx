"use client";

import * as React from "react";
import { ToolLayout } from "@/components/tool-layout";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Copy, FileText, Columns, Eye, Download } from "lucide-react";
import { marked } from "marked";

const DEFAULT_MARKDOWN = `# Markdown Preview\n\nThis is a real-time **Markdown** preview tool.\n\n## Features\n- **Bold** and *Italic* text\n- Lists (ordered and unordered)\n- [Links](https://google.com)\n- Code blocks\n- Blockquotes\n- Images\n\n\
function helloWorld() {\n  console.log(\"Hello, Markdown!\");\n}\n\
\n> \"Markdown is a lightweight markup language with plain-text-formatting syntax.\"\n\n---\n\nTry editing the text on the left!\n`;

export default function MarkdownPreviewPage() {
  const [markdown, setMarkdown] = React.useState(DEFAULT_MARKDOWN);
  const [html, setHtml] = React.useState("");
  const [viewMode, setMode] = React.useState<"split" | "editor" | "preview">("split");

  React.useEffect(() => {
    const renderMarkdown = async () => {
      const rendered = await marked.parse(markdown);
      setHtml(rendered);
    };
    renderMarkdown();
  }, [markdown]);

  const handleCopyHtml = async () => {
    try {
      await navigator.clipboard.writeText(html);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  const handleDownload = () => {
    const blob = new Blob([markdown], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "document.md";
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <ToolLayout
      title="Markdown Preview"
      description="Write Markdown and see the rendered result in real-time."
    >
      <div className="space-y-4">
        {/* Controls */}
        <div className="flex items-center justify-between bg-muted/50 p-2 rounded-lg border">
          <div className="flex gap-1">
            <Button
              variant={viewMode === "split" ? "default" : "ghost"}
              size="sm"
              onClick={() => setMode("split")}
              className="gap-2"
            >
              <Columns className="h-4 w-4" />
              <span className="hidden sm:inline">Split</span>
            </Button>
            <Button
              variant={viewMode === "editor" ? "default" : "ghost"}
              size="sm"
              onClick={() => setMode("editor")}
              className="gap-2"
            >
              <FileText className="h-4 w-4" />
              <span className="hidden sm:inline">Editor</span>
            </Button>
            <Button
              variant={viewMode === "preview" ? "default" : "ghost"}
              size="sm"
              onClick={() => setMode("preview")}
              className="gap-2"
            >
              <Eye className="h-4 w-4" />
              <span className="hidden sm:inline">Preview</span>
            </Button>
          </div>

          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handleCopyHtml} title="Copy HTML">
              <Copy className="h-4 w-4 mr-2" />
              Copy HTML
            </Button>
            <Button variant="outline" size="sm" onClick={handleDownload} title="Download Markdown">
              <Download className="h-4 w-4 mr-2" />
              Download
            </Button>
          </div>
        </div>

        {/* Editor & Preview Area */}
        <div className={`grid gap-4 ${viewMode === "split" ? "md:grid-cols-2" : "grid-cols-1"}`}>
          {/* Editor */}
          {(viewMode === "split" || viewMode === "editor") && (
            <div className="flex flex-col space-y-2">
              <Label htmlFor="markdown-editor" className="flex items-center gap-2">
                <FileText className="h-4 w-4" /> Markdown Editor
              </Label>
              <Textarea
                id="markdown-editor"
                value={markdown}
                onChange={(e) => setMarkdown(e.target.value)}
                placeholder="Enter markdown here..."
                className="flex-1 min-h-[500px] font-mono text-sm resize-none focus-visible:ring-1"
              />
            </div>
          )}

          {/* Preview */}
          {(viewMode === "split" || viewMode === "preview") && (
            <div className="flex flex-col space-y-2">
              <Label className="flex items-center gap-2">
                <Eye className="h-4 w-4" /> Live Preview
              </Label>
              <Card className="flex-1 border-2 border-dashed bg-card min-h-[500px] overflow-auto">
                <CardContent className="p-6 prose prose-sm dark:prose-invert max-w-none">
                  <div dangerouslySetInnerHTML={{ __html: html }} />
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>
    </ToolLayout>
  );
}
