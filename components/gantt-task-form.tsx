"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { GanttTask } from "@/lib/db";
import { format } from "date-fns";

interface GanttTaskFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (task: Omit<GanttTask, "id" | "createdAt" | "updatedAt">) => void;
  task?: GanttTask;
}

export function GanttTaskForm({
  open,
  onOpenChange,
  onSave,
  task,
}: GanttTaskFormProps) {
  const [title, setTitle] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [startDate, setStartDate] = React.useState("");
  const [endDate, setEndDate] = React.useState("");
  const [status, setStatus] = React.useState("todo");

  React.useEffect(() => {
    if (task) {
      setTitle(task.title);
      setDescription(task.description || "");
      setStartDate(format(task.startDate, "yyyy-MM-dd"));
      setEndDate(format(task.endDate, "yyyy-MM-dd"));
      
      if (task.progress === 0) setStatus("todo");
      else if (task.progress === 100) setStatus("done");
      else setStatus("in-progress");
    } else {
      // Reset form for new task
      setTitle("");
      setDescription("");
      const today = format(new Date(), "yyyy-MM-dd");
      setStartDate(today);
      setEndDate(today);
      setStatus("todo");
    }
  }, [task, open]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    let progress = 0;
    if (status === "in-progress") progress = 50;
    if (status === "done") progress = 100;

    onSave({
      title,
      description,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      progress,
      tags: [],
      dependencies: [],
    });

    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[525px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>{task ? "Edit Task" : "Create New Task"}</DialogTitle>
            <DialogDescription>
              {task
                ? "Update task details below."
                : "Add a new task to your board."}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="title">
                Title <span className="text-destructive">*</span>
              </Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                placeholder="Task name"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Task description (optional)"
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="startDate">
                  Start Date <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="startDate"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  required
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="endDate">
                  End Date <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="endDate"
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="status">Status</Label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger id="status">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todo">To Do</SelectItem>
                  <SelectItem value="in-progress">In Progress</SelectItem>
                  <SelectItem value="done">Done</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={!title || !startDate || !endDate}>
              {task ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}