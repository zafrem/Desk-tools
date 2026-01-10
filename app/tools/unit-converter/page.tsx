"use client";

import * as React from "react";
import { ToolLayout } from "@/components/tool-layout";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowRight } from "lucide-react";

// Simplified Unit Definitions
const UNITS = {
  length: {
    m: 1,
    km: 0.001,
    cm: 100,
    mm: 1000,
    mi: 0.000621371,
    yd: 0.0009144,
    ft: 3.28084,
    in: 39.3701,
  },
  weight: {
    kg: 1,
    g: 1000,
    mg: 1000000,
    lb: 2.20462,
    oz: 35.274,
  },
  temperature: {
    // Custom logic required for temp
    c: "Celsius",
    f: "Fahrenheit",
    k: "Kelvin",
  },
};

type Category = "length" | "weight" | "temperature";

export default function UnitConverterPage() {
  const [category, setCategory] = React.useState<Category>("length");
  const [fromUnit, setFromUnit] = React.useState("m");
  const [toUnit, setToUnit] = React.useState("ft");
  const [value, setValue] = React.useState("1");
  const [result, setResult] = React.useState("");

  // Update units when category changes
  React.useEffect(() => {
    if (category === "length") {
        setFromUnit("m");
        setToUnit("ft");
    } else if (category === "weight") {
        setFromUnit("kg");
        setToUnit("lb");
    } else if (category === "temperature") {
        setFromUnit("c");
        setToUnit("f");
    }
  }, [category]);

  React.useEffect(() => {
    const val = parseFloat(value);
    if (isNaN(val)) {
        setResult("");
        return;
    }

    if (category === "temperature") {
        let celsius = val;
        if (fromUnit === "f") celsius = (val - 32) * 5/9;
        if (fromUnit === "k") celsius = val - 273.15;
        
        let target = celsius;
        if (toUnit === "f") target = (celsius * 9/5) + 32;
        if (toUnit === "k") target = celsius + 273.15;
        
        setResult(target.toFixed(2));
    } else {
        // Standard multiplicative conversion
        // Base unit is always the one with factor 1 (e.g. meters, kg)
        // val * (toFactor / fromFactor) ?? No.
        // val (from) -> Base -> to
        // val / fromFactor * toFactor ??? 
        // Let's use Base = 1.
        // 1 km = 1000 m. Factor for km should be 0.001? Or relative to base?
        // Let's stick to: Base unit value = value / factor (if factor is how many base units in 1 unit) 
        // OR Base unit value = value * factor (if factor is how many units in 1 base unit)
        // My definition above: m=1, km=0.001. So 1m = 0.001km. Factor is "units per meter".
        // So 1 meter * 0.001 = 0.001 km. Correct.
        // To convert FROM 'km' TO 'm':
        // Value(km) / Factor(km) = Value(m)  => 1 / 0.001 = 1000. Correct.
        // So: BaseVal = val / factorFrom
        // TargetVal = BaseVal * factorTo
        
        const factors = UNITS[category as "length" | "weight"];
        const factorFrom = factors[fromUnit as keyof typeof factors];
        const factorTo = factors[toUnit as keyof typeof factors];
        
        const converted = (val / factorFrom) * factorTo;
        setResult(converted.toLocaleString(undefined, { maximumFractionDigits: 6 }));
    }
  }, [value, fromUnit, toUnit, category]);

  return (
    <ToolLayout
      title="Unit Converter"
      description="Convert between common units of measurement."
    >
      <div className="max-w-3xl mx-auto space-y-8">
        <Tabs value={category} onValueChange={(v) => setCategory(v as Category)}>
            <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="length">Length</TabsTrigger>
                <TabsTrigger value="weight">Weight</TabsTrigger>
                <TabsTrigger value="temperature">Temperature</TabsTrigger>
            </TabsList>
        </Tabs>

        <div className="grid md:grid-cols-[1fr_auto_1fr] gap-4 items-center">
            <div className="space-y-2">
                <Label>From</Label>
                <div className="flex gap-2">
                    <Input 
                        type="number" 
                        value={value} 
                        onChange={(e) => setValue(e.target.value)} 
                    />
                    <Select value={fromUnit} onValueChange={setFromUnit}>
                        <SelectTrigger className="w-[100px]">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            {Object.keys(UNITS[category]).map(u => (
                                <SelectItem key={u} value={u}>{u.toUpperCase()}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            </div>

            <div className="flex justify-center pt-6">
                <ArrowRight className="h-6 w-6 text-muted-foreground" />
            </div>

            <div className="space-y-2">
                <Label>To</Label>
                <div className="flex gap-2">
                    <div className="flex-1 h-10 px-3 py-2 rounded-md border bg-muted/50 flex items-center font-medium">
                        {result || "..."}
                    </div>
                    <Select value={toUnit} onValueChange={setToUnit}>
                        <SelectTrigger className="w-[100px]">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            {Object.keys(UNITS[category]).map(u => (
                                <SelectItem key={u} value={u}>{u.toUpperCase()}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            </div>
        </div>
      </div>
    </ToolLayout>
  );
}
