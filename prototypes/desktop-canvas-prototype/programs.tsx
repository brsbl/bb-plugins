import { memo, useState, type MouseEvent as ReactMouseEvent, type PointerEvent as ReactPointerEvent, type ReactNode } from "react";
import { toast } from "sonner";
import {
  experimental_Icon as Icon,
  experimental_NewThreadComposer as NewThreadComposer,
  experimental_ProviderIcon as ProviderIcon,
  experimental_useSidebarThreadActions as useSidebarThreadActions,
  ThreadChat,
  type NewThreadRequest,
  type PluginSidebarThread,
} from "@get-bb/plugin-sdk/app";
import { RECYCLE_BIN_DROP, beginThreadDrag, canStartThread, groupMenu, threadDropTarget, threadMenu, type MenuContext } from "./actions";
import { acceptsDrop, type Collection } from "./canvas-organization";
import { Button } from "./components/ui/button";
import { describeStatus, folderSummary, groupTone, relativeTime, statusTone } from "./core";
import { errorMessage, useDesktop, type DesktopContextValue } from "./data";
import { useAskText, useMenu } from "./menu";
import { WindowFrame, usePointerTracker, useWindowManager, type DesktopWindow, type WindowSpec } from "./windows";

/** Every window the canvas opens: Desktop's programs without the Windows XP skin. */

/** bb's resource icons are drawn filled on the canvas, like the sidebar's own glyphs at large size. */
export const RESOURCE_ICON = "cdc-resource-icon";

export function useMenuContext(): MenuContext {
  return { desktop: useDesktop(), manager: useWindowManager(), actions: useSidebarThreadActions(), ask: useAskText() };
}

/** A folder's state, shown once on its icon: who needs you, who is working, or how many are unread. */
export function StatusDot({ members }: { members: readonly PluginSidebarThread[] }) {
  const { tone, toneCount, unreadCount } = groupTone(members);
  if (tone === "attention") return <span className="cdc-dot" data-tone="attention">{toneCount}</span>;
  if (tone === "running") return <span className="cdc-dot" data-tone="running"><Icon name="Loading" /></span>;
  if (unreadCount > 0) return <span className="cdc-dot" data-tone="unread">{unreadCount}</span>;
  return null;
}

/** Every thread a folder holds, including those in its environment folders and, for More, its hidden groups. */
export function collectionMembers(collection: Collection): PluginSidebarThread[] {
  if (collection.children.length === 0) return collection.threads;
  const byId = new Map(collection.threads.map((thread) => [thread.id, thread]));
  for (const child of collection.children) for (const thread of collectionMembers(child)) byId.set(thread.id, thread);
  return [...byId.values()];
}

function ThreadStatus({ thread }: { thread: PluginSidebarThread }) {
  const tone = statusTone(thread);
  return (
    <span className="cdc-thread-status" data-tone={tone ?? (thread.status === "error" ? "error" : thread.isArchived ? "archived" : "idle")}>
      {tone === "running" ? <Icon name="Loading" /> : <span className="cdc-status-pip" />}
      <span>{describeStatus(thread)}</span>
    </span>
  );
}

function ThreadGlyph({ thread }: { thread: PluginSidebarThread }) {
  const { preferences } = useDesktop();
  return preferences.showProviderIcons ? <ProviderIcon providerKind="agent" provider={{ id: thread.providerId }} /> : <Icon name="MessageSquare" />;
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

const matches = (needle: string) => (thread: PluginSidebarThread) => needle === "" || thread.displayTitle.toLocaleLowerCase().includes(needle);

/**
 * Subfolders, then threads, as icons or a detail list. Threads drag onto folders and the Recycle Bin, and their menu
 * offers the same moves. Subfolders open in the same window; Back returns.
 */
function ThreadCollection({ windowId, folders = [], threads, group, view, empty, showFolders = false, footer }: {
  windowId: string;
  folders?: Collection[];
  threads: PluginSidebarThread[];
  group: Collection | null;
  view: "icons" | "list";
  empty: ReactNode;
  showFolders?: boolean;
  footer?: ReactNode;
}) {
  const context = useMenuContext();
  const { desktop, manager } = context;
  const track = usePointerTracker();
  const menu = useMenu();
  const [selected, setSelected] = useState<string | null>(null);
  const [limit, setLimit] = useState(200);

  if (threads.length === 0 && folders.length === 0) return <div className="cdc-empty">{empty}{footer}</div>;

  const openFolder = (folder: Collection) => manager.navigate(windowId, { kind: "finder", key: folder.key });
  const folderProps = (folder: Collection) => ({
    role: "option" as const,
    tabIndex: 0,
    "aria-selected": selected === folder.key,
    "aria-label": folderSummary(folder.name, collectionMembers(folder)),
    title: folderSummary(folder.name, collectionMembers(folder)),
    onClick: () => setSelected(folder.key),
    onDoubleClick: () => openFolder(folder),
    onKeyDown: (event: { key: string; preventDefault: () => void }) => {
      if (event.key === "Enter") {
        event.preventDefault();
        openFolder(folder);
      }
    },
    onContextMenu: (event: ReactMouseEvent) => {
      setSelected(folder.key);
      menu.open(event, groupMenu(context, folder, () => openFolder(folder), (target) => manager.open({ kind: "new-thread", groupKey: target.key })));
    },
    ...threadDropTarget(folder),
  });
  const itemProps = (thread: PluginSidebarThread) => ({
    role: "option" as const,
    tabIndex: 0,
    "aria-selected": selected === thread.id,
    title: `${thread.displayTitle} — ${describeStatus(thread)}`,
    onPointerDown: (event: ReactPointerEvent<HTMLElement>) => {
      if (event.button !== 0 || event.isPrimary === false) return;
      setSelected(thread.id);
      beginThreadDrag(event, thread.displayTitle, track, (key) => {
        if (key === RECYCLE_BIN_DROP) {
          if (!thread.isArchived) desktop.archiveThread(thread.id);
          return;
        }
        const destination = desktop.organization.byKey.get(key);
        if (destination) void desktop.dropThread(destination, { threadId: thread.id, fromFolderId: group?.kind === "folder" ? group.folder?.id ?? null : null });
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
  const shown = threads.slice(0, limit);
  const more = threads.length > limit ? <Button size="sm" variant="ghost" onClick={() => setLimit((value) => value + 200)}>Show {Math.min(200, threads.length - limit)} more</Button> : null;

  if (view === "icons") {
    return (
      <>
        <div className="cdc-file-grid" role="listbox" aria-label="Contents">
          {folders.map((folder) => (
            <div key={folder.key} className="cdc-file-icon" {...folderProps(folder)}>
              <span className="cdc-file-art"><Icon name={folder.icon} className={RESOURCE_ICON} /><StatusDot members={collectionMembers(folder)} /></span>
              <span className="cdc-file-label">{folder.name}</span>
            </div>
          ))}
          {shown.map((thread) => (
            <div key={thread.id} className="cdc-file-icon" {...itemProps(thread)}>
              <span className="cdc-file-art">
                <ThreadGlyph thread={thread} />
                {statusTone(thread) === "attention" ? <span className="cdc-dot" data-tone="attention">!</span>
                  : statusTone(thread) === "running" ? <span className="cdc-dot" data-tone="running"><Icon name="Loading" /></span>
                  : thread.isUnread ? <span className="cdc-dot" data-tone="unread" /> : null}
              </span>
              <span className="cdc-file-label">{thread.displayTitle}</span>
            </div>
          ))}
        </div>
        <div className="cdc-collection-footer">{more}{footer}</div>
      </>
    );
  }

  const created = desktop.preferences.chronologicalSort === "created";
  return (
    <div className="cdc-list" role="listbox" aria-label="Contents">
      <div className="cdc-row cdc-row-head" aria-hidden>
        <span>Name</span>
        <span>Status</span>
        <span>{created ? "Created" : "Updated"}</span>
      </div>
      {folders.map((folder) => {
        const members = collectionMembers(folder);
        return (
          <div key={folder.key} className="cdc-row" {...folderProps(folder)}>
            <span className="cdc-row-name"><Icon name={folder.icon} className={RESOURCE_ICON} /><span><span className="cdc-row-title">{folder.name}</span></span></span>
            <span className="cdc-thread-status">{members.length} {members.length === 1 ? "thread" : "threads"}</span>
            <span className="cdc-row-date" />
          </div>
        );
      })}
      {shown.map((thread) => (
        <div key={thread.id} className="cdc-row" data-unread={thread.isUnread || undefined} {...itemProps(thread)}>
          <span className="cdc-row-name">
            <ThreadGlyph thread={thread} />
            <span>
              <span className="cdc-row-title">{thread.displayTitle}</span>
              {showFolders && desktop.foldersOf(thread.id).length > 0 ? <small>{desktop.foldersOf(thread.id).join(", ")}</small> : null}
            </span>
          </span>
          <ThreadStatus thread={thread} />
          <span className="cdc-row-date">{relativeTime(created ? thread.createdAt : thread.latestAttentionAt)}</span>
        </div>
      ))}
      <div className="cdc-collection-footer">{more}{footer}</div>
    </div>
  );
}

function groupDescription(group: Collection): string {
  switch (group.kind) {
    case "folder":
      return "Desktop folder · drag threads here to file them";
    case "section":
      return "Section · drag threads here to move them";
    case "threads":
      return group.sectionId === null ? "Threads outside any section · drag threads here to unfile them" : "Threads outside any project";
    case "pinned":
      return "Pinned threads, as in the sidebar";
    case "project":
      return "Project";
    case "machine":
      return "Machine";
    case "environment":
      return "Environment";
    case "more":
      return "Groups hidden in the sidebar";
  }
}

function FinderWindow({ window: desktopWindow, groupKey }: { window: DesktopWindow; groupKey: string }) {
  const desktop = useDesktop();
  const manager = useWindowManager();
  const group = desktop.organization.byKey.get(groupKey) ?? null;
  const [query, setQuery] = useState("");
  const [view, setView] = useState<"icons" | "list">("list");

  if (group === null) {
    return (
      <WindowFrame window={desktopWindow} title="Folder" icon="Folder" iconClassName={RESOURCE_ICON}>
        <div className="cdc-empty">
          <p>This folder isn’t in the sidebar’s current organization or filters anymore.</p>
          <Button size="sm" variant="secondary" onClick={() => manager.close(desktopWindow.id)}>Close</Button>
        </div>
      </WindowFrame>
    );
  }

  const needle = query.trim().toLocaleLowerCase();
  // Searching a folder also finds threads inside its subfolders.
  const threads = needle === "" ? group.threads.filter((thread) => !group.children.some((child) => child.threads.includes(thread))) : collectionMembers(group).filter(matches(needle));
  const folders = group.children.filter((child) => needle === "" || child.name.toLocaleLowerCase().includes(needle));
  const total = collectionMembers(group).length;
  return (
    <WindowFrame window={desktopWindow} title={group.name} icon={group.icon} iconClassName={RESOURCE_ICON}
      statusBar={<><span>{needle ? threads.length : total} {(needle ? threads.length : total) === 1 ? "thread" : "threads"}{!needle && group.children.length ? ` · ${group.children.length} folders` : ""}</span><span className="cdc-statusbar-note">{groupDescription(group)}</span></>}
      bodyProps={threadDropTarget(group) as Record<string, string>}>
      <div className="cdc-finder">
        <div className="cdc-toolbar">
          <Nav window={desktopWindow} />
          <Search value={query} onChange={setQuery} label={`Search ${group.name}`} />
          {canStartThread(group) ? <Button size="sm" variant="ghost" onClick={() => manager.open({ kind: "new-thread", groupKey: group.key })}><Icon name="MessageSquarePlus" />New thread</Button> : null}
          <ViewToggle view={view} onChange={setView} />
        </div>
        <div className="cdc-finder-body">
          <ThreadCollection windowId={desktopWindow.id} folders={folders} threads={threads} group={group} view={view}
            empty={needle !== "" ? <p>Nothing matches “{query.trim()}”.</p> : acceptsDrop(group)
              ? <><p>Nothing here yet. Drag a thread onto this folder, or use Move to in a thread’s menu.</p>{canStartThread(group) ? <Button size="sm" variant="secondary" onClick={() => manager.open({ kind: "new-thread", groupKey: group.key })}>New thread</Button> : null}</>
              : <p>No threads here.</p>} />
        </div>
      </div>
    </WindowFrame>
  );
}

function ListWindow({ window: desktopWindow, title, icon, threads, empty, note, showFolders, footer }: {
  window: DesktopWindow;
  title: string;
  icon: string;
  threads: PluginSidebarThread[];
  empty: string;
  note: string;
  showFolders?: boolean;
  footer?: ReactNode;
}) {
  const [query, setQuery] = useState("");
  const shown = threads.filter(matches(query.trim().toLocaleLowerCase()));
  return (
    <WindowFrame window={desktopWindow} title={title} icon={icon}
      statusBar={<><span>{shown.length} {shown.length === 1 ? "thread" : "threads"}</span><span className="cdc-statusbar-note">{note}</span></>}>
      <div className="cdc-finder">
        <div className="cdc-toolbar">
          <Nav window={desktopWindow} />
          <Search value={query} onChange={setQuery} label={`Search ${title}`} />
        </div>
        <div className="cdc-finder-body">
          <ThreadCollection windowId={desktopWindow.id} threads={shown} group={null} view="list" showFolders={showFolders} footer={footer}
            empty={<p>{query.trim() !== "" ? `No threads match “${query.trim()}”.` : empty}</p>} />
        </div>
      </div>
    </WindowFrame>
  );
}

function ArchivedPager() {
  const { archivedPager: pager } = useDesktop();
  if (pager === null) return null;
  if (pager.status === "error") return <p role="alert" className="cdc-collection-error">Archived threads couldn’t load. Reload to try again.</p>;
  if (!pager.hasNextPage) return null;
  return (
    <Button size="sm" variant="ghost" disabled={pager.isFetchingNextPage} onClick={() => void pager.fetchNextPage().catch(() => undefined)}>
      {pager.isFetchingNextPage ? "Loading archived threads…" : pager.isFetchNextPageError ? "Retry loading archived threads" : "Load more archived threads"}
    </Button>
  );
}

/** Creates a sidebar section or a desktop-only folder, optionally filing threads into it. */
function NewFolderWindow({ window: desktopWindow, at }: { window: DesktopWindow; at: { x: number; y: number } | null }) {
  const desktop = useDesktop();
  const manager = useWindowManager();
  const [name, setName] = useState("New folder");
  const [kind, setKind] = useState<"section" | "folder">(desktop.preferences.organizationMode === "chronological" ? "section" : "folder");
  const [picked, setPicked] = useState<ReadonlySet<string>>(new Set());
  const [query, setQuery] = useState("");
  const [busy, setBusy] = useState(false);
  const candidates = desktop.organization.threads.filter((thread) => !thread.isArchived).filter(matches(query.trim().toLocaleLowerCase())).slice(0, 200);

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
      manager.open({ kind: "finder", key });
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
          <label><input type="radio" name="kind" checked={kind === "section"} onChange={() => setKind("section")} /><span>Section<small>Shows up in bb’s sidebar too</small></span></label>
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
                <span>{thread.displayTitle}</span>
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
  const group = desktop.organization.byKey.get(groupKey) ?? null;
  const projectId = group?.kind === "project" ? group.key.slice("project:".length) : undefined;
  const submit = async (request: NewThreadRequest) => {
    const { threadId } = await desktop.call("spawnThread", {
      request: { ...request, ...(group?.kind === "section" && group.sectionId ? { sectionId: group.sectionId } : {}) },
      ...(group?.kind === "folder" && group.folder !== undefined ? { folderId: group.folder.id } : {}),
    });
    manager.close(desktopWindow.id);
    manager.open({ kind: "thread", threadId });
  };
  return (
    <WindowFrame window={desktopWindow} title={group === null ? "New thread" : `New thread in ${group.name}`} icon="MessageSquarePlus">
      <div className="cdc-new-thread">
        <NewThreadComposer onSubmit={submit} {...(projectId === undefined ? {} : { defaultProjectId: projectId })}
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
    <WindowFrame window={desktopWindow} title={thread?.displayTitle ?? "Thread"} icon="MessageSquare" bodyProps={{ "data-chat-thread": threadId }}
      titleActions={
        <>
          {thread === undefined ? null : (
            <button type="button" className="cdc-title-button" aria-label="Thread actions" aria-haspopup="menu" title="Thread actions"
              onClick={(event) => menu.openFrom(event.currentTarget, (latest) => {
                const current = latest.threadById.get(threadId);
                return current === undefined ? [] : threadMenu({ ...context, desktop: latest }, current, null, { includeOpen: false });
              })}>
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
      return <ListWindow window={desktopWindow} title="My Threads" icon="MessageSquare" threads={desktop.organization.threads} showFolders
        empty="No threads match the sidebar’s filters. Start one from Composer." note="Drag a thread onto a folder to file it" />;
    case "recycle-bin":
      return <ListWindow window={desktopWindow} title="Recycle Bin" icon="Trash2" threads={desktop.archivedThreads} footer={<ArchivedPager />}
        empty="The Recycle Bin is empty. Drag a thread onto it to archive it." note="Archived threads · right-click to restore, or drag onto a folder" />;
    case "new-folder":
      return <NewFolderWindow window={desktopWindow} at={spec.at} />;
    case "new-thread":
      return <NewThreadWindow window={desktopWindow} groupKey={spec.groupKey} />;
  }
});

export function windowTitle(spec: WindowSpec, desktop: DesktopContextValue): string {
  switch (spec.kind) {
    case "finder":
      return desktop.organization.byKey.get(spec.key)?.name ?? "Folder";
    case "thread":
      return desktop.threadById.get(spec.threadId)?.displayTitle ?? "Thread";
    case "threads":
      return "My Threads";
    case "recycle-bin":
      return "Recycle Bin";
    case "new-folder":
      return "New folder";
    case "new-thread":
      return `New thread in ${desktop.organization.byKey.get(spec.groupKey)?.name ?? "folder"}`;
  }
}

export function windowIcon(spec: WindowSpec, desktop: DesktopContextValue): { name: string; className?: string } {
  switch (spec.kind) {
    case "finder":
      return { name: desktop.organization.byKey.get(spec.key)?.icon ?? "Folder", className: RESOURCE_ICON };
    case "thread":
    case "threads":
      return { name: "MessageSquare" };
    case "recycle-bin":
      return { name: "Trash2" };
    case "new-folder":
      return { name: "FolderPlus" };
    case "new-thread":
      return { name: "MessageSquarePlus" };
  }
}
