// The Space tab's view model: merge the server snapshot with bb's live sidebar state, group and order the cards, and
// format their small labels. Type-only SDK imports, so tests can import this module directly.

import type { PluginSidebarThread, PluginSidebarThreadIndicator } from "@get-bb/plugin-sdk/app";

import type { SpaceMember } from "../contract";
import { MEMBER_GROUPS, memberGroup, type MemberGroup, type MemberStateInput } from "../shared";

/** bb's own busy runtime statuses (thread-list's RUNNING_RUNTIME_STATUSES). */
const RUNNING_RUNTIME_STATUSES: ReadonlySet<string> = new Set(["active", "provisioning", "starting", "stopping"]);

export type LiveThreadState = Pick<
  PluginSidebarThread,
  "isArchived" | "hasPendingInteraction" | "status" | "runtimeStatus" | "isUnread"
>;

export function isRunning(thread: Pick<PluginSidebarThread, "runtimeStatus">): boolean {
  return RUNNING_RUNTIME_STATUSES.has(thread.runtimeStatus);
}

/** Read a live sidebar thread the way `memberGroup()` expects, so every surface groups a thread the same way. */
export function liveMemberState(thread: LiveThreadState): MemberStateInput {
  return {
    archived: thread.isArchived,
    hasPendingInteraction: thread.hasPendingInteraction,
    failed: thread.status === "error",
    running: isRunning(thread),
    isUnread: thread.isUnread,
  };
}

/** bb's sidebar indicator, plus an archived glyph and the red glyph a failure keeps after you've read it. */
export type GlyphKind = PluginSidebarThreadIndicator | "archived" | "failed";

const INDICATORS: ReadonlySet<string> = new Set<PluginSidebarThreadIndicator>([
  "background-agent",
  "background-command",
  "draft",
  "goal",
  "none",
  "plan-mode",
  "queued-failed",
  "queued-waiting",
  "runtime",
  "unread-error",
  "unread-success",
  "waiting-for-input",
  "workflow",
  "working-draft",
]);

/** bb's accessible labels for each indicator (thread-list's THREAD_LIST_INDICATOR_LABELS). */
export const GLYPH_LABELS: Record<Exclude<GlyphKind, "none">, string> = {
  "unread-error": "Unread thread failed",
  "waiting-for-input": "Thread needs user input",
  "working-draft": "Thread working with unsubmitted draft",
  workflow: "Workflow running",
  "background-agent": "Background agent running",
  "background-command": "Background command running",
  "plan-mode": "Plan mode active",
  goal: "Goal active",
  runtime: "Thread working",
  "queued-failed": "Queued message failed to send",
  "queued-waiting": "Thread has a message waiting to send",
  draft: "Thread has unsubmitted draft",
  "unread-success": "Unread thread succeeded",
  archived: "Archived thread",
  failed: "Thread failed",
};

export interface SubthreadRollup {
  total: number;
  working: number;
  needsYou: number;
}

export interface MemberCardModel {
  id: string;
  title: string;
  projectName: string | null;
  group: MemberGroup;
  glyph: GlyphKind;
  glyphLabel: string | null;
  isUnread: boolean;
  archived: boolean;
  lastActivityAt: number;
  excerpt: string | null;
  firstPrompt: string | null;
  subthreads: SubthreadRollup;
  /** The thread whose panel shows this tab. It is labeled "This thread" and can't be peeked or selected. */
  isCurrent: boolean;
}

function glyphFor(thread: PluginSidebarThread | undefined, state: MemberStateInput): Pick<MemberCardModel, "glyph" | "glyphLabel"> {
  if (state.archived) return { glyph: "archived", glyphLabel: GLYPH_LABELS.archived };
  if (thread) {
    // Treat an indicator this plugin doesn't know as "none", as the SDK asks.
    const kind = INDICATORS.has(thread.indicator) ? thread.indicator : "none";
    if (kind !== "none") return { glyph: kind, glyphLabel: thread.indicatorLabel ?? GLYPH_LABELS[kind] };
  } else {
    const kind: GlyphKind = state.hasPendingInteraction
      ? "waiting-for-input"
      : state.failed && state.isUnread
        ? "unread-error"
        : state.running
          ? "runtime"
          : state.isUnread
            ? "unread-success"
            : "none";
    if (kind !== "none") return { glyph: kind, glyphLabel: GLYPH_LABELS[kind] };
  }
  if (state.failed) return { glyph: "failed", glyphLabel: GLYPH_LABELS.failed };
  return { glyph: "none", glyphLabel: null };
}

function liveRollup(snapshot: SubthreadRollup, children: readonly PluginSidebarThread[]): SubthreadRollup {
  return {
    total: Math.max(snapshot.total, children.length),
    working: children.filter(isRunning).length,
    needsYou: children.filter((child) => child.hasPendingInteraction).length,
  };
}

export interface MergeInput {
  sectionId: string;
  members: readonly SpaceMember[];
  /** bb's live sidebar threads, or null while that list isn't ready. */
  live: readonly PluginSidebarThread[] | null;
  currentThreadId: string;
}

/**
 * Overlay live state on the snapshot so cards regroup the moment bb's sidebar changes, without waiting for the next
 * snapshot. A member the live list shows outside the Space (dragged out, nested, or hidden) is dropped right away.
 */
export function mergeMembers({ sectionId, members, live, currentThreadId }: MergeInput): MemberCardModel[] {
  const byId = new Map<string, PluginSidebarThread>();
  const children = new Map<string, PluginSidebarThread[]>();
  for (const thread of live ?? []) {
    byId.set(thread.id, thread);
    if (thread.parentThreadId === null || thread.isHidden || thread.isArchived) continue;
    const siblings = children.get(thread.parentThreadId);
    if (siblings) siblings.push(thread);
    else children.set(thread.parentThreadId, [thread]);
  }

  const cards: MemberCardModel[] = [];
  for (const member of members) {
    const thread = byId.get(member.id);
    if (thread && (thread.sectionId !== sectionId || thread.parentThreadId !== null || thread.isHidden)) continue;
    const state: MemberStateInput = thread ? liveMemberState(thread) : member;
    cards.push({
      id: member.id,
      title: thread?.displayTitle || member.title || "Untitled thread",
      projectName: member.projectName,
      group: memberGroup(state),
      ...glyphFor(thread, state),
      isUnread: state.isUnread,
      archived: state.archived,
      lastActivityAt: Math.max(member.lastActivityAt, thread?.latestAttentionAt ?? 0),
      excerpt: member.excerpt,
      firstPrompt: member.firstPrompt,
      subthreads: live === null ? member.subthreads : liveRollup(member.subthreads, children.get(member.id) ?? []),
      isCurrent: member.id === currentThreadId,
    });
  }
  return cards;
}

export interface GroupLayout {
  group: MemberGroup;
  ids: string[];
}

/** Most urgent group first, most recently active member first within a group; empty groups are left out. */
export function layoutGroups(cards: readonly MemberCardModel[]): GroupLayout[] {
  const layout: GroupLayout[] = [];
  for (const group of MEMBER_GROUPS) {
    const ids = cards
      .filter((card) => card.group === group)
      .sort((a, b) => b.lastActivityAt - a.lastActivityAt || a.title.localeCompare(b.title))
      .map((card) => card.id);
    if (ids.length > 0) layout.push({ group, ids });
  }
  return layout;
}

/** A frozen layout with members that have since left the Space removed, so cards keep their place. */
export function keepLayout(frozen: readonly GroupLayout[], present: { has(id: string): boolean }): GroupLayout[] {
  return frozen
    .map((entry) => ({ group: entry.group, ids: entry.ids.filter((id) => present.has(id)) }))
    .filter((entry) => entry.ids.length > 0);
}

export function plural(count: number, one: string, many = `${one}s`): string {
  return `${count} ${count === 1 ? one : many}`;
}

export function joinNames(names: readonly string[]): string {
  if (names.length <= 1) return names[0] ?? "";
  return `${names.slice(0, -1).join(", ")} and ${names[names.length - 1]}`;
}

/** "now", "12m", "3h", "2d", "3w", "4mo", "1y". Empty for a missing timestamp. */
export function formatAge(at: number, now: number): string {
  if (!Number.isFinite(at) || at <= 0) return "";
  const minutes = Math.floor(Math.max(0, now - at) / 60_000);
  if (minutes < 1) return "now";
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d`;
  if (days < 30) return `${Math.floor(days / 7)}w`;
  if (days < 365) return `${Math.floor(days / 30)}mo`;
  return `${Math.floor(days / 365)}y`;
}

/** "3 subthreads · 1 needs you · 1 working", or null without subthreads. */
export function subthreadSummary({ total, working, needsYou }: SubthreadRollup): string | null {
  if (total <= 0) return null;
  const parts = [plural(total, "subthread")];
  if (needsYou > 0) parts.push(`${needsYou} ${needsYou === 1 ? "needs" : "need"} you`);
  if (working > 0) parts.push(`${working} working`);
  return parts.join(" · ");
}

/** "9 threads · bb, Personal, Code". */
export function spaceSubline(threadCount: number, projects: readonly string[]): string {
  return [plural(threadCount, "thread"), projects.join(", ")].filter(Boolean).join(" · ");
}
