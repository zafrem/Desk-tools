"use client";

import * as React from "react";
import { ToolLayout } from "@/components/tool-layout";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { ArrowRightLeft, Copy, Delete } from "lucide-react";

// Simplified conversion logic
// Note: This is a basic implementation. Robust conversion usually requires a full parser.

const mdToWiki = (md: string): string => {
  let wiki = md;
  // Headers
  wiki = wiki.replace(/^###### (.*$)/gm, "h6. $1");
  wiki = wiki.replace(/^##### (.*$)/gm, "h5. $1");
  wiki = wiki.replace(/^#### (.*$)/gm, "h4. $1");
  wiki = wiki.replace(/^### (.*$)/gm, "h3. $1");
  wiki = wiki.replace(/^## (.*$)/gm, "h2. $1");
  wiki = wiki.replace(/^# (.*$)/gm, "h1. $1");
  
  // Bold
  wiki = wiki.replace(/\*\*(.*?)\*\*/g, "*$1*");
  wiki = wiki.replace(/__(.*?)__/g, "*$1*");
  
  // Italic
  wiki = wiki.replace(/\*(.*?)\*/g, "_$1_");
  wiki = wiki.replace(/_(.*?)_/g, "_$1_");
  
  // Monospace
  wiki = wiki.replace(/`(.*?)`/g, "{{$1}}");
  
  // Code Block
  wiki = wiki.replace(/```(\w+)?\n([\s\S]*?)```/g, "{code:$1}\n$2{code}");
  
  // Links [text](url) -> [text|url]
  wiki = wiki.replace(/\[(.*?)\]\((.*?)\)/g, "[$1|$2]");
  
  // Unordered Lists
  wiki = wiki.replace(/^\s*[-*+] (.*$)/gm, "* $1");
  
  // Ordered Lists
  wiki = wiki.replace(/^\s*\d+\. (.*$)/gm, "# $1");
  
  return wiki;
};

const wikiToMd = (wiki: string): string => {
  let md = wiki;
  // Headers
  md = md.replace(/^h6\. (.*$)/gm, "###### $1");
  md = md.replace(/^h5\. (.*$)/gm, "##### $1");
  md = md.replace(/^h4\. (.*$)/gm, "#### $1");
  md = md.replace(/^h3\. (.*$)/gm, "### $1");
  md = md.replace(/^h2\. (.*$)/gm, "## $1");
  md = md.replace(/^h1\. (.*$)/gm, "# $1");
  
  // Bold
  md = md.replace(/\*(.*?)\*/g, "**$1**");
  
  // Italic
  md = md.replace(/_(.*?)_/g, "*$1*");
  
  // Monospace
  md = md.replace(/{{(.*?)}}/g, "`$1`");
  
  // Code Block
  md = md.replace(/{code(:(\w+))?}\n([\s\S]*?){code}/g, "```$2\n$3```");
  
  // Links [text|url] -> [text](url)
  md = md.replace(/\\\[(.*?)\\\|(.*?)\\\]/g, "[$1]($2)");
  
  // Unordered Lists (simple case)
  // md = md.replace(/^\* (.*$)/gm, "- $1"); // Jira uses * too, but MD supports *
  
  // Ordered Lists
  md = md.replace(/^# (.*$)/gm, "1. $1");
  
  return md;
};

export default function MarkupConverterPage() {
  const [left, setLeft] = React.useState("");
  const [right, setRight] = React.useState("");
  const [mode, setMode] = React.useState<"md2wiki" | "wiki2md">("md2wiki");

  const handleConvert = React.useCallback(() => {
    if (mode === "md2wiki") {
      setRight(mdToWiki(left));
    } else {
      setRight(wikiToMd(left));
    }
  }, [left, mode]);

  React.useEffect(() => {
    handleConvert();
  }, [handleConvert]);

  const toggleMode = () => {
    setMode(prev => prev === "md2wiki" ? "wiki2md" : "md2wiki");
    setLeft(right); // Swap content
    setRight(left);
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch (err) { console.error(err); }
  };

  return (
    <ToolLayout
      title="Markup Converter"
      description="Convert between Markdown and Atlassian (Jira/Confluence) Wiki Markup."
    >
      <div className="space-y-4">
        <div className="flex justify-center mb-4">
            <Button onClick={toggleMode} variant="outline" className="gap-2">
                <ArrowRightLeft className="h-4 w-4" />
                Switch Direction
            </Button>
        </div>

        <div className="grid md:grid-cols-2 gap-4 h-[500px]">
          {/* Left Input */}
          <div className="flex flex-col space-y-2 h-full">
            <div className="flex justify-between items-center">
              <Label>{mode === "md2wiki" ? "Markdown" : "Wiki Markup"}</Label>
              <div className="flex gap-2">
                 <Button variant="ghost" size="sm" onClick={() => setLeft("")}>
                    <Delete className="h-4 w-4" />
                 </Button>
                 <Button variant="ghost" size="icon" onClick={() => copyToClipboard(left)} title="Copy">
                    <Copy className="h-4 w-4" />
                 </Button>
              </div>
            </div>
            <Textarea 
              value={left}
              onChange={(e) => setLeft(e.target.value)}
              placeholder={mode === "md2wiki" ? "# Hello World" : "h1. Hello World"}
              className="flex-1 font-mono text-sm resize-none"
            />
          </div>

          {/* Right Output */}
          <div className="flex flex-col space-y-2 h-full">
             <div className="flex justify-between items-center">
              <Label>{mode === "md2wiki" ? "Wiki Markup" : "Markdown"}</Label>
              <div className="flex gap-2">
                 <Button variant="ghost" size="icon" onClick={() => copyToClipboard(right)} title="Copy">
                    <Copy className="h-4 w-4" />
                 </Button>
              </div>
            </div>
            <Textarea 
              value={right}
              readOnly
              className="flex-1 font-mono text-sm resize-none bg-muted"
              placeholder="Converted output..."
            />
          </div>
        </div>
      </div>
    </ToolLayout>
  );
}
