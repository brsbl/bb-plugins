import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { toast } from "sonner";
import {
  experimental_useSidebarThreadActions as useSidebarThreadActions,
  experimental_useSidebarThreads as useSidebarThreads,
  useRealtime,
  useRealtimeConnectionState,
  useRpc,
  useSdk,
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
  type Point,
  type Preferences,
  type SortDirection,
  type SortKey,
} from "./core";
import type { DesktopSnapshot, rpcContract } from "./server";
import { threadIdOf, useWindowManager } from "./windows";

/** Desktop's data provider: the server snapshot, merged with bb's live sidebar state, and the actions on it. */

export interface ThreadDrag {
  threadId: string;
  fromFolderId: string | null;
}

export interface DesktopContextValue {
  snapshot: DesktopSnapshot;
  /** When the shown snapshot was requested; anything saved before then is in it. */
  snapshotRequestedAt: number;
  threads: DesktopThread[];
  visibleThreads: DesktopThread[];
  archivedThreads: DesktopThread[];
  threadById: Map<string, DesktopThread>;
  groups: DesktopGroup[];
  /** Groups on the canvas; the rest are in More, as the sidebar keeps them. */
  canvasGroups: DesktopGroup[];
  moreGroups: DesktopGroup[];
  groupByKey: Map<string, DesktopGroup>;
  membersOf: (group: DesktopGroup) => DesktopThread[];
  foldersOf: (threadId: string) => string[];
  organize: Organize;
  sort: { key: SortKey; direction: SortDirection };
  projectName: (projectId: string) => string;
  call: ReturnType<typeof useRpc<typeof rpcContract>>["call"];
  refresh: () => void;
  openThread: (threadId: string) => void;
  dropThread: (group: DesktopGroup, drag: ThreadDrag) => Promise<void>;
  restoreThread: (threadId: string) => Promise<void>;
  /** Closes the thread's window, then archives it. */
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
const SIDEBAR_PREFERENCES_TTL = 15_000;

/** The sidebar's own organize and sort choices, from bb's bundled thread-list plugin; null when it can't answer. */
async function fetchSidebarPreferences(plugins: ReturnType<typeof useSdk>["plugins"]): Promise<unknown> {
  try {
    const { preferences } = await plugins.callRpc({ pluginId: "thread-list", method: "listPreferences", input: null, outputSchema: sidebarPreferencesSchema });
    return preferences;
  } catch {
    return null;
  }
}

/** The server snapshot, refreshed on realtime changes, reconnects and when the tab becomes visible. */
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

  const call = useCallback<DesktopContextValue["call"]>((...args) => rpcRef.current.call(...args), []);
  return { snapshot: loaded?.snapshot ?? null, requestedAt: loaded?.requestedAt ?? 0, error, refresh, call };
}

const NO_THREADS: DesktopThread[] = [];

/** Keeps the previous array while every element is the same object, so unrelated live updates don't ripple down. */
function useStableArray<T>(next: T[]): T[] {
  const previous = useRef(next);
  const current = previous.current;
  if (current !== next && (current.length !== next.length || next.some((item, index) => item !== current[index]))) previous.current = next;
  return previous.current;
}

const LEGACY_LAYOUT_KEY = "desktop-canvas-prototype:layout:v1";

/** Folders the first prototype kept in this browser, for the one-time move to the server. */
function readLegacyFolders(): { name: string; threadIds: string[]; position: Point | null }[] {
  try {
    const parsed: unknown = JSON.parse(localStorage.getItem(LEGACY_LAYOUT_KEY) ?? "null");
    const record = typeof parsed === "object" && parsed !== null ? (parsed as Record<string, unknown>) : {};
    const folders = Array.isArray(record.folders) ? record.folders : [];
    const membership = typeof record.membership === "object" && record.membership !== null ? (record.membership as Record<string, unknown>) : {};
    const positions = typeof record.positions === "object" && record.positions !== null ? (record.positions as Record<string, unknown>) : {};
    return folders.flatMap((folder: unknown) => {
      const { id, name } = (typeof folder === "object" && folder !== null ? folder : {}) as Record<string, unknown>;
      if (typeof id !== "string" || typeof name !== "string" || name.trim() === "") return [];
      const point = positions[id] as Record<string, unknown> | undefined;
      const position = typeof point?.x === "number" && typeof point?.y === "number" ? { x: point.x, y: point.y } : null;
      const threadIds = Object.entries(membership).flatMap(([threadId, folderId]) => (folderId === id ? [threadId] : []));
      return [{ name: name.trim().slice(0, 80), threadIds, position }];
    });
  } catch {
    return [];
  }
}

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
  const importing = useRef(false);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  useEffect(() => {
    if (snapshot === null || Date.now() - sidebarFetchedAt.current < SIDEBAR_PREFERENCES_TTL) return;
    sidebarFetchedAt.current = Date.now();
    void fetchSidebarPreferences(sdk.plugins).then((preferences) => {
      if (mounted.current) setSidebar(resolveSidebarPreferences(preferences));
    });
  }, [sdk.plugins, snapshot]);

  useEffect(() => {
    if (snapshot === null || snapshot.importedLegacy || importing.current) return;
    importing.current = true;
    void call("importLegacy", { folders: readLegacyFolders() }).then(refresh, (importError) => toast.error(errorMessage(importError)));
  }, [call, refresh, snapshot]);

  // Preference edits show at once; the overlay clears once a snapshot requested after the last save lands.
  const [preferenceOverlay, setPreferenceOverlay] = useState<Partial<Preferences>>({});
  const savesInFlight = useRef(0);
  const lastSaveDoneAt = useRef(0);
  useEffect(() => {
    if (savesInFlight.current === 0 && requestedAt >= lastSaveDoneAt.current) setPreferenceOverlay({});
  }, [requestedAt]);

  const liveById = useMemo(() => new Map(live.threads.map((thread) => [thread.id, thread])), [live.threads]);
  const threads = useStableArray(
    useMemo(() => (snapshot?.threads ?? NO_THREADS).map((thread) => withLiveState(thread, liveById.get(thread.id))), [liveById, snapshot?.threads]),
  );

  const preferences = useMemo(() => (snapshot === null ? null : { ...snapshot.preferences, ...preferenceOverlay }), [preferenceOverlay, snapshot]);
  const fromSidebar = sidebar ?? resolveSidebarPreferences(null);
  const sortPreference = preferences?.sort ?? "sidebar";
  const sortKey = sortPreference === "sidebar" ? fromSidebar.sort.key : sortPreference;
  const sortDirection = sortPreference === "sidebar" ? fromSidebar.sort.direction : sortPreference === "alpha" ? "ascending" : "descending";
  const sort = useMemo(() => ({ key: sortKey, direction: sortDirection }), [sortDirection, sortKey]);
  const organize: Organize = preferences === null || preferences.organize === "sidebar" ? fromSidebar.organize : preferences.organize;

  const visibleThreads = useMemo(() => threads.filter((thread) => !thread.isArchived), [threads]);
  const archivedThreads = useMemo(() => threads.filter((thread) => thread.isArchived), [threads]);
  const groups = useMemo(
    () =>
      snapshot === null
        ? []
        : buildGroups({ organize, sections: snapshot.sections, projects: snapshot.projects, machines: snapshot.machines, folders: snapshot.folders, threads: visibleThreads }),
    [organize, snapshot, visibleThreads],
  );
  const groupByKey = useMemo(() => new Map(groups.map((group) => [group.key, group])), [groups]);
  const hiddenKeys = useMemo(() => new Set(sidebar?.hiddenGroupKeys ?? []), [sidebar]);
  const canvasGroups = useMemo(() => groups.filter((group) => !hiddenKeys.has(group.key)), [groups, hiddenKeys]);
  const moreGroups = useMemo(() => groups.filter((group) => hiddenKeys.has(group.key)), [groups, hiddenKeys]);
  const members = useMemo(() => groupMembers(groups, visibleThreads), [groups, visibleThreads]);
  const membersOf = useCallback((group: DesktopGroup) => members.get(group.key) ?? NO_THREADS, [members]);
  const folderNames = useMemo(() => {
    const names = new Map<string, string[]>();
    const everyMember = groupMembers(groups, threads);
    for (const group of groups) {
      for (const thread of everyMember.get(group.key) ?? NO_THREADS) {
        const existing = names.get(thread.id);
        if (existing === undefined) names.set(thread.id, [group.name]);
        else existing.push(group.name);
      }
    }
    return names;
  }, [groups, threads]);
  const foldersOf = useCallback((threadId: string) => folderNames.get(threadId) ?? [], [folderNames]);
  const threadById = useMemo(() => new Map(threads.map((thread) => [thread.id, thread])), [threads]);
  const projectNames = useMemo(() => new Map((snapshot?.projects ?? []).map((project) => [project.id, project.name])), [snapshot?.projects]);
  const projectName = useCallback((projectId: string) => projectNames.get(projectId) ?? "", [projectNames]);

  // A deleted thread's window closes.
  useRealtime(
    "changed",
    useCallback((payload: unknown) => {
      if (typeof payload !== "object" || payload === null) return;
      const { scope, threadId } = payload as { scope?: unknown; threadId?: unknown };
      if (scope === "thread-deleted" && typeof threadId === "string") managerRef.current.closeWhere((window) => threadIdOf(window.spec) === threadId);
    }, []),
  );

  const openThread = useCallback((threadId: string) => managerRef.current.open({ kind: "thread", threadId }), []);

  const dropThread = useCallback(
    async (group: DesktopGroup, drag: ThreadDrag) => {
      try {
        if (threadById.get(drag.threadId)?.isArchived === true) await call("unarchiveThread", { threadId: drag.threadId });
        if (group.kind === "section") {
          if (threadById.get(drag.threadId)?.sectionId === group.id) return;
          await call("moveToSection", { threadIds: [drag.threadId], sectionId: group.id });
          toast.success(`Moved to ${group.name}`);
          refresh();
          return;
        }
        if (group.kind !== "folder" || group.folder.threadIds.includes(drag.threadId)) return;
        await call("addToFolder", { folderId: group.folder.id, threadIds: [drag.threadId], fromFolderId: drag.fromFolderId });
        refresh();
      } catch (dropError) {
        toast.error(errorMessage(dropError));
      }
    },
    [call, refresh, threadById],
  );

  const restoreThread = useCallback(
    (threadId: string) => call("unarchiveThread", { threadId }).then(refresh).catch((restoreError) => void toast.error(errorMessage(restoreError))),
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
    () => (snapshot === null || preferences === null ? null : { ...snapshot, preferences }),
    [preferences, snapshot],
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
            groups,
            canvasGroups,
            moreGroups,
            groupByKey,
            membersOf,
            foldersOf,
            organize,
            sort,
            projectName,
            call,
            refresh,
            openThread,
            dropThread,
            restoreThread,
            archiveThread,
            setPreferences,
          },
    [
      shownSnapshot, requestedAt, threads, visibleThreads, archivedThreads, threadById, groups, canvasGroups, moreGroups, groupByKey,
      membersOf, foldersOf, organize, sort, projectName, call, refresh, openThread, dropThread, restoreThread, archiveThread, setPreferences,
    ],
  );

  if (value === null || sidebar === null) {
    return <div className="cdc-loading" role="status">{error === null ? "Loading your desktop…" : `Canvas Desktop couldn’t load: ${error}`}</div>;
  }
  return <DesktopContext.Provider value={value}>{children}</DesktopContext.Provider>;
}
