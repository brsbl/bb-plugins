import {
  createFakePluginHost,
  makeThreadResponse,
} from "@get-bb/plugin-sdk/testing";
import { afterEach, describe, expect, it } from "vitest";

import plugin, { type BoardPayload } from "./server";

const sections = [
  { id: "sec_plan", name: "📋 Planning", createdAt: 1, updatedAt: 1 },
  { id: "sec_build", name: "🛠️ Building", createdAt: 2, updatedAt: 2 },
];

function threads() {
  return [
    makeThreadResponse({ id: "thr_a", title: "Plan the thing", sectionId: "sec_plan" }),
    makeThreadResponse({ id: "thr_b", title: "Build it", sectionId: "sec_build", status: "active" }),
    makeThreadResponse({ id: "thr_hidden", title: "Hidden", visibility: "hidden" }),
    makeThreadResponse({ id: "thr_gone", title: "Archived", archivedAt: 10 }),
    makeThreadResponse({ id: "thr_child", title: "Worker", parentThreadId: "thr_b" }),
  ];
}

function host(store: ReturnType<typeof threads>) {
  const updates: unknown[] = [];
  const result = createFakePluginHost({
    pluginId: "thread-kanban",
    sdk: {
      subscribe: () => () => undefined,
      threadSections: { list: async () => sections },
      threads: {
        list: async () => store,
        get: async ({ threadId }: { threadId: string }) => {
          const found = store.find((thread) => thread.id === threadId);
          if (!found) throw new Error(`missing ${threadId}`);
          return found;
        },
        update: async (args: { threadId: string; sectionId?: string | null }) => {
          updates.push(args);
          const found = store.find((thread) => thread.id === args.threadId)!;
          found.sectionId = args.sectionId ?? null;
          return { id: args.threadId };
        },
        interactions: { list: async () => [] },
      },
    },
  });
  return { ...result, updates };
}

let dispose: (() => Promise<void>) | null = null;
afterEach(async () => {
  await dispose?.();
  dispose = null;
});

describe("Thread Kanban server", () => {
  it("lists sections and only live, visible, top-level threads", async () => {
    const { bb, harness } = host(threads());
    dispose = () => harness.lifecycle.dispose();
    plugin(bb);
    const board = (await harness.behavior.callRpc("board", {})) as BoardPayload;
    expect(board.sections.map((section) => section.id)).toEqual(["sec_plan", "sec_build"]);
    expect(board.threads.map((thread) => thread.id).sort()).toEqual(["thr_a", "thr_b"]);
    expect(board.threads.find((thread) => thread.id === "thr_b")?.status).toBe("active");
  });

  it("moves a thread into another section through the SDK", async () => {
    const { bb, harness, updates } = host(threads());
    dispose = () => harness.lifecycle.dispose();
    plugin(bb);
    const moved = (await harness.behavior.callRpc("moveThread", {
      threadId: "thr_a",
      sectionId: "sec_build",
    })) as { id: string; sectionId: string | null };
    expect(updates).toEqual([{ threadId: "thr_a", sectionId: "sec_build" }]);
    expect(moved.sectionId).toBe("sec_build");
  });

  it("refuses a move into an unknown section", async () => {
    const { bb, harness, updates } = host(threads());
    dispose = () => harness.lifecycle.dispose();
    plugin(bb);
    await expect(
      harness.behavior.callRpc("moveThread", { threadId: "thr_a", sectionId: "sec_nope" }),
    ).rejects.toThrow(/no longer exists/);
    expect(updates).toEqual([]);
  });
});
