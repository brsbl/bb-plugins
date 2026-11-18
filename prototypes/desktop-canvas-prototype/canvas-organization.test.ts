import { describe, expect, it } from "vitest";
import type { PluginSidebarThread, PluginSidebarThreadsState } from "@get-bb/plugin-sdk/app";
import { buildCanvasOrganization, compareThreads } from "./canvas-organization";
import type { Folder } from "./core";
import type { SidebarPreferences } from "./sidebar-preferences";

const prefs: SidebarPreferences = { organizationMode: "chronological", chronologicalSort: "updated", sortDirection: "default", environmentGrouping: false, showProviderIcons: false, threadLifecycles: ["active"], sectionOrder: ["pinned", "projects", "threads"], manualSectionOrder: ["pinned", "sections", "threads"], machineSectionOrder: ["pinned", "machines", "threads"], hiddenGroups: [] };
const thread = (id: string, patch: Partial<PluginSidebarThread> = {}): PluginSidebarThread => ({
  id, projectId: "p1", title: id, titleFallback: null, displayTitle: id, parentThreadId: null, lifecycleOwnerThreadId: null, sourceThreadId: null, sectionId: null, originKind: null, originPluginId: null,
  providerId: "codex", status: "idle", runtimeStatus: "idle", queuedWork: "none", hasPendingInteraction: false, activity: {} as PluginSidebarThread["activity"], indicator: "none", indicatorLabel: null,
  isUnread: false, isPinned: false, pinnedAt: null, pinSortKey: null, isArchived: false, archivedAt: null, href: "/", isHidden: false, environment: null, host: null, createdAt: 1, updatedAt: 1, lastReadAt: null, latestAttentionAt: 1, ...patch,
});
const data = (threads: PluginSidebarThread[]): PluginSidebarThreadsState => ({
  status: "ready", experimental_archived: null, threads,
  projects: [{ id: "p1", name: "Project", isPersonal: false, href: "/", settingsHref: "/" }, { id: "personal", name: "Personal", isPersonal: true, href: "/", settingsHref: "/" }],
  sections: [{ id: "s1", name: "Building", createdAt: 1, updatedAt: 1 }, { id: "s2", name: "Review", createdAt: 2, updatedAt: 2 }],
});
const model = (threads: PluginSidebarThread[], patch: Partial<SidebarPreferences> = {}, folders: Folder[] = []) => buildCanvasOrganization(data(threads), { ...prefs, ...patch }, folders);

describe("sidebar organization on the canvas", () => {
  it("uses root section placement and keeps pinned descendants out of other groups", () => {
    const result = model([thread("root", { sectionId: "s1" }), thread("child", { parentThreadId: "root", sectionId: "s2" }), thread("pin", { isPinned: true, pinnedAt: 3 }), thread("pin-child", { parentThreadId: "pin" }), thread("hidden", { isHidden: true })]);
    expect(result.roots.map(g => g.key)).toEqual(["pinned", "section:s1", "section:s2", "threads"]);
    expect(result.byKey.get("section:s1")!.threads.map(t => t.id)).toEqual(["child", "root"]);
    expect(result.byKey.get("section:s2")!.threads).toHaveLength(0);
    expect(result.byKey.get("pinned")!.threads.map(t => t.id)).toEqual(["pin", "pin-child"]);
    expect(result.byKey.get("threads")!.threads).toHaveLength(0);
    expect(result.threads).toHaveLength(4);
  });
  it("mirrors saved section order and keeps hidden groups reachable in More", () => {
    const result = model([thread("a", { sectionId: "s1" })], { manualSectionOrder: ["section:s2", "threads", "section:s1"], hiddenGroups: ["section:s1", "threads"] });
    expect(result.roots.map(g => g.key)).toEqual(["section:s2", "more"]);
    expect(result.byKey.get("more")!.children.map(g => g.key)).toEqual(["threads", "section:s1"]);
    expect(result.byKey.get("section:s1")!.threads[0].id).toBe("a");
  });
  it("maps Personal to Threads in project view and preserves open section collections", () => {
    const result = model([thread("a", { sectionId: "s1" }), thread("personal", { projectId: "personal" })], { organizationMode: "project" });
    expect(result.roots.map(g => g.key)).toEqual(["project:p1", "threads"]);
    expect(result.byKey.get("threads")!.threads[0].id).toBe("personal");
    expect(result.byKey.get("section:s1")!.threads[0].id).toBe("a");
  });
  it("groups by each machine and includes threads with no machine", () => {
    const result = model([thread("a", { host: { id: "h1", name: "Mac" } }), thread("b", { parentThreadId: "a", host: { id: "h2", name: "Worker" } }), thread("c")], { organizationMode: "machine" });
    expect(result.roots.map(g => g.name)).toEqual(["Mac", "Worker", "No machine"]);
    expect(result.byKey.get("machine:h2")!.threads[0].id).toBe("b");
  });
  it("applies archived filters and groups only sibling worktree roots", () => {
    const environment = { id: "env", name: "Prototype", branchName: "feature", path: "/repo", isWorktree: true, providerId: null, workspaceDisplayKind: null };
    const result = model([thread("a", { environment }), thread("b", { environment }), thread("old", { isArchived: true }), thread("internal", { isHidden: true, isArchived: true })], { organizationMode: "project", environmentGrouping: "auto", threadLifecycles: ["active", "archived"] });
    expect(result.byKey.get("project:p1")!.children[0].threads.map(t => t.id)).toEqual(["a", "b"]);
    expect(result.threads).toHaveLength(3);
    const ungrouped = model([thread("a", { environment }), thread("b", { environment })], { organizationMode: "project", environmentGrouping: false });
    expect(ungrouped.byKey.get("project:p1")!.children).toHaveLength(0);
    expect(ungrouped.byKey.get("project:p1/environment:env")!.threads.map(t => t.id)).toEqual(["a", "b"]);
    const archived = model([thread("a"), thread("old", { isArchived: true })], { threadLifecycles: ["archived"] });
    expect(archived.threads.map(t => t.id)).toEqual(["old"]);
  });
  it("uses sidebar sort fields and preserves active-first updated order in both directions", () => {
    const threads = [thread("Zebra", { latestAttentionAt: 3, createdAt: 1 }), thread("Apple", { latestAttentionAt: 2, createdAt: 3 }), thread("Running", { status: "active" })];
    expect(threads.slice().sort(compareThreads(prefs)).map(t => t.id)).toEqual(["Running", "Zebra", "Apple"]);
    expect(threads.slice().sort(compareThreads({ ...prefs, sortDirection: "ascending" })).map(t => t.id)).toEqual(["Running", "Apple", "Zebra"]);
    expect(threads.slice().sort(compareThreads({ ...prefs, chronologicalSort: "alpha" })).map(t => t.id)).toEqual(["Apple", "Running", "Zebra"]);
    expect(threads.slice().sort(compareThreads({ ...prefs, chronologicalSort: "created" })).map(t => t.id)).toEqual(["Apple", "Running", "Zebra"]);
  });
  it("adds desktop folders after the sidebar groups and offers every section, Threads and folder as a Move to target", () => {
    const folder: Folder = { id: "fld_1", name: "Next up", threadIds: ["b", "gone"], createdAt: 1 };
    const result = model([thread("a", { sectionId: "s1" }), thread("b")], {}, [folder]);
    expect(result.roots.map(g => g.key)).toEqual(["section:s1", "section:s2", "threads", "folder:fld_1"]);
    expect(result.byKey.get("folder:fld_1")!.threads.map(t => t.id)).toEqual(["b"]);
    expect(result.targets.map(g => [g.key, g.sectionId])).toEqual([["section:s1", "s1"], ["section:s2", "s2"], ["threads", null], ["folder:fld_1", undefined]]);
    const byProject = model([thread("a")], { organizationMode: "project" }, [folder]);
    expect(byProject.byKey.get("project:p1")!.sectionId).toBeUndefined();
    expect(byProject.targets.map(g => g.key)).toEqual(["section:s1", "section:s2", "threads", "folder:fld_1"]);
  });
});
