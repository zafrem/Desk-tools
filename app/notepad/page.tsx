"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { NoteEditor } from "@/components/note-editor";
import { NoteList } from "@/components/note-list";
import { db, Note } from "@/lib/db";
import {
  Plus,
  Download,
  Upload,
  PanelLeftClose,
  PanelLeftOpen,
  FolderOpen,
  RefreshCw,
  LogOut,
  Key,
  FileText,
  Trash2,
  FolderDot,
} from "lucide-react";
import { useLiveQuery } from "dexie-react-hooks";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

// Types for Obsidian integration
interface VaultFile {
  id: string; // Relative path, e.g. "folder/note.md"
  name: string; // File name without .md
  path: string; // Full relative path
  handle: FileSystemFileHandle;
  updatedAt: Date;
}

// Custom IndexedDB functions for saving FileSystemDirectoryHandle (which is serializable in IDB!)
async function saveDirectoryHandle(handle: FileSystemDirectoryHandle) {
  return new Promise<void>((resolve, reject) => {
    const request = indexedDB.open("ObsidianVaultStore", 1);
    request.onupgradeneeded = () => {
      request.result.createObjectStore("handles");
    };
    request.onsuccess = () => {
      const idb = request.result;
      const tx = idb.transaction("handles", "readwrite");
      const store = tx.objectStore("handles");
      const putReq = store.put(handle, "vaultHandle");
      putReq.onsuccess = () => resolve();
      putReq.onerror = () => reject(putReq.error);
    };
    request.onerror = () => reject(request.error);
  });
}

async function loadDirectoryHandle(): Promise<FileSystemDirectoryHandle | null> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open("ObsidianVaultStore", 1);
    request.onupgradeneeded = () => {
      request.result.createObjectStore("handles");
    };
    request.onsuccess = () => {
      const idb = request.result;
      const tx = idb.transaction("handles", "readonly");
      const store = tx.objectStore("handles");
      const getReq = store.get("vaultHandle");
      getReq.onsuccess = () => resolve(getReq.result || null);
      getReq.onerror = () => reject(getReq.error);
    };
    request.onerror = () => reject(request.error);
  });
}

async function clearDirectoryHandle() {
  return new Promise<void>((resolve, reject) => {
    const request = indexedDB.open("ObsidianVaultStore", 1);
    request.onsuccess = () => {
      const idb = request.result;
      const tx = idb.transaction("handles", "readwrite");
      const store = tx.objectStore("handles");
      const delReq = store.delete("vaultHandle");
      delReq.onsuccess = () => resolve();
      delReq.onerror = () => reject(delReq.error);
    };
    request.onerror = () => reject(request.error);
  });
}

// Recursively retrieve all .md files in the vault directory
async function getMarkdownFiles(
  dirHandle: FileSystemDirectoryHandle,
  relativePath = ""
): Promise<VaultFile[]> {
  const files: VaultFile[] = [];
  console.log(`Scanning directory: ${dirHandle.name}, relativePath: ${relativePath}`);
  try {
    for await (const entry of (dirHandle as unknown) as AsyncIterable<FileSystemHandle>) {
      console.log(`Found entry: ${entry.name}, kind: ${entry.kind}`);
      const entryPath = relativePath ? `${relativePath}/${entry.name}` : entry.name;
      if (entry.kind === "file") {
        if (entry.name.endsWith(".md")) {
          const file = await (entry as FileSystemFileHandle).getFile();
          console.log(`Found MD file: ${entry.name}`);
          files.push({
            id: entryPath,
            name: entry.name.slice(0, -3), // Strip .md
            path: entryPath,
            handle: entry as FileSystemFileHandle,
            updatedAt: new Date(file.lastModified),
          });
        }
      } else if (entry.kind === "directory") {
        // Ignore hidden directories like .obsidian, .git
        if (!entry.name.startsWith(".")) {
          console.log(`Recursing into directory: ${entry.name}`);
          const subFiles = await getMarkdownFiles(entry as FileSystemDirectoryHandle, entryPath);
          files.push(...subFiles);
        }
      }
    }
  } catch (error) {
    console.error("Error reading directory files:", error);
  }
  return files;
}

// Traverse directories and create file if doesn't exist
async function getOrCreateFile(
  rootDirHandle: FileSystemDirectoryHandle,
  filePath: string
): Promise<FileSystemFileHandle> {
  const parts = filePath.split("/");
  let currentDir = rootDirHandle;

  // Traverse to the parent directory
  for (let i = 0; i < parts.length - 1; i++) {
    currentDir = await currentDir.getDirectoryHandle(parts[i], { create: true });
  }

  // Create or get the file
  const fileName = parts[parts.length - 1];
  return await currentDir.getFileHandle(fileName, { create: true });
}

// Delete file recursively if needed
async function deleteVaultFile(
  rootDirHandle: FileSystemDirectoryHandle,
  filePath: string
): Promise<void> {
  const parts = filePath.split("/");
  let currentDir = rootDirHandle;

  // Traverse to parent dir
  for (let i = 0; i < parts.length - 1; i++) {
    currentDir = await currentDir.getDirectoryHandle(parts[i]);
  }

  const fileName = parts[parts.length - 1];
  await currentDir.removeEntry(fileName);
}

// Verify folder permission status
async function verifyPermission(handle: FileSystemHandle, withWrite: boolean): Promise<boolean> {
  const opts = { mode: withWrite ? "readwrite" : "read" };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  if ((await (handle as any).queryPermission(opts)) === "granted") {
    return true;
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  if ((await (handle as any).requestPermission(opts)) === "granted") {
    return true;
  }
  return false;
}

export default function NotepadPage() {
  const [selectedNote, setSelectedNote] = React.useState<Note | null>(null);
  const [isEditing, setIsEditing] = React.useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = React.useState(true);

  // Connection modes: "local" (indexedDB) vs "obsidian" (local folder via Directory Picker)
  const [mode, setMode] = React.useState<"local" | "obsidian">("local");

  // Obsidian Vault States
  const [vaultHandle, setVaultHandle] = React.useState<FileSystemDirectoryHandle | null>(null);
  const [vaultFiles, setVaultFiles] = React.useState<VaultFile[]>([]);
  const [selectedVaultFile, setSelectedObsidianFile] = React.useState<VaultFile | null>(null);
  const [isPermissionGranted, setIsPermissionGranted] = React.useState(false);
  const [vaultName, setVaultName] = React.useState("");

  // Editor states for active editing note
  const [activeEditorNote, setActiveEditorNote] = React.useState<{ title: string; content: string } | null>(null);

  // Live query from Dexie - automatically updates when data changes
  const notes = useLiveQuery(
    () => db.notes.orderBy("updatedAt").reverse().toArray(),
    []
  );

  // Load saved Obsidian handle on mount (if any)
  React.useEffect(() => {
    async function initVault() {
      const savedHandle = await loadDirectoryHandle();
      if (savedHandle) {
        setVaultHandle(savedHandle);
        setVaultName(savedHandle.name);
        // We set mode but need permission re-verification
        const hasPerm = await verifyPermission(savedHandle, false);
        setIsPermissionGranted(hasPerm);
        if (hasPerm) {
          const files = await getMarkdownFiles(savedHandle);
          setVaultFiles(files.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime()));
        }
        setMode("obsidian");
      }
    }
    initVault();
  }, []);

  // Update activeEditorNote when selection changes
  React.useEffect(() => {
    if (mode === "local") {
      if (selectedNote) {
        setActiveEditorNote({ title: selectedNote.title, content: selectedNote.content });
      } else {
        setActiveEditorNote(null);
      }
    } else {
      if (selectedVaultFile) {
        // We load the file contents on demand
        const loadFileContent = async () => {
          try {
            const hasPerm = await verifyPermission(selectedVaultFile.handle, false);
            if (hasPerm) {
              const file = await selectedVaultFile.handle.getFile();
              const text = await file.text();
              setActiveEditorNote({ title: selectedVaultFile.name, content: text });
            }
          } catch (e) {
            console.error("Error reading file:", e);
          }
        };
        loadFileContent();
      } else {
        setActiveEditorNote(null);
      }
    }
  }, [selectedNote, selectedVaultFile, mode]);

  // Connect to a local folder / Obsidian vault
  const handleConnectVault = async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if (typeof window === "undefined" || !("showDirectoryPicker" in (window as any))) {
      alert("Your browser does not support the File System Access API. Please use Chrome, Edge, or Opera.");
      return;
    }

    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const handle = await (window as any).showDirectoryPicker();
      await saveDirectoryHandle(handle);
      setVaultHandle(handle);
      setVaultName(handle.name);
      
      const hasWrite = await verifyPermission(handle, true);
      setIsPermissionGranted(hasWrite);

      if (hasWrite) {
        const files = await getMarkdownFiles(handle);
        setVaultFiles(files.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime()));
      }
      setMode("obsidian");
    } catch (e) {
      console.error("Failed to select directory:", e);
    }
  };

  // Re-verify folder permissions
  const handleVerifyPermission = async () => {
    if (vaultHandle) {
      const granted = await verifyPermission(vaultHandle, true);
      setIsPermissionGranted(granted);
      if (granted) {
        handleRefreshVault();
      }
    }
  };

  // Disconnect the Obsidian Vault
  const handleDisconnectVault = async () => {
    await clearDirectoryHandle();
    setVaultHandle(null);
    setVaultName("");
    setVaultFiles([]);
    setSelectedObsidianFile(null);
    setIsPermissionGranted(false);
    setMode("local");
    setIsEditing(false);
  };

  // Refresh files
  const handleRefreshVault = async () => {
    if (vaultHandle && isPermissionGranted) {
      const files = await getMarkdownFiles(vaultHandle);
      setVaultFiles(files.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime()));
    }
  };

  // Local Note DB Operations
  const handleCreateNote = async (
    noteData: { title: string; content: string }
  ) => {
    const now = new Date();
    await db.notes.add({
      title: noteData.title,
      content: noteData.content,
      tags: [],
      createdAt: now,
      updatedAt: now,
    });
    setIsEditing(false);
    setSelectedNote(null);
  };

  const handleUpdateNote = async (
    noteData: { title: string; content: string }
  ) => {
    if (selectedNote?.id) {
      await db.notes.update(selectedNote.id, {
        title: noteData.title,
        content: noteData.content,
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

  // Obsidian Note Files Operations
  const handleSaveObsidianNote = async (noteData: { title: string; content: string }) => {
    if (!vaultHandle || !isPermissionGranted) return;

    try {
      const sanitizedTitle = noteData.title.trim();
      const fileName = sanitizedTitle + ".md";

      if (selectedVaultFile) {
        // If the title changed, we need to create a new file and delete the old file
        if (selectedVaultFile.name !== sanitizedTitle) {
          const newPath = selectedVaultFile.path.includes("/")
            ? `${selectedVaultFile.path.substring(0, selectedVaultFile.path.lastIndexOf("/"))}/${fileName}`
            : fileName;
          
          const newFileHandle = await getOrCreateFile(vaultHandle, newPath);
          const writable = await newFileHandle.createWritable();
          await writable.write(noteData.content);
          await writable.close();

          await deleteVaultFile(vaultHandle, selectedVaultFile.path);
        } else {
          // Title did not change - write in place
          const writable = await selectedVaultFile.handle.createWritable();
          await writable.write(noteData.content);
          await writable.close();
        }
      } else {
        // Creating a new file in the vault root
        const newFileHandle = await getOrCreateFile(vaultHandle, fileName);
        const writable = await newFileHandle.createWritable();
        await writable.write(noteData.content);
        await writable.close();
      }

      setIsEditing(false);
      setSelectedObsidianFile(null);
      await handleRefreshVault();
    } catch (e) {
      console.error("Failed to save markdown file:", e);
      alert("Failed to save note to local folder. Please check folders write access permission.");
    }
  };

  const handleDeleteObsidianFile = async (vFile: VaultFile) => {
    if (!vaultHandle || !isPermissionGranted) return;

    if (confirm(`Are you sure you want to delete "${vFile.name}.md"?`)) {
      try {
        await deleteVaultFile(vaultHandle, vFile.path);
        if (selectedVaultFile?.path === vFile.path) {
          setSelectedObsidianFile(null);
          setIsEditing(false);
        }
        await handleRefreshVault();
      } catch (e) {
        console.error("Failed to delete file:", e);
        alert("Failed to delete file from local folder.");
      }
    }
  };

  const handleSelectNote = (note: Note) => {
    setSelectedNote(note);
    setIsEditing(true);
  };

  const handleSelectVaultFile = (file: VaultFile) => {
    setSelectedObsidianFile(file);
    setIsEditing(true);
  };

  const handleNewNote = () => {
    setSelectedNote(null);
    setSelectedObsidianFile(null);
    setIsEditing(true);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setSelectedNote(null);
    setSelectedObsidianFile(null);
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
            Write and organize your notes. Stored locally or directly in your local folder.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button onClick={handleNewNote} className="gap-2">
            <Plus className="h-4 w-4" />
            New Note
          </Button>
          {mode === "local" && (
            <>
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
            </>
          )}
          {mode === "obsidian" && (
            <Button variant="outline" onClick={handleRefreshVault} className="gap-2">
              <RefreshCw className="h-4 w-4" />
              Sync Vault
            </Button>
          )}
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
              <div className="flex border-b w-full mr-2">
                <button
                  onClick={() => setMode("local")}
                  className={cn(
                    "flex-1 pb-2 text-sm font-semibold transition-all border-b-2",
                    mode === "local" ? "border-primary text-primary" : "border-transparent text-muted-foreground"
                  )}
                >
                  Local Mode
                </button>
                <button
                  onClick={() => {
                    if (!vaultHandle) {
                      handleConnectVault();
                    } else {
                      setMode("obsidian");
                    }
                  }}
                  className={cn(
                    "flex-1 pb-2 text-sm font-semibold transition-all border-b-2 flex items-center justify-center gap-1.5",
                    mode === "obsidian" ? "border-primary text-primary" : "border-transparent text-muted-foreground"
                  )}
                >
                  <FolderDot className="h-4 w-4" />
                  Obsidian Vault
                </button>
              </div>
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
              {/* LOCAL NOTES MODE */}
              {mode === "local" && (
                <>
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
                </>
              )}

              {/* OBSIDIAN VAULT MODE */}
              {mode === "obsidian" && (
                <div className="space-y-4">
                  {vaultHandle ? (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between bg-muted/30 p-2.5 rounded-lg border text-xs">
                        <div className="min-w-0">
                          <p className="font-semibold truncate">{vaultName}</p>
                          <p className="text-muted-foreground">Local Folder Connected</p>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={handleDisconnectVault}
                          title="Disconnect Vault"
                          className="h-7 w-7 text-destructive hover:text-destructive"
                        >
                          <LogOut className="h-4 w-4" />
                        </Button>
                      </div>

                      {!isPermissionGranted ? (
                        <div className="rounded-lg border border-dashed p-4 text-center space-y-2 bg-yellow-500/5 border-yellow-500/20">
                          <p className="text-xs text-muted-foreground">
                            Write permissions are required to access files in your Obsidian Vault.
                          </p>
                          <Button size="sm" onClick={handleVerifyPermission} className="gap-1.5 text-xs h-8">
                            <Key className="h-3.5 w-3.5" />
                            Grant Permissions
                          </Button>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          {vaultFiles.map((file) => {
                            const isSelected = selectedVaultFile?.id === file.id;
                            return (
                              <div
                                key={file.id}
                                className={cn(
                                  "rounded-lg border p-3 transition-colors cursor-pointer flex items-center justify-between gap-3 text-sm",
                                  isSelected ? "border-primary bg-primary/5" : "hover:bg-muted/50"
                                )}
                                onClick={() => handleSelectVaultFile(file)}
                              >
                                <div className="min-w-0 flex-1">
                                  <h4 className="font-semibold truncate leading-tight mb-1">{file.name}</h4>
                                  <p className="text-[10px] text-muted-foreground truncate">{file.path}</p>
                                  <p className="text-[10px] text-muted-foreground mt-1">
                                    Modified {format(file.updatedAt, "MMM d, yyyy")}
                                  </p>
                                </div>
                                <div className="flex items-center gap-1 shrink-0">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleDeleteObsidianFile(file);
                                    }}
                                    className="h-7 w-7 p-0 text-destructive hover:text-destructive"
                                  >
                                    <Trash2 className="h-3.5 w-3.5" />
                                  </Button>
                                </div>
                              </div>
                            );
                          })}

                          {vaultFiles.length === 0 && (
                            <div className="text-center py-12 text-muted-foreground border-2 border-dashed rounded-lg text-xs">
                              No .md files found in this vault directory.
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="rounded-lg border border-dashed p-8 text-center space-y-4">
                      <FolderOpen className="h-10 w-10 mx-auto text-muted-foreground opacity-40" />
                      <div>
                        <h4 className="font-semibold text-sm">Connect your Obsidian Vault</h4>
                        <p className="text-xs text-muted-foreground mt-1">
                          Access and edit your Markdown files locally from the browser.
                        </p>
                      </div>
                      <Button size="sm" onClick={handleConnectVault} className="w-full gap-1.5">
                        <FolderOpen className="h-4 w-4" />
                        Select Vault Folder
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </aside>

        {/* Editor Area */}
        <main className="flex-1 w-full min-w-0">
          {isEditing ? (
            <div className="rounded-lg border p-6 bg-card shadow-sm">
              <NoteEditor
                note={activeEditorNote}
                onSave={mode === "local" ? (selectedNote ? handleUpdateNote : handleCreateNote) : handleSaveObsidianNote}
                onCancel={handleCancel}
              />
            </div>
          ) : (
            <div className="rounded-lg border border-dashed p-12 text-center bg-muted/20">
              <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-20" />
              <p className="text-muted-foreground mb-6 max-w-sm mx-auto">
                {mode === "local"
                  ? "Select a note from the list to view or edit its content, or create a fresh one to get started."
                  : "Select a Markdown file from your connected Obsidian Vault directory, or write a new one."}
              </p>
              <Button onClick={handleNewNote} className="gap-2">
                <Plus className="h-4 w-4" />
                {mode === "local" ? "Create New Note" : "Create New Markdown File"}
              </Button>
            </div>
          )}
        </main>
      </div>

      {/* Info Box */}
      <div className="mt-8 rounded-lg border bg-card p-4 text-sm text-muted-foreground">
        <h3 className="font-semibold text-foreground mb-2">Notepad Modes Info</h3>
        <ul className="list-disc pl-5 space-y-1">
          <li>
            <strong>Local Mode:</strong> Stored securely in your browser&apos;s IndexedDB. Completely sandbox-safe and runs on any browser.
          </li>
          <li>
            <strong>Obsidian Vault Mode:</strong> Uses the File System Access API to bind directly to a directory on your disk. You can view, add, edit, and delete files inside your vault directly from Notepad.
          </li>
        </ul>
      </div>
    </div>
  );
}
