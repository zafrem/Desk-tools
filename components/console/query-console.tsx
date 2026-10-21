"use client";

import * as React from "react";
import { AlertTriangle, Download, Loader2, Play, Square } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  PROXY_WS,
  formatCell,
  getService,
  resultToCsv,
  type ConnectParams,
  type QueryResult,
  type ServiceId,
} from "@/lib/local-proxy";
import { ProxyGate } from "./proxy-gate";
import { SavedList } from "./saved-list";
import { useSavedConnections, type SavedConnection } from "./use-saved-connections";

type QueryService = Exclude<ServiceId, "ssh" | "telnet">;
type Phase = "form" | "connecting" | "connected";

const ROW_LIMITS = [100, 1000, 10000];

/** Read-only SQL console (SELECT only) for MySQL, PostgreSQL, Hive and Trino. */
export function QueryConsole({ service }: { service: QueryService }) {
  return (
    <ProxyGate service={service}>
      <QuerySession service={service} />
    </ProxyGate>
  );
}

function QuerySession({ service }: { service: QueryService }) {
  const { t } = useTranslation("proxy");
  const meta = getService(service)!;
  const saved = useSavedConnections(service);

  const [phase, setPhase] = React.useState<Phase>("form");
  const [error, setError] = React.useState<string | null>(null);
  const [serverVersion, setServerVersion] = React.useState<string | undefined>();

  const [host, setHost] = React.useState("");
  const [port, setPort] = React.useState(String(meta.defaultPort));
  const [username, setUsername] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [database, setDatabase] = React.useState("");
  const [catalog, setCatalog] = React.useState("");
  const [schema, setSchema] = React.useState("");
  const [tls, setTls] = React.useState(false);
  const [hiveAuth, setHiveAuth] = React.useState<"none" | "ldap">("none");

  const [sql, setSql] = React.useState("SELECT 1");
  const [maxRows, setMaxRows] = React.useState(1000);
  const [runningId, setRunningId] = React.useState<string | null>(null);
  const [result, setResult] = React.useState<QueryResult | null>(null);
  const [queryError, setQueryError] = React.useState<string | null>(null);

  const wsRef = React.useRef<WebSocket | null>(null);
  const nextId = React.useRef(1);

  React.useEffect(() => () => wsRef.current?.close(), []);

  const loadSaved = (h: SavedConnection) => {
    setHost(h.host);
    setPort(String(h.port));
    setUsername(h.username);
    setDatabase(h.extra?.database ?? "");
    setCatalog(h.extra?.catalog ?? "");
    setSchema(h.extra?.schema ?? "");
    setPassword("");
  };

  const disconnect = React.useCallback(() => {
    try {
      wsRef.current?.send(JSON.stringify({ type: "close" }));
    } catch {
      /* socket already gone */
    }
    wsRef.current?.close();
    wsRef.current = null;
    setPhase("form");
    setRunningId(null);
    setResult(null);
    setQueryError(null);
  }, []);

  const connect = async () => {
    if (!host || !username) {
      setError(t("errors.hostUserRequired"));
      return;
    }
    setError(null);
    setPhase("connecting");
    const portNum = Number(port) || meta.defaultPort;

    await saved.save({
      id: `${username}@${host}:${portNum}`,
      label: `${username}@${host}`,
      host,
      port: portNum,
      username,
      extra: { database, catalog, schema },
    });

    const params: ConnectParams = {
      service,
      host,
      port: portNum,
      username,
      password: password || undefined,
      database: database || undefined,
      catalog: catalog || undefined,
      schema: schema || undefined,
      tls: service === "hive" ? undefined : tls,
      auth: service === "hive" ? hiveAuth : undefined,
    };

    const ws = new WebSocket(PROXY_WS);
    wsRef.current = ws;

    ws.onopen = () => ws.send(JSON.stringify({ type: "connect", ...params }));
    ws.onmessage = (e) => {
      if (typeof e.data !== "string") return;
      let msg;
      try {
        msg = JSON.parse(e.data);
      } catch {
        return;
      }
      if (msg.type === "status") {
        if (msg.state === "ready") {
          setServerVersion(msg.info?.serverVersion);
          setPhase("connected");
        } else if (msg.state === "closed") {
          setPhase("form");
        }
      } else if (msg.type === "result") {
        setResult(msg as QueryResult);
        setQueryError(null);
        setRunningId(null);
      } else if (msg.type === "error") {
        if (msg.id !== undefined) {
          setQueryError(`${msg.message}${msg.code === "query_failed" ? "" : ` (${msg.code})`}`);
          setResult(null);
          setRunningId(null);
        } else {
          setError(msg.message);
          setPhase("form");
        }
      }
    };
    ws.onclose = () => {
      wsRef.current = null;
      setPhase((p) => (p === "connected" ? "form" : p));
      setRunningId(null);
    };
    ws.onerror = () => {
      setError(t("errors.websocket"));
      setPhase("form");
    };
  };

  const run = () => {
    const ws = wsRef.current;
    if (!ws || ws.readyState !== WebSocket.OPEN || runningId) return;
    const id = `q${nextId.current++}`;
    setRunningId(id);
    setQueryError(null);
    ws.send(JSON.stringify({ type: "query", id, sql, maxRows }));
  };

  const cancel = () => {
    if (runningId) wsRef.current?.send(JSON.stringify({ type: "cancel", id: runningId }));
  };

  const exportCsv = () => {
    if (!result) return;
    const url = URL.createObjectURL(new Blob([resultToCsv(result)], { type: "text/csv" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = `${service}-result.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (phase === "form" || phase === "connecting") {
    const connecting = phase === "connecting";
    return (
      <div className="grid gap-6 md:grid-cols-3">
        <Card className="p-5 md:col-span-2 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto] gap-3">
            <div className="space-y-1">
              <label className="text-sm font-medium" htmlFor="host">{t("form.host")}</label>
              <Input id="host" placeholder={t("form.hostPlaceholderDb")} value={host} onChange={(e) => setHost(e.target.value)} />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium" htmlFor="port">{t("form.port")}</label>
              <Input id="port" className="w-24" value={port} onChange={(e) => setPort(e.target.value)} />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-sm font-medium" htmlFor="username">{t("form.username")}</label>
              <Input id="username" value={username} onChange={(e) => setUsername(e.target.value)} />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium" htmlFor="password">{t("form.password")}</label>
              <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
            </div>
          </div>

          {service === "trino" ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-sm font-medium" htmlFor="catalog">{t("form.catalog")}</label>
                <Input id="catalog" value={catalog} onChange={(e) => setCatalog(e.target.value)} />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium" htmlFor="schema">{t("form.schema")}</label>
                <Input id="schema" value={schema} onChange={(e) => setSchema(e.target.value)} />
              </div>
            </div>
          ) : (
            <div className="space-y-1">
              <label className="text-sm font-medium" htmlFor="database">{t("form.database")}</label>
              <Input id="database" value={database} onChange={(e) => setDatabase(e.target.value)} />
            </div>
          )}

          <div className="flex flex-wrap items-center gap-4">
            {service === "hive" ? (
              <label className="text-sm flex items-center gap-2">
                {t("form.authentication")}
                <select
                  className="rounded-md border bg-background px-2 py-1 text-sm"
                  value={hiveAuth}
                  onChange={(e) => setHiveAuth(e.target.value as "none" | "ldap")}
                >
                  <option value="none">{t("form.hiveNone")}</option>
                  <option value="ldap">{t("form.hiveLdap")}</option>
                </select>
              </label>
            ) : (
              <label className="text-sm flex items-center gap-2">
                <input type="checkbox" checked={tls} onChange={(e) => setTls(e.target.checked)} />
                {t("form.tls")}
              </label>
            )}
          </div>

          {error && (
            <p className="text-sm text-red-500 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 shrink-0" /> {error}
            </p>
          )}

          <Button onClick={connect} disabled={connecting} className="gap-2">
            {connecting && <Loader2 className="h-4 w-4 animate-spin" />}
            {connecting ? t("form.connecting") : t("form.connect")}
          </Button>
          <p className="text-xs text-muted-foreground">
            {t("query.readOnlyNote")}
          </p>
        </Card>

        <SavedList items={saved.items} onLoad={loadSaved} onDelete={saved.remove} />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2 text-sm">
          <span className="inline-flex h-2 w-2 rounded-full bg-emerald-500" />
          <span className="font-medium">
            {meta.label} — {username}@{host}:{port}
          </span>
          {serverVersion && <span className="text-muted-foreground">v{serverVersion}</span>}
        </div>
        <Button variant="outline" size="sm" onClick={disconnect}>
          {t("form.disconnect")}
        </Button>
      </div>

      <Card className="p-4 space-y-3">
        <textarea
          className="w-full h-36 rounded-md border bg-background p-2 font-mono text-sm"
          value={sql}
          spellCheck={false}
          aria-label={t("query.sql")}
          onChange={(e) => setSql(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
              e.preventDefault();
              run();
            }
          }}
        />
        <div className="flex flex-wrap items-center gap-3">
          {runningId ? (
            <Button variant="destructive" size="sm" className="gap-2" onClick={cancel}>
              <Square className="h-4 w-4" /> {t("query.cancel")}
            </Button>
          ) : (
            <Button size="sm" className="gap-2" onClick={run}>
              <Play className="h-4 w-4" /> {t("query.run")}
            </Button>
          )}
          {runningId && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
          <label className="text-sm flex items-center gap-2 text-muted-foreground">
            {t("query.maxRows")}
            <select
              className="rounded-md border bg-background px-2 py-1 text-sm text-foreground"
              value={maxRows}
              onChange={(e) => setMaxRows(Number(e.target.value))}
            >
              {ROW_LIMITS.map((n) => (
                <option key={n} value={n}>
                  {n.toLocaleString()}
                </option>
              ))}
            </select>
          </label>
          <span className="text-xs text-muted-foreground">{t("query.shortcut")}</span>
        </div>
      </Card>

      {queryError && (
        <p className="text-sm text-red-500 flex items-start gap-2">
          <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" /> <span className="whitespace-pre-wrap">{queryError}</span>
        </p>
      )}

      {result && (
        <Card className="p-4 space-y-3">
          <div className="flex items-center justify-between flex-wrap gap-2 text-sm">
            <span className="text-muted-foreground">
              {t("query.rowCount", { count: result.rowCount, ms: result.elapsedMs })}
              {result.truncated && (
                <span className="text-amber-600">{t("query.truncated", { max: maxRows.toLocaleString() })}</span>
              )}
            </span>
            <Button variant="outline" size="sm" className="gap-2" onClick={exportCsv}>
              <Download className="h-4 w-4" /> {t("query.csv")}
            </Button>
          </div>
          <div className="overflow-auto max-h-[50vh] rounded-md border">
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-muted">
                <tr>
                  {result.columns.map((c, i) => (
                    <th key={i} className="px-3 py-1.5 text-left font-medium whitespace-nowrap" title={c.type}>
                      {c.name}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {result.rows.map((row, ri) => (
                  <tr key={ri} className="border-t">
                    {row.map((cell, ci) => (
                      <td
                        key={ci}
                        className={
                          "px-3 py-1 font-mono text-xs whitespace-nowrap " + (cell === null ? "text-muted-foreground italic" : "")
                        }
                      >
                        {formatCell(cell)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}
