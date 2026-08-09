"use client";

import * as React from "react";
import { ToolLayout } from "@/components/tool-layout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function SudokuPage() {
  // Simple 9x9 grid
  const [grid, setGrid] = React.useState<number[][]>(Array(9).fill(0).map(() => Array(9).fill(0)));

  return (
    <ToolLayout
      title="Sudoku"
      description="Play Sudoku puzzle."
    >
      <div className="flex flex-col items-center gap-6">
        <div className="grid grid-cols-9 border-2 border-primary">
            {grid.map((row, rowIndex) => 
                row.map((cell, colIndex) => (
                    <input
                        key={`${rowIndex}-${colIndex}`}
                        type="text"
                        maxLength={1}
                        className="w-10 h-10 border border-muted text-center text-lg font-bold focus:bg-primary/10"
                        value={cell === 0 ? "" : cell}
                        onChange={(e) => {
                            const val = parseInt(e.target.value) || 0;
                            const newGrid = [...grid];
                            newGrid[rowIndex][colIndex] = val;
                            setGrid(newGrid);
                        }}
                    />
                ))
            )}
        </div>
        <Button onClick={() => setGrid(Array(9).fill(0).map(() => Array(9).fill(0)))}>Reset</Button>
      </div>
    </ToolLayout>
  );
}
