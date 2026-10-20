"use client";

import * as React from "react";
import { getPreference, setPreference } from "@/lib/db";
import type { ServiceId } from "@/lib/local-proxy";

/** Only non-secret fields are ever stored. Passwords and keys never are. */
export interface SavedConnection {
  id: string;
  label: string;
  host: string;
  port: number;
  username: string;
  extra?: Record<string, string>; // e.g. database, catalog, authType
}

// SSH keeps its original key so connections saved by the old page survive.
const storageKey = (service: ServiceId) => (service === "ssh" ? "ssh_saved_hosts" : `console_saved_${service}`);

export function useSavedConnections(service: ServiceId) {
  const [items, setItems] = React.useState<SavedConnection[]>([]);

  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      const raw = await getPreference(storageKey(service));
      if (!raw || cancelled) return;
      try {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) setItems(parsed);
      } catch {
        /* ignore a corrupt value */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [service]);

  const persist = React.useCallback(
    async (next: SavedConnection[]) => {
      setItems(next);
      await setPreference(storageKey(service), JSON.stringify(next));
    },
    [service]
  );

  const save = React.useCallback(
    async (entry: SavedConnection) => {
      await persist([entry, ...items.filter((h) => h.id !== entry.id)].slice(0, 12));
    },
    [items, persist]
  );

  const remove = React.useCallback(
    async (id: string) => {
      await persist(items.filter((h) => h.id !== id));
    },
    [items, persist]
  );

  return { items, save, remove };
}
