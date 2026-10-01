import { ThreadArt } from "../../art";
import type { DesktopThread } from "../../core";
import type { DesktopContextValue } from "../../shell/data";
import { groupTone, statusTone } from "./status";

export function ThreadGlyph({ thread }: { thread: DesktopThread }) {
  const tone = statusTone(thread);
  return (
    <span className="bbd-icon-art">
      <ThreadArt archived={thread.isArchived} />
      {tone !== null ? (
        <span className="bbd-dot" data-tone={tone} aria-hidden />
      ) : thread.isUnread ? (
        <span className="bbd-dot" data-tone="running" style={{ animation: "none" }} aria-hidden />
      ) : null}
    </span>
  );
}

export function StatusDot({ members }: { members: readonly DesktopThread[] }) {
  const { tone, toneCount, unread } = groupTone(members);
  if (tone !== null) {
    return (
      <span className="bbd-dot" data-tone={tone} aria-hidden>
        {toneCount > 1 ? toneCount : null}
      </span>
    );
  }
  return unread ? <span className="bbd-dot" data-tone="running" style={{ animation: "none" }} aria-hidden /> : null;
}

export function threadTooltip(desktop: DesktopContextValue, thread: DesktopThread): string {
  const folders = desktop.foldersOf(thread.id);
  return folders.length === 0 ? thread.title : `${thread.title}\nIn ${folders.join(", ")}`;
}
