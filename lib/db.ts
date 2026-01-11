import Dexie, { type EntityTable } from "dexie";

// Types for local data storage
export interface GanttTask {
  id?: number;
  title: string;
  description?: string;
  startDate: Date;
  endDate: Date;
  progress: number; // 0-100
  dependencies?: number[];
  tags?: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface Note {
  id?: number;
  title: string;
  content: string;
  tags?: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface Term {
  id?: number;
  term: string;
  definition: string;
  category?: string;
  tags?: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface Bookmark {
  id?: number;
  title: string;
  url: string;
  group?: string;
  order: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface Command {
  id?: number;
  title: string;
  command: string;
  tags?: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface UserPreference {
  id?: number;
  key: string;
  value: string;
  updatedAt: Date;
}

// Database class
class DeskToolsDatabase extends Dexie {
  ganttTasks!: EntityTable<GanttTask, 'id'>;
  notes!: EntityTable<Note, 'id'>;
  terms!: EntityTable<Term, 'id'>;
  bookmarks!: EntityTable<Bookmark, 'id'>;
  commands!: EntityTable<Command, 'id'>;
  preferences!: EntityTable<UserPreference, 'id'>;

  constructor() {
    super("DeskToolsDB");

    this.version(1).stores({
      ganttTasks: "++id, title, startDate, endDate, *tags, createdAt",
      notes: "++id, title, *tags, createdAt, updatedAt",
      terms: "++id, term, category, *tags, createdAt",
      bookmarks: "++id, title, group, order, createdAt",
      commands: "++id, title, *tags, createdAt",
      preferences: "++id, &key, updatedAt",
    });
  }
}

// Export singleton instance
export const db = new DeskToolsDatabase();

// Helper functions for preferences
export const getPreference = async (key: string): Promise<string | null> => {
  const pref = await db.preferences.where("key").equals(key).first();
  return pref?.value ?? null;
};

export const setPreference = async (key: string, value: string): Promise<void> => {
  const existing = await db.preferences.where("key").equals(key).first();

  if (existing) {
    await db.preferences.update(existing.id!, {
      value,
      updatedAt: new Date(),
    });
  } else {
    await db.preferences.add({
      key,
      value,
      updatedAt: new Date(),
    });
  }
};
