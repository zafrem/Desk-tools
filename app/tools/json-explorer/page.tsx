"use client";

import * as React from "react";
import { ToolLayout } from "@/components/tool-layout";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ChevronRight, ChevronDown } from "lucide-react";

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

interface TreeNodeProps {
  data: any;
  path: string;
  onCopyPath: (path: string) => void;
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

export default function JSONExplorerPage() {
  const [input, setInput] = React.useState("");
  const [parsed, setParsed] = React.useState<any>(null);
  const [error, setError] = React.useState("");
  const [nodeCount, setNodeCount] = React.useState(0);
  const [copiedPath, setCopiedPath] = React.useState<string | null>(null);

  const countNodes = (obj: any): number => {
    if (typeof obj !== "object" || obj === null) return 1;
    let count = 1;
    const entries = Array.isArray(obj) ? obj : Object.values(obj);
    entries.forEach(v => count += countNodes(v));
    return count;
  };

  const handleAnalyze = () => {
    try {
      const data = JSON.parse(input);
      setParsed(data);
      setNodeCount(countNodes(data));
      setError("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Invalid JSON");
      setParsed(null);
      setNodeCount(0);
    }
  };

  const handleLoadSample = () => {
    setInput(SAMPLE_JSON);
    try {
      const data = JSON.parse(SAMPLE_JSON);
      setParsed(data);
      setNodeCount(countNodes(data));
      setError("");
    } catch {}
  };

  const handleReset = () => {
    setInput("");
    setParsed(null);
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

    return paths;
  };

  return (
    <ToolLayout
      title="JSON Explorer"
      description="Visualize JSON data as an interactive tree"
    >
      <div className="grid md:grid-cols-2 gap-6">
        {/* Left: JSON Input */}
        <div className="space-y-4">
          <div>
            <Label htmlFor="input" className="text-lg font-semibold">JSON Input</Label>
            <p className="text-sm text-muted-foreground">Enter JSON to parse</p>
          </div>

          <Textarea
            id="input"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Paste your JSON here..."
            rows={20}
            className="font-mono text-sm"
          />

          <div className="flex gap-2">
            <Button onClick={handleAnalyze} disabled={!input}>
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

        {/* Right: JSON Explorer */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label className="text-lg font-semibold">JSON Explorer</Label>
              <p className="text-sm text-muted-foreground">{nodeCount} nodes</p>
            </div>
          </div>

          {parsed ? (
            <Tabs defaultValue="tree" className="w-full">
              <TabsList className="w-full">
                <TabsTrigger value="tree" className="flex-1">Tree View</TabsTrigger>
                <TabsTrigger value="paths" className="flex-1">Path List</TabsTrigger>
              </TabsList>

              <TabsContent value="tree" className="border rounded-lg p-4 max-h-[600px] overflow-auto">
                <TreeNode data={parsed} path="" onCopyPath={handleCopyPath} />
                <p className="text-xs text-muted-foreground mt-4 text-center">
                  Click a node to copy its path
                </p>
              </TabsContent>

              <TabsContent value="paths" className="border rounded-lg p-4 max-h-[600px] overflow-auto">
                <div className="space-y-1 font-mono text-sm">
                  {extractAllPaths(parsed).map((path, index) => (
                    <div
                      key={index}
                      className="py-1.5 px-3 hover:bg-accent rounded cursor-pointer transition-colors"
                      onClick={() => handleCopyPath(path)}
                    >
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
            <div className="border rounded-lg border-dashed p-12 text-center">
              <p className="text-muted-foreground">
                Parse JSON to see the tree view
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Copy Feedback Toast */}
      {copiedPath && (
        <div className="fixed bottom-4 right-4 bg-primary text-primary-foreground px-4 py-2 rounded-md shadow-lg animate-in fade-in slide-in-from-bottom-2 duration-300">
          <p className="text-sm font-medium">Copied to clipboard!</p>
          <p className="text-xs opacity-90 font-mono">{copiedPath}</p>
        </div>
      )}
    </ToolLayout>
  );
}
