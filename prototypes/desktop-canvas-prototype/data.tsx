import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { toast } from "sonner";
import {
  experimental_useSidebarThreadActions as useSidebarThreadActions,
  experimental_useSidebarThreads as useSidebarThreads,
  useRealtime,
  useRealtimeConnectionState,
  useRpc,
  type PluginSidebarThread,
  type PluginSidebarThreadsState,
} from "@get-bb/plugin-sdk/app";
import { acceptsDrop, buildCanvasOrganization, type Collection, type Organization } from "./canvas-organization";
import type { Point } from "./core";
import type { DesktopSnapshot, rpcContract } from "./server";
import { useSidebarPreferences, type PreferencePatch, type SidebarPreferences } from "./sidebar-preferences";
import { threadIdOf, useWindowManager } from "./windows";

/**
 * Live sidebar threads and the sidebar's own preferences, plus the plugin's desktop folders and icon positions, and the
 * actions on them.
 */

export interface ThreadDrag {
  threadId: string;
  fromFolderId: string | null;
}

export interface DesktopContextValue {
  snapshot: DesktopSnapshot;
  /** When the shown snapshot was requested; anything saved before then is in it. */
  snapshotRequestedAt: number;
  preferences: SidebarPreferences;
  /** Saves to the sidebar, which owns these settings; the canvas follows. */
  updatePreferences: (patch: PreferencePatch) => void;
  preferencesSaving: boolean;
  organization: Organization;
  threadById: Map<string, PluginSidebarThread>;
  archivedThreads: PluginSidebarThread[];
  archivedPager: PluginSidebarThreadsState["experimental_archived"];
  foldersOf: (threadId: string) => string[];
  projectName: (projectId: string) => string;
  call: ReturnType<typeof useRpc<typeof rpcContract>>["call"];
  refresh: () => void;
  openThread: (threadId: string) => void;
  dropThread: (target: Collection, drag: ThreadDrag) => Promise<void>;
  restoreThread: (threadId: string) => Promise<void>;
  /** Closes the thread's window, then archives it. */
  archiveThread: (threadId: string) => void;
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

/** What the canvas shows if Thread List can't answer: the sidebar's own defaults. */
const DEFAULT_PREFERENCES: SidebarPreferences = {
  organizationMode: "chronological",
  chronologicalSort: "updated",
  sortDirection: "default",
  environmentGrouping: "auto",
  showProviderIcons: false,
  threadLifecycles: ["active"],
  sectionOrder: ["pinned", "projects", "threads"],
  manualSectionOrder: ["pinned", "sections", "threads"],
  machineSectionOrder: ["pinned", "machines", "threads"],
  hiddenGroups: [],
};

/** The plugin's snapshot, refreshed on realtime changes, reconnects and when the tab becomes visible. */
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

const LEGACY_LAYOUT_KEY = "desktop-canvas-prototype:layout:v1";

/** Folders the first prototype kept in this browser, for the one-time move to the plugin's storage. */
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
      return [{ name: name.trim().slice(0, 80), threadIds: threadIds.slice(0, 1000), position }];
    });
  } catch {
    return [];
  }
}

const NO_FOLDERS: DesktopSnapshot["folders"] = [];

export function DesktopDataProvider({ children }: { children: ReactNode }) {
  const { snapshot, requestedAt, error, refresh, call } = useDesktopSnapshot();
  const sidebar = useSidebarPreferences();
  // Archived threads always load, for the Recycle Bin; the sidebar's own filter decides what folders show.
  const live = useSidebarThreads({ experimental_lifecycles: ["active", "archived"] });
  const manager = useWindowManager();
  const managerRef = useRef(manager);
  managerRef.current = manager;
  const actions = useSidebarThreadActions();
  const importing = useRef(false);
  const warnedPreferences = useRef(false);

  useEffect(() => {
    if (snapshot === null || snapshot.importedLegacy || importing.current) return;
    importing.current = true;
    void call("importLegacy", { folders: readLegacyFolders() }).then(refresh, (importError) => toast.error(errorMessage(importError)));
  }, [call, refresh, snapshot]);

  useEffect(() => {
    if (sidebar.error === null || warnedPreferences.current) return;
    warnedPreferences.current = true;
    toast.error(`${sidebar.error} The canvas is using the sidebar's defaults.`);
  }, [sidebar.error]);

  const preferences = sidebar.preferences ?? (sidebar.error === null ? null : DEFAULT_PREFERENCES);
  const folders = snapshot?.folders ?? NO_FOLDERS;
  const organization = useMemo(() => (preferences === null ? null : buildCanvasOrganization(live, preferences, folders)), [folders, live, preferences]);
  const threadById = useMemo(() => new Map(live.threads.map((thread) => [thread.id, thread])), [live.threads]);
  const archivedThreads = useMemo(
    () => live.threads.filter((thread) => thread.isArchived && !thread.isHidden).sort((a, b) => (b.archivedAt ?? 0) - (a.archivedAt ?? 0)),
    [live.threads],
  );
  const projectNames = useMemo(() => new Map(live.projects.map((project) => [project.id, project.name])), [live.projects]);
  const projectName = useCallback((projectId: string) => projectNames.get(projectId) ?? "", [projectNames]);
  const folderNames = useMemo(() => {
    const names = new Map<string, string[]>();
    if (organization === null) return names;
    for (const group of [...organization.roots.filter((root) => root.kind !== "more"), ...(organization.byKey.get("more")?.children ?? [])]) {
      for (const thread of group.threads) {
        const existing = names.get(thread.id);
        if (existing === undefined) names.set(thread.id, [group.name]);
        else if (!existing.includes(group.name)) existing.push(group.name);
      }
    }
    return names;
  }, [organization]);
  const foldersOf = useCallback((threadId: string) => folderNames.get(threadId) ?? [], [folderNames]);

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
    async (target: Collection, drag: ThreadDrag) => {
      if (!acceptsDrop(target)) return;
      const thread = threadById.get(drag.threadId);
      try {
        if (thread?.isArchived === true) await call("unarchiveThread", { threadId: drag.threadId });
        if (target.kind === "folder" && target.folder !== undefined) {
          if (target.folder.threadIds.includes(drag.threadId)) return;
          await call("addToFolder", { folderId: target.folder.id, threadIds: [drag.threadId], fromFolderId: drag.fromFolderId });
          refresh();
          return;
        }
        if (target.sectionId === undefined || thread?.sectionId === target.sectionId) return;
        await call("moveToSection", { threadIds: [drag.threadId], sectionId: target.sectionId });
        toast.success(target.sectionId === null ? "Moved out of its section" : `Moved to ${target.name}`);
      } catch (dropError) {
        toast.error(errorMessage(dropError));
      }
    },
    [call, refresh, threadById],
  );

  const restoreThread = useCallback(
    (threadId: string) => call("unarchiveThread", { threadId }).then(() => undefined, (restoreError) => void toast.error(errorMessage(restoreError))),
    [call],
  );

  const archiveThread = useCallback(
    (threadId: string) => {
      managerRef.current.closeWhere((window) => threadIdOf(window.spec) === threadId);
      actions.archive(threadId);
    },
    [actions],
  );

  const { update, saving } = sidebar;
  const updatePreferences = useCallback((patch: PreferencePatch) => void update(patch), [update]);

  const value = useMemo<DesktopContextValue | null>(
    () =>
      snapshot === null || preferences === null || organization === null
        ? null
        : {
            snapshot,
            snapshotRequestedAt: requestedAt,
            preferences,
            updatePreferences,
            preferencesSaving: saving,
            organization,
            threadById,
            archivedThreads,
            archivedPager: live.experimental_archived,
            foldersOf,
            projectName,
            call,
            refresh,
            openThread,
            dropThread,
            restoreThread,
            archiveThread,
          },
    [
      snapshot, requestedAt, preferences, updatePreferences, saving, organization, threadById, archivedThreads, live.experimental_archived,
      foldersOf, projectName, call, refresh, openThread, dropThread, restoreThread, archiveThread,
    ],
  );

  if (value === null) {
    const failure = error ?? (live.status === "error" ? "threads could not load." : null);
    return <div className="cdc-loading" role="status">{failure === null ? "Loading your desktop…" : `Canvas Desktop couldn’t load: ${failure}`}</div>;
  }
  return <DesktopContext.Provider value={value}>{children}</DesktopContext.Provider>;
}
