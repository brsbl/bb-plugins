import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { toast } from "sonner";
import {
  experimental_useSidebarThreadActions as useSidebarThreadActions,
  experimental_useSidebarThreads as useSidebarThreads,
  useRealtime,
  useRealtimeConnectionState,
  useRpc,
  type PluginSidebarThread,
} from "@get-bb/plugin-sdk/app";
import {
  buildGroups,
  groupThreads,
  resolveSidebarPreferences,
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

/** The sidebar's own organize and sort choices, which the desktop follows when set to "Same as sidebar". */
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

/** The server snapshot, refreshed on realtime changes, reconnects and when the tab becomes visible. */
export function useDesktopSnapshot() {
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

/** Merges the snapshot with live sidebar state and provides it, with the desktop's actions, to everything below. */
export function DesktopDataProvider({ children }: { children: ReactNode }) {
  const { snapshot, error, refresh, call } = useDesktopSnapshot();
  const live = useSidebarThreads();
  const manager = useWindowManager();
  const actions = useSidebarThreadActions();
  const [sidebar, setSidebar] = useState<ReturnType<typeof resolveSidebarPreferences> | null>(null);

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
        .catch((restoreError) => {
          toast.error(errorMessage(restoreError));
        }),
    [call, refresh],
  );

  const archiveThread = useCallback(
    (threadId: string) => {
      manager.closeWhere((window) => threadIdOf(window.spec) === threadId);
      actions.archive(threadId);
    },
    [actions, manager],
  );

  const setPreferences = useCallback(
    (patch: Partial<Preferences>) =>
      void call("setPreferences", patch)
        .then(refresh)
        .catch((preferenceError) => toast.error(errorMessage(preferenceError))),
    [call, refresh],
  );

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
    dropThread,
    restoreThread,
    archiveThread,
    setPreferences,
  };

  return <DesktopContext.Provider value={value}>{children}</DesktopContext.Provider>;
}
