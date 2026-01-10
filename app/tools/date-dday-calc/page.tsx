"use client";

import { ToolLayout } from "@/components/tool-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  add, 
  sub, 
  differenceInDays, 
  format, 
  intervalToDuration, 
  isValid, 
  parseISO,
  type Duration
} from "date-fns";
import { Calendar as CalendarIcon, Calculator, Clock } from "lucide-react";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";

export default function DateDDayCalc() {
  // Tab 1: D-Day & Diff
  const [date1, setDate1] = useState(format(new Date(), "yyyy-MM-dd"));
  const [date2, setDate2] = useState("");
  const [diffResult, setDiffResult] = useState<{
    totalDays: number;
    duration: Duration;
    isFuture: boolean;
  } | null>(null);

  // Tab 2: Calculator
  const [calcDate, setCalcDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [amount, setAmount] = useState("100");
  const [unit, setUnit] = useState<"days" | "weeks" | "months" | "years">("days");
  const [operation, setOperation] = useState<"add" | "sub">("add");
  const [calcResult, setCalcResult] = useState<Date | null>(null);

  useEffect(() => {
    if (date1 && date2) {
      const d1 = parseISO(date1);
      const d2 = parseISO(date2);
      
      if (isValid(d1) && isValid(d2)) {
        const totalDays = differenceInDays(d2, d1);
        const duration = intervalToDuration({ start: d1, end: d2 });
        
        setDiffResult({
          totalDays: Math.abs(totalDays),
          duration,
          isFuture: totalDays > 0
        });
      }
    } else {
      setDiffResult(null);
    }
  }, [date1, date2]);

  useEffect(() => {
    if (calcDate && amount) {
      const d = parseISO(calcDate);
      const val = parseInt(amount);
      
      if (isValid(d) && !isNaN(val)) {
        const duration = { [unit]: val };
        const res = operation === "add" ? add(d, duration) : sub(d, duration);
        setCalcResult(res);
      }
    } else {
      setCalcResult(null);
    }
  }, [calcDate, amount, unit, operation]);

  return (
    <ToolLayout
      title="Date & D-Day Calculator"
      description="Calculate duration between dates or add/subtract time from a specific date."
    >
      <Tabs defaultValue="dday" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="dday" className="flex items-center gap-2">
            <CalendarIcon className="h-4 w-4" />
            Difference & D-Day
          </TabsTrigger>
          <TabsTrigger value="calc" className="flex items-center gap-2">
            <Calculator className="h-4 w-4" />
            Add / Subtract
          </TabsTrigger>
        </TabsList>

        <TabsContent value="dday">
          <div className="grid gap-6 md:grid-cols-2">
            {/* Input Section */}
            <div className="space-y-4 rounded-lg border p-6 bg-card">
              <h3 className="font-semibold flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Select Dates
              </h3>
              
              <div className="space-y-2">
                <Label htmlFor="date1">Start Date</Label>
                <Input 
                  type="date" 
                  id="date1" 
                  value={date1} 
                  onChange={(e) => setDate1(e.target.value)} 
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="date2">End Date (Target)</Label>
                <Input 
                  type="date" 
                  id="date2" 
                  value={date2} 
                  onChange={(e) => setDate2(e.target.value)} 
                />
              </div>
              
              <div className="flex gap-2 justify-end">
                <Button variant="outline" size="sm" onClick={() => setDate1(format(new Date(), "yyyy-MM-dd"))}>
                  Today
                </Button>
                <Button variant="outline" size="sm" onClick={() => setDate2(format(new Date(), "yyyy-MM-dd"))}>
                  Today
                </Button>
              </div>
            </div>

            {/* Result Section */}
            <div className="space-y-4 rounded-lg border p-6 bg-muted/30 flex flex-col justify-center">
              {diffResult ? (
                <div className="text-center space-y-6">
                  <div>
                    <p className="text-sm text-muted-foreground uppercase tracking-wide mb-1">D-Day Counter</p>
                    <div className={cn(
                      "text-5xl font-bold",
                      diffResult.isFuture ? "text-primary" : "text-destructive"
                    )}>
                      {diffResult.totalDays === 0 ? "D-Day" : (
                        <>D{diffResult.isFuture ? "-" : "+"}{diffResult.totalDays}</>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground mt-2">
                      {diffResult.totalDays} days {diffResult.isFuture ? "left" : "passed"}
                    </p>
                  </div>

                  <div className="h-px bg-border w-full" />

                  <div>
                    <p className="text-sm text-muted-foreground uppercase tracking-wide mb-2">Detailed Duration</p>
                    <div className="flex flex-wrap gap-3 justify-center text-lg font-medium">
                      {diffResult.duration.years ? <span>{diffResult.duration.years} years</span> : null}
                      {diffResult.duration.months ? <span>{diffResult.duration.months} months</span> : null}
                      {diffResult.duration.days ? <span>{diffResult.duration.days} days</span> : null}
                      {Object.keys(diffResult.duration).every(k => !diffResult.duration[k as keyof Duration]) && (
                        <span>Same day</span>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center text-muted-foreground">
                  <CalendarIcon className="h-12 w-12 mx-auto mb-3 opacity-20" />
                  <p>Select both dates to see the difference</p>
                </div>
              )}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="calc">
          <div className="grid gap-6 md:grid-cols-2">
             <div className="space-y-6 rounded-lg border p-6 bg-card">
                <div className="space-y-2">
                  <Label>Start Date</Label>
                  <Input 
                    type="date" 
                    value={calcDate} 
                    onChange={(e) => setCalcDate(e.target.value)} 
                  />
                </div>

                <div className="grid grid-cols-[1fr_1.5fr] gap-4 items-end">
                  <div className="space-y-2">
                    <Label>Operation</Label>
                    <Select value={operation} onValueChange={(v) => setOperation(v as "add" | "sub")}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="add">Add (+)</SelectItem>
                        <SelectItem value="sub">Subtract (-)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Amount</Label>
                    <Input 
                      type="number" 
                      value={amount} 
                      onChange={(e) => setAmount(e.target.value)} 
                      min="0"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Unit</Label>
                  <Select value={unit} onValueChange={(v) => setUnit(v as "days" | "weeks" | "months" | "years")}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="days">Days</SelectItem>
                      <SelectItem value="weeks">Weeks</SelectItem>
                      <SelectItem value="months">Months</SelectItem>
                      <SelectItem value="years">Years</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
             </div>

             <div className="rounded-lg border p-6 bg-muted/30 flex flex-col items-center justify-center text-center space-y-4">
                <p className="text-sm text-muted-foreground uppercase tracking-wide">Result Date</p>
                
                {calcResult ? (
                  <div className="space-y-2 animate-in fade-in zoom-in-95 duration-200">
                    <div className="text-4xl font-bold">
                      {format(calcResult, "MMM d, yyyy")}
                    </div>
                    <div className="text-xl text-muted-foreground">
                      {format(calcResult, "EEEE")}
                    </div>
                  </div>
                ) : (
                   <p className="text-muted-foreground">Invalid input</p>
                )}
             </div>
          </div>
        </TabsContent>
      </Tabs>
    </ToolLayout>
  );
}