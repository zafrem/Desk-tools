"use client";

import * as React from "react";
import "@xterm/xterm/css/xterm.css";
import { ToolLayout } from "@/components/tool-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { getPreference, setPreference } from "@/lib/db";
import {
  Terminal as TerminalIcon,
  Loader2,
  Download,
  Copy,
  Check,
  RefreshCw,
  Plug,
  AlertTriangle,
  Trash2,
} from "lucide-react";

// The local proxy listens here. Same port for the binary and the `npx` helper —
// they run the identical program, so either one satisfies this.
const PROXY_PORT = 8722;
const HEALTH_URL = `http://127.0.0.1:${PROXY_PORT}/health`;
const WS_URL = `ws://127.0.0.1:${PROXY_PORT}`;

const RELEASE_BASE =
  "https://github.com/zafrem/Desk-tools-ssh-proxy/releases/latest/download";
const NPX_COMMAND = "npx desk-tools-ssh-proxy";

type Phase = "detecting" | "setup" | "form" | "connecting" | "connected";

type AuthType = "password" | "key";

interface SavedHost {
  id: string;
  label: string;
  host: string;
  port: number;
  username: string;
  authType: AuthType;
}

interface OsInfo {
  key: "macos-arm64" | "macos-x64" | "linux-x64" | "windows-x64";
  label: string;
  file: string;
}

function detectOs(): OsInfo {
  const ua = (navigator.userAgent || "").toLowerCase();
  const plat = (navigator.platform || "").toLowerCase();
  if (ua.includes("win") || plat.includes("win")) {
    return { key: "windows-x64", label: "Windows", file: "ssh-proxy-windows-x64.exe" };
  }
  if (ua.includes("mac") || plat.includes("mac")) {
    // Apple Silicon reports "MacIntel" too; default to arm64 (current Macs).
    const isArm = ua.includes("arm") || /mac/.test(plat);
    return isArm
      ? { key: "macos-arm64", label: "macOS (Apple Silicon)", file: "ssh-proxy-macos-arm64" }
      : { key: "macos-x64", label: "macOS (Intel)", file: "ssh-proxy-macos-x64" };
  }
  return { key: "linux-x64", label: "Linux", file: "ssh-proxy-linux-x64" };
}

const SAVED_HOSTS_KEY = "ssh_saved_hosts";

export default function SshTerminalPage() {
  return (
    <ToolLayout
      title="SSH Terminal"
      description="Connect to SSH servers from your browser through a local proxy. Your credentials never leave your machine."
      fullWidth
    >
      <SshTerminal />
    </ToolLayout>
  );
}

function SshTerminal() {
  const [phase, setPhase] = React.useState<Phase>("detecting");
  const [error, setError] = React.useState<string | null>(null);
  const [statusText, setStatusText] = React.useState<string>("");

  // Connection form
  const [host, setHost] = React.useState("");
  const [port, setPort] = React.useState("22");
  const [username, setUsername] = React.useState("");
  const [authType, setAuthType] = React.useState<AuthType>("password");
  const [password, setPassword] = React.useState("");
  const [privateKey, setPrivateKey] = React.useState("");
  const [passphrase, setPassphrase] = React.useState("");
  const [savedHosts, setSavedHosts] = React.useState<SavedHost[]>([]);

  const os = React.useMemo(detectOs, []);

  // ---- Proxy detection (poll the health endpoint) ----------------------
  const checkProxy = React.useCallback(async (): Promise<boolean> => {
    try {
      const res = await fetch(HEALTH_URL, { cache: "no-store" });
      if (!res.ok) return false;
      const data = await res.json();
      return data?.service === "desk-tools-ssh-proxy";
    } catch {
      return false;
    }
  }, []);

  // Auto-poll while we are showing the setup screen, so the moment the user
  // starts the proxy (binary or npx) we advance automatically.
  React.useEffect(() => {
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout>;

    const tick = async () => {
      const up = await checkProxy();
      if (cancelled) return;
      if (up) {
        setPhase("form");
      } else if (phase === "detecting") {
        setPhase("setup");
      }
      if (!up && (phase === "detecting" || phase === "setup")) {
        timer = setTimeout(tick, 2000);
      }
    };

    if (phase === "detecting" || phase === "setup") {
      tick();
    }
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [phase, checkProxy]);

  // ---- Saved hosts -----------------------------------------------------
  React.useEffect(() => {
    (async () => {
      const raw = await getPreference(SAVED_HOSTS_KEY);
      if (raw) {
        try {
          setSavedHosts(JSON.parse(raw));
        } catch {
          /* ignore corrupt value */
        }
      }
    })();
  }, []);

  const persistHosts = async (hosts: SavedHost[]) => {
    setSavedHosts(hosts);
    await setPreference(SAVED_HOSTS_KEY, JSON.stringify(hosts));
  };

  const saveCurrentHost = async () => {
    if (!host || !username) return;
    const entry: SavedHost = {
      id: `${username}@${host}:${port}`,
      label: `${username}@${host}`,
      host,
      port: Number(port) || 22,
      username,
      authType,
    };
    const next = [entry, ...savedHosts.filter((h) => h.id !== entry.id)].slice(0, 12);
    await persistHosts(next);
  };

  const loadHost = (h: SavedHost) => {
    setHost(h.host);
    setPort(String(h.port));
    setUsername(h.username);
    setAuthType(h.authType);
    setPassword("");
    setPrivateKey("");
    setPassphrase("");
  };

  const deleteHost = async (id: string) => {
    await persistHosts(savedHosts.filter((h) => h.id !== id));
  };

  // ---- Terminal session ------------------------------------------------
  const termContainerRef = React.useRef<HTMLDivElement>(null);
  const cleanupRef = React.useRef<() => void>(() => {});

  const disconnect = React.useCallback(() => {
    cleanupRef.current();
    cleanupRef.current = () => {};
    setPhase("form");
    setStatusText("");
  }, []);

  const connect = async () => {
    if (!host || !username) {
      setError("Host and username are required.");
      return;
    }
    setError(null);
    setStatusText("Starting terminal…");
    setPhase("connecting");
    await saveCurrentHost();

    // xterm touches `window`, so it must be loaded only in the browser.
    const [{ Terminal }, { FitAddon }] = await Promise.all([
      import("@xterm/xterm"),
      import("@xterm/addon-fit"),
    ]);

    setPhase("connected");
    // Wait a tick so the container is mounted.
    await new Promise((r) => requestAnimationFrame(() => r(null)));
    const container = termContainerRef.current;
    if (!container) return;

    const term = new Terminal({
      cursorBlink: true,
      fontFamily:
        'ui-monospace, SFMono-Regular, Menlo, Monaco, "Cascadia Code", monospace',
      fontSize: 13,
      theme: { background: "#0b0e14" },
    });
    const fit = new FitAddon();
    term.loadAddon(fit);
    term.open(container);
    fit.fit();

    const ws = new WebSocket(WS_URL);
    ws.binaryType = "arraybuffer";
    const encoder = new TextEncoder();

    ws.onopen = () => {
      ws.send(
        JSON.stringify({
          type: "connect",
          host,
          port: Number(port) || 22,
          username,
          password: authType === "password" ? password : undefined,
          privateKey: authType === "key" ? privateKey : undefined,
          passphrase: authType === "key" ? passphrase || undefined : undefined,
          cols: term.cols,
          rows: term.rows,
        })
      );
    };

    ws.onmessage = (e) => {
      if (typeof e.data === "string") {
        try {
          const msg = JSON.parse(e.data);
          if (msg.type === "error") {
            term.writeln(`\r\n\x1b[31m[proxy] ${msg.message}\x1b[0m`);
            setError(msg.message);
          } else if (msg.type === "status") {
            if (msg.state === "connecting") setStatusText(`Connecting ${msg.message || ""}`);
            if (msg.state === "ready") setStatusText("Connected");
            if (msg.state === "closed") setStatusText("Session closed");
          }
        } catch {
          /* ignore */
        }
      } else {
        term.write(new Uint8Array(e.data));
      }
    };

    ws.onclose = () => {
      term.writeln("\r\n\x1b[33m[proxy] connection closed\x1b[0m");
    };
    ws.onerror = () => {
      setError("WebSocket error — is the proxy still running?");
    };

    const dataDisposable = term.onData((d) => {
      if (ws.readyState === WebSocket.OPEN) ws.send(encoder.encode(d));
    });

    const onResize = () => {
      fit.fit();
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ type: "resize", cols: term.cols, rows: term.rows }));
      }
    };
    window.addEventListener("resize", onResize);

    cleanupRef.current = () => {
      window.removeEventListener("resize", onResize);
      dataDisposable.dispose();
      try {
        ws.close();
      } catch {
        /* noop */
      }
      term.dispose();
    };
  };

  // Tear down on unmount.
  React.useEffect(() => () => cleanupRef.current(), []);

  // ---- Render ----------------------------------------------------------
  if (phase === "detecting") {
    return (
      <Card className="p-8 flex items-center justify-center gap-3 text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin" />
        Looking for the local SSH proxy…
      </Card>
    );
  }

  if (phase === "setup") {
    return <SetupPanel os={os} onRetry={() => setPhase("detecting")} />;
  }

  if (phase === "connected" || phase === "connecting") {
    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2 text-sm">
            <span className="inline-flex h-2 w-2 rounded-full bg-emerald-500" />
            <span className="font-medium">
              {username}@{host}:{port}
            </span>
            {statusText && <span className="text-muted-foreground">— {statusText}</span>}
          </div>
          <Button variant="outline" size="sm" onClick={disconnect}>
            Disconnect
          </Button>
        </div>
        {error && (
          <p className="text-sm text-red-500 flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" /> {error}
          </p>
        )}
        <div
          ref={termContainerRef}
          className="rounded-md border bg-[#0b0e14] p-2"
          style={{ height: "60vh" }}
        />
      </div>
    );
  }

  // phase === "form"
  return (
    <div className="grid gap-6 md:grid-cols-3">
      <Card className="p-5 md:col-span-2 space-y-4">
        <div className="flex items-center gap-2 text-sm text-emerald-600">
          <Plug className="h-4 w-4" /> Local proxy detected on port {PROXY_PORT}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto] gap-3">
          <div className="space-y-1">
            <label className="text-sm font-medium">Host</label>
            <Input
              placeholder="example.com or 192.168.1.10"
              value={host}
              onChange={(e) => setHost(e.target.value)}
            />
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium">Port</label>
            <Input
              className="w-24"
              value={port}
              onChange={(e) => setPort(e.target.value)}
            />
          </div>
        </div>

        <div className="space-y-1">
          <label className="text-sm font-medium">Username</label>
          <Input
            placeholder="root"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Authentication</label>
          <div className="flex gap-2">
            <Button
              type="button"
              variant={authType === "password" ? "default" : "outline"}
              size="sm"
              onClick={() => setAuthType("password")}
            >
              Password
            </Button>
            <Button
              type="button"
              variant={authType === "key" ? "default" : "outline"}
              size="sm"
              onClick={() => setAuthType("key")}
            >
              Private key
            </Button>
          </div>
        </div>

        {authType === "password" ? (
          <div className="space-y-1">
            <label className="text-sm font-medium">Password</label>
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
        ) : (
          <div className="space-y-3">
            <div className="space-y-1">
              <label className="text-sm font-medium">Private key</label>
              <textarea
                className="w-full h-32 rounded-md border bg-background p-2 font-mono text-xs"
                placeholder="-----BEGIN OPENSSH PRIVATE KEY-----"
                value={privateKey}
                onChange={(e) => setPrivateKey(e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium">Passphrase (optional)</label>
              <Input
                type="password"
                value={passphrase}
                onChange={(e) => setPassphrase(e.target.value)}
              />
            </div>
          </div>
        )}

        {error && (
          <p className="text-sm text-red-500 flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" /> {error}
          </p>
        )}

        <Button onClick={connect} className="gap-2">
          <TerminalIcon className="h-4 w-4" /> Connect
        </Button>
        <p className="text-xs text-muted-foreground">
          Credentials are sent only to your local proxy and are never stored.
          Only the host, port and username are remembered for quick reconnect.
        </p>
      </Card>

      <Card className="p-5 space-y-3">
        <h3 className="text-sm font-semibold">Saved connections</h3>
        {savedHosts.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Connections you use will appear here.
          </p>
        ) : (
          <ul className="space-y-2">
            {savedHosts.map((h) => (
              <li key={h.id} className="flex items-center justify-between gap-2">
                <button
                  className="text-sm text-left hover:underline truncate"
                  onClick={() => loadHost(h)}
                  title={`${h.label}:${h.port}`}
                >
                  {h.label}
                  <span className="text-muted-foreground">:{h.port}</span>
                </button>
                <button
                  className="text-muted-foreground hover:text-red-500"
                  onClick={() => deleteHost(h.id)}
                  aria-label="Delete"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}

function SetupPanel({ os, onRetry }: { os: OsInfo; onRetry: () => void }) {
  const [copied, setCopied] = React.useState(false);

  const copyNpx = async () => {
    await navigator.clipboard.writeText(NPX_COMMAND);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <Card className="p-6 space-y-6 max-w-2xl">
      <div className="flex items-center gap-3">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        <div>
          <h2 className="font-semibold">Start the local SSH proxy</h2>
          <p className="text-sm text-muted-foreground">
            The browser can&apos;t open SSH directly, so a small helper runs on
            your machine. Pick <strong>one</strong> of the options below — this
            page connects automatically once it&apos;s running.
          </p>
        </div>
      </div>

      {/* Option 1: binary (no Node needed) */}
      <div className="rounded-md border p-4 space-y-2">
        <div className="flex items-center justify-between gap-2">
          <h3 className="text-sm font-semibold">Option 1 — Download the app (recommended)</h3>
          <span className="text-xs text-muted-foreground">No Node.js required</span>
        </div>
        <p className="text-sm text-muted-foreground">
          Detected: <strong>{os.label}</strong>. Download, then run it (you may
          need to allow it in your OS security settings the first time).
        </p>
        <a href={`${RELEASE_BASE}/${os.file}`} download>
          <Button className="gap-2">
            <Download className="h-4 w-4" /> Download for {os.label}
          </Button>
        </a>
        <p className="text-xs text-muted-foreground">
          Other builds:{" "}
          <a className="underline" href={`${RELEASE_BASE}/ssh-proxy-macos-arm64`}>macOS arm64</a>,{" "}
          <a className="underline" href={`${RELEASE_BASE}/ssh-proxy-macos-x64`}>macOS x64</a>,{" "}
          <a className="underline" href={`${RELEASE_BASE}/ssh-proxy-linux-x64`}>Linux x64</a>,{" "}
          <a className="underline" href={`${RELEASE_BASE}/ssh-proxy-windows-x64.exe`}>Windows x64</a>
        </p>
      </div>

      {/* Option 2: npx (if Node is installed) */}
      <div className="rounded-md border p-4 space-y-2">
        <h3 className="text-sm font-semibold">Option 2 — Run with Node.js</h3>
        <p className="text-sm text-muted-foreground">
          If you already have Node.js 18+, run this in a terminal — no install
          step:
        </p>
        <div className="flex items-center gap-2">
          <code className="flex-1 rounded bg-muted px-3 py-2 text-sm font-mono">
            {NPX_COMMAND}
          </code>
          <Button variant="outline" size="icon" onClick={copyNpx} aria-label="Copy command">
            {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
          </Button>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <Button variant="outline" className="gap-2" onClick={onRetry}>
          <RefreshCw className="h-4 w-4" /> Check again
        </Button>
        <span className="text-xs text-muted-foreground">
          Waiting for the proxy on 127.0.0.1:{PROXY_PORT}…
        </span>
      </div>
    </Card>
  );
}
