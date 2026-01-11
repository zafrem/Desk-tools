"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Plus, ExternalLink, Edit2, Trash2, FolderPlus, Download, Upload, GripVertical } from "lucide-react";
import { db, Bookmark } from "@/lib/db";
import { useLiveQuery } from "dexie-react-hooks";
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

function BookmarkCard({ bookmark, onEdit, onDelete }: { bookmark: Bookmark; onEdit: (b: Bookmark) => void; onDelete: (id: number) => void }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: bookmark.id!.toString(),
    data: { bookmark },
  });

  const style = {
    transform: CSS.Translate.toString(transform),
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <Card ref={setNodeRef} style={style} className="group hover:shadow-md transition-shadow bg-card relative">
      <CardContent className="p-3 flex items-center justify-between gap-2">
        <div className="flex items-center gap-3 min-w-0">
          <div {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing text-muted-foreground">
            <GripVertical className="h-4 w-4" />
          </div>
          <div className="min-w-0">
            <a 
                href={bookmark.url} 
                target="_blank" 
                rel="noopener noreferrer" 
                className="font-medium text-sm hover:text-primary transition-colors flex items-center gap-1.5 truncate"
            >
                {bookmark.title}
                <ExternalLink className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
            </a>
            <div className="text-[10px] text-muted-foreground truncate">{bookmark.url}</div>
          </div>
        </div>
        
        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onEdit(bookmark)}>
            <Edit2 className="h-3 w-3" />
          </Button>
          <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive" onClick={() => bookmark.id && onDelete(bookmark.id)}>
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function BookmarkGroup({ id, title, bookmarks, onEdit, onDelete }: { id: string; title: string; bookmarks: Bookmark[]; onEdit: (b: Bookmark) => void; onDelete: (id: number) => void }) {
  const { setNodeRef } = useDroppable({ id });

  return (
    <div ref={setNodeRef} className="space-y-3 bg-muted/20 p-4 rounded-xl border min-h-[150px]">
      <div className="flex items-center justify-between mb-2">
        <h3 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground">{title}</h3>
        <span className="text-[10px] bg-muted px-1.5 py-0.5 rounded border">{bookmarks.length}</span>
      </div>
      <div className="grid gap-2">
        {bookmarks.map((b) => (
          <BookmarkCard key={b.id} bookmark={b} onEdit={onEdit} onDelete={onDelete} />
        ))}
        {bookmarks.length === 0 && (
            <div className="text-center py-6 text-xs text-muted-foreground border-2 border-dashed rounded-lg">
                Drop bookmarks here
            </div>
        )}
      </div>
    </div>
  );
}

export default function BookmarksPage() {
  const [isDialogOpen, setIsDialogOpen] = React.useState(false);
  const [editingBookmark, setEditingBookmark] = React.useState<Bookmark | null>(null);
  const [activeBookmark, setActiveBookmark] = React.useState<Bookmark | null>(null);

  // Form State
  const [titleInput, setTitleInput] = React.useState("");
  const [urlInput, setUrlInput] = React.useState("");
  const [groupInput, setGroupInput] = React.useState("General");

  const bookmarks = useLiveQuery(() => db.bookmarks.orderBy("order").toArray(), []);

  const groups = React.useMemo(() => {
    if (!bookmarks) return ["General"];
    const set = new Set(bookmarks.map(b => b.group || "General"));
    if (set.size === 0) set.add("General");
    return Array.from(set).sort();
  }, [bookmarks]);

  const handleOpenDialog = (b?: Bookmark) => {
    if (b) {
      setEditingBookmark(b);
      setTitleInput(b.title);
      setUrlInput(b.url);
      setGroupInput(b.group || "General");
    } else {
      setEditingBookmark(null);
      setTitleInput("");
      setUrlInput("");
      setGroupInput("General");
    }
    setIsDialogOpen(true);
  };

  const handleSave = async () => {
    if (!titleInput || !urlInput) return;
    
    // Auto-fix URL if missing protocol
    let finalUrl = urlInput;
    if (!/^https?:\/\//i.test(finalUrl)) {
        finalUrl = 'https://' + finalUrl;
    }

    const data = {
      title: titleInput,
      url: finalUrl,
      group: groupInput || "General",
      updatedAt: new Date(),
    };

    if (editingBookmark?.id) {
      await db.bookmarks.update(editingBookmark.id, data);
    } else {
      await db.bookmarks.add({
        ...data,
        order: (bookmarks?.length || 0),
        createdAt: new Date(),
      });
    }
    setIsDialogOpen(false);
  };

  const handleDelete = async (id: number) => {
    if (confirm("Delete this bookmark?")) {
      await db.bookmarks.delete(id);
    }
  };

  const handleDragStart = (event: DragStartEvent) => {
    if (event.active.data.current?.bookmark) {
        setActiveBookmark(event.active.data.current.bookmark);
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveBookmark(null);
    if (!over) return;

    const bookmarkId = parseInt(active.id as string);
    const targetGroupId = over.id as string;

    const b = bookmarks?.find(x => x.id === bookmarkId);
    if (b && b.group !== targetGroupId) {
        await db.bookmarks.update(bookmarkId, { group: targetGroupId, updatedAt: new Date() });
    }
  };

  const handleExport = () => {
    if (!bookmarks?.length) return;
    const dataStr = JSON.stringify(bookmarks, null, 2);
    const blob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `bookmarks-${new Date().toISOString().split("T")[0]}.json`;
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
        const data = JSON.parse(text);
        if (Array.isArray(data)) {
          const valid = data.map(x => ({
            ...x,
            id: undefined,
            createdAt: new Date(x.createdAt || Date.now()),
            updatedAt: new Date(x.updatedAt || Date.now())
          }));
          await db.bookmarks.bulkAdd(valid);
        }
      } catch (err) { console.error(err); }
    };
    input.click();
  };

  return (
    <div className="container mx-auto p-8 max-w-7xl">
      <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
            <h1 className="text-3xl font-bold mb-2">Bookmarks</h1>
            <p className="text-muted-foreground">Manage and organize your frequently used links.</p>
        </div>
        <div className="flex gap-2">
            <Button onClick={() => handleOpenDialog()}>
                <Plus className="h-4 w-4 mr-2" /> Add Link
            </Button>
            <Button variant="outline" size="icon" onClick={handleExport} title="Export">
                <Download className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="icon" onClick={handleImport} title="Import">
                <Upload className="h-4 w-4" />
            </Button>
        </div>
      </div>

      <DndContext onDragStart={handleDragStart} onDragEnd={handleDragEnd} collisionDetection={closestCorners}>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {groups.map(group => (
                <BookmarkGroup 
                    key={group} 
                    id={group} 
                    title={group} 
                    bookmarks={bookmarks?.filter(b => (b.group || "General") === group) || []}
                    onEdit={handleOpenDialog}
                    onDelete={handleDelete}
                />
            ))}
            <Button 
                variant="ghost" 
                className="h-[150px] border-2 border-dashed border-muted hover:border-primary/50 hover:bg-muted/30"
                onClick={() => {
                    const name = prompt("Enter group name:");
                    if (name) setGroupInput(name);
                    handleOpenDialog();
                }}
            >
                <FolderPlus className="h-6 w-6 mb-2 mr-2" /> New Group
            </Button>
        </div>

        <DragOverlay>
            {activeBookmark ? (
                <div className="w-[250px] opacity-80 rotate-2">
                    <Card className="bg-card shadow-xl border-primary/50">
                        <CardContent className="p-3">
                            <div className="font-medium text-sm">{activeBookmark.title}</div>
                        </CardContent>
                    </Card>
                </div>
            ) : null}
        </DragOverlay>
      </DndContext>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingBookmark ? "Edit Bookmark" : "New Bookmark"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Title</Label>
              <Input value={titleInput} onChange={(e) => setTitleInput(e.target.value)} placeholder="e.g. GitHub" />
            </div>
            <div className="space-y-2">
              <Label>URL</Label>
              <Input value={urlInput} onChange={(e) => setUrlInput(e.target.value)} placeholder="https://..." />
            </div>
            <div className="space-y-2">
              <Label>Group</Label>
              <Input value={groupInput} onChange={(e) => setGroupInput(e.target.value)} placeholder="General" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={!titleInput || !urlInput}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
