/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import * as React from "react";
import { ToolLayout } from "@/components/tool-layout";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  AreaChart,
  Area,
} from "recharts";

type Frequency = "monthly" | "quarterly" | "annually";

interface CalculationResult {
  year: number;
  principal: number;
  interest: number;
  total: number;
}

export default function CompoundInterestCalculatorPage() {
  // Inputs
  const [principal, setPrincipal] = React.useState("10000");
  const [rate, setRate] = React.useState("7");
  const [years, setYears] = React.useState("10");
  const [contribution, setContribution] = React.useState("500");
  const [frequency, setFrequency] = React.useState<Frequency>("monthly");
  const [inflationRate, setInflationRate] = React.useState("2.5");
  const [taxRate, setTaxRate] = React.useState("15.4"); // Default KR tax
  
  // Toggles
  const [useInflation, setUseInflation] = React.useState(false);
  const [useTax, setUseTax] = React.useState(false);
  const [currency, setCurrency] = React.useState<"KRW" | "USD">("KRW");

  // Results
  const [data, setData] = React.useState<CalculationResult[]>([]);
  const [summary, setSummary] = React.useState({
    totalPrincipal: 0,
    totalInterest: 0,
    futureValue: 0,
    returnRate: 0,
  });

  const calculate = React.useCallback(() => {
    const p = parseFloat(principal) || 0;
    const r = parseFloat(rate) / 100 || 0;
    const y = parseFloat(years) || 0;
    const c = parseFloat(contribution) || 0;
    const inf = useInflation ? (parseFloat(inflationRate) / 100 || 0) : 0;
    const tax = useTax ? (parseFloat(taxRate) / 100 || 0) : 0;

    // Determine compounds per year
    let n = 1;
    if (frequency === "monthly") n = 12;
    if (frequency === "quarterly") n = 4;

    const chartData: CalculationResult[] = [];
    let currentBalance = p;
    let totalContributed = p;
    
    // Real rate of return approximation: (1+r)/(1+i) - 1
    // or simply adjust the rate: r_adj = r - inf
    // More accurate: effective_rate = (1 + r) / (1 + inf) - 1
    const effectiveRate = useInflation ? ((1 + r) / (1 + inf) - 1) : r;
    
    // We calculate step-by-step for the chart
    // Step size: 1 year for the chart, but compounding happens 'n' times
    
    for (let i = 0; i <= y; i++) {
        // Just storing snapshots at year end
        // However, we need to calculate compounding correctly
        
        if (i === 0) {
            chartData.push({
                year: 0,
                principal: p,
                interest: 0,
                total: p,
            });
            continue;
        }

        // Calculate for this year
        // FV = P * (1 + r/n)^(n*t) + PMT * ... formula is complex for variable snapshot
        // Iterative approach is cleaner for chart generation
        
        // Simple yearly iteration with sub-periods
        for (let j = 0; j < n; j++) {
            currentBalance += currentBalance * (effectiveRate / n); // Interest
            currentBalance += c; // Contribution
            totalContributed += c;
        }
        
        // Apply Tax on Gains if needed (Usually tax is deferred or realized at end, but for "After-tax" view we estimate)
        // If we want "Snapshot of value if withdrawn now", we tax the gains.
        let displayValue = currentBalance;
        const totalInterest = currentBalance - totalContributed;
        
        if (useTax && totalInterest > 0) {
            const taxAmount = totalInterest * tax;
            displayValue -= taxAmount;
            // Note: totalContributed stays same
        }

        chartData.push({
            year: i,
            principal: totalContributed,
            interest: displayValue - totalContributed,
            total: displayValue
        });
    }

    const last = chartData[chartData.length - 1];
    setData(chartData);
    setSummary({
        totalPrincipal: last.principal,
        totalInterest: last.interest,
        futureValue: last.total,
        returnRate: last.principal > 0 ? (last.interest / last.principal) * 100 : 0
    });

  }, [principal, rate, years, contribution, frequency, inflationRate, taxRate, useInflation, useTax]);

  React.useEffect(() => {
    calculate();
  }, [calculate]);

  const formatMoney = (val: number) => {
    return new Intl.NumberFormat(currency === "KRW" ? "ko-KR" : "en-US", {
      style: "currency",
      currency: currency,
      maximumFractionDigits: 0,
    }).format(val);
  };

  return (
    <ToolLayout
      title="Compound Interest Calculator"
      description="Simulate wealth growth with compound interest, regular contributions, and inflation adjustments."
    >
      <div className="grid gap-8 lg:grid-cols-[350px_1fr]">
        {/* Controls */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Investment Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
               <div className="space-y-2">
                 <Label>Currency</Label>
                 <div className="flex gap-2">
                    <Button 
                        size="sm" 
                        variant={currency === "KRW" ? "default" : "outline"}
                        onClick={() => setCurrency("KRW")}
                        className="flex-1"
                    >
                        ₩ KRW
                    </Button>
                    <Button 
                        size="sm" 
                        variant={currency === "USD" ? "default" : "outline"}
                        onClick={() => setCurrency("USD")}
                        className="flex-1"
                    >
                        $ USD
                    </Button>
                 </div>
               </div>

               <div className="space-y-2">
                 <Label>Initial Principal</Label>
                 <Input 
                    type="number" 
                    value={principal} 
                    onChange={(e) => setPrincipal(e.target.value)} 
                 />
               </div>

               <div className="space-y-2">
                 <Label>Annual Interest Rate (%)</Label>
                 <div className="flex items-center gap-2">
                    <Slider 
                        value={[parseFloat(rate)]} 
                        min={0} max={20} step={0.1}
                        onValueChange={(v) => setRate(v[0].toString())}
                        className="flex-1"
                    />
                    <Input 
                        type="number" 
                        value={rate} 
                        onChange={(e) => setRate(e.target.value)} 
                        className="w-20"
                    />
                 </div>
               </div>

               <div className="space-y-2">
                 <Label>Years to Grow</Label>
                 <Input 
                    type="number" 
                    value={years} 
                    onChange={(e) => setYears(e.target.value)} 
                 />
               </div>

               <div className="space-y-2">
                 <Label>Compound Frequency</Label>
                 <Select value={frequency} onValueChange={(v) => setFrequency(v as Frequency)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                        <SelectItem value="monthly">Monthly</SelectItem>
                        <SelectItem value="quarterly">Quarterly</SelectItem>
                        <SelectItem value="annually">Annually</SelectItem>
                    </SelectContent>
                 </Select>
               </div>

               <div className="space-y-2">
                 <Label>Regular Contribution ({frequency})</Label>
                 <Input 
                    type="number" 
                    value={contribution} 
                    onChange={(e) => setContribution(e.target.value)} 
                 />
               </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
                <CardTitle className="text-lg">Advanced Options</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                    <Label className="flex items-center gap-2">
                        Inflation Adjustment
                        {useInflation && <span className="text-xs text-muted-foreground">({inflationRate}%)</span>}
                    </Label>
                    <Button 
                        size="sm" 
                        variant={useInflation ? "default" : "secondary"}
                        onClick={() => setUseInflation(!useInflation)}
                        className="h-6 text-xs"
                    >
                        {useInflation ? "On" : "Off"}
                    </Button>
                </div>
                {useInflation && (
                    <Input 
                        type="number" 
                        value={inflationRate} 
                        onChange={(e) => setInflationRate(e.target.value)}
                        placeholder="Inflation %"
                    />
                )}

                <div className="flex items-center justify-between">
                    <Label className="flex items-center gap-2">
                        Tax Deduction
                        {useTax && <span className="text-xs text-muted-foreground">({taxRate}%)</span>}
                    </Label>
                    <Button 
                        size="sm" 
                        variant={useTax ? "default" : "secondary"}
                        onClick={() => setUseTax(!useTax)}
                        className="h-6 text-xs"
                    >
                        {useTax ? "On" : "Off"}
                    </Button>
                </div>
                {useTax && (
                    <Input 
                        type="number" 
                        value={taxRate} 
                        onChange={(e) => setTaxRate(e.target.value)}
                        placeholder="Tax Rate %"
                    />
                )}
            </CardContent>
          </Card>
        </div>

        {/* Visualization & Summary */}
        <div className="space-y-6">
            <div className="grid gap-4 md:grid-cols-3">
                <Card className="bg-primary/5 border-primary/20">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Future Value</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-primary">{formatMoney(summary.futureValue)}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Total Interest</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-green-600">{formatMoney(summary.totalInterest)}</div>
                        <div className="text-xs text-muted-foreground">+{summary.returnRate.toFixed(1)}% return</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Total Principal</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{formatMoney(summary.totalPrincipal)}</div>
                    </CardContent>
                </Card>
            </div>

            <Card className="h-[400px]">
                <CardHeader>
                    <CardTitle>Growth Chart</CardTitle>
                </CardHeader>
                <CardContent className="h-[320px]">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                            <defs>
                                <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#8884d8" stopOpacity={0.8}/>
                                    <stop offset="95%" stopColor="#8884d8" stopOpacity={0}/>
                                </linearGradient>
                                <linearGradient id="colorPrincipal" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#82ca9d" stopOpacity={0.8}/>
                                    <stop offset="95%" stopColor="#82ca9d" stopOpacity={0}/>
                                </linearGradient>
                            </defs>
                            <XAxis dataKey="year" label={{ value: 'Years', position: 'insideBottomRight', offset: -5 }} />
                            <YAxis tickFormatter={(value) => 
                                new Intl.NumberFormat('en', { notation: "compact", compactDisplay: "short" }).format(value)
                            }/>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} />
                            <Tooltip 
                                formatter={(value: any) => formatMoney(value || 0)}
                                labelFormatter={(label) => `Year ${label}`}
                            />
                            <Legend />
                            <Area 
                                type="monotone" 
                                dataKey="total" 
                                stroke="#8884d8" 
                                fillOpacity={1} 
                                fill="url(#colorTotal)" 
                                name="Total Balance"
                            />
                            <Area 
                                type="monotone" 
                                dataKey="principal" 
                                stroke="#82ca9d" 
                                fillOpacity={1} 
                                fill="url(#colorPrincipal)" 
                                name="Principal"
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle className="text-sm">Summary Analysis</CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-muted-foreground">
                    <p>
                        In <strong>{years} years</strong>, your investment of <strong>{formatMoney(summary.totalPrincipal)}</strong> will grow to <strong>{formatMoney(summary.futureValue)}</strong>. 
                        You will earn <strong>{formatMoney(summary.totalInterest)}</strong> in interest.
                    </p>
                    {useInflation && (
                        <p className="mt-2 text-xs">
                            * Values are adjusted for <strong>{inflationRate}%</strong> annual inflation (real purchasing power).
                        </p>
                    )}
                    {useTax && (
                        <p className="mt-1 text-xs">
                            * Estimated tax of <strong>{taxRate}%</strong> has been deducted from the earnings.
                        </p>
                    )}
                </CardContent>
            </Card>
        </div>
      </div>
    </ToolLayout>
  );
}
