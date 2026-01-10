"use client";

import * as React from "react";
import { ToolLayout } from "@/components/tool-layout";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Textarea } from "@/components/ui/textarea";
import { Copy, RefreshCw, Trash2 } from "lucide-react";

export default function UuidGeneratorPage() {
  const [count, setCount] = React.useState(1);
  const [uuids, setUuids] = React.useState<string[]>([]);

  const generate = React.useCallback(() => {
    const newUuids = [];
    for (let i = 0; i < count; i++) {
        if (typeof crypto !== 'undefined' && crypto.randomUUID) {
            newUuids.push(crypto.randomUUID());
        } else {
            // Fallback for older environments
            newUuids.push('xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
                const r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
                return v.toString(16);
            }));
        }
    }
    setUuids(newUuids);
  }, [count]);

  React.useEffect(() => {
    generate();
  }, [generate]);

  const copyAll = () => {
      navigator.clipboard.writeText(uuids.join('\n'));
  };

  return (
    <ToolLayout
      title="UUID Generator"
      description="Generate random version 4 UUIDs."
    >
      <div className="max-w-2xl mx-auto space-y-8">
        <div className="flex items-center gap-4 bg-card p-4 rounded-lg border">
            <div className="flex-1 space-y-2">
                <Label>Quantity: {count}</Label>
                <Slider 
                    value={[count]} 
                    min={1} max={50} step={1} 
                    onValueChange={(v) => setCount(v[0])} 
                />
            </div>
            <Button onClick={generate} size="lg">
                <RefreshCw className="h-4 w-4 mr-2" /> Generate
            </Button>
        </div>

        <div className="space-y-2">
            <div className="flex justify-between items-center">
                <Label>Generated UUIDs</Label>
                <div className="flex gap-2">
                    <Button variant="ghost" size="sm" onClick={() => setUuids([])}>
                        <Trash2 className="h-4 w-4 mr-2" /> Clear
                    </Button>
                    <Button variant="ghost" size="sm" onClick={copyAll}>
                        <Copy className="h-4 w-4 mr-2" /> Copy All
                    </Button>
                </div>
            </div>
            <Textarea 
                readOnly 
                value={uuids.join('\n')} 
                className="font-mono text-sm min-h-[400px] bg-muted/30 resize-none"
            />
        </div>
      </div>
    </ToolLayout>
  );
}
