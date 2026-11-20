import { chmod, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createFakePluginHost } from "@get-bb/plugin-sdk/testing";
import { afterEach, describe, expect, it } from "vitest";
import { createPlugin } from "./server.js";
import type { VaultReader } from "./vault.js";

const planted = { token: "ops_planted-Token-77aa", password: "planted-Password-c0de", otp: "271828" };
const sessionId = "8f0b7a52-6a3e-4c1f-9a51-3a9f1c2d4e5f";
const dirs: string[] = [];
afterEach(async () => {
  await Promise.all(dirs.splice(0).map((dir) => rm(dir, { recursive: true, force: true })));
});

async function setup() {
  const dir = await mkdtemp(join(tmpdir(), "onepassword-fill-server-"));
  dirs.push(dir);
  const tokenFile = join(dir, "token.env");
  await writeFile(tokenFile, `OP_SERVICE_ACCOUNT_TOKEN='${planted.token}'\n`);
  await chmod(tokenFile, 0o600);
  const tokens: string[] = [];
  const reader: VaultReader = {
    vaults: async () => [{ id: "v-agents", title: "Agents" }],
    items: async () => [{ id: "i-taxact", title: "TaxAct", websites: ["https://www.taxact.com"] }],
    field: async (_vault, _item, field) => (field === "otp" ? planted.otp : field === "password" ? planted.password : "fake-user"),
  };
  const { bb, harness } = createFakePluginHost({ pluginId: "onepassword-fill" });
  harness.sdk.stub("plugins.callRpc", async (args: { method: string }) =>
    args.method === "pages"
      ? { text: JSON.stringify([{ name: "main", url: "https://www.taxact.com/login" }]), images: [], exitCode: 0 }
      : { code: "ok" },
  );
  createPlugin({
    open: async (token) => {
      tokens.push(token);
      return reader;
    },
    sleep: async () => {},
  })(bb);
  await harness.behavior.setSettings({ tokenFile });
  return { harness, tokens };
}

function fillArgs(field: string) {
  return ["fill", "--session", sessionId, "--item", "TaxAct", "--field", field, "--selector", "#f"];
}

describe("Agent Sign-in", () => {
  it("is off by default and logs the refusal", async () => {
    const { harness, tokens } = await setup();
    const result = await harness.behavior.runCli(fillArgs("password"), { threadId: "thr_one" });
    expect(result.exitCode).toBe(1);
    expect(result.stderr).toContain("fills_disabled");
    expect(tokens).toEqual([]);
    expect(harness.inspection.sdk.callsTo("plugins.callRpc")).toEqual([]);
    const log = await harness.behavior.runCli(["log", "--json"]);
    expect(JSON.parse(log.stdout)).toMatchObject([{ threadId: "thr_one", item: "TaxAct", field: "password", result: "fills_disabled" }]);
    await harness.lifecycle.dispose();
  });

  it("keeps planted secrets out of every channel it controls", async () => {
    const { harness, tokens } = await setup();
    await harness.behavior.setSettings({ enabled: true });
    const outputs: unknown[] = [];
    for (const field of ["username", "password", "otp"]) {
      const cli = await harness.behavior.runCli([...fillArgs(field), "--json"], { threadId: "thr_one" });
      expect(cli.exitCode, cli.stderr).toBe(0);
      outputs.push(cli);
    }
    outputs.push(
      await harness.behavior.callAgentTool(
        "onepassword_fill",
        { sessionId, item: "TaxAct", field: "otp", selector: "#otp" },
        { threadId: "thr_two" },
      ),
    );
    outputs.push(await harness.behavior.runCli(["log", "--json"]));
    expect(tokens).toEqual(Array(4).fill(planted.token));
    const fills = harness.inspection.sdk
      .callsTo("plugins.callRpc")
      .map(([args]) => args as { pluginId: string; method: string; input: { value?: string } })
      .filter((args) => args.method === "experimental_fill");
    expect(fills.map((args) => args.pluginId)).toEqual(Array(4).fill("browser-automation"));
    expect(fills.map((args) => args.input.value)).toEqual(["fake-user", planted.password, planted.otp, planted.otp]);
    const observable = JSON.stringify([outputs, harness.inspection.logEntries, process.env]);
    for (const value of Object.values(planted)) expect(observable).not.toContain(value);
    expect(JSON.parse((outputs.at(-1) as { stdout: string }).stdout)).toHaveLength(4);
    await harness.lifecycle.dispose();
  });

  it("returns only ok or a code with a hint to agents", async () => {
    const { harness } = await setup();
    await harness.behavior.setSettings({ enabled: true });
    const ok = await harness.behavior.callAgentTool(
      "onepassword_fill",
      { sessionId, item: "TaxAct", field: "password", selector: "#p" },
      { threadId: "thr_one" },
    );
    expect(JSON.stringify(ok)).toContain('{\\"ok\\":true}');
    const missing = await harness.behavior.callAgentTool(
      "onepassword_fill",
      { sessionId, item: "Gusto", field: "password", selector: "#p" },
      { threadId: "thr_one" },
    );
    expect(JSON.stringify(missing)).toContain("item_not_found");
    await harness.lifecycle.dispose();
  });
});
