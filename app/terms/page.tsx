"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Plus, Download, Upload, Search, Edit2, Trash2, FileText } from "lucide-react";
import { db, Term } from "@/lib/db";
import { useLiveQuery } from "dexie-react-hooks";

export default function TermsPage() {
  const [search, setSearch] = React.useState("");
  const [isDialogOpen, setIsDialogOpen] = React.useState(false);
  const [editingTerm, setEditingTerm] = React.useState<Term | null>(null);
  
  // Form State
  const [termInput, setTermInput] = React.useState("");
  const [defInput, setDefInput] = React.useState("");
  const [categoryInput, setCategoryInput] = React.useState("");

  const terms = useLiveQuery(
    () => db.terms.orderBy("term").toArray(),
    []
  );

  const filteredTerms = React.useMemo(() => {
    if (!terms) return [];
    if (!search) return terms;
    const q = search.toLowerCase();
    return terms.filter(t => 
      t.term.toLowerCase().includes(q) || 
      t.definition.toLowerCase().includes(q) ||
      t.category?.toLowerCase().includes(q)
    );
  }, [terms, search]);

  const handleOpenDialog = (term?: Term) => {
    if (term) {
      setEditingTerm(term);
      setTermInput(term.term);
      setDefInput(term.definition);
      setCategoryInput(term.category || "");
    } else {
      setEditingTerm(null);
      setTermInput("");
      setDefInput("");
      setCategoryInput("");
    }
    setIsDialogOpen(true);
  };

  const handleSave = async () => {
    if (!termInput || !defInput) return;

    const termData = {
      term: termInput,
      definition: defInput,
      category: categoryInput,
      updatedAt: new Date(),
    };

    if (editingTerm?.id) {
      await db.terms.update(editingTerm.id, termData);
    } else {
      await db.terms.add({
        ...termData,
        createdAt: new Date(),
      });
    }
    setIsDialogOpen(false);
  };

  const handleDelete = async (id: number) => {
    if (confirm("Are you sure you want to delete this term?")) {
      await db.terms.delete(id);
    }
  };

  const handleExport = () => {
    if (!terms || terms.length === 0) return;
    const dataStr = JSON.stringify(terms, null, 2);
    const blob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `terms-${new Date().toISOString().split("T")[0]}.json`;
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
          const validTerms = data.map(t => ({
            ...t,
            id: undefined,
            createdAt: new Date(t.createdAt || Date.now()),
            updatedAt: new Date(t.updatedAt || Date.now())
          }));
          await db.terms.bulkAdd(validTerms);
          alert(`Imported ${validTerms.length} terms.`);
        }
      } catch (err) {
        console.error(err);
        alert("Failed to import. Invalid file format.");
      }
    };
    input.click();
  };

  return (
    <div className="container mx-auto p-8 max-w-6xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Definition of Terms</h1>
        <p className="text-muted-foreground">
          Organize, define, and share your project terminology.
        </p>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 mb-6 justify-between items-start sm:items-center">
        <div className="flex gap-2">
          <Button onClick={() => handleOpenDialog()}>
            <Plus className="h-4 w-4 mr-2" /> Add Term
          </Button>
          <Button variant="outline" onClick={handleExport} disabled={!terms?.length}>
            <Download className="h-4 w-4 mr-2" /> Export
          </Button>
          <Button variant="outline" onClick={handleImport}>
            <Upload className="h-4 w-4 mr-2" /> Import
          </Button>
        </div>
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Search terms..." 
            className="pl-8" 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredTerms?.map((term) => (
          <Card key={term.id} className="group relative">
            <CardHeader className="pb-2">
              <div className="flex justify-between items-start">
                <CardTitle className="text-lg font-bold">{term.term}</CardTitle>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleOpenDialog(term)}>
                    <Edit2 className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => term.id && handleDelete(term.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              {term.category && (
                <span className="inline-block bg-muted px-2 py-0.5 rounded text-xs text-muted-foreground">
                  {term.category}
                </span>
              )}
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">{term.definition}</p>
            </CardContent>
          </Card>
        ))}
        {filteredTerms?.length === 0 && (
          <div className="col-span-full text-center py-12 text-muted-foreground border-2 border-dashed rounded-lg">
            <FileText className="h-10 w-10 mx-auto mb-3 opacity-20" />
            <p>No terms found. Add a new term to get started.</p>
          </div>
        )}
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingTerm ? "Edit Term" : "New Term"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Term</Label>
              <Input 
                value={termInput} 
                onChange={(e) => setTermInput(e.target.value)} 
                placeholder="e.g. API"
              />
            </div>
            <div className="space-y-2">
              <Label>Category (Optional)</Label>
              <Input 
                value={categoryInput} 
                onChange={(e) => setCategoryInput(e.target.value)} 
                placeholder="e.g. Backend"
              />
            </div>
            <div className="space-y-2">
              <Label>Definition</Label>
              <Textarea 
                value={defInput} 
                onChange={(e) => setDefInput(e.target.value)} 
                placeholder="Description of the term..."
                rows={5}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={!termInput || !defInput}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
