"use client";

import * as React from "react";
import { GanttTask, db } from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Edit2, Trash2, Eye, EyeOff } from "lucide-react";
import { format } from "date-fns";
import {
  DndContext,
  DragOverlay,
  useDroppable,
  DragEndEvent,
  DragStartEvent,
  closestCorners,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
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

// Which column a task belongs to, derived from its progress value.
const columnIdForProgress = (progress: number) =>
  progress === 0 ? "todo" : progress === 100 ? "done" : "in-progress";

// Stable sort for a column: by manual `order`, then id as a tiebreaker.
const byOrder = (a: GanttTask, b: GanttTask) =>
  (a.order ?? 0) - (b.order ?? 0) || (a.id ?? 0) - (b.id ?? 0);

function KanbanCard({ task, onEdit, onDelete }: { task: GanttTask; onEdit: (t: GanttTask) => void; onDelete: (id: number) => void }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: task.id!.toString(),
    data: { task },
  });

  const style = {
    transform: CSS.Translate.toString(transform),
    transition,
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

interface KanbanColumnProps {
  id: string;
  title: string;
  tasks: GanttTask[];
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  onEdit: (task: GanttTask) => void;
  onDelete: (id: number) => void;
}

function KanbanColumn({
  id,
  title,
  tasks,
  isCollapsed,
  onToggleCollapse,
  onEdit,
  onDelete,
}: KanbanColumnProps) {
  const { setNodeRef } = useDroppable({
    id: id,
  });

  if (isCollapsed) {
    return (
      <>
        {/* Desktop Collapsed Column */}
        <div
          onClick={onToggleCollapse}
          className="hidden md:flex flex-col items-center gap-4 bg-muted/10 hover:bg-muted/20 p-3 rounded-xl border border-dashed w-14 h-full min-h-[500px] cursor-pointer transition-all duration-300 group"
          title={`Expand ${title}`}
        >
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 group-hover:bg-muted"
            onClick={(e) => {
              e.stopPropagation();
              onToggleCollapse();
            }}
          >
            <Eye className="h-4 w-4" />
          </Button>
          <div className="flex flex-col items-center gap-2 mt-2 select-none">
            <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded-full border font-semibold">
              {tasks.length}
            </span>
            <h3 className="font-semibold text-sm text-muted-foreground whitespace-nowrap [writing-mode:vertical-lr] rotate-180 mt-2">
              {title}
            </h3>
          </div>
        </div>

        {/* Mobile Collapsed Row */}
        <div
          onClick={onToggleCollapse}
          className="flex md:hidden items-center justify-between bg-muted/10 hover:bg-muted/20 p-3 rounded-xl border border-dashed cursor-pointer transition-all duration-300 group w-full"
          title={`Expand ${title}`}
        >
          <div className="flex items-center gap-2 select-none">
            <h3 className="font-semibold text-sm text-muted-foreground">
              {title}
            </h3>
            <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded-full border font-semibold">
              {tasks.length}
            </span>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 group-hover:bg-muted"
            onClick={(e) => {
              e.stopPropagation();
              onToggleCollapse();
            }}
          >
            <Eye className="h-4 w-4" />
          </Button>
        </div>
      </>
    );
  }

  return (
    <div
      ref={setNodeRef}
      className="flex-1 min-w-0 md:min-w-[200px] flex flex-col gap-4 bg-muted/30 p-4 rounded-xl border min-h-[500px] transition-all duration-300"
    >
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-lg">{title}</h3>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded-full border">
            {tasks.length}
          </span>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 opacity-60 hover:opacity-100"
            onClick={onToggleCollapse}
            title={`Collapse ${title}`}
          >
            <EyeOff className="h-4 w-4" />
          </Button>
        </div>
      </div>
      <div className="flex flex-col gap-3 flex-1">
        {tasks.length === 0 && (
          <div className="text-center py-8 text-sm text-muted-foreground border-2 border-dashed rounded-lg h-24 flex items-center justify-center">
            Drop here
          </div>
        )}
        <SortableContext items={tasks.map(t => t.id!.toString())} strategy={verticalListSortingStrategy}>
          {tasks.map((task) => (
            <KanbanCard key={task.id} task={task} onEdit={onEdit} onDelete={onDelete} />
          ))}
        </SortableContext>
      </div>
    </div>
  );
}

export function KanbanBoard({ tasks, onEdit, onDelete }: KanbanBoardProps) {
  const [activeTask, setActiveTask] = React.useState<GanttTask | null>(null);

  // Collapse state persisted in localStorage
  const [collapsedColumns, setCollapsedColumns] = React.useState<Record<string, boolean>>({});

  // Load from localStorage on mount (prevents Next.js hydration mismatch)
  React.useEffect(() => {
    if (typeof window !== "undefined") {
      const savedCollapsed = localStorage.getItem("kanban_collapsed_columns");
      if (savedCollapsed) {
        try {
          setCollapsedColumns(JSON.parse(savedCollapsed));
        } catch (e) {
          console.error("Error parsing collapsed columns:", e);
        }
      }
    }
  }, []);

  const toggleColumnCollapse = (columnId: string) => {
    setCollapsedColumns((prev) => {
      const updated = { ...prev, [columnId]: !prev[columnId] };
      localStorage.setItem("kanban_collapsed_columns", JSON.stringify(updated));
      return updated;
    });
  };

  const handleDragStart = (event: DragStartEvent) => {
    if (event.active.data.current?.task) {
      setActiveTask(event.active.data.current.task);
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveTask(null);

    if (!over || active.id === over.id) return;

    const activeId = parseInt(active.id as string);
    const moving = tasks.find((t) => t.id === activeId);
    if (!moving) return;

    const overId = over.id as string;
    const isOverColumn = COLUMNS.some((c) => c.id === overId);

    // Resolve the destination column and, if dropped onto a card, that card.
    let destColId: string;
    let overTask: GanttTask | undefined;
    if (isOverColumn) {
      destColId = overId;
    } else {
      overTask = tasks.find((t) => t.id === parseInt(overId));
      if (!overTask) return;
      destColId = columnIdForProgress(overTask.progress);
    }

    const destProgress = COLUMNS.find((c) => c.id === destColId)!.progress;

    // The destination column, ordered, without the card being moved.
    const destTasks = tasks
      .filter((t) => columnIdForProgress(t.progress) === destColId && t.id !== activeId)
      .sort(byOrder);

    // Drop before the card we landed on; otherwise append to the end.
    const insertIndex = overTask
      ? Math.max(0, destTasks.findIndex((t) => t.id === overTask!.id))
      : destTasks.length;

    const ordered = [...destTasks];
    ordered.splice(insertIndex, 0, moving);

    // Persist the new vertical order (and the new column, if it changed)
    // for the whole destination column in a single transaction.
    await db.transaction("rw", db.ganttTasks, async () => {
      for (let i = 0; i < ordered.length; i++) {
        const t = ordered[i];
        const patch: Partial<GanttTask> = { order: i };
        if (t.id === activeId && destProgress !== moving.progress) {
          patch.progress = destProgress;
          patch.updatedAt = new Date();
        }
        await db.ganttTasks.update(t.id!, patch);
      }
    });
  };

  return (
    <div className="space-y-6">
      <DndContext onDragStart={handleDragStart} onDragEnd={handleDragEnd} collisionDetection={closestCorners}>
        <div className="flex flex-col md:flex-row gap-4 h-full items-stretch w-full pb-4">
          {COLUMNS.map((col) => {
            const colTasks = tasks
              .filter((t) => columnIdForProgress(t.progress) === col.id)
              .sort(byOrder);
            return (
              <KanbanColumn
                key={col.id}
                id={col.id}
                title={col.title}
                tasks={colTasks}
                isCollapsed={!!collapsedColumns[col.id]}
                onToggleCollapse={() => toggleColumnCollapse(col.id)}
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
    </div>
  );
}