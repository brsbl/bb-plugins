import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { toast } from "sonner";
import {
  experimental_useSidebarThreadActions as useSidebarThreadActions,
  experimental_useSidebarThreads as useSidebarThreads,
  useRealtime,
  useRealtimeConnectionState,
  useRpc,
  useSdk,
  type PluginSidebarThread,
} from "@get-bb/plugin-sdk/app";
import { z } from "zod";
import {
  buildGroups,
  groupMembers,
  resolveSidebarPreferences,
  withLiveState,
  type DesktopGroup,
  type DesktopThread,
  type Organize,
  type Preferences,
  type SortDirection,
  type SortKey,
} from "../core";
import type { DesktopSnapshot, rpcContract } from "../server";
import { threadIdOf, useWindowManager } from "../windows";

export interface ThreadDrag {
  threadId: string;
  fromFolderId: string | null;
}

export interface Effective {
  sort: { key: SortKey; direction: SortDirection };
  organize: Organize;
}

export interface DesktopContextValue {
  snapshot: DesktopSnapshot;
  /** When the shown snapshot was requested, in `Date.now()` time; anything saved before then is in it. */
  snapshotRequestedAt: number;
  threads: DesktopThread[];
  visibleThreads: DesktopThread[];
  archivedThreads: DesktopThread[];
  threadById: Map<string, DesktopThread>;
  liveById: Map<string, PluginSidebarThread>;
  groups: DesktopGroup[];
  desktopGroups: DesktopGroup[];
  moreGroups: DesktopGroup[];
  groupByKey: Map<string, DesktopGroup>;
  /** A group's unarchived threads, computed once for every group. */
  membersOf: (group: DesktopGroup) => DesktopThread[];
  foldersOf: (threadId: string) => string[];
  effective: Effective;
  sort: { key: SortKey; direction: SortDirection };
  call: ReturnType<typeof useRpc<typeof rpcContract>>["call"];
  refresh: () => void;
  openThread: (threadId: string) => void;
  dropThread: (group: DesktopGroup, drag: ThreadDrag) => Promise<void>;
  restoreThread: (threadId: string) => Promise<void>;
  /** Closes the thread's windows, then archives it. */
  archiveThread: (threadId: string) => void;
  setPreferences: (patch: Partial<Preferences>) => void;
}

const DesktopContext = createContext<DesktopContextValue | null>(null);

export function useDesktop(): DesktopContextValue {
  const value = useContext(DesktopContext);
  if (value === null) throw new Error("useDesktop outside DesktopDataProvider");
  return value;
}

export function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

const sidebarPreferencesSchema = z.object({ preferences: z.unknown() });

/**
 * The sidebar's own organize and sort choices, which the desktop follows when set to "Same as sidebar". They belong to
 * bb's bundled thread-list plugin; when it can't answer, the desktop falls back to its defaults.
 */
async function fetchSidebarPreferences(plugins: ReturnType<typeof useSdk>["plugins"]): Promise<unknown> {
  try {
    const { preferences } = await plugins.callRpc({
      pluginId: "thread-list",
      method: "listPreferences",
      input: null,
      outputSchema: sidebarPreferencesSchema,
    });
    return preferences;
  } catch {
    return null;
  }
}

/** How long the sidebar's organize and sort choices are reused before a snapshot load asks bb for them again. */
const SIDEBAR_PREFERENCES_TTL = 15_000;

/**
 * The server snapshot, refreshed on realtime changes, reconnects and when the tab becomes visible. Loads can
 * overlap, so a response older than the one already shown is dropped.
 */
function useDesktopSnapshot() {
  const rpc = useRpc<typeof rpcContract>();
  const rpcRef = useRef(rpc);
  rpcRef.current = rpc;
  const [loaded, setLoaded] = useState<{ snapshot: DesktopSnapshot; requestedAt: number } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const requested = useRef(0);
  const shown = useRef(0);

  const load = useCallback(async () => {
    const request = ++requested.current;
    const requestedAt = Date.now();
    try {
      const snapshot = await rpcRef.current.call("snapshot");
      if (request < shown.current) return;
      shown.current = request;
      setLoaded({ snapshot, requestedAt });
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

  return { snapshot: loaded?.snapshot ?? null, requestedAt: loaded?.requestedAt ?? 0, error, refresh, call };
}

const NO_THREADS: DesktopThread[] = [];

/** Keeps the previous array while every element is the same object, so unrelated live updates don't ripple down. */
function useStableArray<T>(next: T[]): T[] {
  const previous = useRef(next);
  const current = previous.current;
  if (current !== next && (current.length !== next.length || next.some((item, index) => item !== current[index]))) {
    previous.current = next;
  }
  return previous.current;
}

/** Merges the snapshot with live sidebar state and provides it, with the desktop's actions, to everything below. */
export function DesktopDataProvider({ children }: { children: ReactNode }) {
  const { snapshot, requestedAt, error, refresh, call } = useDesktopSnapshot();
  const live = useSidebarThreads();
  const sdk = useSdk();
  const manager = useWindowManager();
  const managerRef = useRef(manager);
  managerRef.current = manager;
  const actions = useSidebarThreadActions();
  const [sidebar, setSidebar] = useState<ReturnType<typeof resolveSidebarPreferences> | null>(null);
  const sidebarFetchedAt = useRef(Number.NEGATIVE_INFINITY);
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  // bb has no signal for sidebar preference changes, so they are picked up with snapshot loads, at most every
  // SIDEBAR_PREFERENCES_TTL.
  useEffect(() => {
    if (snapshot === null || Date.now() - sidebarFetchedAt.current < SIDEBAR_PREFERENCES_TTL) return;
    sidebarFetchedAt.current = Date.now();
    void fetchSidebarPreferences(sdk.plugins).then((preferences) => {
      if (mounted.current) setSidebar(resolveSidebarPreferences(preferences));
    });
  }, [sdk.plugins, snapshot]);

  // Preference edits show at once and stack: a second Quick Launch change made before the snapshot reloads builds on
  // the first instead of on the stale snapshot. The overlay clears once a snapshot requested after the last save lands.
  const [preferenceOverlay, setPreferenceOverlay] = useState<Partial<Preferences>>({});
  const savesInFlight = useRef(0);
  const lastSaveDoneAt = useRef(0);
  useEffect(() => {
    if (savesInFlight.current === 0 && requestedAt >= lastSaveDoneAt.current) setPreferenceOverlay({});
  }, [requestedAt]);

  const liveById = useMemo(
    () => new Map(live.threads.map((thread) => [thread.id, thread])),
    [live.threads],
  );

  const threads = useStableArray(
    useMemo(
      () => (snapshot?.threads ?? NO_THREADS).map((thread) => withLiveState(thread, liveById.get(thread.id))),
      [liveById, snapshot?.threads],
    ),
  );

  const effective = useMemo<Effective>(() => {
    const preferences = snapshot === null ? undefined : { ...snapshot.preferences, ...preferenceOverlay };
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
  }, [preferenceOverlay, sidebar, snapshot]);

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
  const members = useMemo(() => groupMembers(groups, visibleThreads), [groups, visibleThreads]);
  const membersOf = useCallback((group: DesktopGroup) => members.get(group.key) ?? NO_THREADS, [members]);
  const folderNames = useMemo(() => {
    const names = new Map<string, string[]>();
    const ordered = [...groups].sort((left, right) => Number(right.kind === "folder") - Number(left.kind === "folder"));
    const everyMember = groupMembers(ordered, threads);
    for (const group of ordered) {
      for (const thread of everyMember.get(group.key) ?? NO_THREADS) {
        const existing = names.get(thread.id);
        if (existing === undefined) names.set(thread.id, [group.name]);
        else existing.push(group.name);
      }
    }
    return names;
  }, [groups, threads]);
  const foldersOf = useCallback((threadId: string) => folderNames.get(threadId) ?? [], [folderNames]);

  const threadById = useMemo(
    () => new Map(threads.map((thread) => [thread.id, thread])),
    [threads],
  );

  // bb's chat marks the thread read once its window shows it, as opening the thread in bb does.
  // A deleted thread's windows close, which also ends their terminal and browser tabs.
  useRealtime(
    "changed",
    useCallback((payload: unknown) => {
      if (typeof payload !== "object" || payload === null) return;
      const { scope, threadId } = payload as { scope?: unknown; threadId?: unknown };
      if (scope !== "thread-deleted" || typeof threadId !== "string") return;
      managerRef.current.closeWhere((window) => threadIdOf(window.spec) === threadId);
    }, []),
  );

  const openThread = useCallback((threadId: string) => {
    managerRef.current.open({ kind: "thread", threadId });
  }, []);

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
        .catch((restoreError) => {
          toast.error(errorMessage(restoreError));
        }),
    [call, refresh],
  );

  const archiveThread = useCallback(
    (threadId: string) => {
      managerRef.current.closeWhere((window) => threadIdOf(window.spec) === threadId);
      actions.archive(threadId);
    },
    [actions],
  );

  const setPreferences = useCallback(
    (patch: Partial<Preferences>) => {
      setPreferenceOverlay((overlay) => ({ ...overlay, ...patch }));
      savesInFlight.current += 1;
      void call("setPreferences", patch)
        .catch((preferenceError) => toast.error(errorMessage(preferenceError)))
        .finally(() => {
          savesInFlight.current -= 1;
          lastSaveDoneAt.current = Date.now();
          refresh();
        });
    },
    [call, refresh],
  );
  const shownSnapshot = useMemo(
    () =>
      snapshot === null || Object.keys(preferenceOverlay).length === 0
        ? snapshot
        : { ...snapshot, preferences: { ...snapshot.preferences, ...preferenceOverlay } },
    [preferenceOverlay, snapshot],
  );

  const value = useMemo<DesktopContextValue | null>(
    () =>
      shownSnapshot === null
        ? null
        : {
            snapshot: shownSnapshot,
            snapshotRequestedAt: requestedAt,
            threads,
            visibleThreads,
            archivedThreads,
            threadById,
            liveById,
            groups,
            desktopGroups,
            moreGroups,
            groupByKey,
            membersOf,
            foldersOf,
            effective,
            sort: effective.sort,
            call,
            refresh,
            openThread,
            dropThread,
            restoreThread,
            archiveThread,
            setPreferences,
          },
    [
      shownSnapshot,
      requestedAt,
      threads,
      visibleThreads,
      archivedThreads,
      threadById,
      liveById,
      groups,
      desktopGroups,
      moreGroups,
      groupByKey,
      membersOf,
      foldersOf,
      effective,
      call,
      refresh,
      openThread,
      dropThread,
      restoreThread,
      archiveThread,
      setPreferences,
    ],
  );

  if (value === null || sidebar === null) {
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

  return <DesktopContext.Provider value={value}>{children}</DesktopContext.Provider>;
}
