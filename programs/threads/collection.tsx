import { useState, type MouseEvent as ReactMouseEvent, type PointerEvent as ReactPointerEvent } from "react";
import { experimental_useSidebarThreadActions as useSidebarThreadActions } from "@get-bb/plugin-sdk/app";
import { FolderArt, StatusIcon, ThreadArt } from "../../art";
import type { DesktopGroup, DesktopThread } from "../../core";
import { useDesktop } from "../../shell/data";
import { useMenu } from "../../shell/menu";
import { threadMenu } from "../../shell/menus";
import { RECYCLE_BIN_DROP, beginThreadDrag } from "../../shell/thread-drag";
import { usePointerTracker, useWindowManager } from "../../windows";
import { describeStatus, relativeTime, statusKind } from "./status";
import { ThreadGlyph, threadTooltip } from "./status-ui";

/** Threads as icons or a detail list, shared by every explorer window. Items drag onto folders and the Recycle Bin. */
export function ThreadCollection({
  threads,
  group,
  view,
  emptyText,
  showFolders = false,
}: {
  threads: DesktopThread[];
  group: DesktopGroup | null;
  view: "icons" | "list";
  emptyText: string;
  showFolders?: boolean;
}) {
  const desktop = useDesktop();
  const manager = useWindowManager();
  const actions = useSidebarThreadActions();
  const track = usePointerTracker();
  const menu = useMenu();
  const [selected, setSelected] = useState<string | null>(null);

  if (threads.length === 0) {
    return <p className="p-6 text-center text-xs text-muted-foreground">{emptyText}</p>;
  }

  const itemProps = (thread: DesktopThread) => ({
    draggable: false,
    onPointerDown: (event: ReactPointerEvent<HTMLElement>) => {
      if (event.button !== 0 || event.isPrimary === false) return;
      setSelected(thread.id);
      beginThreadDrag(event, thread.title, track, (key) => {
        if (key === RECYCLE_BIN_DROP) {
          if (!thread.isArchived) desktop.archiveThread(thread.id);
          return;
        }
        const destination = desktop.groupByKey.get(key);
        if (destination) void desktop.dropThread(destination, {
          threadId: thread.id, fromFolderId: group?.kind === "folder" ? group.folder.id : null,
        });
      });
    },
    onClick: () => setSelected(thread.id),
    onDoubleClick: () => desktop.openThread(thread.id),
    onKeyDown: (event: { key: string }) => {
      if (event.key === "Enter") desktop.openThread(thread.id);
    },
    onContextMenu: (event: ReactMouseEvent) => {
      setSelected(thread.id);
      menu.open(event, threadMenu(desktop, manager, actions, thread, group));
    },
    tabIndex: 0,
    role: "option",
  });

  if (view === "icons") {
    return (
      <div className="bbd-finder-grid" role="listbox" aria-label="Threads">
        {threads.map((thread) => (
          <div key={thread.id} className="bbd-finder-item" title={threadTooltip(desktop, thread)} {...itemProps(thread)}>
            <ThreadGlyph thread={thread} />
            <span className="bbd-icon-label">{thread.title}</span>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div role="listbox" aria-label="Threads" className="py-1">
      <div className="bbd-row grid-cols-[1fr_112px_80px] font-semibold text-muted-foreground">
        <span>Name</span>
        <span>Status</span>
        <span>{desktop.sort.key === "created" ? "Created" : "Updated"}</span>
      </div>
      {threads.map((thread) => (
        <div key={thread.id} className="bbd-row grid-cols-[1fr_112px_80px]" title={threadTooltip(desktop, thread)} {...itemProps(thread)}>
          <span className="flex min-w-0 items-center gap-2">
            <ThreadArt size={16} archived={thread.isArchived} />
            <span className="flex min-w-0 flex-col">
              <span className={`truncate ${thread.isUnread ? "font-semibold" : ""}`}>{thread.title}</span>
              {showFolders && desktop.foldersOf(thread.id).length > 0 ? (
                <span className="bbd-row-folders flex min-w-0 items-center gap-1">
                  <FolderArt kind="section" size={12} />
                  <span className="truncate">{desktop.foldersOf(thread.id).join(", ")}</span>
                </span>
              ) : null}
            </span>
          </span>
          <span className="flex min-w-0 items-center gap-1.5">
            <StatusIcon kind={statusKind(thread)} />
            <span className="truncate">{describeStatus(thread)}</span>
          </span>
          <span className="truncate tabular-nums">
            {relativeTime(desktop.sort.key === "created" ? thread.createdAt : thread.updatedAt)}
          </span>
        </div>
      ))}
    </div>
  );
}
