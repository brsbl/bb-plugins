import { useEffect, useMemo, useRef, useState, type PointerEvent, type KeyboardEvent } from "react";
import {
  definePluginApp, experimental_Icon as Icon,
  experimental_NewThreadComposer as NewThreadComposer,
  experimental_useSidebarThreads as useSidebarThreads,
  ThreadChat, useBbNavigate, useSdk,
} from "@get-bb/plugin-sdk/app";
import { Button } from "./components/ui/button";
import { fitCamera, folderFor, readLayout, zoomAt, type Layout, type Point } from "./state";
import "./app.css";

const WINDOW_WIDTH = 680;
const WINDOW_HEIGHT = 530;
const FOLDER_WIDTH = 256;
const titleOf = (thread: { title: string | null; titleFallback: string | null; id: string }) => thread.title ?? thread.titleFallback ?? thread.id;

function Action({ icon, label, onClick, pressed }: { icon: string; label: string; onClick: () => void; pressed?: boolean }) {
  return <Button variant="ghost" size="icon" aria-label={label} aria-pressed={pressed} onClick={onClick}><Icon name={icon} /></Button>;
}

function Desktop() {
  const pluginId = "desktop-canvas-prototype";
  const storageKey = `${pluginId}:layout:v1`;
  const data = useSidebarThreads();
  const sdk = useSdk();
  const navigate = useBbNavigate();
  const root = useRef<HTMLDivElement>(null);
  const [layout, setLayout] = useState<Layout>(() => {
    try { return readLayout(localStorage.getItem(storageKey)); } catch { return readLayout(null); }
  });
  const [storageError, setStorageError] = useState(false);
  const [active, setActive] = useState<string | null>(null);
  const [focused, setFocused] = useState<string | null>(null);
  const [launcher, setLauncher] = useState(false);
  const [query, setQuery] = useState("");
  const [listLimit, setListLimit] = useState(40);
  const [newFolder, setNewFolder] = useState(false);
  const [folderName, setFolderName] = useState("");
  const [focusPrompt, setFocusPrompt] = useState(0);
  const [notice, setNotice] = useState("");
  const [panMode, setPanMode] = useState(false);
  const [size, setSize] = useState({ width: 1200, height: 800 });
  const drag = useRef<{ pointer: number; start: Point; origin: Point; kind: "camera" | "folder" | "window" | "prompt"; id: string; zoom: number } | null>(null);
  const threads = useMemo(() => data.threads.filter(t => !t.isHidden && !t.isArchived), [data.threads]);
  const threadMap = useMemo(() => new Map(threads.map(t => [t.id, t])), [threads]);
  const folders = useMemo(() => [
    ...data.projects.map(p => ({ id: `project:${p.id}`, name: p.name, custom: false })),
    ...layout.folders.map(f => ({ ...f, custom: true })),
  ], [data.projects, layout.folders]);
  const folderPosition = (id: string, index: number) => layout.positions[id] ?? { x: 64 + (index % 3) * 290, y: 80 + Math.floor(index / 3) * 348 };
  const folderThreads = (id: string) => threads.filter(t => folderFor(t, layout) === id);
  const camera = layout.camera;
  const zoom = camera.zoom;
  const visibleWindows = layout.windows.filter(w => !w.minimized);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      try { localStorage.setItem(storageKey, JSON.stringify(layout)); setStorageError(false); }
      catch { setStorageError(true); }
    }, 180);
    return () => window.clearTimeout(timer);
  }, [layout, storageKey]);
  useEffect(() => {
    if (!root.current) return;
    const observer = new ResizeObserver(([entry]) => setSize({ width: entry.contentRect.width, height: entry.contentRect.height }));
    observer.observe(root.current);
    return () => observer.disconnect();
  }, []);
  useEffect(() => {
    const element = root.current;
    if (!element) return;
    const wheel = (event: WheelEvent) => {
      if (focused || !(event.target instanceof Element) || event.target.closest('[data-screen], [data-window-content], [data-folder-content]')) return;
      event.preventDefault();
      const bounds = element.getBoundingClientRect();
      setLayout(current => ({ ...current, camera: event.ctrlKey || event.metaKey
        ? zoomAt(current.camera, current.camera.zoom * Math.exp(-event.deltaY * 0.008), { x: event.clientX - bounds.left, y: event.clientY - bounds.top })
        : { ...current.camera, x: current.camera.x - event.deltaX, y: current.camera.y - event.deltaY } }));
    };
    element.addEventListener("wheel", wheel, { passive: false });
    return () => element.removeEventListener("wheel", wheel);
  }, [focused]);

  function moveCamera(nextZoom: number) {
    setFocused(null);
    setLayout(current => ({ ...current, camera: zoomAt(current.camera, nextZoom, { x: size.width / 2, y: (size.height - 72) / 2 }) }));
  }
  function fitAll() {
    setFocused(null);
    const bounds = folders.map((f, i) => ({ ...folderPosition(f.id, i), width: FOLDER_WIDTH, height: layout.collapsed.includes(f.id) ? 56 : 296 }));
    bounds.push(...visibleWindows.map(w => ({ x: w.x, y: w.y, width: WINDOW_WIDTH, height: WINDOW_HEIGHT })));
    setLayout(current => ({ ...current, camera: fitCamera(bounds, size.width, size.height) }));
  }
  function showPrompt(mode: Layout["composer"] = "center") {
    setFocused(null);
    setLayout(current => ({ ...current, composer: mode }));
    setFocusPrompt(value => value + 1);
    setLauncher(false);
  }
  function openThread(id: string) {
    setActive(id);
    setFocused(null);
    setLauncher(false);
    setLayout(current => {
      const existing = current.windows.find(w => w.id === id);
      const point = existing ?? { x: (size.width / 2 - current.camera.x) / current.camera.zoom - WINDOW_WIDTH / 2, y: (size.height / 2 - current.camera.y) / current.camera.zoom - WINDOW_HEIGHT / 2 };
      const windows = [...current.windows.filter(w => w.id !== id), { id, x: point.x, y: point.y, minimized: false }].slice(-50);
      return { ...current, windows, composer: "hidden", camera: { zoom: 1, x: (size.width - WINDOW_WIDTH) / 2 - point.x, y: Math.max(56, (size.height - WINDOW_HEIGHT - 72) / 2) - point.y } };
    });
  }
  function focusThread(id: string) { setActive(id); setFocused(id); setLayout(current => ({ ...current, composer: "hidden" })); }
  function closeThread(id: string) {
    setLayout(current => ({ ...current, windows: current.windows.filter(w => w.id !== id) }));
    if (focused === id) setFocused(null);
    if (active === id) setActive(null);
  }
  function minimizeThread(id: string) {
    setLayout(current => ({ ...current, windows: current.windows.map(w => w.id === id ? { ...w, minimized: true } : w) }));
    if (focused === id) setFocused(null);
  }
  function startDrag(event: PointerEvent, kind: "camera" | "folder" | "window" | "prompt", id: string, origin: Point) {
    if (event.button !== 0 || focused) return;
    if (kind !== "camera" && event.target instanceof Element && event.target.closest('[data-no-drag]')) return;
    event.preventDefault();
    event.stopPropagation();
    event.currentTarget.setPointerCapture(event.pointerId);
    drag.current = { pointer: event.pointerId, start: { x: event.clientX, y: event.clientY }, origin, kind, id, zoom };
    if (kind === "window") setActive(id);
  }
  function dragMove(event: PointerEvent) {
    const current = drag.current;
    if (!current || current.pointer !== event.pointerId) return;
    const scale = (current.kind === "camera" || current.kind === "prompt") ? 1 : current.zoom;
    const point = { x: Math.max(-100_000, Math.min(100_000, current.origin.x + (event.clientX - current.start.x) / scale)), y: Math.max(-100_000, Math.min(100_000, current.origin.y + (event.clientY - current.start.y) / scale)) };
    setLayout(state => current.kind === "camera" ? { ...state, camera: { ...state.camera, ...point } }
      : current.kind === "prompt" ? { ...state, promptPosition: { x: Math.max(16, Math.min(size.width - Math.min(720, size.width - 64) - 16, point.x)), y: Math.max(56, Math.min(size.height - 300, point.y)) } }
      : current.kind === "folder" ? { ...state, positions: { ...state.positions, [current.id]: point } }
      : { ...state, windows: state.windows.map(w => w.id === current.id ? { ...w, ...point } : w) });
  }
  function nudge(event: KeyboardEvent, kind: "folder" | "window" | "prompt", id: string, point: Point) {
    const delta = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] }[event.key];
    if (!delta || focused) return;
    event.preventDefault(); event.stopPropagation();
    const step = event.shiftKey ? 100 : 24;
    const next = { x: Math.max(-100_000, Math.min(100_000, point.x + delta[0] * step)), y: Math.max(-100_000, Math.min(100_000, point.y + delta[1] * step)) };
    setLayout(current => kind === "prompt" ? { ...current, promptPosition: { x: Math.max(16, Math.min(size.width - Math.min(720, size.width - 64) - 16, next.x)), y: Math.max(56, Math.min(size.height - 300, next.y)) } } : kind === "folder" ? { ...current, positions: { ...current.positions, [id]: next } }
      : { ...current, windows: current.windows.map(w => w.id === id ? { ...w, ...next } : w) });
  }
  function visitFolder(id: string) {
    const index = folders.findIndex(f => f.id === id);
    const point = folderPosition(id, index);
    setFocused(null); setLauncher(false);
    setLayout(current => ({ ...current, composer: "hidden", collapsed: current.collapsed.filter(item => item !== id), camera: { zoom: 1, x: size.width / 2 - point.x - FOLDER_WIDTH / 2, y: 96 - point.y } }));
  }
  const floatPoint = { x: Math.max(16, Math.min(size.width - Math.min(720, size.width - 64) - 16, layout.promptPosition?.x ?? size.width - 744)), y: Math.max(56, Math.min(size.height - 300, layout.promptPosition?.y ?? size.height - 380)) };
  const matched = threads.filter(t => `${titleOf(t)} ${data.projects.find(p => p.id === t.projectId)?.name ?? ""}`.toLowerCase().includes(query.toLowerCase()));

  return <div className={`cdc-desktop ${panMode ? "cdc-pan" : ""}`} ref={root} onPointerMove={dragMove} onPointerUp={() => { drag.current = null; }} onPointerCancel={() => { drag.current = null; }}
    onKeyDown={event => { if (event.key === "Escape") { setLauncher(false); setFocused(null); setPanMode(false); } }}>
    <div className="cdc-canvas" tabIndex={0} aria-label="Canvas. Arrow keys pan, plus and minus zoom, zero resets zoom. Drag empty canvas to pan."
      onPointerDown={event => { if (event.target === event.currentTarget || panMode) startDrag(event, "camera", "", camera); }}
      onKeyDown={event => {
        if (event.target !== event.currentTarget) return;
        if (event.key === "+" || event.key === "=") { event.preventDefault(); moveCamera(zoom + 0.1); }
        if (event.key === "-") { event.preventDefault(); moveCamera(zoom - 0.1); }
        if (event.key === "0") { event.preventDefault(); moveCamera(1); }
        const delta = { ArrowLeft: [64, 0], ArrowRight: [-64, 0], ArrowUp: [0, 64], ArrowDown: [0, -64] }[event.key];
        if (delta) { event.preventDefault(); setLayout(current => ({ ...current, camera: { ...current.camera, x: current.camera.x + delta[0], y: current.camera.y + delta[1] } })); }
      }}>
      <div className="cdc-world" style={{ transform: focused ? "none" : `translate(${camera.x}px,${camera.y}px) scale(${zoom})` }}>
        {folders.map((folder, index) => {
          const items = folderThreads(folder.id);
          const point = folderPosition(folder.id, index);
          const collapsed = layout.collapsed.includes(folder.id);
          return <section key={folder.id} className="cdc-folder" aria-label={`${folder.name} folder`} style={{ left: point.x, top: point.y, display: focused ? "none" : undefined }}>
            <header onPointerDown={event => startDrag(event, "folder", folder.id, point)}>
              <button className="cdc-title" aria-label={`Move ${folder.name} folder with arrow keys`} onKeyDown={event => nudge(event, "folder", folder.id, point)}><Icon name="Folder" /><span>{folder.name}</span><small>{items.length}</small></button>
              <span data-no-drag><Action icon={collapsed ? "ChevronDown" : "ChevronUp"} label={`${collapsed ? "Expand" : "Collapse"} ${folder.name}`} onClick={() => setLayout(current => ({ ...current, collapsed: collapsed ? current.collapsed.filter(id => id !== folder.id) : [...current.collapsed, folder.id] }))} /></span>
            </header>
            {!collapsed && <div data-folder-content className="cdc-folder-items">
              {items.slice(0, 5).map(thread => <button key={thread.id} className="cdc-thread-row" onClick={() => openThread(thread.id)}><Icon name="MessageSquare" /><span>{titleOf(thread)}</span><small>{thread.status === "active" ? "Running" : thread.hasPendingInteraction ? "Input" : ""}</small></button>)}
              {!items.length && <p className="cdc-empty">{folder.custom ? "Move threads here from Find threads." : "Your threads will appear here."}</p>}
              {items.length > 5 && <Button variant="ghost" size="sm" onClick={() => { setQuery(folder.custom ? "" : folder.name); setLauncher(true); }}>View all {items.length} threads</Button>}
              <div className="cdc-folder-caption">{folder.custom ? "Canvas folder" : "Project"}</div>
            </div>}
          </section>;
        })}
        {layout.windows.map((win, index) => {
          const thread = threadMap.get(win.id);
          const title = thread ? titleOf(thread) : "Thread";
          const focus = focused === win.id;
          const live = (focus || Math.abs(zoom - 1) < 0.001) && active === win.id;
          return <section key={win.id} className={`cdc-window ${focus ? "cdc-focused" : ""} ${active === win.id ? "cdc-active" : ""}`} aria-label={`${title} window`}
            style={{ left: focus ? 24 : win.x, top: focus ? 56 : win.y, zIndex: active === win.id ? 60 : index + 1, display: win.minimized || (focused && !focus) ? "none" : undefined }}>
            <header onPointerDown={event => startDrag(event, "window", win.id, win)}>
              <button className="cdc-title" aria-label={`Move ${title} window with arrow keys`} onKeyDown={event => nudge(event, "window", win.id, win)}><Icon name="MessageSquare" /><span>{title}</span></button>
              <div className="cdc-window-actions" data-no-drag>
                <Action icon={focus ? "Minimize2" : "Maximize2"} label={focus ? "Return to canvas" : `Focus ${title}`} onClick={() => focus ? setFocused(null) : focusThread(win.id)} />
                <Action icon="ArrowUpRight" label={`Open ${title} in bb`} onClick={() => navigate.toThread(win.id)} />
                <Action icon="Minus" label={`Minimize ${title}`} onClick={() => minimizeThread(win.id)} />
                <Action icon="X" label={`Close ${title}`} onClick={() => closeThread(win.id)} />
              </div>
            </header>
            <div data-window-content className="cdc-window-body">
              {live ? <ThreadChat threadId={win.id} layout="contained" variant="full" permissionPolicy="inherit" /> : <div className="cdc-overview">
                <Icon name="MessageSquare" /><h2>{title}</h2><p>{data.projects.find(p => p.id === thread?.projectId)?.name ?? "Conversation"}</p>
                <p>{thread?.status === "active" ? "Agent is running" : "Ready to pick up where you left off"}</p>
                <div><Button size="sm" variant="secondary" onClick={() => openThread(win.id)}>Read at 100%</Button><Button size="sm" variant="ghost" onClick={() => focusThread(win.id)}>Focus</Button></div>
              </div>}
            </div>
          </section>;
        })}
      </div>
    </div>

    <div className="cdc-heading" data-screen><Icon name="AppWindow" /><span>Canvas Desktop</span><small>Prototype</small></div>
    <div className={`cdc-prompt cdc-prompt-${layout.composer}`} data-screen style={layout.composer === "float" ? { left: floatPoint.x, top: floatPoint.y, right: "auto", bottom: "auto" } : undefined} aria-hidden={layout.composer === "hidden"} inert={layout.composer === "hidden"}>
      <div className="cdc-prompt-intro"><p>Your workspace, spread out.</p><h1>What would you like to work on?</h1></div>
      <div className="cdc-prompt-toolbar" onPointerDown={event => { if (layout.composer === "float") startDrag(event, "prompt", "main", floatPoint); }}><button className="cdc-title" aria-label="Move floating composer with arrow keys" onKeyDown={event => { if (layout.composer === "float") nudge(event, "prompt", "main", floatPoint); }}>New thread</button><div data-no-drag>
        <Action icon="Target" label="Center composer" pressed={layout.composer === "center"} onClick={() => showPrompt("center")} />
        <Action icon="PanelBottom" label="Float composer" pressed={layout.composer === "float"} onClick={() => showPrompt("float")} />
        <Action icon="Minus" label="Hide composer" onClick={() => setLayout(current => ({ ...current, composer: "hidden" }))} />
      </div></div>
      <NewThreadComposer key="main-composer" draftKey={`${pluginId}:main`} layout="document" focusRequest={focusPrompt} placeholder="Ask anything, or start something new…"
        onSubmit={async request => {
          const created = await sdk.threads.spawn(request);
          try { openThread(created.id); }
          catch { setNotice(`Thread created. Open it from Find threads (${created.id}).`); }
        }} />
    </div>

    {(notice || storageError || data.status === "error") && <div className="cdc-notice" role="status" data-screen>{notice || (storageError ? "Layout could not be saved on this device." : "Threads could not load. Reload to try again.")}<Action icon="X" label="Dismiss notice" onClick={() => setNotice("")} /></div>}
    {data.status === "loading" && <div className="cdc-loading" role="status">Loading your workspace…</div>}

    {launcher && <aside className="cdc-launcher" data-screen aria-label="Launcher">
      <header><strong>Workspace</strong><Action icon="X" label="Close launcher" onClick={() => setLauncher(false)} /></header>
      <div className="cdc-launcher-actions"><Button variant="secondary" size="sm" onClick={() => showPrompt("float")}><Icon name="Plus" />New thread</Button><Button variant="ghost" size="sm" onClick={() => setNewFolder(value => !value)}><Icon name="FolderPlus" />New folder</Button><Button variant="ghost" size="sm" onClick={fitAll}><Icon name="Maximize2" />Fit all</Button></div>
      {newFolder && <form className="cdc-new-folder" onSubmit={event => {
        event.preventDefault(); const name = folderName.trim(); if (!name || layout.folders.length >= 100) return;
        const id = `folder:${crypto.randomUUID()}`;
        setLayout(current => ({ ...current, folders: [...current.folders, { id, name }], positions: { ...current.positions, [id]: { x: (size.width / 2 - current.camera.x) / current.camera.zoom - 128, y: (size.height / 2 - current.camera.y) / current.camera.zoom - 120 } } }));
        setFolderName(""); setNewFolder(false);
      }}><input aria-label="Folder name" maxLength={80} placeholder="Folder name" value={folderName} onChange={e => setFolderName(e.target.value)} /><Button size="sm" type="submit">Create</Button></form>}
      <label className="cdc-search"><Icon name="Search" /><input autoFocus aria-label="Find threads" placeholder="Find a thread…" value={query} onChange={event => { setQuery(event.target.value); setListLimit(40); }} /></label>
      <div className="cdc-launcher-scroll">
        {!query && <><p className="cdc-label">Folders</p><div className="cdc-folder-list">{folders.map(folder => <Button key={folder.id} variant="ghost" size="sm" onClick={() => visitFolder(folder.id)}><Icon name="Folder" />{folder.name}<small>{folderThreads(folder.id).length}</small></Button>)}</div></>}
        <p className="cdc-label">{query ? `${matched.length} results` : "All threads"}</p>
        {matched.slice(0, listLimit).map(thread => <div className="cdc-result" key={thread.id}>
          <button onClick={() => openThread(thread.id)}><Icon name="MessageSquare" /><span>{titleOf(thread)}<small>{data.projects.find(p => p.id === thread.projectId)?.name}</small></span></button>
          <select aria-label={`Canvas folder for ${titleOf(thread)}`} value={folderFor(thread, layout)} onChange={event => { const value = event.target.value; setLayout(current => ({ ...current, membership: { ...current.membership, [thread.id]: value } })); }}>
            <option value={`project:${thread.projectId}`}>Project folder</option>{layout.folders.map(folder => <option key={folder.id} value={folder.id}>{folder.name}</option>)}
          </select>
        </div>)}
        {!matched.length && <p className="cdc-empty">{query ? "No matching threads." : "Start a thread to begin."}</p>}
        {matched.length > listLimit && <Button variant="ghost" onClick={() => setListLimit(value => value + 40)}>Show more</Button>}
      </div>
      <footer>Folder changes stay on this canvas.</footer>
    </aside>}

    <div className="cdc-camera" data-screen aria-label="Canvas controls">
      <Action icon="MoveTo" label="Pan canvas" pressed={panMode} onClick={() => { setFocused(null); setPanMode(value => !value); }} />
      <Action icon="Minus" label="Zoom out" onClick={() => moveCamera(zoom - 0.1)} />
      <Button variant="ghost" size="sm" aria-label="Reset zoom to 100 percent" onClick={() => moveCamera(1)}>{Math.round(zoom * 100)}%</Button>
      <Action icon="Plus" label="Zoom in" onClick={() => moveCamera(zoom + 0.1)} />
      <Button variant="ghost" size="sm" onClick={fitAll}>Fit all</Button>
    </div>
    <div className="cdc-help" data-screen>Drag to arrange · Scroll to pan · Ctrl + scroll to zoom</div>
    <nav className="cdc-dock" data-screen aria-label="Workspace taskbar">
      <Button variant={launcher ? "secondary" : "ghost"} size="sm" aria-expanded={launcher} onClick={() => setLauncher(value => !value)}><Icon name="GridView" />Launcher</Button>
      <span className="cdc-divider" />
      <Button variant={layout.composer !== "hidden" ? "secondary" : "ghost"} size="sm" onClick={() => showPrompt(layout.composer === "hidden" ? "float" : layout.composer)}><Icon name="MessageSquarePlus" />{layout.composer === "hidden" ? "Restore prompt" : "New thread"}</Button>
      {layout.windows.length > 0 && <span className="cdc-divider" />}
      <div className="cdc-tasks">{layout.windows.map(win => <Button key={win.id} className="cdc-task" variant={active === win.id && !win.minimized ? "secondary" : "ghost"} size="sm" aria-label={`${win.minimized ? "Restore" : "Show"} ${threadMap.get(win.id) ? titleOf(threadMap.get(win.id)!) : "thread"}`} onClick={() => openThread(win.id)}><Icon name="MessageSquare" /><span>{threadMap.get(win.id) ? titleOf(threadMap.get(win.id)!) : "Thread"}</span>{win.minimized && <Icon name="Minus" />}</Button>)}</div>
      <Action icon="Search" label="Find threads" onClick={() => { setLauncher(true); setQuery(""); }} />
    </nav>
  </div>;
}

export default definePluginApp(app => {
  app.slots.navPanel({ id: "desktop", path: "desktop", title: "Canvas Desktop", icon: "AppWindow", component: Desktop });
});
