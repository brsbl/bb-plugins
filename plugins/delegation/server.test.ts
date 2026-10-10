import { createFakePluginHost } from "@get-bb/plugin-sdk/testing";
import { afterEach, describe, expect, it } from "vitest";

import plugin from "./server";
import { DEFAULTS } from "./settings";
import { archiveCascade, listAll, workerState, type ThreadRow } from "./threads";

function row(overrides: Partial<ThreadRow> & { id: string }): ThreadRow {
  return {
    activity: { activeBackgroundAgentCount: 0, activeBackgroundCommandCount: 0, activeGoalCount: 0, activePlanModeCount: 0, activeWorkflowCount: 0 },
    archivedAt: null, createdAt: 1, deletedAt: null,
    environmentBranchName: null, environmentHostId: null, environmentId: null, environmentIsWorktree: null,
    environmentName: null, environmentPath: null, environmentProviderId: null, environmentWorkspaceDisplayKind: "other",
    hasPendingInteraction: false, lastReadAt: null, latestAttentionAt: 1, lifecycleOwnerThreadId: null,
    originKind: null, originPluginId: null, parentThreadId: null, pinSortKey: null, pinnedAt: null,
    projectId: "proj", providerId: "claude-code", queuedWork: "none",
    runtime: { displayStatus: "idle", hostReconnectGraceExpiresAt: null },
    sectionId: null, sourceThreadId: null, status: "idle", title: overrides.id, titleFallback: null,
    updatedAt: 1, visibility: "visible",
    ...overrides,
  };
}

const disposers: Array<() => Promise<void>> = [];
afterEach(async () => { for (const dispose of disposers.splice(0)) await dispose(); });

function setup(rows: ThreadRow[]) {
  const { bb, harness } = createFakePluginHost({
    pluginId: "delegation",
    sdk: {
      threads: {
        list: async (args) => rows
          .filter((entry) => args?.parentThreadId === undefined || entry.parentThreadId === args.parentThreadId)
          .filter((entry) => !args?.archived || entry.archivedAt !== null)
          .slice(args?.offset ?? 0, (args?.offset ?? 0) + (args?.limit ?? rows.length)),
      },
    },
  });
  plugin(bb);
  disposers.push(() => harness.lifecycle.dispose());
  return harness;
}

const signal = new AbortController().signal;

describe("Delegation settings", () => {
  it("starts from brsbl's defaults and declares no generic settings form", async () => {
    const harness = setup([]);
    expect(harness.inspection.registrations.settingsDescriptors).toEqual({});
    expect(await harness.behavior.callRpc("getSettings", {})).toEqual(DEFAULTS);
    expect(JSON.parse((await harness.behavior.runCli(["settings", "--json"], { signal })).stdout)).toEqual(DEFAULTS);
  });

  it("saves from the form and the CLI, and resets to defaults", async () => {
    const harness = setup([]);
    await harness.behavior.callRpc("saveSettings", { values: { machine: "host_mac", retryLimit: 4 } });
    expect((await harness.behavior.runCli(["set", "mayArchiveOrStop", "true"], { signal })).stdout).toBe("mayArchiveOrStop\ttrue");
    const text = (await harness.behavior.runCli(["settings"], { signal })).stdout;
    expect(text).toContain('machine\t"host_mac"\n');
    expect(text).toContain('provider\t"claude-code"\t(default)');
    await harness.behavior.runCli(["reset", "machine"], { signal });
    expect(await harness.behavior.callRpc("getSettings", {})).toEqual({ ...DEFAULTS, retryLimit: 4, mayArchiveOrStop: true });
    expect(harness.inspection.realtimeSignals.at(-1)?.channel).toBe("settings-changed");
  });

  it("keeps valid settings and unknown keys when another version's value doesn't parse", async () => {
    const { bb, harness } = createFakePluginHost({ pluginId: "delegation" });
    await bb.storage.kv.set("settings", { retryLimit: 4, futureKey: 1, environment: "cloud" });
    plugin(bb);
    disposers.push(() => harness.lifecycle.dispose());
    expect(await harness.behavior.callRpc("getSettings", {})).toEqual({ ...DEFAULTS, retryLimit: 4 });
    await harness.behavior.runCli(["set", "reportStyle", "prose"], { signal });
    expect(await bb.storage.kv.get("settings")).toEqual({ retryLimit: 4, futureKey: 1, environment: "cloud", reportStyle: "prose" });
  });

  it("rejects unknown settings and invalid values", async () => {
    const harness = setup([]);
    const run = (argv: string[]) => harness.behavior.runCli(argv, { signal }).catch((error: Error) => ({ exitCode: 1, stdout: "", stderr: error.message }));
    expect((await run(["set", "colour", "red"])).stderr).toContain('Unknown setting "colour".');
    expect((await run(["set", "retryLimit", "99"])).stderr).toContain('"99" isn\'t a valid retryLimit.');
    expect((await run(["set", "environment", "cloud"])).exitCode).not.toBe(0);
    await expect(harness.behavior.callRpc("saveSettings", { values: { colour: "red" } })).rejects.toThrow();
  });
});

describe("worker state", () => {
  it("ranks what the lead must act on", () => {
    expect(workerState(row({ id: "a", hasPendingInteraction: true, status: "active" }))).toBe("needs-input");
    expect(workerState(row({ id: "b", status: "error" }))).toBe("error");
    expect(workerState(row({ id: "c", status: "active", runtime: { displayStatus: "waiting-for-host", hostReconnectGraceExpiresAt: null } }))).toBe("host-offline");
    expect(workerState(row({ id: "d", queuedWork: "waiting" }))).toBe("retry-queued");
    expect(workerState(row({ id: "d2", status: "error", queuedWork: "waiting" }))).toBe("retry-queued");
    expect(workerState(row({ id: "e", status: "starting" }))).toBe("working");
    expect(workerState(row({ id: "f" }))).toBe("idle");
  });
});

describe("children", () => {
  it("lists only the lead's workers, most urgent first", async () => {
    const harness = setup([
      row({ id: "done", parentThreadId: "lead", updatedAt: 5 }),
      row({ id: "stuck", parentThreadId: "lead", status: "error" }),
      row({ id: "other", parentThreadId: "elsewhere" }),
    ]);
    const text = await harness.behavior.runCli(["children"], { threadId: "lead", signal });
    expect(text.stdout).toBe("2 workers: 1 error, 1 idle\nstuck\terror\tstuck\ndone\tidle\tdone");
    const json = JSON.parse((await harness.behavior.runCli(["children", "--thread", "lead", "--json"], { signal })).stdout);
    expect(json.children.map((child: { id: string }) => child.id)).toEqual(["stuck", "done"]);
  });

  it("requires a thread outside a thread", async () => {
    const harness = setup([]);
    const result = await harness.behavior.runCli(["children"], { signal }).catch((error: Error) => ({ exitCode: 1, stdout: "", stderr: error.message }));
    expect(result.exitCode).not.toBe(0);
    expect(result.stderr).toContain("A thread is required.");
  });
});

describe("archive cascade", () => {
  it("follows children, lifecycle owners, and hidden forks recursively", () => {
    const rows = [
      row({ id: "lead" }),
      row({ id: "worker", parentThreadId: "lead" }),
      row({ id: "grandchild", parentThreadId: "worker" }),
      row({ id: "owned", lifecycleOwnerThreadId: "lead" }),
      row({ id: "fork", sourceThreadId: "lead", visibility: "hidden" }),
      row({ id: "visible-fork", sourceThreadId: "lead" }),
      row({ id: "unrelated" }),
    ];
    expect(archiveCascade("lead", rows).map((entry) => [entry.id, entry.reason, entry.via]).sort()).toEqual([
      ["fork", "hidden-fork", "lead"],
      ["grandchild", "child", "worker"],
      ["owned", "lifecycle", "lead"],
      ["worker", "child", "lead"],
    ]);
  });

  it("walks through archived threads to the live ones beneath them, like bb", async () => {
    const harness = setup([
      row({ id: "lead" }),
      row({ id: "worker", parentThreadId: "lead", archivedAt: 5 }),
      row({ id: "grandchild", parentThreadId: "worker" }),
    ]);
    const json = JSON.parse((await harness.behavior.runCli(["cascade", "--thread", "lead", "--json"], { signal })).stdout);
    expect(json.threads.map((entry: { id: string; via: string }) => [entry.id, entry.via])).toEqual([["grandchild", "worker"]]);
    expect((await harness.behavior.runCli(["children", "--thread", "lead"], { signal })).stdout).toBe("No workers.");
  });

  it("reports a thread that archives alone", async () => {
    const harness = setup([row({ id: "solo" })]);
    expect((await harness.behavior.runCli(["cascade", "--thread", "solo"], { signal })).stdout).toBe("Archiving solo archives only that thread.");
  });

  it("pages through every thread", async () => {
    const rows = Array.from({ length: 450 }, (_, index) => row({ id: `t${index}` }));
    const list = async (args?: { offset?: number; limit?: number }) => rows.slice(args?.offset ?? 0, (args?.offset ?? 0) + (args?.limit ?? 0));
    expect(await listAll(list as never, {})).toHaveLength(450);
  });
});
