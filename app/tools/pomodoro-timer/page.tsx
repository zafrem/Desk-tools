"use client";

import * as React from "react";
import { ToolLayout } from "@/components/tool-layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Play, Pause, RotateCcw, Settings, Coffee, Brain } from "lucide-react";

type TimerMode = "work" | "shortBreak" | "longBreak";

interface TimerSettings {
  work: number;
  shortBreak: number;
  longBreak: number;
  longBreakInterval: number;
}

const DEFAULT_SETTINGS: TimerSettings = {
  work: 25,
  shortBreak: 5,
  longBreak: 15,
  longBreakInterval: 4,
};

export default function PomodoroTimerPage() {
  const [settings, setSettings] = React.useState<TimerSettings>(DEFAULT_SETTINGS);
  const [showSettings, setShowSettings] = React.useState(false);
  const [mode, setMode] = React.useState<TimerMode>("work");
  const [timeLeft, setTimeLeft] = React.useState(settings.work * 60);
  const [isRunning, setIsRunning] = React.useState(false);
  const [completedPomodoros, setCompletedPomodoros] = React.useState(0);
  const audioRef = React.useRef<HTMLAudioElement | null>(null);

  const totalTime = React.useMemo(() => {
    switch (mode) {
      case "work":
        return settings.work * 60;
      case "shortBreak":
        return settings.shortBreak * 60;
      case "longBreak":
        return settings.longBreak * 60;
    }
  }, [mode, settings]);

  const progress = ((totalTime - timeLeft) / totalTime) * 100;

  // Timer logic
  React.useEffect(() => {
    let interval: NodeJS.Timeout | null = null;

    if (isRunning && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (timeLeft === 0) {
      // Play notification sound
      playNotification();

      // Auto-switch modes
      if (mode === "work") {
        const newCompletedCount = completedPomodoros + 1;
        setCompletedPomodoros(newCompletedCount);

        // Check if it's time for a long break
        if (newCompletedCount % settings.longBreakInterval === 0) {
          setMode("longBreak");
          setTimeLeft(settings.longBreak * 60);
        } else {
          setMode("shortBreak");
          setTimeLeft(settings.shortBreak * 60);
        }
      } else {
        setMode("work");
        setTimeLeft(settings.work * 60);
      }
      setIsRunning(false);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isRunning, timeLeft, mode, completedPomodoros, settings]);

  const playNotification = () => {
    // Create and play a simple beep sound using Web Audio API
    try {
      const audioContext = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      oscillator.frequency.value = 800;
      oscillator.type = "sine";
      gainNode.gain.value = 0.3;

      oscillator.start();
      oscillator.stop(audioContext.currentTime + 0.5);

      // Play twice for emphasis
      setTimeout(() => {
        const osc2 = audioContext.createOscillator();
        const gain2 = audioContext.createGain();
        osc2.connect(gain2);
        gain2.connect(audioContext.destination);
        osc2.frequency.value = 800;
        osc2.type = "sine";
        gain2.gain.value = 0.3;
        osc2.start();
        osc2.stop(audioContext.currentTime + 0.5);
      }, 600);
    } catch {
      // Fallback: do nothing if audio fails
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const handleModeChange = (newMode: TimerMode) => {
    setMode(newMode);
    setIsRunning(false);
    switch (newMode) {
      case "work":
        setTimeLeft(settings.work * 60);
        break;
      case "shortBreak":
        setTimeLeft(settings.shortBreak * 60);
        break;
      case "longBreak":
        setTimeLeft(settings.longBreak * 60);
        break;
    }
  };

  const handleReset = () => {
    setIsRunning(false);
    switch (mode) {
      case "work":
        setTimeLeft(settings.work * 60);
        break;
      case "shortBreak":
        setTimeLeft(settings.shortBreak * 60);
        break;
      case "longBreak":
        setTimeLeft(settings.longBreak * 60);
        break;
    }
  };

  const handleSettingChange = (key: keyof TimerSettings, value: number) => {
    const newSettings = { ...settings, [key]: value };
    setSettings(newSettings);

    // Update current timer if the changed setting matches current mode
    if (key === mode) {
      setTimeLeft(value * 60);
    }
  };

  const getModeColor = () => {
    switch (mode) {
      case "work":
        return "text-red-500";
      case "shortBreak":
        return "text-green-500";
      case "longBreak":
        return "text-blue-500";
    }
  };

  const getModeBackground = () => {
    switch (mode) {
      case "work":
        return "bg-red-500/10 border-red-500/20";
      case "shortBreak":
        return "bg-green-500/10 border-green-500/20";
      case "longBreak":
        return "bg-blue-500/10 border-blue-500/20";
    }
  };

  const getProgressColor = () => {
    switch (mode) {
      case "work":
        return "stroke-red-500";
      case "shortBreak":
        return "stroke-green-500";
      case "longBreak":
        return "stroke-blue-500";
    }
  };

  return (
    <ToolLayout
      title="Pomodoro Timer"
      description="Stay focused with the Pomodoro Technique - work in focused intervals with regular breaks."
    >
      <div className="space-y-4 sm:space-y-8">
        {/* Mode Selection */}
        <div className="flex flex-wrap justify-center gap-2 px-4">
          <Button
            variant={mode === "work" ? "default" : "outline"}
            onClick={() => handleModeChange("work")}
            className="gap-1.5 sm:gap-2 text-sm sm:text-base"
          >
            <Brain className="h-4 w-4" />
            Focus
          </Button>
          <Button
            variant={mode === "shortBreak" ? "default" : "outline"}
            onClick={() => handleModeChange("shortBreak")}
            className="gap-1.5 sm:gap-2 text-sm sm:text-base"
          >
            <Coffee className="h-4 w-4" />
            <span className="hidden sm:inline">Short Break</span>
            <span className="sm:hidden">Short</span>
          </Button>
          <Button
            variant={mode === "longBreak" ? "default" : "outline"}
            onClick={() => handleModeChange("longBreak")}
            className="gap-1.5 sm:gap-2 text-sm sm:text-base"
          >
            <Coffee className="h-4 w-4" />
            <span className="hidden sm:inline">Long Break</span>
            <span className="sm:hidden">Long</span>
          </Button>
        </div>

        {/* Timer Display */}
        <Card className={`${getModeBackground()} border-2 mx-4 sm:mx-0`}>
          <CardContent className="p-4 sm:p-8 flex flex-col items-center justify-center">
            {/* Circular Progress */}
            <div className="relative w-48 h-48 sm:w-64 sm:h-64 mb-4 sm:mb-6">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 256 256">
                {/* Background circle */}
                <circle
                  cx="128"
                  cy="128"
                  r="120"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="8"
                  className="text-muted/20"
                />
                {/* Progress circle */}
                <circle
                  cx="128"
                  cy="128"
                  r="120"
                  fill="none"
                  strokeWidth="8"
                  strokeLinecap="round"
                  className={getProgressColor()}
                  strokeDasharray={2 * Math.PI * 120}
                  strokeDashoffset={2 * Math.PI * 120 * (1 - progress / 100)}
                  style={{ transition: "stroke-dashoffset 0.5s ease" }}
                />
              </svg>
              {/* Timer Text */}
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className={`text-4xl sm:text-6xl font-mono font-bold ${getModeColor()}`}>
                  {formatTime(timeLeft)}
                </span>
                <span className="text-xs sm:text-sm text-muted-foreground uppercase tracking-wider mt-1 sm:mt-2">
                  {mode === "work" ? "Focus Time" : mode === "shortBreak" ? "Short Break" : "Long Break"}
                </span>
              </div>
            </div>

            {/* Controls */}
            <div className="flex gap-2 sm:gap-4">
              <Button
                size="lg"
                onClick={() => setIsRunning(!isRunning)}
                className="gap-2 px-4 sm:px-8"
              >
                {isRunning ? (
                  <>
                    <Pause className="h-4 w-4 sm:h-5 sm:w-5" />
                    Pause
                  </>
                ) : (
                  <>
                    <Play className="h-4 w-4 sm:h-5 sm:w-5" />
                    Start
                  </>
                )}
              </Button>
              <Button
                size="lg"
                variant="outline"
                onClick={handleReset}
                className="gap-2"
              >
                <RotateCcw className="h-4 w-4 sm:h-5 sm:w-5" />
                Reset
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Completed Pomodoros */}
        <div className="flex justify-center mx-4 sm:mx-0">
          <Card className="w-full sm:w-auto">
            <CardContent className="p-4 flex flex-wrap items-center justify-center gap-2 sm:gap-4">
              <span className="text-muted-foreground text-sm sm:text-base">Completed Pomodoros:</span>
              <span className="text-xl sm:text-2xl font-bold text-red-500">{completedPomodoros}</span>
              {completedPomodoros > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setCompletedPomodoros(0)}
                  className="text-muted-foreground"
                >
                  Reset
                </Button>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Settings Toggle */}
        <div className="flex justify-center">
          <Button
            variant="ghost"
            onClick={() => setShowSettings(!showSettings)}
            className="gap-2"
          >
            <Settings className="h-4 w-4" />
            {showSettings ? "Hide Settings" : "Settings"}
          </Button>
        </div>

        {/* Settings Panel */}
        {showSettings && (
          <Card className="mx-4 sm:mx-0">
            <CardContent className="p-4 sm:p-6">
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
                <div className="space-y-2">
                  <Label htmlFor="work-duration" className="text-xs sm:text-sm">Focus (min)</Label>
                  <Input
                    id="work-duration"
                    type="number"
                    min="1"
                    max="60"
                    value={settings.work}
                    onChange={(e) => handleSettingChange("work", parseInt(e.target.value) || 25)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="short-break" className="text-xs sm:text-sm">Short Break (min)</Label>
                  <Input
                    id="short-break"
                    type="number"
                    min="1"
                    max="30"
                    value={settings.shortBreak}
                    onChange={(e) => handleSettingChange("shortBreak", parseInt(e.target.value) || 5)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="long-break" className="text-xs sm:text-sm">Long Break (min)</Label>
                  <Input
                    id="long-break"
                    type="number"
                    min="1"
                    max="60"
                    value={settings.longBreak}
                    onChange={(e) => handleSettingChange("longBreak", parseInt(e.target.value) || 15)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="long-break-interval" className="text-xs sm:text-sm">Long Break After</Label>
                  <Input
                    id="long-break-interval"
                    type="number"
                    min="1"
                    max="10"
                    value={settings.longBreakInterval}
                    onChange={(e) => handleSettingChange("longBreakInterval", parseInt(e.target.value) || 4)}
                  />
                </div>
              </div>
              <p className="text-xs sm:text-sm text-muted-foreground mt-3 sm:mt-4">
                Long break will occur after every {settings.longBreakInterval} focus sessions.
              </p>
            </CardContent>
          </Card>
        )}

        {/* Info */}
        <Card className="bg-muted/30 mx-4 sm:mx-0">
          <CardContent className="p-4">
            <h3 className="font-semibold mb-2 text-sm sm:text-base">How to use the Pomodoro Technique</h3>
            <ol className="list-decimal list-inside text-xs sm:text-sm text-muted-foreground space-y-1">
              <li>Choose a task you want to work on</li>
              <li>Start the timer and focus on your task for 25 minutes</li>
              <li>When the timer rings, take a 5-minute break</li>
              <li>After 4 focus sessions, take a longer 15-minute break</li>
              <li>Repeat and stay productive!</li>
            </ol>
          </CardContent>
        </Card>
      </div>

      {/* Hidden audio element for notification */}
      <audio ref={audioRef} />
    </ToolLayout>
  );
}
