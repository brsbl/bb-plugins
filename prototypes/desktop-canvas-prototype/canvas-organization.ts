import type { PluginSidebarThread, PluginSidebarThreadsState } from "@get-bb/plugin-sdk/app";
import type { Folder } from "./core";
import type { SidebarPreferences } from "./sidebar-preferences";

/**
 * The canvas mirrors the sidebar: the same organization (custom sections, projects or machines), group order, Pinned,
 * environment folders, filters and hidden groups (kept in More), read from Thread List's own preferences. Desktop
 * folders, which only the canvas has, follow the sidebar's groups.
 */

export type CollectionKind = "pinned" | "section" | "threads" | "project" | "machine" | "environment" | "folder" | "more";

export interface Collection {
  key: string;
  kind: CollectionKind;
  name: string;
  icon: string;
  threads: PluginSidebarThread[];
  children: Collection[];
  /** Dropping a thread here files it in this section, or out of every section when null. */
  sectionId?: string | null;
  folder?: Folder;
}

export const groupByEnvironment = (p: SidebarPreferences) => (p.environmentGrouping === "auto" ? p.organizationMode !== "chronological" : p.environmentGrouping);

/** Threads can be filed by dropping them on desktop folders and sections; projects and machines are facts about a thread. */
export const acceptsDrop = (collection: Collection) => collection.kind === "folder" || collection.sectionId !== undefined;

export const isDeletable = (collection: Collection) => collection.kind === "folder" || collection.kind === "section";

// Match Thread List's sort rules, including active-first Updated sorting.
export function compareThreads(p: SidebarPreferences) {
  const sort = p.chronologicalSort === "none" ? "updated" : p.chronologicalSort;
  const reverse = p.sortDirection !== "default" && p.sortDirection !== (sort === "alpha" ? "ascending" : "descending");
  const created = (a: PluginSidebarThread, b: PluginSidebarThread) => b.createdAt - a.createdAt || a.id.localeCompare(b.id);
  return (a: PluginSidebarThread, b: PluginSidebarThread) => {
    if (sort === "updated" && (a.status === "active") !== (b.status === "active")) return a.status === "active" ? -1 : 1;
    const result = sort === "alpha" ? (a.displayTitle.localeCompare(b.displayTitle) || a.id.localeCompare(b.id))
      : sort === "created" || a.status === "active" ? created(a, b)
      : b.latestAttentionAt - a.latestAttentionAt || created(a, b);
    return reverse ? -result : result;
  };
}

export function orderCollections(groups: Collection[], stored: string[], anchor: string) {
  const byKey = new Map(groups.map((g) => [g.key, g]));
  const entities = groups.filter((g) => g.key !== "pinned" && g.key !== "threads");
  const keys: string[] = [];
  const append = (key: string) => {
    if (byKey.has(key) && !keys.includes(key)) keys.push(key);
  };
  for (const key of stored) {
    if (key === anchor) entities.forEach((g) => append(g.key));
    else append(key);
  }
  if (byKey.has("pinned") && !keys.includes("pinned")) keys.unshift("pinned");
  const missing = entities.filter((g) => !keys.includes(g.key)).map((g) => g.key);
  const lastEntity = keys.reduce((last, key, i) => (key !== "pinned" && key !== "threads" ? i : last), -1);
  const threadsIndex = keys.indexOf("threads");
  keys.splice(lastEntity >= 0 ? lastEntity + 1 : threadsIndex >= 0 ? threadsIndex : keys.length, 0, ...missing);
  append("threads");
  return keys.map((key) => byKey.get(key)!);
}

export interface Organization {
  /** What the canvas shows, in sidebar order, with desktop folders after and More last. */
  roots: Collection[];
  /** The sidebar's groups in its order, including hidden ones, for Visible groups. */
  groups: Collection[];
  /** Every collection a window can show, including ones outside the current organization. */
  byKey: Map<string, Collection>;
  /** Every thread the current filters show, in sort order. */
  threads: PluginSidebarThread[];
  /** Where Move to can file a thread: every section, the loose Threads bucket, and desktop folders. */
  targets: Collection[];
}

export function buildCanvasOrganization(data: PluginSidebarThreadsState, p: SidebarPreferences, folders: readonly Folder[]): Organization {
  const threads = data.threads.filter((t) => !t.isHidden && p.threadLifecycles.includes(t.isArchived ? "archived" : "active"));
  const byThread = new Map(threads.map((t) => [t.id, t]));
  const compare = compareThreads(p);
  const ancestorChain = (thread: PluginSidebarThread) => {
    const chain = [thread];
    const seen = new Set([thread.id]);
    while (chain[0]!.parentThreadId) {
      const parent = byThread.get(chain[0]!.parentThreadId!);
      if (!parent || seen.has(parent.id)) break;
      seen.add(parent.id);
      chain.unshift(parent);
    }
    return chain;
  };
  const chains = new Map(threads.map((t) => [t.id, ancestorChain(t)]));
  const rootOf = (t: PluginSidebarThread) => chains.get(t.id)![0]!;
  const pinned = new Set(threads.filter((t) => chains.get(t.id)!.some((a) => a.isPinned)).map((t) => t.id));
  const unpinned = threads.filter((t) => !pinned.has(t.id));
  const collection = (key: string, kind: CollectionKind, name: string, icon: string, members: PluginSidebarThread[], extra: Partial<Collection> = {}): Collection => ({
    key, kind, name, icon, threads: members.slice().sort(compare), children: [], ...extra,
  });
  const section = (id: string, name: string) => collection(`section:${id}`, "section", name, "SectionAdd", unpinned.filter((t) => rootOf(t).sectionId === id), { sectionId: id });
  const project = (id: string, name: string) => collection(`project:${id}`, "project", name, "Folder", unpinned.filter((t) => rootOf(t).projectId === id));
  const machine = (id: string, name: string) => collection(`machine:${id}`, "machine", name, "Laptop", unpinned.filter((t) => t.host?.id === id));
  const noMachine = () => collection("machine:no-machine", "machine", "No machine", "Laptop", unpinned.filter((t) => !t.host));

  const groups: Collection[] = [];
  if (pinned.size) {
    const folder = collection("pinned", "pinned", "Pinned", "Pin", threads.filter((t) => pinned.has(t.id)));
    folder.threads.sort((a, b) => {
      const left = chains.get(a.id)!.find((t) => t.isPinned) ?? a;
      const right = chains.get(b.id)!.find((t) => t.isPinned) ?? b;
      if (left.id === right.id) return compare(a, b);
      return (left.pinSortKey && right.pinSortKey ? left.pinSortKey.localeCompare(right.pinSortKey) : 0)
        || (right.pinnedAt ?? 0) - (left.pinnedAt ?? 0) || right.createdAt - left.createdAt || left.id.localeCompare(right.id);
    });
    groups.push(folder);
  }
  const sectionNames = new Map(data.sections.map((s) => [s.id, s.name]));
  for (const t of threads) {
    const id = rootOf(t).sectionId;
    if (id && !sectionNames.has(id)) sectionNames.set(id, "Section");
  }
  let anchor: string;
  let stored: string[];
  if (p.organizationMode === "project") {
    anchor = "projects";
    stored = p.sectionOrder;
    const projects = data.projects.filter((candidate) => !candidate.isPersonal);
    for (const candidate of projects) groups.push(project(candidate.id, candidate.name));
    const personalIds = new Set(data.projects.filter((candidate) => candidate.isPersonal).map((candidate) => candidate.id));
    const personal = unpinned.filter((t) => personalIds.has(rootOf(t).projectId));
    if (personal.length || !projects.length) groups.push(collection("threads", "threads", "Threads", "MessageSquare", personal));
  } else if (p.organizationMode === "machine") {
    anchor = "machines";
    stored = p.machineSectionOrder;
    const hosts = new Map(((data as PluginSidebarThreadsState & { experimental_hosts?: readonly { id: string; name: string }[] }).experimental_hosts ?? []).map((h) => [h.id, h.name]));
    for (const t of unpinned) if (t.host) hosts.set(t.host.id, t.host.name);
    for (const [id, name] of hosts) groups.push(machine(id, name));
    if (unpinned.some((t) => !t.host)) groups.push(noMachine());
    if (!hosts.size && !unpinned.some((t) => !t.host)) groups.push(collection("threads", "threads", "Threads", "MessageSquare", []));
  } else {
    anchor = "sections";
    stored = p.manualSectionOrder;
    for (const [id, name] of sectionNames) groups.push(section(id, name));
    groups.push(collection("threads", "threads", "Threads", "MessageSquare", unpinned.filter((t) => !rootOf(t).sectionId), { sectionId: null }));
  }
  const ordered = orderCollections(groups, stored, anchor);
  const hidden = ordered.filter((g) => p.hiddenGroups.includes(g.key));
  const roots = ordered.filter((g) => !p.hiddenGroups.includes(g.key));
  const desktopFolders = folders.map((folder) =>
    collection(`folder:${folder.id}`, "folder", folder.name, "Folder", folder.threadIds.flatMap((id) => byThread.get(id) ?? []), { folder }),
  );
  roots.push(...desktopFolders);
  if (hidden.length) roots.push({ ...collection("more", "more", "More", "Layers", []), children: hidden });

  // Keep windows showing a group from another organization usable after the organization changes.
  const available = [...ordered, ...desktopFolders];
  const keep = (group: Collection) => {
    if (!available.some((g) => g.key === group.key)) available.push(group);
  };
  for (const candidate of data.projects) keep(project(candidate.id, candidate.name));
  for (const [id, name] of sectionNames) keep(section(id, name));
  const hosts = new Map(threads.flatMap((t) => (t.host ? [[t.host.id, t.host.name] as const] : [])));
  for (const [id, name] of hosts) keep(machine(id, name));
  keep(noMachine());
  keep(collection("pinned", "pinned", "Pinned", "Pin", []));
  const environmentFolders: Collection[] = [];
  for (const group of available) {
    const membersInGroup = new Set(group.threads.map((t) => t.id));
    const groupRoot = (t: PluginSidebarThread) => chains.get(t.id)!.find((a) => membersInGroup.has(a.id)) ?? t;
    const environments = new Map<string, PluginSidebarThread[]>();
    for (const t of group.threads) {
      const environment = groupRoot(t).environment;
      if (!environment?.id || !environment.isWorktree) continue;
      const bucket = environments.get(environment.id) ?? [];
      bucket.push(t);
      environments.set(environment.id, bucket);
    }
    for (const [id, members] of environments) {
      const environment = groupRoot(members[0]!).environment!;
      const folder = collection(`${group.key}/environment:${id}`, "environment", environment.name ?? environment.branchName ?? "Environment", "GitBranch", members);
      environmentFolders.push(folder);
      if (groupByEnvironment(p) && new Set(members.map((t) => groupRoot(t).id)).size >= 2) group.children.push(folder);
    }
  }
  const all = collection("all-threads", "threads", "My Threads", "MessageSquare", threads);
  const byKey = new Map<string, Collection>();
  const add = (g: Collection) => {
    byKey.set(g.key, g);
    g.children.forEach(add);
  };
  [...available, ...environmentFolders, ...roots, all].forEach(add);
  const targets = [
    ...[...sectionNames].map(([id, name]) => byKey.get(`section:${id}`) ?? section(id, name)),
    byKey.get("threads")?.sectionId === null ? byKey.get("threads")! : collection("threads", "threads", "Threads", "MessageSquare", [], { sectionId: null }),
    ...desktopFolders,
  ];
  return { roots, groups: ordered, byKey, threads: all.threads, targets };
}
