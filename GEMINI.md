# Desk-tools Project Context

## Project Overview
Desk-tools is a collection of 52+ browser-based utilities designed to assist with various work-related tasks. It is a **static, client-side only** application built with Next.js, meaning it runs entirely in the user's browser without a dedicated backend server. Data persistence is handled locally using IndexedDB.

## Tech Stack
- **Framework:** Next.js 15 (App Router)
- **Language:** TypeScript
- **UI Library:** React 19
- **Styling:** Tailwind CSS, `clsx`, `tailwind-merge`
- **Components:** Radix UI primitives (via `@radix-ui/*`), Lucide React icons
- **State/Storage:** Dexie.js (IndexedDB wrapper) for local persistence
- **Search:** Fuse.js (fuzzy search)
- **Utilities:** `date-fns`, `crypto-js`, `papaparse`

## Architecture & Directory Structure

### Core Principles
- **Static Export:** The app is configured for static export (`output: "export"` in `next.config.ts`), making it suitable for hosting on platforms like GitHub Pages.
- **Client-Side Logic:** All processing (conversions, formatting, etc.) happens in the browser.
- **Local Database:** User data (notes, tasks, preferences) is stored in the browser's IndexedDB via `lib/db.ts`.

### Key Directories
- **`app/`**: Next.js App Router pages.
  - `app/tools/`: Individual tool pages live here.
  - `app/gantt/` & `app/notepad/`: Feature-specific pages.
- **`components/`**: Reusable UI components.
  - `components/ui/`: Generic UI elements (buttons, inputs, etc.).
  - `components/tool-layout.tsx`: Standard wrapper for tool pages.
- **`lib/`**: Utility functions and core logic.
  - `lib/tools-registry.ts`: **CRITICAL**. The central registry for all available tools.
  - `lib/db.ts`: Database configuration (Dexie).
  - `lib/search.ts`: Search logic.

## Key Systems

### 1. Tool Registration System
New tools must be registered to appear in the application.
- **Registry File:** `lib/tools-registry.ts`
- **Structure:** The `TOOLS_REGISTRY` array contains objects with `id`, `name`, `description`, `category`, `path`, etc.
- **Categories:** `encoder`, `converter`, `formatter`, `generator`, `calculator`, `designer`, `security`, `developer`, `ai`, `other`.
- **AI Tools:** Tools with the `ai` category are conditionally displayed in the sidebar only when a local LLM (Ollama) is configured.

### 2. Local Data Storage
- **Library:** Dexie.js
- **Definition:** `lib/db.ts` defines the `DeskToolsDB` class.
- **Tables:** `ganttTasks`, `notes`, `preferences`, `dailyTasks`, `weeklySchedule`.
- **Usage:** Uses `useLiveQuery` for reactive data updates in components.

### 3. AI Integration (Ollama)
The application supports local LLM integration via Ollama.
- **Configuration:** Users can set `ollama_base_url` and `ollama_model` in the Settings dialog.
- **Connectivity:** The Settings dialog includes a "Test" feature to verify connection and fetch available models from the local instance.
- **Sidebar Display:** When configured, the sidebar splits into "AI Modules" and "General Tools" sections. If not configured, AI tools are hidden.

## Development Workflow

### Commands
- **Start Dev Server:** `npm run dev` (Runs on http://localhost:3000)
- **Build for Production:** `npm run build` (Outputs to `/out` directory)
- **Lint Code:** `npm run lint`
- **Start Production Server:** `npm run start`

### How to Add a New Tool
1.  **Create Page:** Create a new directory and page at `app/tools/[tool-id]/page.tsx`.
2.  **Register:** Add a new entry to the `TOOLS_REGISTRY` array in `lib/tools-registry.ts`.
3.  **Implement Logic:** Add any necessary helper functions in `lib/` (e.g., specific converters or parsers).
4.  **UI:** Use `components/tool-layout.tsx` to wrap the tool's content for consistency.

## Configuration Files
- **`next.config.ts`**: Next.js configuration (static export settings).
- **`tailwind.config.ts`**: Tailwind CSS theme and content paths.
- **`tsconfig.json`**: TypeScript configuration.
- **`CLAUDE.md`**: Legacy context file (reference for architecture).
