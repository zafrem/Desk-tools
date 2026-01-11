"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { NoteEditor } from "@/components/note-editor";
import { NoteList } from "@/components/note-list";
import { db, Note } from "@/lib/db";
import { Plus, Download, Upload } from "lucide-react";
import { useLiveQuery } from "dexie-react-hooks";

export default function NotepadPage() {
  const [selectedNote, setSelectedNote] = React.useState<Note | null>(null);
  const [isEditing, setIsEditing] = React.useState(false);

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
    <div className="container mx-auto p-8 max-w-6xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Notepad</h1>
        <p className="text-muted-foreground">
          Write and organize your notes. All data is stored locally in your
          browser.
        </p>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-wrap gap-2 mb-6">
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
          Export
        </Button>
        <Button variant="outline" onClick={handleImport} className="gap-2">
          <Upload className="h-4 w-4" />
          Import
        </Button>
      </div>

      {/* Content Area */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Left: Note List */}
        <div>
          <h2 className="text-lg font-semibold mb-4">
            All Notes ({notes?.length || 0})
          </h2>
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

        {/* Right: Editor */}
        <div className="lg:sticky lg:top-20 lg:self-start">
          {isEditing ? (
            <div className="rounded-lg border p-6">
              <NoteEditor
                note={selectedNote}
                onSave={selectedNote ? handleUpdateNote : handleCreateNote}
                onCancel={handleCancel}
              />
            </div>
          ) : (
            <div className="rounded-lg border border-dashed p-12 text-center">
              <p className="text-muted-foreground mb-4">
                Select a note to edit or create a new one
              </p>
              <Button onClick={handleNewNote} className="gap-2">
                <Plus className="h-4 w-4" />
                New Note
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Info Box */}
      <div className="mt-8 rounded-lg border bg-card p-4 text-sm text-muted-foreground">
        <h3 className="font-semibold text-foreground mb-2">
          Local Storage Notice
        </h3>
        <p>
          All notes are stored locally in your browser using IndexedDB. Your
          data never leaves your device. Use the Export feature to backup your
          notes, and Import to restore them.
        </p>
      </div>
    </div>
  );
}
