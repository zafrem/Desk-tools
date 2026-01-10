"use client";

import * as React from "react";
import { ToolLayout } from "@/components/tool-layout";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { AlertCircle, Calendar, Clock, Info } from "lucide-react";
import cronstrue from "cronstrue";
import CronExpressionParser from "cron-parser";
import { format } from "date-fns";

export default function CronExpressionPage() {
  const [expression, setExpression] = React.useState("*/5 * * * *");
  const [description, setDescription] = React.useState("");
  const [nextRuns, setNextRuns] = React.useState<Date[]>([]);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!expression.trim()) {
      setDescription("");
      setNextRuns([]);
      setError(null);
      return;
    }

    try {
      // 1. Get Human Readable Description
      const desc = cronstrue.toString(expression, { verbose: true });
      setDescription(desc);

      // 2. Calculate Next Runs
      const interval = CronExpressionParser.parse(expression);
      const runs = [];
      for (let i = 0; i < 5; i++) {
        runs.push(interval.next().toDate());
      }
      setNextRuns(runs);
      setError(null);
    } catch (err) {
      setError((err as Error).message);
      setDescription("");
      setNextRuns([]);
    }
  }, [expression]);

  const presetExamples = [
    { label: "Every minute", value: "* * * * *" },
    { label: "Every 5 minutes", value: "*/5 * * * *" },
    { label: "Every hour", value: "0 * * * *" },
    { label: "Every day at midnight", value: "0 0 * * *" },
    { label: "Every Monday at 9am", value: "0 9 * * 1" },
    { label: "1st of every month", value: "0 0 1 * *" },
  ];

  return (
    <ToolLayout
      title="Cron Expression"
      description="Parse, validate, and understand cron schedules with ease."
    >
      <div className="grid gap-6 md:grid-cols-[1fr_300px]">
        <div className="space-y-6">
          {/* Input Section */}
          <div className="space-y-2">
            <Label htmlFor="cron-input">Cron Expression</Label>
            <div className="flex gap-2">
              <Input
                id="cron-input"
                value={expression}
                onChange={(e) => setExpression(e.target.value)}
                placeholder="* * * * *"
                className="font-mono text-lg"
              />
            </div>
            {error && (
              <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-destructive flex gap-3 items-start">
                <AlertCircle className="h-5 w-5 mt-0.5 shrink-0" />
                <div>
                  <h5 className="font-medium leading-none tracking-tight mb-1">Invalid Expression</h5>
                  <div className="text-sm opacity-90">{error}</div>
                </div>
              </div>
            )}
            {!error && description && (
              <div className="rounded-lg border border-primary/20 bg-primary/10 p-4 text-primary flex gap-3 items-start">
                <Info className="h-5 w-5 mt-0.5 shrink-0" />
                <div>
                  <div className="font-semibold text-lg">{description}</div>
                </div>
              </div>
            )}
          </div>

          {/* Next Runs */}
          {!error && nextRuns.length > 0 && (
            <div className="rounded-lg border bg-card text-card-foreground shadow-sm">
              <div className="flex flex-col space-y-1.5 p-6 pb-3">
                <h3 className="font-semibold leading-none tracking-tight flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Next Scheduled Dates
                </h3>
              </div>
              <div className="p-6 pt-0">
                <div className="space-y-1">
                  {nextRuns.map((date, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between text-sm py-2 border-b last:border-0"
                    >
                      <span className="font-mono text-muted-foreground">
                        {format(date, "yyyy-MM-dd")}
                      </span>
                      <span className="font-medium flex items-center gap-2">
                        <Clock className="h-3 w-3 text-muted-foreground" />
                        {format(date, "HH:mm:ss")}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

           {/* Quick Reference */}
           <div className="rounded-lg border bg-card text-card-foreground shadow-sm">
            <div className="flex flex-col space-y-1.5 p-6 pb-3">
              <h3 className="font-semibold leading-none tracking-tight">Format Reference</h3>
            </div>
            <div className="p-6 pt-0">
              <div className="text-sm font-mono bg-muted p-4 rounded-md overflow-x-auto whitespace-pre">
                {`* * * * *
| | | | |
| | | | +-- Day of Week (0 - 7) (Sunday=0 or 7)
| | | +---- Month (1 - 12)
| | +------ Day of Month (1 - 31)
| +-------- Hour (0 - 23)
+---------- Minute (0 - 59)`}
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar / Examples */}
        <div className="space-y-6">
          <div className="rounded-lg border bg-card text-card-foreground shadow-sm">
            <div className="flex flex-col space-y-1.5 p-6 pb-3">
              <h3 className="font-semibold leading-none tracking-tight">Examples</h3>
            </div>
            <div className="p-6 pt-0 grid gap-2">
              {presetExamples.map((ex) => (
                <Button
                  key={ex.value}
                  variant="outline"
                  className="justify-start font-normal h-auto py-2 px-3 text-left"
                  onClick={() => setExpression(ex.value)}
                >
                  <div className="flex flex-col items-start gap-1 w-full">
                    <span className="text-xs font-semibold">{ex.label}</span>
                    <span className="text-xs font-mono text-muted-foreground">
                      {ex.value}
                    </span>
                  </div>
                </Button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </ToolLayout>
  );
}