"use client";

import * as React from "react";
import { GanttTask } from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Edit2, Trash2, Eye, EyeOff, ArrowUpDown } from "lucide-react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

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
      className="flex-1 min-w-[250px] flex flex-col gap-4 bg-muted/30 p-4 rounded-xl border min-h-[500px] transition-all duration-300"
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
        {tasks.map((task) => (
          <KanbanCard key={task.id} task={task} onEdit={onEdit} onDelete={onDelete} />
        ))}
      </div>
    </div>
  );
}

type SortOption = "startDate" | "endDate" | "createdAt" | "title" | "none";

const isValidSortOption = (value: string | null): value is SortOption => {
  return (
    value === "startDate" ||
    value === "endDate" ||
    value === "createdAt" ||
    value === "title" ||
    value === "none"
  );
};

export function KanbanBoard({ tasks, onEdit, onDelete, onUpdateStatus }: KanbanBoardProps) {
  const [activeTask, setActiveTask] = React.useState<GanttTask | null>(null);

  // Collapse state persisted in localStorage
  const [collapsedColumns, setCollapsedColumns] = React.useState<Record<string, boolean>>({});

  // Sorting state persisted in localStorage
  const [sortBy, setSortBy] = React.useState<SortOption>("none");

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
      const savedSort = localStorage.getItem("kanban_sort_by");
      if (isValidSortOption(savedSort)) {
        setSortBy(savedSort);
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

  const handleSortChange = (value: string) => {
    if (isValidSortOption(value)) {
      setSortBy(value);
      localStorage.setItem("kanban_sort_by", value);
    }
  };

  // Sort tasks based on selected option
  const sortedTasks = React.useMemo(() => {
    if (!tasks) return [];
    const tasksCopy = [...tasks];

    if (sortBy === "none") {
      return tasksCopy; // Default DB order (insertion order / id order)
    }

    return tasksCopy.sort((a, b) => {
      if (sortBy === "startDate") {
        return new Date(a.startDate).getTime() - new Date(b.startDate).getTime();
      }
      if (sortBy === "endDate") {
        return new Date(a.endDate).getTime() - new Date(b.endDate).getTime();
      }
      if (sortBy === "createdAt") {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(); // Newest first
      }
      if (sortBy === "title") {
        return a.title.localeCompare(b.title);
      }
      return 0;
    });
  }, [tasks, sortBy]);

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
    <div className="space-y-6">
      {/* Board Controls */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-muted/20 p-4 rounded-xl border">
        <div className="flex items-center gap-2">
          <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium">Sort Cards:</span>
          <Select value={sortBy} onValueChange={handleSortChange}>
            <SelectTrigger className="w-[220px] h-9 bg-background">
              <SelectValue placeholder="Sort order..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">No Sorting (Creation Order)</SelectItem>
              <SelectItem value="startDate">Start Date (Chronological)</SelectItem>
              <SelectItem value="endDate">Due Date (Chronological)</SelectItem>
              <SelectItem value="createdAt">Date Created (Newest First)</SelectItem>
              <SelectItem value="title">Title (A-Z)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {Object.values(collapsedColumns).some(Boolean) && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setCollapsedColumns({});
              localStorage.setItem("kanban_collapsed_columns", JSON.stringify({}));
            }}
            className="text-xs h-8 text-muted-foreground hover:text-foreground"
          >
            Expand All Columns
          </Button>
        )}
      </div>

      <DndContext onDragStart={handleDragStart} onDragEnd={handleDragEnd} collisionDetection={closestCorners}>
        <div className="flex flex-col md:flex-row gap-6 h-full items-stretch w-full overflow-x-auto pb-4">
          {COLUMNS.map((col) => {
            const colTasks = sortedTasks.filter((t) => {
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