"use client";

import * as React from "react";
import { Loader2, PlugZap, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { fetchHealth, timeoutSignal, type ProxyHealth, type ServiceId } from "@/lib/local-proxy";

export const OPEN_SETTINGS_EVENT = "desk-tools:open-settings";

/** Asks the settings dialog to open on the given tab. */
export function openSettings(tab: "llm" | "proxy" | "install") {
  window.dispatchEvent(new CustomEvent(OPEN_SETTINGS_EVENT, { detail: tab }));
}

/**
 * Renders `children` once the local proxy is reachable (and supports `service`).
 * Until then it shows where to get and test the proxy — those controls live in
 * Settings, not on each console page.
 */
export function ProxyGate({ service, children }: { service: ServiceId; children: React.ReactNode }) {
  const [state, setState] = React.useState<"checking" | "down" | "outdated" | "up">("checking");

  React.useEffect(() => {
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout>;

    const tick = async () => {
      let health: ProxyHealth | null = null;
      try {
        health = await fetchHealth(timeoutSignal(2000));
      } catch {
        /* proxy not running */
      }
      if (cancelled) return;
      if (!health) {
        setState((s) => (s === "up" ? "up" : "down")); // don't flicker an active console away
      } else if (!health.services.includes(service)) {
        setState("outdated");
      } else {
        setState("up");
        return; // stop polling once it is up
      }
      timer = setTimeout(tick, 2500);
    };
    void tick();
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [service]);

  if (state === "up") return <>{children}</>;

  if (state === "checking") {
    return (
      <Card className="p-8 flex items-center justify-center gap-3 text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin" />
        Looking for the local proxy…
      </Card>
    );
  }

  return (
    <Card className="p-6 space-y-4 max-w-xl">
      <div className="flex items-start gap-3">
        <PlugZap className="h-5 w-5 mt-0.5 text-muted-foreground" />
        <div className="space-y-1">
          <h2 className="font-semibold">
            {state === "outdated" ? "Your local proxy is too old for this console" : "The local proxy isn't running"}
          </h2>
          <p className="text-sm text-muted-foreground">
            {state === "outdated"
              ? "The running proxy doesn't support this service. Download the latest version and restart it."
              : "This console connects through a small helper on your own machine. Start it, and this page connects automatically."}
          </p>
        </div>
      </div>
      <div className="flex flex-wrap gap-2">
        <Button className="gap-2" onClick={() => openSettings("install")}>
          <Settings className="h-4 w-4" /> Settings → Install
        </Button>
        <Button variant="outline" onClick={() => openSettings("proxy")}>
          Test connection
        </Button>
      </div>
      <p className="text-xs text-muted-foreground flex items-center gap-2">
        <Loader2 className="h-3 w-3 animate-spin" /> Waiting for the proxy on 127.0.0.1:8722…
      </p>
    </Card>
  );
}
