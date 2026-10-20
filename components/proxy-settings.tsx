"use client";

import * as React from "react";
import {
  AlertCircle,
  ArrowRight,
  Check,
  CheckCircle2,
  Circle,
  Copy,
  Download,
  Loader2,
  MinusCircle,
  Network,
  PlugZap,
  RefreshCw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  NPX_COMMAND,
  OS_BUILDS,
  PROXY_PORT,
  PROXY_REPO,
  RELEASE_BASE,
  SERVICES,
  detectOsFromNavigator,
  initialTestSteps,
  runConnectionTest,
  testPassed,
  type ProxyHealth,
  type TestStep,
} from "@/lib/local-proxy";

function StepIcon({ status }: { status: TestStep["status"] }) {
  switch (status) {
    case "running":
      return <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />;
    case "ok":
      return <CheckCircle2 className="h-4 w-4 text-green-500" />;
    case "fail":
      return <AlertCircle className="h-4 w-4 text-destructive" />;
    case "skipped":
      return <MinusCircle className="h-4 w-4 text-muted-foreground" />;
    default:
      return <Circle className="h-4 w-4 text-muted-foreground" />;
  }
}

function CopyableCommand({ command }: { command: string }) {
  const [copied, setCopied] = React.useState(false);
  const copy = async () => {
    await navigator.clipboard.writeText(command);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };
  return (
    <div className="flex items-center gap-1.5">
      <code className="flex-1 bg-muted border rounded px-2 py-1.5 font-mono text-xs break-all">{command}</code>
      <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0" onClick={copy} aria-label="Copy command">
        {copied ? <Check className="h-3 w-3 text-green-500" /> : <Copy className="h-3 w-3" />}
      </Button>
    </div>
  );
}

/** "Proxy" tab: how the pieces connect, plus the browser <-> proxy test. */
export function ProxyTab({ active }: { active: boolean }) {
  const [steps, setSteps] = React.useState<TestStep[]>(initialTestSteps());
  const [health, setHealth] = React.useState<ProxyHealth | undefined>();
  const [running, setRunning] = React.useState(false);
  const [done, setDone] = React.useState(false);

  const run = React.useCallback(async () => {
    setRunning(true);
    setDone(false);
    setHealth(undefined);
    const result = await runConnectionTest(setSteps);
    setHealth(result.health);
    setSteps(result.steps);
    setRunning(false);
    setDone(true);
  }, []);

  // Test once each time the tab is shown, so the status is never stale.
  React.useEffect(() => {
    if (active) void run();
  }, [active, run]);

  const passed = done && testPassed(steps);

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <h4 className="font-medium leading-none flex items-center gap-2">
          <Network className="h-4 w-4" />
          Connection method
        </h4>
        <p className="text-sm text-muted-foreground">
          Browsers can&apos;t open raw TCP sockets, so SSH, Telnet and database consoles go through a small
          helper that runs on your own machine. Nothing is sent to a third party.
        </p>
        <div className="flex items-center justify-center gap-2 rounded-md border bg-muted/40 p-3 text-xs font-medium">
          <span>Browser</span>
          <ArrowRight className="h-3 w-3 text-muted-foreground" />
          <span className="rounded bg-background border px-1.5 py-0.5">Local proxy :{PROXY_PORT}</span>
          <ArrowRight className="h-3 w-3 text-muted-foreground" />
          <span>Target system</span>
        </div>
      </div>

      <div className="space-y-2 border-t pt-4">
        <div className="flex items-center justify-between gap-2">
          <h4 className="font-medium leading-none flex items-center gap-2">
            <PlugZap className="h-4 w-4" />
            Test browser ↔ proxy
          </h4>
          <Button variant="secondary" size="sm" onClick={run} disabled={running} className="gap-1.5">
            {running ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
            Test connection
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">
          Checks only the link between this page and the proxy. It does not contact any server.
        </p>

        <ul className="space-y-2" aria-live="polite">
          {steps.map((s) => (
            <li key={s.id} className="flex items-start gap-2 text-sm">
              <span className="mt-0.5">
                <StepIcon status={s.status} />
              </span>
              <div className="min-w-0">
                <div>{s.label}</div>
                {s.detail && (
                  <div className={s.status === "fail" ? "text-xs text-destructive" : "text-xs text-muted-foreground"}>
                    {s.detail}
                  </div>
                )}
              </div>
            </li>
          ))}
        </ul>

        {done && passed && (
          <p className="text-sm text-green-500 flex items-center gap-1.5">
            <CheckCircle2 className="h-4 w-4" /> Proxy is reachable and responding.
          </p>
        )}
        {done && !passed && (
          <p className="text-sm text-muted-foreground">
            Not working yet? Open the <strong>Install</strong> tab to download or start the proxy, then test again.
          </p>
        )}
      </div>

      <div className="space-y-2 border-t pt-4">
        <h4 className="text-sm font-medium">Services</h4>
        <div className="flex flex-wrap gap-1.5">
          {SERVICES.map((s) => {
            const available = health ? health.services.includes(s.id) : undefined;
            return (
              <span
                key={s.id}
                className={
                  "inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-xs " +
                  (available === false ? "text-muted-foreground line-through" : "")
                }
                title={available === false ? "Not supported by the running proxy — update it" : s.description}
              >
                {available && <Check className="h-3 w-3 text-green-500" />}
                {s.label}
              </span>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/** "Install" tab: download instructions for the local proxy. */
export function InstallTab() {
  const os = React.useMemo(detectOsFromNavigator, []);

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Pick <strong>one</strong> option. Once the proxy is running, use the <strong>Proxy</strong> tab to test the
        connection.
      </p>

      <div className="rounded-md border p-3 space-y-2">
        <div className="flex items-center justify-between gap-2">
          <h4 className="text-sm font-semibold">Option 1 — Download the app</h4>
          <span className="text-xs text-muted-foreground">No Node.js needed</span>
        </div>
        <p className="text-xs text-muted-foreground">
          Detected: <strong>{os.label}</strong>. Download, then run it. You may need to allow it in your OS security
          settings the first time (on macOS/Linux: <code className="bg-muted px-1 rounded">chmod +x</code> first).
        </p>
        <a href={`${RELEASE_BASE}/${os.file}`} download>
          <Button size="sm" className="gap-2">
            <Download className="h-4 w-4" /> Download for {os.label}
          </Button>
        </a>
        <p className="text-xs text-muted-foreground">
          Other builds:{" "}
          {OS_BUILDS.filter((b) => b.key !== os.key).map((b, i, arr) => (
            <React.Fragment key={b.key}>
              <a className="underline" href={`${RELEASE_BASE}/${b.file}`}>
                {b.label}
              </a>
              {i < arr.length - 1 && ", "}
            </React.Fragment>
          ))}
        </p>
      </div>

      <div className="rounded-md border p-3 space-y-2">
        <h4 className="text-sm font-semibold">Option 2 — Run with Node.js</h4>
        <p className="text-xs text-muted-foreground">With Node.js 18+ installed, run this in a terminal:</p>
        <CopyableCommand command={NPX_COMMAND} />
      </div>

      <div className="space-y-1 text-xs text-muted-foreground">
        <p>
          The proxy listens on <code className="bg-muted px-1 rounded">127.0.0.1:{PROXY_PORT}</code> only and accepts
          connections just from the Desk-tools site. Credentials are held in memory for the session and never written
          to disk.
        </p>
        <p>
          Hosting Desk-tools yourself? Allow your origin with{" "}
          <code className="bg-muted px-1 rounded">DESK_TOOLS_ALLOWED_ORIGINS=https://your.host</code>.
        </p>
        <p>
          Source and releases:{" "}
          <a className="underline" href={PROXY_REPO} target="_blank" rel="noreferrer">
            {PROXY_REPO.replace("https://", "")}
          </a>
        </p>
      </div>
    </div>
  );
}
