/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import * as React from "react";
import { ToolLayout } from "@/components/tool-layout";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { ArrowLeftRight, Copy } from "lucide-react";
import Papa from "papaparse";

export default function JsonCsvConverterPage() {
  const [jsonInput, setJsonInput] = React.useState("");
  const [csvInput, setCsvInput] = React.useState("");
  const [error, setError] = React.useState("");

  const handleJsonToCsv = () => {
    try {
      if (!jsonInput.trim()) return;
      const data = JSON.parse(jsonInput);
      const csv = Papa.unparse(data);
      setCsvInput(csv);
      setError("");
    } catch {
      setError("Invalid JSON format");
    }
  };

  const handleCsvToJson = () => {
    try {
      if (!csvInput.trim()) return;
      const result = Papa.parse(csvInput, {
        header: true,
        skipEmptyLines: true,
      });
      if (result.errors.length > 0) {
        setError("Invalid CSV format: " + result.errors[0].message);
        return;
      }
      setJsonInput(JSON.stringify(result.data, null, 2));
      setError("");
    } catch {
      setError("Conversion failed");
    }
  };

  const loadSample = () => {
    const sample = [
      { id: 1, name: "Alice", role: "Admin" },
      { id: 2, name: "Bob", role: "User" },
      { id: 3, name: "Charlie", role: "Guest" },
    ];
    setJsonInput(JSON.stringify(sample, null, 2));
    setCsvInput("");
    setError("");
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch (err) {
      console.error("Failed to copy", err);
    }
  };

  return (
    <ToolLayout
      title="JSON ↔ CSV Converter"
      description="Convert data between JSON and CSV formats easily."
    >
      <div className="space-y-4">
        <div className="flex justify-between items-center">
            <Button variant="outline" size="sm" onClick={loadSample}>
              Load Sample Data
            </Button>
            {error && <span className="text-destructive text-sm font-medium">{error}</span>}
        </div>

        <div className="grid md:grid-cols-2 gap-4 h-[500px]">
          {/* JSON Section */}
          <div className="flex flex-col space-y-2 h-full">
            <div className="flex justify-between items-center">
              <Label>JSON</Label>
              <div className="flex gap-2">
                 <Button variant="ghost" size="icon" onClick={() => copyToClipboard(jsonInput)} title="Copy JSON">
                    <Copy className="h-4 w-4" />
                 </Button>
              </div>
            </div>
            <Textarea 
              value={jsonInput}
              onChange={(e) => setJsonInput(e.target.value)}
              placeholder='[{"id": 1, "name": "Alice"}]'
              className="flex-1 font-mono text-xs resize-none"
            />
          </div>

          {/* CSV Section */}
          <div className="flex flex-col space-y-2 h-full">
             <div className="flex justify-between items-center">
              <Label>CSV</Label>
              <div className="flex gap-2">
                 <Button variant="ghost" size="icon" onClick={() => copyToClipboard(csvInput)} title="Copy CSV">
                    <Copy className="h-4 w-4" />
                 </Button>
              </div>
            </div>
            <Textarea 
              value={csvInput}
              onChange={(e) => setCsvInput(e.target.value)}
              placeholder='id,name\n1,Alice'
              className="flex-1 font-mono text-xs resize-none"
            />
          </div>
        </div>

        <div className="flex justify-center gap-4">
          <Button onClick={handleJsonToCsv} disabled={!jsonInput}>
            JSON to CSV <ArrowLeftRight className="ml-2 h-4 w-4" />
          </Button>
          <Button onClick={handleCsvToJson} disabled={!csvInput} variant="secondary">
             CSV to JSON <ArrowLeftRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </div>
    </ToolLayout>
  );
}
