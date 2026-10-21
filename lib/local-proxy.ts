// Client side of the browser <-> local-proxy protocol.
// The wire format is documented in Desk-tools-local-proxy/PROTOCOL.md.

export const PROXY_PORT = 8722;
export const PROXY_HTTP = `http://127.0.0.1:${PROXY_PORT}`;
export const PROXY_WS = `ws://127.0.0.1:${PROXY_PORT}`;
export const PROXY_HEALTH_URL = `${PROXY_HTTP}/health`;
export const PROXY_SERVICE_NAME = "desk-tools-local-proxy";

export const PROXY_REPO = "https://github.com/zafrem/Desk-tools-local-proxy";

/** The proxy is not published to npm or as binaries: users clone and run it. */
export const INSTALL_STEPS: { id: "clone" | "install" | "start"; label: string; command: string }[] = [
  { id: "clone", label: "Clone the code", command: `git clone ${PROXY_REPO}.git` },
  { id: "install", label: "Install dependencies", command: "cd Desk-tools-local-proxy && npm install" },
  { id: "start", label: "Start the proxy", command: "npm start" },
];

/** Highest protocol version this web app understands. */
export const SUPPORTED_PROTOCOL = 2;

export type ServiceId = "ssh" | "telnet" | "mysql" | "postgres" | "hive" | "trino";
export type ServiceKind = "terminal" | "query";

export interface ServiceMeta {
  id: ServiceId;
  label: string;
  kind: ServiceKind;
  defaultPort: number;
  description: string;
  icon: string; // lucide-react icon name
}

export const SERVICES: ServiceMeta[] = [
  { id: "ssh", label: "SSH", kind: "terminal", defaultPort: 22, description: "Secure shell terminal", icon: "Terminal" },
  { id: "telnet", label: "Telnet", kind: "terminal", defaultPort: 23, description: "Plain-text telnet terminal", icon: "SquareTerminal" },
  { id: "mysql", label: "MySQL", kind: "query", defaultPort: 3306, description: "Run SELECT queries on MySQL / MariaDB", icon: "Database" },
  { id: "postgres", label: "PostgreSQL", kind: "query", defaultPort: 5432, description: "Run SELECT queries on PostgreSQL", icon: "Database" },
  { id: "hive", label: "Hive", kind: "query", defaultPort: 10000, description: "Run SELECT queries on HiveServer2", icon: "Database" },
  { id: "trino", label: "Trino", kind: "query", defaultPort: 8080, description: "Run SELECT queries on Trino", icon: "Database" },
];

export function getService(id: string): ServiceMeta | undefined {
  return SERVICES.find((s) => s.id === id);
}

// ---- Health ---------------------------------------------------------------

export interface ProxyHealth {
  service: string;
  version: string;
  protocol: number;
  services: ServiceId[];
  ok: boolean;
}

/** `AbortSignal.timeout` with a fallback for older browsers. */
export function timeoutSignal(ms: number): AbortSignal {
  if (typeof AbortSignal.timeout === "function") return AbortSignal.timeout(ms);
  const controller = new AbortController();
  setTimeout(() => controller.abort(), ms);
  return controller.signal;
}

/** Fetches /health and normalises a v1 proxy (no `protocol` / `services`). */
export async function fetchHealth(signal?: AbortSignal): Promise<ProxyHealth> {
  const res = await fetch(PROXY_HEALTH_URL, { cache: "no-store", signal });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const data = await res.json();
  if (data?.service !== PROXY_SERVICE_NAME) {
    throw new TestError("Something answered on this port, but it is not desk-tools-local-proxy", "notProxy");
  }
  return {
    service: data.service,
    version: String(data.version ?? "unknown"),
    protocol: typeof data.protocol === "number" ? data.protocol : 1,
    services: Array.isArray(data.services) ? data.services : ["ssh"],
    ok: data.ok !== false,
  };
}

export async function isProxyUp(): Promise<boolean> {
  try {
    await fetchHealth(timeoutSignal(2000));
    return true;
  } catch {
    return false;
  }
}

// ---- Connection test (browser <-> proxy only; see PROTOCOL.md §8) ---------

export type TestStepId = "http" | "websocket" | "roundtrip";
export type TestStepStatus = "pending" | "running" | "ok" | "fail" | "skipped";

export interface TestStep {
  id: TestStepId;
  label: string;
  status: TestStepStatus;
  /** English text; `detailKey` + `detailParams` let the UI show a translation instead. */
  detail?: string;
  detailKey?: string;
  detailParams?: Record<string, string | number>;
}

/** A test failure that carries a translation key for the UI. */
class TestError extends Error {
  constructor(message: string, public key: string) {
    super(message);
  }
}

export const initialTestSteps = (): TestStep[] => [
  { id: "http", label: "Reach the proxy over HTTP", status: "pending" },
  { id: "websocket", label: "Open a WebSocket", status: "pending" },
  { id: "roundtrip", label: "Exchange messages", status: "pending" },
];

/** Opens a WebSocket and resolves with it once open. */
function openSocket(timeoutMs: number): Promise<WebSocket> {
  return new Promise((resolve, reject) => {
    const ws = new WebSocket(PROXY_WS);
    const timer = setTimeout(() => {
      ws.close();
      reject(new TestError("Timed out opening the WebSocket", "wsTimeout"));
    }, timeoutMs);
    ws.onopen = () => {
      clearTimeout(timer);
      resolve(ws);
    };
    ws.onerror = () => {
      clearTimeout(timer);
      reject(new TestError("The proxy refused the WebSocket (is this site's origin allowed?)", "wsRefused"));
    };
  });
}

/** Sends an unknown message and waits for the proxy's bad_message error. */
function roundTrip(ws: WebSocket, timeoutMs: number): Promise<void> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new TestError("No reply from the proxy", "noReply")), timeoutMs);
    ws.onmessage = (e) => {
      if (typeof e.data !== "string") return;
      try {
        const msg = JSON.parse(e.data);
        if (msg.type === "error" && msg.code === "bad_message") {
          clearTimeout(timer);
          resolve();
        }
      } catch {
        /* keep waiting */
      }
    };
    ws.onclose = () => {
      clearTimeout(timer);
      reject(new TestError("The proxy closed the connection", "closed"));
    };
    ws.send(JSON.stringify({ type: "ping-test" }));
  });
}

/**
 * Runs the three-step browser <-> proxy test. Never contacts a target system.
 * `onUpdate` receives a fresh copy of the steps after every change.
 */
export async function runConnectionTest(
  onUpdate: (steps: TestStep[]) => void = () => {}
): Promise<{ steps: TestStep[]; health?: ProxyHealth }> {
  const steps = initialTestSteps();
  const emit = () => onUpdate(steps.map((x) => ({ ...x })));
  const set = (
    id: TestStepId,
    status: TestStepStatus,
    detail?: string,
    key?: string,
    params?: Record<string, string | number>
  ) => {
    const s = steps.find((x) => x.id === id)!;
    s.status = status;
    s.detail = detail;
    s.detailKey = key;
    s.detailParams = params;
    emit();
  };
  const skipAfter = (id: TestStepId) => {
    let after = false;
    for (const s of steps) {
      if (after) s.status = "skipped";
      if (s.id === id) after = true;
    }
    emit();
  };

  let health: ProxyHealth | undefined;

  set("http", "running");
  try {
    health = await fetchHealth(timeoutSignal(4000));
    if (health.protocol > SUPPORTED_PROTOCOL) {
      set(
        "http",
        "fail",
        `Proxy speaks protocol ${health.protocol}; this app supports up to ${SUPPORTED_PROTOCOL}. Update Desk-tools.`,
        "protocolTooNew",
        { protocol: health.protocol, supported: SUPPORTED_PROTOCOL }
      );
      skipAfter("http");
      return { steps, health };
    }
    set("http", "ok", `v${health.version}, protocol ${health.protocol}`, "versionInfo", {
      version: health.version,
      protocol: health.protocol,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    const unreachable = err instanceof TypeError; // fetch() network failure
    if (unreachable) {
      set("http", "fail", `Nothing answered on 127.0.0.1:${PROXY_PORT}. Is the proxy running?`, "unreachable", { port: PROXY_PORT });
    } else {
      set("http", "fail", msg, err instanceof TestError ? err.key : undefined);
    }
    skipAfter("http");
    return { steps, health };
  }

  set("websocket", "running");
  let ws: WebSocket;
  try {
    ws = await openSocket(4000);
    set("websocket", "ok");
  } catch (err) {
    set("websocket", "fail", err instanceof Error ? err.message : String(err), err instanceof TestError ? err.key : undefined);
    skipAfter("websocket");
    return { steps, health };
  }

  set("roundtrip", "running");
  try {
    await roundTrip(ws, 4000);
    set("roundtrip", "ok");
  } catch (err) {
    set("roundtrip", "fail", err instanceof Error ? err.message : String(err), err instanceof TestError ? err.key : undefined);
  } finally {
    try {
      ws.send(JSON.stringify({ type: "close" }));
      ws.close();
    } catch {
      /* already closed */
    }
  }
  return { steps, health };
}

export const testPassed = (steps: TestStep[]) => steps.every((s) => s.status === "ok");

// ---- Wire types -----------------------------------------------------------

export interface ConnectParams {
  service: ServiceId;
  host: string;
  port: number;
  username?: string;
  password?: string;
  privateKey?: string;
  passphrase?: string;
  database?: string;
  catalog?: string;
  schema?: string;
  tls?: boolean;
  auth?: "none" | "ldap";
  cols?: number;
  rows?: number;
}

export interface QueryColumn {
  name: string;
  type: string;
}

export type CellValue =
  | string
  | number
  | boolean
  | null
  | { $base64: string }
  | CellValue[]
  | { [k: string]: CellValue };

export interface QueryResult {
  id: string;
  columns: QueryColumn[];
  rows: CellValue[][];
  rowCount: number;
  truncated: boolean;
  elapsedMs: number;
}

/** Renders a result cell for display. */
export function formatCell(v: CellValue): string {
  if (v === null) return "NULL";
  if (typeof v === "object") {
    if (!Array.isArray(v) && "$base64" in v && Object.keys(v).length === 1) {
      return `<binary ${Math.floor(((v.$base64 as string).length * 3) / 4)} bytes>`;
    }
    return JSON.stringify(v);
  }
  return String(v);
}

const csvField = (s: string) => (/[",\r\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s);

export function resultToCsv(result: Pick<QueryResult, "columns" | "rows">): string {
  const lines = [result.columns.map((c) => csvField(c.name)).join(",")];
  for (const row of result.rows) {
    lines.push(row.map((c) => csvField(c === null ? "" : formatCell(c))).join(","));
  }
  return lines.join("\n");
}
