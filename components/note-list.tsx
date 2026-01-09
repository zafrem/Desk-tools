"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Note } from "@/lib/db";
import { format } from "date-fns";
import { Edit2, Trash2, FileText } from "lucide-react";

interface NoteListProps {
  notes: Note[];
  selectedNoteId?: number;
  onSelect: (note: Note) => void;
  onDelete: (id: number) => void;
}

export function NoteList({
  notes,
  selectedNoteId,
  onSelect,
  onDelete,
}: NoteListProps) {
  if (notes.length === 0) {
    return (
      <div className="rounded-lg border border-dashed p-8 text-center">
        <FileText className="h-12 w-12 mx-auto mb-3 text-muted-foreground" />
        <p className="text-muted-foreground">
          No notes yet. Create your first note to get started.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {notes.map((note) => {
        const isSelected = note.id === selectedNoteId;

        return (
          <div
            key={note.id}
            className={`rounded-lg border p-4 transition-colors cursor-pointer ${
              isSelected
                ? "border-primary bg-primary/5"
                : "hover:bg-muted/50"
            }`}
            onClick={() => onSelect(note)}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold mb-1 truncate">{note.title}</h3>
                <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
                  {note.content || "No content"}
                </p>
                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  <span>
                    Updated {format(note.updatedAt, "MMM d, yyyy")}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelect(note);
                  }}
                  className="h-8 w-8 p-0"
                >
                  <Edit2 className="h-4 w-4" />
                  <span className="sr-only">Edit</span>
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    note.id && onDelete(note.id);
                  }}
                  className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                  <span className="sr-only">Delete</span>
                </Button>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
