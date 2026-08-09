"use client";

import * as React from "react";
import { ToolLayout } from "@/components/tool-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function RoulettePage() {
  const [options, setOptions] = React.useState("Option 1, Option 2, Option 3");
  const [result, setResult] = React.useState("");

  const spin = () => {
    const list = options.split(",").map(s => s.trim()).filter(Boolean);
    if (list.length > 0) {
        setResult(list[Math.floor(Math.random() * list.length)]);
    }
  };

  return (
    <ToolLayout
      title="Roulette"
      description="Spin the roulette to make a random choice."
    >
      <div className="space-y-6">
        <Input 
            value={options}
            onChange={(e) => setOptions(e.target.value)}
            placeholder="Enter options separated by comma"
        />
        <Button onClick={spin}>Spin</Button>
        {result && (
            <div className="text-2xl font-bold text-center mt-6">
                Result: {result}
            </div>
        )}
      </div>
    </ToolLayout>
  );
}
