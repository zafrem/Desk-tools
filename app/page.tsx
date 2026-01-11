export default function Home() {
  return (
    <div className="container mx-auto p-8">
      <h1 className="text-4xl font-bold mb-4">Welcome to Desk-tools</h1>
      <p className="text-muted-foreground mb-6">
        A high-performance, local-first utility platform with 100+ developer tools.
      </p>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 max-w-4xl">
        <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-6">
          <h2 className="text-lg font-semibold mb-2">Privacy First</h2>
          <p className="text-sm text-muted-foreground">
            All data stays on your device. No cloud storage, no tracking.
          </p>
        </div>

        <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-6">
          <h2 className="text-lg font-semibold mb-2">Instant Search</h2>
          <p className="text-sm text-muted-foreground">
            Find any tool using tag-based fuzzy search. Try searching in the sidebar →
          </p>
        </div>

        <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-6">
          <h2 className="text-lg font-semibold mb-2">100+ Tools</h2>
          <p className="text-sm text-muted-foreground">
            Encoders, converters, formatters, calculators, and more.
          </p>
        </div>
      </div>

      <div className="mt-8">
        <h3 className="text-xl font-semibold mb-3">Getting Started</h3>
        <ul className="space-y-2 text-muted-foreground">
          <li>• Browse tools in the sidebar on the right</li>
          <li>• Use the search bar to find tools by name or tags</li>
          <li>• Access Kanban Board, Notepad, and Whiteboard from the top navigation</li>
          <li>• Toggle between light and dark themes</li>
        </ul>
      </div>
    </div>
  );
}