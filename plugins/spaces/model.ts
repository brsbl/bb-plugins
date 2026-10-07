// Pure Spaces rules: who is a member, how a member reads, and the text agents and the CLI see. No SDK calls, so
// tests can exercise every rule without a host.

import type { BbPluginApi } from "@get-bb/plugin-sdk";

import type { Candidate, SpaceMember, SpaceSnapshot } from "./contract";
import { MEMBER_GROUP_LABELS, MEMBER_GROUPS, memberGroup, plainExcerpt } from "./shared";

/** One row of `bb.sdk.threads.list`, the only thread read a snapshot needs. */
export type ThreadRow = Awaited<ReturnType<BbPluginApi["sdk"]["threads"]["list"]>>[number];

/** The fields membership rules read, which `threads.get` also returns for threads outside the live list. */
export type ThreadPlacement = Pick<
  ThreadRow,
  "id" | "parentThreadId" | "visibility" | "sectionId" | "archivedAt" | "deletedAt"
>;

export const MEMBER_INSTRUCTION_MAX = 300;
export const MENTION_CONTEXT_MAX = 3_000;
export const ROSTER_EXCERPT_MAX = 140;
/** How far back a handoff still counts as "talked with this Space". */
export const HANDOFF_WINDOW_MS = 14 * 24 * 60 * 60 * 1000;
const SUGGESTED_LIMIT = 20;
const OTHERS_LIMIT = 30;

/** bb's runtime states that count as running a turn (thread-list `isRuntimeBusyThread`). */
const BUSY_RUNTIME_STATUSES: ReadonlySet<string> = new Set(["active", "provisioning", "starting", "stopping"]);

export function clip(text: string, max: number): string {
  const single = text.replace(/\s+/gu, " ").trim();
  return single.length <= max ? single : `${single.slice(0, max - 1).trimEnd()}…`;
}

export function countText(count: number): string {
  return `${count} ${count === 1 ? "thread" : "threads"}`;
}

/** bb's own title fallback chain (`getThreadDisplayTitle`). */
export function threadTitle(row: Pick<ThreadRow, "id" | "title" | "titleFallback">): string {
  if (row.title && row.title.trim().length > 0) return row.title;
  if (row.titleFallback && row.titleFallback.trim().length > 0) return row.titleFallback;
  return `Thread ${row.id.slice(0, 8)}`;
}

/**
 * bb's sidebar `isUnread` (`!isThreadRead`): attention newer than the last read. The live panel reads the same
 * field from the sidebar, and `memberGroup()` checks running first, so a working thread never sorts as new.
 */
export function isUnreadRow(row: Pick<ThreadRow, "lastReadAt" | "latestAttentionAt">): boolean {
  return (row.lastReadAt ?? 0) < row.latestAttentionAt;
}

/** Running a turn: bb's busy runtime statuses (thread-list `isRuntimeBusyThread`), as the live panel reads them. */
export function isRunningRow(row: Pick<ThreadRow, "runtime">): boolean {
  return BUSY_RUNTIME_STATUSES.has(row.runtime.displayStatus);
}

/** Hidden threads (workflow workers and the like) and subthreads are never members. */
export function isTopLevelVisible(row: ThreadPlacement): boolean {
  return row.parentThreadId === null && row.visibility === "visible" && row.deletedAt === null;
}

/** The Space a live thread belongs to, or null. Archived threads are listed in their Space but aren't live members. */
export function liveSpaceOf(row: ThreadPlacement, isSpace: (sectionId: string) => boolean): string | null {
  if (!isTopLevelVisible(row) || row.archivedAt !== null || row.sectionId === null) return null;
  return isSpace(row.sectionId) ? row.sectionId : null;
}

export function lastActivityAt(row: Pick<ThreadRow, "updatedAt" | "latestAttentionAt">): number {
  return Math.max(row.updatedAt, row.latestAttentionAt);
}

export function childrenByParent(rows: readonly ThreadRow[]): Map<string, ThreadRow[]> {
  const children = new Map<string, ThreadRow[]>();
  for (const row of rows) {
    if (row.parentThreadId === null || row.visibility !== "visible" || row.archivedAt !== null) continue;
    const siblings = children.get(row.parentThreadId);
    if (siblings) siblings.push(row);
    else children.set(row.parentThreadId, [row]);
  }
  return children;
}

export function subthreadRollup(children: readonly ThreadRow[]): SpaceMember["subthreads"] {
  let working = 0;
  let needsYou = 0;
  for (const child of children) {
    if (isRunningRow(child)) working += 1;
    if (child.hasPendingInteraction) needsYou += 1;
  }
  return { total: children.length, working, needsYou };
}

export function toMember(
  row: ThreadRow,
  details: { projectName: string | null; excerpt: string | null; children: readonly ThreadRow[] },
): SpaceMember {
  const archived = row.archivedAt !== null;
  const state = {
    archived,
    hasPendingInteraction: row.hasPendingInteraction,
    failed: row.status === "error",
    running: !archived && isRunningRow(row),
    isUnread: isUnreadRow(row),
  };
  return {
    id: row.id,
    title: threadTitle(row),
    projectId: row.projectId,
    projectName: details.projectName,
    group: memberGroup(state),
    isUnread: state.isUnread,
    hasPendingInteraction: state.hasPendingInteraction,
    failed: state.failed,
    running: state.running,
    archived,
    lastActivityAt: lastActivityAt(row),
    excerpt: details.excerpt,
    // bb derives the title fallback from the first prompt, already collapsed to one line.
    firstPrompt: details.excerpt === null && row.titleFallback ? plainExcerpt(row.titleFallback) || null : null,
    subthreads: subthreadRollup(details.children),
  };
}

/** Most urgent group first, then the most recently active member. */
export function sortMembers(members: readonly SpaceMember[]): SpaceMember[] {
  return [...members].sort(
    (left, right) =>
      MEMBER_GROUPS.indexOf(left.group) - MEMBER_GROUPS.indexOf(right.group) ||
      right.lastActivityAt - left.lastActivityAt ||
      left.id.localeCompare(right.id),
  );
}

/** Distinct project names across live members, most members first. */
export function rankProjects(members: readonly SpaceMember[]): string[] {
  const counts = new Map<string, number>();
  for (const member of members) {
    if (member.archived || member.projectName === null) continue;
    counts.set(member.projectName, (counts.get(member.projectName) ?? 0) + 1);
  }
  return [...counts.entries()]
    .sort(([leftName, left], [rightName, right]) => right - left || leftName.localeCompare(rightName))
    .map(([name]) => name);
}

export function toExcerpt(output: string | null | undefined): string | null {
  if (!output) return null;
  return plainExcerpt(output) || null;
}

/** "needs you", "working", "new output", "idle", or "archived", noting a failure the group doesn't already say. */
export function memberState(member: Pick<SpaceMember, "group" | "failed">): string {
  const label = MEMBER_GROUP_LABELS[member.group].toLowerCase();
  return member.failed && member.group !== "needs-you" ? `${label}, failed` : label;
}

/** One roster line: `<id> · <state> · <title> — <latest output>`. Shared by the mention context and the CLI. */
export function rosterLine(member: SpaceMember): string {
  const { total, working, needsYou } = member.subthreads;
  const rollup = total === 0
    ? ""
    : ` (${countText(total).replace("thread", "subthread")}${working > 0 ? `, ${working} working` : ""}${needsYou > 0 ? `, ${needsYou} need${needsYou === 1 ? "s" : ""} you` : ""})`;
  const output = member.excerpt
    ? clip(member.excerpt, ROSTER_EXCERPT_MAX)
    : member.firstPrompt
      ? `no output yet; asked: ${clip(member.firstPrompt, 100)}`
      : "no output yet";
  return `${member.id} · ${memberState(member)} · ${clip(member.title, 80)}${rollup} — ${output}`;
}

/** How agents name a Space in a command: its name when that is safe to paste in double quotes, else its section ID. */
export function spaceRef(space: { name: string; sectionId: string }): string {
  return /^[^"`$\\!\n]{1,40}$/u.test(space.name) ? `"${space.name}"` : space.sectionId;
}

/** The one line each member's session gets when members know their Space. */
export function memberInstruction(space: { name: string; sectionId: string }, otherMembers: number): string {
  const name = JSON.stringify(clip(space.name, 48));
  const command = `bb space status ${spaceRef(space)}`;
  const text = otherMembers > 0
    ? `This thread is in the Space ${name} with ${countText(otherMembers).replace(/^(\d+) /, "$1 other ")}. Run \`${command}\` to see their status and latest output.`
    : `This thread is in the Space ${name}, with no other threads yet. Run \`${command}\` to see the threads that join it.`;
  return clip(
    `${text} To message one, use \`bb thread tell <id> --mode queue\`. Don't send status pings.`,
    MEMBER_INSTRUCTION_MAX,
  );
}

/** Agent-only context for an @-mentioned Space: the roster, most urgent first, and the two command hints. */
export function mentionContext(snapshot: SpaceSnapshot): string {
  const live = snapshot.members.filter((member) => !member.archived);
  const ref = spaceRef(snapshot);
  const projects = snapshot.projects.length > 0 ? ` from ${clip(snapshot.projects.slice(0, 5).join(", "), 120)}` : "";
  const head = `The user mentioned the Space ${JSON.stringify(clip(snapshot.name, 120))} (section ${snapshot.sectionId}): ${countText(live.length)}${projects}. Each line is ID · state · title — latest output.`;
  const tail = [
    `Run \`bb space status ${ref}\` for fresher state later in this turn.`,
    "To message a member, use `bb thread tell <id> --mode queue` so a running thread gets it after its turn. Message only the members this request concerns, and don't send status pings.",
  ].join("\n");
  const lines = [head];
  let used = head.length + 1 + tail.length;
  let shown = 0;
  for (const member of live) {
    const line = rosterLine(member);
    // Keep room for the "…and N more" line whenever a member could still be left out.
    const reserve = shown + 1 < live.length ? 90 : 0;
    if (used + line.length + 1 + reserve > MENTION_CONTEXT_MAX) break;
    lines.push(line);
    used += line.length + 1;
    shown += 1;
  }
  if (shown < live.length) lines.push(`…and ${live.length - shown} more; run \`bb space status ${ref}\` to see them.`);
  if (live.length === 0) lines.push("It has no live members yet.");
  lines.push(tail);
  return lines.join("\n");
}

/** `bb space status`: a header, then one roster line per live member. */
export function statusText(snapshot: SpaceSnapshot, maxLines = 200): string {
  const live = snapshot.members.filter((member) => !member.archived);
  const archived = snapshot.members.length - live.length;
  const projects = snapshot.projects.length > 0 ? ` · ${snapshot.projects.join(", ")}` : "";
  const lines = [`${snapshot.name} · ${snapshot.sectionId} · ${countText(live.length)}${projects}`];
  if (live.length === 0) lines.push("No live members. Add threads with `bb space add <thread…> --space <space>`.");
  for (const member of live.slice(0, maxLines)) lines.push(rosterLine(member));
  if (live.length > maxLines) lines.push(`…and ${live.length - maxLines} more. Use --json for every member.`);
  if (archived > 0) lines.push(`Archived: ${archived}. Use --json to list them.`);
  if (snapshot.organizer === "outdated") {
    lines.push("This Thread Organizer doesn't know about Spaces, so finished members still move to Agent Inbox. Update Thread Organizer.");
  }
  return `${lines.join("\n")}\n`;
}

/**
 * Threads to offer in the Add threads picker. Suggestions are handoffs to or from a member in the last 14 days.
 * Known gap: threads that told or @-mentioned a member aren't suggested yet, because bb has no cheap way to read
 * thread-to-thread messages without scanning every timeline.
 */
export function buildCandidates(input: {
  sectionId: string;
  live: readonly ThreadRow[];
  archivedMembers: readonly ThreadRow[];
  query: string | undefined;
  now: number;
  projectName: (projectId: string) => string | null;
  sectionName: (sectionId: string | null) => string | null;
}): { suggested: Candidate[]; others: Candidate[] } {
  const members = [
    ...input.live.filter((row) => isTopLevelVisible(row) && row.sectionId === input.sectionId),
    ...input.archivedMembers,
  ];
  const memberById = new Map(members.map((member) => [member.id, member]));
  const since = input.now - HANDOFF_WINDOW_MS;
  const query = input.query?.trim().toLowerCase() ?? "";
  const eligible = input.live
    .filter((row) => isTopLevelVisible(row) && row.archivedAt === null && row.sectionId !== input.sectionId)
    .filter((row) => query === "" || threadTitle(row).toLowerCase().includes(query))
    .sort((left, right) => lastActivityAt(right) - lastActivityAt(left));

  const candidate = (row: ThreadRow, reason: string | null): Candidate => ({
    id: row.id,
    title: threadTitle(row),
    projectName: input.projectName(row.projectId),
    sectionName: input.sectionName(row.sectionId),
    reason,
  });
  const handoffReason = (row: ThreadRow): string | null => {
    const source = row.sourceThreadId === null ? undefined : memberById.get(row.sourceThreadId);
    if (source && row.createdAt >= since) return `handed off from ${clip(threadTitle(source), 60)}`;
    const successor = members.find((member) => member.sourceThreadId === row.id && member.createdAt >= since);
    return successor ? `handed off to ${clip(threadTitle(successor), 60)}` : null;
  };

  const suggested: Candidate[] = [];
  const others: Candidate[] = [];
  for (const row of eligible) {
    const reason = handoffReason(row);
    if (reason !== null) {
      if (suggested.length < SUGGESTED_LIMIT) suggested.push(candidate(row, reason));
    } else if (others.length < OTHERS_LIMIT) {
      others.push(candidate(row, null));
    }
  }
  return { suggested, others };
}

/** The sidebar's hidden groups with one key added or removed, leaving every other entry as it was. */
export function withHiddenGroup(hidden: readonly string[], key: string, hide: boolean): string[] {
  if (!hide) return hidden.filter((entry) => entry !== key);
  return hidden.includes(key) ? [...hidden] : [...hidden, key];
}
