import {
  SERVICES,
  INSTALL_STEPS,
  fetchHealth,
  formatCell,
  getService,
  resultToCsv,
  runConnectionTest,
  testPassed,
  type TestStep,
} from "@/lib/local-proxy";

describe("services", () => {
  it("lists the six supported services with unique ids and ports", () => {
    expect(SERVICES.map((s) => s.id)).toEqual(["ssh", "telnet", "mysql", "postgres", "hive", "trino"]);
    expect(new Set(SERVICES.map((s) => s.defaultPort)).size).toBe(SERVICES.length);
  });

  it("marks only ssh and telnet as terminals", () => {
    expect(SERVICES.filter((s) => s.kind === "terminal").map((s) => s.id)).toEqual(["ssh", "telnet"]);
    expect(getService("nope")).toBeUndefined();
  });
});

describe("install steps", () => {
  it("clone, install and start from the GitHub repo", () => {
    expect(INSTALL_STEPS.map((s) => s.command)).toEqual([
      "git clone https://github.com/zafrem/Desk-tools-local-proxy.git",
      "cd Desk-tools-local-proxy && npm install",
      "npm start",
    ]);
  });
});

describe("result formatting", () => {
  it("formats cells", () => {
    expect(formatCell(null)).toBe("NULL");
    expect(formatCell(5)).toBe("5");
    expect(formatCell({ $base64: "aGk=" })).toBe("<binary 3 bytes>");
    expect(formatCell([1, 2])).toBe("[1,2]");
  });

  it("exports CSV with quoting", () => {
    const csv = resultToCsv({
      columns: [
        { name: "id", type: "int" },
        { name: "note, x", type: "text" },
      ],
      rows: [
        [1, 'say "hi"'],
        [2, null],
      ],
    });
    expect(csv).toBe('id,"note, x"\n1,"say ""hi"""\n2,');
  });
});

describe("connection test", () => {
  const originalFetch = global.fetch;
  const originalWs = (global as { WebSocket?: unknown }).WebSocket;

  afterEach(() => {
    global.fetch = originalFetch;
    (global as { WebSocket?: unknown }).WebSocket = originalWs;
  });

  const mockFetch = (body: unknown, ok = true) => {
    global.fetch = jest.fn().mockResolvedValue({ ok, status: ok ? 200 : 500, json: async () => body }) as never;
  };

  class FakeWebSocket {
    static instances: FakeWebSocket[] = [];
    static behaviour: "ok" | "refuse" | "silent" = "ok";
    onopen: (() => void) | null = null;
    onerror: (() => void) | null = null;
    onmessage: ((e: { data: string }) => void) | null = null;
    onclose: (() => void) | null = null;
    sent: string[] = [];
    constructor() {
      FakeWebSocket.instances.push(this);
      setTimeout(() => {
        if (FakeWebSocket.behaviour === "refuse") this.onerror?.();
        else this.onopen?.();
      }, 0);
    }
    send(data: string) {
      this.sent.push(data);
      if (FakeWebSocket.behaviour === "ok" && JSON.parse(data).type === "ping-test") {
        setTimeout(() => this.onmessage?.({ data: JSON.stringify({ type: "error", code: "bad_message" }) }), 0);
      }
    }
    close() {}
  }

  beforeEach(() => {
    FakeWebSocket.instances = [];
    FakeWebSocket.behaviour = "ok";
    (global as { WebSocket?: unknown }).WebSocket = FakeWebSocket;
  });

  const health = { service: "desk-tools-local-proxy", version: "0.2.0", protocol: 2, services: ["ssh"], ok: true };

  it("fetchHealth treats a v1 proxy as protocol 1 / ssh only", async () => {
    mockFetch({ service: "desk-tools-local-proxy", version: "0.1.0", ok: true });
    await expect(fetchHealth()).resolves.toMatchObject({ protocol: 1, services: ["ssh"] });
  });

  it("fetchHealth rejects something that is not the proxy", async () => {
    mockFetch({ service: "something-else" });
    await expect(fetchHealth()).rejects.toThrow(/not desk-tools-local-proxy/);
  });

  it("passes when HTTP, WebSocket and the round trip all work", async () => {
    mockFetch(health);
    const updates: TestStep[][] = [];
    const { steps } = await runConnectionTest((s) => updates.push(s));
    expect(testPassed(steps)).toBe(true);
    expect(steps.map((s) => s.status)).toEqual(["ok", "ok", "ok"]);
    expect(updates.length).toBeGreaterThan(3);
    // the test closes the session politely
    expect(FakeWebSocket.instances[0].sent.map((m) => JSON.parse(m).type)).toEqual(["ping-test", "close"]);
  });

  it("fails fast and skips the rest when the proxy is not running", async () => {
    global.fetch = jest.fn().mockRejectedValue(new TypeError("Failed to fetch")) as never;
    const { steps } = await runConnectionTest();
    expect(steps.map((s) => s.status)).toEqual(["fail", "skipped", "skipped"]);
    expect(steps[0].detail).toMatch(/Is the proxy running/);
    expect(FakeWebSocket.instances).toHaveLength(0);
  });

  it("fails when the proxy speaks a newer protocol", async () => {
    mockFetch({ ...health, protocol: 99 });
    const { steps } = await runConnectionTest();
    expect(steps[0].status).toBe("fail");
    expect(steps[0].detail).toMatch(/protocol 99/);
    expect(steps[1].status).toBe("skipped");
  });

  it("reports a refused WebSocket (origin not allowed)", async () => {
    mockFetch(health);
    FakeWebSocket.behaviour = "refuse";
    const { steps } = await runConnectionTest();
    expect(steps.map((s) => s.status)).toEqual(["ok", "fail", "skipped"]);
    expect(steps[1].detail).toMatch(/origin/);
  });
});
