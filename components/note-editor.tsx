"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Note } from "@/lib/db";
import { Save, X, FileDown } from "lucide-react";

interface NoteEditorProps {
  note: { title: string; content: string } | null;
  onSave: (note: { title: string; content: string }) => void;
  onCancel: () => void;
}

export function NoteEditor({ note, onSave, onCancel }: NoteEditorProps) {
  const [title, setTitle] = React.useState("");
  const [content, setContent] = React.useState("");

  React.useEffect(() => {
    if (note) {
      setTitle(note.title);
      setContent(note.content);
    } else {
      setTitle("");
      setContent("");
    }
  }, [note]);

  const handleSave = () => {
    if (!title.trim()) {
      alert("Please enter a title");
      return;
    }

    onSave({
      title: title.trim(),
      content,
    });

    // Reset form
    setTitle("");
    setContent("");
  };

  const handleDownloadMD = () => {
    if (!title.trim()) {
      alert("Note needs a title to download");
      return;
    }

    const mdContent = `# ${title}\n\n${content}`;
    const blob = new Blob([mdContent], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    const fileName = title.toLowerCase().replace(/[^a-z0-9]/g, "-") || "note";
    link.href = url;
    link.download = `${fileName}.md`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">
          {note ? "Edit Note" : "New Note"}
        </h2>
        <div className="flex gap-1">
          {note && (
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleDownloadMD}
              title="Download as Markdown"
              className="h-8 w-8 p-0"
            >
              <FileDown className="h-4 w-4" />
            </Button>
          )}
          <Button variant="ghost" size="sm" onClick={onCancel} className="h-8 w-8 p-0">
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="note-title">
            Title <span className="text-destructive">*</span>
          </Label>
          <Input
            id="note-title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Note title"
            autoFocus
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="note-content">Content</Label>
          <Textarea
            id="note-content"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Start writing..."
            rows={15}
            className="font-mono text-sm resize-none"
          />
        </div>

        <div className="flex gap-2">
          <Button onClick={handleSave} className="gap-2">
            <Save className="h-4 w-4" />
            Save Note
          </Button>
          {note && (
            <Button variant="outline" onClick={handleDownloadMD} className="gap-2">
              <FileDown className="h-4 w-4" />
              Download .md
            </Button>
          )}
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
        </div>
      </div>
    </div>
  );
}
