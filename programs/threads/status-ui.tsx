import { LoadingGlyph, ThreadArt } from "../../art";
import type { DesktopThread } from "../../core";
import type { DesktopContextValue } from "../../shell/data";
import { groupTone, statusTone } from "./status";

/** In progress spins like bb's own loading icon and is never counted; only waiting on you carries a number. */
function RunningMark() {
  return (
    <span className="bbd-dot" data-tone="running" aria-hidden>
      <LoadingGlyph className="bbd-dot-spinner" strokeWidth={2.5} />
    </span>
  );
}

export function ThreadGlyph({ thread }: { thread: DesktopThread }) {
  const tone = statusTone(thread);
  return (
    <span className="bbd-icon-art">
      <ThreadArt archived={thread.isArchived} />
      {tone === "running" ? (
        <RunningMark />
      ) : tone !== null ? (
        <span className="bbd-dot" data-tone={tone} aria-hidden />
      ) : thread.isUnread ? (
        <span className="bbd-dot" data-tone="unread" aria-hidden />
      ) : null}
    </span>
  );
}

export function StatusDot({ members }: { members: readonly DesktopThread[] }) {
  const { tone, toneCount, unreadCount } = groupTone(members);
  if (tone === "running") return <RunningMark />;
  if (tone !== null) {
    return (
      <span className="bbd-dot" data-tone={tone} aria-hidden>
        {toneCount}
      </span>
    );
  }
  return unreadCount > 0 ? (
    <span className="bbd-dot" data-tone="unread" aria-hidden>
      {unreadCount}
    </span>
  ) : null;
}

export function threadTooltip(desktop: DesktopContextValue, thread: DesktopThread): string {
  const folders = desktop.foldersOf(thread.id);
  return folders.length === 0 ? thread.title : `${thread.title}\nIn ${folders.join(", ")}`;
}
