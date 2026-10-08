import { createFakePluginHost, makeHostResponse, makeThreadResponse } from "@get-bb/plugin-sdk/testing";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { Item } from "./model.js";
import { CalendarError, type ServiceDeps } from "./service-api.js";
import plugin from "./server.js";

// The sync engine is stubbed; these tests cover the server wiring, CLI, and host-file routing.
const state = vi.hoisted(() => ({ service: null as unknown, deps: null as unknown }));
vi.mock("./engine.js", () => ({
  createCalendarService: (deps: unknown) => { state.deps = deps; return state.service; },
}));

const item = (overrides: Partial<Item> = {}): Item => ({
  id: "cc_abc123", title: "Ambient tweet", format: "tweet", status: "ready", date: "2026-10-28", time: null, days: 1, tray: null,
  target: null, notes: "", waitsOn: [], attachments: [], sync: "synced", conflict: null, pos: 1, notice: null, updatedAt: "2026-10-03T00:00:00.000Z",
  ...overrides,
});
const status = { state: "synced", calendarId: "cal", lastSyncedAt: null, queued: 0, conflicts: 0, message: null };

function makeService() {
  const write = () => vi.fn(async (_input: unknown) => item());
  const strict = { add: write(), update: write(), move: write(), gateAdd: write(), gateClear: write(), gateRemove: write(), attach: write(), detach: write(), reapply: write() };
  return {
    ...strict, strict,
    status: vi.fn(async () => status), sync: vi.fn(async () => status), disconnect: vi.fn(async () => status), restoreCalendar: vi.fn(async () => status),
    connectStart: vi.fn(async (_input: unknown) => ({ authUrl: "https://accounts.google.com/o/oauth2/v2/auth?x=1" })),
    connectFinish: vi.fn(async (_input: unknown) => status),
    list: vi.fn(async (_input: unknown) => ({ items: [item(), item({ id: "cc_tray01", date: null, tray: "later", format: null, status: "idea" })], nextCursor: null })),
    show: vi.fn(async () => item()), get: vi.fn(async (_id: string) => item()),
    calendar: vi.fn(), delete: vi.fn(async () => ({ deleted: true })), export: vi.fn(async () => ({ exportedAt: "2026-10-07T00:00:00.000Z", items: [item()] })),
    visible: vi.fn(async () => ({ ok: true })), tick: vi.fn(async () => undefined), nextTickDelay: vi.fn(() => 600_000), dispose: vi.fn(),
  };
}
let service: ReturnType<typeof makeService>;
const signal = new AbortController().signal;
const disposers: Array<() => Promise<void>> = [];
beforeEach(() => { service = makeService(); state.service = service; });
afterEach(async () => { for (const dispose of disposers.splice(0)) await dispose(); });

function setup(options: { settings?: Record<string, string>; openInMoss?: boolean } = {}) {
  const { bb, harness } = createFakePluginHost({
    pluginId: "content-calendar",
    settings: options.settings ?? {},
    sdk: {
      threads: { get: async ({ threadId }) => makeThreadResponse({ id: threadId, environmentId: "env-mac", projectId: "proj_1", title: "Launch" }) },
      environments: { get: async () => ({ hostId: "mac", path: "/Users/me/project" }) },
      hosts: { list: async () => [makeHostResponse({ id: "mac", name: "My Mac", status: "connected" }), makeHostResponse({ id: "linux", name: "Worker", status: "disconnected" })] },
    },
    experimental_callHostRpc: async ({ method, input }) => {
      if (method === "resolveFile") return { path: "/Users/me/Moss/Notes/Draft.md", name: "Draft.md" };
      if (method === "openInMoss") return options.openInMoss === false ? { opened: false, reason: "Only notes under ~/Moss open in Moss." } : { opened: true };
      if (method === "inspect") return { files: (input as { paths: string[] }).paths.map((path) => ({ path, status: path.includes("gone") ? "missing" : "available" })) };
      return { root: "/Users/me/Moss/Notes", files: [] };
    },
  });
  plugin(bb);
  disposers.push(() => harness.lifecycle.dispose());
  return harness;
}
const cli = (h: ReturnType<typeof setup>, argv: string[], threadId?: string) => h.behavior.runCli(argv, { signal, ...(threadId ? { threadId, cwd: "/Users/me/project" } : {}) });

describe("content-calendar CLI", () => {
  it("lists a week as one line per item and pages through the service", async () => {
    const h = setup();
    const result = await cli(h, ["list", "--week", "2026-10-07"]);
    expect(result.exitCode).toBe(0);
    expect(service.list).toHaveBeenCalledWith({ from: "2026-10-05", to: "2026-10-11" });
    expect(result.stdout).toBe("cc_abc123  2026-10-28  ☐ Ambient tweet  (Tweet · Ready)\ncc_tray01  Later  ☐ Ambient tweet  (No format · Idea)");
    await cli(h, ["list", "--month", "2026-02", "--format", "blog", "--limit", "10"]);
    expect(service.list).toHaveBeenLastCalledWith({ from: "2026-02-01", to: "2026-02-28", format: "blog", limit: 10 });
    expect(JSON.parse((await cli(h, ["list", "--json"])).stdout ?? "")).toMatchObject({ items: [{ id: "cc_abc123" }, { id: "cc_tray01" }], nextCursor: null });
  });

  it("adds, moves, gates, and checks items through the strict writes", async () => {
    const h = setup();
    expect((await cli(h, ["add", "Ambient tweet", "--format", "none", "--tray", "evergreen", "--json"])).exitCode).toBe(0);
    expect(service.strict.add).toHaveBeenCalledWith({ title: "Ambient tweet", format: null, when: { tray: "evergreen" } });
    expect((await cli(h, ["add", "No date", "--format", "tweet"])).exitCode).not.toBe(0);
    await cli(h, ["move", "cc_abc123", "--date", "2026-10-30", "--after", "cc_other1"]);
    expect(service.strict.move).toHaveBeenCalledWith({ id: "cc_abc123", when: { date: "2026-10-30" }, after: "cc_other1" });
    await cli(h, ["gate", "add", "cc_abc123", "--pr", "get-bb/bb#4772"]);
    expect(service.strict.gateAdd).toHaveBeenCalledWith({ id: "cc_abc123", gate: { kind: "pr", repo: "get-bb/bb", number: 4772 } });
    await cli(h, ["gate", "clear", "cc_abc123", "g1", "--reopen"]);
    expect(service.strict.gateClear).toHaveBeenCalledWith({ id: "cc_abc123", gateId: "g1", cleared: false });
    await cli(h, ["update", "cc_abc123", "--status", "posted", "--format", "essay"]);
    expect(service.strict.update).toHaveBeenCalledWith({ id: "cc_abc123", format: "essay", status: "posted" });
    const invalid = await cli(h, ["move", "cc_abc123", "--date", "2026-02-30", "--json"]);
    expect(invalid.exitCode).not.toBe(0);
    expect(JSON.parse(invalid.stdout ?? "")).toMatchObject({ ok: false, error: { code: "invalid" } });
  });

  it("exits non-zero with code conflict when Google kept a same-field change", async () => {
    const h = setup();
    service.strict.move.mockRejectedValueOnce(new CalendarError("conflict", "Changed in Google Calendar; your date change wasn't applied.", "Run `bb content-calendar reapply cc_abc123` to write yours.", ["date"]));
    const result = await cli(h, ["move", "cc_abc123", "--date", "2026-10-30", "--json"]);
    expect(result.exitCode).not.toBe(0);
    const { ok, error } = JSON.parse(result.stdout ?? "");
    expect(ok).toBe(false);
    expect(error).toMatchObject({ code: "conflict", message: "Changed in Google Calendar; your date change wasn't applied." });
    expect(error.hint).toContain("date");
    expect(error.hint).toContain("reapply");
  });

  it("reports not_connected in bb's error envelope", async () => {
    const h = setup();
    service.list.mockRejectedValueOnce(new CalendarError("not_connected", "Google Calendar isn't connected.", "Run `bb content-calendar connect`."));
    const result = await cli(h, ["list", "--json"]);
    expect(result.exitCode).not.toBe(0);
    expect(JSON.parse(result.stdout ?? "")).toMatchObject({ ok: false, error: { code: "not_connected", message: "Google Calendar isn't connected.", hint: "Run `bb content-calendar connect`." } });
  });

  it("prints the inline directive with the week normalized to Monday", async () => {
    const h = setup();
    const week = await cli(h, ["view", "--week", "2026-10-07"]);
    expect(week.stdout?.split("\n")[0]).toBe('::content-calendar{view="week" start="2026-10-05"}');
    expect(week.stdout).toContain("once, on its own line");
    expect(JSON.parse((await cli(h, ["view", "--month", "2026-10", "--json"])).stdout ?? "")).toEqual({ view: "month", start: "2026-10", directive: '::content-calendar{view="month" start="2026-10"}' });
    expect((await cli(h, ["view"])).exitCode).not.toBe(0);
  });

  it("resolves --file on the invoking thread's machine, never the server", async () => {
    const h = setup();
    const result = await cli(h, ["attach", "cc_abc123", "--file", "notes/Draft.md", "--json"], "thr_invoking");
    expect(result.exitCode).toBe(0);
    expect(h.inspection.experimental_hostRpcCalls.at(-1)).toMatchObject({ method: "resolveFile", hostId: "mac", input: { path: "notes/Draft.md", cwd: "/Users/me/project" } });
    expect(service.strict.attach).toHaveBeenCalledWith({ id: "cc_abc123", attachment: { kind: "file", machineId: "mac", path: "/Users/me/Moss/Notes/Draft.md", name: "Draft.md" } });
    const offline = await cli(h, ["attach", "cc_abc123", "--file", "/x.md", "--machine", "linux", "--json"], "thr_invoking");
    expect(JSON.parse(offline.stdout ?? "")).toMatchObject({ ok: false, error: { code: "offline" } });
  });

  it("collects a missing OAuth client through the masked form without printing it", async () => {
    const h = setup();
    const noThread = await cli(h, ["connect", "--json"]);
    expect(JSON.parse(noThread.stdout ?? "")).toMatchObject({ ok: false, error: { code: "needs_client" } });
    const running = cli(h, ["connect"], "thr_invoking");
    await vi.waitFor(() => expect(h.inspection.pendingInteractions).toHaveLength(1));
    const form = h.inspection.pendingInteractions[0]!;
    expect(form).toMatchObject({ threadId: "thr_invoking", rendererId: "connect-client" });
    h.behavior.submitInteraction(form.id, { clientId: "client-123", clientSecret: "shh-secret" });
    const result = await running;
    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain("https://accounts.google.com/");
    expect(result.stdout).toContain("connect --paste");
    expect(result.stdout).not.toContain("shh-secret");
    expect(await (state.deps as ServiceDeps).credentials.get()).toMatchObject({ clientId: "client-123", clientSecret: "shh-secret" });
    await cli(h, ["connect", "--paste", "http://127.0.0.1/?code=abc"]);
    expect(service.connectFinish).toHaveBeenCalledWith({ redirectUrl: "http://127.0.0.1/?code=abc" });
  });

  it("tells every thread how to show the inline calendar", () => {
    const h = setup();
    const text = h.registrations.instructionProvider?.({ threadId: "t", projectId: "p" }) ?? "";
    expect(text).toContain("bb content-calendar view --week");
    expect(text.length).toBeLessThanOrEqual(600);
  });
});

describe("attachments", () => {
  const attachments: Item["attachments"] = [
    { id: "a1", kind: "file", machineId: "mac", path: "/Users/me/Moss/Notes/Draft.md", name: "Draft.md" },
    { id: "a2", kind: "file", machineId: "mac", path: "/Users/me/Desktop/shot.png", name: "shot.png" },
    { id: "a3", kind: "pr", repo: "get-bb/bb", number: 4772 },
    { id: "a4", kind: "file", machineId: "linux", path: "/home/me/gone.md", name: "gone.md" },
  ];

  it("opens Moss notes on the Mac and sends every other file to the preview", async () => {
    const h = setup();
    service.get.mockResolvedValue(item({ attachments }));
    expect(await h.behavior.callRpc("openAttachment", { id: "cc_abc123", attachmentId: "a1" })).toEqual({ opened: "moss" });
    expect(h.inspection.experimental_hostRpcCalls.at(-1)).toMatchObject({ method: "openInMoss", hostId: "mac" });
    const calls = h.inspection.experimental_hostRpcCalls.length;
    expect(await h.behavior.callRpc("openAttachment", { id: "cc_abc123", attachmentId: "a2" })).toEqual({ opened: "preview", hostId: "mac", path: "/Users/me/Desktop/shot.png" });
    expect(h.inspection.experimental_hostRpcCalls).toHaveLength(calls);
    expect(await h.behavior.callRpc("openAttachment", { id: "cc_abc123", attachmentId: "a3" })).toEqual({ opened: "url", url: "https://github.com/get-bb/bb/pull/4772" });
  });

  it("falls back to the preview when the Mac refuses to open a note", async () => {
    const h = setup({ openInMoss: false });
    service.get.mockResolvedValue(item({ attachments }));
    expect(await h.behavior.callRpc("openAttachment", { id: "cc_abc123", attachmentId: "a1" })).toEqual({ opened: "preview", hostId: "mac", path: "/Users/me/Moss/Notes/Draft.md" });
  });

  it("reports available, missing, and offline files", async () => {
    const h = setup();
    service.get.mockResolvedValue(item({ attachments: [...attachments, { id: "a5", kind: "file", machineId: "mac", path: "/Users/me/gone.md", name: "gone.md" }] }));
    expect(await h.behavior.callRpc("inspectFiles", { id: "cc_abc123" })).toEqual({ files: [
      { attachmentId: "a1", status: "available" },
      { attachmentId: "a2", status: "available" },
      { attachmentId: "a4", status: "offline" },
      { attachmentId: "a5", status: "missing" },
    ] });
  });
});
