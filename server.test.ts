import type { BbPluginApi } from "@bb/plugin-sdk";
import { describe, expect, it, vi } from "vitest";

import promptShaper, { rpcContract } from "./server";

const REQUEST_ID = "00000000-0000-4000-8000-000000000001";

interface RpcHandlers {
  startEnhancement(input: {
    requestId: string;
    draft: string;
    projectId: string;
    sourceThreadId: string | null;
  }): Promise<{ requestId: string; helperThreadId: string }>;
  getEnhancement(input: { requestId: string }): Promise<unknown>;
  cancelEnhancement(input: { requestId: string }): Promise<{ cancelled: true }>;
}

interface Deferred<T> {
  promise: Promise<T>;
  resolve(value: T): void;
}

function deferred<T>(): Deferred<T> {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((resolvePromise) => {
    resolve = resolvePromise;
  });
  return { promise, resolve };
}

async function createHarness(options?: {
  spawn?: () => Promise<{ id: string }>;
}) {
  const kv = new Map<string, unknown>();
  const eventHandlers = new Map<string, Array<(payload: never) => unknown>>();
  let rpcHandlers: RpcHandlers | null = null;
  const threads = {
    spawn: vi.fn(options?.spawn ?? (async () => ({ id: "thr_helper" }))),
    get: vi.fn(async () => ({ status: "active" })),
    defaultExecutionOptions: vi.fn(async () => null),
    output: vi.fn(async () => ({ output: null })),
    stop: vi.fn(async () => ({ ok: true })),
    archive: vi.fn(async () => ({ ok: true })),
  };
  const publish = vi.fn();
  const bb = {
    storage: {
      kv: {
        async get(key: string) {
          return kv.get(key);
        },
        async set(key: string, value: unknown) {
          kv.set(key, value);
        },
        async delete(key: string) {
          kv.delete(key);
        },
        async list(prefix = "") {
          return [...kv.keys()].filter((key) => key.startsWith(prefix));
        },
      },
    },
    sdk: { threads },
    rpc: {
      register(_contract: typeof rpcContract, handlers: RpcHandlers) {
        rpcHandlers = handlers;
      },
    },
    realtime: { publish },
    events: {
      on(event: string, handler: (payload: never) => unknown) {
        const handlers = eventHandlers.get(event) ?? [];
        handlers.push(handler);
        eventHandlers.set(event, handlers);
      },
    },
    log: {
      debug: vi.fn(),
      info: vi.fn(),
      warn: vi.fn(),
      error: vi.fn(),
    },
  } as unknown as BbPluginApi;

  await promptShaper(bb);
  if (rpcHandlers === null) throw new Error("RPC handlers were not registered");

  return {
    kv,
    rpc: rpcHandlers,
    threads,
    publish,
    async emit(event: string, payload: unknown) {
      for (const handler of eventHandlers.get(event) ?? []) {
        await handler(payload as never);
      }
    },
  };
}

const START_INPUT = {
  requestId: REQUEST_ID,
  draft: "rough draft",
  projectId: "proj_1",
  sourceThreadId: null,
};

describe("Prompt Shaper cancellation", () => {
  it("stops and archives the helper, clears persisted work, and rejects a late result", async () => {
    const harness = await createHarness();
    await harness.rpc.startEnhancement(START_INPUT);

    await expect(
      harness.rpc.cancelEnhancement({ requestId: REQUEST_ID }),
    ).resolves.toEqual({ cancelled: true });
    expect(harness.threads.stop).toHaveBeenCalledWith({
      threadId: "thr_helper",
    });
    expect(harness.threads.archive).toHaveBeenCalledWith({
      threadId: "thr_helper",
    });
    await expect(
      harness.rpc.getEnhancement({ requestId: REQUEST_ID }),
    ).resolves.toBeNull();

    await harness.emit("thread.idle", {
      thread: { id: "thr_helper" },
      lastAssistantText:
        "## Enhanced prompt\n\n> Late prompt that must be ignored.",
    });

    await expect(
      harness.rpc.getEnhancement({ requestId: REQUEST_ID }),
    ).resolves.toBeNull();
    expect(harness.publish).toHaveBeenCalledTimes(1);
    expect(
      [...harness.kv.keys()].filter(
        (key) => key.startsWith("request:") || key.startsWith("thread:"),
      ),
    ).toEqual([]);
  });

  it("invalidates cancellation that races helper creation", async () => {
    const spawned = deferred<{ id: string }>();
    const harness = await createHarness({
      spawn: () => spawned.promise,
    });
    const start = harness.rpc.startEnhancement(START_INPUT);
    await vi.waitFor(() => {
      expect(harness.threads.spawn).toHaveBeenCalledTimes(1);
    });

    await harness.rpc.cancelEnhancement({ requestId: REQUEST_ID });
    spawned.resolve({ id: "thr_late_helper" });

    await expect(start).rejects.toThrow("Enhancement was cancelled");
    expect(harness.threads.stop).toHaveBeenCalledWith({
      threadId: "thr_late_helper",
    });
    expect(harness.threads.archive).toHaveBeenCalledWith({
      threadId: "thr_late_helper",
    });
    expect([...harness.kv.keys()]).toEqual([]);
  });
});
