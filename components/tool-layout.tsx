import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

interface ToolLayoutProps {
  title: string;
  description: string;
  children: React.ReactNode;
  extraActions?: React.ReactNode;
}

export function ToolLayout({ title, description, children, extraActions }: ToolLayoutProps) {
  return (
    <div className="container mx-auto p-8 max-w-5xl">
      <div className="mb-6">
        <Link href="/">
          <Button variant="ghost" className="gap-2 mb-4">
            <ArrowLeft className="h-4 w-4" />
            Back to Home
          </Button>
        </Link>
        <div className="flex flex-col md:flex-row justify-between items-start gap-4">
          <div>
            <h1 className="text-3xl font-bold mb-2">{title}</h1>
            <p className="text-muted-foreground">{description}</p>
          </div>
          {extraActions && (
            <div className="flex-shrink-0 mt-2 md:mt-0">
              {extraActions}
            </div>
          )}
        </div>
      </div>
      <div className="space-y-6">{children}</div>
    </div>
  );
}