"use client";

import * as React from "react";
import "@xterm/xterm/css/xterm.css";
import { AlertTriangle, Terminal as TerminalIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { PROXY_WS, getService, type ConnectParams } from "@/lib/local-proxy";
import { ProxyGate } from "./proxy-gate";
import { SavedList } from "./saved-list";
import { useSavedConnections, type SavedConnection } from "./use-saved-connections";

type Phase = "form" | "connecting" | "connected";
type AuthType = "password" | "key";

/** SSH or Telnet terminal in the browser, bridged by the local proxy. */
export function TerminalConsole({ service }: { service: "ssh" | "telnet" }) {
  return (
    <ProxyGate service={service}>
      <TerminalSession service={service} />
    </ProxyGate>
  );
}

function TerminalSession({ service }: { service: "ssh" | "telnet" }) {
  const meta = getService(service)!;
  const isSsh = service === "ssh";
  const saved = useSavedConnections(service);

  const [phase, setPhase] = React.useState<Phase>("form");
  const [error, setError] = React.useState<string | null>(null);
  const [statusText, setStatusText] = React.useState("");

  const [host, setHost] = React.useState("");
  const [port, setPort] = React.useState(String(meta.defaultPort));
  const [username, setUsername] = React.useState("");
  const [authType, setAuthType] = React.useState<AuthType>("password");
  const [password, setPassword] = React.useState("");
  const [privateKey, setPrivateKey] = React.useState("");
  const [passphrase, setPassphrase] = React.useState("");

  const termContainerRef = React.useRef<HTMLDivElement>(null);
  const cleanupRef = React.useRef<() => void>(() => {});

  const loadSaved = (h: SavedConnection) => {
    setHost(h.host);
    setPort(String(h.port));
    setUsername(h.username);
    // Entries saved by the old SSH page keep authType at the top level.
    const legacy = (h as unknown as { authType?: AuthType }).authType;
    setAuthType((h.extra?.authType as AuthType | undefined) ?? legacy ?? "password");
    setPassword("");
    setPrivateKey("");
    setPassphrase("");
  };

  const disconnect = React.useCallback(() => {
    cleanupRef.current();
    cleanupRef.current = () => {};
    setPhase("form");
    setStatusText("");
  }, []);

  React.useEffect(() => () => cleanupRef.current(), []);

  const connect = async () => {
    if (!host || (isSsh && !username)) {
      setError(isSsh ? "Host and username are required." : "Host is required.");
      return;
    }
    setError(null);
    setStatusText("Starting terminal…");
    setPhase("connecting");

    const portNum = Number(port) || meta.defaultPort;
    await saved.save({
      id: `${username}@${host}:${portNum}`,
      label: username ? `${username}@${host}` : host,
      host,
      port: portNum,
      username,
      extra: isSsh ? { authType } : undefined,
    });

    // xterm touches `window`, so it must be loaded only in the browser.
    const [{ Terminal }, { FitAddon }] = await Promise.all([import("@xterm/xterm"), import("@xterm/addon-fit")]);

    setPhase("connected");
    await new Promise((r) => requestAnimationFrame(() => r(null))); // let the container mount
    const container = termContainerRef.current;
    if (!container) return;

    const term = new Terminal({
      cursorBlink: true,
      fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, "Cascadia Code", monospace',
      fontSize: 13,
      theme: { background: "#0b0e14" },
    });
    const fit = new FitAddon();
    term.loadAddon(fit);
    term.open(container);
    fit.fit();

    const ws = new WebSocket(PROXY_WS);
    ws.binaryType = "arraybuffer";
    const encoder = new TextEncoder();

    ws.onopen = () => {
      const msg: ConnectParams = {
        service,
        host,
        port: portNum,
        username: username || undefined,
        password: isSsh && authType === "password" ? password : undefined,
        privateKey: isSsh && authType === "key" ? privateKey : undefined,
        passphrase: isSsh && authType === "key" ? passphrase || undefined : undefined,
        cols: term.cols,
        rows: term.rows,
      };
      ws.send(JSON.stringify({ type: "connect", ...msg }));
    };

    ws.onmessage = (e) => {
      if (typeof e.data !== "string") {
        term.write(new Uint8Array(e.data));
        return;
      }
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
    };
    ws.onclose = () => term.writeln("\r\n\x1b[33m[proxy] connection closed\x1b[0m");
    ws.onerror = () => setError("WebSocket error — is the proxy still running?");

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

  if (phase !== "form") {
    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2 text-sm">
            <span className="inline-flex h-2 w-2 rounded-full bg-emerald-500" />
            <span className="font-medium">
              {username ? `${username}@` : ""}
              {host}:{port}
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
        <div ref={termContainerRef} className="rounded-md border bg-[#0b0e14] p-2" style={{ height: "60vh" }} />
      </div>
    );
  }

  return (
    <div className="grid gap-6 md:grid-cols-3">
      <Card className="p-5 md:col-span-2 space-y-4">
        {!isSsh && (
          <p className="text-sm text-amber-600 flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            Telnet sends everything — including passwords — unencrypted. Use it only on trusted networks.
          </p>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto] gap-3">
          <div className="space-y-1">
            <label className="text-sm font-medium" htmlFor="host">Host</label>
            <Input id="host" placeholder="example.com or 192.168.1.10" value={host} onChange={(e) => setHost(e.target.value)} />
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium" htmlFor="port">Port</label>
            <Input id="port" className="w-24" value={port} onChange={(e) => setPort(e.target.value)} />
          </div>
        </div>

        {isSsh && (
          <>
            <div className="space-y-1">
              <label className="text-sm font-medium" htmlFor="username">Username</label>
              <Input id="username" placeholder="root" value={username} onChange={(e) => setUsername(e.target.value)} />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Authentication</label>
              <div className="flex gap-2">
                <Button type="button" variant={authType === "password" ? "default" : "outline"} size="sm" onClick={() => setAuthType("password")}>
                  Password
                </Button>
                <Button type="button" variant={authType === "key" ? "default" : "outline"} size="sm" onClick={() => setAuthType("key")}>
                  Private key
                </Button>
              </div>
            </div>

            {authType === "password" ? (
              <div className="space-y-1">
                <label className="text-sm font-medium" htmlFor="password">Password</label>
                <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
              </div>
            ) : (
              <div className="space-y-3">
                <div className="space-y-1">
                  <label className="text-sm font-medium" htmlFor="key">Private key</label>
                  <textarea
                    id="key"
                    className="w-full h-32 rounded-md border bg-background p-2 font-mono text-xs"
                    placeholder="-----BEGIN OPENSSH PRIVATE KEY-----"
                    value={privateKey}
                    onChange={(e) => setPrivateKey(e.target.value)}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium" htmlFor="passphrase">Passphrase (optional)</label>
                  <Input id="passphrase" type="password" value={passphrase} onChange={(e) => setPassphrase(e.target.value)} />
                </div>
              </div>
            )}
          </>
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
        </p>
      </Card>

      <SavedList items={saved.items} onLoad={loadSaved} onDelete={saved.remove} />
    </div>
  );
}
