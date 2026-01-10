/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import * as React from "react";
import { ToolLayout } from "@/components/tool-layout";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Copy } from "lucide-react";

// --- Generator Logic ---

function toPythonClass(jsonStr: string, rootName: string = "Root"): string {
  try {
    const obj = JSON.parse(jsonStr);
    
    // Helper to determine Python type
    const getPyType = (val: any): string => {
        if (val === null) return "Any";
        if (typeof val === "boolean") return "bool";
        if (typeof val === "number") return Number.isInteger(val) ? "int" : "float";
        if (typeof val === "string") return "str";
        if (Array.isArray(val)) {
            if (val.length === 0) return "List[Any]";
            return `List[${getPyType(val[0])}]`;
        }
        if (typeof val === "object") return "Dict[str, Any]"; // Simplified for nested
        return "Any";
    };

    const lines: string[] = [
        "from dataclasses import dataclass",
        "from typing import List, Any, Dict, Optional",
        "",
        "@dataclass",
        `class ${rootName}:`
    ];

    if (Array.isArray(obj)) {
        return `# Root input is a list, cannot generate a single class directly.\n# Python Type Hint: List[${getPyType(obj[0])}]`;
    }

    if (typeof obj !== "object" || obj === null) {
        return `# Root input is not a JSON object.`;
    }

    const keys = Object.keys(obj);
    if (keys.length === 0) {
        lines.push("    pass");
    } else {
        keys.forEach(key => {
            const val = obj[key];
            const typeName = getPyType(val);
            lines.push(`    ${key}: ${typeName}`);
        });
    }

    return lines.join("\n");
  } catch (e) {
    return `Error: ${(e as Error).message}`;
  }
}

function toTypeScriptInterface(jsonStr: string, rootName: string = "Root"): string {
  try {
    const obj = JSON.parse(jsonStr);

    const getTsType = (val: any): string => {
        if (val === null) return "any";
        if (typeof val === "boolean") return "boolean";
        if (typeof val === "number") return "number";
        if (typeof val === "string") return "string";
        if (Array.isArray(val)) {
             if (val.length === 0) return "any[]";
             return `${getTsType(val[0])}[]`;
        }
        if (typeof val === "object") return "Record<string, any>"; // Simplified
        return "any";
    };

    if (Array.isArray(obj)) {
        return `// Root is an array\ntype ${rootName} = ${getTsType(obj)};`;
    }
    
    if (typeof obj !== "object" || obj === null) {
         return `// Root is primitive\ntype ${rootName} = ${getTsType(obj)};`;
    }

    const lines: string[] = [`interface ${rootName} {`];
    Object.keys(obj).forEach(key => {
        const val = obj[key];
        lines.push(`  ${key}: ${getTsType(val)};`);
    });
    lines.push("}");

    return lines.join("\n");
  } catch (e) {
    return `Error: ${(e as Error).message}`;
  }
}

export default function JsonToCodePage() {
  const [input, setInput] = React.useState("");
  const [rootName, setRootName] = React.useState("MyType");
  const [activeTab, setActiveTab] = React.useState<"python" | "typescript">("python");
  const [output, setOutput] = React.useState("");

  const handleGenerate = React.useCallback(() => {
    if (!input.trim()) {
        setOutput("");
        return;
    }
    if (activeTab === "python") {
        setOutput(toPythonClass(input, rootName));
    } else {
        setOutput(toTypeScriptInterface(input, rootName));
    }
  }, [input, rootName, activeTab]);

  React.useEffect(() => {
    handleGenerate();
  }, [handleGenerate]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(output);
    } catch (err) { console.error(err); }
  };

  const loadSample = () => {
      setInput(`{
  "id": 123,
  "name": "Alice",
  "isActive": true,
  "roles": ["admin", "editor"],
  "settings": {
    "theme": "dark"
  }
}`);
  };

  return (
    <ToolLayout
      title="JSON to Code"
      description="Generate Python dataclasses or TypeScript interfaces from JSON objects."
    >
      <div className="grid lg:grid-cols-2 gap-6 h-[calc(100vh-200px)] min-h-[500px]">
        {/* Left: Input */}
        <div className="flex flex-col space-y-4">
            <div className="flex items-center justify-between">
                <Label>JSON Input</Label>
                <Button variant="ghost" size="sm" onClick={loadSample}>
                    Load Sample
                </Button>
            </div>
            <Textarea 
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Paste JSON here..."
                className="flex-1 font-mono text-sm resize-none"
            />
        </div>

        {/* Right: Output */}
        <div className="flex flex-col space-y-4">
             <div className="flex items-center gap-4">
                <div className="flex-1">
                    <Label className="mb-1.5 block">Target Language</Label>
                    <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="w-full">
                        <TabsList className="w-full">
                            <TabsTrigger value="python" className="flex-1">Python (Dataclass)</TabsTrigger>
                            <TabsTrigger value="typescript" className="flex-1">TypeScript (Interface)</TabsTrigger>
                        </TabsList>
                    </Tabs>
                </div>
             </div>
             
             <div className="flex items-end gap-4">
                <div className="flex-1 space-y-1.5">
                    <Label htmlFor="rootName">Root Class/Interface Name</Label>
                    <Input 
                        id="rootName" 
                        value={rootName} 
                        onChange={(e) => setRootName(e.target.value)} 
                    />
                </div>
                <Button onClick={handleCopy} disabled={!output} className="mb-0.5">
                    <Copy className="h-4 w-4 mr-2" /> Copy Code
                </Button>
             </div>

             <div className="flex-1 relative rounded-md border bg-muted/30">
                 <Textarea 
                    readOnly
                    value={output}
                    className="w-full h-full font-mono text-sm resize-none border-0 bg-transparent focus-visible:ring-0"
                    placeholder="Generated code will appear here..."
                 />
             </div>
        </div>
      </div>
    </ToolLayout>
  );
}
