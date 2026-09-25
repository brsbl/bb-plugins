import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type DragEvent as ReactDragEvent,
  type MouseEvent as ReactMouseEvent,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";
import { toast } from "sonner";
import {
  ThreadChat,
  experimental_NewThreadComposer as NewThreadComposer,
  experimental_useSidebarThreadActions as useSidebarThreadActions,
  experimental_useSidebarThreadPullRequest as useSidebarThreadPullRequest,
  experimental_useSidebarThreads as useSidebarThreads,
  useRealtime,
  useRealtimeConnectionState,
  useRpc,
  type NewThreadRequest,
  type PluginSidebarThread,
} from "@get-bb/plugin-sdk/app";

import {
  CheckGlyph,
  ExternalLinkGlyph,
  FolderArt,
  FolderPlusGlyph,
  GlyphTile,
  GridViewGlyph,
  ListViewGlyph,
  MediaPlayerArt,
  NewThreadGlyph,
  PanelRightGlyph,
  ThreadArt,
  ThreadsGlyph,
  TileGlyph,
  TrashGlyph,
} from "./art";
import {
  ICON_CELL,
  acceptsDrop,
  buildGroups,
  filterLifecycle,
  gridPositions,
  groupThreads,
  nextFreePosition,
  resolveSidebarPreferences,
  sortThreads,
  tileRects,
  type DesktopGroup,
  type DesktopThread,
  type Lifecycle,
  type Organize,
  type Point,
  type Preferences,
  type SortDirection,
  type SortKey,
} from "./core";
import { MediaDeskband, MediaPlayerWindow } from "./media-player";
import type { DesktopSnapshot, rpcContract } from "./server";
import {
  WindowFrame,
  WindowManagerProvider,
  trackPointer,
  useWindowManager,
  viewportRect,
  workAreaRect,
  type DesktopWindow,
  type WindowSpec,
} from "./windows";

const THREAD_DRAG_TYPE = "application/x-bb-desktop-thread";
const PLUGIN_SCOPE = { "data-bb-plugin": "desktop" } as const;

interface ThreadDrag {
  threadId: string;
  fromFolderId: string | null;
}

interface MenuItem {
  label: string;
  icon?: ReactNode;
  disabled?: boolean;
  checked?: boolean;
  run: () => void;
}

type MenuEntry = MenuItem | "separator" | { heading: string };

interface MenuState {
  x: number;
  y: number;
  entries: MenuEntry[];
}

interface Effective {
  sort: { key: SortKey; direction: SortDirection };
  organize: Organize;
  lifecycle: Lifecycle;
}

interface DesktopContextValue {
  snapshot: DesktopSnapshot;
  threads: DesktopThread[];
  visibleThreads: DesktopThread[];
  threadById: Map<string, DesktopThread>;
  liveById: Map<string, PluginSidebarThread>;
  groups: DesktopGroup[];
  groupByKey: Map<string, DesktopGroup>;
  effective: Effective;
  sort: { key: SortKey; direction: SortDirection };
  call: ReturnType<typeof useRpc<typeof rpcContract>>["call"];
  refresh: () => void;
  openThread: (threadId: string) => void;
  openMenu: (event: ReactMouseEvent, entries: MenuEntry[]) => void;
  dropThread: (group: DesktopGroup, drag: ThreadDrag) => Promise<void>;
  setPreferences: (patch: Partial<Preferences>) => void;
}

const DesktopContext = createContext<DesktopContextValue | null>(null);

function useDesktop(): DesktopContextValue {
  const value = useContext(DesktopContext);
  if (value === null) throw new Error("useDesktop outside Desktop");
  return value;
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

function readThreadDrag(event: ReactDragEvent): ThreadDrag | null {
  try {
    const parsed: unknown = JSON.parse(event.dataTransfer.getData(THREAD_DRAG_TYPE));
    if (typeof parsed !== "object" || parsed === null) return null;
    const record = parsed as Record<string, unknown>;
    if (typeof record.threadId !== "string") return null;
    return {
      threadId: record.threadId,
      fromFolderId: typeof record.fromFolderId === "string" ? record.fromFolderId : null,
    };
  } catch {
    return null;
  }
}

function startThreadDrag(event: ReactDragEvent, drag: ThreadDrag) {
  event.dataTransfer.setData(THREAD_DRAG_TYPE, JSON.stringify(drag));
  event.dataTransfer.effectAllowed = "move";
}

function useDropTarget(group: DesktopGroup | null) {
  const desktop = useDesktop();
  const [over, setOver] = useState(false);
  const enabled = group !== null && acceptsDrop(group);
  return {
    over,
    handlers: enabled
      ? {
          onDragOver(event: ReactDragEvent) {
            if (!event.dataTransfer.types.includes(THREAD_DRAG_TYPE)) return;
            event.preventDefault();
            event.dataTransfer.dropEffect = "move";
            setOver(true);
          },
          onDragLeave() {
            setOver(false);
          },
          onDrop(event: ReactDragEvent) {
            setOver(false);
            const drag = readThreadDrag(event);
            if (drag === null) return;
            event.preventDefault();
            void desktop.dropThread(group, drag);
          },
        }
      : {},
  };
}

async function fetchSidebarPreferences(): Promise<unknown> {
  try {
    const response = await fetch("/api/v1/plugins/thread-list/rpc/listPreferences", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: "null",
      credentials: "same-origin",
    });
    const body: unknown = await response.json();
    return typeof body === "object" && body !== null
      ? (body as { result?: { preferences?: unknown } }).result?.preferences
      : null;
  } catch {
    return null;
  }
}

function useDesktopData() {
  const rpc = useRpc<typeof rpcContract>();
  const rpcRef = useRef(rpc);
  rpcRef.current = rpc;
  const [snapshot, setSnapshot] = useState<DesktopSnapshot | null>(null);
  const [error, setError] = useState<string | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const load = useCallback(async () => {
    try {
      setSnapshot(await rpcRef.current.call("snapshot"));
      setError(null);
    } catch (loadError) {
      setError(errorMessage(loadError));
    }
  }, []);

  const refresh = useCallback(() => {
    if (timer.current !== null) clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      timer.current = null;
      void load();
    }, 120);
  }, [load]);

  useEffect(() => {
    void load();
    const onVisible = () => {
      if (document.visibilityState === "visible") refresh();
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      document.removeEventListener("visibilitychange", onVisible);
      if (timer.current !== null) clearTimeout(timer.current);
    };
  }, [load, refresh]);

  useRealtime("changed", refresh);

  const connection = useRealtimeConnectionState();
  const previousConnection = useRef(connection);
  useEffect(() => {
    if (connection === "connected" && previousConnection.current !== "connected") refresh();
    previousConnection.current = connection;
  }, [connection, refresh]);

  const call = useCallback<DesktopContextValue["call"]>(
    (...args) => rpcRef.current.call(...args),
    [],
  );

  return { snapshot, error, refresh, call };
}

export function Desktop() {
  return (
    <WindowManagerProvider>
      <DesktopData />
    </WindowManagerProvider>
  );
}

function closeThreadWindows(manager: ReturnType<typeof useWindowManager>, threadId: string) {
  manager.closeWhere(
    (window) =>
      (window.spec.kind === "thread" || window.spec.kind === "panel") &&
      window.spec.threadId === threadId,
  );
}

function DesktopData() {
  const { snapshot, error, refresh, call } = useDesktopData();
  const live = useSidebarThreads();
  const manager = useWindowManager();
  const actions = useSidebarThreadActions();
  const rootRef = useRef<HTMLDivElement>(null);
  const [dockFrame, setDockFrame] = useState<DockFrame | null>(null);
  const [sidebar, setSidebar] = useState<ReturnType<typeof resolveSidebarPreferences> | null>(null);
  const [menu, setMenu] = useState<MenuState | null>(null);

  const usesSidebar =
    snapshot !== null &&
    (snapshot.preferences.sort === "sidebar" ||
      snapshot.preferences.organize === "sidebar" ||
      snapshot.preferences.lifecycle === "sidebar");

  useEffect(() => {
    if (snapshot === null) return;
    if (!usesSidebar) {
      setSidebar((current) => current ?? resolveSidebarPreferences(null));
      return;
    }
    let cancelled = false;
    void fetchSidebarPreferences().then((preferences) => {
      if (!cancelled) setSidebar(resolveSidebarPreferences(preferences));
    });
    return () => {
      cancelled = true;
    };
  }, [usesSidebar, snapshot]);

  const liveById = useMemo(
    () => new Map(live.threads.map((thread) => [thread.id, thread])),
    [live.threads],
  );

  const threads = useMemo(
    () =>
      (snapshot?.threads ?? []).map((thread) => {
        const current = liveById.get(thread.id);
        if (current === undefined) return thread;
        return {
          ...thread,
          title: current.title ?? current.titleFallback ?? thread.title,
          sectionId: current.sectionId,
          isUnread: current.isUnread,
          needsInput: current.hasPendingInteraction,
          isArchived: current.isArchived,
        };
      }),
    [liveById, snapshot?.threads],
  );

  const effective = useMemo<Effective>(() => {
    const preferences = snapshot?.preferences;
    const fromSidebar = sidebar ?? resolveSidebarPreferences(null);
    const sortPreference = preferences?.sort ?? "sidebar";
    return {
      sort:
        sortPreference === "sidebar"
          ? fromSidebar.sort
          : {
              key: sortPreference,
              direction: sortPreference === "alpha" ? "ascending" : "descending",
            },
      organize:
        preferences === undefined || preferences.organize === "sidebar"
          ? fromSidebar.organize
          : preferences.organize,
      lifecycle:
        preferences === undefined || preferences.lifecycle === "sidebar"
          ? fromSidebar.lifecycle
          : preferences.lifecycle,
    };
  }, [sidebar, snapshot?.preferences]);

  const visibleThreads = useMemo(
    () => filterLifecycle(threads, effective.lifecycle),
    [effective.lifecycle, threads],
  );

  const groups = useMemo(
    () =>
      snapshot === null
        ? []
        : buildGroups({
            organize: effective.organize,
            sections: snapshot.sections,
            projects: snapshot.projects,
            machines: snapshot.machines,
            folders: snapshot.folders,
            threads: visibleThreads,
          }),
    [effective.organize, snapshot, visibleThreads],
  );

  const groupByKey = useMemo(() => new Map(groups.map((group) => [group.key, group])), [groups]);

  const threadById = useMemo(
    () => new Map(threads.map((thread) => [thread.id, thread])),
    [threads],
  );

  const openThread = useCallback(
    (threadId: string) => {
      manager.open({ kind: "thread", threadId });
      if (threadById.get(threadId)?.isUnread === true) {
        void actions.setRead(threadId, true).catch(() => undefined);
      }
    },
    [actions, manager, threadById],
  );

  const dropThread = useCallback(
    async (group: DesktopGroup, drag: ThreadDrag) => {
      try {
        if (group.kind === "section") {
          if (threadById.get(drag.threadId)?.sectionId === group.id) return;
          await call("moveToSection", { threadIds: [drag.threadId], sectionId: group.id });
          toast.success(`Moved to ${group.name}`);
          refresh();
          return;
        }
        if (group.kind !== "folder" || group.folder.threadIds.includes(drag.threadId)) return;
        await call("addToFolder", {
          folderId: group.folder.id,
          threadIds: [drag.threadId],
          fromFolderId: drag.fromFolderId,
        });
        refresh();
      } catch (dropError) {
        toast.error(errorMessage(dropError));
      }
    },
    [call, refresh, threadById],
  );

  const openMenu = useCallback((event: ReactMouseEvent, entries: MenuEntry[]) => {
    event.preventDefault();
    event.stopPropagation();
    setMenu({ x: event.clientX, y: event.clientY, entries });
  }, []);

  const setPreferences = useCallback(
    (patch: Partial<Preferences>) =>
      void call("setPreferences", patch)
        .then(refresh)
        .catch((preferenceError) => toast.error(errorMessage(preferenceError))),
    [call, refresh],
  );

  const ready = snapshot !== null && sidebar !== null;
  useEffect(() => {
    const element = rootRef.current;
    if (!ready || element === null) return;
    const measure = () => {
      const rect = element.getBoundingClientRect();
      setDockFrame({ left: rect.left + rect.width / 2, width: rect.width });
    };
    const observer = new ResizeObserver(measure);
    for (let node: Element | null = element; node !== null; node = node.parentElement) observer.observe(node);
    window.addEventListener("resize", measure);
    measure();
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, [ready]);

  if (snapshot === null || sidebar === null) {
    return (
      <div className="bbd-root">
        <div
          className="bbd-desktop grid place-items-center text-sm text-muted-foreground"
          style={{ height: 240 }}
        >
          {error === null ? null : `Desktop failed to load: ${error}`}
        </div>
      </div>
    );
  }

  const value: DesktopContextValue = {
    snapshot,
    threads,
    visibleThreads,
    threadById,
    liveById,
    groups,
    groupByKey,
    effective,
    sort: effective.sort,
    call,
    refresh,
    openThread,
    openMenu,
    dropThread,
    setPreferences,
  };

  return (
    <DesktopContext.Provider value={value}>
      <div ref={rootRef} className="bbd-root">
        <DesktopCanvas />
        {createPortal(
          <div {...PLUGIN_SCOPE} className="bbd-root bbd-window-layer">
            {manager.windows.map((window) => (
              <WindowContent key={window.id} window={window} />
            ))}
            <Dock frame={dockFrame} />
          </div>,
          document.body,
        )}
        {menu === null
          ? null
          : createPortal(
              <ContextMenu menu={menu} onClose={() => setMenu(null)} />,
              document.body,
            )}
      </div>
    </DesktopContext.Provider>
  );
}

function ContextMenu({ menu, onClose }: { menu: MenuState; onClose: () => void }) {
  const ref = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ x: menu.x, y: menu.y });

  useEffect(() => {
    const element = ref.current;
    if (element !== null) {
      const box = element.getBoundingClientRect();
      setPosition({
        x: Math.max(4, Math.min(menu.x, window.innerWidth - box.width - 4)),
        y: Math.max(4, Math.min(menu.y, window.innerHeight - box.height - 4)),
      });
      element.querySelector<HTMLButtonElement>("button:not(:disabled)")?.focus();
    }
    const dismiss = (event: Event) => {
      if (event instanceof KeyboardEvent && event.key !== "Escape") return;
      if (event.target instanceof Node && ref.current?.contains(event.target)) return;
      onClose();
    };
    window.addEventListener("pointerdown", dismiss, true);
    window.addEventListener("keydown", dismiss, true);
    window.addEventListener("blur", onClose);
    return () => {
      window.removeEventListener("pointerdown", dismiss, true);
      window.removeEventListener("keydown", dismiss, true);
      window.removeEventListener("blur", onClose);
    };
  }, [menu, onClose]);

  const list = (
    <div className="bbd-menu-list">
      {menu.entries.map((entry, index) =>
        entry === "separator" ? (
          <div key={`separator-${index}`} className="bbd-menu-separator" role="separator" />
        ) : "heading" in entry ? (
          <div key={`heading-${index}`} className="bbd-menu-label">
            {entry.heading}
          </div>
        ) : (
          <button
            key={`${entry.label}-${index}`}
            type="button"
            role={entry.checked === undefined ? "menuitem" : "menuitemradio"}
            aria-checked={entry.checked}
            className="bbd-menu-item disabled:text-muted-foreground"
            disabled={entry.disabled}
            onClick={() => {
              onClose();
              entry.run();
            }}
          >
            <span className="flex size-4 items-center justify-center">
              {entry.checked ? <CheckGlyph className="size-3.5" strokeWidth={2} /> : entry.icon}
            </span>
            {entry.label}
          </button>
        ),
      )}
    </div>
  );

  return (
    <div
      ref={ref}
      {...PLUGIN_SCOPE}
      role="menu"
      className="bbd-root bbd-menu"
      style={{ left: position.x, top: position.y }}
      onContextMenu={(event) => event.preventDefault()}
    >
      {list}
    </div>
  );
}

function groupSortValue(
  group: DesktopGroup,
  threads: readonly DesktopThread[],
  key: SortKey,
): number | string {
  if (key === "alpha") return group.name.toLocaleLowerCase();
  const members = groupThreads(group, threads);
  if (key === "created") {
    return group.kind === "folder"
      ? group.folder.createdAt
      : Math.min(Number.MAX_SAFE_INTEGER, ...members.map((thread) => thread.createdAt));
  }
  return Math.max(0, ...members.map((thread) => thread.updatedAt));
}

const ORGANIZE_LABELS: Record<Organize, string> = {
  section: "Sections",
  project: "Projects",
  machine: "Machines",
};

const LIFECYCLE_LABELS: Record<Lifecycle, string> = {
  active: "Active",
  archived: "Archived",
  all: "All",
};

const SORT_LABELS: Record<SortKey, string> = {
  updated: "Updated at",
  created: "Created at",
  alpha: "Alphabetical",
};

function viewMenuEntries(desktop: DesktopContextValue): MenuEntry[] {
  const { preferences } = desktop.snapshot;
  return [
    { heading: "Show" },
    {
      label: "Same as sidebar",
      checked: preferences.lifecycle === "sidebar",
      run: () => desktop.setPreferences({ lifecycle: "sidebar" }),
    },
    ...(["active", "archived", "all"] as const).map((lifecycle) => ({
      label: LIFECYCLE_LABELS[lifecycle],
      checked: preferences.lifecycle === lifecycle,
      run: () => desktop.setPreferences({ lifecycle }),
    })),
    { heading: "Organize by" },
    {
      label: "Same as sidebar",
      checked: preferences.organize === "sidebar",
      run: () => desktop.setPreferences({ organize: "sidebar" }),
    },
    ...(["section", "project", "machine"] as const).map((organize) => ({
      label: ORGANIZE_LABELS[organize],
      checked: preferences.organize === organize,
      run: () => desktop.setPreferences({ organize }),
    })),
    { heading: "Sort by" },
    {
      label: "Same as sidebar",
      checked: preferences.sort === "sidebar",
      run: () => desktop.setPreferences({ sort: "sidebar" }),
    },
    ...(["updated", "created", "alpha"] as const).map((sort) => ({
      label: SORT_LABELS[sort],
      checked: preferences.sort === sort,
      run: () => desktop.setPreferences({ sort }),
    })),
  ];
}

function DesktopCanvas() {
  const desktop = useDesktop();
  const manager = useWindowManager();
  const { snapshot, call, sort } = desktop;
  const canvasRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(900);
  const [selected, setSelected] = useState<string | null>(null);
  const [overrides, setOverrides] = useState<Record<string, Point>>({});

  useEffect(() => {
    const element = canvasRef.current;
    if (element === null) return;
    const observer = new ResizeObserver(([entry]) => {
      if (entry !== undefined) setWidth(entry.contentRect.width);
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  useEffect(() => setOverrides({}), [snapshot.layout]);

  const items = desktop.groups;

  const positions = useMemo(() => {
    const placed = new Map<string, Point>();
    for (const item of items) {
      const point = overrides[item.key] ?? snapshot.layout[item.key];
      if (point !== undefined) placed.set(item.key, point);
    }
    for (const item of items) {
      if (placed.has(item.key)) continue;
      placed.set(item.key, nextFreePosition([...placed.values()], width));
    }
    return placed;
  }, [items, overrides, snapshot.layout, width]);

  const saveLayout = useCallback(
    (entries: Record<string, Point>) => {
      setOverrides((current) => ({ ...current, ...entries }));
      void call("setLayout", { entries }).catch((error) => toast.error(errorMessage(error)));
    },
    [call],
  );

  const arrange = () => {
    const direction = sort.direction === "ascending" ? 1 : -1;
    const valueOf = (group: DesktopGroup) => groupSortValue(group, desktop.visibleThreads, sort.key);
    const ordered = [...items].sort((left, right) => {
      const leftValue = valueOf(left);
      const rightValue = valueOf(right);
      return leftValue < rightValue ? -direction : leftValue > rightValue ? direction : 0;
    });
    const grid = gridPositions(ordered.length, width);
    saveLayout(Object.fromEntries(ordered.map((item, index) => [item.key, grid[index]!])));
  };

  const tileWindows = () => {
    const open = manager.windows;
    const threadOf = (window: DesktopWindow) =>
      window.spec.kind === "thread" || window.spec.kind === "panel"
        ? desktop.threadById.get(window.spec.threadId)
        : undefined;
    const sortedThreads = sortThreads(
      open.flatMap((window) => {
        const thread = threadOf(window);
        return thread === undefined ? [] : [thread];
      }),
      sort.key,
      sort.direction,
    );
    const rank = new Map(sortedThreads.map((thread, index) => [thread.id, index]));
    const ordered = [...open].sort(
      (left, right) =>
        (rank.get(threadOf(left)?.id ?? "") ?? Number.MAX_SAFE_INTEGER) -
        (rank.get(threadOf(right)?.id ?? "") ?? Number.MAX_SAFE_INTEGER),
    );
    const rects = tileRects(ordered.length, workAreaRect());
    manager.arrange(Object.fromEntries(ordered.map((window, index) => [window.id, rects[index]!])));
  };

  const commands: MenuEntry[] = [
    { label: "New folder", icon: <FolderPlusGlyph className="size-3.5" />, run: () => manager.open({ kind: "new-folder" }) },
    { label: "New thread", icon: <NewThreadGlyph className="size-3.5" />, run: () => manager.open({ kind: "new-thread", groupKey: null }) },
    "separator",
    { label: "Threads", icon: <ThreadsGlyph className="size-3.5" />, run: () => manager.open({ kind: "threads" }) },
    { label: "Windows Media Player", icon: <MediaPlayerArt size={14} />, run: () => manager.open({ kind: "media-player" }) },
    "separator",
    { label: "Arrange icons", icon: <GridViewGlyph className="size-3.5" />, run: arrange },
    {
      label: "Tile windows",
      icon: <TileGlyph className="size-3.5" />,
      disabled: manager.windows.length === 0,
      run: tileWindows,
    },
  ];

  const bottom = Math.max(
    ICON_CELL.height * 2,
    ...[...positions.values()].map((point) => point.y + ICON_CELL.height),
  );

  return (
    <div className="bbd-desktop flex flex-col">
      <div
        ref={canvasRef}
        className="relative flex-1"
        style={{ minHeight: bottom + 8 }}
        onPointerDown={(event) => {
          if (event.target === event.currentTarget) setSelected(null);
        }}
        onContextMenu={(event) =>
          desktop.openMenu(event, [...commands, "separator", ...viewMenuEntries(desktop)])
        }
      >
        {items.map((item) => (
          <DesktopIcon
            key={item.key}
            group={item}
            position={positions.get(item.key)!}
            selected={selected === item.key}
            onSelect={() => setSelected(item.key)}
            onMoved={(point) => saveLayout({ [item.key]: point })}
          />
        ))}
      </div>
    </div>
  );
}

function windowTitle(spec: WindowSpec, desktop: DesktopContextValue): string {
  switch (spec.kind) {
    case "finder":
      return desktop.groupByKey.get(spec.key)?.name ?? "Folder";
    case "thread":
      return desktop.threadById.get(spec.threadId)?.title ?? "Thread";
    case "panel":
      return `${desktop.threadById.get(spec.threadId)?.title ?? "Thread"} — Details`;
    case "threads":
      return "Threads";
    case "new-folder":
      return "New folder";
    case "new-thread":
      return "New thread";
    case "media-player":
      return "Windows Media Player";
  }
}

function windowArt(spec: WindowSpec, desktop: DesktopContextValue, size: number): ReactNode {
  switch (spec.kind) {
    case "finder":
      return <FolderArt kind={desktop.groupByKey.get(spec.key)?.kind ?? "section"} size={size} />;
    case "thread":
      return <ThreadArt size={size} />;
    case "panel":
      return <GlyphTile glyph={PanelRightGlyph} size={size + 2} />;
    case "threads":
      return <GlyphTile glyph={ThreadsGlyph} size={size + 2} />;
    case "new-folder":
      return <GlyphTile glyph={FolderPlusGlyph} size={size + 2} tone="green" />;
    case "new-thread":
      return <GlyphTile glyph={NewThreadGlyph} size={size + 2} tone="green" />;
    case "media-player":
      return <MediaPlayerArt size={size} />;
  }
}

interface DockFrame {
  left: number;
  width: number;
}

function Dock({ frame }: { frame: DockFrame | null }) {
  const desktop = useDesktop();
  const manager = useWindowManager();
  const activate = (id: string) => {
    if (manager.focusedId === id) manager.minimize(id, true);
    else manager.focus(id);
  };
  return (
    <nav className="bbd-dock" aria-label="Taskbar" style={frame ?? undefined}>
      <button
        type="button"
        className="bbd-start"
        onClick={() => manager.open({ kind: "new-thread", groupKey: null })}
      >
        <NewThreadGlyph className="size-4" strokeWidth={2.25} />
        <span>New thread</span>
      </button>
      <div className="bbd-quick-launch">
        <button
          type="button"
          className="bbd-quick"
          aria-label="New folder"
          onClick={() => manager.open({ kind: "new-folder" })}
        >
          <GlyphTile glyph={FolderPlusGlyph} size={22} tone="green" />
          <span className="bbd-dock-tip">New folder</span>
        </button>
        <button
          type="button"
          className="bbd-quick"
          aria-label="Windows Media Player"
          onClick={() => manager.open({ kind: "media-player" })}
        >
          <MediaPlayerArt size={20} />
          <span className="bbd-dock-tip">Windows Media Player</span>
        </button>
      </div>
      <div className="bbd-tasks">
        {manager.windows.map((window) => {
          const title = windowTitle(window.spec, desktop);
          return (
            <button
              key={window.id}
              type="button"
              className="bbd-task"
              aria-label={`${title}${window.minimized ? " (minimized)" : ""}`}
              title={title}
              data-minimized={window.minimized}
              data-focused={manager.focusedId === window.id}
              onClick={() => activate(window.id)}
            >
              <span className="bbd-task-icon">{windowArt(window.spec, desktop, 18)}</span>
              <span className="min-w-0 truncate">{title}</span>
            </button>
          );
        })}
      </div>
      <div className="bbd-tray">
        <MediaDeskband onRestore={() => manager.open({ kind: "media-player" })} />
        <TrayClock />
      </div>
    </nav>
  );
}

function TrayClock() {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 15_000);
    return () => window.clearInterval(timer);
  }, []);
  return (
    <time className="bbd-clock" dateTime={now.toISOString()} title={now.toLocaleDateString(undefined, { dateStyle: "full" })}>
      {now.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" })}
    </time>
  );
}

function groupMenu(
  desktop: DesktopContextValue,
  manager: ReturnType<typeof useWindowManager>,
  group: DesktopGroup,
  open: () => void,
): MenuEntry[] {
  const newThread: MenuEntry = {
    label: `New thread in ${group.name}`,
    icon: <NewThreadGlyph className="size-3.5" />,
    run: () => manager.open({ kind: "new-thread", groupKey: group.key }),
  };
  const fail = (error: unknown) => toast.error(errorMessage(error));
  if (group.kind === "folder") {
    return [
      { label: "Open", run: open },
      newThread,
      "separator",
      {
        label: "Rename…",
        run: () => {
          const name = window.prompt("Folder name", group.name)?.trim();
          if (name) void desktop.call("updateFolder", { id: group.folder.id, name }).catch(fail);
        },
      },
      {
        label: "Delete folder",
        icon: <TrashGlyph className="size-3.5" />,
        run: () => {
          if (!window.confirm(`Delete “${group.name}”? Threads inside are kept.`)) return;
          manager.close(`finder:${group.key}`);
          void desktop.call("deleteFolder", { id: group.folder.id }).catch(fail);
        },
      },
    ];
  }
  if (group.kind === "section" && group.id !== null) {
    const sectionId = group.id;
    return [
      { label: "Open", run: open },
      newThread,
      "separator",
      {
        label: "Rename section…",
        run: () => {
          const name = window.prompt("Section name", group.name)?.trim();
          if (name) void desktop.call("renameSection", { id: sectionId, name }).catch(fail);
        },
      },
      {
        label: "Delete section",
        icon: <TrashGlyph className="size-3.5" />,
        run: () => {
          if (!window.confirm(`Delete the “${group.name}” section? Its threads move to Threads.`)) return;
          manager.close(`finder:${group.key}`);
          void desktop.call("deleteSection", { id: sectionId }).catch(fail);
        },
      },
    ];
  }
  return [{ label: "Open", run: open }, ...(group.kind === "machine" ? [] : [newThread])];
}

function DesktopIcon({
  group,
  position,
  selected,
  onSelect,
  onMoved,
}: {
  group: DesktopGroup;
  position: Point;
  selected: boolean;
  onSelect: () => void;
  onMoved: (point: Point) => void;
}) {
  const desktop = useDesktop();
  const manager = useWindowManager();
  const [drag, setDrag] = useState<Point | null>(null);
  const drop = useDropTarget(group);

  const open = () => manager.open({ kind: "finder", key: group.key });

  const onPointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    onSelect();
    let moved = false;
    let latest = position;
    trackPointer(
      event,
      (delta) => {
        if (!moved && Math.hypot(delta.x, delta.y) < 4) return;
        moved = true;
        latest = { x: Math.max(0, position.x + delta.x), y: Math.max(0, position.y + delta.y) };
        setDrag(latest);
      },
      () => {
        setDrag(null);
        if (moved) onMoved(latest);
      },
    );
  };

  const members = groupThreads(group, desktop.visibleThreads);
  const needsInput = members.some((thread) => thread.needsInput);
  const point = drag ?? position;

  const menu = groupMenu(desktop, manager, group, open);

  return (
    <div
      role="button"
      tabIndex={0}
      aria-selected={selected}
      aria-label={group.name}
      title={`${group.name} — ${members.length} threads`}
      className="bbd-icon"
      data-dragging={drag !== null}
      data-drop-target={drop.over}
      style={{ left: point.x, top: point.y }}
      onPointerDown={onPointerDown}
      onDoubleClick={open}
      onKeyDown={(event) => {
        if (event.key === "Enter") open();
      }}
      onContextMenu={(event) => {
        onSelect();
        desktop.openMenu(event, menu);
      }}
      {...drop.handlers}
    >
      <span className="bbd-icon-art">
        <FolderArt kind={group.kind} />
        {needsInput ? (
          <span className="bbd-dot" data-tone="attention" aria-hidden />
        ) : null}
      </span>
      <span className="bbd-icon-label">{group.name}</span>
    </div>
  );
}

function WindowContent({ window: desktopWindow }: { window: DesktopWindow }) {
  const { spec } = desktopWindow;
  switch (spec.kind) {
    case "finder":
      return <FinderWindow window={desktopWindow} groupKey={spec.key} />;
    case "thread":
      return <ThreadWindow window={desktopWindow} threadId={spec.threadId} />;
    case "panel":
      return <PanelWindow window={desktopWindow} threadId={spec.threadId} />;
    case "threads":
      return <ThreadsWindow window={desktopWindow} />;
    case "new-folder":
      return <NewFolderWindow window={desktopWindow} />;
    case "new-thread":
      return <NewThreadWindow window={desktopWindow} groupKey={spec.groupKey} />;
    case "media-player":
      return <MediaPlayerWindow window={desktopWindow} />;
  }
}

function threadMenu(
  desktop: DesktopContextValue,
  manager: ReturnType<typeof useWindowManager>,
  actions: ReturnType<typeof useSidebarThreadActions>,
  thread: DesktopThread,
  group: DesktopGroup | null,
): MenuEntry[] {
  const fromFolderId = group?.kind === "folder" ? group.folder.id : null;
  const targets = desktop.groups.filter(
    (candidate) =>
      acceptsDrop(candidate) &&
      candidate.key !== group?.key &&
      !(candidate.kind === "folder" && candidate.folder.threadIds.includes(thread.id)) &&
      !(candidate.kind === "section" && thread.sectionId === candidate.id),
  );
  return [
    { label: "Open", run: () => desktop.openThread(thread.id) },
    { label: "Open details", icon: <PanelRightGlyph className="size-3.5" />, run: () => manager.open({ kind: "panel", threadId: thread.id }) },
    { label: "Open in bb", icon: <ExternalLinkGlyph className="size-3.5" />, run: () => actions.open(thread.id) },
    ...(targets.length > 0 ? ["separator" as const, { heading: "Move to" }] : []),
    ...targets.map((target): MenuEntry => ({
      label: target.name,
      run: () => void desktop.dropThread(target, { threadId: thread.id, fromFolderId }),
    })),
    ...(group?.kind === "folder"
      ? [
          "separator" as const,
          {
            label: `Remove from ${group.name}`,
            run: () =>
              void desktop
                .call("removeFromFolder", { folderId: group.folder.id, threadId: thread.id })
                .catch((error) => toast.error(errorMessage(error))),
          },
        ]
      : []),
    "separator",
    {
      label: thread.isUnread ? "Mark as read" : "Mark as unread",
      run: () => void actions.setRead(thread.id, thread.isUnread).catch((error) => toast.error(errorMessage(error))),
    },
    {
      label: "Archive",
      disabled: thread.isArchived,
      run: () => {
        closeThreadWindows(manager, thread.id);
        actions.archive(thread.id);
      },
    },
  ];
}

function statusTone(thread: DesktopThread): "attention" | "running" | null {
  if (thread.needsInput) return "attention";
  if (thread.status === "active" || thread.status === "starting") return "running";
  return null;
}

function ThreadGlyph({ thread }: { thread: DesktopThread }) {
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

function describeStatus(thread: DesktopThread): string {
  if (thread.needsInput) return "Needs input";
  if (thread.isArchived) return "Archived";
  switch (thread.status) {
    case "active":
      return "Working";
    case "starting":
      return "Starting";
    case "stopping":
      return "Stopping";
    case "error":
      return "Error";
    default:
      return thread.isUnread ? "Unread" : "Idle";
  }
}

function relativeTime(timestamp: number): string {
  const seconds = Math.round((Date.now() - timestamp) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 48) return `${hours}h ago`;
  return new Date(timestamp).toLocaleDateString();
}

function ThreadCollection({
  threads,
  group,
  view,
  emptyText,
}: {
  threads: DesktopThread[];
  group: DesktopGroup | null;
  view: "icons" | "list";
  emptyText: string;
}) {
  const desktop = useDesktop();
  const manager = useWindowManager();
  const actions = useSidebarThreadActions();
  const [selected, setSelected] = useState<string | null>(null);

  if (threads.length === 0) {
    return <p className="p-6 text-center text-xs text-muted-foreground">{emptyText}</p>;
  }

  const itemProps = (thread: DesktopThread) => ({
    draggable: true,
    "aria-selected": selected === thread.id,
    onDragStart: (event: ReactDragEvent) =>
      startThreadDrag(event, {
        threadId: thread.id,
        fromFolderId: group?.kind === "folder" ? group.folder.id : null,
      }),
    onClick: () => setSelected(thread.id),
    onDoubleClick: () => desktop.openThread(thread.id),
    onKeyDown: (event: { key: string }) => {
      if (event.key === "Enter") desktop.openThread(thread.id);
    },
    onContextMenu: (event: ReactMouseEvent) => {
      setSelected(thread.id);
      desktop.openMenu(event, threadMenu(desktop, manager, actions, thread, group));
    },
    tabIndex: 0,
    role: "option",
  });

  if (view === "icons") {
    return (
      <div className="bbd-finder-grid" role="listbox" aria-label="Threads">
        {threads.map((thread) => (
          <div key={thread.id} className="bbd-finder-item" title={thread.title} {...itemProps(thread)}>
            <ThreadGlyph thread={thread} />
            <span className="bbd-icon-label">{thread.title}</span>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div role="listbox" aria-label="Threads" className="py-1">
      <div className="bbd-row grid-cols-[1fr_88px_80px] font-semibold text-muted-foreground">
        <span>Name</span>
        <span>Status</span>
        <span>{desktop.sort.key === "created" ? "Created" : "Updated"}</span>
      </div>
      {threads.map((thread) => (
        <div key={thread.id} className="bbd-row grid-cols-[1fr_88px_80px]" {...itemProps(thread)}>
          <span className="flex min-w-0 items-center gap-2">
            <ThreadArt size={16} archived={thread.isArchived} />
            <span className={`truncate ${thread.isUnread ? "font-semibold" : ""}`}>{thread.title}</span>
          </span>
          <span className="truncate">{describeStatus(thread)}</span>
          <span className="truncate tabular-nums">
            {relativeTime(desktop.sort.key === "created" ? thread.createdAt : thread.updatedAt)}
          </span>
        </div>
      ))}
    </div>
  );
}

function LifecycleSelect() {
  const desktop = useDesktop();
  const { preferences } = desktop.snapshot;
  return (
    <select
      className="bbd-field bbd-sunken min-w-0 shrink truncate"
      aria-label="Show threads"
      value={preferences.lifecycle}
      onChange={(event) =>
        desktop.setPreferences({ lifecycle: event.target.value as Preferences["lifecycle"] })
      }
    >
      <option value="sidebar">Show: Same as sidebar</option>
      <option value="active">Show: Active</option>
      <option value="archived">Show: Archived</option>
      <option value="all">Show: All</option>
    </select>
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
  const [view, setView] = useState<"icons" | "list">("icons");
  const drop = useDropTarget(group);

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
      icon={<FolderArt kind={group.kind} size={16} />}
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
          <LifecycleSelect />
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
              <NewThreadGlyph className="size-3.5" /> New thread
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
        <div
          className="bbd-sunken min-h-0 flex-1 overflow-auto"
          data-drop-target={drop.over}
          style={drop.over ? { outline: "2px dashed var(--bbd-orange)", outlineOffset: -4 } : undefined}
          {...drop.handlers}
        >
          <ThreadCollection
            threads={threads}
            group={group}
            view={view}
            emptyText={
              acceptsDrop(group)
                ? `Nothing here${desktop.effective.lifecycle === "all" ? "" : ` that is ${LIFECYCLE_LABELS[desktop.effective.lifecycle].toLowerCase()}`}. Drag threads in from another folder or the Threads window.`
                : "No threads match the current Show filter."
            }
          />
        </div>
      </div>
    </WindowFrame>
  );
}

function ThreadWindow({ window: desktopWindow, threadId }: { window: DesktopWindow; threadId: string }) {
  const desktop = useDesktop();
  const manager = useWindowManager();
  const actions = useSidebarThreadActions();
  const thread = desktop.threadById.get(threadId);
  const panelOpen = manager.windows.some(
    (window) => window.spec.kind === "panel" && window.spec.threadId === threadId,
  );

  const togglePanel = () => {
    const panelId = `panel:${threadId}`;
    if (panelOpen) {
      manager.close(panelId);
      return;
    }
    const { rect } = desktopWindow;
    const viewport = viewportRect();
    const width = 320;
    const x =
      rect.x + rect.width + 8 + width <= viewport.width ? rect.x + rect.width + 8 : Math.max(0, rect.x - width - 8);
    manager.open({ kind: "panel", threadId }, { x, y: rect.y, width, height: rect.height });
  };

  return (
    <WindowFrame
      window={desktopWindow}
      title={thread?.title ?? "Thread"}
      icon={<ThreadArt size={16} />}
      titleActions={
        <>
          <button
            type="button"
            className="bbd-titlebar-button"
            aria-label={panelOpen ? "Close details panel" : "Open details panel"}
            title={panelOpen ? "Close details panel" : "Open details panel"}
            data-pressed={panelOpen}
            onClick={togglePanel}
          >
            <PanelRightGlyph className="size-3" strokeWidth={2} />
          </button>
          <button
            type="button"
            className="bbd-titlebar-button mr-1"
            aria-label="Open in bb"
            title="Open in bb"
            onClick={() => actions.open(threadId)}
          >
            <ExternalLinkGlyph className="size-3" strokeWidth={2} />
          </button>
        </>
      }
      statusBar={
        thread === undefined ? undefined : (
          <>
            <span>{describeStatus(thread)}</span>
            <span>{thread.providerId}</span>
            <span className="flex-1 truncate">Updated {relativeTime(thread.updatedAt)}</span>
          </>
        )
      }
    >
      <div className="h-full bg-background">
        <ThreadChat threadId={threadId} variant="compact" layout="contained" className="h-full" />
      </div>
    </WindowFrame>
  );
}

function PullRequestLine({ threadId }: { threadId: string }) {
  const { pullRequest } = useSidebarThreadPullRequest(threadId);
  if (pullRequest === null) return null;
  return (
    <DetailRow label="Pull request">
      <a className="text-primary underline" href={pullRequest.url} target="_blank" rel="noreferrer">
        #{pullRequest.number} {pullRequest.title}
      </a>{" "}
      <span className="text-muted-foreground">({pullRequest.state})</span>
    </DetailRow>
  );
}

function DetailRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="grid grid-cols-[92px_1fr] gap-2 py-0.5 text-xs">
      <span className="text-muted-foreground">{label}</span>
      <span className="min-w-0 break-words">{children}</span>
    </div>
  );
}

function PanelWindow({ window: desktopWindow, threadId }: { window: DesktopWindow; threadId: string }) {
  const desktop = useDesktop();
  const manager = useWindowManager();
  const actions = useSidebarThreadActions();
  const thread = desktop.threadById.get(threadId);
  const live = desktop.liveById.get(threadId);
  const folders = desktop.snapshot.folders.filter((folder) => folder.threadIds.includes(threadId));
  const section = desktop.snapshot.sections.find((candidate) => candidate.id === thread?.sectionId);

  return (
    <WindowFrame
      window={desktopWindow}
      title={`${thread?.title ?? "Thread"} — Details`}
      icon={<PanelRightGlyph className="size-3.5" />}
    >
      <div className="bbd-sunken h-full overflow-auto p-3">
        {thread === undefined ? (
          <p className="text-xs text-muted-foreground">This thread is not available.</p>
        ) : (
          <div className="space-y-3">
            <fieldset className="bbd-fieldset">
              <legend>Thread</legend>
              <DetailRow label="Status">{describeStatus(thread)}</DetailRow>
              <DetailRow label="Agent">{thread.providerId}</DetailRow>
              {live?.environment?.branchName ? <DetailRow label="Branch">{live.environment.branchName}</DetailRow> : null}
              {live?.environment?.name ? <DetailRow label="Environment">{live.environment.name}</DetailRow> : null}
              {live?.host ? <DetailRow label="Machine">{live.host.name}</DetailRow> : null}
              <PullRequestLine threadId={threadId} />
              <DetailRow label="Created">{new Date(thread.createdAt).toLocaleString()}</DetailRow>
              <DetailRow label="Sidebar">{thread.isHidden ? "Hidden (filed in a folder)" : "Visible"}</DetailRow>
              <DetailRow label="Section">{section?.name ?? "None"}</DetailRow>
              <DetailRow label="Folders">
                {folders.length === 0 ? "None" : folders.map((folder) => folder.name).join(", ")}
              </DetailRow>
            </fieldset>
            <div className="flex flex-wrap gap-1">
              <button type="button" className="bbd-button bbd-bevel" onClick={() => actions.open(threadId)}>
                <ExternalLinkGlyph className="size-3.5" /> Open in bb
              </button>
              <button
                type="button"
                className="bbd-button bbd-bevel"
                onClick={() => void actions.setRead(threadId, thread.isUnread).catch((error) => toast.error(errorMessage(error)))}
              >
                {thread.isUnread ? "Mark read" : "Mark unread"}
              </button>
              <button
                type="button"
                className="bbd-button bbd-bevel"
                disabled={thread.isArchived}
                onClick={() => {
                  manager.closeWhere(
                    (window) =>
                      (window.spec.kind === "thread" || window.spec.kind === "panel") &&
                      window.spec.threadId === threadId,
                  );
                  actions.archive(threadId);
                }}
              >
                Archive
              </button>
            </div>
          </div>
        )}
      </div>
    </WindowFrame>
  );
}

function ThreadsWindow({ window: desktopWindow }: { window: DesktopWindow }) {
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
      title="Threads"
      icon={<ThreadsGlyph className="size-3.5" />}
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
          <LifecycleSelect />
        </div>
        <div className="bbd-sunken min-h-0 flex-1 overflow-auto">
          <ThreadCollection threads={threads} group={null} view="list" emptyText="No threads." />
        </div>
      </div>
    </WindowFrame>
  );
}

function NewFolderWindow({ window: desktopWindow }: { window: DesktopWindow }) {
  const desktop = useDesktop();
  const manager = useWindowManager();
  const [name, setName] = useState("New folder");
  const [kind, setKind] = useState<"section" | "folder">(
    desktop.effective.organize === "section" ? "section" : "folder",
  );
  const [hide, setHide] = useState(false);
  const [picked, setPicked] = useState<ReadonlySet<string>>(new Set());
  const [query, setQuery] = useState("");
  const [busy, setBusy] = useState(false);
  const needle = query.trim().toLocaleLowerCase();
  const candidates = sortThreads(
    desktop.threads.filter(
      (thread) => !thread.isArchived && (needle === "" || thread.title.toLocaleLowerCase().includes(needle)),
    ),
    desktop.sort.key,
    desktop.sort.direction,
  ).slice(0, 200);

  const create = async () => {
    setBusy(true);
    try {
      const trimmed = name.trim() || "New folder";
      let key: string;
      if (kind === "section") {
        const section = await desktop.call("createSection", { name: trimmed });
        if (picked.size > 0) {
          await desktop.call("moveToSection", { threadIds: [...picked], sectionId: section.id });
        }
        key = `section:${section.id}`;
      } else {
        const folder = await desktop.call("createFolder", {
          name: trimmed,
          hideFromSidebar: hide,
          position: null,
        });
        if (picked.size > 0) {
          await desktop.call("addToFolder", { folderId: folder.id, threadIds: [...picked], fromFolderId: null });
        }
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
    <WindowFrame window={desktopWindow} title="New folder" icon={<FolderPlusGlyph className="size-3.5" />}>
      <form
        className="flex h-full flex-col gap-3 overflow-auto p-3 text-xs"
        onSubmit={(event) => {
          event.preventDefault();
          void create();
        }}
      >
        <label className="flex items-center gap-2">
          Name
          <input
            className="bbd-field bbd-sunken flex-1"
            value={name}
            autoFocus
            onFocus={(event) => event.target.select()}
            onChange={(event) => setName(event.target.value)}
          />
        </label>
        <fieldset className="bbd-fieldset space-y-1">
          <legend>Kind</legend>
          <label className="flex items-center gap-2">
            <input type="radio" name="kind" checked={kind === "section"} onChange={() => setKind("section")} />
            Sidebar section — shows up in bb’s sidebar too
          </label>
          <label className="flex items-center gap-2">
            <input type="radio" name="kind" checked={kind === "folder"} onChange={() => setKind("folder")} />
            Desktop folder — only on this desktop
          </label>
          {kind === "folder" ? (
            <label className="ml-5 flex items-center gap-2">
              <input type="checkbox" checked={hide} onChange={(event) => setHide(event.target.checked)} />
              Hide its threads from the sidebar thread list
            </label>
          ) : null}
        </fieldset>
        <fieldset className="bbd-fieldset flex min-h-32 flex-1 flex-col gap-1">
          <legend>{kind === "section" ? "Move threads in" : "Add threads"} ({picked.size})</legend>
          <input
            className="bbd-field bbd-sunken"
            placeholder="Search"
            aria-label="Search threads to add"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
          <div className="bbd-sunken min-h-0 flex-1 overflow-auto py-1">
            {candidates.map((thread) => (
              <label key={thread.id} className="bbd-row grid-cols-[14px_1fr]">
                <input
                  type="checkbox"
                  checked={picked.has(thread.id)}
                  onChange={(event) => {
                    const next = new Set(picked);
                    if (event.target.checked) next.add(thread.id);
                    else next.delete(thread.id);
                    setPicked(next);
                  }}
                />
                <span className="truncate">{thread.title}</span>
              </label>
            ))}
          </div>
        </fieldset>
        <div className="mt-auto flex justify-end gap-2">
          <button type="button" className="bbd-button bbd-bevel min-w-20 justify-center" onClick={() => manager.close(desktopWindow.id)}>
            Cancel
          </button>
          <button type="submit" className="bbd-button bbd-bevel min-w-20 justify-center font-semibold" disabled={busy}>
            Create
          </button>
        </div>
      </form>
    </WindowFrame>
  );
}

function NewThreadWindow({ window: desktopWindow, groupKey }: { window: DesktopWindow; groupKey: string | null }) {
  const desktop = useDesktop();
  const manager = useWindowManager();
  const group = groupKey === null ? null : (desktop.groupByKey.get(groupKey) ?? null);

  const submit = async (request: NewThreadRequest) => {
    const { threadId } = await desktop.call("spawnThread", {
      request: {
        ...request,
        ...(group?.kind === "section" && group.id !== null ? { sectionId: group.id } : {}),
      },
    });
    if (group?.kind === "folder") {
      await desktop.call("addToFolder", { folderId: group.folder.id, threadIds: [threadId], fromFolderId: null });
    }
    manager.close(desktopWindow.id);
    manager.open({ kind: "thread", threadId });
  };

  return (
    <WindowFrame
      window={desktopWindow}
      title={group === null ? "New thread" : `New thread in ${group.name}`}
      icon={<NewThreadGlyph className="size-3.5" />}
    >
      <div className="h-full overflow-auto bg-background p-3">
        <NewThreadComposer
          onSubmit={submit}
          {...(group?.kind === "project" && group.id !== null ? { defaultProjectId: group.id } : {})}
          draftKey={`desktop:new-thread:${groupKey ?? "desktop"}`}
          placeholder="What should this thread do?"
        />
      </div>
    </WindowFrame>
  );
}
