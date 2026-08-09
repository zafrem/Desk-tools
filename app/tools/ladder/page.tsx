"use client";

import * as React from "react";
import { ToolLayout } from "@/components/tool-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function LadderPage() {
  const [participants, setParticipants] = React.useState(["A", "B", "C"]);

  return (
    <ToolLayout
      title="Ladder Game"
      description="Amidakuji ladder game to pick winners."
    >
      <div className="space-y-6">
        <div className="flex gap-2">
            <Input 
                value={participants.join(", ")}
                onChange={(e) => setParticipants(e.target.value.split(",").map(s => s.trim()))}
            />
            <Button>Start</Button>
        </div>
        <div className="border h-[300px] flex items-center justify-center text-muted-foreground">
            Ladder visualization will go here...
        </div>
      </div>
    </ToolLayout>
  );
}
