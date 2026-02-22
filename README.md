# Desk-tools

A high-performance, local-first utility platform designed for multi-tasking individuals at startups.

**Live Service:** [https://zafrem.github.io/Desk-tools/](https://zafrem.github.io/Desk-tools/)

![Main Page](./images/Init-page.jpg)

## The purpose behind the development

"I'm not actually a professional developer. But after working with various systems, I kept getting the itch to build my own little tools. They didn't start as big, formal projects—they just kind of evolved bit by bit. Since I didn't have a team of designers or engineers to lean on, I just did everything myself. That's how Desk-tools came to life."

## Overview

Desk-tools is a comprehensive suite of 53+ utilities built for "hybrid professionals"—developers, designers, planners, and marketers who need a fast, privacy-focused workspace.

Built with **Next.js 15** and **React 19**, it runs entirely in your browser. All data is stored locally using **IndexedDB** (via Dexie.js), ensuring your work stays private and never leaves your machine.

### Privacy & Local-First

- **Zero Server-Side Storage** — Your notes, tasks, and settings are stored only in your browser via IndexedDB.
- **Offline Capable** — Once loaded, all tools work without an internet connection (PWA with service worker).
- **Privacy by Design** — No tracking, no data collection, no account required.

### Multi-Language Support

Available in **English**, **Korean**, **Chinese (Simplified)**, and **Japanese** with automatic browser language detection.

## Key Features

### Productivity Apps

| App | Description |
| --- | --- |
| **Kanban Board** | Drag-and-drop project management with flexible columns |
| **Notepad** | Persistent note-taking with markdown support and tagging |
| **Daily Tasks** | Recurring daily checklists with completion tracking |
| **Whiteboard** | Freeform drawing canvas for sketches, diagrams, and wireframes |
| **Weekly Scheduler** | Time-slot-based weekly planner |
| **Terms Dictionary** | Categorized term/definition management for consistent vocabulary |
| **Bookmarks** | Grouped URL bookmarks with drag-and-drop ordering |

### AI Integration (Ollama)

Connect to a local [Ollama](https://ollama.com/) instance for private LLM-powered assistance:
- Chat with local models directly in the workspace
- Multiple chat sessions with history
- No API keys needed — your data stays on your machine

### Instant Search

Find any tool instantly with Fuse.js fuzzy search across names, descriptions, tags, and categories.

### Data Portability

Export and import all your data (notes, tasks, bookmarks, etc.) as JSON from the top navigation bar.

## Specialized Tools (53+)

| Category | Tools |
| --- | --- |
| **Encoder** | Text Encoder, Base64 Converter, URL Encoder, HTML Entities |
| **Converter** | File Format (JSON/XML/CSV/YAML/TOML), JSON-CSV, Binary-HEX, Timestamp, Markup (Markdown/Wiki), Encoding (mojibake fix) |
| **Formatter** | Code Formatter (Prettier, 12+ languages), Text Case Converter, SQL Formatter, Markdown Preview |
| **Generator** | JSON to Code, JSON Schema, Short URL, UUID, Password, QR Code, Slug, Robots.txt, Open Graph, Schema Markup, Sitemap |
| **Calculator** | Chmod, IP Subnet (IPv4/IPv6), Unit Converter, Date/D-Day, Salary/Tax, Loan, Compound Interest, Keyword Density, Meta Tag Checker, Reading Time, Word Counter, Canonical URL |
| **Designer** | Design Tools (Color Picker/Palette), Icon Generator, Background Remover, Image Filters, Pixel Art Editor |
| **Security** | JWT Decoder, Hash Generator (MD5/SHA), Encryption (AES-GCM/RSA-OAEP) |
| **Developer** | JSON Explorer (tree view), Cron Expression Builder, Regex Tester, Text Diff, Command Palette |
| **AI** | AI Chat (requires local Ollama) |
| **Other** | PDF Tools, Pomodoro Timer |

## Tech Stack

| Layer | Technology |
| --- | --- |
| **Framework** | [Next.js 15](https://nextjs.org/) (App Router, Static Export) |
| **Language** | [TypeScript 5](https://www.typescriptlang.org/) |
| **UI** | [React 19](https://react.dev/), [Tailwind CSS 3](https://tailwindcss.com/), [shadcn/ui](https://ui.shadcn.com/) (Radix UI), [Lucide React](https://lucide.dev/) |
| **Database** | [Dexie.js](https://dexie.org/) (IndexedDB) — 9 tables |
| **Search** | [Fuse.js](https://www.fusejs.io/) (client-side fuzzy search) |
| **i18n** | [i18next](https://www.i18next.com/) + react-i18next (EN, KO, ZH, JA) |
| **Drag & Drop** | [@dnd-kit](https://dndkit.com/) |
| **Drawing** | [Konva.js](https://konvajs.org/) + react-konva |
| **Charts** | [Recharts](https://recharts.org/) |
| **Code Formatting** | [Prettier](https://prettier.io/) (JS, TS, HTML, CSS, SQL, YAML, GraphQL, Python, PHP, Java) |
| **Crypto** | Web Crypto API (AES-GCM, RSA-OAEP) + [crypto-js](https://github.com/brix/crypto-js) (hashing) |
| **PDF** | [pdf-lib](https://pdf-lib.js.org/) |
| **AI** | [Ollama](https://ollama.com/) (local LLM integration) |
| **Testing** | [Jest 29](https://jestjs.io/) + [Testing Library](https://testing-library.com/) |
| **Deployment** | GitHub Actions + GitHub Pages |

## Architecture

```
Browser (Client-Side Only)
├── Next.js 15 App (Static Export)
│   ├── App Router Pages
│   │   ├── / (Home)
│   │   ├── /kanban, /notepad, /daily-tasks, ...
│   │   └── /tools/[tool-id] (53 tool pages)
│   ├── Components
│   │   ├── AppShell (TopNav + ToolSidebar + Content)
│   │   ├── ToolLayout (tool page wrapper)
│   │   └── ui/ (shadcn/ui primitives)
│   └── Providers
│       ├── I18nProvider (i18next)
│       ├── ThemeProvider (next-themes)
│       └── SidebarProvider (context)
├── IndexedDB (Dexie.js)
│   └── 9 tables (ganttTasks, notes, terms, bookmarks, commands, preferences, dailyTasks, weeklySchedule, chatSessions)
├── Service Worker (offline / PWA)
└── Web Crypto API (AES-GCM, RSA-OAEP)
```

### Adding a New Tool

1. Add an entry to `lib/tools-registry.ts` with a unique `id`, `category`, and `path`
2. Create `app/tools/[tool-id]/page.tsx` as a client component (`"use client"`)
3. Wrap content with `<ToolLayout title="..." description="...">`
4. Add helper functions to `lib/` if needed

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

## Local Development

1. **Clone the repository**:
   ```bash
   git clone https://github.com/zafrem/Desk-tools.git
   cd Desk-tools
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Run the development server**:
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) in your browser.

4. **Build for production**:
   ```bash
   npm run build
   ```

5. **Preview static build locally**:
   ```bash
   npx serve@latest out
   ```

## Testing

```bash
npm test              # Run all tests
npm run test:watch    # Run tests in watch mode
npm run test:coverage # Run tests with coverage report
npm run test:ci       # CI mode with coverage (lcov + html)
```

Tests are located in the `__tests__/` directory and cover utility functions, components, and tool registry validation. Coverage reports are generated for SonarQube integration.

## Deployment

This project is configured for **GitHub Pages** with automatic deployment. Any push to the `main` branch triggers the GitHub Actions workflow which:

1. Installs dependencies (`npm ci`)
2. Builds the static export with `NEXT_PUBLIC_BASE_PATH=/Desk-tools`
3. Deploys the `/out` directory to GitHub Pages

## Feedback & Requests

I am committed to constantly evolving this platform. If you have a tool request or found a bug, please [open an issue on GitHub](https://github.com/zafrem/Desk-tools/issues).

---

Created by [zafrem](https://github.com/zafrem)
