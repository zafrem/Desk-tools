"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { db } from "@/lib/db";
import { useLiveQuery } from "dexie-react-hooks";
import { Trash2, Plus, Bell, RotateCcw, Save } from "lucide-react";
import { cn } from "@/lib/utils";

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const START_HOUR = 7;
const END_HOUR = 23;

// Generate time slots
const TIME_SLOTS: string[] = [];
for (let h = START_HOUR; h <= END_HOUR; h++) {
  const hour = h.toString().padStart(2, "0");
  TIME_SLOTS.push(`${hour}:00`);
  if (h !== END_HOUR) {
    TIME_SLOTS.push(`${hour}:30`);
  }
}

export default function WeeklySchedulerPage() {
  const [selectedCell, setSelectedCell] = useState<{
    day: number;
    time: string;
  } | null>(null);
  const [taskInput, setTaskInput] = useState("");
  const [taskDuration, setTaskDuration] = useState("0.5");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isResetDialogOpen, setIsResetDialogOpen] = useState(false);
  const [alarmEnabled, setAlarmEnabled] = useState(true);

  // Load schedule
  const schedule = useLiveQuery(() => db.weeklySchedule.toArray());

  // Alarm Logic
  useEffect(() => {
    if (!alarmEnabled || !schedule) return;

    const checkAlarm = () => {
      const now = new Date();
      const currentDayIndex = (now.getDay() + 6) % 7; // Convert 0=Sun to 0=Mon
      
      // Find tasks for current day
      const dayTasks = schedule.filter(item => item.dayOfWeek === currentDayIndex);
      
      dayTasks.forEach(task => {
        const [taskH, taskM] = task.timeSlot.split(':').map(Number);
        const taskDate = new Date(now);
        taskDate.setHours(taskH, taskM, 0, 0);
        
        const diff = (taskDate.getTime() - now.getTime()) / 1000 / 60; // diff in minutes
        
        // Check if diff is approximately 5 minutes (allow slight window for interval execution)
        if (diff >= 4.9 && diff <= 5.1 && !task.completed) {
           playAlarm(task.task);
        }
      });
    };

    const interval = setInterval(checkAlarm, 60000); // Check every minute
    return () => clearInterval(interval);
  }, [schedule, alarmEnabled]);

  const playAlarm = (taskName: string) => {
    // Browser notification
    if ("Notification" in window && Notification.permission === "granted") {
      new Notification("Upcoming Task", {
        body: `5 minutes until: ${taskName}`,
        icon: "/icon.png"
      });
    } else if ("Notification" in window && Notification.permission !== "denied") {
      Notification.requestPermission().then(permission => {
        if (permission === "granted") {
          new Notification("Upcoming Task", {
             body: `5 minutes until: ${taskName}`,
             icon: "/icon.png"
          });
        }
      });
    }

    // Audio Beep
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    osc.connect(gain);
    gain.connect(ctx.destination);
    
    osc.type = "sine";
    osc.frequency.setValueAtTime(440, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.5);
    
    gain.gain.setValueAtTime(0.5, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5);
    
    osc.start();
    osc.stop(ctx.currentTime + 0.5);
  };

  const handleCellClick = (day: number, time: string) => {
    setSelectedCell({ day, time });
    const existing = schedule?.find(
      (i) => i.dayOfWeek === day && i.timeSlot === time
    );
    setTaskInput(existing?.task || "");
    setTaskDuration("0.5"); // Reset duration
    setIsDialogOpen(true);
  };

  const handleSaveTask = async () => {
    if (!selectedCell) return;

    if (!taskInput.trim()) {
      // Delete if empty (only the selected cell)
      const existing = schedule?.find(
        (i) => i.dayOfWeek === selectedCell.day && i.timeSlot === selectedCell.time
      );
      if (existing?.id) {
        await db.weeklySchedule.delete(existing.id);
      }
    } else {
      // Upsert with duration
      const slotsCount = parseFloat(taskDuration) * 2;
      const startIndex = TIME_SLOTS.indexOf(selectedCell.time);

      if (startIndex === -1) return;

      for (let i = 0; i < slotsCount; i++) {
        const targetIndex = startIndex + i;
        if (targetIndex >= TIME_SLOTS.length) break;

        const targetTime = TIME_SLOTS[targetIndex];
        const existing = schedule?.find(
          (item) => item.dayOfWeek === selectedCell.day && item.timeSlot === targetTime
        );

        if (existing?.id) {
          await db.weeklySchedule.update(existing.id, {
            task: taskInput,
            updatedAt: new Date(),
          });
        } else {
          await db.weeklySchedule.add({
            dayOfWeek: selectedCell.day,
            timeSlot: targetTime,
            task: taskInput,
            completed: false,
            createdAt: new Date(),
            updatedAt: new Date(),
          });
        }
      }
    }
    setIsDialogOpen(false);
  };

  const toggleComplete = async (id: number, current: boolean) => {
    await db.weeklySchedule.update(id, { completed: !current });
  };

  const handleDelete = async () => {
     if (!selectedCell) return;
     const existing = schedule?.find(
        (i) => i.dayOfWeek === selectedCell.day && i.timeSlot === selectedCell.time
      );
      if (existing?.id) {
        await db.weeklySchedule.delete(existing.id);
      }
      setIsDialogOpen(false);
  };

  const resetWeek = async () => {
    // Clear all completed status or delete all? 
    // User said: "When the week is up, I want it to reset."
    // Usually means unchecking everything to start fresh next week.
    if (!schedule) return;
    
    const updates = schedule.map(item => ({
        key: item.id,
        changes: { completed: false }
    }));
    
    await Promise.all(updates.map(u => db.weeklySchedule.update(u.key!, u.changes)));
    setIsResetDialogOpen(false);
  };

  return (
    <div className="container mx-auto p-8 max-w-7xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Schedule</h1>
        <p className="text-muted-foreground">
          Plan your week from 7am to 11pm. Resets weekly.
        </p>
      </div>

      <div className="flex gap-2 mb-6">
        <Button
            variant="outline"
            size="sm"
            onClick={() => setAlarmEnabled(!alarmEnabled)}
            className={cn(alarmEnabled ? "text-primary" : "text-muted-foreground")}
            title={alarmEnabled ? "Alarms Enabled" : "Alarms Disabled"}
        >
            <Bell className={cn("h-4 w-4 mr-2", alarmEnabled && "fill-current")} />
            {alarmEnabled ? "On" : "Off"}
        </Button>
        <Button 
            variant="outline" 
            size="sm"
            onClick={() => setIsResetDialogOpen(true)}
        >
            <RotateCcw className="h-4 w-4 mr-2" />
            Reset Week
        </Button>
      </div>

      <div className="overflow-x-auto pb-6">
        <div className="min-w-[800px] border rounded-lg">
          {/* Header */}
          <div className="grid grid-cols-[60px_repeat(7,1fr)] bg-muted/50 divide-x border-b">
            <div className="p-2 text-center text-xs font-medium text-muted-foreground sticky left-0 bg-background/95 backdrop-blur z-10">
              Time
            </div>
            {DAYS.map((day, i) => (
              <div key={day} className={`p-2 text-center text-sm font-semibold ${
                 (new Date().getDay() + 6) % 7 === i ? "bg-primary/5 text-primary" : ""
              }`}>
                {day}
              </div>
            ))}
          </div>

          {/* Grid */}
          <div className="divide-y">
            {TIME_SLOTS.map((time) => (
              <div key={time} className="grid grid-cols-[60px_repeat(7,1fr)] divide-x hover:bg-muted/5 transition-colors">
                <div className="p-2 text-xs text-muted-foreground text-center flex items-center justify-center sticky left-0 bg-background/95 backdrop-blur z-10 font-mono">
                  {time}
                </div>
                {DAYS.map((_, dayIndex) => {
                  const item = schedule?.find(
                    (i) => i.dayOfWeek === dayIndex && i.timeSlot === time
                  );

                  return (
                    <div
                      key={`${dayIndex}-${time}`}
                      className={cn(
                        "p-1 min-h-[48px] relative group transition-colors cursor-pointer",
                        item?.completed ? "bg-green-500/10" : "",
                        (new Date().getDay() + 6) % 7 === dayIndex ? "bg-primary/5" : ""
                      )}
                      onClick={() => handleCellClick(dayIndex, time)}
                    >
                      {item ? (
                        <div className="h-full flex items-start gap-1.5 p-1 rounded-sm hover:bg-black/5 dark:hover:bg-white/5">
                          <div onClick={(e) => e.stopPropagation()}>
                            <Checkbox
                              checked={item.completed}
                              onCheckedChange={() =>
                                item.id && toggleComplete(item.id, item.completed)
                              }
                              className="mt-0.5 h-3.5 w-3.5"
                            />
                          </div>
                          <span
                            className={cn(
                              "text-xs leading-tight break-words line-clamp-2",
                              item.completed && "line-through text-muted-foreground"
                            )}
                          >
                            {item.task}
                          </span>
                        </div>
                      ) : (
                        <div className="w-full h-full opacity-0 group-hover:opacity-100 flex items-center justify-center">
                            <Plus className="h-3 w-3 text-muted-foreground/50" />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Edit Task Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {selectedCell && `${DAYS[selectedCell.day]} at ${selectedCell.time}`}
            </DialogTitle>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <Input
              value={taskInput}
              onChange={(e) => setTaskInput(e.target.value)}
              placeholder="Enter task description..."
              onKeyDown={(e) => e.key === "Enter" && handleSaveTask()}
              autoFocus
            />
            <Select value={taskDuration} onValueChange={setTaskDuration}>
              <SelectTrigger>
                <SelectValue placeholder="Duration" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="0.5">30 mins</SelectItem>
                <SelectItem value="1">1 hour</SelectItem>
                <SelectItem value="1.5">1.5 hours</SelectItem>
                <SelectItem value="2">2 hours</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <DialogFooter className="gap-2 sm:justify-between">
            <Button
                variant="destructive"
                size="sm"
                onClick={handleDelete}
                type="button"
            >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
            </Button>
            <div className="flex gap-2">
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancel
                </Button>
                <Button onClick={handleSaveTask}>
                <Save className="h-4 w-4 mr-2" />
                Save
                </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reset Confirmation Dialog */}
      <Dialog open={isResetDialogOpen} onOpenChange={setIsResetDialogOpen}>
        <DialogContent>
            <DialogHeader>
                <DialogTitle>Reset Weekly Schedule?</DialogTitle>
            </DialogHeader>
            <div className="text-sm text-muted-foreground">
                This will uncheck all completed tasks for the new week. Your tasks will remain.
            </div>
            <DialogFooter>
                <Button variant="outline" onClick={() => setIsResetDialogOpen(false)}>Cancel</Button>
                <Button onClick={resetWeek}>Confirm Reset</Button>
            </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  );
}
