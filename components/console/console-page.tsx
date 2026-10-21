"use client";

import { useTranslation } from "react-i18next";
import { ToolLayout } from "@/components/tool-layout";
import { TerminalConsole } from "@/components/console/terminal-console";
import { QueryConsole } from "@/components/console/query-console";
import { getService } from "@/lib/local-proxy";

/** One console page (title, description and the console itself) in the active language. */
export function ConsolePageContent({ service }: { service: string }) {
  const { t } = useTranslation("proxy");
  const meta = getService(service);
  if (!meta) return null;

  const description =
    meta.kind === "terminal"
      ? t("page.terminalDescription", { service: meta.label })
      : t("page.queryDescription", { service: meta.label });

  return (
    <ToolLayout title={t("page.title", { service: meta.label })} description={description} fullWidth>
      {meta.id === "ssh" || meta.id === "telnet" ? (
        <TerminalConsole service={meta.id} />
      ) : (
        <QueryConsole service={meta.id} />
      )}
    </ToolLayout>
  );
}
