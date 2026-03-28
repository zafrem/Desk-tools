"use client";

import * as React from "react";
import { ToolLayout } from "@/components/tool-layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { History, Delete, DeleteIcon, Eraser, RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils";

type Operation = "+" | "-" | "*" | "/" | "^" | null;

export default function ScientificCalculatorPage() {
  const [display, setDisplay] = React.useState("0");
  const [equation, setEquation] = React.useState("");
  const [history, setHistory] = React.useState<{ eq: string; res: string }[]>([]);
  const [shouldReset, setShouldReset] = React.useState(false);

  const formatNumber = (num: number) => {
    if (isNaN(num)) return "Error";
    if (!isFinite(num)) return "Infinity";
    const str = num.toString();
    if (str.length > 12) {
      return num.toPrecision(8);
    }
    return str;
  };

  const handleDigit = (digit: string) => {
    if (display === "0" || shouldReset) {
      setDisplay(digit);
      setShouldReset(false);
    } else {
      if (display.length < 15) {
        setDisplay(display + digit);
      }
    }
  };

  const handleDecimal = () => {
    if (shouldReset) {
      setDisplay("0.");
      setShouldReset(false);
    } else if (!display.includes(".")) {
      setDisplay(display + ".");
    }
  };

  const handleOperator = (op: string) => {
    setEquation(display + " " + op + " ");
    setShouldReset(true);
  };

  const handleClear = () => {
    setDisplay("0");
    setEquation("");
    setShouldReset(false);
  };

  const handleBackspace = () => {
    if (display.length > 1) {
      setDisplay(display.slice(0, -1));
    } else {
      setDisplay("0");
    }
  };

  const calculate = () => {
    try {
      if (!equation) return;
      
      const fullEquation = equation + display;
      // Using a safe eval-like approach for simple math
      // Replace ^ with ** for JS power operator
      const sanitized = fullEquation.replace(/×/g, "*").replace(/÷/g, "/").replace(/\^/g, "**");
      
      // Basic validation: only numbers and operators
      if (!/^[\d\.\s\+\-\*\/\(\)\*]+$/.test(sanitized)) {
        throw new Error("Invalid input");
      }
      
      const result = eval(sanitized);
      const formattedResult = formatNumber(result);
      
      setHistory([{ eq: fullEquation, res: formattedResult }, ...history].slice(0, 10));
      setDisplay(formattedResult);
      setEquation("");
      setShouldReset(true);
    } catch {
      setDisplay("Error");
      setShouldReset(true);
    }
  };

  const handleMathFunc = (func: string) => {
    const val = parseFloat(display);
    let result: number;

    switch (func) {
      case "sin": result = Math.sin(val * (Math.PI / 180)); break;
      case "cos": result = Math.cos(val * (Math.PI / 180)); break;
      case "tan": result = Math.tan(val * (Math.PI / 180)); break;
      case "asin": result = Math.asin(val) * (180 / Math.PI); break;
      case "acos": result = Math.acos(val) * (180 / Math.PI); break;
      case "atan": result = Math.atan(val) * (180 / Math.PI); break;
      case "log": result = Math.log10(val); break;
      case "ln": result = Math.log(val); break;
      case "sqrt": result = Math.sqrt(val); break;
      case "pow2": result = Math.pow(val, 2); break;
      case "pow3": result = Math.pow(val, 3); break;
      case "exp": result = Math.exp(val); break;
      case "abs": result = Math.abs(val); break;
      case "pi": result = Math.PI; break;
      case "e": result = Math.E; break;
      default: return;
    }

    const formattedResult = formatNumber(result);
    setHistory([{ eq: `${func}(${display})`, res: formattedResult }, ...history].slice(0, 10));
    setDisplay(formattedResult);
    setShouldReset(true);
  };

  const CalcButton = ({ 
    label, 
    onClick, 
    variant = "outline", 
    className 
  }: { 
    label: string | React.ReactNode; 
    onClick: () => void; 
    variant?: "outline" | "default" | "secondary" | "destructive" | "ghost";
    className?: string;
  }) => (
    <Button
      variant={variant}
      onClick={onClick}
      className={cn("h-12 text-lg font-medium", className)}
    >
      {label}
    </Button>
  );

  return (
    <ToolLayout
      title="Scientific Calculator"
      description="Advanced calculations including trigonometry, logs, and powers."
    >
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <Card className="bg-muted/30">
            <CardContent className="p-4 space-y-2">
              <div className="text-right text-sm text-muted-foreground h-6 font-mono overflow-hidden">
                {equation}
              </div>
              <div className="text-right text-4xl font-bold font-mono overflow-hidden whitespace-nowrap">
                {display}
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
            {/* Scientific Row 1 */}
            <CalcButton label="sin" onClick={() => handleMathFunc("sin")} variant="secondary" className="text-sm" />
            <CalcButton label="cos" onClick={() => handleMathFunc("cos")} variant="secondary" className="text-sm" />
            <CalcButton label="tan" onClick={() => handleMathFunc("tan")} variant="secondary" className="text-sm" />
            <CalcButton label="asin" onClick={() => handleMathFunc("asin")} variant="secondary" className="text-sm" />
            <CalcButton label="acos" onClick={() => handleMathFunc("acos")} variant="secondary" className="text-sm hidden sm:flex" />
            <CalcButton label="atan" onClick={() => handleMathFunc("atan")} variant="secondary" className="text-sm hidden sm:flex" />

            {/* Scientific Row 2 */}
            <CalcButton label="log" onClick={() => handleMathFunc("log")} variant="secondary" className="text-sm" />
            <CalcButton label="ln" onClick={() => handleMathFunc("ln")} variant="secondary" className="text-sm" />
            <CalcButton label="√" onClick={() => handleMathFunc("sqrt")} variant="secondary" className="text-xl" />
            <CalcButton label="x²" onClick={() => handleMathFunc("pow2")} variant="secondary" className="text-sm" />
            <CalcButton label="x³" onClick={() => handleMathFunc("pow3")} variant="secondary" className="text-sm hidden sm:flex" />
            <CalcButton label="eˣ" onClick={() => handleMathFunc("exp")} variant="secondary" className="text-sm hidden sm:flex" />

            {/* Scientific Row 3 */}
            <CalcButton label="π" onClick={() => handleMathFunc("pi")} variant="secondary" className="text-xl" />
            <CalcButton label="e" onClick={() => handleMathFunc("e")} variant="secondary" className="text-xl" />
            <CalcButton label="abs" onClick={() => handleMathFunc("abs")} variant="secondary" className="text-sm" />
            <CalcButton label="^" onClick={() => handleOperator("^")} variant="secondary" className="text-xl" />
            <CalcButton label="(" onClick={() => handleDigit("(")} variant="secondary" className="text-xl hidden sm:flex" />
            <CalcButton label=")" onClick={() => handleDigit(")")} variant="secondary" className="text-xl hidden sm:flex" />

            {/* Standard Row 1 */}
            <CalcButton label="C" onClick={handleClear} variant="destructive" />
            <CalcButton label={<RotateCcw className="h-5 w-5" />} onClick={handleBackspace} variant="outline" />
            <CalcButton label="÷" onClick={() => handleOperator("/")} variant="default" className="text-xl" />
            <CalcButton label="×" onClick={() => handleOperator("*")} variant="default" className="text-xl" />
            
            {/* Standard Numbers & Ops */}
            <CalcButton label="7" onClick={() => handleDigit("7")} />
            <CalcButton label="8" onClick={() => handleDigit("8")} />
            <CalcButton label="9" onClick={() => handleDigit("9")} />
            <CalcButton label="-" onClick={() => handleOperator("-")} variant="default" className="text-2xl" />
            
            <CalcButton label="4" onClick={() => handleDigit("4")} />
            <CalcButton label="5" onClick={() => handleDigit("5")} />
            <CalcButton label="6" onClick={() => handleDigit("6")} />
            <CalcButton label="+" onClick={() => handleOperator("+")} variant="default" className="text-2xl" />
            
            <CalcButton label="1" onClick={() => handleDigit("1")} />
            <CalcButton label="2" onClick={() => handleDigit("2")} />
            <CalcButton label="3" onClick={() => handleDigit("3")} />
            <CalcButton label="=" onClick={calculate} variant="destructive" className="row-span-2 h-full text-2xl" />
            
            <CalcButton label="0" onClick={() => handleDigit("0")} className="col-span-2" />
            <CalcButton label="." onClick={handleDecimal} />
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <History className="h-5 w-5" />
              History
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {history.length > 0 ? (
              history.map((item, i) => (
                <div key={i} className="text-right border-b pb-2 last:border-0">
                  <div className="text-xs text-muted-foreground font-mono">{item.eq}</div>
                  <div className="text-sm font-bold font-mono text-primary cursor-pointer" onClick={() => setDisplay(item.res)}>
                    {item.res}
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center text-sm text-muted-foreground py-8">
                No recent calculations
              </div>
            )}
            {history.length > 0 && (
              <Button variant="ghost" size="sm" onClick={() => setHistory([])} className="w-full text-xs">
                Clear History
              </Button>
            )}
          </CardContent>
        </Card>
      </div>
    </ToolLayout>
  );
}
