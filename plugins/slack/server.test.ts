import { randomUUID } from "node:crypto";
import { createFakePluginHost } from "@get-bb/plugin-sdk/testing";
import { afterEach, expect, it, vi } from "vitest";
import plugin from "./server.js";
import { createFakeSlack } from "./fake-slack.js";
import { SlackClient } from "./slack.js";

const hosts: ReturnType<typeof createFakePluginHost>[] = [];
afterEach(async () => { vi.unstubAllGlobals(); vi.unstubAllEnvs(); for (const host of hosts.splice(0)) await host.harness.lifecycle.dispose(); });
function setup() {
  const slack = createFakeSlack(); vi.stubGlobal("fetch", slack.fetch);
  let item: any; let reportFails = false;
  const host = createFakePluginHost({ pluginId: "slack", settings: { userToken: "xoxp-fake-slack" }, sdk: { plugins: { callRpc: async ({ method, input }: any) => {
    if (method === "create") { item = { ...input, state: "ready", attempt: null }; }
    if (!item || input.id !== item.id || input.threadId !== item.threadId) throw new Error("missing");
    if (method === "claim") {
      if (item.state !== "pending" || item.attempt.id !== input.attemptId || item.attempt.claimed) throw new Error("stale");
      item.attempt.claimed = true;
    }
    if (method === "report") { if (reportFails) throw new Error("report failed"); item.state = input.outcome; item.result = input; }
    return structuredClone(item);
  } } } });
  hosts.push(host); plugin(host.bb);
  let current = host;
  const run = (...args: string[]) => current.harness.behavior.runCli(args, { threadId: "thr_demo", signal: new AbortController().signal });
  const draft = async () => { const result = await run("draft", "CDEMO01", "--thread", "1791840000.000001", "--text", "Thanks, I will share the agenda.", "--why", "A partner asked about Friday.", "--recommendation", "Send so they can plan.", "--json"); expect(result.exitCode).toBe(0); return JSON.parse(result.stdout!).id as string; };
  const click = (note?: string, action = "send") => { item.state = "pending"; item.attempt = { id: randomUUID(), action, claimed: false, note }; return item.attempt.id as string; };
  return { host, slack, run, draft, click, item: () => item, reportFailure: (value: boolean) => { reportFails = value; }, reload: async () => { const next = await current.harness.lifecycle.reload(plugin); hosts[hosts.indexOf(current)] = next; current = next; } };
}
it("pages reads and preserves external identities and exact timestamps without posting", async () => {
  const s = setup();
  const channels = JSON.parse((await s.run("channels", "--json")).stdout!); expect(channels.channels[0].is_ext_shared).toBe(true); expect(channels.nextCursor).toBe("page-two");
  expect(JSON.parse((await s.run("channels", "--cursor", "page-two", "--json")).stdout!).channels).toEqual([]);
  expect(JSON.parse((await s.run("thread", "CDEMO01", "1791840000.000001", "--json")).stdout!).messages[1].user).toBe("UDEMO03");
  await s.run("history", "CDEMO01", "--oldest", "1791840000.000001", "--json");
  await s.run("search", "in:partner-demo Friday", "--page", "2", "--json");
  expect(s.slack.requests.at(-1)?.params).toMatchObject({ query: "in:partner-demo Friday", page: "2", count: "15" });
  expect(s.slack.posts).toHaveLength(0);
});
it("cannot send before approval, uses the user-edited draft, posts once and records the result", async () => {
  const s = setup(); const id = await s.draft();
  expect((await s.run("send", id, "--attempt", randomUUID(), "--json")).exitCode).not.toBe(0);
  expect(s.item().content.context).toContain("Slack Connect"); expect(s.slack.posts).toHaveLength(0);
  s.item().content.draft = "User-edited agenda: <hello> & goodbye";
  const attempt = s.click();
  expect((await s.run("send", id, "--attempt", attempt, "--json")).exitCode).toBe(0);
  expect(s.item().result.outcome).toBe("succeeded");
  expect(s.slack.posts[0]).toMatchObject({ text: "User-edited agenda: <hello> & goodbye", channel: "CDEMO01", thread_ts: "1791840000.000001", mrkdwn: false, unfurl_links: false, link_names: false });
  await s.reload(); await s.run("send", id, "--attempt", attempt, "--json"); expect(s.slack.posts).toHaveLength(1);
});
it.each(["Please wait", "Send but change the time"])('holds a Send note: %s', async note => {
  const s = setup(); const id = await s.draft(); await s.run("send", id, "--attempt", s.click(note), "--json");
  expect(s.slack.posts).toHaveLength(0); expect(s.item().result).toMatchObject({ outcome: "failed", retryable: true });
});
it.each(["later", "skip"])('keeps %s in bb with a successful card result', async action => {
  const s = setup(); const id = await s.draft(); await s.run("send", id, "--attempt", s.click(undefined, action), "--json");
  expect(s.slack.posts).toHaveLength(0); expect(s.item().result.outcome).toBe("succeeded");
});
it("holds a changed identity and changed destination", async () => {
  const s = setup(); const id = await s.draft(); s.slack.identity.user_id = "UOTHER1";
  await s.run("send", id, "--attempt", s.click(), "--json"); expect(s.slack.posts).toHaveLength(0);
  s.slack.identity.user_id = "UDEMO01"; s.item().content.to = ["#different"];
  await s.run("send", id, "--attempt", s.click(), "--json"); expect(s.slack.posts).toHaveLength(0);
});
it("does not resend after an uncertain outcome, even after reload or a new attempt", async () => {
  const s = setup(); const id = await s.draft(); const attempt = s.click(); s.slack.fail("timeout");
  await s.run("send", id, "--attempt", attempt, "--json"); expect(s.item().result).toMatchObject({ outcome: "failed", retryable: false });
  await s.reload(); s.slack.fail(null); await s.run("send", id, "--attempt", attempt, "--json");
  await s.run("send", id, "--attempt", s.click(), "--json"); expect(s.slack.posts).toHaveLength(1);
});
it("recovers a failed card report without reposting", async () => {
  const s = setup(); const id = await s.draft(); const attempt = s.click(); s.reportFailure(true);
  expect((await s.run("send", id, "--attempt", attempt, "--json")).exitCode).not.toBe(0);
  s.reportFailure(false); await s.run("send", id, "--attempt", attempt, "--json");
  expect(s.slack.posts).toHaveLength(1); expect(s.item().result.outcome).toBe("succeeded");
});
it("allows a new click after an explicit rejection but never retries the same attempt", async () => {
  const s = setup(); const id = await s.draft(); const attempt = s.click(); s.slack.fail("reject");
  await s.run("send", id, "--attempt", attempt, "--json"); expect(s.item().result.retryable).toBe(true);
  s.slack.fail(null); await s.run("send", id, "--attempt", attempt, "--json"); expect(s.slack.posts).toHaveLength(0);
  await s.run("send", id, "--attempt", s.click(), "--json"); expect(s.slack.posts).toHaveLength(1);
});
it("reserves one send when calls race", async () => {
  const s = setup(); const id = await s.draft(); const attempt = s.click();
  await Promise.all([s.run("send", id, "--attempt", attempt, "--json"), s.run("send", id, "--attempt", attempt, "--json")]);
  expect(s.slack.posts).toHaveLength(1);
});
it("redacts transport errors and refuses real tokens on a mock endpoint", async () => {
  const secret = "xoxp-private-sentinel";
  const fetcher = vi.fn(async () => { throw new Error(secret); });
  await expect(new SlackClient(secret, fetcher).identity()).rejects.not.toThrow(secret);
  const mockFetch = vi.fn(); await expect(new SlackClient(secret, mockFetch, "http://127.0.0.1:47821").identity()).rejects.toThrow("fake"); expect(mockFetch).not.toHaveBeenCalled();
  const rate = new SlackClient("xoxp-fake-slack", async () => new Response("", { status: 429, headers: { "retry-after": "17" } }));
  await expect(rate.identity()).rejects.toMatchObject({ retryAfter: 17 });
});
it("connect stores secrets without returning them and rejects bot tokens", async () => {
  const s = setup(); const result = await s.host.harness.behavior.callRpc("connect", { token: "xoxp-fake-slack" });
  expect(JSON.stringify(result)).not.toContain("xoxp-"); expect(result).toMatchObject({ connected: true });
  await expect(s.host.harness.behavior.callRpc("connect", { token: "xoxb-fake-bot" })).rejects.toThrow();
  expect(JSON.stringify(s.host.harness.inspection.logEntries)).not.toContain("xoxp-");
});
