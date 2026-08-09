"use client";

import * as React from "react";
import { ToolLayout } from "@/components/tool-layout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RefreshCw, Play } from "lucide-react";

// Sudoku Utility Functions
const isValid = (grid: number[][], r: number, c: number, k: number) => {
  for (let i = 0; i < 9; i++) {
    if (grid[r][i] === k || grid[i][c] === k) return false;
  }
  const br = Math.floor(r / 3) * 3;
  const bc = Math.floor(c / 3) * 3;
  for (let i = 0; i < 3; i++) {
    for (let j = 0; j < 3; j++) {
      if (grid[br + i][bc + j] === k) return false;
    }
  }
  return true;
};

const solve = (grid: number[][]): boolean => {
  for (let r = 0; r < 9; r++) {
    for (let c = 0; c < 9; c++) {
      if (grid[r][c] === 0) {
        for (let k = 1; k <= 9; k++) {
          if (isValid(grid, r, c, k)) {
            grid[r][c] = k;
            if (solve(grid)) return true;
            grid[r][c] = 0;
          }
        }
        return false;
      }
    }
  }
  return true;
};

const generatePuzzle = (): number[][] => {
  const grid = Array(9).fill(0).map(() => Array(9).fill(0));
  // Fill diagonal 3x3 boxes (independent)
  for (let i = 0; i < 9; i += 3) {
    for (let r = 0; r < 3; r++) {
      for (let c = 0; c < 3; c++) {
        let n;
        do { n = Math.floor(Math.random() * 9) + 1; } while (!isValid(grid, i + r, i + c, n));
        grid[i + r][i + c] = n;
      }
    }
  }
  solve(grid);
  // Remove numbers to create puzzle
  for (let i = 0; i < 40; i++) {
    grid[Math.floor(Math.random() * 9)][Math.floor(Math.random() * 9)] = 0;
  }
  return grid;
};

export default function SudokuPage() {
  const [grid, setGrid] = React.useState<number[][]>(() => generatePuzzle());
  const [initialGrid] = React.useState<number[][]>(grid);

  const solvePuzzle = () => {
    const newGrid = grid.map(row => [...row]);
    solve(newGrid);
    setGrid(newGrid);
  };

  return (
    <ToolLayout title="Sudoku" description="Play Sudoku or use the solver.">
      <div className="flex flex-col items-center gap-6">
        <div className="grid grid-cols-9 border-2 border-primary shadow-lg">
          {grid.map((row, r) =>
            row.map((cell, c) => (
              <input
                key={`${r}-${c}`}
                type="text"
                maxLength={1}
                disabled={initialGrid[r][c] !== 0}
                className={`w-10 h-10 border border-muted text-center text-lg font-bold 
                  ${c % 3 === 2 && c !== 8 ? "border-r-2 border-r-primary" : ""}
                  ${r % 3 === 2 && r !== 8 ? "border-b-2 border-b-primary" : ""}
                  ${initialGrid[r][c] !== 0 ? "bg-muted" : "focus:bg-primary/10"}
                `}
                value={cell === 0 ? "" : cell}
                onChange={(e) => {
                  const val = parseInt(e.target.value) || 0;
                  const newGrid = grid.map(row => [...row]);
                  newGrid[r][c] = val;
                  setGrid(newGrid);
                }}
              />
            ))
          )}
        </div>
        <div className="flex gap-4">
          <Button onClick={() => setGrid(generatePuzzle())} variant="outline" className="gap-2">
            <RefreshCw className="h-4 w-4" /> New Puzzle
          </Button>
          <Button onClick={solvePuzzle} className="gap-2">
            <Play className="h-4 w-4" /> Solve
          </Button>
        </div>
      </div>
    </ToolLayout>
  );
}
