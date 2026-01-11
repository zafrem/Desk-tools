import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <div className="container mx-auto p-8 max-w-5xl">
      <div className="flex flex-col gap-6 py-8">
        <h1 className="text-4xl font-extrabold tracking-tight lg:text-5xl">
          Desk-tools
        </h1>
        <p className="text-xl text-muted-foreground">
          A high-performance, local-first utility platform with 47 developer tools.
        </p>
        <p className="text-muted-foreground">
          Originally created for multi-tasking individuals at startups. With the advancement of AI, the lines between developer, designer, planner, and marketer are collapsing. Desk-tools is designed to empower this new breed of hybrid professionals by providing a comprehensive suite of utilities in one place.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mb-12">
        <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-6">
          <h2 className="text-lg font-semibold mb-2">Privacy First</h2>
          <p className="text-sm text-muted-foreground">
            All data stays on your device. No cloud storage, no tracking. Your notes and tasks are stored locally in your browser.
          </p>
        </div>

        <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-6">
          <h2 className="text-lg font-semibold mb-2">Instant Search</h2>
          <p className="text-sm text-muted-foreground">
            Find any tool quickly using the tag-based fuzzy search in the sidebar.
          </p>
        </div>

        <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-6">
          <h2 className="text-lg font-semibold mb-2">Constantly Evolving</h2>
          <p className="text-sm text-muted-foreground">
            I am committed to adding more challenging and useful tools. Have a request? File an issue on GitHub!
          </p>
        </div>
      </div>

      <div className="space-y-8">
        <section>
          <h3 className="text-2xl font-semibold mb-4">How to Use</h3>
          <div className="prose dark:prose-invert max-w-none text-muted-foreground">
            <ul className="list-disc pl-5 space-y-2">
              <li>
                <strong className="text-foreground">Browse Tools:</strong> Use the sidebar on the right to navigate through the collection of utilities. Tools are categorized for easy access.
              </li>
              <li>
                <strong className="text-foreground">Productivity:</strong> Access the <strong>Kanban Board</strong> to manage your tasks and the <strong>Notepad</strong> for quick jottings from the top navigation bar.
              </li>
              <li>
                <strong className="text-foreground">Whiteboard:</strong> Use the <strong>Whiteboard</strong> to sketch out ideas or diagrams and export them as images.
              </li>
              <li>
                <strong className="text-foreground">Definition of Terms:</strong> Organize your project terminology in the <strong>Terms</strong> section.
              </li>
              <li>
                <strong className="text-foreground">Feedback & Requests:</strong> If you need a specific tool or have a feature request, please <a href="https://github.com/zafrem/Desk-tools/issues" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">open an issue on GitHub</a>. I will continue to update the platform with new features.
              </li>
            </ul>
          </div>
        </section>

        <section className="bg-muted/30 p-6 rounded-lg border">
          <h3 className="text-xl font-semibold mb-3">Future Roadmap</h3>
          <p className="text-muted-foreground mb-4">
            I aim to build more complex and &quot;challenging&quot; tools that solve real-world engineering problems directly in the browser. 
            This project is a living workspace that grows with your needs.
          </p>
          <div className="flex gap-4">
             <Link href="https://github.com/zafrem/Desk-tools/issues/new" target="_blank" rel="noopener noreferrer">
                <Button>Request a Feature</Button>
             </Link>
          </div>
        </section>
      </div>
    </div>
  );
}