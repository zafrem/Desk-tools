"use client";

import { useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { db, DailyTask } from "@/lib/db";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Plus, Trash2, Edit2, Calendar, GripVertical } from "lucide-react";
import { isSameDay } from "date-fns";
import { cn } from "@/lib/utils";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

function SortableTaskItem({
  task,
  onToggle,
  onEdit,
  onDelete,
}: {
  task: DailyTask;
  onToggle: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id!.toString() });

  const isCompleted = task.lastCompletedAt && isSameDay(new Date(task.lastCompletedAt), new Date());

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "flex items-center justify-between p-4 rounded-lg border bg-card transition-colors",
        isCompleted && "bg-muted/50",
        isDragging && "shadow-lg border-primary/50 relative z-50 bg-background"
      )}
    >
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <div
          {...attributes}
          {...listeners}
          className="cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground p-1 rounded hover:bg-muted shrink-0 transition-colors"
          title="Drag to reorder"
        >
          <GripVertical className="h-4 w-4" />
        </div>
        <Checkbox
          checked={!!isCompleted}
          onCheckedChange={onToggle}
          id={`task-${task.id}`}
          className="shrink-0"
        />
        <label
          htmlFor={`task-${task.id}`}
          className={cn(
            "font-medium cursor-pointer flex-1 truncate select-none",
            isCompleted && "line-through text-muted-foreground"
          )}
        >
          {task.title}
        </label>
      </div>
      <div className="flex items-center gap-1 shrink-0 ml-2">
        <Button variant="ghost" size="icon" onClick={onEdit} className="h-8 w-8">
          <Edit2 className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-destructive hover:text-destructive"
          onClick={onDelete}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

export default function DailyTasksPage() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<DailyTask | null>(null);
  const [taskTitle, setTaskTitle] = useState("");

  const tasks = useLiveQuery(() => db.dailyTasks.orderBy("order").toArray(), []);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const stats = {
    total: tasks?.length || 0,
    completed: tasks?.filter(t => t.lastCompletedAt && isSameDay(new Date(t.lastCompletedAt), new Date())).length || 0
  };
  
  const percentage = stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0;

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

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    if (!tasks) return;

    const oldIndex = tasks.findIndex((t) => t.id?.toString() === active.id);
    const newIndex = tasks.findIndex((t) => t.id?.toString() === over.id);

    if (oldIndex !== -1 && newIndex !== -1) {
      const reordered = arrayMove(tasks, oldIndex, newIndex);
      
      // Update DB order in a single Dexie transaction
      await db.transaction("rw", db.dailyTasks, async () => {
        for (let i = 0; i < reordered.length; i++) {
          if (reordered[i].id) {
            await db.dailyTasks.update(reordered[i].id!, { order: i });
          }
        }
      });
    }
  };

  return (
    <div className="container mx-auto p-8 max-w-3xl">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2 flex items-center gap-2">
            <Calendar className="h-8 w-8" />
            Tasks
          </h1>
          <p className="text-muted-foreground">Track your recurring daily goals. Resets daily.</p>
        </div>
        <Button onClick={() => handleOpenDialog()}>
          <Plus className="h-4 w-4 mr-2" /> Add Task
        </Button>
      </div>

      <div className="mb-6 space-y-2">
        <div className="flex justify-between text-sm text-muted-foreground">
          <span>{percentage}% Completed</span>
          <span>{stats.completed} / {stats.total} tasks</span>
        </div>
        <Progress value={percentage} className="h-3" />
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={tasks?.map((t) => t.id!.toString()) || []}
          strategy={verticalListSortingStrategy}
        >
          <div className="space-y-2">
            {tasks?.map((task) => (
              <SortableTaskItem
                key={task.id}
                task={task}
                onToggle={() => toggleTask(task)}
                onEdit={() => handleOpenDialog(task)}
                onDelete={() => task.id && handleDelete(task.id)}
              />
            ))}
            {tasks?.length === 0 && (
              <div className="text-center py-12 text-muted-foreground border-2 border-dashed rounded-lg">
                No daily tasks yet. Add one to get started!
              </div>
            )}
          </div>
        </SortableContext>
      </DndContext>

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
