import { describe, expect, it } from "vitest";
import { createFakePluginHost } from "@get-bb/plugin-sdk/testing";

import plugin from "./server";

const report = {
  meta: {
    runId: "2026-09-02_4w",
    asOf: "2026-09-02T07:58:06.970Z",
    periodStart: "2026-08-05T07:58:06.970Z",
    weeks: 4,
    repository: "get-bb/bb",
  },
  weeks: ["Aug 5–12", "Aug 12–19", "Aug 19–26", "Aug 26–Sep 2"],
  weekly: [],
  areas: [{ area: "Mobile & remote access" }],
  themes: [],
  totals: { topics: 773, people: 239, open: 200, close_pct: 55 },
};

const narrative = {
  headlines: [["good", "Demand is steady.", ["Weekly feedback within 15%."], null]],
  recs: [],
  rec_rule: "P1 = reach and close rate.",
  asks: {},
  untracked_note: "15% untracked.",
};

const html = "<!DOCTYPE html><html><body><script>const DATA={};</script></body></html>";

function fileContents(): Record<string, string> {
  return {
    "/runs/2026-09-02_4w/report.json": JSON.stringify(report),
    "/runs/2026-09-02_4w/narrative.json": JSON.stringify(narrative),
    "/runs/2026-09-02_4w/dashboard.html": html,
  };
}

async function loadedPlugin(overrides: Record<string, string> = {}) {
  const files = { ...fileContents(), ...overrides };
  const readCalls: Array<{ path: string; hostId?: string }> = [];
  const { bb, harness } = createFakePluginHost({
    pluginId: "feedback-report",
    settings: { project: "proj_1" },
    sdk: {
      files: {
        read: async (args: { path: string; hostId?: string }) => {
          readCalls.push({ path: args.path, hostId: args.hostId });
          const content = files[args.path];
          if (content === undefined) throw new Error(`missing ${args.path}`);
          return { content, contentEncoding: "utf8", sha256: "x", sizeBytes: content.length };
        },
      },
      threads: {
        get: async () => ({ id: "thr_1", environmentId: "env_1", projectId: "proj_1" }),
        spawn: async (args: { prompt?: string; title?: string }) => ({
          id: "thr_report",
          title: args.title,
          prompt: args.prompt,
        }),
      },
      environments: {
        get: async () => ({ id: "env_1", hostId: "host_9" }),
      },
    },
  });
  await plugin(bb as never);
  return { harness, readCalls };
}

describe("feedback-report plugin", () => {
  it("imports a run directory from the invoking host and lists it", async () => {
    const { harness, readCalls } = await loadedPlugin();
    const imported = await harness.behavior.runCli(["import", "/runs/2026-09-02_4w"], {
      threadId: "thr_1",
    } as never);
    expect(imported.exitCode).toBe(0);
    expect(imported.stdout).toContain("Imported 2026-09-02_4w");
    expect(readCalls.every((call) => call.hostId === "host_9")).toBe(true);

    const listed = await harness.behavior.callRpc("listRuns", null);
    expect(listed).toMatchObject({
      runs: [
        {
          id: "2026-09-02_4w",
          weeks: 4,
          totals: { topics: 773, people: 239, open: 200, closePct: 55 },
          headlines: ["Demand is steady."],
          threadId: null,
        },
      ],
    });

    const latest = await harness.behavior.runCli(["latest"]);
    expect(latest.stdout.trim()).toBe("2026-09-02_4w");
  });

  it("rejects a run whose report is missing required fields", async () => {
    const { harness } = await loadedPlugin({
      "/runs/2026-09-02_4w/report.json": JSON.stringify({ meta: { runId: "x" } }),
    });
    const result = await harness.behavior.runCli(["import", "/runs/2026-09-02_4w"]);
    expect(result.exitCode).toBe(1);
    expect(result.stderr).toContain("report.json is invalid");
  });

  it("serves the imported dashboard over the plugin http route", async () => {
    const { harness } = await loadedPlugin();
    await harness.behavior.runCli(["import", "/runs/2026-09-02_4w"]);
    const response = await harness.behavior.fetchHttp(
      "GET",
      "/dashboard?run=2026-09-02_4w",
    );
    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toContain("text/html");
    expect(await response.text()).toBe(html);

    const missing = await harness.behavior.fetchHttp("GET", "/dashboard?run=nope");
    expect(missing.status).toBe(404);
  });

  it("spawns one follow-up thread per run and reuses it", async () => {
    const { harness } = await loadedPlugin();
    await harness.behavior.runCli(["import", "/runs/2026-09-02_4w"]);
    const first = await harness.behavior.callRpc("askAgent", { runId: "2026-09-02_4w" });
    expect(first).toEqual({ threadId: "thr_report", created: true });
    const spawnCalls = harness.inspection.sdk.callsTo("threads.spawn");
    expect(spawnCalls).toHaveLength(1);
    expect(JSON.stringify(spawnCalls[0])).toContain("bb feedback-report show 2026-09-02_4w");

    const second = await harness.behavior.callRpc("askAgent", { runId: "2026-09-02_4w" });
    expect(second).toEqual({ threadId: "thr_report", created: false });
    expect(harness.inspection.sdk.callsTo("threads.spawn")).toHaveLength(1);
  });

  it("removes a run", async () => {
    const { harness } = await loadedPlugin();
    await harness.behavior.runCli(["import", "/runs/2026-09-02_4w"]);
    const removed = await harness.behavior.runCli(["remove", "2026-09-02_4w"]);
    expect(removed.exitCode).toBe(0);
    const listed = await harness.behavior.callRpc("listRuns", null);
    expect(listed).toEqual({ runs: [] });
  });
});
