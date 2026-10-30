import { createFakePluginHost } from "@get-bb/plugin-sdk/testing";
import { afterEach, describe, expect, it } from "vitest";

import plugin, { AGENT_INSTRUCTIONS } from "./server";

const hosts: Array<{ dispose(): Promise<void> }> = [];

function load() {
  const { bb, harness } = createFakePluginHost({ pluginId: "thread-status" });
  plugin(bb);
  hosts.push(harness.lifecycle);
  return harness;
}

afterEach(async () => {
  for (const host of hosts.splice(0)) await host.dispose();
});

async function list(harness: ReturnType<typeof load>) {
  return ((await harness.callRpc("list", null)) as { statuses: Record<string, { label: string; tone: string }> }).statuses;
}

describe("thread-status CLI", () => {
  it("sets the calling thread's pill and lists it for the sidebar", async () => {
    const harness = load();
    const result = await harness.runCli(["set", "CI", "red", "--tone", "danger"], { threadId: "thr_a" });
    expect(result.exitCode).toBe(0);
    expect(await list(harness)).toEqual({ thr_a: expect.objectContaining({ label: "CI red", tone: "danger" }) });
  });

  it("targets another thread with --thread and defaults to neutral", async () => {
    const harness = load();
    await harness.runCli(["set", "Drafting", "--thread", "thr_b"], { threadId: "thr_a" });
    expect(await list(harness)).toEqual({ thr_b: expect.objectContaining({ label: "Drafting", tone: "neutral" }) });
  });

  it("rejects labels over two words or 18 characters without storing them", async () => {
    const harness = load();
    const tooManyWords = await harness.runCli(["set", "waiting on the user"], { threadId: "thr_a" });
    const tooLong = await harness.runCli(["set", "Supercalifragilistic"], { threadId: "thr_a" });
    expect(tooManyWords.exitCode).not.toBe(0);
    expect(tooManyWords.stderr).toContain("1-2 words");
    expect(tooLong.exitCode).not.toBe(0);
    expect(await list(harness)).toEqual({});
  });

  it("rejects unknown tones", async () => {
    const harness = load();
    const result = await harness.runCli(["set", "Done", "--tone", "purple"], { threadId: "thr_a" });
    expect(result.exitCode).not.toBe(0);
    expect(await list(harness)).toEqual({});
  });

  it("requires a thread outside an agent thread", async () => {
    const harness = load();
    const result = await harness.runCli(["set", "Done"], {});
    expect(result.exitCode).not.toBe(0);
    expect(result.stderr).toContain("--thread");
  });

  it("clears and reports the pill", async () => {
    const harness = load();
    await harness.runCli(["set", "Done", "--tone", "success"], { threadId: "thr_a" });
    expect((await harness.runCli(["get"], { threadId: "thr_a" })).stdout).toBe("Done (success)\n");
    expect((await harness.runCli(["clear"], { threadId: "thr_a" })).stdout).toBe("thr_a: cleared\n");
    expect((await harness.runCli(["get", "--json"], { threadId: "thr_a" })).stdout).toBe('{"threadId":"thr_a","status":null}\n');
  });
});

describe("thread lifecycle", () => {
  it.each(["thread.archived", "thread.deleted"] as const)("clears the pill on %s", async (event) => {
    const harness = load();
    await harness.runCli(["set", "Done"], { threadId: "thr_a" });
    await harness.runCli(["set", "Drafting"], { threadId: "thr_b" });
    const { errors } = await harness.emitThreadEvent(event, { thread: { id: "thr_a" } } as never);
    expect(errors).toEqual([]);
    expect(Object.keys(await list(harness))).toEqual(["thr_b"]);
  });
});

describe("agent instructions", () => {
  it("tells agents to complement Thread Organizer stages", () => {
    expect(AGENT_INSTRUCTIONS).toContain("bb thread-status set");
    expect(AGENT_INSTRUCTIONS).toContain("Never repeat the section or stage name");
    expect(AGENT_INSTRUCTIONS).toContain("bb organizer phase");
  });
});
