"use client";

import * as React from "react";
import { ToolLayout } from "@/components/tool-layout";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Plus, Copy, Trash2, Search, Terminal, Check } from "lucide-react";
import { db, Command } from "@/lib/db";
import { useLiveQuery } from "dexie-react-hooks";

function CommandCard({ command, onDelete }: { command: Command; onDelete: (id: number) => void }) {
  const [copied, setCopied] = React.useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(command.command);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy", err);
    }
  };

  return (
    <Card className="group relative hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex justify-between items-start mb-2">
          <div className="font-semibold text-sm">{command.title}</div>
          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive" onClick={() => command.id && onDelete(command.id)}>
              <Trash2 className="h-3 w-3" />
            </Button>
          </div>
        </div>
        <div className="relative bg-muted/50 rounded-md p-3 font-mono text-xs break-all group-hover:bg-muted transition-colors">
          {command.command}
          <Button 
            size="icon" 
            variant="secondary" 
            className="absolute top-2 right-2 h-7 w-7 shadow-sm"
            onClick={handleCopy}
          >
            {copied ? <Check className="h-3 w-3 text-green-600" /> : <Copy className="h-3 w-3" />}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export default function CommandPalettePage() {
  const [search, setSearch] = React.useState("");
  const [isDialogOpen, setIsDialogOpen] = React.useState(false);
  
  // Form State
  const [titleInput, setTitleInput] = React.useState("");
  const [cmdInput, setCmdInput] = React.useState("");

  const commands = useLiveQuery(
    () => db.commands.orderBy("createdAt").reverse().toArray(),
    []
  );

  const filteredCommands = React.useMemo(() => {
    if (!commands) return [];
    if (!search) return commands;
    const q = search.toLowerCase();
    return commands.filter(c => 
      c.title.toLowerCase().includes(q) || 
      c.command.toLowerCase().includes(q)
    );
  }, [commands, search]);

  const handleSave = async () => {
    if (!titleInput || !cmdInput) return;

    await db.commands.add({
      title: titleInput,
      command: cmdInput,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    setTitleInput("");
    setCmdInput("");
    setIsDialogOpen(false);
  };

  const handleDelete = async (id: number) => {
    if (confirm("Delete this command?")) {
      await db.commands.delete(id);
    }
  };

  return (
    <ToolLayout
      title="Command Palette"
      description="Save your frequently used terminal commands or code snippets for quick access."
    >
      <div className="flex flex-col sm:flex-row gap-4 mb-6 justify-between items-start sm:items-center">
        <Button onClick={() => setIsDialogOpen(true)} className="gap-2">
          <Plus className="h-4 w-4" /> Add Command
        </Button>
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Search commands..." 
            className="pl-8" 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredCommands?.map((cmd) => (
          <CommandCard key={cmd.id} command={cmd} onDelete={handleDelete} />
        ))}
        {filteredCommands?.length === 0 && (
          <div className="col-span-full text-center py-12 text-muted-foreground border-2 border-dashed rounded-lg">
            <Terminal className="h-10 w-10 mx-auto mb-3 opacity-20" />
            <p>No commands found. Add one to get started.</p>
          </div>
        )}
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Command</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Title</Label>
              <Input 
                value={titleInput} 
                onChange={(e) => setTitleInput(e.target.value)} 
                placeholder="e.g. Git Commit"
              />
            </div>
            <div className="space-y-2">
              <Label>Command / Snippet</Label>
              <Textarea 
                value={cmdInput} 
                onChange={(e) => setCmdInput(e.target.value)} 
                placeholder="git commit -m 'message'"
                rows={3}
                className="font-mono text-sm"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={!titleInput || !cmdInput}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </ToolLayout>
  );
}
