import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type DragEvent,
  type ReactNode,
} from "react";
import {
  definePluginApp,
  useBbNavigate,
  useRealtime,
  useRealtimeConnectionState,
  useRpc,
} from "@get-bb/plugin-sdk/app";
import type { PluginNavPanelProps } from "@get-bb/plugin-sdk/app";

import {
  BOARD_CHANGED_CHANNEL,
  buildColumns,
  buildDashboard,
  orderSections,
  parseSidebarSectionOrder,
  relativeTime,
  SIDEBAR_SECTION_ORDER_STORAGE_KEY,
  threadStatusLabel,
  threadTone,
  type BoardColumn,
  type ThreadTone,
} from "./core";
import type { BoardPayload, BoardThread, rpcContract } from "./server";

const POLL_INTERVAL_MS = 10_000;
const SIGNAL_DEBOUNCE_MS = 300;
const DRAG_MIME = "application/x-bb-thread-id";

function useSidebarTheme() {
  const ref = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    const target = ref.current;
    if (!target) return;
    const tokens = [
      "--sidebar", "--sidebar-foreground", "--sidebar-accent",
      "--sidebar-accent-foreground", "--sidebar-ring", "--muted-foreground",
      "--foreground", "--warning-text", "--destructive", "--font-sans", "--radius",
    ];
    const sync = () => {
      const sidebar = document.querySelector(".fixed.bg-sidebar");
      if (!sidebar) {
        for (const token of tokens) target.style.removeProperty(token);
        return;
      }
      const style = getComputedStyle(sidebar);
      for (const token of tokens) {
        const value = style.getPropertyValue(token);
        if (target.style.getPropertyValue(token) !== value) {
          target.style.setProperty(token, value);
        }
      }
    };
    sync();
    const observer = new MutationObserver(sync);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class", "style"] });
    observer.observe(document.head, { childList: true, subtree: true, characterData: true, attributes: true });
    const sidebar = document.querySelector(".fixed.bg-sidebar");
    if (sidebar) observer.observe(sidebar, { attributes: true, attributeFilter: ["class", "style"] });
    return () => observer.disconnect();
  }, []);
  return ref;
}

function toneClass(tone: ThreadTone): string {
  switch (tone) {
    case "active":
      return "bg-foreground animate-pulse";
    case "attention":
      return "bg-warning-text";
    case "error":
      return "bg-destructive";
    case "idle":
      return "bg-muted-foreground/40";
  }
}

interface BoardState {
  payload: BoardPayload | null;
  error: string | null;
  loading: boolean;
}

function useBoard() {
  const rpc = useRpc<typeof rpcContract>();
  const [state, setState] = useState<BoardState>({
    payload: null,
    error: null,
    loading: true,
  });
  const inFlight = useRef<Promise<void> | null>(null);

  const reload = useCallback(() => {
    if (inFlight.current) return inFlight.current;
    const request = rpc
      .call("board", {})
      .then((payload) => {
        setState({ payload, error: null, loading: false });
      })
      .catch((error: unknown) => {
        setState((previous) => ({
          ...previous,
          error: error instanceof Error ? error.message : String(error),
          loading: false,
        }));
      })
      .finally(() => {
        inFlight.current = null;
      });
    inFlight.current = request;
    return request;
  }, [rpc]);

  useEffect(() => {
    void reload();
  }, [reload]);

  // Live: thread changes arrive as a plugin signal from the server.
  const signalTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useRealtime(BOARD_CHANGED_CHANNEL, () => {
    if (signalTimer.current) clearTimeout(signalTimer.current);
    signalTimer.current = setTimeout(() => {
      signalTimer.current = null;
      void reload();
    }, SIGNAL_DEBOUNCE_MS);
  });
  useEffect(
    () => () => {
      if (signalTimer.current) clearTimeout(signalTimer.current);
    },
    [],
  );

  // Reconcile after a reconnect: signals sent while offline are not replayed.
  const connection = useRealtimeConnectionState();
  const seenConnected = useRef(false);
  useEffect(() => {
    if (connection !== "connected") return;
    if (seenConnected.current) void reload();
    seenConnected.current = true;
  }, [connection, reload]);

  // Fallback poll: section create/rename/delete has no realtime event.
  useEffect(() => {
    const timer = setInterval(() => {
      if (typeof document !== "undefined" && document.hidden) return;
      void reload();
    }, POLL_INTERVAL_MS);
    return () => clearInterval(timer);
  }, [reload]);

  const patchThread = useCallback((thread: BoardThread) => {
    setState((previous) => {
      if (!previous.payload) return previous;
      return {
        ...previous,
        payload: {
          ...previous.payload,
          threads: previous.payload.threads.map((candidate) =>
            candidate.id === thread.id ? thread : candidate,
          ),
        },
      };
    });
  }, []);

  const setError = useCallback((error: string | null) => {
    setState((previous) => ({ ...previous, error }));
  }, []);

  return { ...state, reload, patchThread, setError, rpc };
}

function ThreadCard({
  thread,
  dragging,
  moving,
  onOpen,
  onDragStart,
  onDragEnd,
}: {
  thread: BoardThread;
  dragging: boolean;
  moving: boolean;
  onOpen: () => void;
  onDragStart: (event: DragEvent<HTMLElement>) => void;
  onDragEnd: () => void;
}) {
  const tone = threadTone(thread);
  const label = threadStatusLabel(thread);
  return (
    <article
      aria-label={thread.title}
      className={`group/thread-row group/card relative w-full cursor-grab select-none rounded-md bg-sidebar px-2 py-2 text-sm text-sidebar-foreground/85 transition-none dark:text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground active:cursor-grabbing ${
        dragging ? "opacity-40" : ""
      } ${moving ? "opacity-60" : ""}`}
      data-thread-id={thread.id}
      draggable={!moving}
      onDragEnd={onDragEnd}
      onDragStart={onDragStart}
    >
      <a
        aria-label={`Open ${thread.title}`}
        className="absolute inset-0 cursor-inherit rounded-md outline-none ring-sidebar-ring focus-visible:ring-2"
        data-sidebar-thread-id={thread.id}
        draggable={false}
        href={`/projects/${encodeURIComponent(thread.projectId)}/threads/${encodeURIComponent(thread.id)}`}
        onClick={(event) => {
          if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
          event.preventDefault();
          if (!dragging && !moving) onOpen();
        }}
      />
      <span className="pointer-events-none line-clamp-2 font-normal">{thread.title}</span>
      <div className="pointer-events-none mt-1.5 flex items-center gap-1.5 text-xs text-muted-foreground group-hover/card:text-inherit">
        <span
          aria-hidden="true"
          className={`inline-block size-1.5 rounded-full ${toneClass(tone)}`}
        />
        <span>{label}</span>
        {thread.pinned ? <span aria-label="Pinned">· pinned</span> : null}
        <span className="ml-auto tabular-nums" title={new Date(thread.updatedAt).toLocaleString()}>
          {relativeTime(thread.updatedAt)}
        </span>
      </div>
    </article>
  );
}

function Column({
  column,
  draggingId,
  isDropTarget,
  movingIds,
  onDragEnter,
  onDragLeave,
  onDrop,
  onOpen,
  onDragStart,
  onDragEnd,
}: {
  column: BoardColumn<BoardThread>;
  draggingId: string | null;
  isDropTarget: boolean;
  movingIds: ReadonlySet<string>;
  onDragEnter: () => void;
  onDragLeave: () => void;
  onDrop: (threadId: string) => void;
  onOpen: (threadId: string) => void;
  onDragStart: (threadId: string, event: DragEvent<HTMLElement>) => void;
  onDragEnd: () => void;
}) {
  const depth = useRef(0);
  return (
    <section
      aria-label={column.name}
      className={`flex h-full w-72 flex-none flex-col rounded-lg border transition-colors ${
        isDropTarget
          ? "border-foreground/40 bg-accent/60"
          : "border-transparent bg-muted/40"
      }`}
      data-section-id={column.sectionId ?? ""}
      onDragEnter={(event) => {
        if (!event.dataTransfer.types.includes(DRAG_MIME)) return;
        depth.current += 1;
        if (depth.current === 1) onDragEnter();
      }}
      onDragLeave={() => {
        depth.current = Math.max(0, depth.current - 1);
        if (depth.current === 0) onDragLeave();
      }}
      onDragOver={(event) => {
        if (!event.dataTransfer.types.includes(DRAG_MIME)) return;
        event.preventDefault();
        event.dataTransfer.dropEffect = "move";
      }}
      onDrop={(event) => {
        event.preventDefault();
        depth.current = 0;
        const threadId = event.dataTransfer.getData(DRAG_MIME) || draggingId;
        onDragLeave();
        if (threadId) onDrop(threadId);
      }}
    >
      <header className="flex items-center gap-2 px-3 pb-1 pt-2.5">
        <h2 className="truncate text-sm font-medium text-foreground">{column.name}</h2>
        <span className="ml-auto rounded-full bg-background/80 px-1.5 text-xs tabular-nums text-muted-foreground">
          {column.threads.length}
        </span>
      </header>
      <div className="flex min-h-16 flex-1 flex-col gap-2 overflow-y-auto px-2 pb-2">
        {column.threads.length === 0 ? (
          <p className="rounded-md border border-dashed border-border/70 px-2 py-4 text-center text-xs text-muted-foreground">
            {isDropTarget ? "Drop to move here" : "No threads"}
          </p>
        ) : (
          column.threads.map((thread) => (
            <ThreadCard
              dragging={draggingId === thread.id}
              key={thread.id}
              moving={movingIds.has(thread.id)}
              onDragEnd={onDragEnd}
              onDragStart={(event) => onDragStart(thread.id, event)}
              onOpen={() => onOpen(thread.id)}
              thread={thread}
            />
          ))
        )}
      </div>
    </section>
  );
}

type BoardApi = ReturnType<typeof useBoard>;

function BoardView({ board }: { board: BoardApi }) {
  const sidebarThemeRef = useSidebarTheme();
  const navigate = useBbNavigate();
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dropTargetKey, setDropTargetKey] = useState<string | null>(null);
  const [movingIds, setMovingIds] = useState<ReadonlySet<string>>(new Set());

  const columns = useMemo(
    () =>
      board.payload ? buildColumns(board.payload.sections, board.payload.threads) : [],
    [board.payload],
  );

  const moveThread = useCallback(
    async (threadId: string, sectionId: string | null) => {
      const current = board.payload?.threads.find((thread) => thread.id === threadId);
      if (!current || current.sectionId === sectionId) return;
      board.setError(null);
      setMovingIds((previous) => new Set(previous).add(threadId));
      board.patchThread({ ...current, sectionId });
      try {
        const updated = await board.rpc.call("moveThread", { threadId, sectionId });
        board.patchThread(updated);
      } catch (error) {
        board.patchThread(current);
        board.setError(
          error instanceof Error ? error.message : "Could not move the thread.",
        );
        void board.reload();
      } finally {
        setMovingIds((previous) => {
          const next = new Set(previous);
          next.delete(threadId);
          return next;
        });
      }
    },
    [board],
  );

  const onDragStart = useCallback((threadId: string, event: DragEvent<HTMLElement>) => {
    event.dataTransfer.setData(DRAG_MIME, threadId);
    event.dataTransfer.setData("text/plain", threadId);
    event.dataTransfer.effectAllowed = "move";
    setDraggingId(threadId);
  }, []);
  const onDragEnd = useCallback(() => {
    setDraggingId(null);
    setDropTargetKey(null);
  }, []);

  if (columns.length === 0) {
    return (
      <div ref={sidebarThemeRef} className="flex flex-1 flex-col items-center justify-center gap-1 text-sm text-muted-foreground">
        <p>No thread sections yet.</p>
        <p className="text-xs">Create one in the sidebar and it becomes a column here.</p>
      </div>
    );
  }

  return (
    <div ref={sidebarThemeRef} className="flex min-h-0 flex-1 gap-3 overflow-x-auto p-4 md:p-5">
      {columns.map((column) => (
        <Column
          column={column}
          draggingId={draggingId}
          isDropTarget={dropTargetKey === column.key}
          key={column.key}
          movingIds={movingIds}
          onDragEnd={onDragEnd}
          onDragEnter={() => setDropTargetKey(column.key)}
          onDragLeave={() =>
            setDropTargetKey((previous) => (previous === column.key ? null : previous))
          }
          onDragStart={onDragStart}
          onDrop={(threadId) => {
            setDraggingId(null);
            void moveThread(threadId, column.sectionId);
          }}
          onOpen={(threadId) => navigate.toThread(threadId)}
        />
      ))}
    </div>
  );
}

function StatTile({ label, value, hint }: { label: string; value: number; hint?: string }) {
  return (
    <div className="rounded-lg border border-border bg-card px-4 py-3">
      <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </div>
      <div className="mt-1 text-2xl font-semibold tabular-nums text-foreground">{value}</div>
      {hint ? <div className="mt-0.5 text-xs text-muted-foreground">{hint}</div> : null}
    </div>
  );
}

function ThreadRow({
  thread,
  sectionName,
  onOpen,
}: {
  thread: BoardThread;
  sectionName: string | null;
  onOpen: () => void;
}) {
  const tone = threadTone(thread);
  return (
    <li>
      <button
        className="flex w-full items-center gap-2.5 rounded-md px-2 py-1.5 text-left text-sm hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        onClick={onOpen}
        type="button"
      >
        <span
          aria-hidden="true"
          className={`inline-block size-1.5 flex-none rounded-full ${toneClass(tone)}`}
        />
        <span className="min-w-0 flex-1 truncate text-foreground">{thread.title}</span>
        {sectionName ? (
          <span className="hidden max-w-40 truncate text-xs text-muted-foreground sm:inline">
            {sectionName}
          </span>
        ) : null}
        <span className="w-24 flex-none truncate text-right text-xs text-muted-foreground">
          {threadStatusLabel(thread)}
        </span>
        <span
          className="w-10 flex-none text-right text-xs tabular-nums text-muted-foreground"
          title={new Date(thread.updatedAt).toLocaleString()}
        >
          {relativeTime(thread.updatedAt)}
        </span>
      </button>
    </li>
  );
}

function DashboardSection({
  title,
  count,
  children,
}: {
  title: string;
  count?: number;
  children: ReactNode;
}) {
  return (
    <section aria-label={title} className="rounded-lg border border-border bg-card">
      <header className="flex items-center gap-2 border-b border-border px-4 py-2.5">
        <h2 className="text-sm font-medium text-foreground">{title}</h2>
        {count !== undefined ? (
          <span className="ml-auto text-xs tabular-nums text-muted-foreground">{count}</span>
        ) : null}
      </header>
      <div className="p-2">{children}</div>
    </section>
  );
}

function EmptyRow({ children }: { children: ReactNode }) {
  return <p className="px-2 py-3 text-center text-xs text-muted-foreground">{children}</p>;
}

function ThreadList({
  threads,
  nameFor,
  onOpen,
  empty,
}: {
  threads: BoardThread[];
  nameFor: (thread: BoardThread) => string | null;
  onOpen: (thread: BoardThread) => void;
  empty: string;
}) {
  if (threads.length === 0) return <EmptyRow>{empty}</EmptyRow>;
  return (
    <ul className="space-y-0.5">
      {threads.map((thread) => (
        <ThreadRow
          key={thread.id}
          onOpen={() => onOpen(thread)}
          sectionName={nameFor(thread)}
          thread={thread}
        />
      ))}
    </ul>
  );
}

function DashboardView({ board }: { board: BoardApi }) {
  const navigate = useBbNavigate();
  const payload = board.payload;
  const summary = useMemo(
    () => (payload ? buildDashboard(payload.sections, payload.threads) : null),
    [payload],
  );
  if (!summary || !payload) return null;
  const sectionNames = new Map(payload.sections.map((section) => [section.id, section.name]));
  const nameFor = (thread: BoardThread) =>
    thread.sectionId === null ? null : (sectionNames.get(thread.sectionId) ?? null);
  const onOpen = (thread: BoardThread) => navigate.toThread(thread.id);
  const maxPerSection = Math.max(1, ...summary.perSection.map((row) => row.count));

  return (
    <div className="min-h-0 flex-1 overflow-y-auto p-4 md:p-5">
      <div className="mx-auto w-full max-w-5xl space-y-4">
        <div className="grid gap-3 sm:grid-cols-3">
          <StatTile hint="agents working" label="Active now" value={summary.active.length} />
          <StatTile
            hint="input needed or unread"
            label="Waiting on me"
            value={summary.waiting.length}
          />
          <StatTile hint="on the board" label="Threads" value={payload.threads.length} />
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <DashboardSection count={summary.active.length} title="Active now">
            <ThreadList
              empty="No agents are working right now."
              nameFor={nameFor}
              onOpen={onOpen}
              threads={summary.active}
            />
          </DashboardSection>
          <DashboardSection count={summary.waiting.length} title="Waiting on me">
            <ThreadList
              empty="Nothing needs your attention."
              nameFor={nameFor}
              onOpen={onOpen}
              threads={summary.waiting}
            />
          </DashboardSection>
        </div>

        <DashboardSection title="Threads per section">
          {summary.perSection.length === 0 ? (
            <EmptyRow>No sections yet.</EmptyRow>
          ) : (
            <ul className="space-y-1.5 px-2 py-1">
              {summary.perSection.map((row) => (
                <li className="flex items-center gap-3 text-sm" key={row.key}>
                  <span className="w-44 truncate text-foreground">{row.name}</span>
                  <span className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
                    <span
                      className="block h-full rounded-full bg-foreground/70"
                      style={{ width: `${(row.count / maxPerSection) * 100}%` }}
                    />
                  </span>
                  <span className="w-8 text-right text-xs tabular-nums text-muted-foreground">
                    {row.count}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </DashboardSection>

        <p className="text-right text-xs text-muted-foreground">
          Live from bb · refreshed {relativeTime(payload.fetchedAt)} ago
        </p>
      </div>
    </div>
  );
}

/**
 * Mirror the sidebar's manual section order. The key is host-internal, so this
 * is read-only and tolerant: no key or a stale key means bb's list order.
 */
function readSidebarSectionOrder(): string[] | null {
  try {
    return parseSidebarSectionOrder(
      window.localStorage.getItem(SIDEBAR_SECTION_ORDER_STORAGE_KEY),
    );
  } catch {
    return null;
  }
}

function sameOrder(left: string[] | null, right: string[] | null): boolean {
  if (left === null || right === null) return left === right;
  return left.length === right.length && left.every((id, index) => id === right[index]);
}

function useSidebarSectionOrder(refreshKey: unknown): string[] | null {
  const [order, setOrder] = useState<string[] | null>(() => readSidebarSectionOrder());
  useEffect(() => {
    const next = readSidebarSectionOrder();
    setOrder((previous) => (sameOrder(previous, next) ? previous : next));
  }, [refreshKey]);
  useEffect(() => {
    const onStorage = (event: StorageEvent) => {
      if (event.key === null || event.key === SIDEBAR_SECTION_ORDER_STORAGE_KEY) {
        setOrder(readSidebarSectionOrder());
      }
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);
  return order;
}

export function viewFor(subPath: string): "board" | "dashboard" {
  return subPath.replace(/^\/+|\/+$/g, "") === "dashboard" ? "dashboard" : "board";
}

export function ViewToggle({ subPath }: PluginNavPanelProps) {
  const navigate = useBbNavigate();
  const view = viewFor(subPath);
  const item = (target: "board" | "dashboard", label: string) => (
    <button
      aria-pressed={view === target}
      className={`rounded-sm px-2.5 py-0.5 text-xs font-medium transition-colors ${
        view === target
          ? "bg-background text-foreground shadow-xs"
          : "text-muted-foreground hover:text-foreground"
      }`}
      onClick={() =>
        navigate.toPluginPanel("board", { subPath: target === "board" ? "" : "dashboard" })
      }
      type="button"
    >
      {label}
    </button>
  );
  return (
    <div
      aria-label="View"
      className="flex items-center gap-0.5 rounded-md bg-muted p-0.5"
      role="group"
    >
      {item("board", "Board")}
      {item("dashboard", "Dashboard")}
    </div>
  );
}

export function KanbanPage({ subPath }: PluginNavPanelProps) {
  const rawBoard = useBoard();
  const view = viewFor(subPath);
  const sidebarOrder = useSidebarSectionOrder(rawBoard.payload?.fetchedAt);
  const board = useMemo<BoardApi>(() => {
    if (!rawBoard.payload) return rawBoard;
    return {
      ...rawBoard,
      payload: {
        ...rawBoard.payload,
        sections: orderSections(rawBoard.payload.sections, sidebarOrder),
      },
    };
  }, [rawBoard, sidebarOrder]);

  if (board.loading && !board.payload) {
    return (
      <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
        Loading threads…
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      {board.error ? (
        <div
          className="mx-4 mt-3 rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive"
          role="alert"
        >
          {board.error}
        </div>
      ) : null}
      {view === "dashboard" ? <DashboardView board={board} /> : <BoardView board={board} />}
    </div>
  );
}

export default definePluginApp((app) => {
  app.slots.navPanel({
    id: "board",
    title: "Thread Kanban",
    icon: "Kanban",
    path: "board",
    component: KanbanPage,
    headerContent: ViewToggle,
  });
});
