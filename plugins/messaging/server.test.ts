import {
  createFakePluginHost,
  makePluginAgentConfigurationContext,
  makeThreadResponse,
} from "@get-bb/plugin-sdk/testing";
import { describe, expect, it } from "vitest";

import plugin from "./server";

const PARENT = "thr_parent1";
const CHILD = "thr_child1";

function host(metadata: Record<string, Record<string, unknown>>) {
  const threads: Record<string, ReturnType<typeof makeThreadResponse>> = {
    [PARENT]: makeThreadResponse({
      id: PARENT,
      projectId: "proj_1",
      environmentId: "env_parent",
      providerId: "claude-code",
      title: "Parent",
    }),
    [CHILD]: makeThreadResponse({
      id: CHILD,
      projectId: "proj_1",
      title: "Child",
      originPluginId: "messaging",
      lifecycleOwnerThreadId: PARENT,
    }),
  };
  const { bb, harness } = createFakePluginHost({
    pluginId: "messaging",
    sdk: {
      threads: {
        get: ({ threadId }) => threads[threadId],
        getPluginMetadata: ({ threadId }) => metadata[threadId] ?? {},
        updatePluginMetadata: ({ threadId, set }) => {
          metadata[threadId] = { ...(metadata[threadId] ?? {}), ...set };
          return metadata[threadId];
        },
        send: () => ({ ok: true, delivery: "sent" }),
        spawn: () => ({ id: "thr_new1" }),
        list: () => Object.values(threads),
      },
    },
  });
  plugin(bb);
  return harness;
}

describe("Messaging plugin", () => {
  it("spawns children with a lifecycle owner instead of a native parent", async () => {
    const harness = host({});
    const result = await harness.callAgentTool(
      "messaging_spawn_child",
      { prompt: "Fix the bug", environment: "shared" },
      { threadId: PARENT },
    );
    expect(result).toContain("thr_new1");
    const [args] = harness.sdk.callsTo("threads.spawn")[0] as [
      Record<string, unknown>,
    ];
    expect(args.lifecycleOwnerThreadId).toBe(PARENT);
    expect(args.parentThreadId).toBeUndefined();
    expect(args.environment).toEqual({
      type: "reuse",
      environmentId: "env_parent",
    });
    expect(args.pluginMetadata).toEqual({ parentThreadId: PARENT });
    expect(args.providerId).toBe("claude-code");
  });

  it("delivers a child's report to its parent and records it", async () => {
    const metadata = { [CHILD]: { parentThreadId: PARENT } };
    const harness = host(metadata);
    await harness.callAgentTool(
      "messaging_report_to_parent",
      { kind: "done", message: "Opened PR #12." },
      { threadId: CHILD },
    );
    const [args] = harness.sdk.callsTo("threads.send")[0] as [
      Record<string, unknown>,
    ];
    expect(args.threadId).toBe(PARENT);
    expect(args.senderThreadId).toBe(CHILD);
    expect(JSON.stringify(args.input)).toContain("Opened PR #12.");
    expect(metadata[CHILD]).toMatchObject({ lastReport: { kind: "done" } });
  });

  it("refuses reports from threads without a Messaging parent", async () => {
    const harness = host({});
    const result = await harness.callAgentTool(
      "messaging_report_to_parent",
      { kind: "done", message: "Finished." },
      { threadId: PARENT },
    );
    expect(result).toMatchObject({ isError: true });
    expect(harness.sdk.callsTo("threads.send")).toHaveLength(0);
  });

  it("offers the report tool and child instructions only to children", async () => {
    const harness = host({});
    const child = await harness.resolveAgentConfiguration(
      makePluginAgentConfigurationContext({
        pluginMetadata: { parentThreadId: PARENT },
      }),
    );
    expect(child.tools.map((tool) => tool.name)).toContain(
      "messaging_report_to_parent",
    );
    expect(child.instructions).toContain(PARENT);
    const parent = await harness.resolveAgentConfiguration(
      makePluginAgentConfigurationContext(),
    );
    expect(parent.tools.map((tool) => tool.name)).not.toContain(
      "messaging_report_to_parent",
    );
  });

  it("notifies the parent when a child fails and ignores other threads", async () => {
    const harness = host({ [CHILD]: { parentThreadId: PARENT } });
    await harness.emitThreadEvent("thread.failed", {
      thread: makeThreadResponse({ id: PARENT, title: "Parent" }),
      error: "boom",
    });
    expect(harness.sdk.callsTo("threads.send")).toHaveLength(0);
    await harness.emitThreadEvent("thread.failed", {
      thread: makeThreadResponse({
        id: CHILD,
        title: "Child",
        originPluginId: "messaging",
      }),
      error: "boom",
    });
    const [args] = harness.sdk.callsTo("threads.send")[0] as [
      Record<string, unknown>,
    ];
    expect(args.threadId).toBe(PARENT);
    expect(JSON.stringify(args.input)).toContain("failed");
  });

  it("only requests status from the caller's own children", async () => {
    const harness = host({ [CHILD]: { parentThreadId: PARENT } });
    const result = await harness.runCli(["request-status", CHILD], {
      threadId: "thr_other1",
    });
    expect(result.exitCode).not.toBe(0);
    expect(harness.sdk.callsTo("threads.send")).toHaveLength(0);
  });
});
