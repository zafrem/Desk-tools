"use client";

import { Trash2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import type { SavedConnection } from "./use-saved-connections";

export function SavedList({
  items,
  onLoad,
  onDelete,
}: {
  items: SavedConnection[];
  onLoad: (c: SavedConnection) => void;
  onDelete: (id: string) => void;
}) {
  return (
    <Card className="p-5 space-y-3">
      <h3 className="text-sm font-semibold">Saved connections</h3>
      {items.length === 0 ? (
        <p className="text-sm text-muted-foreground">Connections you use will appear here.</p>
      ) : (
        <ul className="space-y-2">
          {items.map((h) => (
            <li key={h.id} className="flex items-center justify-between gap-2">
              <button
                className="text-sm text-left hover:underline truncate"
                onClick={() => onLoad(h)}
                title={`${h.label}:${h.port}`}
              >
                {h.label}
                <span className="text-muted-foreground">:{h.port}</span>
              </button>
              <button
                className="text-muted-foreground hover:text-red-500"
                onClick={() => onDelete(h.id)}
                aria-label={`Delete ${h.label}`}
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </li>
          ))}
        </ul>
      )}
      <p className="text-xs text-muted-foreground">Only host, port and username are saved — never passwords or keys.</p>
    </Card>
  );
}
