import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type DragEvent as ReactDragEvent,
  type KeyboardEvent as ReactKeyboardEvent,
  type MouseEvent as ReactMouseEvent,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
  type RefObject,
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
  RecycleBinArt,
  StatusIcon,
  StickyNoteArt,
  NewThreadGlyph,
  type StatusKind,
  StickyNoteGlyph,
  PanelRightGlyph,
  PluginsGlyph,
  PowerGlyph,
  ShowDesktopGlyph,
  SkillsGlyph,
  ThreadArt,
  ThreadsGlyph,
  TileGlyph,
  TrashGlyph,
} from "./art";
import {
  ICON_CELL,
  acceptsDrop,
  buildGroups,
  clearanceShift,
  gridPositions,
  groupThreads,
  nextFreePosition,
  resolveSidebarPreferences,
  sortThreads,
  tileRects,
  type DesktopGroup,
  type DesktopThread,
  type Organize,
  type Point,
  type Preferences,
  type SortDirection,
  type SortKey,
} from "./core";
import { NeedsInputBalloon } from "./balloon";
import { toggleDesktop, useDesktopEnabled } from "./enabled";
import { MediaDeskband, MediaPlayerWindow, useMic } from "./media-player";
import { addStickyNote } from "./sticky-notes";
import type { DesktopSnapshot, rpcContract } from "./server";
import {
  WindowFrame,
  WindowManagerProvider,
  setWindowNudges,
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
}

interface DesktopContextValue {
  snapshot: DesktopSnapshot;
  threads: DesktopThread[];
  visibleThreads: DesktopThread[];
  archivedThreads: DesktopThread[];
  threadById: Map<string, DesktopThread>;
  liveById: Map<string, PluginSidebarThread>;
  groups: DesktopGroup[];
  desktopGroups: DesktopGroup[];
  moreGroups: DesktopGroup[];
  groupByKey: Map<string, DesktopGroup>;
  foldersOf: (threadId: string) => string[];
  effective: Effective;
  sort: { key: SortKey; direction: SortDirection };
  call: ReturnType<typeof useRpc<typeof rpcContract>>["call"];
  refresh: () => void;
  openThread: (threadId: string) => void;
  openMenu: (event: MenuTrigger, entries: MenuEntry[]) => void;
  dropThread: (group: DesktopGroup, drag: ThreadDrag) => Promise<void>;
  restoreThread: (threadId: string) => Promise<void>;
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
  if (!useDesktopEnabled()) return null;
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

export function ThreadFolderChip({ threadId }: { threadId: string }) {
  const enabled = useDesktopEnabled();
  const { snapshot } = useDesktopData();
  const folders = (snapshot?.folders ?? []).filter((folder) => folder.threadIds.includes(threadId));
  const [first] = folders;
  if (!enabled || first === undefined) return null;
  const names = folders.map((folder) => folder.name).join(", ");
  return (
    <span
      className="bbd-root bbd-folder-chip"
      data-bb-plugin="desktop"
      title={`In Desktop ${folders.length === 1 ? "folder" : "folders"}: ${names}`}
      aria-label={`In Desktop ${folders.length === 1 ? "folder" : "folders"}: ${names}`}
    >
      <FolderArt kind="section" size={16} />
      <span className="truncate">{first.name}</span>
      {folders.length > 1 ? <span className="text-muted-foreground">+{folders.length - 1}</span> : null}
    </span>
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

  useEffect(() => {
    if (snapshot === null) return;
    let cancelled = false;
    void fetchSidebarPreferences().then((preferences) => {
      if (!cancelled) setSidebar(resolveSidebarPreferences(preferences));
    });
    return () => {
      cancelled = true;
    };
  }, [snapshot]);

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
    };
  }, [sidebar, snapshot?.preferences]);

  const visibleThreads = useMemo(() => threads.filter((thread) => !thread.isArchived), [threads]);
  const archivedThreads = useMemo(() => threads.filter((thread) => thread.isArchived), [threads]);

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
  const hiddenKeys = useMemo(() => new Set(sidebar?.hiddenGroupKeys ?? []), [sidebar]);
  const desktopGroups = useMemo(() => groups.filter((group) => !hiddenKeys.has(group.key)), [groups, hiddenKeys]);
  const moreGroups = useMemo(() => groups.filter((group) => hiddenKeys.has(group.key)), [groups, hiddenKeys]);
  const folderNames = useMemo(() => {
    const names = new Map<string, string[]>();
    const ordered = [...groups].sort((left, right) => Number(right.kind === "folder") - Number(left.kind === "folder"));
    for (const group of ordered) {
      for (const thread of groupThreads(group, threads)) {
        names.set(thread.id, [...(names.get(thread.id) ?? []), group.name]);
      }
    }
    return names;
  }, [groups, threads]);
  const foldersOf = useCallback((threadId: string) => folderNames.get(threadId) ?? [], [folderNames]);

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
        if (threadById.get(drag.threadId)?.isArchived === true) {
          await call("unarchiveThread", { threadId: drag.threadId });
        }
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

  const restoreThread = useCallback(
    (threadId: string) =>
      call("unarchiveThread", { threadId })
        .then(refresh)
        .catch((restoreError) => toast.error(errorMessage(restoreError))),
    [call, refresh],
  );

  const openMenu = useCallback((event: MenuTrigger, entries: MenuEntry[]) => {
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

  const windowsRef = useRef(manager.windows);
  windowsRef.current = manager.windows;
  useEffect(() => {
    let composer: HTMLElement | null = null;
    let observer: ResizeObserver | null = null;
    const homeComposer = (target: EventTarget | null) =>
      target instanceof Element && target.closest(".bbd-window-layer, [data-thread-window]") === null
        ? target.closest<HTMLElement>("[data-app-composer]")
        : null;
    const clearComposer = () => {
      const { width, height } = workAreaRect();
      const bounds = composer?.getBoundingClientRect();
      if (bounds === undefined) return;
      const obstacle = { x: bounds.left, y: bounds.top, width: bounds.width, height: bounds.height };
      const next = new Map<string, Point>();
      for (const window of windowsRef.current) {
        if (window.minimized || window.restoreRect !== null) continue;
        const shift = clearanceShift(window.rect, obstacle, { width, height });
        if (shift !== null) next.set(window.id, shift);
      }
      setWindowNudges(next);
    };
    const onFocusIn = (event: FocusEvent) => {
      const next = homeComposer(event.target);
      if (next === null || next === composer) return;
      observer?.disconnect();
      composer = next;
      observer = new ResizeObserver(clearComposer);
      observer.observe(next);
      clearComposer();
    };
    const onFocusOut = (event: FocusEvent) => {
      if (composer === null) return;
      if (event.relatedTarget instanceof Node && composer.contains(event.relatedTarget)) return;
      observer?.disconnect();
      observer = null;
      composer = null;
      setWindowNudges(new Map());
    };
    document.addEventListener("focusin", onFocusIn);
    document.addEventListener("focusout", onFocusOut);
    return () => {
      document.removeEventListener("focusin", onFocusIn);
      document.removeEventListener("focusout", onFocusOut);
      observer?.disconnect();
      setWindowNudges(new Map());
    };
  }, []);

  const ready = snapshot !== null && sidebar !== null;
  useEffect(() => {
    const element = rootRef.current;
    if (!ready || element === null) return;
    const measure = () => {
      const rect = element.getBoundingClientRect();
      setDockFrame({ left: rect.left + rect.width / 2, maxWidth: rect.width });
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
    archivedThreads,
    threadById,
    liveById,
    groups,
    desktopGroups,
    moreGroups,
    groupByKey,
    foldersOf,
    effective,
    sort: effective.sort,
    call,
    refresh,
    openThread,
    openMenu,
    dropThread,
    restoreThread,
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
            <Taskbar frame={dockFrame} />
            <NeedsInputBalloon />
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

const SORT_LABELS: Record<SortKey, string> = {
  updated: "Updated at",
  created: "Created at",
  alpha: "Alphabetical",
};

function viewMenuEntries(desktop: DesktopContextValue): MenuEntry[] {
  const { preferences } = desktop.snapshot;
  return [
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

type MenuTrigger = Pick<MouseEvent, "clientX" | "clientY" | "preventDefault" | "stopPropagation">;

const PAGE_MENU_IGNORED = [
  "input",
  "textarea",
  "select",
  "button",
  "a",
  "label",
  "[contenteditable]",
  "[role]",
  "[data-promptbox]",
  "[data-promptbox-shell]",
  ".bbd-root",
  '[id^="plugin-homepage:"]:not([id="plugin-homepage:desktop:desktop"])',
].join(",");

function usePageBackgroundMenu(
  canvasRef: RefObject<HTMLDivElement | null>,
  entries: (event: MenuTrigger) => MenuEntry[],
) {
  const desktop = useDesktop();
  const latest = useRef({ desktop, entries });
  latest.current = { desktop, entries };

  useEffect(() => {
    const page = canvasRef.current?.closest('[class~="@container/page"]')?.parentElement;
    if (page === null || page === undefined) return;
    const onContextMenu = (event: MouseEvent) => {
      let node = event.target instanceof Element ? event.target : null;
      while (node !== null && node !== page) {
        if (node.matches(PAGE_MENU_IGNORED)) return;
        node = node.parentElement;
      }
      if (node === null) return;
      if (window.getSelection()?.isCollapsed === false) return;
      latest.current.desktop.openMenu(event, latest.current.entries(event));
    };
    page.addEventListener("contextmenu", onContextMenu);
    return () => page.removeEventListener("contextmenu", onContextMenu);
  }, [canvasRef]);
}

const RECYCLE_BIN_KEY = "recycle-bin";
const MORE_KEY = "more";
const ICON_BOX = { width: 88, height: 84 } as const;

interface IconDrag {
  keys: ReadonlySet<string>;
  delta: Point;
  overBin: boolean;
}

function isDeletable(group: DesktopGroup): boolean {
  return group.kind === "folder" || (group.kind === "section" && group.id !== null);
}

function deletePrompt(groups: DesktopGroup[]): string {
  const [only] = groups;
  if (groups.length === 1 && only !== undefined) {
    return only.kind === "folder"
      ? `Delete “${only.name}”? Threads inside are kept.`
      : `Delete the “${only.name}” section? Its threads move to Threads.`;
  }
  return `Delete these ${groups.length} items? Threads inside folders are kept, and threads in deleted sections move to Threads.`;
}

function DesktopCanvas() {
  const desktop = useDesktop();
  const manager = useWindowManager();
  const actions = useSidebarThreadActions();
  const { snapshot, call, sort } = desktop;
  const canvasRef = useRef<HTMLDivElement>(null);
  const binRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(900);
  const [selected, setSelected] = useState<ReadonlySet<string>>(() => new Set());
  const [drag, setDrag] = useState<IconDrag | null>(null);
  const [marquee, setMarquee] = useState<{ left: number; top: number; width: number; height: number } | null>(null);
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

  const items = desktop.desktopGroups;
  const hasMore = desktop.moreGroups.length > 0;
  const keys = useMemo(
    () => [RECYCLE_BIN_KEY, ...(hasMore ? [MORE_KEY] : []), ...items.map((item) => item.key)],
    [hasMore, items],
  );

  const positions = useMemo(() => {
    const placed = new Map<string, Point>();
    for (const key of keys) {
      const point = overrides[key] ?? snapshot.layout[key];
      if (point !== undefined) placed.set(key, point);
    }
    for (const key of keys) {
      if (placed.has(key)) continue;
      placed.set(key, nextFreePosition([...placed.values()], width));
    }
    return placed;
  }, [keys, overrides, snapshot.layout, width]);

  const saveLayout = useCallback(
    (entries: Record<string, Point>) => {
      setOverrides((current) => ({ ...current, ...entries }));
      void call("setLayout", { entries }).catch((error) => toast.error(errorMessage(error)));
    },
    [call],
  );

  const deletableIn = (keySet: ReadonlySet<string>) =>
    items.filter((group) => keySet.has(group.key) && isDeletable(group));

  const deleteGroups = (groups: DesktopGroup[]) => {
    if (groups.length === 0) {
      toast("Only folders and sections can be deleted.");
      return;
    }
    if (!window.confirm(deletePrompt(groups))) return;
    const fail = (error: unknown) => toast.error(errorMessage(error));
    for (const group of groups) {
      manager.close(`finder:${group.key}`);
      if (group.kind === "folder") void desktop.call("deleteFolder", { id: group.folder.id }).catch(fail);
      else if (group.kind === "section" && group.id !== null) {
        void desktop.call("deleteSection", { id: group.id }).catch(fail);
      }
    }
    setSelected(new Set());
  };

  const overBin = (x: number, y: number) => {
    const bin = binRef.current?.getBoundingClientRect();
    return bin !== undefined && x >= bin.left && x <= bin.right && y >= bin.top && y <= bin.bottom;
  };

  const beginIconDrag = (key: string, event: ReactPointerEvent<HTMLDivElement>) => {
    if (event.button !== 0) return;
    if (event.metaKey || event.ctrlKey || event.shiftKey) {
      setSelected((current) => {
        const next = new Set(current);
        if (next.has(key)) next.delete(key);
        else next.add(key);
        return next;
      });
      return;
    }
    const moving: ReadonlySet<string> = selected.has(key) ? selected : new Set([key]);
    if (!selected.has(key)) setSelected(moving);
    const origin = { x: event.clientX, y: event.clientY };
    const canDropOnBin = !moving.has(RECYCLE_BIN_KEY);
    let moved = false;
    let delta: Point = { x: 0, y: 0 };
    trackPointer(
      event,
      (next) => {
        if (!moved && Math.hypot(next.x, next.y) < 4) return;
        moved = true;
        delta = next;
        setDrag({ keys: moving, delta: next, overBin: canDropOnBin && overBin(origin.x + next.x, origin.y + next.y) });
      },
      () => {
        setDrag(null);
        if (!moved) return;
        if (canDropOnBin && overBin(origin.x + delta.x, origin.y + delta.y)) {
          deleteGroups(deletableIn(moving));
          return;
        }
        saveLayout(
          Object.fromEntries(
            [...moving].flatMap((movingKey) => {
              const point = positions.get(movingKey);
              return point === undefined
                ? []
                : [[movingKey, { x: Math.max(0, point.x + delta.x), y: Math.max(0, point.y + delta.y) }]];
            }),
          ),
        );
      },
    );
  };

  const beginMarquee = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (event.target !== event.currentTarget || event.button !== 0) return;
    const base: ReadonlySet<string> =
      event.metaKey || event.ctrlKey || event.shiftKey ? selected : new Set<string>();
    setSelected(base);
    const bounds = event.currentTarget.getBoundingClientRect();
    const start = { x: event.clientX - bounds.left, y: event.clientY - bounds.top };
    trackPointer(
      event,
      (delta) => {
        const box = {
          left: Math.min(start.x, start.x + delta.x),
          top: Math.min(start.y, start.y + delta.y),
          width: Math.abs(delta.x),
          height: Math.abs(delta.y),
        };
        setMarquee(box);
        const hit = new Set(base);
        for (const [key, point] of positions) {
          if (
            point.x < box.left + box.width &&
            point.x + ICON_BOX.width > box.left &&
            point.y < box.top + box.height &&
            point.y + ICON_BOX.height > box.top
          ) {
            hit.add(key);
          }
        }
        setSelected(hit);
      },
      () => setMarquee(null),
    );
  };

  const onKeyDown = (event: ReactKeyboardEvent<HTMLDivElement>) => {
    if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) return;
    if ((event.key === "Delete" || event.key === "Backspace") && selected.size > 0) {
      event.preventDefault();
      deleteGroups(deletableIn(selected));
    } else if (event.key === "Escape") {
      setSelected(new Set());
    } else if (event.key === "a" && (event.metaKey || event.ctrlKey)) {
      event.preventDefault();
      setSelected(new Set(keys));
    }
  };

  const iconMenu = (key: string, single: MenuEntry[]): MenuEntry[] => {
    if (!(selected.has(key) && selected.size > 1)) return single;
    const groups = items.filter((group) => selected.has(group.key));
    const deletable = groups.filter(isDeletable);
    return [
      {
        label: `Open ${groups.length} folders`,
        disabled: groups.length === 0,
        run: () => {
          for (const group of groups) manager.open({ kind: "finder", key: group.key });
        },
      },
      "separator",
      {
        label: deletable.length === 1 ? "Delete 1 item" : `Delete ${deletable.length} items`,
        icon: <TrashGlyph className="size-3.5" />,
        disabled: deletable.length === 0,
        run: () => deleteGroups(deletable),
      },
    ];
  };

  const placed = (key: string): Point => {
    const point = positions.get(key)!;
    return drag !== null && drag.keys.has(key)
      ? { x: Math.max(0, point.x + drag.delta.x), y: Math.max(0, point.y + drag.delta.y) }
      : point;
  };

  const arrange = () => {
    const direction = sort.direction === "ascending" ? 1 : -1;
    const valueOf = (group: DesktopGroup) => groupSortValue(group, desktop.visibleThreads, sort.key);
    const ordered = [...items].sort((left, right) => {
      const leftValue = valueOf(left);
      const rightValue = valueOf(right);
      return leftValue < rightValue ? -direction : leftValue > rightValue ? direction : 0;
    });
    const keys = [...ordered.map((item) => item.key), ...(hasMore ? [MORE_KEY] : []), RECYCLE_BIN_KEY];
    const grid = gridPositions(keys.length, width);
    saveLayout(Object.fromEntries(keys.map((key, index) => [key, grid[index]!])));
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
    { label: "Recycle Bin", icon: <RecycleBinArt size={14} />, run: () => manager.open({ kind: "recycle-bin" }) },
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
  const canvasMenu = (event: MenuTrigger): MenuEntry[] => [
    ...commands.slice(0, 2),
    {
      label: "New sticky note",
      icon: <StickyNoteGlyph className="size-3.5" />,
      run: () => addStickyNote({ left: event.clientX, top: event.clientY }),
    },
    ...commands.slice(2),
    "separator",
    ...viewMenuEntries(desktop),
  ];
  usePageBackgroundMenu(canvasRef, canvasMenu);

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
        onPointerDown={beginMarquee}
        onKeyDown={onKeyDown}
        onContextMenu={(event) => desktop.openMenu(event, canvasMenu(event))}
      >
        {items.map((item) => (
          <DesktopIcon
            key={item.key}
            group={item}
            position={placed(item.key)}
            selected={selected.has(item.key)}
            dragging={drag !== null && drag.keys.has(item.key)}
            onPointerDown={(event) => beginIconDrag(item.key, event)}
            menu={(single) => iconMenu(item.key, single)}
            onSelect={() => {
              if (!selected.has(item.key)) setSelected(new Set([item.key]));
            }}
          />
        ))}
        {hasMore ? (
          <MoreIcon
            position={placed(MORE_KEY)}
            selected={selected.has(MORE_KEY)}
            dragging={drag !== null && drag.keys.has(MORE_KEY)}
            onPointerDown={(event) => beginIconDrag(MORE_KEY, event)}
            onSelect={() => {
              if (!selected.has(MORE_KEY)) setSelected(new Set([MORE_KEY]));
            }}
          />
        ) : null}
        <RecycleBinIcon
          binRef={binRef}
          position={placed(RECYCLE_BIN_KEY)}
          selected={selected.has(RECYCLE_BIN_KEY)}
          dragging={drag !== null && drag.keys.has(RECYCLE_BIN_KEY)}
          iconsOver={drag?.overBin === true}
          onPointerDown={(event) => beginIconDrag(RECYCLE_BIN_KEY, event)}
          onSelect={() => {
            if (!selected.has(RECYCLE_BIN_KEY)) setSelected(new Set([RECYCLE_BIN_KEY]));
          }}
          onArchive={(threadId) => {
            closeThreadWindows(manager, threadId);
            actions.archive(threadId);
          }}
        />
        {marquee === null ? null : (
          <div
            className="bbd-marquee"
            style={{ left: marquee.left, top: marquee.top, width: marquee.width, height: marquee.height }}
            aria-hidden
          />
        )}
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
    case "recycle-bin":
      return "Recycle Bin";
    case "more":
      return "More";
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
    case "finder": {
      const group = desktop.groupByKey.get(spec.key);
      return (
        <FolderArt
          kind={group?.kind ?? "section"}
          size={size}
          empty={group !== undefined && groupThreads(group, desktop.visibleThreads).length === 0}
        />
      );
    }
    case "thread":
      return <ThreadArt size={size} />;
    case "panel":
      return <GlyphTile glyph={PanelRightGlyph} size={size + 2} />;
    case "threads":
      return <GlyphTile glyph={ThreadsGlyph} size={size + 2} />;
    case "recycle-bin":
      return <RecycleBinArt size={size} full={desktop.archivedThreads.length > 0} />;
    case "more":
      return <FolderArt kind="section" size={size} empty={desktop.moreGroups.length === 0} />;
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
  maxWidth: number;
}

const START_ITEMS: { spec: WindowSpec; label: string; detail: string }[] = [
  { spec: { kind: "new-thread", groupKey: null }, label: "New thread", detail: "Start a conversation" },
  { spec: { kind: "new-folder" }, label: "New folder", detail: "Group threads on the desktop" },
  { spec: { kind: "media-player" }, label: "Windows Media Player", detail: "Visualize your microphone" },
];

function StartFlag() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden>
      <path d="M2 3.2 Q4.8 2 8.2 3.4 L7.4 8.2 Q4.2 7 1.4 8 Z" fill="oklch(0.66 0.21 30)" />
      <path d="M9.4 3.8 Q12.6 5 16 3.6 L15.2 8.4 Q12 9.6 8.6 8.6 Z" fill="oklch(0.74 0.19 140)" />
      <path d="M1.2 9.2 Q4 8.2 7.2 9.4 L6.4 14.2 Q3.4 13 0.4 14 Z" fill="oklch(0.62 0.18 250)" />
      <path d="M8.4 9.8 Q11.6 11 15 9.6 L14.2 14.4 Q11 15.6 7.6 14.6 Z" fill="oklch(0.86 0.16 90)" />
    </svg>
  );
}

function StartMenu({ onClose }: { onClose: () => void }) {
  const manager = useWindowManager();
  const desktop = useDesktop();
  const menuRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    menuRef.current?.querySelector<HTMLButtonElement>("button")?.focus();
    const onPointerDown = (event: PointerEvent) => {
      const target = event.target as Node;
      if (menuRef.current?.contains(target) || (target as Element).closest?.(".bbd-start")) return;
      onClose();
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("pointerdown", onPointerDown, true);
    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("pointerdown", onPointerDown, true);
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [onClose]);
  const run = (action: () => void) => () => {
    onClose();
    action();
  };
  return (
    <div ref={menuRef} className="bbd-start-menu" role="menu" aria-label="Start menu">
      <div className="bbd-start-head">
        <span className="bbd-start-avatar">
          <StartFlag />
        </span>
        <span>bb</span>
      </div>
      <div className="bbd-start-body">
        {START_ITEMS.map((item) => (
          <button key={item.label} type="button" role="menuitem" className="bbd-start-item" onClick={run(() => manager.open(item.spec))}>
            {windowArt(item.spec, desktop, 30)}
            <span>
              <strong>{item.label}</strong>
              <small>{item.detail}</small>
            </span>
          </button>
        ))}
        <button type="button" role="menuitem" className="bbd-start-item" onClick={run(() => addStickyNote())}>
          <StickyNoteArt size={30} />
          <span>
            <strong>Sticky note</strong>
            <small>Pin a note in the margin</small>
          </span>
        </button>
      </div>
      <div className="bbd-start-foot">
        <button type="button" role="menuitem" className="bbd-start-off" onClick={run(toggleDesktop)}>
          <span className="bbd-start-power" aria-hidden>
            <PowerGlyph className="size-3.5" strokeWidth={2.5} />
          </span>
          Turn Off Desktop
        </button>
      </div>
    </div>
  );
}

interface QuickLaunchItem {
  id: string;
  label: string;
  art: ReactNode;
  run: () => void;
}

function navigateInApp(path: string) {
  window.history.pushState(null, "", path);
  window.dispatchEvent(new PopStateEvent("popstate"));
}

function useQuickLaunchCatalog(): QuickLaunchItem[] {
  const desktop = useDesktop();
  const manager = useWindowManager();
  const hiddenByShowDesktop = useRef<string[]>([]);
  const showDesktop = () => {
    const open = manager.windows.filter((window) => !window.minimized);
    if (open.length > 0) {
      hiddenByShowDesktop.current = open.map((window) => window.id);
      for (const window of open) manager.minimize(window.id, true);
      return;
    }
    for (const id of hiddenByShowDesktop.current) manager.minimize(id, false);
    hiddenByShowDesktop.current = [];
  };
  const launcher = (spec: WindowSpec, label: string): QuickLaunchItem => ({
    id: spec.kind,
    label,
    art: windowArt(spec, desktop, 18),
    run: () => manager.open(spec),
  });
  return [
    { id: "show-desktop", label: "Show desktop", art: <GlyphTile glyph={ShowDesktopGlyph} size={20} />, run: showDesktop },
    launcher({ kind: "new-thread", groupKey: null }, "New thread"),
    launcher({ kind: "new-folder" }, "New folder"),
    launcher({ kind: "threads" }, "Threads"),
    launcher({ kind: "recycle-bin" }, "Recycle Bin"),
    launcher({ kind: "media-player" }, "Windows Media Player"),
    { id: "sticky-note", label: "Sticky note", art: <StickyNoteArt size={18} />, run: () => addStickyNote() },
    { id: "plugins", label: "Plugins", art: <GlyphTile glyph={PluginsGlyph} size={20} />, run: () => navigateInApp("/plugins") },
    { id: "skills", label: "Skills", art: <GlyphTile glyph={SkillsGlyph} size={20} />, run: () => navigateInApp("/skills") },
  ];
}

function quickLaunchMenu(
  desktop: DesktopContextValue,
  catalog: QuickLaunchItem[],
  itemId: string | null,
): MenuEntry[] {
  const chosen = desktop.snapshot.preferences.quickLaunch;
  const save = (quickLaunch: string[]) => desktop.setPreferences({ quickLaunch });
  const index = itemId === null ? -1 : chosen.indexOf(itemId);
  const move = (offset: number) => {
    const next = [...chosen];
    const [item] = next.splice(index, 1);
    if (item === undefined) return;
    next.splice(index + offset, 0, item);
    save(next);
  };
  return [
    ...(index === -1
      ? []
      : [
          { label: "Move left", disabled: index === 0, run: () => move(-1) },
          { label: "Move right", disabled: index === chosen.length - 1, run: () => move(1) },
          "separator" as const,
        ]),
    { heading: "Quick Launch" },
    ...catalog.map((item) => ({
      label: item.label,
      checked: chosen.includes(item.id),
      run: () =>
        save(chosen.includes(item.id) ? chosen.filter((id) => id !== item.id) : [...chosen, item.id]),
    })),
  ];
}

function Taskbar({ frame }: { frame: DockFrame | null }) {
  const desktop = useDesktop();
  const manager = useWindowManager();
  const catalog = useQuickLaunchCatalog();
  const quickLaunch = desktop.snapshot.preferences.quickLaunch.flatMap(
    (id) => catalog.find((item) => item.id === id) ?? [],
  );
  const { status } = useMic();
  const playing = status === "live" || status === "starting";
  const [startOpen, setStartOpen] = useState(false);
  const closeStart = useCallback(() => setStartOpen(false), []);
  const activate = (id: string) => {
    if (manager.focusedId === id) manager.minimize(id, true);
    else manager.focus(id);
  };
  return (
    <nav
      className="bbd-taskbar"
      aria-label="Taskbar"
      style={frame === null ? undefined : { left: frame.left, maxWidth: frame.maxWidth - 24 }}
      onContextMenu={(event) => desktop.openMenu(event, quickLaunchMenu(desktop, catalog, null))}
    >
      <button
        type="button"
        className="bbd-start"
        aria-haspopup="menu"
        aria-expanded={startOpen}
        onClick={() => setStartOpen((open) => !open)}
      >
        <StartFlag />
        <span>start</span>
      </button>
      {startOpen && <StartMenu onClose={closeStart} />}
      <div className="bbd-quick" role="toolbar" aria-label="Quick Launch">
        {quickLaunch.map((item) => (
          <button
            key={item.id}
            type="button"
            className="bbd-quick-item"
            aria-label={item.label}
            title={item.label}
            onClick={item.run}
            onContextMenu={(event) => desktop.openMenu(event, quickLaunchMenu(desktop, catalog, item.id))}
          >
            {item.art}
          </button>
        ))}
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
              data-focused={manager.focusedId === window.id && !window.minimized}
              onClick={() => activate(window.id)}
            >
              <span className="bbd-task-icon">{windowArt(window.spec, desktop, 16)}</span>
              <span className="min-w-0 truncate">{title}</span>
            </button>
          );
        })}
      </div>
      <div className="bbd-tray">
        {playing && <MediaDeskband onRestore={() => manager.open({ kind: "media-player" })} />}
        <TrayIcons />
        <TrayClock />
      </div>
    </nav>
  );
}

interface FooterItem {
  key: string;
  label: string;
  title: string;
  iconHtml: string;
  disclosure: boolean;
}

const OWN_FOOTER_ITEM = "plugin-sidebar-footer-action-desktop-toggle";

function footerElements(): HTMLElement[] {
  const footer = document.querySelector('[data-sidebar="footer"]');
  return footer === null ? [] : [...footer.querySelectorAll<HTMLElement>("a[aria-label], button[aria-label]")];
}

function footerKey(element: HTMLElement): string {
  const testId = element.dataset.testid;
  return testId !== undefined && testId.startsWith("plugin-sidebar-footer") ? testId : element.getAttribute("aria-label") ?? "";
}

function readFooterItems(): FooterItem[] {
  return footerElements().flatMap((element) => {
    const key = footerKey(element);
    const icon = element.querySelector("svg, [data-icon-root]");
    if (key === OWN_FOOTER_ITEM || icon === null) return [];
    const title = element.getAttribute("aria-label") ?? "";
    return [
      {
        key,
        title,
        label: title.replace(/\s*\(.*\)$/, ""),
        iconHtml: icon.outerHTML,
        disclosure: element.hasAttribute("aria-expanded"),
      },
    ];
  });
}

function useFooterItems(): FooterItem[] {
  const [items, setItems] = useState<FooterItem[]>(readFooterItems);
  useEffect(() => {
    let last = JSON.stringify(items);
    const sync = () => {
      const next = readFooterItems();
      const serialized = JSON.stringify(next);
      if (serialized === last) return;
      last = serialized;
      setItems(next);
    };
    const timer = setInterval(sync, 1500);
    sync();
    return () => clearInterval(timer);
  }, []);
  return items;
}

function activateFooterItem(item: FooterItem) {
  const target = footerElements().find((element) => footerKey(element) === item.key);
  if (target === undefined) return;
  const collapsed = document.querySelector('.peer[data-side="left"][data-state="collapsed"]') !== null;
  if (item.disclosure && collapsed) {
    document.querySelector<HTMLElement>('button[data-sidebar="trigger"]')?.click();
    requestAnimationFrame(() => requestAnimationFrame(() => target.click()));
    return;
  }
  target.click();
}

function TrayIcons() {
  const items = useFooterItems();
  if (items.length === 0) return null;
  return (
    <div className="bbd-tray-icons" role="group" aria-label="Sidebar footer">
      {items.map((item) => (
        <button
          key={item.key}
          type="button"
          className="bbd-tray-icon"
          aria-label={item.label}
          title={item.title}
          onClick={() => activateFooterItem(item)}
          dangerouslySetInnerHTML={{ __html: item.iconHtml }}
        />
      ))}
    </div>
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
  dragging,
  onPointerDown,
  onSelect,
  menu,
}: {
  group: DesktopGroup;
  position: Point;
  selected: boolean;
  dragging: boolean;
  onPointerDown: (event: ReactPointerEvent<HTMLDivElement>) => void;
  onSelect: () => void;
  menu: (single: MenuEntry[]) => MenuEntry[];
}) {
  const desktop = useDesktop();
  const manager = useWindowManager();
  const drop = useDropTarget(group);

  const open = () => manager.open({ kind: "finder", key: group.key });

  const members = groupThreads(group, desktop.visibleThreads);
  const tones = members.map(statusTone);
  const tone = tones.includes("attention") ? "attention" : tones.includes("running") ? "running" : null;
  const toneCount = tones.filter((candidate) => candidate === tone).length;
  const unread = tone === null && members.some((thread) => thread.isUnread);
  const summary = folderSummary(group.name, members.length, tone, toneCount);

  return (
    <div
      role="button"
      tabIndex={0}
      aria-selected={selected}
      aria-label={summary}
      title={summary}
      className="bbd-icon"
      data-dragging={dragging}
      data-drop-target={drop.over}
      style={{ left: position.x, top: position.y }}
      onPointerDown={onPointerDown}
      onDoubleClick={open}
      onKeyDown={(event) => {
        if (event.key === "Enter") open();
      }}
      onContextMenu={(event) => {
        onSelect();
        desktop.openMenu(event, menu(groupMenu(desktop, manager, group, open)));
      }}
      {...drop.handlers}
    >
      <span className="bbd-icon-art">
        <FolderArt kind={group.kind} empty={members.length === 0} />
        {tone !== null ? (
          <span className="bbd-dot" data-tone={tone} aria-hidden>
            {toneCount > 1 ? toneCount : null}
          </span>
        ) : unread ? (
          <span className="bbd-dot" data-tone="running" style={{ animation: "none" }} aria-hidden />
        ) : null}
      </span>
      <span className="bbd-icon-label">{group.name}</span>
    </div>
  );
}

function groupTone(members: readonly DesktopThread[]) {
  const tones = members.map(statusTone);
  const tone = tones.includes("attention") ? "attention" : tones.includes("running") ? "running" : null;
  return {
    tone,
    toneCount: tones.filter((candidate) => candidate === tone).length,
    unread: tone === null && members.some((thread) => thread.isUnread),
  } as const;
}

function StatusDot({ members }: { members: readonly DesktopThread[] }) {
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

function moreMembers(desktop: DesktopContextValue): DesktopThread[] {
  const byId = new Map(
    desktop.moreGroups.flatMap((group) => groupThreads(group, desktop.visibleThreads)).map((thread) => [thread.id, thread]),
  );
  return [...byId.values()];
}

function MoreIcon({
  position,
  selected,
  dragging,
  onPointerDown,
  onSelect,
}: {
  position: Point;
  selected: boolean;
  dragging: boolean;
  onPointerDown: (event: ReactPointerEvent<HTMLDivElement>) => void;
  onSelect: () => void;
}) {
  const desktop = useDesktop();
  const manager = useWindowManager();
  const open = () => manager.open({ kind: "more" });
  const members = moreMembers(desktop);
  const { tone, toneCount } = groupTone(members);
  const count = desktop.moreGroups.length;
  const summary = `${folderSummary("More", members.length, tone, toneCount)} · ${count} ${count === 1 ? "folder" : "folders"} hidden in the sidebar`;
  return (
    <div
      role="button"
      tabIndex={0}
      aria-selected={selected}
      aria-label={summary}
      title={summary}
      className="bbd-icon"
      data-dragging={dragging}
      style={{ left: position.x, top: position.y }}
      onPointerDown={onPointerDown}
      onDoubleClick={open}
      onKeyDown={(event) => {
        if (event.key === "Enter") open();
      }}
      onContextMenu={(event) => {
        onSelect();
        desktop.openMenu(event, [{ label: "Open", run: open }]);
      }}
    >
      <span className="bbd-icon-art">
        <FolderArt kind="section" empty={count === 0} />
        <StatusDot members={members} />
      </span>
      <span className="bbd-icon-label">More</span>
    </div>
  );
}

function MoreFolderItem({ group }: { group: DesktopGroup }) {
  const desktop = useDesktop();
  const manager = useWindowManager();
  const drop = useDropTarget(group);
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
      data-drop-target={drop.over}
      onDoubleClick={open}
      onKeyDown={(event) => {
        if (event.key === "Enter") open();
      }}
      onContextMenu={(event) => desktop.openMenu(event, groupMenu(desktop, manager, group, open))}
      {...drop.handlers}
    >
      <span className="bbd-icon-art relative">
        <FolderArt kind={group.kind} empty={members.length === 0} />
        <StatusDot members={members} />
      </span>
      <span className="bbd-icon-label">{group.name}</span>
    </div>
  );
}

function MoreWindow({ window: desktopWindow }: { window: DesktopWindow }) {
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

function RecycleBinIcon({
  binRef,
  position,
  selected,
  dragging,
  iconsOver,
  onPointerDown,
  onSelect,
  onArchive,
}: {
  binRef: RefObject<HTMLDivElement | null>;
  position: Point;
  selected: boolean;
  dragging: boolean;
  iconsOver: boolean;
  onPointerDown: (event: ReactPointerEvent<HTMLDivElement>) => void;
  onSelect: () => void;
  onArchive: (threadId: string) => void;
}) {
  const desktop = useDesktop();
  const manager = useWindowManager();
  const [threadOver, setThreadOver] = useState(false);
  const open = () => manager.open({ kind: "recycle-bin" });
  const count = desktop.archivedThreads.length;
  const summary =
    count === 0 ? "Recycle Bin — empty" : `Recycle Bin — ${count} archived ${count === 1 ? "thread" : "threads"}`;

  return (
    <div
      ref={binRef}
      role="button"
      tabIndex={0}
      aria-selected={selected}
      aria-label={summary}
      title={summary}
      className="bbd-icon"
      data-dragging={dragging}
      data-drop-target={threadOver || iconsOver}
      style={{ left: position.x, top: position.y }}
      onPointerDown={onPointerDown}
      onDoubleClick={open}
      onKeyDown={(event) => {
        if (event.key === "Enter") open();
      }}
      onContextMenu={(event) => {
        onSelect();
        desktop.openMenu(event, [{ label: "Open", run: open }]);
      }}
      onDragOver={(event) => {
        if (!event.dataTransfer.types.includes(THREAD_DRAG_TYPE)) return;
        event.preventDefault();
        event.dataTransfer.dropEffect = "move";
        setThreadOver(true);
      }}
      onDragLeave={() => setThreadOver(false)}
      onDrop={(event) => {
        setThreadOver(false);
        const threadDrag = readThreadDrag(event);
        if (threadDrag === null) return;
        event.preventDefault();
        if (desktop.threadById.get(threadDrag.threadId)?.isArchived === true) return;
        onArchive(threadDrag.threadId);
      }}
    >
      <span className="bbd-icon-art">
        <RecycleBinArt full={count > 0} />
      </span>
      <span className="bbd-icon-label">Recycle Bin</span>
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
    case "recycle-bin":
      return <RecycleBinWindow window={desktopWindow} />;
    case "more":
      return <MoreWindow window={desktopWindow} />;
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
    thread.isArchived
      ? { label: "Restore", run: () => void desktop.restoreThread(thread.id) }
      : {
          label: "Archive",
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

function folderSummary(
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

function statusKind(thread: DesktopThread): StatusKind {
  if (thread.needsInput) return "attention";
  if (thread.isArchived) return "archived";
  if (thread.status === "error") return "error";
  if (thread.status === "active" || thread.status === "starting" || thread.status === "stopping") return "working";
  return thread.isUnread ? "unread" : "idle";
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

function threadTooltip(desktop: DesktopContextValue, thread: DesktopThread): string {
  const folders = desktop.foldersOf(thread.id);
  return folders.length === 0 ? thread.title : `${thread.title}\nIn ${folders.join(", ")}`;
}

function ThreadCollection({
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
                <span className="flex min-w-0 items-center gap-1 text-muted-foreground">
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
                ? "Nothing here. Drag threads in from another folder or the Threads window."
                : "No threads here."
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
                {desktop.foldersOf(threadId).length === 0 ? "None" : desktop.foldersOf(threadId).join(", ")}
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
        </div>
        <div className="bbd-sunken min-h-0 flex-1 overflow-auto">
          <ThreadCollection threads={threads} group={null} view="list" emptyText="No threads." showFolders />
        </div>
      </div>
    </WindowFrame>
  );
}

function RecycleBinWindow({ window: desktopWindow }: { window: DesktopWindow }) {
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
