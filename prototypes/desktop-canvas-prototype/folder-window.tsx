import { useState } from "react";
import { experimental_Icon as Icon, type PluginSidebarThread } from "@get-bb/plugin-sdk/app";
import { Button } from "./components/ui/button";

export type CanvasFolder = { id: string; name: string; custom: boolean };
export const THREAD_DRAG = "application/x-bb-canvas-thread";
export const threadTitle = (thread: { title: string | null; titleFallback: string | null; id: string }) => thread.title ?? thread.titleFallback ?? thread.id;

/** Desktop's select / open / file interactions, without its shell or visual styling. */
export function FolderWindow({ name, threads, folders, projectNames, openThread, moveThread }: {
  name: string;
  threads: PluginSidebarThread[];
  folders: CanvasFolder[];
  projectNames: Map<string, string>;
  openThread: (id: string) => void;
  moveThread: (threadId: string, folderId: string) => void;
}) {
  const [query, setQuery] = useState("");
  const [selection, setSelection] = useState<string | null>(null);
  const [view, setView] = useState<"list" | "icons">("list");
  const [limit, setLimit] = useState(60);
  const matched = threads.filter(thread => threadTitle(thread).toLocaleLowerCase().includes(query.trim().toLocaleLowerCase()));
  const selected = matched.find(thread => thread.id === selection);
  return <div className="cdc-finder">
    <div className="cdc-finder-toolbar">
      <label className="cdc-search"><Icon name="Search" /><input aria-label={`Search ${name}`} placeholder="Search" value={query} onChange={event => { setQuery(event.target.value); setLimit(60); }} /></label>
      <Button variant="ghost" size="sm" aria-label="List view" aria-pressed={view === "list"} onClick={() => setView("list")}>List</Button>
      <Button variant="ghost" size="sm" aria-label="Icon view" aria-pressed={view === "icons"} onClick={() => setView("icons")}>Icons</Button>
    </div>
    <div className={`cdc-finder-items cdc-finder-${view}`} data-folder-content>
      {matched.slice(0, limit).map(thread => <button key={thread.id} type="button" className="cdc-file" aria-pressed={selection === thread.id} title={threadTitle(thread)}
        onClick={() => setSelection(thread.id)} onDoubleClick={() => openThread(thread.id)}
        onKeyDown={event => { if (event.key === "Enter") { event.preventDefault(); openThread(thread.id); } }}
        draggable onDragStart={event => { setSelection(thread.id); event.dataTransfer.setData(THREAD_DRAG, thread.id); event.dataTransfer.effectAllowed = "move"; }}>
        <Icon name="MessageSquare" /><span>{threadTitle(thread)}<small>{projectNames.get(thread.projectId)}</small></span>
        {thread.status === "active" ? <small>Running</small> : thread.hasPendingInteraction ? <small>Input needed</small> : null}
      </button>)}
      {!matched.length && <p className="cdc-empty">{query ? "No matching threads." : "No threads in this folder."}</p>}
      {matched.length > limit && <Button variant="ghost" size="sm" onClick={() => setLimit(value => value + 60)}>Show more</Button>}
    </div>
    <footer><span>{matched.length} {matched.length === 1 ? "thread" : "threads"}</span>{selected && <>
      <Button size="sm" variant="ghost" onClick={() => openThread(selected.id)}>Open</Button>
      <select aria-label={`Move ${threadTitle(selected)} to folder`} value="" onChange={event => { if (event.target.value) moveThread(selected.id, event.target.value); }}>
        <option value="" disabled>Move to…</option>
        <option value={`project:${selected.projectId}`}>Project folder</option>
        {folders.filter(folder => folder.custom).map(folder => <option key={folder.id} value={folder.id}>{folder.name}</option>)}
      </select>
    </>}</footer>
  </div>;
}
