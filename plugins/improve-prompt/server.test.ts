import type { BbPluginApi } from "@get-bb/plugin-sdk";
import Database from "better-sqlite3";
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
  get?: () => Promise<Record<string, unknown>>;
  output?: () => Promise<{ output: string | null }>;
  defaultExecutionOptions?: () => Promise<Record<string, unknown> | null>;
  timeline?: () => Promise<Record<string, unknown>>;
  initialKv?: Iterable<readonly [string, unknown]>;
}) {
  const kv = new Map<string, unknown>(options?.initialKv);
  const database = new Database(":memory:");
  const eventHandlers = new Map<string, Array<(payload: never) => unknown>>();
  let rpcHandlers: RpcHandlers | null = null;
  const threads = {
    spawn: vi.fn(options?.spawn ?? (async () => ({ id: "thr_helper" }))),
    get: vi.fn(options?.get ?? (async () => ({ status: "active" }))),
    defaultExecutionOptions: vi.fn(
      options?.defaultExecutionOptions ?? (async () => null),
    ),
    timeline: vi.fn(
      options?.timeline ??
        (async () => ({
          rows: [],
          timelinePage: { hasOlderRows: false, olderCursor: null },
        })),
    ),
    output: vi.fn(options?.output ?? (async () => ({ output: null }))),
    stop: vi.fn(async () => ({ ok: true })),
    archive: vi.fn(async () => ({ ok: true })),
  };
  const publish = vi.fn();
  const bb = {
    storage: {
      database() {
        return database;
      },
      migrate(
        target: Database.Database,
        statements: readonly string[],
      ) {
        for (const statement of statements) target.exec(statement);
      },
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
    onDispose: vi.fn(),
  } as unknown as BbPluginApi;

  await promptShaper(bb);
  if (rpcHandlers === null) throw new Error("RPC handlers were not registered");

  return {
    kv,
    rpc: rpcHandlers,
    threads,
    publish,
    log: bb.log,
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

describe("Improve Prompt cancellation", () => {
  it("stops and archives an expired running helper during startup cleanup", async () => {
    const harness = await createHarness({
      initialKv: [
        [
          `request:${REQUEST_ID}`,
          {
            requestId: REQUEST_ID,
            helperThreadId: "thr_stale",
            status: "running",
            createdAt: Date.now() - 25 * 60 * 60 * 1_000,
          },
        ],
        ["thread:thr_stale", REQUEST_ID],
      ],
    });

    expect(harness.threads.stop).toHaveBeenCalledWith({
      threadId: "thr_stale",
    });
    expect(harness.threads.archive).toHaveBeenCalledWith({
      threadId: "thr_stale",
    });
    expect([...harness.kv.keys()]).toEqual([]);
  });

  it("stops and archives the helper, clears persisted work, and rejects a late result", async () => {
    const harness = await createHarness();
    await harness.rpc.startEnhancement(START_INPUT);
    expect(harness.threads.spawn).toHaveBeenCalledWith(
      expect.objectContaining({ permissionMode: "auto" }),
    );

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

  it("stops the helper and clears persisted state when startup reconciliation fails", async () => {
    const harness = await createHarness({
      get: async () => {
        throw new Error("helper status unavailable");
      },
    });

    await expect(harness.rpc.startEnhancement(START_INPUT)).rejects.toThrow(
      "helper status unavailable",
    );
    expect(harness.threads.stop).toHaveBeenCalledWith({
      threadId: "thr_helper",
    });
    expect(harness.threads.archive).toHaveBeenCalledWith({
      threadId: "thr_helper",
    });
    expect(
      [...harness.kv.keys()].filter(
        (key) => key.startsWith("request:") || key.startsWith("thread:"),
      ),
    ).toEqual([]);
  });
});

describe("Improve Prompt runtime context", () => {
  it("keeps a helper running through a transient empty idle before its real output", async () => {
    const harness = await createHarness();
    await harness.rpc.startEnhancement(START_INPUT);

    await harness.emit("thread.idle", {
      thread: { id: "thr_helper" },
      lastAssistantText: null,
    });

    await expect(
      harness.rpc.getEnhancement({ requestId: REQUEST_ID }),
    ).resolves.toEqual(expect.objectContaining({ status: "running" }));
    expect(harness.threads.archive).not.toHaveBeenCalled();

    await harness.emit("thread.idle", {
      thread: { id: "thr_helper" },
      lastAssistantText:
        "## Enhanced prompt\n\n> A complete prompt from the real turn.",
    });

    await expect(
      harness.rpc.getEnhancement({ requestId: REQUEST_ID }),
    ).resolves.toEqual(
      expect.objectContaining({
        status: "complete",
        enhancedPrompt: "A complete prompt from the real turn.",
      }),
    );
    expect(harness.threads.archive).toHaveBeenCalledTimes(1);
  });

  it("fails when an empty idle remains the helper's final state", async () => {
    vi.useFakeTimers();
    let status = "active";
    try {
      const harness = await createHarness({
        get: async () => ({ status }),
        output: async () => ({ output: null }),
      });
      await harness.rpc.startEnhancement(START_INPUT);
      status = "idle";

      await harness.emit("thread.idle", {
        thread: { id: "thr_helper" },
        lastAssistantText: null,
      });

      expect(harness.kv.get(`request:${REQUEST_ID}`)).toEqual(
        expect.objectContaining({ status: "running" }),
      );
      await vi.advanceTimersByTimeAsync(4_000);
      await expect(
        harness.rpc.getEnhancement({ requestId: REQUEST_ID }),
      ).resolves.toEqual(expect.objectContaining({ status: "running" }));
      await vi.advanceTimersByTimeAsync(2_000);

      await expect(
        harness.rpc.getEnhancement({ requestId: REQUEST_ID }),
      ).resolves.toEqual(expect.objectContaining({ status: "failed" }));
      expect(harness.threads.archive).toHaveBeenCalledTimes(1);
    } finally {
      vi.useRealTimers();
    }
  });

  it("keeps an in-flight empty-output check invalidated by renewed activity", async () => {
    vi.useFakeTimers();
    let status = "active";
    const outputRead = deferred<{ output: string | null }>();
    try {
      const harness = await createHarness({
        get: async () => ({ status }),
        output: () => outputRead.promise,
      });
      await harness.rpc.startEnhancement(START_INPUT);
      status = "idle";

      await harness.emit("thread.idle", {
        thread: { id: "thr_helper" },
        lastAssistantText: null,
      });
      await vi.advanceTimersByTimeAsync(5_000);
      expect(harness.threads.output).toHaveBeenCalledTimes(1);

      status = "active";
      await harness.emit("thread.active", {
        thread: { id: "thr_helper" },
      });
      outputRead.resolve({ output: null });
      await vi.advanceTimersByTimeAsync(0);
      expect(harness.kv.get(`request:${REQUEST_ID}`)).toEqual(
        expect.objectContaining({ status: "running" }),
      );
      expect(harness.threads.archive).not.toHaveBeenCalled();

      await harness.emit("thread.idle", {
        thread: { id: "thr_helper" },
        lastAssistantText:
          "## Enhanced prompt\n\n> A complete prompt from the continued turn.",
      });

      await expect(
        harness.rpc.getEnhancement({ requestId: REQUEST_ID }),
      ).resolves.toEqual(
        expect.objectContaining({
          status: "complete",
          enhancedPrompt: "A complete prompt from the continued turn.",
        }),
      );
      expect(harness.threads.archive).toHaveBeenCalledTimes(1);
    } finally {
      vi.useRealTimers();
    }
  });

  it("coalesces polling and retries a transient helper status failure", async () => {
    const firstStatus = deferred<void>();
    let getCalls = 0;
    const harness = await createHarness({
      initialKv: [
        [
          `request:${REQUEST_ID}`,
          {
            requestId: REQUEST_ID,
            helperThreadId: "thr_helper",
            status: "running",
            createdAt: Date.now(),
          },
        ],
        ["thread:thr_helper", REQUEST_ID],
      ],
      get: async () => {
        getCalls += 1;
        if (getCalls === 1) {
          await firstStatus.promise;
          throw new Error("fetch failed");
        }
        return { status: "idle" };
      },
      output: async () => ({
        output: "## Enhanced prompt\n\n> A complete, improved prompt.",
      }),
    });

    const polls = [
      harness.rpc.getEnhancement({ requestId: REQUEST_ID }),
      harness.rpc.getEnhancement({ requestId: REQUEST_ID }),
    ];
    await vi.waitFor(() => {
      expect(harness.threads.get).toHaveBeenCalledTimes(1);
    });
    firstStatus.resolve();

    await expect(Promise.all(polls)).resolves.toEqual([
      expect.objectContaining({ status: "complete" }),
      expect.objectContaining({ status: "complete" }),
    ]);
    expect(harness.threads.get).toHaveBeenCalledTimes(2);
    expect(harness.threads.output).toHaveBeenCalledTimes(1);
    expect(harness.log.warn).not.toHaveBeenCalledWith(
      expect.stringContaining("could not reconcile Improve Prompt helper"),
    );
  });

  it("reuses execution settings without reading or inheriting source history", async () => {
    const spawn = vi.fn<() => Promise<{ id: string }>>().mockResolvedValue({
      id: "thr_helper",
    });
    const harness = await createHarness({
      spawn,
      get: async () => ({
        id: "thr_source",
        projectId: "proj_1",
        environmentId: "env_1",
        providerId: "codex",
        status: "idle",
      }),
      defaultExecutionOptions: async () => ({
        model: "gpt-5.5",
        reasoningLevel: "medium",
        serviceTier: "default",
      }),
    });

    await expect(
      harness.rpc.startEnhancement({
        ...START_INPUT,
        sourceThreadId: "thr_source",
      }),
    ).resolves.toEqual({
      requestId: REQUEST_ID,
      helperThreadId: "thr_helper",
    });

    expect(harness.threads.timeline).not.toHaveBeenCalled();
    expect(spawn).toHaveBeenCalledWith(
      expect.objectContaining({
        environment: { type: "reuse", environmentId: "env_1" },
        providerId: "codex",
        model: "gpt-5.5",
        prompt: expect.stringContaining('"rough draft"'),
      }),
    );
    const spawnInput = spawn.mock.calls[0]?.[0];
    expect(spawnInput).not.toHaveProperty("sourceThreadId");
    expect(spawnInput).not.toHaveProperty("originKind");
    expect(spawnInput?.prompt).not.toContain("thr_source");
    expect(spawnInput?.prompt).not.toContain("history snapshot");
  });
});
