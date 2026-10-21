"use client";

import Link from "next/link";
import { Trans, useTranslation } from "react-i18next";
import * as LucideIcons from "lucide-react";
import { Settings } from "lucide-react";
import { ToolLayout } from "@/components/tool-layout";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { openSettings } from "@/components/console/proxy-gate";
import { SERVICES } from "@/lib/local-proxy";

export default function ConsolesPage() {
  const { t } = useTranslation("proxy");
  return (
    <ToolLayout
      title={t("consoles.title")}
      description={t("consoles.description")}
      extraActions={
        <Button variant="outline" className="gap-2" onClick={() => openSettings("proxy")}>
          <Settings className="h-4 w-4" /> {t("consoles.proxySettings")}
        </Button>
      }
    >
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {SERVICES.map((s) => {
          const Icon = LucideIcons[s.icon as keyof typeof LucideIcons] as React.ComponentType<{ className?: string }>;
          return (
            <Link key={s.id} href={`/tools/consoles/${s.id}`}>
              <Card className="p-4 h-full hover:bg-accent transition-colors space-y-1">
                <div className="flex items-center gap-2 font-medium">
                  {Icon && <Icon className="h-4 w-4" />}
                  {s.label}
                </div>
                <p className="text-sm text-muted-foreground">{t(`services.${s.id}`)}</p>
              </Card>
            </Link>
          );
        })}
      </div>
      <p className="text-sm text-muted-foreground">
        <Trans i18nKey="consoles.setupHint" ns="proxy" components={{ b: <strong /> }} />
      </p>
    </ToolLayout>
  );
}
