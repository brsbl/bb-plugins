import { createFakePluginHost } from "@get-bb/plugin-sdk/testing";
import { expect, it } from "vitest";
import plugin from "./server.js";
import { bill } from "./examples.js";

it("publishes immutable answers, confines reads to their thread, and survives reload", async () => {
  let host = createFakePluginHost({ pluginId: "interactive-answers" });
  try {
    plugin(host.bb);
    const result = await host.harness.behavior.runCli(["publish", "--thread", "thr_test", "--document", JSON.stringify(bill)]);
    const id = /id="([^"]+)"/.exec(result.stdout!)![1];
    const second = await host.harness.behavior.runCli(["publish", "--thread", "thr_test", "--document", JSON.stringify(bill)]);
    expect(second.stdout).not.toBe(result.stdout);
    await expect(host.harness.behavior.callRpc("get", { id, threadId: "thr_other" })).rejects.toThrow("unavailable");
    const guide = await host.harness.behavior.runCli(["guide"]);
    expect(JSON.parse(guide.stdout!).examples.bill.title).toBe(bill.title);
    host = await host.harness.lifecycle.reload(plugin);
    expect(await host.harness.behavior.callRpc("get", { id, threadId: "thr_test" })).toMatchObject({ document: bill });
  } finally { await host.harness.lifecycle.dispose(); }
});
