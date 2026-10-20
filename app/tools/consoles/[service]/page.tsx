import { notFound } from "next/navigation";
import { ToolLayout } from "@/components/tool-layout";
import { TerminalConsole } from "@/components/console/terminal-console";
import { QueryConsole } from "@/components/console/query-console";
import { SERVICES, getService } from "@/lib/local-proxy";

// The site is statically exported, so every console page is generated up front.
export const dynamicParams = false;

export function generateStaticParams() {
  return SERVICES.map((s) => ({ service: s.id }));
}

export default async function ConsolePage({ params }: { params: Promise<{ service: string }> }) {
  const { service } = await params;
  const meta = getService(service);
  if (!meta) notFound();

  const description =
    meta.kind === "terminal"
      ? `Open a ${meta.label} terminal in your browser through the local proxy. Your credentials never leave your machine.`
      : `Run read-only SELECT queries on ${meta.label} through the local proxy. Your credentials never leave your machine.`;

  return (
    <ToolLayout title={`${meta.label} Console`} description={description} fullWidth>
      {meta.id === "ssh" || meta.id === "telnet" ? (
        <TerminalConsole service={meta.id} />
      ) : (
        <QueryConsole service={meta.id} />
      )}
    </ToolLayout>
  );
}
