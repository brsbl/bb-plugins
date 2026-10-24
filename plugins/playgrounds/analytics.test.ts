import { describe, expect, it, vi } from "vitest";
import { createFakePluginHost, makeThreadResponse } from "@get-bb/plugin-sdk/testing";
import plugin from "./server.js";
import { bill } from "./examples.js";
import { clipExportPropertiesSchema, playgroundKind } from "./analytics.js";

const html = { title: "Private title", html: "<p>Private contents</p>" };
const anatomy = { title: "Private figure", html: '<body class="iso"><p>Private figure</p></body>' };

function setup(record = vi.fn().mockResolvedValue({ ok: true })) {
  const host = createFakePluginHost({
    pluginId: "playgrounds",
    sdk: { system: { experimental_recordTelemetryEvent: record } },
  });
  plugin(host.bb);
  return { ...host, record };
}

it("classifies native, HTML and Anatomy without sending their content", () => {
  expect(playgroundKind("document")).toBe("native");
  expect(playgroundKind("html", html.html)).toBe("html");
  expect(playgroundKind("html", anatomy.html)).toBe("anatomy");
});

it("counts CLI/tool publishes and saved republishing, but not reads, state changes or forks", async () => {
  const host = setup();
  try {
    const { runCli, callAgentTool, callRpc, emitThreadEvent } = host.harness.behavior;
    const native = await runCli(["publish", "--thread", "thr_test", "--document", JSON.stringify(bill)]);
    const id = /id="([^"]+)"/.exec(native.stdout!)![1]!;
    await callAgentTool("playground", { action: "publish", ...html }, { threadId: "thr_test" });
    await runCli(["publish", "--thread", "thr_test", "--playground", JSON.stringify(anatomy)]);
    await vi.waitFor(() => expect(host.record).toHaveBeenCalledTimes(3));
    expect(host.record.mock.calls.map(([event]) => event)).toEqual([
      { name: "playground_published", properties: { kind: "native" } },
      { name: "playground_published", properties: { kind: "html" } },
      { name: "playground_published", properties: { kind: "anatomy" } },
    ]);
    await callRpc("get", { id, threadId: "thr_test" });
    await runCli(["state", id, "--thread", "thr_test", "--set", '{"people":4}']);
    const saved = await callRpc("save", { id, threadId: "thr_test" }) as { savedId: string };
    await emitThreadEvent("thread.created", { thread: makeThreadResponse({ id: "thr_fork", sourceThreadId: "thr_test" }) });
    expect(host.record).toHaveBeenCalledTimes(3);
    await runCli(["publish", "--thread", "thr_test", "--saved", saved.savedId]);
    await vi.waitFor(() => expect(host.record).toHaveBeenCalledTimes(4));
    expect(host.record).toHaveBeenLastCalledWith({ name: "playground_published", properties: { kind: "native" } });
  } finally { await host.harness.lifecycle.dispose(); }
});

it("reports file publication only after validation and persistence succeed", async () => {
  const host = setup();
  try {
    host.harness.sdk.stub("threads.get", () => ({ ...makeThreadResponse({ id: "thr_test" }), environment: null }));
    host.harness.sdk.stub("threads.storageLocation", () => ({ hostId: "host_test", storageRootPath: "/thread" }));
    host.harness.sdk.stub("files.read", () => ({ path: "/thread/figure.html", content: anatomy.html, contentEncoding: "utf8", sizeBytes: anatomy.html.length, sha256: "0" }));
    const published = await host.harness.behavior.runCli(["publish", "--playground-file", "/thread/figure.html"], { threadId: "thr_test" });
    expect(published.exitCode).toBe(0);
    await vi.waitFor(() => expect(host.record).toHaveBeenCalledExactlyOnceWith({ name: "playground_published", properties: { kind: "anatomy" } }));
    host.record.mockClear();
    const bad = await host.harness.behavior.runCli(["publish", "--thread", "thr_test", "--document", '{}']);
    expect(bad.exitCode).toBe(1);
    host.bb.storage.database().exec("CREATE TRIGGER fail_publish BEFORE INSERT ON answers BEGIN SELECT RAISE(ABORT, 'write failed'); END");
    const failed = await host.harness.behavior.runCli(["publish", "--thread", "thr_test", "--playground", JSON.stringify(html)]);
    expect(failed.exitCode).toBe(1);
    expect(host.record).not.toHaveBeenCalled();
  } finally { await host.harness.lifecycle.dispose(); }
});

it("forwards export categories once and rejects arbitrary content", async () => {
  const host = setup();
  try {
    const args = ["clip-exported", "--kind", "anatomy", "--format", "mp4", "--size", "portrait", "--duration-bucket", "15_30s"];
    expect((await host.harness.behavior.runCli(args)).exitCode).toBe(0);
    expect(host.record).toHaveBeenCalledExactlyOnceWith({ name: "playground_clip_exported", properties: { kind: "anatomy", format: "mp4", size: "portrait", duration_bucket: "15_30s" } });
    host.record.mockClear();
    expect((await host.harness.behavior.runCli([...args.slice(0, -1), "30"])).exitCode).toBe(1);
    expect((await host.harness.behavior.runCli([...args, "--prompt", "private"])).exitCode).toBe(1);
    expect(host.record).not.toHaveBeenCalled();
    expect(clipExportPropertiesSchema.safeParse({ kind: "anatomy", format: "mp4", size: "portrait", duration_bucket: "15_30s", prompt: "private" }).success).toBe(false);
  } finally { await host.harness.lifecycle.dispose(); }
});

it.each(["sync", "async"])("keeps publish and export usable after a %s telemetry failure", async (mode) => {
  const record = vi.fn(() => { if (mode === "sync") throw new Error("private failure"); return Promise.reject(new Error("private failure")); });
  const host = setup(record);
  try {
    const result = await host.harness.behavior.runCli(["publish", "--thread", "thr_test", "--playground", JSON.stringify(html)]);
    expect(result.exitCode).toBe(0);
    const id = /id="([^"]+)"/.exec(result.stdout!)![1]!;
    expect(await host.harness.behavior.callRpc("get", { id, threadId: "thr_test" })).toMatchObject({ kind: "html" });
    expect((await host.harness.behavior.runCli(["clip-exported", "--kind", "html", "--format", "gif", "--size", "square", "--duration-bucket", "under_15s"])).exitCode).toBe(0);
    expect(JSON.stringify(host.harness.logEntries)).not.toContain("private failure");
  } finally { await host.harness.lifecycle.dispose(); }
});
