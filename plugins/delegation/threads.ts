import type { BbPluginApi } from "@get-bb/plugin-sdk";

type ThreadsArea = BbPluginApi["sdk"]["threads"];
type ListArgs = NonNullable<Parameters<ThreadsArea["list"]>[0]>;
export type ThreadRow = Awaited<ReturnType<ThreadsArea["list"]>>[number];

// Ordered by how urgently the lead has to act.
export const STATES = ["needs-input", "error", "host-offline", "retry-queued", "working", "idle"] as const;
export type WorkerState = (typeof STATES)[number];

export function workerState(row: ThreadRow): WorkerState {
  if (row.hasPendingInteraction) return "needs-input";
  if (row.status === "error" || row.queuedWork === "failed") return "error";
  const display = row.runtime.displayStatus;
  if (display === "waiting-for-host" || display === "host-reconnecting") return "host-offline";
  if (row.status !== "idle" || display === "provisioning") return "working";
  if (row.queuedWork === "waiting") return "retry-queued";
  return "idle";
}

const PAGE = 200;

export async function listAll(list: ThreadsArea["list"], args: ListArgs): Promise<ThreadRow[]> {
  const rows: ThreadRow[] = [];
  for (let offset = 0; ; offset += PAGE) {
    const page = await list({ ...args, limit: PAGE, offset });
    rows.push(...page);
    if (page.length < PAGE) return rows.filter((row) => row.archivedAt === null && row.deletedAt === null);
  }
}

export interface ChildSummary {
  id: string;
  title: string;
  state: WorkerState;
  status: ThreadRow["status"];
  hidden: boolean;
  sectionId: string | null;
  updatedAt: number;
}

function title(row: ThreadRow): string {
  return row.title ?? row.titleFallback ?? "(untitled)";
}

export function summarizeChildren(rows: ThreadRow[]): ChildSummary[] {
  return rows
    .map((row) => ({
      id: row.id,
      title: title(row),
      state: workerState(row),
      status: row.status,
      hidden: row.visibility === "hidden",
      sectionId: row.sectionId,
      updatedAt: row.updatedAt,
    }))
    .sort((a, b) => STATES.indexOf(a.state) - STATES.indexOf(b.state) || b.updatedAt - a.updatedAt);
}

export function formatChildren(children: ChildSummary[]): string {
  if (children.length === 0) return "No workers.";
  const counts = STATES.map((state) => [state, children.filter((child) => child.state === state).length] as const)
    .filter(([, count]) => count > 0)
    .map(([state, count]) => `${count} ${state}`);
  const lines = children.map((child) => `${child.id}\t${child.state}\t${child.title}${child.hidden ? " (hidden)" : ""}`);
  return [`${children.length} worker${children.length === 1 ? "" : "s"}: ${counts.join(", ")}`, ...lines].join("\n");
}

export type CascadeReason = "child" | "lifecycle" | "hidden-fork";

export interface CascadeEntry extends ChildSummary {
  reason: CascadeReason;
  via: string;
}

/**
 * Mirrors bb's archive walk (apps/server thread-archive listArchiveCandidates):
 * archiving a thread also archives, recursively, its children, the threads whose
 * lifecycle owner it is, and its hidden forks.
 */
export function archiveCascade(rootId: string, rows: ThreadRow[]): CascadeEntry[] {
  const edges = new Map<string, Array<{ row: ThreadRow; reason: CascadeReason }>>();
  const add = (owner: string | null, row: ThreadRow, reason: CascadeReason) => {
    if (owner === null) return;
    const list = edges.get(owner) ?? [];
    list.push({ row, reason });
    edges.set(owner, list);
  };
  for (const row of rows) {
    add(row.lifecycleOwnerThreadId, row, "lifecycle");
    add(row.parentThreadId, row, "child");
    if (row.visibility === "hidden") add(row.sourceThreadId, row, "hidden-fork");
  }
  const seen = new Set([rootId]);
  const result: CascadeEntry[] = [];
  const queue = [rootId];
  while (queue.length > 0) {
    const owner = queue.shift()!;
    for (const { row, reason } of edges.get(owner) ?? []) {
      if (seen.has(row.id)) continue;
      seen.add(row.id);
      queue.push(row.id);
      const [summary] = summarizeChildren([row]);
      result.push({ ...summary!, reason, via: owner });
    }
  }
  return result;
}

export function formatCascade(rootId: string, entries: CascadeEntry[]): string {
  if (entries.length === 0) return `Archiving ${rootId} archives only that thread.`;
  const lines = entries.map((entry) => `${entry.id}\t${entry.state}\t${entry.reason} of ${entry.via}\t${entry.title}`);
  return [`Archiving ${rootId} also archives ${entries.length} thread${entries.length === 1 ? "" : "s"}:`, ...lines].join("\n");
}
