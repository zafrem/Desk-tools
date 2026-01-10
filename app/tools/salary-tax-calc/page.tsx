"use client";

import * as React from "react";
import { ToolLayout } from "@/components/tool-layout";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DollarSign } from "lucide-react";

export default function SalaryTaxCalcPage() {
  const [salary, setSalary] = React.useState("50000");
  const [period, setPeriod] = React.useState<"year" | "month">("year");
  const [taxRate, setTaxRate] = React.useState("20");
  
  const results = React.useMemo(() => {
    const gross = parseFloat(salary) || 0;
    const rate = parseFloat(taxRate) || 0;
    
    let annualGross = gross;
    if (period === "month") annualGross = gross * 12;

    const annualTax = annualGross * (rate / 100);
    const annualNet = annualGross - annualTax;

    return {
        annual: {
            gross: annualGross,
            tax: annualTax,
            net: annualNet
        },
        monthly: {
            gross: annualGross / 12,
            tax: annualTax / 12,
            net: annualNet / 12
        },
        weekly: {
            gross: annualGross / 52,
            tax: annualTax / 52,
            net: annualNet / 52
        }
    };
  }, [salary, period, taxRate]);

  const formatMoney = (val: number) => {
      return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(val);
  };

  return (
    <ToolLayout
      title="Salary & Tax Calculator"
      description="Estimate your take-home pay after taxes."
    >
      <div className="grid gap-8 lg:grid-cols-[350px_1fr]">
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>Income Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <Label>Salary Amount</Label>
                        <div className="relative">
                            <DollarSign className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input 
                                type="number" 
                                value={salary} 
                                onChange={(e) => setSalary(e.target.value)} 
                                className="pl-8"
                            />
                        </div>
                    </div>
                    
                    <div className="space-y-2">
                        <Label>Period</Label>
                        <Select value={period} onValueChange={(v) => setPeriod(v as "year" | "month")}>
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="year">Per Year</SelectItem>
                                <SelectItem value="month">Per Month</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <Label>Estimated Tax Rate (%)</Label>
                        <Input 
                            type="number" 
                            value={taxRate} 
                            onChange={(e) => setTaxRate(e.target.value)} 
                        />
                        <p className="text-xs text-muted-foreground">
                            Effective tax rate (Federal + State + Local)
                        </p>
                    </div>
                </CardContent>
            </Card>
        </div>

        <div className="space-y-6">
            <div className="grid md:grid-cols-3 gap-4">
                <Card className="bg-primary/5 border-primary/20">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm text-muted-foreground font-medium">Annual Net Pay</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-primary">{formatMoney(results.annual.net)}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm text-muted-foreground font-medium">Monthly Net Pay</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{formatMoney(results.monthly.net)}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm text-muted-foreground font-medium">Weekly Net Pay</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{formatMoney(results.weekly.net)}</div>
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Detailed Breakdown</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="rounded-md border">
                        <div className="grid grid-cols-4 bg-muted/50 p-3 text-sm font-medium">
                            <div>Period</div>
                            <div className="text-right">Gross Pay</div>
                            <div className="text-right text-red-600">Tax</div>
                            <div className="text-right text-green-600">Net Pay</div>
                        </div>
                        <div className="divide-y">
                            {['annual', 'monthly', 'weekly'].map((p) => {
                                const key = p as keyof typeof results;
                                return (
                                    <div key={p} className="grid grid-cols-4 p-3 text-sm">
                                        <div className="capitalize">{p}</div>
                                        <div className="text-right font-medium">{formatMoney(results[key].gross)}</div>
                                        <div className="text-right text-red-600">{formatMoney(results[key].tax)}</div>
                                        <div className="text-right text-green-600 font-bold">{formatMoney(results[key].net)}</div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
      </div>
    </ToolLayout>
  );
}
