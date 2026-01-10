"use client";

import * as React from "react";
import { ToolLayout } from "@/components/tool-layout";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calculator, Percent, Calendar } from "lucide-react";

interface LoanResult {
  monthlyPayment: number;
  totalPayment: number;
  totalInterest: number;
  amortizationSchedule: {
    month: number;
    payment: number;
    principal: number;
    interest: number;
    balance: number;
  }[];
}

const CURRENCIES = {
  USD: { symbol: "$", locale: "en-US", name: "USD - US Dollar" },
  EUR: { symbol: "€", locale: "de-DE", name: "EUR - Euro" },
  GBP: { symbol: "£", locale: "en-GB", name: "GBP - British Pound" },
  CNY: { symbol: "¥", locale: "zh-CN", name: "CNY - Chinese Yuan" },
  JPY: { symbol: "¥", locale: "ja-JP", name: "JPY - Japanese Yen" },
  KRW: { symbol: "₩", locale: "ko-KR", name: "KRW - Korean Won" },
};

export default function LoanCalculatorPage() {
  const [amount, setAmount] = React.useState("10000");
  const [rate, setRate] = React.useState("5.0");
  const [term, setTerm] = React.useState("12");
  const [termUnit, setTermUnit] = React.useState<"months" | "years">("months");
  const [currency, setCurrency] = React.useState<keyof typeof CURRENCIES>("USD");
  
  const [result, setResult] = React.useState<LoanResult | null>(null);

  const calculateLoan = () => {
    const principal = parseFloat(amount);
    const annualRate = parseFloat(rate);
    const period = parseFloat(term);

    if (isNaN(principal) || isNaN(annualRate) || isNaN(period) || principal <= 0 || period <= 0) {
      setResult(null);
      return;
    }

    const monthlyRate = annualRate / 100 / 12;
    const totalMonths = termUnit === "years" ? period * 12 : period;

    let monthlyPayment = 0;
    if (monthlyRate === 0) {
      monthlyPayment = principal / totalMonths;
    } else {
      monthlyPayment = (principal * monthlyRate * Math.pow(1 + monthlyRate, totalMonths)) / (Math.pow(1 + monthlyRate, totalMonths) - 1);
    }

    const totalPayment = monthlyPayment * totalMonths;
    const totalInterest = totalPayment - principal;

    // Generate Schedule
    const schedule = [];
    let balance = principal;
    for (let i = 1; i <= totalMonths; i++) {
      const interestPart = balance * monthlyRate;
      const principalPart = monthlyPayment - interestPart;
      balance -= principalPart;
      
      // Fix potential floating point issues at the end
      if (balance < 0) balance = 0;

      schedule.push({
        month: i,
        payment: monthlyPayment,
        principal: principalPart,
        interest: interestPart,
        balance: balance
      });
    }

    setResult({
      monthlyPayment,
      totalPayment,
      totalInterest,
      amortizationSchedule: schedule
    });
  };

  React.useEffect(() => {
    calculateLoan();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [amount, rate, term, termUnit]);

  const formatMoney = (val: number) => {
    return new Intl.NumberFormat(CURRENCIES[currency].locale, {
      style: "currency",
      currency: currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(val);
  };

  return (
    <ToolLayout
      title="Loan Calculator"
      description="Calculate estimated monthly payments, total interest, and amortization schedule."
    >
      <div className="grid gap-6 md:grid-cols-[350px_1fr]">
        {/* Input Section */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calculator className="h-5 w-5" /> Loan Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Currency</Label>
                <Select value={currency} onValueChange={(v) => setCurrency(v as keyof typeof CURRENCIES)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(CURRENCIES).map(([code, info]) => (
                      <SelectItem key={code} value={code}>
                        {info.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="amount">Loan Amount</Label>
                <div className="relative">
                  <div className="absolute left-2 top-2.5 h-4 w-4 flex items-center justify-center text-muted-foreground font-bold">
                    {CURRENCIES[currency].symbol}
                  </div>
                  <Input 
                    id="amount" 
                    type="number" 
                    value={amount} 
                    onChange={(e) => setAmount(e.target.value)}
                    className="pl-8" 
                    placeholder="e.g. 10000"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="rate">Annual Interest Rate (%)</Label>
                <div className="relative">
                  <Percent className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input 
                    id="rate" 
                    type="number" 
                    value={rate} 
                    onChange={(e) => setRate(e.target.value)}
                    className="pl-8" 
                    placeholder="e.g. 5.0"
                    step="0.1"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="term">Loan Term</Label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Calendar className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input 
                        id="term" 
                        type="number" 
                        value={term} 
                        onChange={(e) => setTerm(e.target.value)}
                        className="pl-8" 
                        placeholder="e.g. 12"
                    />
                  </div>
                  <Select value={termUnit} onValueChange={(v) => setTermUnit(v as "months" | "years")}>
                    <SelectTrigger className="w-[110px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="months">Months</SelectItem>
                      <SelectItem value="years">Years</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <Button className="w-full" onClick={calculateLoan}>
                Calculate
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Results Section */}
        <div className="space-y-6">
          {result ? (
            <div className="space-y-6">
                <div className="grid gap-4 md:grid-cols-3">
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">Monthly Payment</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{formatMoney(result.monthlyPayment)}</div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">Total Interest</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-destructive">{formatMoney(result.totalInterest)}</div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">Total Payment</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{formatMoney(result.totalPayment)}</div>
                        </CardContent>
                    </Card>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>Amortization Schedule</CardTitle>
                    </CardHeader>
                    <CardContent className="p-0 max-h-[400px] overflow-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-muted text-muted-foreground sticky top-0">
                                <tr>
                                    <th className="p-3 font-medium">Month</th>
                                    <th className="p-3 font-medium">Payment</th>
                                    <th className="p-3 font-medium">Principal</th>
                                    <th className="p-3 font-medium">Interest</th>
                                    <th className="p-3 font-medium">Balance</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y">
                                {result.amortizationSchedule.map((row) => (
                                    <tr key={row.month} className="hover:bg-muted/50">
                                        <td className="p-3">{row.month}</td>
                                        <td className="p-3">{formatMoney(row.payment)}</td>
                                        <td className="p-3 text-green-600 dark:text-green-400">{formatMoney(row.principal)}</td>
                                        <td className="p-3 text-red-600 dark:text-red-400">{formatMoney(row.interest)}</td>
                                        <td className="p-3 font-medium">{formatMoney(row.balance)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </CardContent>
                </Card>
            </div>
          ) : (
            <div className="h-full flex items-center justify-center p-8 border rounded-lg bg-muted/10 text-muted-foreground">
                Enter valid loan details to see the calculation.
            </div>
          )}
        </div>
      </div>
    </ToolLayout>
  );
}