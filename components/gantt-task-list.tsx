"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { GanttTask } from "@/lib/db";
import { format } from "date-fns";
import { Edit2, Trash2 } from "lucide-react";

interface GanttTaskListProps {
  tasks: GanttTask[];
  onEdit: (task: GanttTask) => void;
  onDelete: (id: number) => void;
}

export function GanttTaskList({ tasks, onEdit, onDelete }: GanttTaskListProps) {
  if (tasks.length === 0) {
    return (
      <div className="rounded-lg border border-dashed p-12 text-center">
        <p className="text-muted-foreground">
          No tasks yet. Create your first task to get started.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-muted/50">
            <tr className="border-b">
              <th className="px-4 py-3 text-left text-sm font-medium">Task</th>
              <th className="px-4 py-3 text-left text-sm font-medium">
                Start Date
              </th>
              <th className="px-4 py-3 text-left text-sm font-medium">
                End Date
              </th>
              <th className="px-4 py-3 text-left text-sm font-medium">
                Progress
              </th>
              <th className="px-4 py-3 text-right text-sm font-medium">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {tasks.map((task) => (
              <tr key={task.id} className="border-b last:border-0 hover:bg-muted/30">
                <td className="px-4 py-3">
                  <div>
                    <div className="font-medium">{task.title}</div>
                    {task.description && (
                      <div className="text-sm text-muted-foreground line-clamp-1">
                        {task.description}
                      </div>
                    )}
                  </div>
                </td>
                <td className="px-4 py-3 text-sm">
                  {format(task.startDate, "MMM d, yyyy")}
                </td>
                <td className="px-4 py-3 text-sm">
                  {format(task.endDate, "MMM d, yyyy")}
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary transition-all"
                        style={{ width: `${task.progress}%` }}
                      />
                    </div>
                    <span className="text-sm text-muted-foreground min-w-[3ch]">
                      {task.progress}%
                    </span>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-end gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onEdit(task)}
                      className="h-8 w-8 p-0"
                    >
                      <Edit2 className="h-4 w-4" />
                      <span className="sr-only">Edit</span>
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => task.id && onDelete(task.id)}
                      className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                      <span className="sr-only">Delete</span>
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
