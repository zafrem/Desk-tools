"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { NoteEditor } from "@/components/note-editor";
import { NoteList } from "@/components/note-list";
import { db, Note } from "@/lib/db";
import { Plus, Download, Upload, PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { useLiveQuery } from "dexie-react-hooks";
import { cn } from "@/lib/utils";

export default function NotepadPage() {
  const [selectedNote, setSelectedNote] = React.useState<Note | null>(null);
  const [isEditing, setIsEditing] = React.useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = React.useState(true);

  // Live query from Dexie - automatically updates when data changes
  const notes = useLiveQuery(
    () => db.notes.orderBy("updatedAt").reverse().toArray(),
    []
  );

  const handleCreateNote = async (
    noteData: Omit<Note, "id" | "createdAt" | "updatedAt">
  ) => {
    const now = new Date();
    await db.notes.add({
      ...noteData,
      createdAt: now,
      updatedAt: now,
    });
    setIsEditing(false);
    setSelectedNote(null);
  };

  const handleUpdateNote = async (
    noteData: Omit<Note, "id" | "createdAt" | "updatedAt">
  ) => {
    if (selectedNote?.id) {
      await db.notes.update(selectedNote.id, {
        ...noteData,
        updatedAt: new Date(),
      });
      setIsEditing(false);
      setSelectedNote(null);
    }
  };

  const handleDeleteNote = async (id: number) => {
    if (confirm("Are you sure you want to delete this note?")) {
      await db.notes.delete(id);
      if (selectedNote?.id === id) {
        setSelectedNote(null);
        setIsEditing(false);
      }
    }
  };

  const handleSelectNote = (note: Note) => {
    setSelectedNote(note);
    setIsEditing(true);
  };

  const handleNewNote = () => {
    setSelectedNote(null);
    setIsEditing(true);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setSelectedNote(null);
  };

  const handleExport = () => {
    if (!notes || notes.length === 0) return;

    const dataStr = JSON.stringify(notes, null, 2);
    const dataBlob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `notes-${new Date().toISOString().split("T")[0]}.json`;
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
        const importedNotes = JSON.parse(text);

        if (!Array.isArray(importedNotes)) {
          alert("Invalid file format");
          return;
        }

        // Convert date strings back to Date objects
        const notesToImport = importedNotes.map((note) => ({
          ...note,
          id: undefined, // Let Dexie generate new IDs
          createdAt: new Date(note.createdAt || Date.now()),
          updatedAt: new Date(note.updatedAt || Date.now()),
        }));

        await db.notes.bulkAdd(notesToImport);
        alert(`Successfully imported ${notesToImport.length} notes`);
      } catch (error) {
        console.error("Import error:", error);
        alert("Failed to import notes. Please check the file format.");
      }
    };
    input.click();
  };

  return (
    <div className="container mx-auto p-4 lg:p-8 max-w-7xl">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold mb-2">Notepad</h1>
          <p className="text-muted-foreground">
            Write and organize your notes. All data is stored locally.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button onClick={handleNewNote} className="gap-2">
            <Plus className="h-4 w-4" />
            New Note
          </Button>
          <Button
            variant="outline"
            onClick={handleExport}
            disabled={!notes || notes.length === 0}
            className="gap-2"
          >
            <Download className="h-4 w-4" />
            Export JSON
          </Button>
          <Button variant="outline" onClick={handleImport} className="gap-2">
            <Upload className="h-4 w-4" />
            Import
          </Button>
        </div>
      </div>

      {/* Main Content with Sidebar */}
      <div className="flex flex-col lg:flex-row gap-6 items-start">
        {/* Sidebar / Note List */}
        <aside 
          className={cn(
            "w-full transition-all duration-300 ease-in-out lg:sticky lg:top-20",
            isSidebarOpen ? "lg:w-80" : "lg:w-12 h-12 lg:h-auto overflow-hidden"
          )}
        >
          <div className="flex items-center justify-between mb-4">
            {isSidebarOpen && (
              <h2 className="text-lg font-semibold whitespace-nowrap">
                All Notes ({notes?.length || 0})
              </h2>
            )}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              title={isSidebarOpen ? "Collapse List" : "Expand List"}
              className={cn(!isSidebarOpen && "mx-auto")}
            >
              {isSidebarOpen ? <PanelLeftClose className="h-5 w-5" /> : <PanelLeftOpen className="h-5 w-5" />}
            </Button>
          </div>

          {isSidebarOpen && (
            <div className="max-h-[calc(100vh-300px)] overflow-y-auto pr-1">
              {notes === undefined ? (
                <div className="text-center py-12 text-muted-foreground">
                  Loading notes...
                </div>
              ) : (
                <NoteList
                  notes={notes}
                  selectedNoteId={selectedNote?.id}
                  onSelect={handleSelectNote}
                  onDelete={handleDeleteNote}
                />
              )}
            </div>
          )}
        </aside>

        {/* Editor Area */}
        <main className="flex-1 w-full min-w-0">
          {isEditing ? (
            <div className="rounded-lg border p-6 bg-card shadow-sm">
              <NoteEditor
                note={selectedNote}
                onSave={selectedNote ? handleUpdateNote : handleCreateNote}
                onCancel={handleCancel}
              />
            </div>
          ) : (
            <div className="rounded-lg border border-dashed p-12 text-center bg-muted/20">
              <Plus className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-20" />
              <p className="text-muted-foreground mb-6 max-w-sm mx-auto">
                Select a note from the list to view or edit its content, or create a fresh one to get started.
              </p>
              <Button onClick={handleNewNote} className="gap-2">
                <Plus className="h-4 w-4" />
                Create New Note
              </Button>
            </div>
          )}
        </main>
      </div>

      {/* Info Box */}
      <div className="mt-8 rounded-lg border bg-card p-4 text-sm text-muted-foreground">
        <h3 className="font-semibold text-foreground mb-2">
          Local Storage Notice
        </h3>
        <p>
          All notes are stored locally in your browser using IndexedDB. Use the Export feature to backup your
          notes, and Import to restore them. Individual notes can be downloaded as Markdown (.md) files.
        </p>
      </div>
    </div>
  );
}
