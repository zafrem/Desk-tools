"use client";

import * as React from "react";
import { ToolLayout } from "@/components/tool-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { RefreshCw } from "lucide-react";

export default function RoulettePage() {
  const [options, setOptions] = React.useState("Option 1, Option 2, Option 3, Option 4");
  const [rotation, setRotation] = React.useState(0);
  const [isSpinning, setIsSpinning] = React.useState(false);
  const [result, setResult] = React.useState("");

  const optionList = React.useMemo(() => options.split(",").map((s) => s.trim()).filter(Boolean), [options]);

  const spin = () => {
    if (isSpinning || optionList.length === 0) return;

    setIsSpinning(true);
    setResult("");

    const spins = 5; // number of full rotations
    const randomAngle = Math.floor(Math.random() * 360);
    const totalRotation = rotation + spins * 360 + randomAngle;
    
    setRotation(totalRotation);

    // Determine result based on final angle
    setTimeout(() => {
      setIsSpinning(false);
      const normalizedAngle = randomAngle % 360;
      const sliceAngle = 360 / optionList.length;
      const index = Math.floor(((360 - normalizedAngle) % 360) / sliceAngle);
      setResult(optionList[index]);
    }, 3000); // match transition duration
  };

  return (
    <ToolLayout title="Roulette" description="Spin the wheel to make a random choice.">
      <div className="flex flex-col items-center gap-8">
        <div className="relative w-[min(18rem,80vw)] h-[min(18rem,80vw)]">
          {/* Pointer */}
          <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-4 h-6 bg-primary z-10 clip-path-polygon" />
          
          {/* Wheel */}
          <div
            className="w-full h-full rounded-full border-4 border-muted flex items-center justify-center overflow-hidden transition-transform duration-[3000ms] ease-out"
            style={{ transform: `rotate(${rotation}deg)` }}
          >
            <svg viewBox="0 0 100 100" className="w-full h-full">
              {optionList.map((opt, i) => {
                const angle = 360 / optionList.length;
                const rotation = i * angle;
                return (
                  <g key={i} transform={`rotate(${rotation} 50 50)`}>
                    <path
                      d="M50 50 L50 0 A50 50 0 0 1 100 50 Z"
                      fill={i % 2 === 0 ? "hsl(var(--primary))" : "hsl(var(--muted-foreground)/0.3)"}
                      stroke="white"
                      strokeWidth="0.5"
                    />
                    <text x="75" y="55" fontSize="6" fill="white" className="font-bold" transform={`rotate(${angle/2} 75 55)`}>
                      {opt.slice(0, 8)}
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>
        </div>

        <div className="w-full max-w-sm space-y-4">
          <Input 
            value={options}
            onChange={(e) => setOptions(e.target.value)}
            placeholder="Enter options separated by comma"
          />
          <Button onClick={spin} disabled={isSpinning || optionList.length === 0} className="w-full">
            {isSpinning ? <RefreshCw className="animate-spin mr-2" /> : null}
            Spin!
          </Button>
        </div>

        {result && (
          <div className="text-2xl sm:text-3xl font-bold text-primary animate-bounce text-center px-4 break-words max-w-full">
            Result: {result}
          </div>
        )}
      </div>
      <style jsx global>{`
        .clip-path-polygon {
          clip-path: polygon(50% 100%, 0 0, 100% 0);
        }
      `}</style>
    </ToolLayout>
  );
}
