import { createFakePluginHost, makeThreadResponse } from "@get-bb/plugin-sdk/testing";
import { afterEach, describe, expect, it, vi } from "vitest";
import plugin from "./server.js";
import cardsPlugin from "../inline-action-cards/server.js";
import { fakeCredentials, fakeFetch } from "./fake-google.js";
import { REDIRECT_URI } from "./google.js";
const hosts: ReturnType<typeof createFakePluginHost>[] = [];
function setup(settings: Record<string, string> = fakeCredentials) {
  const cards = createFakePluginHost({ pluginId: "inline-action-cards" }); cardsPlugin(cards.bb); hosts.push(cards);
  const host = createFakePluginHost({ pluginId: "google-ads", settings, sdk: {
    plugins: { callRpc: async ({ method, input }) => cards.harness.behavior.callRpc(method, input) },
    threads: { get: async () => makeThreadResponse({ id: "thr_fake", environmentId: "env_fake" }) },
    environments: { get: async () => ({ hostId: "host_fake" }) },
    files: { read: async ({ hostId }) => { expect(hostId).toBe("host_fake"); return { content: 'GOOGLE_ADS_DEVELOPER_TOKEN="fake-import"\nGOOGLE_ADS_CUSTOMER_ID="0000000001"', contentEncoding: "utf8" }; } },
  } });
  hosts.push(host); plugin(host.bb); return { ...host, cards };
}
afterEach(async () => { vi.unstubAllGlobals(); for (const h of hosts.splice(0)) await h.harness.lifecycle.dispose(); });
describe("Google Ads plugin", () => {
  it("loads unconfigured and keeps every setting secret", async () => {
    const { harness } = setup({});
    const result = await harness.behavior.runCli(["status", "--json"]);
    expect(JSON.parse(result.stdout!)).toEqual({ configured: false, connected: false, customerSelected: false, downloadsSelected: false, readOnly: true });
    const failure = await harness.behavior.runCli(["report", "--last-7-days", "--json"]);
    expect(failure.exitCode).toBe(1); expect(failure.stdout).not.toContain("fake-secret");
  });
  it("all read commands use the mock API and reject write/unknown commands", async () => {
    vi.stubGlobal("fetch", vi.fn(fakeFetch)); const { harness } = setup();
    for (const command of ["accounts", "campaigns", "ad-groups", "ads", "conversion-actions"]) {
      const result = await harness.behavior.runCli([command, "--json"]); expect(result.exitCode, result.stderr).toBe(0); JSON.parse(result.stdout!);
    }
    for (const command of ["report", "search-terms"]) expect((await harness.behavior.runCli([command, "--last-7-days", "--json"])).exitCode).toBe(0);
    const ads = await harness.behavior.runCli(["ads", "--json"]); expect(ads.stdout).toContain("HEADLINE_1");
    expect((await harness.behavior.runCli(["mutate", "--json"])).exitCode).toBe(1);
    expect((await harness.behavior.runCli(["report", "--last-7-days", "--bogus", "--json"])).exitCode).toBe(1);
  });
  it("connects with PKCE, consumes sign-in once, and never returns tokens", async () => {
    vi.stubGlobal("fetch", fakeFetch); const { harness } = setup({ ...fakeCredentials, refreshToken: "" });
    const start = await harness.behavior.callRpc("connectStart", {}) as { authUrl: string };
    const state = new URL(start.authUrl).searchParams.get("state");
    await expect(harness.behavior.callRpc("connectFinish", { redirectUrl: `${REDIRECT_URI}?code=fake` })).rejects.toThrow();
    const input = { redirectUrl: `${REDIRECT_URI}?state=${state}&code=fake` };
    const result = await harness.behavior.callRpc("connectFinish", input);
    expect(result).toMatchObject({ connected: true }); expect(JSON.stringify(result)).not.toContain("fake-refresh");
    await expect(harness.behavior.callRpc("connectFinish", input)).rejects.toThrow();
    expect(await harness.behavior.callRpc("disconnect", {})).toMatchObject({ connected: false });
  });
  it("imports the secrets file from the invoking host without returning its values", async () => {
    const { harness } = setup({});
    const result = await harness.behavior.runCli(["configure", "--env-file", "/tmp/fake.env", "--json"], { threadId: "thr_fake" });
    expect(result.exitCode, result.stderr).toBe(0); expect(result.stdout).not.toContain("fake-import");
    expect(result.stdout).toContain("developerToken");
  });
  it("creates a real decision via the other plugin, without contacting Google", async () => {
    const network = vi.fn(() => { throw new Error("no network allowed"); }); vi.stubGlobal("fetch", network);
    const { harness, cards } = setup({});
    const proposal = { title: "Pause the example ad?", what: "Pause an illustrative ad.", whyNow: "The planned read date is here.", options: ["Pause it manually", "Keep it running"], recommendation: "Pause after reviewing the evidence.", next: "brsbl pauses it in Google Ads." };
    const result = await harness.behavior.runCli(["propose", "fake-card", "--proposal", JSON.stringify(proposal), "--json"], { threadId: "thr_fake" });
    expect(result.exitCode, result.stderr).toBe(0); expect(JSON.parse(result.stdout!)).toMatchObject({ applied: false, directive: '::action{id="fake-card"}' });
    const card = await cards.harness.behavior.callRpc("get", { threadId: "thr_fake", id: "fake-card" }) as any;
    expect(card.content.context).toContain("Approval never authorizes an API write"); expect(card.state).toBe("ready");
    await cards.harness.behavior.callRpc("prepare", { threadId: "thr_fake", id: "fake-card", revision: 1, action: "yes" });
    expect(network).not.toHaveBeenCalled();
    const duplicate = await harness.behavior.runCli(["propose", "fake-card", "--proposal", JSON.stringify(proposal), "--json"], { threadId: "thr_fake" });
    expect(duplicate.exitCode).toBe(1);
  });
});
