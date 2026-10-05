import type { PluginSidebarThread, PluginSidebarThreadsState } from "@get-bb/plugin-sdk/app";
import type { SidebarPreferences } from "./sidebar-preferences";
import type { Layout } from "./state";

export type CanvasCollection = {
  id: string; name: string; icon: string; custom: boolean;
  threads: PluginSidebarThread[];
  children: CanvasCollection[];
};
export const groupByEnvironment = (p: SidebarPreferences) => p.environmentGrouping === "auto" ? p.organizationMode !== "chronological" : p.environmentGrouping;

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

export function orderCollections(groups: CanvasCollection[], stored: string[], anchor: string) {
  const byId = new Map(groups.map(g => [g.id, g]));
  const entities = groups.filter(g => g.id !== "pinned" && g.id !== "threads");
  const ids: string[] = [];
  const append = (id: string) => { if (byId.has(id) && !ids.includes(id)) ids.push(id); };
  for (const id of stored) {
    if (id === anchor) entities.forEach(g => append(g.id));
    else append(id);
  }
  if (byId.has("pinned") && !ids.includes("pinned")) ids.unshift("pinned");
  const missing = entities.filter(g => !ids.includes(g.id)).map(g => g.id);
  const lastEntity = ids.reduce((last, id, i) => id !== "pinned" && id !== "threads" ? i : last, -1);
  const threadsIndex = ids.indexOf("threads");
  ids.splice(lastEntity >= 0 ? lastEntity + 1 : threadsIndex >= 0 ? threadsIndex : ids.length, 0, ...missing);
  append("threads");
  return ids.map(id => byId.get(id)!);
}

export function buildCanvasOrganization(data: PluginSidebarThreadsState, p: SidebarPreferences, layout: Layout) {
  const threads = data.threads.filter(t => !t.isHidden && p.threadLifecycles.includes(t.isArchived ? "archived" : "active"));
  const byThread = new Map(threads.map(t => [t.id, t]));
  const compare = compareThreads(p);
  const ancestorChain = (thread: PluginSidebarThread) => {
    const chain = [thread], seen = new Set([thread.id]);
    while (chain[0].parentThreadId) {
      const parent = byThread.get(chain[0].parentThreadId!);
      if (!parent || seen.has(parent.id)) break;
      seen.add(parent.id); chain.unshift(parent);
    }
    return chain;
  };
  const chains = new Map(threads.map(t => [t.id, ancestorChain(t)]));
  const rootOf = (t: PluginSidebarThread) => chains.get(t.id)![0];
  const pinned = new Set(threads.filter(t => chains.get(t.id)!.some(a => a.isPinned)).map(t => t.id));
  const unpinned = threads.filter(t => !pinned.has(t.id));
  const collection = (id: string, name: string, icon: string, members: PluginSidebarThread[], custom = false): CanvasCollection => ({
    id, name, icon, custom, threads: members.slice().sort(compare), children: [],
  });
  const groups: CanvasCollection[] = [];
  if (pinned.size) {
    const folder = collection("pinned", "Pinned", "Pin", threads.filter(t => pinned.has(t.id)));
    folder.threads.sort((a, b) => {
      const left = chains.get(a.id)!.find(t => t.isPinned) ?? a;
      const right = chains.get(b.id)!.find(t => t.isPinned) ?? b;
      if (left.id === right.id) return compare(a, b);
      return (left.pinSortKey && right.pinSortKey ? left.pinSortKey.localeCompare(right.pinSortKey) : 0)
        || (right.pinnedAt ?? 0) - (left.pinnedAt ?? 0) || right.createdAt - left.createdAt || left.id.localeCompare(right.id);
    });
    groups.push(folder);
  }
  let anchor: string;
  let stored: string[];
  if (p.organizationMode === "project") {
    anchor = "projects"; stored = p.sectionOrder;
    const projects = data.projects.filter(project => !project.isPersonal);
    for (const project of projects) groups.push(collection("project:" + project.id, project.name, "Folder", unpinned.filter(t => rootOf(t).projectId === project.id)));
    const personalIds = new Set(data.projects.filter(project => project.isPersonal).map(project => project.id));
    const personal = unpinned.filter(t => personalIds.has(rootOf(t).projectId));
    if (personal.length || !projects.length) groups.push(collection("threads", "Threads", "MessageSquare", personal));
  } else if (p.organizationMode === "machine") {
    anchor = "machines"; stored = p.machineSectionOrder;
    const hosts = new Map(((data as PluginSidebarThreadsState & { experimental_hosts?: readonly { id: string; name: string }[] }).experimental_hosts ?? []).map(h => [h.id, h.name]));
    for (const thread of unpinned) if (thread.host) hosts.set(thread.host.id, thread.host.name);
    for (const [id, name] of hosts) groups.push(collection("machine:" + id, name, "Monitor", unpinned.filter(t => t.host?.id === id)));
    const noMachine = unpinned.filter(t => !t.host);
    if (noMachine.length) groups.push(collection("machine:no-machine", "No machine", "Monitor", noMachine));
    if (!hosts.size && !noMachine.length) groups.push(collection("threads", "Threads", "MessageSquare", []));
  } else {
    anchor = "sections"; stored = p.manualSectionOrder;
    const sections = new Map(data.sections.map(section => [section.id, section.name]));
    for (const t of unpinned) { const id = rootOf(t).sectionId; if (id && !sections.has(id)) sections.set(id, "Section"); }
    for (const [id, name] of sections) groups.push(collection("section:" + id, name, "SectionAdd", unpinned.filter(t => rootOf(t).sectionId === id)));
    groups.push(collection("threads", "Threads", "MessageSquare", unpinned.filter(t => !rootOf(t).sectionId)));
  }
  const ordered = orderCollections(groups, stored!, anchor!);
  const hidden = ordered.filter(g => p.hiddenGroups.includes(g.id));
  const roots = ordered.filter(g => !p.hiddenGroups.includes(g.id));
  const local = layout.folders.map(f => collection(f.id, f.name, "Folder", threads.filter(t => layout.membership[t.id] === f.id), true));
  roots.push(...local);
  if (hidden.length) roots.push({ ...collection("more", "More", "Folder", []), children: hidden });

  // Keep existing folder windows usable while another organization is selected.
  const available = [...ordered, ...local];
  const keep = (group: CanvasCollection) => { if (!available.some(g => g.id === group.id)) available.push(group); };
  for (const project of data.projects) keep(collection("project:" + project.id, project.name, "Folder", unpinned.filter(t => rootOf(t).projectId === project.id)));
  for (const section of data.sections) keep(collection("section:" + section.id, section.name, "SectionAdd", unpinned.filter(t => rootOf(t).sectionId === section.id)));
  const hosts = new Map(threads.flatMap(t => t.host ? [[t.host.id, t.host.name] as const] : []));
  for (const [id, name] of hosts) keep(collection("machine:" + id, name, "Monitor", unpinned.filter(t => t.host?.id === id)));
  keep(collection("machine:no-machine", "No machine", "Monitor", unpinned.filter(t => !t.host)));
  keep(collection("pinned", "Pinned", "Pin", []));
  if (groupByEnvironment(p)) {
    for (const group of available) {
      const membersInGroup = new Set(group.threads.map(t => t.id));
      const groupRoot = (t: PluginSidebarThread) => chains.get(t.id)!.find(a => membersInGroup.has(a.id)) ?? t;
      const envs = new Map<string, PluginSidebarThread[]>();
      for (const t of group.threads) {
        const env = groupRoot(t).environment;
        if (!env?.id || !env.isWorktree) continue;
        const bucket = envs.get(env.id) ?? []; bucket.push(t); envs.set(env.id, bucket);
      }
      for (const [id, members] of envs) {
        if (new Set(members.map(t => groupRoot(t).id)).size < 2) continue;
        const env = groupRoot(members[0]).environment!;
        group.children.push(collection(group.id + "/environment:" + id, env.name ?? env.branchName ?? "Environment", "GitBranch", members));
      }
    }
  }
  const all = collection("all-threads", "Threads", "MessageSquare", threads);
  const byId = new Map<string, CanvasCollection>();
  const add = (g: CanvasCollection) => { byId.set(g.id, g); g.children.forEach(add); };
  [...available, ...roots, all].forEach(add);
  return { roots, groups: ordered, byId, threads: all.threads };
}
