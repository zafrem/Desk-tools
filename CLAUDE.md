# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Build & Development Commands

```bash
npm run dev      # Start development server (Next.js)
npm run build    # Build for production (static export to /out)
npm run lint     # Run ESLint
npm run start    # Start production server
```

Preview static build locally: `npx serve@latest out`

## Testing Commands

```bash
npm test              # Run all tests
npm run test:watch    # Run tests in watch mode
npm run test:coverage # Run tests with coverage report
npm run test:ci       # Run tests in CI mode with coverage
```

Tests are in `__tests__/` directory. Coverage reports are generated in `coverage/` for SonarQube integration.

## Architecture Overview

Desk-tools is a **static, client-side only** Next.js 15 application that exports to GitHub Pages. All data is stored locally in IndexedDB using Dexie.js - no backend server exists.

### Key Patterns

**Tool Registration System**
- All tools are registered in `lib/tools-registry.ts` as a `TOOLS_REGISTRY` array
- Each tool has: `id`, `name`, `description`, `tags`, `category`, `path`, and optional `icon` (lucide-react icon name)
- Tool pages live in `app/tools/[tool-id]/page.tsx`
- Categories: `encoder`, `converter`, `formatter`, `generator`, `calculator`, `designer`, `security`, `developer`, `other`

**Layout Structure**
- `app/layout.tsx` - Root layout with ThemeProvider (next-themes)
- `components/app-layout.tsx` - Main app shell with TopNav and fixed right ToolSidebar
- `components/tool-layout.tsx` - Wrapper for individual tool pages (provides title, description, back button)

**Local Data Storage (lib/db.ts)**
- Uses Dexie.js with IndexedDB
- Database: `DeskToolsDB` with tables: `ganttTasks`, `notes`, `terms`, `bookmarks`, `commands`, `preferences`
- Use `useLiveQuery` hook from `dexie-react-hooks` for reactive queries

**Search (lib/search.ts)**
- Uses Fuse.js for fuzzy search across tool names, descriptions, and tags

**UI Components**
- Uses shadcn/ui components in `components/ui/` (Button, Card, Slider, Input, etc.)
- Icons from lucide-react
- Drag & drop with @dnd-kit
- Whiteboard uses Konva.js (react-konva)

### Static Export Configuration

The app uses `output: "export"` in `next.config.ts`. GitHub Pages deployment uses `NEXT_PUBLIC_BASE_PATH=/Desk-tools` environment variable set in `.github/workflows/deploy.yml`.

## Adding a New Tool

1. Add entry to `lib/tools-registry.ts` with unique id, category, and path
2. Create `app/tools/[tool-id]/page.tsx` as a client component (`"use client"`)
3. Wrap content with `<ToolLayout title="..." description="...">` component
4. If the tool needs helper functions, add them to `lib/` (e.g., `lib/encoders.ts`, `lib/background-remover.ts`)

**Tool page template:**
```tsx
"use client";
import { ToolLayout } from "@/components/tool-layout";

export default function MyToolPage() {
  return (
    <ToolLayout title="Tool Name" description="Tool description">
      {/* Tool UI here */}
    </ToolLayout>
  );
}
```
