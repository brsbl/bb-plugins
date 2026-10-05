import { useState } from "react";
import { experimental_Icon as Icon, experimental_ProviderIcon as ProviderIcon, type PluginSidebarThread, type PluginSidebarThreadsState } from "@get-bb/plugin-sdk/app";
import { Button } from "./components/ui/button";
import type { CanvasCollection } from "./canvas-organization";

export type CanvasFolder = { id: string; name: string; custom: boolean };
export const THREAD_DRAG = "application/x-bb-canvas-thread";
export const threadTitle = (thread: { title: string | null; titleFallback: string | null; id: string }) => thread.title ?? thread.titleFallback ?? thread.id;

/** Desktop's select / open / file interactions, without its shell or visual styling. */
export function FolderWindow({ name, threads, collections = [], folders, projectNames, openThread, openFolder, moveThread, showProviderIcons, archived }: {
  name: string;
  threads: PluginSidebarThread[];
  collections?: CanvasCollection[];
  folders: CanvasFolder[];
  projectNames: Map<string, string>;
  openThread: (id: string) => void;
  openFolder: (id: string) => void;
  moveThread: (threadId: string, folderId: string) => void;
  showProviderIcons: boolean;
  archived: PluginSidebarThreadsState["experimental_archived"];
}) {
  const [query, setQuery] = useState("");
  const [selection, setSelection] = useState<string | null>(null);
  const [view, setView] = useState<"list" | "icons">("list");
  const [limit, setLimit] = useState(60);
  const needle = query.trim().toLocaleLowerCase();
  const grouped = new Set(collections.flatMap(group => group.threads.map(t => t.id)));
  // Searching a collection also finds threads inside its environment folders.
  const candidates = threads.length ? threads : collections.flatMap(group => group.threads);
  const matched = candidates.filter(thread => (!grouped.has(thread.id) || !!needle) && threadTitle(thread).toLocaleLowerCase().includes(needle));
  const childFolders = collections.filter(group => !needle || group.name.toLocaleLowerCase().includes(needle));
  const selected = matched.find(thread => thread.id === selection);
  const selectedFolder = childFolders.find(group => group.id === selection);
  return <div className="cdc-finder">
    <div className="cdc-finder-toolbar">
      <label className="cdc-search"><Icon name="Search" /><input aria-label={`Search ${name}`} placeholder="Search" value={query} onChange={event => { setQuery(event.target.value); setLimit(60); }} /></label>
      <Button variant="ghost" size="sm" aria-label="List view" aria-pressed={view === "list"} onClick={() => setView("list")}>List</Button>
      <Button variant="ghost" size="sm" aria-label="Icon view" aria-pressed={view === "icons"} onClick={() => setView("icons")}>Icons</Button>
    </div>
    <div className={`cdc-finder-items cdc-finder-${view}`} data-folder-content>
      {childFolders.map(group => <button key={group.id} type="button" className="cdc-file" aria-pressed={selection === group.id} onClick={() => setSelection(group.id)} onDoubleClick={() => openFolder(group.id)} onKeyDown={event => { if (event.key === "Enter") { event.preventDefault(); openFolder(group.id); } }}>
        <Icon name={group.icon} className="cdc-resource-icon" /><span>{group.name}<small>{group.threads.length} threads</small></span>
      </button>)}
      {matched.slice(0, limit).map(thread => <button key={thread.id} type="button" className="cdc-file" aria-pressed={selection === thread.id} title={threadTitle(thread)}
        onClick={() => setSelection(thread.id)} onDoubleClick={() => openThread(thread.id)}
        onKeyDown={event => { if (event.key === "Enter") { event.preventDefault(); openThread(thread.id); } }}
        draggable onDragStart={event => { setSelection(thread.id); event.dataTransfer.setData(THREAD_DRAG, thread.id); event.dataTransfer.effectAllowed = "move"; }}>
        {showProviderIcons ? <ProviderIcon providerKind="agent" provider={{ id: thread.providerId }} /> : <Icon name="MessageSquare" />}<span>{threadTitle(thread)}<small>{projectNames.get(thread.projectId)}</small></span>
        {thread.isArchived ? <small>Archived</small> : thread.status === "active" ? <small>Running</small> : thread.hasPendingInteraction ? <small>Input needed</small> : null}
      </button>)}
      {!matched.length && !childFolders.length && <p className="cdc-empty">{query ? "No matching threads." : "No threads in this folder."}</p>}
      {matched.length > limit && <Button variant="ghost" size="sm" onClick={() => setLimit(value => value + 60)}>Show more</Button>}
      {archived?.hasNextPage && <Button variant="ghost" size="sm" disabled={archived.isFetchingNextPage} onClick={() => void archived.fetchNextPage().catch(() => {})}>{archived.isFetchingNextPage ? "Loading archived threads…" : archived.isFetchNextPageError ? "Retry archived threads" : "Load more archived threads"}</Button>}
      {archived?.status === "error" && <p role="alert" className="cdc-empty">Archived threads could not load. Reload to try again.</p>}
    </div>
    <footer><span>{needle ? matched.length : candidates.length} threads{!needle && childFolders.length ? ` · ${childFolders.length} folders` : ""}</span>{selectedFolder && <Button size="sm" variant="ghost" onClick={() => openFolder(selectedFolder.id)}>Open</Button>}{selected && <>
      <Button size="sm" variant="ghost" onClick={() => openThread(selected.id)}>Open</Button>
      <select aria-label={`Move ${threadTitle(selected)} to folder`} value="" onChange={event => { if (event.target.value) moveThread(selected.id, event.target.value); }}>
        <option value="" disabled>Move to…</option>
        <option value={`project:${selected.projectId}`}>Project folder</option>
        {folders.filter(folder => folder.custom).map(folder => <option key={folder.id} value={folder.id}>{folder.name}</option>)}
      </select>
    </>}</footer>
  </div>;
}
