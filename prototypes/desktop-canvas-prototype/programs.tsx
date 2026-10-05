import { memo, useState, type MouseEvent as ReactMouseEvent, type PointerEvent as ReactPointerEvent, type ReactNode } from "react";
import { toast } from "sonner";
import {
  experimental_Icon as Icon,
  experimental_NewThreadComposer as NewThreadComposer,
  experimental_useSidebarThreadActions as useSidebarThreadActions,
  ThreadChat,
  type NewThreadRequest,
} from "@get-bb/plugin-sdk/app";
import { RECYCLE_BIN_DROP, beginThreadDrag, groupMenu, threadDropTarget, threadMenu, type MenuContext } from "./actions";
import { Button } from "./components/ui/button";
import { acceptsDrop, describeStatus, folderSummary, groupTone, relativeTime, sortThreads, statusTone, type DesktopGroup, type DesktopThread } from "./core";
import { errorMessage, useDesktop } from "./data";
import { useAskText, useMenu } from "./menu";
import { WindowFrame, usePointerTracker, useWindowManager, type DesktopWindow, type WindowSpec } from "./windows";

/** Every window the canvas opens, Desktop's programs without the Windows XP skin. */

export function groupIcon(group: DesktopGroup): string {
  switch (group.kind) {
    case "folder":
      return "Folder02";
    case "pinned":
      return "Pin";
    case "project":
      return "FolderGit";
    case "machine":
      return "Laptop";
    case "section":
      return "Folder";
  }
}

function useMenuContext(): MenuContext {
  return { desktop: useDesktop(), manager: useWindowManager(), actions: useSidebarThreadActions(), ask: useAskText() };
}

/** A folder's state, shown once on its icon: who needs you, who is working, or how many are unread. */
export function StatusDot({ members }: { members: readonly DesktopThread[] }) {
  const { tone, toneCount, unreadCount } = groupTone(members);
  if (tone === "attention") return <span className="cdc-dot" data-tone="attention">{toneCount}</span>;
  if (tone === "running") return <span className="cdc-dot" data-tone="running"><Icon name="Loading" /></span>;
  if (unreadCount > 0) return <span className="cdc-dot" data-tone="unread">{unreadCount}</span>;
  return null;
}

function ThreadStatus({ thread }: { thread: DesktopThread }) {
  const tone = statusTone(thread);
  return (
    <span className="cdc-thread-status" data-tone={tone ?? (thread.status === "error" ? "error" : thread.isArchived ? "archived" : "idle")}>
      {tone === "running" ? <Icon name="Loading" /> : <span className="cdc-status-pip" />}
      <span>{describeStatus(thread)}</span>
    </span>
  );
}

function Nav({ window: desktopWindow }: { window: DesktopWindow }) {
  const manager = useWindowManager();
  const back = desktopWindow.history?.back.length ?? 0;
  const forward = desktopWindow.history?.forward.length ?? 0;
  return (
    <span className="cdc-nav">
      <button type="button" className="cdc-tool" aria-label="Back" title="Back" disabled={back === 0} onClick={() => manager.goBack(desktopWindow.id)}><Icon name="ChevronLeft" /></button>
      <button type="button" className="cdc-tool" aria-label="Forward" title="Forward" disabled={forward === 0} onClick={() => manager.goForward(desktopWindow.id)}><Icon name="ChevronRight" /></button>
    </span>
  );
}

function Search({ value, onChange, label }: { value: string; onChange: (value: string) => void; label: string }) {
  return (
    <label className="cdc-search">
      <Icon name="Search" />
      <input aria-label={label} placeholder="Search" value={value} onChange={(event) => onChange(event.target.value)} />
    </label>
  );
}

function ViewToggle({ view, onChange }: { view: "icons" | "list"; onChange: (view: "icons" | "list") => void }) {
  return (
    <span className="cdc-segmented" role="group" aria-label="View">
      <button type="button" className="cdc-tool" aria-label="Icon view" title="Icon view" aria-pressed={view === "icons"} onClick={() => onChange("icons")}><Icon name="GridView" /></button>
      <button type="button" className="cdc-tool" aria-label="List view" title="List view" aria-pressed={view === "list"} onClick={() => onChange("list")}><Icon name="ListView" /></button>
    </span>
  );
}

const matches = (needle: string) => (thread: DesktopThread) => needle === "" || thread.title.toLocaleLowerCase().includes(needle);

/** Threads as icons or a detail list. Items drag onto folders and the Recycle Bin; their menu offers the same moves. */
function ThreadCollection({ threads, group, view, empty, showFolders = false }: {
  threads: DesktopThread[];
  group: DesktopGroup | null;
  view: "icons" | "list";
  empty: ReactNode;
  showFolders?: boolean;
}) {
  const context = useMenuContext();
  const { desktop } = context;
  const track = usePointerTracker();
  const menu = useMenu();
  const [selected, setSelected] = useState<string | null>(null);

  if (threads.length === 0) return <div className="cdc-empty">{empty}</div>;

  const itemProps = (thread: DesktopThread) => ({
    role: "option" as const,
    tabIndex: 0,
    "aria-selected": selected === thread.id,
    title: `${thread.title} — ${describeStatus(thread)}`,
    onPointerDown: (event: ReactPointerEvent<HTMLElement>) => {
      if (event.button !== 0 || event.isPrimary === false) return;
      setSelected(thread.id);
      beginThreadDrag(event, thread.title, track, (key) => {
        if (key === RECYCLE_BIN_DROP) {
          if (!thread.isArchived) desktop.archiveThread(thread.id);
          return;
        }
        const destination = desktop.groupByKey.get(key);
        if (destination) void desktop.dropThread(destination, { threadId: thread.id, fromFolderId: group?.kind === "folder" ? group.folder.id : null });
      });
    },
    onDoubleClick: () => desktop.openThread(thread.id),
    onKeyDown: (event: { key: string; preventDefault: () => void }) => {
      if (event.key === "Enter") {
        event.preventDefault();
        desktop.openThread(thread.id);
      }
    },
    onContextMenu: (event: ReactMouseEvent) => {
      setSelected(thread.id);
      menu.open(event, threadMenu(context, thread, group));
    },
  });

  if (view === "icons") {
    return (
      <div className="cdc-file-grid" role="listbox" aria-label="Threads">
        {threads.map((thread) => (
          <div key={thread.id} className="cdc-file-icon" {...itemProps(thread)}>
            <span className="cdc-file-art">
              <Icon name="MessageSquare" />
              {statusTone(thread) === "attention" ? <span className="cdc-dot" data-tone="attention">!</span>
                : statusTone(thread) === "running" ? <span className="cdc-dot" data-tone="running"><Icon name="Loading" /></span>
                : thread.isUnread ? <span className="cdc-dot" data-tone="unread" /> : null}
            </span>
            <span className="cdc-file-label">{thread.title}</span>
          </div>
        ))}
      </div>
    );
  }

  const dateKey = desktop.sort.key === "created" ? "createdAt" : "updatedAt";
  return (
    <div className="cdc-list" role="listbox" aria-label="Threads">
      <div className="cdc-row cdc-row-head" aria-hidden>
        <span>Name</span>
        <span>Status</span>
        <span>{dateKey === "createdAt" ? "Created" : "Updated"}</span>
      </div>
      {threads.map((thread) => (
        <div key={thread.id} className="cdc-row" data-unread={thread.isUnread || undefined} {...itemProps(thread)}>
          <span className="cdc-row-name">
            <Icon name="MessageSquare" />
            <span>
              <span className="cdc-row-title">{thread.title}</span>
              {showFolders && desktop.foldersOf(thread.id).length > 0 ? <small>{desktop.foldersOf(thread.id).join(", ")}</small> : null}
            </span>
          </span>
          <ThreadStatus thread={thread} />
          <span className="cdc-row-date">{relativeTime(thread[dateKey])}</span>
        </div>
      ))}
    </div>
  );
}

function groupDescription(group: DesktopGroup): string {
  switch (group.kind) {
    case "folder":
      return "Desktop folder · drag threads here to file them";
    case "section":
      return group.id === null ? "Threads outside any section" : "Sidebar section · drag threads here to move them";
    case "pinned":
      return "Pinned threads, as in the sidebar";
    case "project":
      return "Project";
    case "machine":
      return "Machine";
  }
}

function FinderWindow({ window: desktopWindow, groupKey }: { window: DesktopWindow; groupKey: string }) {
  const desktop = useDesktop();
  const manager = useWindowManager();
  const group = desktop.groupByKey.get(groupKey) ?? null;
  const [query, setQuery] = useState("");
  const [view, setView] = useState<"icons" | "list">("list");

  if (group === null) {
    return (
      <WindowFrame window={desktopWindow} title="Folder" icon="Folder">
        <div className="cdc-empty">
          <p>This folder isn’t part of the current organization.</p>
          <Button size="sm" variant="secondary" onClick={() => desktop.setPreferences({ organize: groupKey.startsWith("project:") ? "project" : groupKey.startsWith("machine:") ? "machine" : "section" })}>
            Organize by {groupKey.startsWith("project:") ? "projects" : groupKey.startsWith("machine:") ? "machines" : "sections"}
          </Button>
        </div>
      </WindowFrame>
    );
  }

  const threads = sortThreads(desktop.membersOf(group).filter(matches(query.trim().toLocaleLowerCase())), desktop.sort.key, desktop.sort.direction);
  const canStart = group.kind !== "machine" && group.kind !== "pinned";
  return (
    <WindowFrame window={desktopWindow} title={group.name} icon={groupIcon(group)}
      statusBar={<><span>{threads.length} {threads.length === 1 ? "thread" : "threads"}</span><span className="cdc-statusbar-note">{groupDescription(group)}</span></>}
      bodyProps={threadDropTarget(group) as Record<string, string>}>
      <div className="cdc-finder">
        <div className="cdc-toolbar">
          <Nav window={desktopWindow} />
          <Search value={query} onChange={setQuery} label={`Search ${group.name}`} />
          {canStart ? <Button size="sm" variant="ghost" onClick={() => manager.open({ kind: "new-thread", groupKey: group.key })}><Icon name="MessageSquarePlus" />New thread</Button> : null}
          <ViewToggle view={view} onChange={setView} />
        </div>
        <div className="cdc-finder-body">
          <ThreadCollection threads={threads} group={group} view={view}
            empty={query.trim() !== "" ? <p>No threads match “{query.trim()}”.</p> : acceptsDrop(group)
              ? <><p>Nothing here yet. Drag a thread onto this folder, or use Move to in a thread’s menu.</p>{canStart ? <Button size="sm" variant="secondary" onClick={() => manager.open({ kind: "new-thread", groupKey: group.key })}>New thread</Button> : null}</>
              : <p>No threads here.</p>} />
        </div>
      </div>
    </WindowFrame>
  );
}

function ListWindow({ window: desktopWindow, title, icon, threads, empty, note, showFolders }: {
  window: DesktopWindow;
  title: string;
  icon: string;
  threads: DesktopThread[];
  empty: string;
  note: string;
  showFolders?: boolean;
}) {
  const desktop = useDesktop();
  const [query, setQuery] = useState("");
  const shown = sortThreads(threads.filter(matches(query.trim().toLocaleLowerCase())), desktop.sort.key, desktop.sort.direction);
  return (
    <WindowFrame window={desktopWindow} title={title} icon={icon}
      statusBar={<><span>{shown.length} {shown.length === 1 ? "thread" : "threads"}</span><span className="cdc-statusbar-note">{note}</span></>}>
      <div className="cdc-finder">
        <div className="cdc-toolbar">
          <Nav window={desktopWindow} />
          <Search value={query} onChange={setQuery} label={`Search ${title}`} />
        </div>
        <div className="cdc-finder-body">
          <ThreadCollection threads={shown} group={null} view="list" showFolders={showFolders} empty={<p>{query.trim() !== "" ? `No threads match “${query.trim()}”.` : empty}</p>} />
        </div>
      </div>
    </WindowFrame>
  );
}

function MoreWindow({ window: desktopWindow }: { window: DesktopWindow }) {
  const desktop = useDesktop();
  const manager = useWindowManager();
  return (
    <WindowFrame window={desktopWindow} title="More" icon="Layers" statusBar={<span className="cdc-statusbar-note">The groups you moved into More in the sidebar</span>}>
      <div className="cdc-finder">
        <div className="cdc-toolbar"><Nav window={desktopWindow} /></div>
        <div className="cdc-finder-body">
          {desktop.moreGroups.length === 0 ? <div className="cdc-empty"><p>Nothing here. Groups you move into More in the sidebar show up in this folder.</p></div> : (
            <div className="cdc-file-grid" role="group" aria-label="Folders">
              {desktop.moreGroups.map((group) => {
                const open = () => manager.navigate(desktopWindow.id, { kind: "finder", key: group.key });
                const members = desktop.membersOf(group);
                return (
                  <div key={group.key} className="cdc-file-icon" role="button" tabIndex={0} aria-label={folderSummary(group.name, members)} title={folderSummary(group.name, members)}
                    onDoubleClick={open} onKeyDown={(event) => { if (event.key === "Enter") open(); }} {...threadDropTarget(group)}>
                    <span className="cdc-file-art"><Icon name={groupIcon(group)} /><StatusDot members={members} /></span>
                    <span className="cdc-file-label">{group.name}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </WindowFrame>
  );
}

/** Creates a sidebar section or a desktop-only folder, optionally filing threads into it. */
function NewFolderWindow({ window: desktopWindow, at }: { window: DesktopWindow; at: { x: number; y: number } | null }) {
  const desktop = useDesktop();
  const manager = useWindowManager();
  const [name, setName] = useState("New folder");
  const [kind, setKind] = useState<"section" | "folder">(desktop.organize === "section" ? "section" : "folder");
  const [picked, setPicked] = useState<ReadonlySet<string>>(new Set());
  const [query, setQuery] = useState("");
  const [busy, setBusy] = useState(false);
  const candidates = sortThreads(desktop.visibleThreads.filter(matches(query.trim().toLocaleLowerCase())), desktop.sort.key, desktop.sort.direction).slice(0, 200);

  const create = async () => {
    setBusy(true);
    try {
      const trimmed = name.trim() || "New folder";
      let key: string;
      if (kind === "section") {
        const section = await desktop.call("createSection", { name: trimmed, position: at });
        if (picked.size > 0) await desktop.call("moveToSection", { threadIds: [...picked], sectionId: section.id });
        key = `section:${section.id}`;
      } else {
        const folder = await desktop.call("createFolder", { name: trimmed, position: at });
        if (picked.size > 0) await desktop.call("addToFolder", { folderId: folder.id, threadIds: [...picked], fromFolderId: null });
        key = `folder:${folder.id}`;
      }
      desktop.refresh();
      manager.close(desktopWindow.id);
      if (kind === "folder" || desktop.organize === "section") manager.open({ kind: "finder", key });
    } catch (error) {
      toast.error(errorMessage(error));
    } finally {
      setBusy(false);
    }
  };

  return (
    <WindowFrame window={desktopWindow} title="New folder" icon="FolderPlus">
      <form className="cdc-form" onSubmit={(event) => { event.preventDefault(); void create(); }}>
        <label className="cdc-field">
          <span>Name</span>
          <input value={name} autoFocus maxLength={80} onFocus={(event) => event.target.select()} onChange={(event) => setName(event.target.value)} />
        </label>
        <fieldset className="cdc-choice">
          <legend>Kind</legend>
          <label><input type="radio" name="kind" checked={kind === "section"} onChange={() => setKind("section")} /><span>Sidebar section<small>Shows up in bb’s sidebar too</small></span></label>
          <label><input type="radio" name="kind" checked={kind === "folder"} onChange={() => setKind("folder")} /><span>Desktop folder<small>Only on this canvas</small></span></label>
        </fieldset>
        <fieldset className="cdc-picker">
          <legend>{kind === "section" ? "Move threads in" : "Add threads"}{picked.size > 0 ? ` (${picked.size})` : ""}</legend>
          <Search value={query} onChange={setQuery} label="Search threads to add" />
          <div className="cdc-picker-list">
            {candidates.map((thread) => (
              <label key={thread.id} className="cdc-picker-row">
                <input type="checkbox" checked={picked.has(thread.id)} onChange={(event) => {
                  const next = new Set(picked);
                  if (event.target.checked) next.add(thread.id);
                  else next.delete(thread.id);
                  setPicked(next);
                }} />
                <span>{thread.title}</span>
              </label>
            ))}
          </div>
        </fieldset>
        <div className="cdc-form-actions">
          <Button type="button" variant="ghost" size="sm" onClick={() => manager.close(desktopWindow.id)}>Cancel</Button>
          <Button type="submit" size="sm" disabled={busy}>Create</Button>
        </div>
      </form>
    </WindowFrame>
  );
}

/** Starts a thread filed in a folder, section or project, like Desktop's New thread in…. */
function NewThreadWindow({ window: desktopWindow, groupKey }: { window: DesktopWindow; groupKey: string }) {
  const desktop = useDesktop();
  const manager = useWindowManager();
  const group = desktop.groupByKey.get(groupKey) ?? null;
  const submit = async (request: NewThreadRequest) => {
    const { threadId } = await desktop.call("spawnThread", {
      request: { ...request, ...(group?.kind === "section" && group.id !== null ? { sectionId: group.id } : {}) },
      ...(group?.kind === "folder" ? { folderId: group.folder.id } : {}),
    });
    manager.close(desktopWindow.id);
    manager.open({ kind: "thread", threadId });
  };
  return (
    <WindowFrame window={desktopWindow} title={group === null ? "New thread" : `New thread in ${group.name}`} icon="MessageSquarePlus">
      <div className="cdc-new-thread">
        <NewThreadComposer onSubmit={submit} {...(group?.kind === "project" && group.id !== null ? { defaultProjectId: group.id } : {})}
          draftKey={`desktop-canvas-prototype:new-thread:${groupKey}`} placeholder="What should this thread do?" />
      </div>
    </WindowFrame>
  );
}

function ThreadWindow({ window: desktopWindow, threadId }: { window: DesktopWindow; threadId: string }) {
  const context = useMenuContext();
  const { desktop, actions } = context;
  const menu = useMenu();
  const thread = desktop.threadById.get(threadId);
  const archived = thread?.isArchived === true;
  return (
    <WindowFrame window={desktopWindow} title={thread?.title ?? "Thread"} icon="MessageSquare" bodyProps={{ "data-chat-thread": threadId }}
      titleActions={
        <>
          {thread === undefined ? null : (
            <button type="button" className="cdc-title-button" aria-label="Thread actions" aria-haspopup="menu" title="Thread actions"
              onClick={(event) => menu.openFrom(event.currentTarget, threadMenu(context, thread, null, { includeOpen: false }))}>
              <Icon name="MoreHorizontal" />
            </button>
          )}
          <button type="button" className="cdc-title-button" aria-label="Open in bb" title="Open in bb" onClick={() => actions.open(threadId)}>
            <Icon name="ExternalLink" />
          </button>
        </>
      }
      statusBar={archived ? <><span className="cdc-statusbar-note">Thread is archived</span><Button size="sm" variant="secondary" onClick={() => void desktop.restoreThread(threadId)}>Unarchive</Button></> : undefined}>
      <ThreadChat threadId={threadId} variant={archived ? "timeline" : "compact"} layout="contained" permissionPolicy="editable" className="h-full" />
    </WindowFrame>
  );
}

/** One window's program. Memoized on the window, so panning and zooming re-render only frames. */
export const ProgramWindow = memo(function ProgramWindow({ window: desktopWindow }: { window: DesktopWindow }) {
  const desktop = useDesktop();
  const spec: WindowSpec = desktopWindow.spec;
  switch (spec.kind) {
    case "finder":
      return <FinderWindow window={desktopWindow} groupKey={spec.key} />;
    case "thread":
      return <ThreadWindow window={desktopWindow} threadId={spec.threadId} />;
    case "threads":
      return <ListWindow window={desktopWindow} title="My Threads" icon="MessageSquare" threads={desktop.visibleThreads} showFolders
        empty="No threads yet. Start one from Composer." note="Drag a thread onto a folder to file it" />;
    case "recycle-bin":
      return <ListWindow window={desktopWindow} title="Recycle Bin" icon="Trash2" threads={desktop.archivedThreads}
        empty="The Recycle Bin is empty. Drag a thread onto it to archive it." note="Archived threads · right-click to restore, or drag onto a folder" />;
    case "more":
      return <MoreWindow window={desktopWindow} />;
    case "new-folder":
      return <NewFolderWindow window={desktopWindow} at={spec.at} />;
    case "new-thread":
      return <NewThreadWindow window={desktopWindow} groupKey={spec.groupKey} />;
  }
});

export function windowTitle(spec: WindowSpec, desktop: ReturnType<typeof useDesktop>): string {
  switch (spec.kind) {
    case "finder":
      return desktop.groupByKey.get(spec.key)?.name ?? "Folder";
    case "thread":
      return desktop.threadById.get(spec.threadId)?.title ?? "Thread";
    case "threads":
      return "My Threads";
    case "recycle-bin":
      return "Recycle Bin";
    case "more":
      return "More";
    case "new-folder":
      return "New folder";
    case "new-thread":
      return `New thread in ${desktop.groupByKey.get(spec.groupKey)?.name ?? "folder"}`;
  }
}

export function windowIcon(spec: WindowSpec, desktop: ReturnType<typeof useDesktop>): string {
  switch (spec.kind) {
    case "finder": {
      const group = desktop.groupByKey.get(spec.key);
      return group === undefined ? "Folder" : groupIcon(group);
    }
    case "thread":
    case "threads":
      return "MessageSquare";
    case "recycle-bin":
      return "Trash2";
    case "more":
      return "Layers";
    case "new-folder":
      return "FolderPlus";
    case "new-thread":
      return "MessageSquarePlus";
  }
}

export { groupMenu, useMenuContext };
