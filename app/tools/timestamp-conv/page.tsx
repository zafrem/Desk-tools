"use client";

import * as React from "react";
import { ToolLayout } from "@/components/tool-layout";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Copy } from "lucide-react";
import { format, fromUnixTime, getTime, isValid, parseISO } from "date-fns";

export default function TimestampConvPage() {
  const [unixInput, setUnixInput] = React.useState("");
  const [dateInput, setDateInput] = React.useState("");
  const [unit, setUnit] = React.useState<"s" | "ms">("s");
  const [current, setCurrent] = React.useState(Math.floor(Date.now() / 1000));

  // Update current time every second
  React.useEffect(() => {
    const timer = setInterval(() => {
      setCurrent(Math.floor(Date.now() / 1000));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Handle Unix -> Date conversion
  React.useEffect(() => {
    if (!unixInput) return;
    
    const ts = parseInt(unixInput, 10);
    if (isNaN(ts)) return;

    try {
      const date = fromUnixTime(unit === "s" ? ts : ts / 1000);
      if (isValid(date)) {
        // Only update date input if not currently focused to avoid fighting user? 
        // Better to just show result elsewhere or use a separate output field.
        // Let's use a dedicated output area for clarity.
      }
    } catch {
        // ignore
    }
  }, [unixInput, unit]);

  const convertUnix = () => {
    const ts = parseInt(unixInput, 10);
    if (isNaN(ts)) return "Invalid Timestamp";
    try {
        const date = fromUnixTime(unit === "s" ? ts : ts / 1000);
        if (!isValid(date)) return "Invalid Date";
        return format(date, "yyyy-MM-dd HH:mm:ss");
    } catch {
        return "Error";
    }
  };

  const convertDate = () => {
      if (!dateInput) return "Invalid Date";
      try {
          const date = parseISO(dateInput);
          if (!isValid(date)) return "Invalid Date";
          const ts = getTime(date);
          return unit === "s" ? Math.floor(ts / 1000).toString() : ts.toString();
      } catch {
          return "Error";
      }
  };

  return (
    <ToolLayout
      title="Timestamp Converter"
      description="Convert between Unix Timestamps and human-readable dates."
    >
      <div className="space-y-8">
        {/* Current Time */}
        <Card className="bg-primary/5 border-primary/20">
            <CardContent className="p-6 flex flex-col items-center justify-center gap-2">
                <div className="text-sm text-muted-foreground uppercase tracking-wider font-semibold">Current Unix Timestamp</div>
                <div className="text-4xl font-mono font-bold text-primary">{current}</div>
                <Button variant="ghost" size="sm" onClick={() => setUnixInput(current.toString())}>
                    Use Current
                </Button>
            </CardContent>
        </Card>

        {/* Converter Section */}
        <div className="grid md:grid-cols-2 gap-8">
            {/* Unix to Date */}
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <Label className="text-lg">Unix to Date</Label>
                    <Select value={unit} onValueChange={(v) => setUnit(v as "s" | "ms")}>
                        <SelectTrigger className="w-[120px]">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="s">Seconds</SelectItem>
                            <SelectItem value="ms">Milliseconds</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                <div className="flex gap-2">
                    <Input 
                        value={unixInput} 
                        onChange={(e) => setUnixInput(e.target.value)} 
                        placeholder={unit === "s" ? "1672531200" : "1672531200000"}
                        className="font-mono"
                    />
                </div>
                <Card className="bg-muted/30">
                    <CardContent className="p-4 flex items-center justify-between">
                        <span className="font-mono text-lg">{convertUnix()}</span>
                        <Button variant="ghost" size="icon" onClick={() => navigator.clipboard.writeText(convertUnix())}>
                            <Copy className="h-4 w-4" />
                        </Button>
                    </CardContent>
                </Card>
            </div>

            {/* Date to Unix */}
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <Label className="text-lg">Date to Unix</Label>
                </div>
                <div className="flex gap-2">
                    <Input 
                        type="datetime-local"
                        value={dateInput} 
                        onChange={(e) => setDateInput(e.target.value)} 
                        step="1"
                    />
                </div>
                <Card className="bg-muted/30">
                    <CardContent className="p-4 flex items-center justify-between">
                        <span className="font-mono text-lg">{convertDate()}</span>
                        <Button variant="ghost" size="icon" onClick={() => navigator.clipboard.writeText(convertDate())}>
                            <Copy className="h-4 w-4" />
                        </Button>
                    </CardContent>
                </Card>
            </div>
        </div>
      </div>
    </ToolLayout>
  );
}
