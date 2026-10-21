import { notFound } from "next/navigation";
import { ConsolePageContent } from "@/components/console/console-page";
import { SERVICES, getService } from "@/lib/local-proxy";

// The site is statically exported, so every console page is generated up front.
export const dynamicParams = false;

export function generateStaticParams() {
  return SERVICES.map((s) => ({ service: s.id }));
}

export default async function ConsolePage({ params }: { params: Promise<{ service: string }> }) {
  const { service } = await params;
  if (!getService(service)) notFound();
  return <ConsolePageContent service={service} />;
}
