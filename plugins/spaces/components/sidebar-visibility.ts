// When a Space comes out of More and when it goes back. Pure, so the rule is testable without a host; the More
// controller feeds it bb's live sidebar and sends what it returns.

import type { PluginSidebarThread } from "@get-bb/plugin-sdk/app";

import { memberGroup, spaceHasNews, type MemberGroup } from "../shared";
import { liveMemberState } from "./model";

export type VisibilityThread = Pick<
  PluginSidebarThread,
  | "id"
  | "sectionId"
  | "parentThreadId"
  | "isHidden"
  | "isArchived"
  | "isUnread"
  | "hasPendingInteraction"
  | "status"
  | "runtimeStatus"
  | "latestAttentionAt"
>;

export interface VisibilityInput {
  spaceSectionIds: readonly string[];
  threads: readonly VisibilityThread[];
  /** Threads on screen: the routed thread and any split panes. */
  viewedThreadIds: readonly string[];
}

/**
 * One `setSidebarVisibility` call. `key` identifies what prompted it, so the controller sends a request once and
 * sends `show` again only when something new arrives (a different member, or a member's newer attention).
 */
export interface VisibilityRequest {
  sectionId: string;
  show: boolean;
  key: string;
}

const MAX_ANCESTRY = 32;

function rootOf(id: string, byId: ReadonlyMap<string, VisibilityThread>): VisibilityThread | undefined {
  let thread = byId.get(id);
  for (let depth = 0; thread?.parentThreadId && depth < MAX_ANCESTRY; depth += 1) {
    const parent = byId.get(thread.parentThreadId);
    if (!parent) break;
    thread = parent;
  }
  return thread;
}

/**
 * - A Space with news (a member needs you or has unread output) comes out of More.
 * - A Space without news goes back, unless you're reading one of its threads or subthreads.
 * Members are top-level, visible, unarchived threads in the Space's section, as everywhere else.
 */
export function planSidebarVisibility({ spaceSectionIds, threads, viewedThreadIds }: VisibilityInput): VisibilityRequest[] {
  const spaces = new Set(spaceSectionIds);
  const byId = new Map(threads.map((thread) => [thread.id, thread] as const));
  const groups = new Map<string, MemberGroup[]>();
  const news = new Map<string, string[]>();
  for (const thread of threads) {
    if (thread.sectionId === null || !spaces.has(thread.sectionId)) continue;
    if (thread.parentThreadId !== null || thread.isHidden || thread.isArchived) continue;
    const group = memberGroup(liveMemberState(thread));
    groups.set(thread.sectionId, [...(groups.get(thread.sectionId) ?? []), group]);
    if (spaceHasNews([group])) {
      news.set(thread.sectionId, [...(news.get(thread.sectionId) ?? []), `${thread.id}@${thread.latestAttentionAt}`]);
    }
  }

  const viewed = new Set<string>();
  for (const id of viewedThreadIds) {
    const sectionId = rootOf(id, byId)?.sectionId;
    if (sectionId) viewed.add(sectionId);
  }

  const requests: VisibilityRequest[] = [];
  for (const sectionId of spaces) {
    if (spaceHasNews(groups.get(sectionId) ?? [])) {
      requests.push({ sectionId, show: true, key: `show:${[...(news.get(sectionId) ?? [])].sort().join(",")}` });
    } else if (!viewed.has(sectionId)) {
      requests.push({ sectionId, show: false, key: "hide" });
    }
  }
  return requests;
}

/** The planned requests not already sent, so an unchanged decision is never repeated. */
export function unsentRequests(
  plan: readonly VisibilityRequest[],
  sent: ReadonlyMap<string, string>,
): VisibilityRequest[] {
  return plan.filter((request) => sent.get(request.sectionId) !== request.key);
}
