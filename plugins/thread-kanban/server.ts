import { defineRpcContract, type BbPluginApi } from "@get-bb/plugin-sdk";
import { z } from "zod";

const THREAD_PAGE_SIZE = 200;
const MAX_THREADS = 2_000;
const INTERACTION_CONCURRENCY = 6;
const CHANGE_DEBOUNCE_MS = 250;

export const BOARD_CHANGED_CHANNEL = "board-changed";

const threadStatusSchema = z.enum([
  "active",
  "error",
  "idle",
  "starting",
  "stopping",
]);

const boardThreadSchema = z
  .object({
    id: z.string(),
    title: z.string(),
    projectId: z.string(),
    sectionId: z.string().nullable(),
    status: threadStatusSchema,
    displayStatus: z.string(),
    unread: z.boolean(),
    pendingInteractions: z.number().int().nonnegative(),
    activeBackgroundAgentCount: z.number().int().nonnegative(),
    pinned: z.boolean(),
    createdAt: z.number(),
    updatedAt: z.number(),
    latestAttentionAt: z.number(),
  })
  .strict();

const boardSectionSchema = z
  .object({ id: z.string(), name: z.string() })
  .strict();

const boardSchema = z
  .object({
    fetchedAt: z.number(),
    /** Sections in bb's list order; the frontend applies the sidebar order. */
    sections: z.array(boardSectionSchema),
    threads: z.array(boardThreadSchema),
  })
  .strict();

export type BoardThread = z.infer<typeof boardThreadSchema>;
export type BoardSection = z.infer<typeof boardSectionSchema>;
export type BoardPayload = z.infer<typeof boardSchema>;

export const rpcContract = defineRpcContract({
  board: {
    input: z.object({}).strict(),
    output: boardSchema,
  },
  moveThread: {
    input: z
      .object({
        threadId: z.string().min(1),
        sectionId: z.string().min(1).nullable(),
      })
      .strict(),
    output: boardThreadSchema,
  },
});

type ThreadGetRecord = Awaited<ReturnType<BbPluginApi["sdk"]["threads"]["get"]>>;
type ThreadListRecord = Awaited<
  ReturnType<BbPluginApi["sdk"]["threads"]["list"]>
>[number];

/** Fields the board reads; both the list row and the get record satisfy it. */
type ThreadRecord = Pick<
  ThreadGetRecord,
  | "archivedAt"
  | "createdAt"
  | "deletedAt"
  | "id"
  | "lastReadAt"
  | "latestAttentionAt"
  | "parentThreadId"
  | "pinnedAt"
  | "projectId"
  | "sectionId"
  | "status"
  | "title"
  | "titleFallback"
  | "updatedAt"
  | "visibility"
> & {
  runtime: { displayStatus: string };
  activeBackgroundAgentCount?: number;
  activity?: ThreadListRecord["activity"];
};

function backgroundAgentCount(thread: ThreadRecord): number {
  return thread.activeBackgroundAgentCount ?? thread.activity?.activeBackgroundAgentCount ?? 0;
}

function threadTitle(thread: ThreadRecord): string {
  const title = thread.title?.trim();
  if (title) return title;
  const fallback = thread.titleFallback?.trim();
  return fallback || "Untitled thread";
}

export function isBoardThread(thread: ThreadRecord): boolean {
  return (
    thread.archivedAt === null &&
    thread.deletedAt === null &&
    thread.visibility === "visible" &&
    thread.parentThreadId === null
  );
}

export function toBoardThread(
  thread: ThreadRecord,
  pendingInteractions: number,
): BoardThread {
  return {
    id: thread.id,
    title: threadTitle(thread),
    projectId: thread.projectId,
    sectionId: thread.sectionId,
    status: thread.status,
    displayStatus: thread.runtime.displayStatus,
    unread: (thread.lastReadAt ?? 0) < thread.latestAttentionAt,
    pendingInteractions,
    activeBackgroundAgentCount: backgroundAgentCount(thread),
    pinned: thread.pinnedAt !== null,
    createdAt: thread.createdAt,
    updatedAt: thread.updatedAt,
    latestAttentionAt: thread.latestAttentionAt,
  };
}

async function mapWithConcurrency<T, R>(
  items: readonly T[],
  limit: number,
  fn: (item: T) => Promise<R>,
): Promise<R[]> {
  const results: R[] = new Array(items.length);
  let next = 0;
  async function worker(): Promise<void> {
    while (next < items.length) {
      const index = next;
      next += 1;
      results[index] = await fn(items[index]!);
    }
  }
  await Promise.all(
    Array.from({ length: Math.min(limit, items.length) }, () => worker()),
  );
  return results;
}

export default function plugin(bb: BbPluginApi): void {
  async function listBoardThreads(): Promise<ThreadRecord[]> {
    const collected: ThreadRecord[] = [];
    let offset = 0;
    while (collected.length < MAX_THREADS) {
      const page = await bb.sdk.threads.list({
        archived: false,
        hasParent: false,
        includeHidden: false,
        limit: THREAD_PAGE_SIZE,
        offset,
      });
      collected.push(...page.filter(isBoardThread));
      if (page.length < THREAD_PAGE_SIZE) break;
      offset += THREAD_PAGE_SIZE;
    }
    return collected;
  }

  async function pendingInteractionCount(thread: ThreadRecord): Promise<number> {
    // Only a thread with a live runtime can be waiting on the user.
    if (thread.status !== "active" && thread.status !== "idle") return 0;
    try {
      const pending = await bb.sdk.threads.interactions.list({
        threadId: thread.id,
      });
      return pending.length;
    } catch (error) {
      bb.log.warn(
        `action=interactions-list-failed thread=${thread.id} error=${
          error instanceof Error ? error.message : String(error)
        }`,
      );
      return 0;
    }
  }

  async function loadBoard(): Promise<BoardPayload> {
    const [sections, threads] = await Promise.all([
      bb.sdk.threadSections.list(),
      listBoardThreads(),
    ]);
    const rows = await mapWithConcurrency(
      threads,
      INTERACTION_CONCURRENCY,
      async (thread) => toBoardThread(thread, await pendingInteractionCount(thread)),
    );
    return {
      fetchedAt: Date.now(),
      sections: sections.map((section) => ({ id: section.id, name: section.name })),
      threads: rows,
    };
  }

  bb.rpc.register(rpcContract, {
    async board() {
      return loadBoard();
    },
    async moveThread({ threadId, sectionId }) {
      if (sectionId !== null) {
        const sections = await bb.sdk.threadSections.list();
        if (!sections.some((section) => section.id === sectionId)) {
          throw new Error("That section no longer exists. Refresh the board.");
        }
      }
      const current = await bb.sdk.threads.get({ threadId });
      if (!isBoardThread(current)) {
        throw new Error("That thread is no longer on the board.");
      }
      if (current.sectionId !== sectionId) {
        await bb.sdk.threads.update({ threadId, sectionId });
      }
      const updated = await bb.sdk.threads.get({ threadId });
      bb.log.info(
        `action=thread-moved thread=${threadId} section=${sectionId ?? "none"}`,
      );
      return toBoardThread(updated, await pendingInteractionCount(updated));
    },
  });

  // Coalesce bursts of thread changes into one client refresh signal.
  let pendingSignal: ReturnType<typeof setTimeout> | null = null;
  const changedThreadIds = new Set<string>();
  function scheduleSignal(threadId: string | null): void {
    if (threadId) changedThreadIds.add(threadId);
    if (pendingSignal) return;
    pendingSignal = setTimeout(() => {
      pendingSignal = null;
      const threadIds = [...changedThreadIds];
      changedThreadIds.clear();
      bb.realtime.publish(BOARD_CHANGED_CHANNEL, { threadIds });
    }, CHANGE_DEBOUNCE_MS);
  }

  const unsubscribe = bb.sdk.subscribe({
    event: "thread:changed",
    callback(event) {
      scheduleSignal(event.id ?? null);
    },
  });

  bb.onDispose(() => {
    unsubscribe();
    if (pendingSignal) {
      clearTimeout(pendingSignal);
      pendingSignal = null;
    }
  });

  bb.log.info("Thread Kanban loaded");
}
