# Desk-tools 🛠️

A high-performance, local-first utility platform designed for multi-tasking individuals at startups.

**Live Service:** [https://zafrem.github.io/Desk-tools/](https://zafrem.github.io/Desk-tools/)

![Main Page](./images/Init-page.jpg)

## 🌟 Overview

Desk-tools was born from the observation that the lines between developer, designer, planner, and marketer are collapsing due to the advancement of AI. This tool is built to empower the new breed of "hybrid professionals" by providing a comprehensive suite of utilities in a single, privacy-focused, browser-based workspace.

All data is stored locally in your browser (using IndexedDB), ensuring your work stays private and secure.

## 🚀 Key Features

- **📋 Kanban Board**: Manage your project tasks with a simple, drag-and-drop workflow.
- **📝 Notepad**: Quick, persistent note-taking with markdown support.
- **🎨 Whiteboard**: Sketch out ideas, diagrams, or wireframes and export them as images.
- **📖 Definition of Terms**: Organize and share project terminology with import/export capabilities.
- **🔖 Bookmarks**: Organize your frequently used links into groups with drag-and-drop support.
- **🔍 Instant Search**: Find any of the 45+ specialized tools instantly using tag-based fuzzy search.

## 🛠️ Specialized Tools (45+)

| Category | Tools |
| --- | --- |
| **Developer** | SQL Formatter, Command Palette, Regex Tester, JSON Explorer, JSON to Code, Cron Expression |
| **Security** | Encryption Tool (AES/RSA), JWT Decoder, Password Generator, Hash Generator |
| **Encoder** | Text Encoder, Base64 Converter, URL Encoder, HTML Entities |
| **Converter** | File Format Converter (JSON/YAML/CSV/XML), JSON ↔ CSV, Timestamp Converter, Unit Converter |
| **Designer** | Design Tools (Color Picker/Palette), Icon Generator, QR Code Generator |
| **SEO** | Meta Tag Checker, Open Graph Generator, Robots.txt Generator, Sitemap Generator, Slug Generator, Keyword Density, Reading Time Calc |
| **Calculator** | Loan Calculator, Compound Interest Calculator, Salary/Tax Calculator, Date/D-Day Calc |

## 💻 Tech Stack

- **Framework**: [Next.js 15](https://nextjs.org/) (App Router)
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **UI**: [React 19](https://react.dev/), [Tailwind CSS](https://tailwindcss.com/), [Radix UI](https://www.radix-ui.com/)
- **Database**: [Dexie.js](https://dexie.org/) (IndexedDB wrapper for local storage)
- **Icons**: [Lucide React](https://lucide.dev/)
- **Charts**: [Recharts](https://recharts.org/)
- **Graphics**: [Konva.js](https://konvajs.org/) (Whiteboard)
- **Drag & Drop**: [@dnd-kit](https://dndkit.com/)

## 🛠️ Local Development

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

## 🌐 Deployment

This project is configured for **GitHub Pages**. Any changes pushed to the `main` branch will automatically be deployed via GitHub Actions.

## 🤝 Feedback & Requests

I am committed to constantly evolving this platform and adding more "challenging" tools. If you have a specific tool request or found a bug, please [open an issue on GitHub](https://github.com/zafrem/Desk-tools/issues).

---
Created by [zafrem](https://github.com/zafrem)