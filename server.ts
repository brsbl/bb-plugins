import { lstat, mkdir, readdir, rename, stat } from "node:fs/promises";
import { homedir } from "node:os";
import { join } from "node:path";

import { defineRpcContract, type BbPluginApi } from "@bb/plugin-sdk";
import { z } from "zod";

const THREAD_FOLDER_PATTERN = /^thr_[a-zA-Z0-9]+$/;

interface PluginOptions {
  getThread?: (threadId: string) => Promise<ThreadLifecycle>;
  subscribeArchiveStateChanges?: (
    handler: (threadId: string) => Promise<void>,
  ) => () => void;
  workspaceRoot?: string;
}

const threadStateSchema = z.enum(["active", "archived", "deleted"]);
type ThreadState = z.infer<typeof threadStateSchema>;

interface ThreadLifecycle {
  archivedAt: number | null;
  deletedAt: number | null;
  id: string;
}

interface ThreadFolderPlacement {
  changed: boolean;
  path: string;
}

const listFoldersOutputSchema = z
  .object({
    folders: z
      .object({
        active: z.array(z.string()),
        archived: z.array(z.string()),
        deleted: z.array(z.string()),
      })
      .strict(),
    root: z.string(),
  })
  .strict();

export type ListFoldersResult = z.infer<typeof listFoldersOutputSchema>;
export type OpenThreadResult = {
  path: string;
  state: ThreadState;
};

export const rpcContract = defineRpcContract({
  openThread: {
    input: z.object({ threadId: z.string() }).strict(),
    output: z
      .object({
        path: z.string(),
        state: threadStateSchema,
      })
      .strict(),
  },
  listFolders: {
    input: z.null(),
    output: listFoldersOutputSchema,
  },
});

export function defaultMossWorkspaceRoot(): string {
  return join(homedir(), "Moss");
}

export function bbThreadsRoot(workspaceRoot: string): string {
  return join(workspaceRoot, "Notes", "bb Threads");
}

function stateDirectoryName(state: ThreadState): string {
  if (state === "active") return "Active";
  if (state === "archived") return "Archived";
  return "Deleted";
}

export function threadFolderPath(
  root: string,
  state: ThreadState,
  threadId: string,
): string {
  if (!THREAD_FOLDER_PATTERN.test(threadId)) {
    throw new Error(`Invalid bb thread id: ${threadId}`);
  }
  return join(root, stateDirectoryName(state), threadId);
}

function stateForThread(thread: ThreadLifecycle): ThreadState {
  if (thread.deletedAt !== null) return "deleted";
  if (thread.archivedAt !== null) return "archived";
  return "active";
}

type DirectoryStatus = "directory" | "missing";

function hasErrorCode(cause: unknown, code: string): boolean {
  return cause instanceof Error && "code" in cause && cause.code === code;
}

async function directoryStatus(
  path: string,
  description: string,
): Promise<DirectoryStatus> {
  try {
    const entry = await lstat(path);
    if (entry.isSymbolicLink()) {
      throw new Error(`${description} must not be a symbolic link: ${path}`);
    }
    if (!entry.isDirectory()) {
      throw new Error(`${description} must be a directory: ${path}`);
    }
    return "directory";
  } catch (cause) {
    if (hasErrorCode(cause, "ENOENT")) return "missing";
    throw cause;
  }
}

async function rootDirectoryStatus(root: string): Promise<DirectoryStatus> {
  let entry;
  try {
    entry = await lstat(root);
  } catch (cause) {
    if (hasErrorCode(cause, "ENOENT")) return "missing";
    throw cause;
  }
  if (entry.isSymbolicLink()) {
    const target = await stat(root).catch(() => null);
    if (!target?.isDirectory()) {
      throw new Error(`Moss bb Threads root must resolve to a directory: ${root}`);
    }
    return "directory";
  }
  if (!entry.isDirectory()) {
    throw new Error(`Moss bb Threads root must be a directory: ${root}`);
  }
  return "directory";
}

interface FolderLayout {
  existing: string[];
}

async function inspectFolderLayout(
  root: string,
  threadId: string,
): Promise<FolderLayout> {
  await rootDirectoryStatus(root);
  const statePaths = (["active", "archived", "deleted"] as const).map((state) => {
    const directory = join(root, stateDirectoryName(state));
    return {
      directory,
      path: threadFolderPath(root, state, threadId),
      state,
    };
  });

  const parentStatuses = new Map<string, DirectoryStatus>();
  for (const { directory, state } of statePaths) {
    parentStatuses.set(
      directory,
      await directoryStatus(
        directory,
        `Moss ${stateDirectoryName(state)} lifecycle folder`,
      ),
    );
  }

  const existing: string[] = [];
  for (const { directory, path } of statePaths) {
    if (parentStatuses.get(directory) === "missing") continue;
    if (
      (await directoryStatus(path, `Moss thread folder for ${threadId}`)) ===
      "directory"
    ) {
      existing.push(path);
    }
  }

  const legacyPath = join(root, threadId);
  if (
    (await directoryStatus(
      legacyPath,
      `Legacy Moss thread folder for ${threadId}`,
    )) === "directory"
  ) {
    existing.push(legacyPath);
  }

  return { existing };
}

async function placeThreadFolder(
  root: string,
  threadId: string,
  targetState: ThreadState,
  createIfMissing: boolean,
): Promise<ThreadFolderPlacement | null> {
  const targetPath = threadFolderPath(root, targetState, threadId);
  let layout = await inspectFolderLayout(root, threadId);

  if (layout.existing.length > 1) {
    throw new Error(`Multiple Moss folders exist for ${threadId}`);
  }
  if (layout.existing.includes(targetPath)) {
    return { changed: false, path: targetPath };
  }
  if (layout.existing.length === 0 && !createIfMissing) return null;

  if ((await rootDirectoryStatus(root)) === "missing") {
    await mkdir(root, { recursive: true });
  }
  await rootDirectoryStatus(root);
  const targetDirectory = join(root, stateDirectoryName(targetState));
  if (
    (await directoryStatus(
      targetDirectory,
      `Moss ${stateDirectoryName(targetState)} lifecycle folder`,
    )) === "missing"
  ) {
    try {
      await mkdir(targetDirectory);
    } catch (cause) {
      if (!hasErrorCode(cause, "EEXIST")) throw cause;
    }
  }
  await directoryStatus(
    targetDirectory,
    `Moss ${stateDirectoryName(targetState)} lifecycle folder`,
  );

  layout = await inspectFolderLayout(root, threadId);
  if (layout.existing.length > 1) {
    throw new Error(`Multiple Moss folders exist for ${threadId}`);
  }
  if (layout.existing.includes(targetPath)) {
    return { changed: false, path: targetPath };
  }
  if (layout.existing.length === 1) {
    await rename(layout.existing[0], targetPath);
    return { changed: true, path: targetPath };
  }

  await mkdir(targetPath);
  await directoryStatus(targetPath, `Moss thread folder for ${threadId}`);
  return { changed: true, path: targetPath };
}

async function readStateFolders(root: string, state: ThreadState): Promise<string[]> {
  const directory = join(root, stateDirectoryName(state));
  if ((await rootDirectoryStatus(root)) === "missing") return [];
  if (
    (await directoryStatus(
      directory,
      `Moss ${stateDirectoryName(state)} lifecycle folder`,
    )) === "missing"
  ) {
    return [];
  }
  const entries = await readdir(directory, { withFileTypes: true }).catch(
    (cause: NodeJS.ErrnoException) => {
      if (cause.code === "ENOENT") return [];
      throw cause;
    },
  );
  return entries
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort((left, right) => left.localeCompare(right));
}

async function readFolders(root: string): Promise<ListFoldersResult["folders"]> {
  const [active, archived, deleted] = await Promise.all([
    readStateFolders(root, "active"),
    readStateFolders(root, "archived"),
    readStateFolders(root, "deleted"),
  ]);
  return { active, archived, deleted };
}

export async function registerMossNotesPlugin(
  bb: BbPluginApi,
  options: PluginOptions = {},
): Promise<void> {
  const workspaceRoot = options.workspaceRoot ?? defaultMossWorkspaceRoot();
  const root = bbThreadsRoot(workspaceRoot);
  const getThread =
    options.getThread ??
    (async (threadId: string) => {
      const thread = await bb.sdk.threads.get({ threadId });
      return {
        archivedAt: thread.archivedAt,
        deletedAt: thread.deletedAt,
        id: thread.id,
      };
    });
  const folderQueues = new Map<string, Promise<void>>();

  async function withThreadFolderLock<Result>(
    threadId: string,
    operation: () => Promise<Result>,
  ): Promise<Result> {
    const previous = folderQueues.get(threadId) ?? Promise.resolve();
    let release: () => void = () => undefined;
    const current = new Promise<void>((resolve) => {
      release = resolve;
    });
    folderQueues.set(threadId, current);
    await previous;
    try {
      return await operation();
    } finally {
      release();
      if (folderQueues.get(threadId) === current) folderQueues.delete(threadId);
    }
  }

  async function placeAndPublish(
    threadId: string,
    state: ThreadState,
    createIfMissing: boolean,
  ): Promise<ThreadFolderPlacement | null> {
    const placement = await placeThreadFolder(
      root,
      threadId,
      state,
      createIfMissing,
    );
    if (placement?.changed) {
      bb.realtime.publish("folders-changed", { state, threadId });
    }
    return placement;
  }

  async function reconcileThreadFolder(threadId: string): Promise<void> {
    await withThreadFolderLock(threadId, async () => {
      const thread = await getThread(threadId);
      await placeAndPublish(thread.id, stateForThread(thread), false);
    });
  }

  bb.rpc.register(rpcContract, {
    async openThread({ threadId }) {
      return withThreadFolderLock(threadId, async () => {
        const thread = await getThread(threadId);
        const state = stateForThread(thread);
        const placement = await placeAndPublish(thread.id, state, true);
        if (placement === null) {
          throw new Error(`Unable to initialize ${thread.id}`);
        }
        return { path: placement.path, state };
      });
    },
    async listFolders() {
      return {
        folders: await readFolders(root),
        root,
      };
    },
  });

  bb.events.on("thread.active", async ({ thread }) => {
    await reconcileThreadFolder(thread.id);
  });
  bb.events.on("thread.archived", async ({ thread }) => {
    await reconcileThreadFolder(thread.id);
  });
  bb.events.on("thread.deleted", async ({ thread }) => {
    await withThreadFolderLock(thread.id, async () => {
      await placeAndPublish(thread.id, "deleted", false);
    });
  });

  const subscribeArchiveStateChanges =
    options.subscribeArchiveStateChanges ??
    ((handler: (threadId: string) => Promise<void>) =>
      bb.sdk.subscribe({
        event: "thread:changed",
        callback(event) {
          if (
            event.id === undefined ||
            !event.changes.includes("archived-changed")
          ) {
            return;
          }
          void handler(event.id).catch((cause) => {
            bb.log.error(
              `Unable to reconcile Moss folder for ${event.id}: ${
                cause instanceof Error ? cause.message : String(cause)
              }`,
            );
          });
        },
      }));
  const unsubscribeArchiveStateChanges = subscribeArchiveStateChanges(
    reconcileThreadFolder,
  );
  bb.onDispose(unsubscribeArchiveStateChanges);

  bb.agents.configure(({ thread }) => ({
    instructions:
      `Store Moss notes for this bb thread under ${threadFolderPath(root, "active", thread.id)}. ` +
      "Use ordinary Moss note folders and Markdown files; " +
      "do not write Moss app-owned sidecars.",
    skills: [],
    tools: [],
  }));

  bb.log.info(`Moss Notes uses ${root}`);
}

export default async function plugin(bb: BbPluginApi): Promise<void> {
  await registerMossNotesPlugin(bb);
}
