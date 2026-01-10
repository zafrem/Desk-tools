/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import * as React from "react";
import { ToolLayout } from "@/components/tool-layout";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { ArrowRight, Copy } from "lucide-react";

function generateSchema(json: any): any {
  const type = typeof json;

  if (json === null) {
    return { type: "null" };
  }

  if (Array.isArray(json)) {
    const items = json.length > 0 ? generateSchema(json[0]) : {};
    return {
      type: "array",
      items: items,
    };
  }

  if (type === "object") {
    const properties: Record<string, any> = {};
    const required: string[] = [];

    for (const key in json) {
      if (Object.prototype.hasOwnProperty.call(json, key)) {
        properties[key] = generateSchema(json[key]);
        required.push(key);
      }
    }

    return {
      type: "object",
      properties: properties,
      required: required.length > 0 ? required : undefined,
    };
  }

  return { type: type };
}

export default function JsonSchemaGenPage() {
  const [input, setInput] = React.useState("");
  const [output, setOutput] = React.useState("");
  const [error, setError] = React.useState("");

  const handleGenerate = () => {
    try {
      if (!input.trim()) return;
      const json = JSON.parse(input);
      const schema = {
        $schema: "http://json-schema.org/draft-07/schema#",
        ...generateSchema(json),
      };
      setOutput(JSON.stringify(schema, null, 2));
      setError("");
    } catch {
      setError("Invalid JSON format");
    }
  };

  const loadSample = () => {
    const sample = {
      id: 1,
      name: "Product Name",
      price: 19.99,
      tags: ["tag1", "tag2"],
      metadata: {
        created: "2023-01-01",
        active: true,
      },
    };
    setInput(JSON.stringify(sample, null, 2));
    setOutput("");
    setError("");
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(output);
    } catch (err) {
      console.error("Failed to copy", err);
    }
  };

  return (
    <ToolLayout
      title="JSON Schema Generator"
      description="Generate JSON Schema Draft-07 from a JSON object."
    >
      <div className="space-y-4">
        <div className="flex justify-between items-center">
            <Button variant="outline" size="sm" onClick={loadSample}>
              Load Sample Data
            </Button>
            {error && <span className="text-destructive text-sm font-medium">{error}</span>}
        </div>

        <div className="grid md:grid-cols-2 gap-4 h-[500px]">
          {/* Input Section */}
          <div className="flex flex-col space-y-2 h-full">
            <Label>JSON Input</Label>
            <Textarea 
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder='{"key": "value"}'
              className="flex-1 font-mono text-xs resize-none"
            />
          </div>

          {/* Output Section */}
          <div className="flex flex-col space-y-2 h-full">
             <div className="flex justify-between items-center">
              <Label>JSON Schema</Label>
              <div className="flex gap-2">
                 <Button variant="ghost" size="icon" onClick={copyToClipboard} title="Copy Schema" disabled={!output}>
                    <Copy className="h-4 w-4" />
                 </Button>
              </div>
            </div>
            <Textarea 
              value={output}
              readOnly
              placeholder='Generated schema will appear here...'
              className="flex-1 font-mono text-xs resize-none bg-muted"
            />
          </div>
        </div>

        <div className="flex justify-center">
          <Button onClick={handleGenerate} disabled={!input}>
            Generate Schema <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </div>
    </ToolLayout>
  );
}
