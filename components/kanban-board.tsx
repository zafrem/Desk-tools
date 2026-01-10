"use client";

import * as React from "react";
import { GanttTask } from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Edit2, Trash2 } from "lucide-react";
import { format } from "date-fns";
import {
  DndContext,
  DragOverlay,
  useDraggable,
  useDroppable,
  DragEndEvent,
  DragStartEvent,
  closestCorners,
} from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { createPortal } from "react-dom";

interface KanbanBoardProps {
  tasks: GanttTask[];
  onEdit: (task: GanttTask) => void;
  onDelete: (id: number) => void;
  onUpdateStatus: (task: GanttTask, newProgress: number) => void;
}

const COLUMNS = [
  { id: "todo", title: "To Do", progress: 0 },
  { id: "in-progress", title: "In Progress", progress: 50 },
  { id: "done", title: "Done", progress: 100 },
];

function KanbanCard({ task, onEdit, onDelete }: { task: GanttTask; onEdit: (t: GanttTask) => void; onDelete: (id: number) => void }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: task.id!.toString(),
    data: { task },
  });

  const style = {
    transform: CSS.Translate.toString(transform),
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <Card className="cursor-grab active:cursor-grabbing hover:shadow-md transition-shadow bg-card relative">
        <CardHeader className="p-4 pb-2 space-y-1">
          <CardTitle className="text-sm font-medium leading-none">{task.title}</CardTitle>
          <div className="text-xs text-muted-foreground">
            {format(task.startDate, "MMM d")} - {format(task.endDate, "MMM d")}
          </div>
        </CardHeader>
        <CardContent className="p-4 pt-2">
          {task.description && (
            <p className="text-xs text-muted-foreground line-clamp-2 mb-3">
              {task.description}
            </p>
          )}
          <div className="flex items-center justify-end mt-2 pt-2 border-t gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={(e) => {
                e.stopPropagation(); // Prevent drag start
                onEdit(task);
              }}
              onPointerDown={(e) => e.stopPropagation()} // Stop drag listeners
            >
              <Edit2 className="h-3 w-3" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 text-destructive hover:text-destructive"
              onClick={(e) => {
                e.stopPropagation();
                if (task.id) onDelete(task.id);
              }}
              onPointerDown={(e) => e.stopPropagation()}
            >
              <Trash2 className="h-3 w-3" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function KanbanColumn({ id, title, tasks, onEdit, onDelete }: { id: string; title: string; tasks: GanttTask[]; onEdit: (task: GanttTask) => void; onDelete: (id: number) => void }) {
  const { setNodeRef } = useDroppable({
    id: id,
  });

  return (
    <div ref={setNodeRef} className="flex flex-col gap-4 bg-muted/30 p-4 rounded-xl border min-h-[500px]">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-lg">{title}</h3>
        <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded-full border">
          {tasks.length}
        </span>
      </div>
      <div className="flex flex-col gap-3 flex-1">
        {tasks.length === 0 && (
            <div className="text-center py-8 text-sm text-muted-foreground border-2 border-dashed rounded-lg h-24 flex items-center justify-center">
                Drop here
            </div>
        )}
        {tasks.map((task) => (
          <KanbanCard key={task.id} task={task} onEdit={onEdit} onDelete={onDelete} />
        ))}
      </div>
    </div>
  );
}

export function KanbanBoard({ tasks, onEdit, onDelete, onUpdateStatus }: KanbanBoardProps) {
  const [activeTask, setActiveTask] = React.useState<GanttTask | null>(null);

  const handleDragStart = (event: DragStartEvent) => {
    if (event.active.data.current?.task) {
      setActiveTask(event.active.data.current.task);
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveTask(null);

    if (!over) return;

    const taskId = parseInt(active.id as string);
    const columnId = over.id as string;

    const task = tasks.find((t) => t.id === taskId);
    if (!task) return;

    const targetColumn = COLUMNS.find((c) => c.id === columnId);
    if (targetColumn) {
      // Only update if the progress value is different (roughly)
      // Map 0 -> todo, 50 -> in-progress, 100 -> done
      // If we drag from todo (0) to in-progress (50), we update.
      let currentColumnId = "todo";
      if (task.progress === 100) currentColumnId = "done";
      else if (task.progress > 0) currentColumnId = "in-progress";

      if (currentColumnId !== columnId) {
        onUpdateStatus(task, targetColumn.progress);
      }
    }
  };

  return (
    <DndContext onDragStart={handleDragStart} onDragEnd={handleDragEnd} collisionDetection={closestCorners}>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-full">
        {COLUMNS.map((col) => {
          const colTasks = tasks.filter((t) => {
            if (col.id === "todo") return t.progress === 0;
            if (col.id === "done") return t.progress === 100;
            return t.progress > 0 && t.progress < 100;
          });
          return (
            <KanbanColumn
              key={col.id}
              id={col.id}
              title={col.title}
              tasks={colTasks}
              onEdit={onEdit}
              onDelete={onDelete}
            />
          );
        })}
      </div>
      
      {typeof document !== "undefined" && createPortal(
        <DragOverlay>
          {activeTask ? (
             <div className="opacity-80 rotate-2 cursor-grabbing w-[300px]">
                <Card className="bg-card shadow-xl border-primary/50">
                    <CardHeader className="p-4 pb-2 space-y-1">
                    <CardTitle className="text-sm font-medium leading-none">{activeTask.title}</CardTitle>
                    </CardHeader>
                    <CardContent className="p-4 pt-2">
                        {activeTask.description && (
                            <p className="text-xs text-muted-foreground line-clamp-2">
                            {activeTask.description}
                            </p>
                        )}
                    </CardContent>
                </Card>
             </div>
          ) : null}
        </DragOverlay>,
        document.body
      )}
    </DndContext>
  );
}