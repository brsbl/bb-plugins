import { createFakePluginHost } from "@get-bb/plugin-sdk/testing";
import { describe, expect, it } from "vitest";

import plugin, {
  measureTurns,
  outlineTurns,
  recordReading,
  toContextUsage,
  type TurnMarker,
} from "./server";

describe("toContextUsage", () => {
  it("fills to the auto-compact point when the provider reports one", () => {
    expect(
      toContextUsage({
        estimated: false,
        modelContextWindow: 200_000,
        usedTokens: 80_000,
        snapshot: { autoCompactAtTokens: 160_000 },
      }),
    ).toEqual({ usedTokens: 80_000, capacityTokens: 160_000, estimated: false });
  });

  it("falls back to the model window", () => {
    expect(
      toContextUsage({ estimated: true, modelContextWindow: 1_000_000, usedTokens: 102_902 }),
    ).toEqual({ usedTokens: 102_902, capacityTokens: 1_000_000, estimated: true });
  });

  it("keeps a compaction point seen in an earlier report", () => {
    expect(
      toContextUsage({ estimated: true, modelContextWindow: 200_000, usedTokens: 35_455 }, 167_000),
    ).toEqual({ usedTokens: 35_455, capacityTokens: 167_000, estimated: true });
  });

  it("reports nothing without usage", () => {
    expect(toContextUsage(null)).toBeNull();
    expect(toContextUsage({ estimated: true, modelContextWindow: 0, usedTokens: 4 })).toBeNull();
  });
});

describe("readThreadContext rpc", () => {
  it("reads the thread's context usage", async () => {
    const { bb, harness } = createFakePluginHost({
      pluginId: "context-katamari",
      sdk: {
        threads: {
          context: async () => ({
            usage: { estimated: false, modelContextWindow: 400_000, usedTokens: 100_000 },
          }),
          events: {
            list: async ({ types }: { types: string[] }) =>
              types[0] === "thread/compacted"
                ? [{ type: "thread/compacted" }, { type: "thread/compacted" }]
                : [],
          },
        },
      },
    });
    plugin(bb);
    await expect(harness.callRpc("readThreadContext", { threadId: "thr_a" })).resolves.toEqual({
      usage: { usedTokens: 100_000, capacityTokens: 400_000, estimated: false },
      compactions: 2,
      turns: [],
    });
    expect(harness.sdk.callsTo("threads.events.list")[0]?.[0]).toMatchObject({
      threadId: "thr_a",
      types: ["thread/compacted"],
    });
    await harness.lifecycle.dispose();
  });

  it("reports no usage and no compactions when the thread cannot be read", async () => {
    const { bb, harness } = createFakePluginHost({
      pluginId: "context-katamari",
      sdk: {
        threads: {
          context: async () => {
            throw new Error("thread not found");
          },
          events: {
            list: async () => {
              throw new Error("thread not found");
            },
          },
        },
      },
    });
    plugin(bb);
    await expect(harness.callRpc("readThreadContext", { threadId: "thr_gone" })).resolves.toEqual({
      usage: null,
      compactions: 0,
      turns: [],
    });
    await harness.lifecycle.dispose();
  });
});

function marker(seq: number, type: string, turnId: string | null, data: unknown = {}): TurnMarker {
  return { seq, type, scope: turnId ? { kind: "turn", turnId } : { kind: "thread" }, data };
}

describe("outlineTurns", () => {
  it("pairs each turn with the prompt that began it, newest first", () => {
    const text = (value: string) => ({ input: [{ type: "text", text: value }] });
    const turns = outlineTurns([
      marker(1, "client/turn/requested", null, { requestId: "r1", ...text("fix   the\ntests") }),
      marker(2, "turn/started", "t1"),
      marker(3, "turn/input/accepted", "t1", { clientRequestId: "r1" }),
      marker(4, "client/turn/requested", null, { requestId: "r2", ...text("also lint") }),
      marker(5, "turn/input/accepted", "t1", { clientRequestId: "r2" }),
      marker(7, "turn/completed", "t1", { status: "completed" }),
      marker(8, "client/turn/requested", null, { requestId: "r3", ...text("x".repeat(200)) }),
      marker(9, "turn/started", "t2"),
      marker(10, "turn/input/accepted", "t2", { clientRequestId: "r3" }),
    ]);
    expect(turns).toEqual([
      {
        turnId: "t2",
        startedSeq: 9,
        completedSeq: null,
        status: "running",
        prompt: `${"x".repeat(139)}…`,
      },
      {
        turnId: "t1",
        startedSeq: 2,
        completedSeq: 7,
        status: "completed",
        prompt: "fix the tests",
      },
    ]);
  });

  it("drops turns whose start fell outside the read window", () => {
    expect(outlineTurns([marker(3, "turn/completed", "t0", { status: "interrupted" })])).toEqual([]);
  });
});

describe("measureTurns", () => {
  const outlines = outlineTurns([
    marker(7, "turn/started", "t1"),
    marker(21, "turn/completed", "t1", { status: "completed" }),
    marker(24, "turn/started", "t2"),
    marker(73, "turn/completed", "t2", { status: "completed" }),
  ]);

  it("counts usage reported just after a turn completes toward that turn", () => {
    // Usage for t1 lands at seq 22, after t1 completes and before t2 starts.
    const ledger = recordReading(recordReading(undefined, null), [22, 34_606]);
    const turns = measureTurns(outlines, ledger, 35_455);
    expect(turns.map((turn) => [turn.turnId, turn.contextTokens, turn.baseline])).toEqual([
      ["t2", 849, undefined],
      ["t1", 34_606, true],
    ]);
  });

  it("leaves out turns that began before the plugin was watching", () => {
    const ledger = recordReading(undefined, [22, 34_606]);
    expect(measureTurns(outlines, ledger, 35_455).map((turn) => turn.turnId)).toEqual(["t2"]);
  });
});

describe("recordReading", () => {
  it("watches a thread without usage from its start and ignores repeated reports", () => {
    const empty = recordReading(undefined, null);
    expect(empty).toEqual({ watchedFrom: 0, readings: [] });
    const once = recordReading(empty, [22, 34_606]);
    expect(recordReading(once, [22, 34_606])).toBe(once);
    expect(once).toEqual({ watchedFrom: 0, readings: [[22, 34_606]] });
  });
});

describe("readThreadContext turn costs", () => {
  it("measures turns from usage it recorded before bb pruned the history", async () => {
    // bb keeps only the latest usage report, so each read sees just one.
    let latest: { seq: number; used: number } | null = null;
    const { bb, harness } = createFakePluginHost({
      pluginId: "context-katamari",
      sdk: {
        threads: {
          context: async () => ({ usage: null }),
          events: {
            list: async ({ types }: { types: string[] }) => {
              if (types[0] === "thread/compacted") return [];
              if (types[0] === "thread/contextWindowUsage/updated") {
                return latest === null
                  ? []
                  : [{ seq: latest.seq, data: { contextWindowUsage: { usedTokens: latest.used } } }];
              }
              return [
                marker(73, "turn/completed", "t2", { status: "completed" }),
                marker(24, "turn/started", "t2"),
                marker(21, "turn/completed", "t1", { status: "completed" }),
                marker(7, "turn/started", "t1"),
              ];
            },
          },
        },
      },
    });
    plugin(bb);
    const thread = { id: "thr_a" } as Parameters<typeof harness.emitThreadEvent<"thread.active">>[1]["thread"];
    await harness.emitThreadEvent("thread.active", { thread });
    latest = { seq: 22, used: 34_606 };
    await harness.emitThreadEvent("thread.active", { thread });
    latest = { seq: 74, used: 35_455 };
    const context = await harness.callRpc("readThreadContext", { threadId: "thr_a" });
    expect(context.turns).toEqual([
      { turnId: "t2", prompt: null, status: "completed", contextTokens: 849 },
      { turnId: "t1", prompt: null, status: "completed", contextTokens: 34_606, baseline: true },
    ]);
    await harness.lifecycle.dispose();
  });
});
