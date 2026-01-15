"use client";

import { useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { db, DailyTask } from "@/lib/db";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Plus, Trash2, Edit2, Calendar } from "lucide-react";
import { isSameDay } from "date-fns";
import { cn } from "@/lib/utils";

export default function DailyTasksPage() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<DailyTask | null>(null);
  const [taskTitle, setTaskTitle] = useState("");

  const tasks = useLiveQuery(() => db.dailyTasks.orderBy("order").toArray(), []);

  const handleOpenDialog = (task?: DailyTask) => {
    if (task) {
      setEditingTask(task);
      setTaskTitle(task.title);
    } else {
      setEditingTask(null);
      setTaskTitle("");
    }
    setIsDialogOpen(true);
  };

  const handleSave = async () => {
    if (!taskTitle.trim()) return;

    if (editingTask?.id) {
      await db.dailyTasks.update(editingTask.id, {
        title: taskTitle,
        updatedAt: new Date()
      });
    } else {
      await db.dailyTasks.add({
        title: taskTitle,
        order: tasks?.length || 0,
        createdAt: new Date(),
        updatedAt: new Date()
      });
    }
    setIsDialogOpen(false);
  };

  const handleDelete = async (id: number) => {
    if (confirm("Delete this task?")) {
      await db.dailyTasks.delete(id);
    }
  };

  const toggleTask = async (task: DailyTask) => {
    if (!task.id) return;
    const isCompleted = task.lastCompletedAt && isSameDay(new Date(task.lastCompletedAt), new Date());
    
    await db.dailyTasks.update(task.id, {
      lastCompletedAt: isCompleted ? undefined : new Date()
    });
  };

  return (
    <div className="container mx-auto p-8 max-w-3xl">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2 flex items-center gap-2">
            <Calendar className="h-8 w-8" />
            Daily Tasks
          </h1>
          <p className="text-muted-foreground">Track your recurring daily goals.</p>
        </div>
        <Button onClick={() => handleOpenDialog()}>
          <Plus className="h-4 w-4 mr-2" /> Add Task
        </Button>
      </div>

      <div className="space-y-2">
        {tasks?.map((task) => {
            const isCompleted = task.lastCompletedAt && isSameDay(new Date(task.lastCompletedAt), new Date());
            return (
                <div key={task.id} className={cn("flex items-center justify-between p-4 rounded-lg border bg-card transition-colors", isCompleted && "bg-muted/50")}>
                    <div className="flex items-center gap-3 flex-1">
                        <Checkbox 
                            checked={!!isCompleted} 
                            onCheckedChange={() => toggleTask(task)}
                            id={`task-${task.id}`}
                        />
                        <label 
                            htmlFor={`task-${task.id}`}
                            className={cn("font-medium cursor-pointer flex-1", isCompleted && "line-through text-muted-foreground")}
                        >
                            {task.title}
                        </label>
                    </div>
                    <div className="flex items-center gap-1">
                        <Button variant="ghost" size="icon" onClick={() => handleOpenDialog(task)}>
                            <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" onClick={() => task.id && handleDelete(task.id)}>
                            <Trash2 className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
            );
        })}
        {tasks?.length === 0 && (
            <div className="text-center py-12 text-muted-foreground border-2 border-dashed rounded-lg">
                No daily tasks yet. Add one to get started!
            </div>
        )}
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingTask ? "Edit Task" : "New Daily Task"}</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <Label htmlFor="title">Task Title</Label>
            <Input 
                id="title" 
                value={taskTitle} 
                onChange={(e) => setTaskTitle(e.target.value)} 
                placeholder="e.g. Drink water" 
                onKeyDown={(e) => e.key === "Enter" && handleSave()}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSave}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
