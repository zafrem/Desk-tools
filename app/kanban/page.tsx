"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { GanttTaskForm } from "@/components/gantt-task-form";
import { KanbanBoard } from "@/components/kanban-board";
import { db, GanttTask } from "@/lib/db";
import { Plus, Download, Upload } from "lucide-react";
import { useLiveQuery } from "dexie-react-hooks";

export default function KanbanPage() {
  const [isFormOpen, setIsFormOpen] = React.useState(false);
  const [editingTask, setEditingTask] = React.useState<GanttTask | undefined>();

  // Live query from Dexie - automatically updates when data changes
  const tasks = useLiveQuery(
    () => db.ganttTasks.orderBy("startDate").toArray(),
    []
  );

  const handleCreateTask = async (
    taskData: Omit<GanttTask, "id" | "createdAt" | "updatedAt">
  ) => {
    const now = new Date();
    await db.ganttTasks.add({
      ...taskData,
      createdAt: now,
      updatedAt: now,
    });
  };

  const handleUpdateTask = async (
    taskData: Omit<GanttTask, "id" | "createdAt" | "updatedAt">
  ) => {
    if (editingTask?.id) {
      await db.ganttTasks.update(editingTask.id, {
        ...taskData,
        updatedAt: new Date(),
      });
      setEditingTask(undefined);
    }
  };

  const handleUpdateStatus = async (task: GanttTask, newProgress: number) => {
    if (task.id) {
      await db.ganttTasks.update(task.id, {
        progress: newProgress,
        updatedAt: new Date(),
      });
    }
  };

  const handleDeleteTask = async (id: number) => {
    if (confirm("Are you sure you want to delete this task?")) {
      await db.ganttTasks.delete(id);
    }
  };

  const handleEdit = (task: GanttTask) => {
    setEditingTask(task);
    setIsFormOpen(true);
  };

  const handleFormClose = (open: boolean) => {
    setIsFormOpen(open);
    if (!open) {
      setEditingTask(undefined);
    }
  };

  const handleExport = () => {
    if (!tasks || tasks.length === 0) return;

    const dataStr = JSON.stringify(tasks, null, 2);
    const dataBlob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `kanban-tasks-${new Date().toISOString().split("T")[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "application/json";
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;

      try {
        const text = await file.text();
        const importedTasks = JSON.parse(text);

        if (!Array.isArray(importedTasks)) {
          alert("Invalid file format");
          return;
        }

        // Convert date strings back to Date objects
        const tasksToImport = importedTasks.map((task) => ({
          ...task,
          id: undefined, // Let Dexie generate new IDs
          startDate: new Date(task.startDate),
          endDate: new Date(task.endDate),
          createdAt: new Date(task.createdAt || Date.now()),
          updatedAt: new Date(task.updatedAt || Date.now()),
        }));

        await db.ganttTasks.bulkAdd(tasksToImport);
        alert(`Successfully imported ${tasksToImport.length} tasks`);
      } catch (error) {
        console.error("Import error:", error);
        alert("Failed to import tasks. Please check the file format.");
      }
    };
    input.click();
  };

  return (
    <div className="container mx-auto p-8 max-w-7xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Kanban</h1>
        <p className="text-muted-foreground">
          Manage your project tasks with a simple drag-and-drop workflow. All data is stored locally.
        </p>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-wrap gap-2 mb-6">
        <Button onClick={() => setIsFormOpen(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          New Task
        </Button>
        <Button
          variant="outline"
          onClick={handleExport}
          disabled={!tasks || tasks.length === 0}
          className="gap-2"
        >
          <Download className="h-4 w-4" />
          Export
        </Button>
        <Button variant="outline" onClick={handleImport} className="gap-2">
          <Upload className="h-4 w-4" />
          Import
        </Button>
      </div>

      {/* Board */}
      {tasks === undefined ? (
        <div className="text-center py-12 text-muted-foreground">
          Loading tasks...
        </div>
      ) : (
        <KanbanBoard
          tasks={tasks}
          onEdit={handleEdit}
          onDelete={handleDeleteTask}
          onUpdateStatus={handleUpdateStatus}
        />
      )}

      {/* Task Form Dialog */}
      <GanttTaskForm
        open={isFormOpen}
        onOpenChange={handleFormClose}
        onSave={editingTask ? handleUpdateTask : handleCreateTask}
        task={editingTask}
      />

      {/* Info Box */}
      <div className="mt-8 rounded-lg border bg-card p-4 text-sm text-muted-foreground">
        <h3 className="font-semibold text-foreground mb-2">
          Local Storage Notice
        </h3>
        <p>
          Your Kanban board data is stored locally in your browser. Use Export/Import to backup or transfer your data.
        </p>
      </div>
    </div>
  );
}