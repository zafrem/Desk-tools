"use client";

import * as React from "react";
import { ToolLayout } from "@/components/tool-layout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Play,
  RefreshCw,
  UserPlus,
  UserMinus,
  HelpCircle,
  Trophy,
  Coffee,
  CheckCircle2,
  Users,
  Eye,
  Undo2,
} from "lucide-react";

interface Rung {
  id: string;
  col: number; // Left line index of the rung (0 to numPlayers - 2)
  y: number;   // Height position (40 to 360)
}

interface TracedPath {
  playerIndex: number;
  points: { x: number; y: number }[];
  color: string;
  resultIndex: number;
}

const COLORS = [
  "#EF4444", // Red
  "#3B82F6", // Blue
  "#10B981", // Green
  "#F59E0B", // Orange
  "#8B5CF6", // Purple
  "#EC4899", // Pink
  "#06B6D4", // Cyan
  "#14B8A6", // Teal
  "#84CC16", // Lime
  "#6366F1", // Indigo
];

export default function LadderPage() {
  const [numPlayers, setNumPlayers] = React.useState(4);
  const [names, setNames] = React.useState<string[]>(["Player 1", "Player 2", "Player 3", "Player 4"]);
  const [results, setResults] = React.useState<string[]>(["WIN 👑", "Pass", "Pass", "Pass"]);
  const [rungs, setRungs] = React.useState<Rung[]>([]);
  const [isGenerated, setIsGenerated] = React.useState(false);

  // Animation & Path Tracing States
  const [activeTraces, setActiveTraces] = React.useState<Record<number, TracedPath>>({});
  const [animationState, setAnimationState] = React.useState<{
    playerIndex: number;
    pathPoints: { x: number; y: number }[];
    currentPointIndex: number;
    currentPos: { x: number; y: number };
    progress: number; // 0 to 1 between currentPointIndex and currentPointIndex + 1
  } | null>(null);

  const [revealedResults, setRevealedResults] = React.useState<Record<number, boolean>>({});
  const [completedMatches, setCompletedMatches] = React.useState<Record<number, number>>({}); // playerIndex -> resultIndex

  const LADDER_HEIGHT = 400;
  const LADDER_WIDTH = 600;

  // React on changes to player count
  React.useEffect(() => {
    setNames((prev) => {
      const next = [...prev];
      if (next.length < numPlayers) {
        for (let i = next.length; i < numPlayers; i++) {
          next.push(`Player ${i + 1}`);
        }
      } else {
        next.splice(numPlayers);
      }
      return next;
    });

    setResults((prev) => {
      const next = [...prev];
      if (next.length < numPlayers) {
        for (let i = next.length; i < numPlayers; i++) {
          next.push(`Result ${i + 1}`);
        }
      } else {
        next.splice(numPlayers);
      }
      return next;
    });

    setIsGenerated(false);
    setActiveTraces({});
    setRevealedResults({});
    setCompletedMatches({});
  }, [numPlayers]);

  // Adjust player count
  const handleNumPlayersChange = (val: number) => {
    const clamped = Math.max(2, Math.min(10, val));
    setNumPlayers(clamped);
  };

  // Predefined Result Templates
  const applyPreset = (type: "winner" | "coffee" | "numbers") => {
    if (type === "winner") {
      const next = Array(numPlayers).fill("Pass");
      next[0] = "WINNER 👑";
      setResults(next);
    } else if (type === "coffee") {
      const next = Array(numPlayers).fill("SAFE ☕");
      next[Math.floor(Math.random() * numPlayers)] = "BUY COFFEE 💸";
      setResults(next);
    } else if (type === "numbers") {
      setResults(Array(numPlayers).fill(0).map((_, i) => `${i + 1}`));
    }
  };

  // Generate unique and randomized rungs
  const generateLadder = () => {
    const newRungs: Rung[] = [];
    const levels = 8; // vertical slices
    const levelHeight = (LADDER_HEIGHT - 60) / levels;

    for (let lvl = 0; lvl < levels; lvl++) {
      const baseY = 40 + lvl * levelHeight;
      // To avoid rungs connecting directly (e.g. adjacent columns at same level)
      let prevColPlaced = false;

      for (let col = 0; col < numPlayers - 1; col++) {
        if (prevColPlaced) {
          prevColPlaced = false;
          continue;
        }

        // 65% chance of placing a rung
        if (Math.random() < 0.65) {
          const randomOffset = Math.random() * (levelHeight * 0.4) - (levelHeight * 0.2);
          newRungs.push({
            id: `${lvl}-${col}-${Math.random()}`,
            col,
            y: Math.round(baseY + levelHeight / 2 + randomOffset),
          });
          prevColPlaced = true;
        } else {
          prevColPlaced = false;
        }
      }
    }

    setRungs(newRungs);
    setIsGenerated(true);
    setActiveTraces({});
    setRevealedResults({});
    setCompletedMatches({});
    setAnimationState(null);
  };

  // Helper: Get X position of a line index
  const getLineX = (index: number) => {
    if (numPlayers <= 1) return LADDER_WIDTH / 2;
    const spacing = LADDER_WIDTH / (numPlayers - 1);
    return index * spacing;
  };

  // Trace the exact path algorithm for a starting column
  const calculatePath = (playerIdx: number): TracedPath => {
    let currentCol = playerIdx;
    const currentY = 20;
    const points = [{ x: getLineX(currentCol), y: currentY }];

    // Filter and sort all connected rungs
    const connectedRungs = rungs
      .filter((r) => r.col === currentCol || r.col === currentCol - 1)
      .sort((a, b) => a.y - b.y);

    for (const rung of connectedRungs) {
      // Move vertically to the level of this rung
      points.push({ x: getLineX(currentCol), y: rung.y });

      // Move horizontally across the rung
      const nextCol = rung.col === currentCol ? currentCol + 1 : currentCol - 1;
      points.push({ x: getLineX(nextCol), y: rung.y });
      currentCol = nextCol;
    }

    // Move to the bottom of the ladder
    points.push({ x: getLineX(currentCol), y: LADDER_HEIGHT - 20 });

    return {
      playerIndex: playerIdx,
      points,
      color: COLORS[playerIdx % COLORS.length],
      resultIndex: currentCol,
    };
  };

  // Start path animation for a specific player
  const startTraceAnimation = (playerIdx: number) => {
    if (!isGenerated) return;
    if (animationState) return; // Prevent concurrent animations

    // Reset this trace if already active
    setActiveTraces((prev) => {
      const next = { ...prev };
      delete next[playerIdx];
      return next;
    });

    const trace = calculatePath(playerIdx);

    setAnimationState({
      playerIndex: playerIdx,
      pathPoints: trace.points,
      currentPointIndex: 0,
      currentPos: trace.points[0],
      progress: 0,
    });
  };

  // Animation Update loop
  React.useEffect(() => {
    if (!animationState) return;

    let animFrame: number;
    const speed = 12; // Pixels per frame

    const step = () => {
      setAnimationState((curr) => {
        if (!curr) return null;

        const { pathPoints, currentPointIndex, currentPos } = curr;
        const targetPoint = pathPoints[currentPointIndex + 1];

        if (!targetPoint) {
          // Animation finished!
          const trace = calculatePath(curr.playerIndex);
          setRevealedResults((prev) => ({ ...prev, [trace.resultIndex]: true }));
          setCompletedMatches((prev) => ({ ...prev, [curr.playerIndex]: trace.resultIndex }));
          setActiveTraces((prev) => ({ ...prev, [curr.playerIndex]: trace }));
          return null;
        }

        // Calculate vector to next point
        const dx = targetPoint.x - currentPos.x;
        const dy = targetPoint.y - currentPos.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance <= speed) {
          // Snapped to next node point
          return {
            ...curr,
            currentPointIndex: currentPointIndex + 1,
            currentPos: targetPoint,
          };
        } else {
          // Move towards target
          const ratio = speed / distance;
          return {
            ...curr,
            currentPos: {
              x: currentPos.x + dx * ratio,
              y: currentPos.y + dy * ratio,
            },
          };
        }
      });

      animFrame = requestAnimationFrame(step);
    };

    animFrame = requestAnimationFrame(step);
    return () => cancelAnimationFrame(animFrame);
  }, [animationState]);

  // Reveal all paths instantly
  const revealAllPaths = () => {
    if (!isGenerated) return;
    const newTraces: Record<number, TracedPath> = {};
    const newRevealed: Record<number, boolean> = {};
    const newMatches: Record<number, number> = {};

    for (let i = 0; i < numPlayers; i++) {
      const trace = calculatePath(i);
      newTraces[i] = trace;
      newRevealed[trace.resultIndex] = true;
      newMatches[i] = trace.resultIndex;
    }

    setActiveTraces(newTraces);
    setRevealedResults(newRevealed);
    setCompletedMatches(newMatches);
  };

  return (
    <ToolLayout
      title="Ladder Game (Amidakuji)"
      description="Create a random Amidakuji ladder. Customize names and results, then watch the path follow the rungs in real-time."
    >
      <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
        {/* Left Control Panel */}
        <div className="space-y-6">
          <Card>
            <CardContent className="p-4 space-y-4">
              <h3 className="font-semibold text-sm">Game Configuration</h3>
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">Number of Players ({numPlayers})</Label>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-9 w-9"
                    onClick={() => handleNumPlayersChange(numPlayers - 1)}
                    disabled={numPlayers <= 2 || animationState !== null}
                  >
                    <UserMinus className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-9 w-9"
                    onClick={() => handleNumPlayersChange(numPlayers + 1)}
                    disabled={numPlayers >= 10 || animationState !== null}
                  >
                    <UserPlus className="h-4 w-4" />
                  </Button>
                  <Button
                    className="flex-1 gap-1.5"
                    onClick={generateLadder}
                    disabled={animationState !== null}
                  >
                    <RefreshCw className="h-4 w-4" /> Generate
                  </Button>
                </div>
              </div>

              {isGenerated && (
                <div className="space-y-2 pt-2 border-t">
                  <Label className="text-xs text-muted-foreground">Quick Result Templates</Label>
                  <div className="grid grid-cols-3 gap-1.5">
                    <Button variant="outline" size="sm" className="text-[10px] h-8 px-1" onClick={() => applyPreset("winner")}>
                      <Trophy className="h-3.5 w-3.5 mr-1" /> 1 Win
                    </Button>
                    <Button variant="outline" size="sm" className="text-[10px] h-8 px-1" onClick={() => applyPreset("coffee")}>
                      <Coffee className="h-3.5 w-3.5 mr-1" /> Penalty
                    </Button>
                    <Button variant="outline" size="sm" className="text-[10px] h-8 px-1" onClick={() => applyPreset("numbers")}>
                      1, 2, 3...
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Player Names Input list */}
          <Card className="max-h-[350px] overflow-y-auto">
            <CardContent className="p-4 space-y-4">
              <h4 className="font-semibold text-xs text-muted-foreground flex items-center gap-1.5">
                <Users className="h-4 w-4" /> Customize Names & Results
              </h4>
              <div className="space-y-3">
                {Array.from({ length: numPlayers }).map((_, i) => (
                  <div key={i} className="space-y-1.5 p-2 rounded-lg bg-muted/20 border">
                    <div className="flex items-center gap-2">
                      <span
                        className="w-2.5 h-2.5 rounded-full shrink-0"
                        style={{ backgroundColor: COLORS[i % COLORS.length] }}
                      />
                      <span className="text-[10px] font-bold text-muted-foreground">Line {i + 1}</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <Input
                        value={names[i] || ""}
                        placeholder={`Player ${i + 1}`}
                        onChange={(e) => {
                          const next = [...names];
                          next[i] = e.target.value;
                          setNames(next);
                        }}
                        className="h-8 text-xs px-2 bg-background"
                      />
                      <Input
                        value={results[i] || ""}
                        placeholder={`Result ${i + 1}`}
                        onChange={(e) => {
                          const next = [...results];
                          next[i] = e.target.value;
                          setResults(next);
                        }}
                        className="h-8 text-xs px-2 bg-background"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Game Screen */}
        <div className="space-y-4">
          <Card className="bg-muted/5 border">
            <CardContent className="p-6 flex flex-col items-center justify-center">
              {!isGenerated ? (
                <div className="h-[480px] flex flex-col items-center justify-center text-center p-6 space-y-4">
                  <div className="p-4 rounded-full bg-primary/10 text-primary">
                    <HelpCircle className="h-10 w-10 animate-bounce" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold">Generate a Ladder</h3>
                    <p className="text-sm text-muted-foreground max-w-sm mt-1">
                      Set your player count, customize the names, and click generate to create a randomized Amidakuji board.
                    </p>
                  </div>
                  <Button size="lg" onClick={generateLadder} className="gap-2">
                    <Play className="h-4 w-4" /> Generate Board
                  </Button>
                </div>
              ) : (
                <div className="w-full flex flex-col items-center select-none">
                  {/* Top Header Controls */}
                  <div className="flex gap-2 mb-6">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={revealAllPaths}
                      disabled={animationState !== null}
                      className="gap-1.5 text-xs"
                    >
                      <Eye className="h-4 w-4" /> Reveal All
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setActiveTraces({});
                        setRevealedResults({});
                        setCompletedMatches({});
                        setAnimationState(null);
                      }}
                      disabled={animationState !== null}
                      className="gap-1.5 text-xs text-muted-foreground"
                    >
                      <Undo2 className="h-4 w-4" /> Reset Traces
                    </Button>
                  </div>

                  {/* Player Buttons Top */}
                  <div className="w-[660px] max-w-full flex justify-between px-7 mb-2">
                    {names.map((name, idx) => (
                      <button
                        key={idx}
                        disabled={animationState !== null}
                        onClick={() => startTraceAnimation(idx)}
                        style={{ borderColor: COLORS[idx % COLORS.length] }}
                        className={`px-3 py-1 text-xs font-semibold rounded-full border-2 bg-background hover:bg-muted/50 transition-all shadow-sm shrink-0 min-w-[70px] text-center truncate ${
                          activeTraces[idx] ? "scale-95 opacity-80" : "hover:scale-105"
                        }`}
                      >
                        {name || `Player ${idx + 1}`}
                      </button>
                    ))}
                  </div>

                  {/* SVG Ladder Canvas */}
                  <div className="relative w-[600px] max-w-full aspect-[6/4] bg-background border rounded-xl overflow-hidden shadow-inner p-4">
                    <svg
                      viewBox={`0 0 ${LADDER_WIDTH} ${LADDER_HEIGHT}`}
                      className="w-full h-full overflow-visible"
                    >
                      {/* Grid Background Lines (Vertical Lines) */}
                      {Array.from({ length: numPlayers }).map((_, idx) => (
                        <line
                          key={idx}
                          x1={getLineX(idx)}
                          y1={20}
                          x2={getLineX(idx)}
                          y2={LADDER_HEIGHT - 20}
                          className="stroke-muted-foreground/30"
                          strokeWidth="3"
                          strokeLinecap="round"
                        />
                      ))}

                      {/* Horizontal Rungs */}
                      {rungs.map((rung) => (
                        <line
                          key={rung.id}
                          x1={getLineX(rung.col)}
                          y1={rung.y}
                          x2={getLineX(rung.col + 1)}
                          y2={rung.y}
                          className="stroke-muted-foreground/30"
                          strokeWidth="3"
                          strokeLinecap="round"
                        />
                      ))}

                      {/* Render Traced Completed Paths */}
                      {Object.values(activeTraces).map((trace) => {
                        const pathD = trace.points
                          .map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`)
                          .join(" ");
                        return (
                          <path
                            key={trace.playerIndex}
                            d={pathD}
                            fill="none"
                            stroke={trace.color}
                            strokeWidth="4"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            className="opacity-90 stroke-dasharray animate-dash"
                          />
                        );
                      })}

                      {/* Render Active Animating Path Line */}
                      {animationState && (
                        (() => {
                          const currentPoints = animationState.pathPoints.slice(0, animationState.currentPointIndex + 1);
                          currentPoints.push(animationState.currentPos);
                          const pathD = currentPoints
                            .map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`)
                            .join(" ");
                          return (
                            <>
                              <path
                                d={pathD}
                                fill="none"
                                stroke={COLORS[animationState.playerIndex % COLORS.length]}
                                strokeWidth="5"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                className="shadow-lg"
                              />
                              <circle
                                cx={animationState.currentPos.x}
                                cy={animationState.currentPos.y}
                                r="6"
                                fill={COLORS[animationState.playerIndex % COLORS.length]}
                                className="animate-ping"
                              />
                              <circle
                                cx={animationState.currentPos.x}
                                cy={animationState.currentPos.y}
                                r="5"
                                fill="#FFFFFF"
                                stroke={COLORS[animationState.playerIndex % COLORS.length]}
                                strokeWidth="2"
                              />
                            </>
                          );
                        })()
                      )}
                    </svg>
                  </div>

                  {/* Bottom Results List */}
                  <div className="w-[660px] max-w-full flex justify-between px-7 mt-4">
                    {results.map((res, idx) => {
                      const isRevealed = revealedResults[idx];
                      return (
                        <div
                          key={idx}
                          className={`px-3 py-1.5 text-xs font-bold rounded-lg border text-center truncate min-w-[70px] max-w-[90px] shadow-sm transition-all duration-300 shrink-0 ${
                            isRevealed
                              ? "bg-primary text-primary-foreground border-primary scale-105 animate-pulse"
                              : "bg-muted text-muted-foreground border-muted-foreground/20"
                          }`}
                        >
                          {isRevealed ? res || `Result ${idx + 1}` : "???"}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Matches / Summary Panel */}
          {Object.keys(completedMatches).length > 0 && (
            <Card className="border">
              <CardContent className="p-4 space-y-3">
                <h3 className="font-semibold text-sm flex items-center gap-1.5 text-primary">
                  <CheckCircle2 className="h-4 w-4" /> Match Results Summary
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  {Object.entries(completedMatches).map(([playerIdxStr, resultIdxStr]) => {
                    const pIdx = parseInt(playerIdxStr);
                    const rIdx = parseInt(resultIdxStr);
                    return (
                      <div
                        key={pIdx}
                        className="flex items-center justify-between p-2 rounded-lg bg-muted/40 border text-xs"
                      >
                        <span className="font-semibold truncate max-w-[80px]" style={{ color: COLORS[pIdx % COLORS.length] }}>
                          {names[pIdx]}
                        </span>
                        <span className="text-muted-foreground mx-1">➔</span>
                        <span className="font-bold truncate max-w-[80px] text-primary">
                          {results[rIdx]}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </ToolLayout>
  );
}
