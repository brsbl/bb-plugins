import {
  access,
  mkdtemp,
  mkdir,
  readFile,
  rm,
  symlink,
  writeFile,
} from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { createFakePluginHost, makeThreadResponse } from "@bb/plugin-sdk/testing";
import { afterEach, describe, expect, it } from "vitest";

import {
  bbThreadsRoot,
  registerMossNotesPlugin,
  threadFolderPath,
  type ListFoldersResult,
  type OpenThreadResult,
} from "./server";

const temporaryRoots: string[] = [];
type PluginOptions = Parameters<typeof registerMossNotesPlugin>[1];

async function registerTestPlugin(
  bb: Parameters<typeof registerMossNotesPlugin>[0],
  options: PluginOptions = {},
): Promise<void> {
  await registerMossNotesPlugin(bb, {
    subscribeArchiveStateChanges: () => () => undefined,
    ...options,
  });
}

async function temporaryWorkspace(): Promise<string> {
  const root = await mkdtemp(join(tmpdir(), "moss-notes-plugin-"));
  temporaryRoots.push(root);
  return root;
}

afterEach(async () => {
  await Promise.all(
    temporaryRoots.splice(0).map((root) => rm(root, { recursive: true, force: true })),
  );
});

describe("Moss Notes plugin", () => {
  it("creates a thread folder only when that thread opens the plugin page", async () => {
    const workspaceRoot = await temporaryWorkspace();
    const { bb, harness } = createFakePluginHost({ pluginId: "moss-notes" });
    await registerTestPlugin(bb, {
      getThread: async (threadId) => ({
        archivedAt: null,
        deletedAt: null,
        id: threadId,
      }),
      workspaceRoot,
    });

    const root = bbThreadsRoot(workspaceRoot);
    await expect(access(root)).rejects.toMatchObject({ code: "ENOENT" });

    const result = await harness.behavior.callRpc("openThread", {
      threadId: "thr_opened",
    }) as OpenThreadResult;
    expect(result).toEqual({
      path: threadFolderPath(root, "active", "thr_opened"),
      state: "active",
    });
    await expect(access(result.path)).resolves.toBeUndefined();
    expect(harness.inspection.realtimeSignals).toContainEqual({
      channel: "folders-changed",
      payload: { state: "active", threadId: "thr_opened" },
    });

    await harness.lifecycle.dispose();
  });

  it("publishes a folder change only when opening changes the folder placement", async () => {
    const workspaceRoot = await temporaryWorkspace();
    const { bb, harness } = createFakePluginHost({ pluginId: "moss-notes" });
    await registerTestPlugin(bb, {
      getThread: async (threadId) => ({
        archivedAt: null,
        deletedAt: null,
        id: threadId,
      }),
      workspaceRoot,
    });

    await harness.behavior.callRpc("openThread", { threadId: "thr_opened" });
    await harness.behavior.callRpc("openThread", { threadId: "thr_opened" });

    expect(harness.inspection.realtimeSignals).toEqual([
      {
        channel: "folders-changed",
        payload: { state: "active", threadId: "thr_opened" },
      },
    ]);

    await harness.lifecycle.dispose();
  });

  it("opens distinct threads concurrently against an absent workspace", async () => {
    const workspaceRoot = await temporaryWorkspace();
    const root = bbThreadsRoot(workspaceRoot);
    const threadIds = [
      "thr_concurrent1",
      "thr_concurrent2",
      "thr_concurrent3",
      "thr_concurrent4",
    ];
    const { bb, harness } = createFakePluginHost({ pluginId: "moss-notes" });
    await registerTestPlugin(bb, {
      getThread: async (threadId) => ({
        archivedAt: null,
        deletedAt: null,
        id: threadId,
      }),
      workspaceRoot,
    });

    await Promise.all(
      threadIds.map((threadId) =>
        harness.behavior.callRpc("openThread", { threadId }),
      ),
    );

    await Promise.all(
      threadIds.map((threadId) =>
        expect(
          access(threadFolderPath(root, "active", threadId)),
        ).resolves.toBeUndefined(),
      ),
    );
    expect(harness.inspection.realtimeSignals).toHaveLength(threadIds.length);
    expect(harness.inspection.realtimeSignals).toEqual(
      expect.arrayContaining(
        threadIds.map((threadId) => ({
          channel: "folders-changed",
          payload: { state: "active", threadId },
        })),
      ),
    );

    await harness.lifecycle.dispose();
  });

  it("does not create folders from lifecycle events for unopened threads", async () => {
    const workspaceRoot = await temporaryWorkspace();
    const { bb, harness } = createFakePluginHost({ pluginId: "moss-notes" });
    await registerTestPlugin(bb, {
      getThread: async (threadId) => ({
        archivedAt: Date.now(),
        deletedAt: null,
        id: threadId,
      }),
      workspaceRoot,
    });

    await harness.behavior.emitThreadEvent("thread.archived", {
      thread: makeThreadResponse({ archivedAt: Date.now(), id: "thr_unopened" }),
    });

    await expect(access(bbThreadsRoot(workspaceRoot))).rejects.toMatchObject({
      code: "ENOENT",
    });
    expect(harness.inspection.realtimeSignals).toEqual([]);

    await harness.lifecycle.dispose();
  });

  it("reconciles an archived folder when the thread is unarchived", async () => {
    const workspaceRoot = await temporaryWorkspace();
    const root = bbThreadsRoot(workspaceRoot);
    const { bb, harness } = createFakePluginHost({ pluginId: "moss-notes" });
    let lifecycle = {
      archivedAt: null as number | null,
      deletedAt: null as number | null,
    };
    let archiveStateChanged:
      | ((threadId: string) => Promise<void>)
      | undefined;
    await registerTestPlugin(bb, {
      getThread: async (threadId) => ({ ...lifecycle, id: threadId }),
      subscribeArchiveStateChanges(handler) {
        archiveStateChanged = handler;
        return () => undefined;
      },
      workspaceRoot,
    });

    await harness.behavior.callRpc("openThread", { threadId: "thr_restored" });
    lifecycle = { archivedAt: Date.now(), deletedAt: null };
    await harness.behavior.emitThreadEvent("thread.archived", {
      thread: makeThreadResponse({
        archivedAt: lifecycle.archivedAt,
        id: "thr_restored",
      }),
    });
    const archivedPath = threadFolderPath(root, "archived", "thr_restored");
    await writeFile(join(archivedPath, "note.md"), "# Restored");

    lifecycle = { archivedAt: null, deletedAt: null };
    const reconcileArchiveState = archiveStateChanged;
    if (!reconcileArchiveState) {
      throw new Error("Archive-state subscription was not registered");
    }
    await reconcileArchiveState("thr_restored");

    const activePath = threadFolderPath(root, "active", "thr_restored");
    expect(await readFile(join(activePath, "note.md"), "utf8")).toBe(
      "# Restored",
    );
    await expect(access(archivedPath)).rejects.toMatchObject({ code: "ENOENT" });
    expect(harness.inspection.realtimeSignals).toHaveLength(3);

    await harness.lifecycle.dispose();
  });

  it("moves an opened thread folder with archive and deletion lifecycle changes", async () => {
    const workspaceRoot = await temporaryWorkspace();
    const root = bbThreadsRoot(workspaceRoot);
    const { bb, harness } = createFakePluginHost({ pluginId: "moss-notes" });
    let lifecycle = {
      archivedAt: null as number | null,
      deletedAt: null as number | null,
    };
    await registerTestPlugin(bb, {
      getThread: async (threadId) => ({ ...lifecycle, id: threadId }),
      workspaceRoot,
    });

    await harness.behavior.callRpc("openThread", { threadId: "thr_moving" });
    const activePath = threadFolderPath(root, "active", "thr_moving");
    await writeFile(join(activePath, "note.md"), "# Kept");

    lifecycle = { archivedAt: Date.now(), deletedAt: null };
    await harness.behavior.emitThreadEvent("thread.archived", {
      thread: makeThreadResponse({
        archivedAt: Date.now(),
        id: "thr_moving",
      }),
    });
    const archivedPath = threadFolderPath(root, "archived", "thr_moving");
    expect(await readFile(join(archivedPath, "note.md"), "utf8")).toBe("# Kept");
    await expect(access(activePath)).rejects.toMatchObject({ code: "ENOENT" });

    await harness.behavior.emitThreadEvent("thread.deleted", {
      thread: makeThreadResponse({
        archivedAt: Date.now(),
        deletedAt: Date.now(),
        id: "thr_moving",
      }),
    });
    const deletedPath = threadFolderPath(root, "deleted", "thr_moving");
    expect(await readFile(join(deletedPath, "note.md"), "utf8")).toBe("# Kept");
    await expect(access(archivedPath)).rejects.toMatchObject({ code: "ENOENT" });

    await harness.lifecycle.dispose();
  });

  it("serializes concurrent lifecycle moves so the latest state wins", async () => {
    const workspaceRoot = await temporaryWorkspace();
    const root = bbThreadsRoot(workspaceRoot);
    const { bb, harness } = createFakePluginHost({ pluginId: "moss-notes" });
    let lifecycle = {
      archivedAt: null as number | null,
      deletedAt: null as number | null,
    };
    await registerTestPlugin(bb, {
      getThread: async (threadId) => ({ ...lifecycle, id: threadId }),
      workspaceRoot,
    });
    await harness.behavior.callRpc("openThread", { threadId: "thr_racing" });
    const activePath = threadFolderPath(root, "active", "thr_racing");
    await writeFile(join(activePath, "note.md"), "# Kept");

    const now = Date.now();
    lifecycle = { archivedAt: now, deletedAt: now };
    await Promise.all([
      harness.behavior.emitThreadEvent("thread.archived", {
        thread: makeThreadResponse({
          archivedAt: Date.now(),
          id: "thr_racing",
        }),
      }),
      harness.behavior.emitThreadEvent("thread.deleted", {
        thread: makeThreadResponse({
          archivedAt: Date.now(),
          deletedAt: Date.now(),
          id: "thr_racing",
        }),
      }),
    ]);

    const deletedPath = threadFolderPath(root, "deleted", "thr_racing");
    expect(await readFile(join(deletedPath, "note.md"), "utf8")).toBe("# Kept");
    await expect(access(activePath)).rejects.toMatchObject({ code: "ENOENT" });
    await expect(
      access(threadFolderPath(root, "archived", "thr_racing")),
    ).rejects.toMatchObject({ code: "ENOENT" });

    await harness.lifecycle.dispose();
  });

  it("rejects duplicate lifecycle folders even when one is already the target", async () => {
    const workspaceRoot = await temporaryWorkspace();
    const root = bbThreadsRoot(workspaceRoot);
    await Promise.all([
      mkdir(threadFolderPath(root, "active", "thr_duplicate"), {
        recursive: true,
      }),
      mkdir(threadFolderPath(root, "archived", "thr_duplicate"), {
        recursive: true,
      }),
    ]);
    const { bb, harness } = createFakePluginHost({ pluginId: "moss-notes" });
    await registerTestPlugin(bb, {
      getThread: async (threadId) => ({
        archivedAt: Date.now(),
        deletedAt: null,
        id: threadId,
      }),
      workspaceRoot,
    });

    await expect(
      harness.behavior.callRpc("openThread", {
        threadId: "thr_duplicate",
      }),
    ).rejects.toThrow("Multiple Moss folders exist for thr_duplicate");

    await harness.lifecycle.dispose();
  });

  it("rejects lifecycle-parent symlinks without creating outside them", async () => {
    const workspaceRoot = await temporaryWorkspace();
    const root = bbThreadsRoot(workspaceRoot);
    const outside = join(workspaceRoot, "outside-active");
    await Promise.all([mkdir(root, { recursive: true }), mkdir(outside)]);
    await symlink(outside, join(root, "Active"));
    const { bb, harness } = createFakePluginHost({ pluginId: "moss-notes" });
    await registerTestPlugin(bb, {
      getThread: async (threadId) => ({
        archivedAt: null,
        deletedAt: null,
        id: threadId,
      }),
      workspaceRoot,
    });

    await expect(
      harness.behavior.callRpc("openThread", { threadId: "thr_escape" }),
    ).rejects.toThrow("must not be a symbolic link");
    await expect(access(join(outside, "thr_escape"))).rejects.toMatchObject({
      code: "ENOENT",
    });

    await harness.lifecycle.dispose();
  });

  it("rejects an unsafe leaf alongside an existing target folder", async () => {
    const workspaceRoot = await temporaryWorkspace();
    const root = bbThreadsRoot(workspaceRoot);
    const outside = join(workspaceRoot, "outside-leaf");
    await Promise.all([
      mkdir(threadFolderPath(root, "archived", "thr_unsafe"), {
        recursive: true,
      }),
      mkdir(join(root, "Active"), { recursive: true }),
      mkdir(outside),
    ]);
    await symlink(
      outside,
      threadFolderPath(root, "active", "thr_unsafe"),
    );
    const { bb, harness } = createFakePluginHost({ pluginId: "moss-notes" });
    await registerTestPlugin(bb, {
      getThread: async (threadId) => ({
        archivedAt: Date.now(),
        deletedAt: null,
        id: threadId,
      }),
      workspaceRoot,
    });

    await expect(
      harness.behavior.callRpc("openThread", { threadId: "thr_unsafe" }),
    ).rejects.toThrow("must not be a symbolic link");
    await expect(access(join(outside, "note.md"))).rejects.toMatchObject({
      code: "ENOENT",
    });

    await harness.lifecycle.dispose();
  });

  it("rejects legacy symlink collisions without moving their targets", async () => {
    const workspaceRoot = await temporaryWorkspace();
    const root = bbThreadsRoot(workspaceRoot);
    const outside = join(workspaceRoot, "outside-legacy");
    await Promise.all([mkdir(root, { recursive: true }), mkdir(outside)]);
    await writeFile(join(outside, "note.md"), "# Outside");
    await symlink(outside, join(root, "thr_legacy"));
    const { bb, harness } = createFakePluginHost({ pluginId: "moss-notes" });
    await registerTestPlugin(bb, {
      getThread: async (threadId) => ({
        archivedAt: null,
        deletedAt: null,
        id: threadId,
      }),
      workspaceRoot,
    });

    await expect(
      harness.behavior.callRpc("openThread", { threadId: "thr_legacy" }),
    ).rejects.toThrow("must not be a symbolic link");
    expect(await readFile(join(outside, "note.md"), "utf8")).toBe("# Outside");
    await expect(
      access(threadFolderPath(root, "active", "thr_legacy")),
    ).rejects.toMatchObject({ code: "ENOENT" });

    await harness.lifecycle.dispose();
  });

  it("rejects regular-file collisions in lifecycle parents and thread leaves", async () => {
    const workspaceRoot = await temporaryWorkspace();
    const root = bbThreadsRoot(workspaceRoot);
    await mkdir(threadFolderPath(root, "active", "thr_file"), {
      recursive: true,
    });
    await writeFile(join(root, "Deleted"), "collision");
    await writeFile(
      threadFolderPath(root, "active", "thr_leaffile"),
      "collision",
    );
    const { bb, harness } = createFakePluginHost({ pluginId: "moss-notes" });
    await registerTestPlugin(bb, {
      getThread: async (threadId) => ({
        archivedAt: null,
        deletedAt: null,
        id: threadId,
      }),
      workspaceRoot,
    });

    await expect(
      harness.behavior.callRpc("openThread", { threadId: "thr_file" }),
    ).rejects.toThrow("must be a directory");
    await rm(join(root, "Deleted"));
    await expect(
      harness.behavior.callRpc("openThread", { threadId: "thr_leaffile" }),
    ).rejects.toThrow("must be a directory");

    await harness.lifecycle.dispose();
  });

  it("lists folders under their current lifecycle state", async () => {
    const workspaceRoot = await temporaryWorkspace();
    const root = bbThreadsRoot(workspaceRoot);
    await Promise.all([
      mkdir(threadFolderPath(root, "active", "thr_alpha"), { recursive: true }),
      mkdir(threadFolderPath(root, "archived", "thr_old"), { recursive: true }),
      mkdir(threadFolderPath(root, "deleted", "thr_deleted"), { recursive: true }),
    ]);
    const { bb, harness } = createFakePluginHost({ pluginId: "moss-notes" });
    await registerTestPlugin(bb, { workspaceRoot });

    const result = await harness.behavior.callRpc("listFolders", null) as ListFoldersResult;
    expect(result).toEqual({
      folders: {
        active: ["thr_alpha"],
        archived: ["thr_old"],
        deleted: ["thr_deleted"],
      },
      root,
    });

    await harness.lifecycle.dispose();
  });

  it("refuses thread ids that could escape the Moss folder", () => {
    expect(() =>
      threadFolderPath("/tmp/Moss/Notes/bb Threads", "active", "../escape"),
    ).toThrow("Invalid bb thread id");
  });
});
