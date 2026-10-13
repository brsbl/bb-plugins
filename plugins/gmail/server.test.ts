import { createFakePluginHost, experimental_scanPublicSdkOnly } from "@get-bb/plugin-sdk/testing";
import { describe, expect, it, afterEach, vi } from "vitest";
import { randomUUID } from "node:crypto";
import { fileURLToPath } from "node:url";
import plugin from "./server.js";
import { SCOPES, REDIRECT } from "./google.js";
import { draftInput, mime, messageView } from "./model.js";

const fixtures = { clientId: "fake-client", clientSecret: "fake-secret", refreshToken: "fake-refresh" };
const hosts: ReturnType<typeof createFakePluginHost>[] = [];
afterEach(async () => { vi.unstubAllGlobals(); for (const host of hosts.splice(0)) await host.harness.lifecycle.dispose(); });
function setup() {
  const attempt = randomUUID();
  const card = { id: "reply", threadId: "thread-fixture", revision: 2, state: "pending", content: { type: "reply", to: ["recipient@example.test"], cc: [], bcc: ["archive@example.test"], subject: "Meeting", draft: "The edited approved text.", context: "A meeting reply. Send delivers this text; Save keeps a draft. Recommend Send after reviewing. Next: execute only the chosen action." }, attempt: { id: attempt, action: "send", claimed: true, note: "" } };
  const writes: { path: string; body: unknown }[] = [];
  const fake = vi.fn(async (input: string | URL | Request, init?: RequestInit): Promise<Response> => {
    const url = String(input);
    if (url.endsWith("/token")) return Response.json({ access_token: "fake-access", refresh_token: "new-fake-refresh", scope: SCOPES.join(" ") });
    if (url.endsWith("/profile")) return Response.json({ emailAddress: "owner@example.test" });
    if (init?.method !== "GET") { writes.push({ path: url, body: JSON.parse(String(init?.body)) }); return Response.json(url.endsWith("/send") ? { id: "sent1", threadId: "gmail-thread" } : { id: "draft1", message: { id: "draft-message", threadId: "gmail-thread" } }); }
    if (url.includes("/messages?")) return Response.json({ messages: [{ id: "sent1", threadId: "gmail-thread" }] });
    return Response.json({ id: "sent1", threadId: "gmail-thread", labelIds: ["UNREAD", "SENT"], payload: { mimeType: "text/plain", headers: [{ name: "Subject", value: "Meeting" }, { name: "Message-ID", value: "<original@example.test>" }], body: { data: Buffer.from("Untrusted fixture body").toString("base64url") } } });
  });
  vi.stubGlobal("fetch", fake);
  const host = createFakePluginHost({ pluginId: "gmail", settings: fixtures, sdk: { plugins: { callRpc: async () => structuredClone(card) } } }); hosts.push(host); plugin(host.bb);
  const send = (extra: string[] = []) => host.harness.behavior.runCli(["send", "--card", "reply", "--attempt", attempt, ...extra], { threadId: card.threadId });
  return { ...host, card, writes, fake, send, attempt };
}
describe("Gmail approval and transport", () => {
  it("uses only public SDK imports", async () => {
    const result = await experimental_scanPublicSdkOnly(fileURLToPath(new URL(".", import.meta.url)));
    expect(result.violations).toEqual([]); expect(result.privateDependencies).toEqual([]);
  });
  it("sends the latest claimed content once, including Bcc; a reload cannot repeat it", async () => {
    const h = setup();
    const results = await Promise.all([h.send(), h.send()]);
    expect(results.every((r) => r.exitCode === 0)).toBe(true);
    expect(h.writes).toHaveLength(1);
    const raw = Buffer.from((h.writes[0]!.body as { raw: string }).raw, "base64url").toString();
    expect(raw).toContain("Bcc: archive@example.test");
    expect(raw).toContain(Buffer.from(h.card.content.draft).toString("base64"));
    await h.harness.lifecycle.reload(plugin);
    expect((await h.send()).exitCode).toBe(0); expect(h.writes).toHaveLength(1);
  });
  it.each(["unclaimed", "wrong-attempt", "not-reply", "save-action", "ready", "missing-context"])("rejects %s before any Gmail write", async (mode) => {
    const h = setup();
    if (mode === "unclaimed") h.card.attempt.claimed = false;
    if (mode === "wrong-attempt") h.card.attempt.id = randomUUID();
    if (mode === "not-reply") h.card.content.type = "decide";
    if (mode === "save-action") h.card.attempt.action = "save-draft";
    if (mode === "ready") h.card.state = "ready";
    if (mode === "missing-context") h.card.content.context = "";
    expect((await h.send()).exitCode).not.toBe(0); expect(h.writes).toHaveLength(0);
  });
  it("requires the caller to read and follow a note", async () => {
    const h = setup(); h.card.attempt.note = "Use the already edited draft.";
    expect((await h.send()).exitCode).not.toBe(0); expect(h.writes).toHaveLength(0);
    expect((await h.send(["--note-reviewed"])).exitCode).toBe(0);
  });
  it("never retries an ambiguous send and permits read-only reconciliation", async () => {
    const h = setup(); const base = h.fake.getMockImplementation()!;
    h.fake.mockImplementation(async (url, init) => { if (String(url).endsWith("/send")) { h.writes.push({ path: String(url), body: init?.body }); throw new Error("connection lost"); } return base(url, init); });
    const result = JSON.parse((await h.send()).stdout!);
    expect(result).toMatchObject({ state: "failed", retryable: false });
    await h.send(); expect(h.writes).toHaveLength(1);
    const found = await h.harness.behavior.runCli(["receipt", h.attempt, "--reconcile"]);
    expect(JSON.parse(found.stdout!)).toMatchObject({ state: "succeeded", gmailId: "sent1" }); expect(h.writes).toHaveLength(1);
  });
  it("saves a claimed card and updates its existing Gmail draft on a new approved attempt", async () => {
    const h = setup(); h.card.attempt.action = "save-draft";
    const draft = () => h.harness.behavior.runCli(["draft", "--card", "reply", "--attempt", h.card.attempt.id], { threadId: h.card.threadId });
    expect((await draft()).exitCode).toBe(0);
    h.card.attempt.id = randomUUID(); h.card.content.draft = "An approved revision";
    expect((await draft()).exitCode).toBe(0);
    expect(h.writes.map((w) => new URL(w.path).pathname)).toEqual(["/gmail/v1/users/me/drafts", "/gmail/v1/users/me/drafts/draft1"]);
  });
  it("reads without modifying labels and rejects header injection in drafts", async () => {
    const h = setup();
    const read = await h.harness.behavior.runCli(["message", "message1", "--json"]);
    expect(JSON.parse(read.stdout!)).toMatchObject({ labelIds: ["UNREAD", "SENT"], text: "Untrusted fixture body", untrusted: true });
    expect(h.writes).toHaveLength(0);
    expect(draftInput.safeParse({ to: ["ok@example.test\r\nBcc: other@example.test"], subject: "Meeting", body: "Hi" }).success).toBe(false);
  });
  it("requires exact OAuth state and a one-use, unexpired redirect", async () => {
    const h = setup();
    const start = await h.harness.behavior.callRpc("connectStart", {}) as { authUrl: string };
    const auth = new URL(start.authUrl);
    expect(auth.searchParams.get("scope")).toBe(SCOPES.join(" "));
    const finish = new URL(REDIRECT); finish.searchParams.set("code", "fake-code");
    await expect(h.harness.behavior.callRpc("connectFinish", { redirectUrl: finish.href })).rejects.toThrow();
    finish.searchParams.set("state", auth.searchParams.get("state")!);
    expect(await h.harness.behavior.callRpc("connectFinish", { redirectUrl: finish.href })).toMatchObject({ state: "connected" });
    await expect(h.harness.behavior.callRpc("connectFinish", { redirectUrl: finish.href })).rejects.toThrow();
    expect(h.harness.inspection.logEntries).toEqual([]);
  });
  it("redacts Google errors, refresh tokens, and authorization headers", async () => {
    const h = setup(); h.fake.mockResolvedValue(new Response(JSON.stringify({ error_description: "fake-secret fake-refresh fake-access" }), { status: 400 }));
    const response = await h.harness.behavior.runCli(["message", "message1", "--json"]);
    expect(response.exitCode).not.toBe(0); expect(JSON.stringify(response)).not.toContain("fake-secret"); expect(JSON.stringify(response)).not.toContain("fake-refresh");
  });
  it("threads replies and bounds long bodies", () => {
    const input = draftInput.parse({ to: ["Example Person <recipient@example.test>"], subject: "Re: Meeting", body: "Hi 👋" });
    const parent = { id: "original", threadId: "gmail-thread", payload: { headers: [{ name: "Subject", value: "Meeting" }, { name: "Message-ID", value: "<original@example.test>" }] } };
    const result = mime(input, "outgoing@bb-gmail.invalid", parent);
    expect(result.threadId).toBe("gmail-thread"); expect(Buffer.from(result.raw, "base64url").toString()).toContain("In-Reply-To: <original@example.test>");
    expect(messageView({ ...parent, payload: { mimeType: "text/plain", body: { data: Buffer.from("x".repeat(70_000)).toString("base64url") } } })).toMatchObject({ truncated: true, text: "x".repeat(32_000) });
  });
});
