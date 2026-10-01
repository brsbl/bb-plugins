import type { StatusKind } from "../../art";
import type { DesktopThread } from "../../core";

/** How thread status reads across the desktop: dots on icons, list columns, buddy rows and IM status lines. */

export function statusTone(thread: DesktopThread): "attention" | "running" | null {
  if (thread.needsInput) return "attention";
  if (thread.status === "active" || thread.status === "starting") return "running";
  return null;
}

export function groupTone(members: readonly DesktopThread[]) {
  const tones = members.map(statusTone);
  const tone = tones.includes("attention") ? "attention" : tones.includes("running") ? "running" : null;
  return {
    tone,
    toneCount: tones.filter((candidate) => candidate === tone).length,
    unread: tone === null && members.some((thread) => thread.isUnread),
  } as const;
}

export function folderSummary(
  name: string,
  total: number,
  tone: "attention" | "running" | null,
  toneCount: number,
): string {
  if (total === 0) return `${name} — empty`;
  const threads = `${total} ${total === 1 ? "thread" : "threads"}`;
  if (tone === "attention") return `${name} — ${threads}, ${toneCount} ${toneCount === 1 ? "needs" : "need"} input`;
  if (tone === "running") return `${name} — ${threads}, ${toneCount} running`;
  return `${name} — ${threads}`;
}

export function statusKind(thread: DesktopThread): StatusKind {
  if (thread.needsInput) return "attention";
  if (thread.isArchived) return "archived";
  if (thread.status === "error") return "error";
  if (thread.status === "active" || thread.status === "starting" || thread.status === "stopping") return "working";
  return "idle";
}

export function describeStatus(thread: DesktopThread): string {
  if (thread.needsInput) return "Needs input";
  if (thread.isArchived) return "Archived";
  switch (thread.status) {
    case "active":
      return "Working";
    case "starting":
      return "Starting";
    case "stopping":
      return "Stopping";
    case "pending":
      return "Scheduled";
    case "error":
      return "Error";
    default:
      return "Idle";
  }
}

export function relativeTime(timestamp: number): string {
  const seconds = Math.round((Date.now() - timestamp) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 48) return `${hours}h ago`;
  return new Date(timestamp).toLocaleDateString();
}

export function idleFor(timestamp: number): string {
  const minutes = Math.max(0, Math.round((Date.now() - timestamp) / 60_000));
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.round(minutes / 60);
  return hours < 48 ? `${hours}h` : `${Math.round(hours / 24)}d`;
}

export function typingLine(thread: DesktopThread, buddy: string): string {
  switch (statusKind(thread)) {
    case "working":
      return `${buddy} is typing...`;
    case "attention":
      return `${buddy} is waiting for your reply`;
    case "error":
      return `${buddy} hit an error`;
    case "archived":
      return `${buddy} has signed off`;
    default:
      return `${buddy} has been idle for ${idleFor(thread.updatedAt)}`;
  }
}

export function buddyRank(thread: DesktopThread): number {
  switch (statusKind(thread)) {
    case "attention":
      return 0;
    case "working":
      return 1;
    case "error":
      return 2;
    default:
      return 3;
  }
}

export function sortBuddies(threads: readonly DesktopThread[]): DesktopThread[] {
  return [...threads].sort((left, right) => buddyRank(left) - buddyRank(right) || right.updatedAt - left.updatedAt);
}
