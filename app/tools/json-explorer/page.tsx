/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import * as React from "react";
import { ToolLayout } from "@/components/tool-layout";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ChevronRight, ChevronDown, FileJson, FileCode, Search } from "lucide-react";
import convert from "xml-js";

const SAMPLE_JSON = `{
  "user": {
    "name": "John Doe",
    "email": "john@example.com",
    "age": 30,
    "address": {
      "city": "New York",
      "zip": "10001"
    }
  },
  "orders": [
    {
      "id": 1,
      "product": "Laptop",
      "price": 1299.99
    },
    {
      "id": 2,
      "product": "Mouse",
      "price": 29.99
    }
  ],
  "active": true
}`;

const SAMPLE_XML = `<?xml version="1.0" encoding="UTF-8"?>
<root>
  <user id="101">
    <name>John Doe</name>
    <email>john@example.com</email>
    <age>30</age>
    <address>
      <city>New York</city>
      <zip>10001</zip>
    </address>
  </user>
  <orders>
    <order id="1">
      <product>Laptop</product>
      <price currency="USD">1299.99</price>
    </order>
    <order id="2">
      <product>Mouse</product>
      <price currency="USD">29.99</price>
    </order>
  </orders>
  <active>true</active>
</root>`;

interface TreeNodeProps {
  data: any;
  path: string;
  onCopyPath: (path: string) => void;
  isXml?: boolean;
}

function XMLTreeNode({ data, onCopyPath }: { data: any; onCopyPath: (path: string) => void }) {
  const [isExpanded, setIsExpanded] = React.useState(true);

  if (data.type === "text") {
    return (
      <div className="py-0.5 px-2 text-sm text-green-500 font-mono">
        {data.text}
      </div>
    );
  }

  if (data.type === "element") {
    const hasChildren = data.elements && data.elements.length > 0;
    const hasAttributes = data.attributes && Object.keys(data.attributes).length > 0;

    return (
      <div className="font-mono">
        <div
          className="flex items-center py-0.5 px-2 hover:bg-accent rounded cursor-pointer text-sm"
          onClick={() => hasChildren && setIsExpanded(!isExpanded)}
        >
          {hasChildren ? (
            isExpanded ? (
              <ChevronDown className="h-3 w-3 mr-1 text-muted-foreground" />
            ) : (
              <ChevronRight className="h-3 w-3 mr-1 text-muted-foreground" />
            )
          ) : (
            <span className="w-4" />
          )}
          
          <span className="text-blue-500 font-bold">&lt;{data.name}</span>
          
          {hasAttributes && Object.entries(data.attributes).map(([key, value]) => (
            <span key={key} className="ml-2">
              <span className="text-purple-500">{key}</span>
              <span className="text-muted-foreground">=</span>
              <span className="text-orange-500">&quot;{String(value)}&quot;</span>
            </span>
          ))}
          
          <span className="text-blue-500 font-bold">&gt;</span>
          
          {!isExpanded && hasChildren && (
            <span className="text-muted-foreground ml-1">...</span>
          )}
        </div>

        {isExpanded && hasChildren && (
          <div className="ml-4 border-l border-border/50 pl-2">
            {data.elements.map((child: any, i: number) => (
              <XMLTreeNode key={i} data={child} onCopyPath={onCopyPath} />
            ))}
          </div>
        )}

        {isExpanded && hasChildren && (
          <div className="py-0.5 px-2 text-sm text-blue-500 font-bold">
            &lt;/{data.name}&gt;
          </div>
        )}
      </div>
    );
  }

  return null;
}

function TreeNode({ data, path, onCopyPath }: TreeNodeProps) {
  const [isExpanded, setIsExpanded] = React.useState(true);

  const getType = (value: any): string => {
    if (value === null) return "null";
    if (Array.isArray(value)) return "array";
    return typeof value;
  };

  const getTypeColor = (type: string): string => {
    const colors: Record<string, string> = {
      string: "text-green-500",
      number: "text-blue-500",
      boolean: "text-purple-500",
      null: "text-gray-500",
      object: "text-orange-500",
      array: "text-yellow-500",
    };
    return colors[type] || "text-gray-400";
  };

  const renderValue = (value: any) => {
    const type = getType(value);

    if (type === "object" || type === "array") {
      const count = type === "array" ? value.length : Object.keys(value).length;
      return (
        <span className={getTypeColor(type)}>
          {type} ({count})
        </span>
      );
    }

    return (
      <>
        <span className={getTypeColor(type)}>
          {type === "string" ? `"${value}"` : String(value)}
        </span>
        <span className="ml-2 text-xs opacity-50">{type}</span>
      </>
    );
  };

  if (typeof data !== "object" || data === null) {
    return (
      <div
        className="py-1 px-2 hover:bg-accent rounded cursor-pointer text-sm"
        onClick={() => onCopyPath(path)}
      >
        <span className="font-mono">{path.split(".").pop()}</span>
        <span className="mx-2">:</span>
        {renderValue(data)}
      </div>
    );
  }

  const isArray = Array.isArray(data);
  const entries = isArray ? data.map((v, i) => [i, v]) : Object.entries(data);

  return (
    <div>
      <div
        className="flex items-center py-1 px-2 hover:bg-accent rounded cursor-pointer text-sm"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        {isExpanded ? (
          <ChevronDown className="h-4 w-4 mr-1" />
        ) : (
          <ChevronRight className="h-4 w-4 mr-1" />
        )}
        <span className="font-mono">{path.split(".").pop() || "root"}</span>
        <span className="mx-2">:</span>
        <span className={getTypeColor(isArray ? "array" : "object")}>
          {isArray ? "array" : "object"} ({entries.length})
        </span>
      </div>

      {isExpanded && (
        <div className="ml-6 border-l border-border pl-2">
          {entries.map(([key, value]) => {
            const newPath = path ? `${path}.${key}` : String(key);
            return <TreeNode key={key} data={value} path={newPath} onCopyPath={onCopyPath} />;
          })}
        </div>
      )}
    </div>
  );
}

export default function DataExplorerPage() {
  const [input, setInput] = React.useState("");
  const [format, setFormat] = React.useState<"auto" | "json" | "xml">("auto");
  const [parsed, setParsed] = React.useState<any>(null);
  const [actualFormat, setActualFormat] = React.useState<"json" | "xml" | null>(null);
  const [error, setError] = React.useState("");
  const [nodeCount, setNodeCount] = React.useState(0);
  const [copiedPath, setCopiedPath] = React.useState<string | null>(null);

  const countNodes = (obj: any): number => {
    if (typeof obj !== "object" || obj === null) return 1;
    let count = 1;
    if (actualFormat === "xml") {
      const elements = obj.elements || [];
      elements.forEach((v: any) => count += countNodes(v));
    } else {
      const entries = Array.isArray(obj) ? obj : Object.values(obj);
      entries.forEach(v => count += countNodes(v));
    }
    return count;
  };

  const handleAnalyze = () => {
    if (!input.trim()) {
      setError("Please enter some data");
      return;
    }

    let detectedFormat: "json" | "xml" | null = null;
    let data: any = null;

    // Detection / Parsing logic
    const tryJson = () => {
      try {
        data = JSON.parse(input);
        detectedFormat = "json";
        return true;
      } catch { return false; }
    };

    const tryXml = () => {
      try {
        const res = convert.xml2js(input, { compact: false });
        if (res.elements) {
          data = res;
          detectedFormat = "xml";
          return true;
        }
        return false;
      } catch { return false; }
    };

    if (format === "json") {
      if (!tryJson()) setError("Invalid JSON");
    } else if (format === "xml") {
      if (!tryXml()) setError("Invalid XML");
    } else {
      // Auto
      if (!tryJson() && !tryXml()) {
        setError("Could not detect format (JSON or XML)");
      }
    }

    if (detectedFormat) {
      setParsed(data);
      setActualFormat(detectedFormat);
      setNodeCount(countNodes(data));
      setError("");
    } else {
      setParsed(null);
      setActualFormat(null);
      setNodeCount(0);
    }
  };

  const handleLoadSample = () => {
    const targetFormat = format === "xml" ? "xml" : "json";
    const sample = targetFormat === "xml" ? SAMPLE_XML : SAMPLE_JSON;
    setInput(sample);
    
    if (targetFormat === "json") {
        const data = JSON.parse(sample);
        setParsed(data);
        setActualFormat("json");
        setNodeCount(countNodes(data));
    } else {
        const data = convert.xml2js(sample, { compact: false });
        setParsed(data);
        setActualFormat("xml");
        setNodeCount(countNodes(data));
    }
    setError("");
  };

  const handleReset = () => {
    setInput("");
    setParsed(null);
    setActualFormat(null);
    setError("");
    setNodeCount(0);
  };

  const handleCopyPath = async (path: string) => {
    try {
      await navigator.clipboard.writeText(path);
      setCopiedPath(path);
      setTimeout(() => setCopiedPath(null), 2000);
    } catch (err) {
      console.error("Copy failed:", err);
    }
  };

  const extractAllPaths = (obj: any, prefix = ""): string[] => {
    if (typeof obj !== "object" || obj === null) {
      return [prefix];
    }

    const paths: string[] = [];
    if (actualFormat === "xml") {
        // XML path extraction is a bit different, let's keep it simple or just show elements
        if (obj.type === "element") {
            const currentPath = prefix ? `${prefix} > ${obj.name}` : obj.name;
            paths.push(currentPath);
            if (obj.elements) {
                obj.elements.forEach((child: any) => {
                    paths.push(...extractAllPaths(child, currentPath));
                });
            }
        } else if (obj.elements) {
             obj.elements.forEach((child: any) => {
                paths.push(...extractAllPaths(child, prefix));
            });
        }
    } else {
        const isArray = Array.isArray(obj);
        const entries = isArray ? obj.map((v, i) => [i, v]) : Object.entries(obj);

        entries.forEach(([key, value]) => {
          const newPath = prefix ? `${prefix}.${key}` : String(key);
          if (typeof value === "object" && value !== null) {
            paths.push(...extractAllPaths(value, newPath));
          } else {
            paths.push(newPath);
          }
        });
    }

    return paths.filter(p => p !== "");
  };

  return (
    <ToolLayout
      title="Data Explorer"
      description="Visualize JSON or XML data as an interactive tree"
    >
      <div className="grid md:grid-cols-2 gap-6">
        {/* Left: Input */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="input" className="text-lg font-semibold">Input Data</Label>
              <p className="text-sm text-muted-foreground">JSON or XML</p>
            </div>
            <div className="flex items-center gap-2">
              <Label htmlFor="format" className="text-xs uppercase text-muted-foreground font-bold">Format:</Label>
              <Select value={format} onValueChange={(v: any) => setFormat(v)}>
                <SelectTrigger className="w-[100px] h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="auto">Auto</SelectItem>
                  <SelectItem value="json">JSON</SelectItem>
                  <SelectItem value="xml">XML</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <Textarea
            id="input"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Paste your JSON or XML here..."
            rows={20}
            className="font-mono text-sm"
          />

          <div className="flex gap-2">
            <Button onClick={handleAnalyze} disabled={!input} className="gap-2">
              <Search className="h-4 w-4" />
              Analyze
            </Button>
            <Button variant="outline" onClick={handleLoadSample}>
              Load Example
            </Button>
            <Button variant="outline" onClick={handleReset}>
              Reset
            </Button>
          </div>

          {error && (
            <div className="rounded-md bg-destructive/10 border border-destructive/20 p-3 text-sm text-destructive">
              {error}
            </div>
          )}
        </div>

        {/* Right: Explorer */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label className="text-lg font-semibold flex items-center gap-2">
                {actualFormat === "json" ? <FileJson className="h-5 w-5 text-orange-500" /> : 
                 actualFormat === "xml" ? <FileCode className="h-5 w-5 text-blue-500" /> : null}
                {actualFormat ? `${actualFormat.toUpperCase()} Explorer` : "Explorer"}
              </Label>
              <p className="text-sm text-muted-foreground">{nodeCount} nodes detected</p>
            </div>
          </div>

          {parsed ? (
            <Tabs defaultValue="tree" className="w-full">
              <TabsList className="w-full">
                <TabsTrigger value="tree" className="flex-1">Tree View</TabsTrigger>
                <TabsTrigger value="paths" className="flex-1">Path/Element List</TabsTrigger>
              </TabsList>

              <TabsContent value="tree" className="border rounded-lg p-4 max-h-[600px] overflow-auto bg-card">
                {actualFormat === "xml" ? (
                  <div className="space-y-1">
                    {parsed.elements.map((el: any, i: number) => (
                      <XMLTreeNode key={i} data={el} onCopyPath={handleCopyPath} />
                    ))}
                  </div>
                ) : (
                  <TreeNode data={parsed} path="" onCopyPath={handleCopyPath} />
                )}
                <p className="text-xs text-muted-foreground mt-4 text-center border-t pt-4">
                  {actualFormat === "xml" ? "Interactive XML Tree View" : "Click a node to copy its path"}
                </p>
              </TabsContent>

              <TabsContent value="paths" className="border rounded-lg p-4 max-h-[600px] overflow-auto bg-card">
                <div className="space-y-1 font-mono text-sm">
                  {extractAllPaths(parsed).map((path, index) => (
                    <div
                      key={index}
                      className="py-1.5 px-3 hover:bg-accent rounded cursor-pointer transition-colors flex items-center gap-2"
                      onClick={() => handleCopyPath(path)}
                    >
                      <span className="text-muted-foreground text-[10px]">{index + 1}</span>
                      {path}
                    </div>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground mt-4 text-center">
                  Click a path to copy it
                </p>
              </TabsContent>
            </Tabs>
          ) : (
            <div className="border rounded-lg border-dashed p-12 text-center bg-muted/20">
              <p className="text-muted-foreground">
                Parse data to see the interactive view
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Copy Feedback Toast */}
      {copiedPath && (
        <div className="fixed bottom-4 right-4 bg-primary text-primary-foreground px-4 py-2 rounded-md shadow-lg animate-in fade-in slide-in-from-bottom-2 duration-300 z-50">
          <p className="text-sm font-medium">Copied to clipboard!</p>
          <p className="text-xs opacity-90 font-mono truncate max-w-xs">{copiedPath}</p>
        </div>
      )}
    </ToolLayout>
  );
}