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

const CELL_HEIGHT = 48; // px

export default function WeeklySchedulerPage() {
  const [selectedCell, setSelectedCell] = useState<{
    day: number;
    time: string;
    existingId?: number;
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
      
      const dayTasks = schedule.filter(item => item.dayOfWeek === currentDayIndex);
      
      dayTasks.forEach(task => {
        const [taskH, taskM] = task.timeSlot.split(':').map(Number);
        const taskDate = new Date(now);
        taskDate.setHours(taskH, taskM, 0, 0);
        
        const diff = (taskDate.getTime() - now.getTime()) / 1000 / 60; // diff in minutes
        
        // Check if diff is approximately 5 minutes
        if (diff >= 4.9 && diff <= 5.1 && !task.completed) {
           playAlarm(task.task);
        }
      });
    };

    const interval = setInterval(checkAlarm, 60000); 
    return () => clearInterval(interval);
  }, [schedule, alarmEnabled]);

  const playAlarm = (taskName: string) => {
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

  const handleCellClick = (day: number, time: string, existingId?: number, currentDuration = 30, currentTask = "") => {
    setSelectedCell({ day, time, existingId });
    setTaskInput(currentTask);
    setTaskDuration((currentDuration / 60).toString());
    setIsDialogOpen(true);
  };

  const handleSaveTask = async () => {
    if (!selectedCell) return;

    // Delete existing task if we are editing (to replace it)
    if (selectedCell.existingId) {
        await db.weeklySchedule.delete(selectedCell.existingId);
    }

    if (taskInput.trim()) {
      const durationMins = parseFloat(taskDuration) * 60;
      const slotsCount = durationMins / 30;
      const startIndex = TIME_SLOTS.indexOf(selectedCell.time);

      if (startIndex !== -1) {
          // Identify all slots this task will cover
          const affectedSlots: string[] = [];
          for (let i = 0; i < slotsCount; i++) {
              if (startIndex + i < TIME_SLOTS.length) {
                  affectedSlots.push(TIME_SLOTS[startIndex + i]);
              }
          }

          // Delete ANY other tasks that start in these slots (Collision handling)
          if (schedule) {
              const collisions = schedule.filter(t => 
                  t.dayOfWeek === selectedCell.day && 
                  affectedSlots.includes(t.timeSlot) && 
                  t.id !== selectedCell.existingId
              );
              if (collisions.length > 0) {
                  await db.weeklySchedule.bulkDelete(collisions.map(c => c.id!));
              }
          }

          // Add new task
          await db.weeklySchedule.add({
            dayOfWeek: selectedCell.day,
            timeSlot: selectedCell.time,
            task: taskInput,
            duration: durationMins,
            completed: false,
            createdAt: new Date(),
            updatedAt: new Date(),
          });
      }
    }
    setIsDialogOpen(false);
  };

  const toggleComplete = async (id: number, current: boolean) => {
    await db.weeklySchedule.update(id, { completed: !current });
  };

  const handleDelete = async () => {
     if (selectedCell?.existingId) {
        await db.weeklySchedule.delete(selectedCell.existingId);
     }
     setIsDialogOpen(false);
  };

  const resetWeek = async () => {
    if (!schedule) return;
    const updates = schedule.map(item => ({
        key: item.id,
        changes: { completed: false }
    }));
    await Promise.all(updates.map(u => db.weeklySchedule.update(u.key!, u.changes)));
    setIsResetDialogOpen(false);
  };

  const renderDayColumn = (dayIndex: number) => {
      const dayTasks = schedule?.filter(t => t.dayOfWeek === dayIndex) || [];
      const cells = [];
      let skipSlots = 0;

      for (let i = 0; i < TIME_SLOTS.length; i++) {
          if (skipSlots > 0) {
              skipSlots--;
              continue;
          }

          const time = TIME_SLOTS[i];
          const task = dayTasks.find(t => t.timeSlot === time);

          if (task) {
              const duration = task.duration || 30;
              const span = Math.ceil(duration / 30);
              const height = span * CELL_HEIGHT;
              
              cells.push(
                  <div
                      key={`${dayIndex}-${time}`}
                      className={cn(
                          "relative group transition-colors cursor-pointer border-b border-r px-1 py-1 overflow-hidden",
                          task.completed ? "bg-green-500/10" : "bg-primary/10 hover:bg-primary/20",
                          (new Date().getDay() + 6) % 7 === dayIndex && !task ? "bg-primary/5" : ""
                      )}
                      style={{ height: `${height}px` }}
                      onClick={() => handleCellClick(dayIndex, time, task.id, duration, task.task)}
                  >
                      <div className="flex items-start gap-1.5 h-full">
                          <div onClick={(e) => e.stopPropagation()}>
                            <Checkbox
                              checked={task.completed}
                              onCheckedChange={() =>
                                task.id && toggleComplete(task.id, task.completed)
                              }
                              className="mt-1 h-3.5 w-3.5"
                            />
                          </div>
                          <span
                            className={cn(
                              "text-xs leading-tight break-words line-clamp-[8] font-medium",
                              task.completed && "line-through text-muted-foreground"
                            )}
                          >
                            {task.task}
                          </span>
                      </div>
                  </div>
              );
              skipSlots = span - 1;
          } else {
              cells.push(
                  <div
                      key={`${dayIndex}-${time}`}
                      className={cn(
                          "group transition-colors cursor-pointer border-b border-r flex items-center justify-center",
                           (new Date().getDay() + 6) % 7 === dayIndex ? "bg-primary/5" : "hover:bg-muted/50"
                      )}
                      style={{ height: `${CELL_HEIGHT}px` }}
                      onClick={() => handleCellClick(dayIndex, time)}
                  >
                        <Plus className="h-3 w-3 text-muted-foreground/20 group-hover:text-muted-foreground/50 opacity-0 group-hover:opacity-100" />
                  </div>
              );
          }
      }
      return cells;
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
        <div className="min-w-[800px] border rounded-lg bg-background">
          <div className="flex">
             {/* Time Column */}
             <div className="flex-none w-[60px] border-r bg-muted/30">
                <div className="h-10 border-b bg-muted/50 sticky top-0 z-10"></div> {/* Header spacer */}
                {TIME_SLOTS.map((time) => (
                    <div 
                        key={time} 
                        className="flex items-center justify-center text-xs text-muted-foreground font-mono border-b bg-muted/30"
                        style={{ height: `${CELL_HEIGHT}px` }}
                    >
                        {time}
                    </div>
                ))}
             </div>

             {/* Days Columns */}
             <div className="flex-1 flex">
                {DAYS.map((day, dayIndex) => (
                    <div key={day} className="flex-1 min-w-[120px] flex flex-col">
                        <div className={`h-10 border-b flex items-center justify-center text-sm font-semibold sticky top-0 z-10 bg-background ${
                             (new Date().getDay() + 6) % 7 === dayIndex ? "text-primary bg-primary/5" : ""
                        }`}>
                            {day}
                        </div>
                        <div className="flex-1">
                            {renderDayColumn(dayIndex)}
                        </div>
                    </div>
                ))}
             </div>
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
                disabled={!selectedCell?.existingId}
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