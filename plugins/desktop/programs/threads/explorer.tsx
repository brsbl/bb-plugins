import { useState, type HTMLAttributes, type ReactNode } from "react";
import { toast } from "sonner";
import { FolderArt, GridViewGlyph, ListViewGlyph, NewThreadArt, NotePadArt, RecycleBinArt, ThreadsArt } from "../../art";
import { acceptsDrop, sortThreads, type DesktopGroup } from "../../core";
import { openNote } from "../../page/sticky-notes";
import { errorMessage, useDesktop } from "../../shell/data";
import { useDesktopEntries, type DesktopEntry } from "../../shell/desktop-entries";
import { useMenu } from "../../shell/menu";
import { groupMenu } from "../../shell/menus";
import { RECYCLE_BIN_DROP, threadDropTarget } from "../../shell/thread-drag";
import { WindowFrame, useWindowManager, type DesktopWindow } from "../../windows";
import { NavArt } from "../internet-explorer";
import { ThreadCollection } from "./collection";
import { folderSummary, groupTone } from "./status";
import { StatusDot } from "./status-ui";

/** Explorer-style windows for the Desktop, its folders, My Threads, More, and the Recycle Bin. */

/** Explorer's Back and Forward through the places this window has shown. */
function ExplorerNav({ window: desktopWindow }: { window: DesktopWindow }) {
  const manager = useWindowManager();
  const back = desktopWindow.history?.back.length ?? 0;
  const forward = desktopWindow.history?.forward.length ?? 0;
  return (
    <span className="flex flex-none items-center">
      <button type="button" className="bbd-ie-nav" aria-label="Back" title="Back" disabled={back === 0} onClick={() => manager.goBack(desktopWindow.id)}>
        <NavArt kind="back" />
      </button>
      <button type="button" className="bbd-ie-nav" aria-label="Forward" title="Forward" disabled={forward === 0} onClick={() => manager.goForward(desktopWindow.id)}>
        <NavArt kind="forward" />
      </button>
    </span>
  );
}

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
    case "pinned":
      return "Pinned threads, as in the sidebar";
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
    desktop.membersOf(group).filter(
      (thread) => needle === "" || thread.title.toLocaleLowerCase().includes(needle),
    ),
    desktop.sort.key,
    desktop.sort.direction,
  );

  return (
    <WindowFrame
      window={desktopWindow}
      title={group.name}
      icon={<FolderArt kind={group.kind} size={16} empty={desktop.membersOf(group).length === 0} />}
      statusBar={
        <>
          <span>{threads.length} threads</span>
          <span className="flex-1 truncate">{groupDescription(group)}</span>
        </>
      }
    >
      <div className="flex h-full flex-col">
        <div className="bbd-menubar flex-none">
          <ExplorerNav window={desktopWindow} />
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
          {group.kind === "machine" || group.kind === "pinned" ? null : (
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
                ? "Nothing here yet. Drag a thread onto this folder, or use Move to in a thread’s menu."
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
          <ExplorerNav window={desktopWindow} />
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
          <ExplorerNav window={desktopWindow} />
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


function ExplorerItem({ title, detail, art, view = "icons", open, ...props }: {
  title: string;
  detail: string;
  art: ReactNode;
  view?: "icons" | "list";
  open: () => void;
} & Omit<HTMLAttributes<HTMLDivElement>, "title">) {
  return (
    <div
      className={view === "icons" ? "bbd-finder-item" : "bbd-row min-h-8 grid-cols-[1fr_112px]"}
      role="button"
      tabIndex={0}
      aria-label={`${title} — ${detail}`}
      title={`${title} — ${detail}`}
      onDoubleClick={open}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          open();
        }
      }}
      {...props}
    >
      <span className={view === "icons" ? "bbd-icon-art relative" : "flex min-w-0 items-center gap-2"}>
        {art}
        {view === "list" ? <span className="truncate">{title}</span> : null}
      </span>
      {view === "icons" ? <span className="bbd-icon-label">{title}</span> : <span className="truncate text-muted-foreground">{detail}</span>}
    </div>
  );
}

function FolderItem({ group, windowId, view = "icons" }: { group: DesktopGroup; windowId: string; view?: "icons" | "list" }) {
  const desktop = useDesktop();
  const manager = useWindowManager();
  const menu = useMenu();
  // Folders take over this window; Back returns to the place they were opened from.
  const open = () => manager.navigate(windowId, { kind: "finder", key: group.key });
  const members = desktop.membersOf(group);
  const { tone, toneCount, unreadCount } = groupTone(members);
  const summary = folderSummary(group.name, members.length, tone, toneCount, unreadCount);
  return (
    <ExplorerItem
      title={group.name}
      detail={`${members.length} threads`}
      view={view}
      open={open}
      aria-label={summary}
      onContextMenu={(event) => menu.open(event, groupMenu(desktop, manager, group, open))}
      {...threadDropTarget(group)}
      art={<>
        <FolderArt kind={group.kind} empty={members.length === 0} size={view === "list" ? 20 : 40} />
        {view === "icons" ? <StatusDot members={members} /> : null}
      </>}
    />
  );
}

function DesktopItem({ entry, windowId, view }: { entry: DesktopEntry; windowId: string; view: "icons" | "list" }) {
  const desktop = useDesktop();
  const manager = useWindowManager();
  const menu = useMenu();
  if (entry.kind === "group") return <FolderItem group={entry.group} windowId={windowId} view={view} />;
  const size = view === "list" ? 20 : 40;
  const open = () => entry.kind === "note" ? openNote(entry.note.id) : manager.navigate(windowId, { kind: entry.kind });
  const detail = entry.kind === "note" ? "Note pad" : entry.kind === "more"
    ? `${desktop.moreGroups.length} folders` : `${desktop.archivedThreads.length} archived threads`;
  const art = entry.kind === "note" ? <NotePadArt size={size} /> : entry.kind === "more"
    ? <FolderArt kind="section" size={size} /> : <RecycleBinArt size={size} full={desktop.archivedThreads.length > 0} />;
  return <ExplorerItem title={entry.title} detail={detail} art={art} view={view} open={open}
    onContextMenu={(event) => menu.open(event, [{ label: "Open", run: open }])}
    {...(entry.kind === "recycle-bin" ? { "data-thread-drop": RECYCLE_BIN_DROP } : {})}
  />;
}

export function DesktopFinderWindow({ window: desktopWindow }: { window: DesktopWindow }) {
  const entries = useDesktopEntries();
  const [query, setQuery] = useState("");
  const [view, setView] = useState<"icons" | "list">("list");
  const needle = query.trim().toLocaleLowerCase();
  const visible = entries.filter((entry) => needle === "" || entry.title.toLocaleLowerCase().includes(needle));
  return (
    <WindowFrame window={desktopWindow} title="Desktop — Finder" icon={<FolderArt kind="section" size={16} />}
      statusBar={<span>{visible.length} items · double-click or press Enter to open</span>}
    >
      <div className="flex h-full flex-col">
        <div className="bbd-menubar flex-none">
          <ExplorerNav window={desktopWindow} />
          <input className="bbd-field bbd-sunken min-w-0 flex-1" placeholder="Search desktop items" aria-label="Search desktop items"
            value={query} onChange={(event) => setQuery(event.target.value)} />
          <div className="ml-auto flex flex-none gap-1">
            <button type="button" className="bbd-button bbd-bevel px-2" aria-label="Icon view" aria-pressed={view === "icons"} data-pressed={view === "icons"} onClick={() => setView("icons")}>
              <GridViewGlyph className="size-3.5" />
            </button>
            <button type="button" className="bbd-button bbd-bevel px-2" aria-label="List view" aria-pressed={view === "list"} data-pressed={view === "list"} onClick={() => setView("list")}>
              <ListViewGlyph className="size-3.5" />
            </button>
          </div>
        </div>
        <div className="bbd-sunken min-h-0 flex-1 overflow-auto">
          {visible.length === 0 ? <p className="p-6 text-center text-xs text-muted-foreground">No desktop items match “{query.trim()}”. Clear the search to see all items.</p> : (
            <div className={view === "icons" ? "bbd-finder-grid" : "py-1"} role="group" aria-label="Desktop items">
              {visible.map((entry) => <DesktopItem key={entry.key} entry={entry} windowId={desktopWindow.id} view={view} />)}
            </div>
          )}
        </div>
      </div>
    </WindowFrame>
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
      <div className="flex h-full flex-col">
        <div className="bbd-menubar flex-none">
          <ExplorerNav window={desktopWindow} />
        </div>
        <div className="bbd-sunken min-h-0 flex-1 overflow-auto">
          {desktop.moreGroups.length === 0 ? (
            <p className="p-6 text-center text-xs text-muted-foreground">
              Nothing here. Groups you move into More in the sidebar show up in this folder.
            </p>
          ) : (
            <div className="bbd-finder-grid" role="group" aria-label="Folders">
              {desktop.moreGroups.map((group) => (
                <FolderItem key={group.key} group={group} windowId={desktopWindow.id} />
              ))}
            </div>
          )}
        </div>
      </div>
    </WindowFrame>
  );
}
