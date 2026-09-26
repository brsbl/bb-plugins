import { useState } from "react";
import { toast } from "sonner";
import { FolderArt, GridViewGlyph, ListViewGlyph, NewThreadArt, RecycleBinArt, ThreadsArt } from "../../art";
import { acceptsDrop, groupThreads, sortThreads, type DesktopGroup } from "../../core";
import { errorMessage, useDesktop } from "../../shell/data";
import { useMenu } from "../../shell/menu";
import { groupMenu } from "../../shell/menus";
import { threadDropTarget } from "../../shell/thread-drag";
import { WindowFrame, useWindowManager, type DesktopWindow } from "../../windows";
import { ThreadCollection } from "./collection";
import { folderSummary, groupTone } from "./status";
import { StatusDot } from "./status-ui";

/** Explorer-style windows that list threads: a folder, My Threads, More, and the Recycle Bin. */

function groupDescription(group: DesktopGroup): string {
  switch (group.kind) {
    case "folder":
      return group.folder.hideFromSidebar
        ? "Desktop folder · its threads are hidden from the sidebar"
        : "Desktop folder · drag threads here to file them";
    case "section":
      return group.id === null
        ? "Threads outside any section · drag threads here to unfile them"
        : "Sidebar section · drag threads here to move them";
    case "project":
      return "Project";
    case "machine":
      return "Machine";
  }
}

export function FinderWindow({ window: desktopWindow, groupKey }: { window: DesktopWindow; groupKey: string }) {
  const desktop = useDesktop();
  const manager = useWindowManager();
  const group = desktop.groupByKey.get(groupKey) ?? null;
  const [query, setQuery] = useState("");
  const [view, setView] = useState<"icons" | "list">("icons");

  if (group === null) {
    return (
      <WindowFrame window={desktopWindow} title="Folder" icon={<FolderArt kind="section" size={16} />}>
        <p className="p-6 text-center text-xs text-muted-foreground">
          This folder isn’t part of the current organization. Switch Organize by from the desktop’s right-click menu to
          see it again.
        </p>
      </WindowFrame>
    );
  }

  const needle = query.trim().toLocaleLowerCase();
  const threads = sortThreads(
    groupThreads(group, desktop.visibleThreads).filter(
      (thread) => needle === "" || thread.title.toLocaleLowerCase().includes(needle),
    ),
    desktop.sort.key,
    desktop.sort.direction,
  );

  return (
    <WindowFrame
      window={desktopWindow}
      title={group.name}
      icon={<FolderArt kind={group.kind} size={16} empty={groupThreads(group, desktop.visibleThreads).length === 0} />}
      statusBar={
        <>
          <span>{threads.length} threads</span>
          <span className="flex-1 truncate">{groupDescription(group)}</span>
        </>
      }
    >
      <div className="flex h-full flex-col">
        <div className="bbd-menubar flex-none">
          <input
            className="bbd-field bbd-sunken w-36 min-w-16 shrink-[4]"
            placeholder="Search"
            aria-label="Search this folder"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
          {group.kind === "folder" ? (
            <label className="flex flex-none items-center gap-1 text-xs whitespace-nowrap">
              <input
                type="checkbox"
                checked={group.folder.hideFromSidebar}
                onChange={(event) =>
                  void desktop
                    .call("updateFolder", { id: group.folder.id, hideFromSidebar: event.target.checked })
                    .catch((error) => toast.error(errorMessage(error)))
                }
              />
              Hide from sidebar
            </label>
          ) : null}
          {group.kind === "machine" ? null : (
            <button
              type="button"
              className="bbd-button bbd-bevel flex-none"
              onClick={() => manager.open({ kind: "new-thread", groupKey: group.key })}
            >
              <NewThreadArt size={16} /> New thread
            </button>
          )}
          <div className="ml-auto flex flex-none gap-1">
            <button type="button" className="bbd-button bbd-bevel px-2" aria-label="Icon view" data-pressed={view === "icons"} onClick={() => setView("icons")}>
              <GridViewGlyph className="size-3.5" />
            </button>
            <button type="button" className="bbd-button bbd-bevel px-2" aria-label="List view" data-pressed={view === "list"} onClick={() => setView("list")}>
              <ListViewGlyph className="size-3.5" />
            </button>
          </div>
        </div>
        <div className="bbd-sunken min-h-0 flex-1 overflow-auto" {...threadDropTarget(group)}>
          <ThreadCollection
            threads={threads}
            group={group}
            view={view}
            emptyText={
              acceptsDrop(group)
                ? "Nothing here. Drag threads in from another folder or My Threads."
                : "No threads here."
            }
          />
        </div>
      </div>
    </WindowFrame>
  );
}

export function ThreadsWindow({ window: desktopWindow }: { window: DesktopWindow }) {
  const desktop = useDesktop();
  const [query, setQuery] = useState("");
  const needle = query.trim().toLocaleLowerCase();
  const threads = sortThreads(
    desktop.visibleThreads.filter(
      (thread) => needle === "" || thread.title.toLocaleLowerCase().includes(needle),
    ),
    desktop.sort.key,
    desktop.sort.direction,
  );
  return (
    <WindowFrame
      window={desktopWindow}
      title="My Threads"
      icon={<ThreadsArt size={16} />}
      statusBar={<span className="flex-1">{threads.length} threads · drag onto a folder to file</span>}
    >
      <div className="flex h-full flex-col">
        <div className="bbd-menubar flex-none">
          <input
            className="bbd-field bbd-sunken min-w-0 flex-1"
            placeholder="Search threads"
            aria-label="Search threads"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
        </div>
        <div className="bbd-sunken min-h-0 flex-1 overflow-auto">
          <ThreadCollection threads={threads} group={null} view="list" emptyText="No threads." showFolders />
        </div>
      </div>
    </WindowFrame>
  );
}

export function RecycleBinWindow({ window: desktopWindow }: { window: DesktopWindow }) {
  const desktop = useDesktop();
  const [query, setQuery] = useState("");
  const needle = query.trim().toLocaleLowerCase();
  const threads = sortThreads(
    desktop.archivedThreads.filter(
      (thread) => needle === "" || thread.title.toLocaleLowerCase().includes(needle),
    ),
    desktop.sort.key,
    desktop.sort.direction,
  );
  return (
    <WindowFrame
      window={desktopWindow}
      title="Recycle Bin"
      icon={<RecycleBinArt size={16} full={desktop.archivedThreads.length > 0} />}
      statusBar={
        <span className="flex-1 truncate">
          {threads.length} archived threads · right-click to restore, or drag onto a folder
        </span>
      }
    >
      <div className="flex h-full flex-col">
        <div className="bbd-menubar flex-none">
          <input
            className="bbd-field bbd-sunken min-w-0 flex-1"
            placeholder="Search archived threads"
            aria-label="Search archived threads"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
        </div>
        <div className="bbd-sunken min-h-0 flex-1 overflow-auto">
          <ThreadCollection
            threads={threads}
            group={null}
            view="list"
            emptyText="The Recycle Bin is empty. Drag a thread here to archive it."
          />
        </div>
      </div>
    </WindowFrame>
  );
}


function MoreFolderItem({ group }: { group: DesktopGroup }) {
  const desktop = useDesktop();
  const manager = useWindowManager();
  const menu = useMenu();
  const open = () => manager.open({ kind: "finder", key: group.key });
  const members = groupThreads(group, desktop.visibleThreads);
  const { tone, toneCount } = groupTone(members);
  const summary = folderSummary(group.name, members.length, tone, toneCount);
  return (
    <div
      className="bbd-finder-item"
      role="option"
      tabIndex={0}
      aria-selected={false}
      aria-label={summary}
      title={summary}
      onDoubleClick={open}
      onKeyDown={(event) => {
        if (event.key === "Enter") open();
      }}
      onContextMenu={(event) => menu.open(event, groupMenu(desktop, manager, group, open))}
      {...threadDropTarget(group)}
    >
      <span className="bbd-icon-art relative">
        <FolderArt kind={group.kind} empty={members.length === 0} />
        <StatusDot members={members} />
      </span>
      <span className="bbd-icon-label">{group.name}</span>
    </div>
  );
}

export function MoreWindow({ window: desktopWindow }: { window: DesktopWindow }) {
  const desktop = useDesktop();
  return (
    <WindowFrame
      window={desktopWindow}
      title="More"
      icon={<FolderArt kind="section" size={16} empty={desktop.moreGroups.length === 0} />}
      statusBar={
        <span className="flex-1 truncate">
          {desktop.moreGroups.length} folders · the groups you moved into More in the sidebar
        </span>
      }
    >
      <div className="bbd-sunken h-full overflow-auto">
        {desktop.moreGroups.length === 0 ? (
          <p className="p-6 text-center text-xs text-muted-foreground">
            Nothing here. Groups you move into More in the sidebar show up in this folder.
          </p>
        ) : (
          <div className="bbd-finder-grid" role="listbox" aria-label="Folders">
            {desktop.moreGroups.map((group) => (
              <MoreFolderItem key={group.key} group={group} />
            ))}
          </div>
        )}
      </div>
    </WindowFrame>
  );
}

