import { useEffect, useMemo, useRef, useState, type PointerEvent, type KeyboardEvent } from "react";
import {
  definePluginApp, experimental_Icon as Icon,
  experimental_NewThreadComposer as NewThreadComposer,
  experimental_useSidebarThreads as useSidebarThreads,
  ThreadChat, useBbNavigate, useSdk,
} from "@get-bb/plugin-sdk/app";
import { Button } from "./components/ui/button";
import { FolderWindow, THREAD_DRAG, threadTitle as titleOf } from "./folder-window";
import { dockWindow, fitCamera, folderFor, readLayout, zoomAt, type Camera, type DockSide, type Layout, type Point } from "./state";
import "./app.css";

const WINDOW_WIDTH = 680;
const WINDOW_HEIGHT = 530;
const FOLDER_WIDTH = 88;
const FOLDER_HEIGHT = 88;
const ALL_THREADS = "all-threads";

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
  const promptRef = useRef<HTMLDivElement>(null);
  const composerButton = useRef<HTMLButtonElement>(null);
  const [layout, setLayout] = useState<Layout>(() => {
    try { return readLayout(localStorage.getItem(storageKey)); } catch { return readLayout(null); }
  });
  const [storageError, setStorageError] = useState(false);
  const [active, setActive] = useState<string | null>(null);
  const [focused, setFocused] = useState<string | null>(null);
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null);
  const [launcher, setLauncher] = useState(false);
  const [windowMenu, setWindowMenu] = useState<string | null>(null);
  const [dockPreview, setDockPreview] = useState<DockSide | null>(null);
  const dockTarget = useRef<DockSide | null>(null);
  const [folderEditor, setFolderEditor] = useState<{ id?: string } | null>(null);
  const [folderName, setFolderName] = useState("");
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; folderId?: string } | null>(null);
  const [focusPrompt, setFocusPrompt] = useState(0);
  const [notice, setNotice] = useState("");
  const [size, setSize] = useState({ width: 1200, height: 800 });
  const drag = useRef<{ pointer: number; start: Point; origin: Point; kind: "camera" | "folder" | "window" | "prompt"; id: string; zoom: number; moved: boolean } | null>(null);
  const pinch = useRef<{ distance: number; anchor: Point; camera: Camera } | null>(null);
  const cameraRef = useRef(layout.camera);
  cameraRef.current = layout.camera;
  const threads = useMemo(() => data.threads.filter(t => !t.isHidden && !t.isArchived), [data.threads]);
  const threadMap = useMemo(() => new Map(threads.map(t => [t.id, t])), [threads]);
  const projectNames = useMemo(() => new Map(data.projects.map(p => [p.id, p.name])), [data.projects]);
  const folders = useMemo(() => [
    ...data.projects.map(p => ({ id: `project:${p.id}`, name: p.name, custom: false })),
    ...layout.folders.map(f => ({ ...f, custom: true })),
  ], [data.projects, layout.folders]);
  const folderPosition = (id: string, index: number) => layout.positions[id] ?? { x: 48 + (index % 5) * 112, y: 80 + Math.floor(index / 5) * 112 };
  const folderThreads = (id: string) => id === ALL_THREADS ? threads : threads.filter(t => folderFor(t, layout) === id);
  const windowTitle = (win: Layout["windows"][number]) => win.kind === "folder" ? (win.id === ALL_THREADS ? "Threads" : folders.find(f => f.id === win.id)?.name ?? "Folder") : threadMap.get(win.id) ? titleOf(threadMap.get(win.id)!) : "Thread";
  const camera = layout.camera;
  const zoom = camera.zoom;
  const visibleWindows = layout.windows.filter(w => !w.minimized);
  const dockWidth = Math.min(400, size.width * 0.4);
  const leftDockWidth = !focused && visibleWindows.some(win => win.dock === "left") ? dockWidth : 0;
  const rightDockWidth = !focused && visibleWindows.some(win => win.dock === "right") ? dockWidth : 0;

  const cameraSpace = size.width - leftDockWidth - rightDockWidth;

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
    // Trackpad pinches arrive as ctrl+wheel. Capture before nested editors and
    // scroll containers, so zoom stays on the canvas even over window content.
    const wheel = (event: WheelEvent) => {
      if (!(event.target instanceof Element)) return;
      if (event.ctrlKey || event.metaKey) {
        event.preventDefault(); event.stopPropagation();
        setFocused(null);
        const bounds = element.getBoundingClientRect();
        const delta = event.deltaY * (event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? bounds.height : 1);
        setLayout(current => ({ ...current, camera: zoomAt(current.camera, current.camera.zoom * Math.exp(-delta * 0.008), { x: event.clientX - bounds.left, y: event.clientY - bounds.top }) }));
      } else if (!focused && !event.target.closest('[data-screen], [data-window-content]')) {
        event.preventDefault();
        setLayout(current => ({ ...current, camera: { ...current.camera, x: current.camera.x - event.deltaX, y: current.camera.y - event.deltaY } }));
      }
    };
    const touchPair = (event: TouchEvent) => {
      const bounds = element.getBoundingClientRect();
      const [a, b] = [event.touches[0], event.touches[1]];
      return { distance: Math.max(1, Math.hypot(b.clientX - a.clientX, b.clientY - a.clientY)), anchor: { x: (a.clientX + b.clientX) / 2 - bounds.left, y: (a.clientY + b.clientY) / 2 - bounds.top } };
    };
    const touchStart = (event: TouchEvent) => {
      if (event.touches.length !== 2) return;
      event.preventDefault(); event.stopPropagation();
      drag.current = null; dockTarget.current = null; setDockPreview(null);
      pinch.current = { ...touchPair(event), camera: cameraRef.current };
      setFocused(null);
    };
    const touchMove = (event: TouchEvent) => {
      const start = pinch.current;
      if (!start || event.touches.length !== 2) return;
      event.preventDefault(); event.stopPropagation();
      const next = touchPair(event);
      const scaled = zoomAt(start.camera, start.camera.zoom * next.distance / start.distance, start.anchor);
      setLayout(current => ({ ...current, camera: { ...scaled, x: scaled.x + next.anchor.x - start.anchor.x, y: scaled.y + next.anchor.y - start.anchor.y } }));
    };
    const touchEnd = () => { pinch.current = null; drag.current = null; };
    element.addEventListener("wheel", wheel, { passive: false, capture: true });
    element.addEventListener("touchstart", touchStart, { passive: false, capture: true });
    element.addEventListener("touchmove", touchMove, { passive: false, capture: true });
    element.addEventListener("touchend", touchEnd, true);
    element.addEventListener("touchcancel", touchEnd, true);
    return () => {
      element.removeEventListener("wheel", wheel, true);
      element.removeEventListener("touchstart", touchStart, true);
      element.removeEventListener("touchmove", touchMove, true);
      element.removeEventListener("touchend", touchEnd, true);
      element.removeEventListener("touchcancel", touchEnd, true);
    };
  }, [focused]);
  useEffect(() => {
    if (!launcher && !contextMenu && !windowMenu) return;
    const close = (event: globalThis.PointerEvent) => {
      if (!(event.target instanceof Element) || event.target.closest("[data-menu], [data-menu-toggle]")) return;
      setLauncher(false); setContextMenu(null); setWindowMenu(null);
    };
    window.addEventListener("pointerdown", close, true);
    return () => window.removeEventListener("pointerdown", close, true);
  }, [launcher, contextMenu, windowMenu]);

  function moveCamera(nextZoom: number) {
    setFocused(null);
    setLayout(current => ({ ...current, camera: zoomAt(current.camera, nextZoom, { x: size.width / 2, y: (size.height - 72) / 2 }) }));
  }
  function fitAll() {
    setFocused(null);
    const bounds = folders.map((f, i) => ({ ...folderPosition(f.id, i), width: FOLDER_WIDTH, height: FOLDER_HEIGHT }));
    bounds.push(...visibleWindows.filter(w => !w.dock).map(w => ({ x: w.x, y: w.y, width: WINDOW_WIDTH, height: WINDOW_HEIGHT })));
    setLayout(current => ({ ...current, camera: fitCamera(bounds, size.width, size.height) }));
  }
  function showPrompt(open = true) {
    setFocused(null);
    setLayout(current => ({ ...current, composer: open ? "float" : "hidden", promptPosition: open ? null : current.promptPosition }));
    if (open) setFocusPrompt(value => value + 1);
    else composerButton.current?.focus();
    setLauncher(false);
  }
  function openWindow(id: string, kind: "thread" | "folder") {
    setActive(id); setFocused(null); setLauncher(false); setContextMenu(null);
    setLayout(current => {
      const existing = current.windows.find(w => w.id === id);
      const offset = (current.windows.length % 5) * 28;
      const point = existing ?? { x: (size.width / 2 - current.camera.x) / current.camera.zoom - WINDOW_WIDTH / 2 + offset, y: (size.height / 2 - current.camera.y) / current.camera.zoom - WINDOW_HEIGHT / 2 + offset };
      const windows = [...current.windows.filter(w => w.id !== id), { ...existing, id, kind, x: point.x, y: point.y, minimized: false }].slice(-50);
      return { ...current, windows, composer: "hidden", camera: existing?.dock ? current.camera : { zoom: 1, x: (size.width - WINDOW_WIDTH) / 2 - point.x + offset, y: Math.max(56, (size.height - WINDOW_HEIGHT - 72) / 2) - point.y + offset } };
    });
  }
  const openThread = (id: string) => openWindow(id, "thread");
  function dockWindowTo(id: string, side: DockSide | undefined) {
    setFocused(null); setActive(id); setWindowMenu(null);
    setLayout(current => {
      const next = dockWindow(current, id, side);
      if (side) return next;
      // Undock into the current view, even after the canvas has been panned.
      return { ...next, windows: next.windows.map(win => win.id === id ? { ...win,
        x: (size.width / 2 - current.camera.x) / current.camera.zoom - WINDOW_WIDTH / 2,
        y: (Math.max(56, (size.height - WINDOW_HEIGHT * current.camera.zoom - 88) / 2) - current.camera.y) / current.camera.zoom,
      } : win) };
    });
  }
  function focusWindow(id: string) { setActive(id); setFocused(id); setLayout(current => ({ ...current, composer: "hidden" })); }
  function closeWindow(id: string) {
    setLayout(current => ({ ...current, windows: current.windows.filter(w => w.id !== id) }));
    if (focused === id) setFocused(null);
    if (active === id) setActive(null);
  }
  function minimizeWindow(id: string) {
    setLayout(current => ({ ...current, windows: current.windows.map(w => w.id === id ? { ...w, minimized: true } : w) }));
    if (focused === id) setFocused(null);
  }
  function startDrag(event: PointerEvent, kind: "camera" | "folder" | "window" | "prompt", id: string, origin: Point) {
    if (event.button !== 0 || focused || pinch.current) return;
    if (kind !== "camera" && event.target instanceof Element && event.target.closest('[data-no-drag]')) return;
    event.preventDefault(); event.stopPropagation(); event.currentTarget.setPointerCapture(event.pointerId);
    if (kind === "window" && layout.windows.find(win => win.id === id)?.dock) {
      const bounds = event.currentTarget.getBoundingClientRect();
      const viewport = root.current!.getBoundingClientRect();
      origin = { x: (bounds.left - viewport.left - camera.x) / zoom, y: (bounds.top - viewport.top - camera.y) / zoom };
    }
    drag.current = { pointer: event.pointerId, start: { x: event.clientX, y: event.clientY }, origin, kind, id, zoom, moved: false };
    dockTarget.current = null; setDockPreview(null);
    if (kind === "window") setActive(id);
    if (kind === "folder") setSelectedFolder(id);
    if (kind === "folder" || kind === "prompt") (event.currentTarget as HTMLElement).focus();
  }
  function dragMove(event: PointerEvent) {
    const current = drag.current;
    if (!current || current.pointer !== event.pointerId || pinch.current) return;
    if (current.kind === "window") {
      if (!current.moved && Math.hypot(event.clientX - current.start.x, event.clientY - current.start.y) < 4) return;
      current.moved = true;
      const bounds = root.current!.getBoundingClientRect();
      const x = event.clientX - bounds.left;
      const y = event.clientY - bounds.top;
      dockTarget.current = y >= 0 && y <= bounds.height && x >= -16 && x <= bounds.width + 16
        ? x < 32 ? "left" : x > bounds.width - 32 ? "right" : null : null;
      setDockPreview(dockTarget.current);
    }
    const scale = (current.kind === "camera" || current.kind === "prompt") ? 1 : current.zoom;
    const point = { x: Math.max(-100_000, Math.min(100_000, current.origin.x + (event.clientX - current.start.x) / scale)), y: Math.max(-100_000, Math.min(100_000, current.origin.y + (event.clientY - current.start.y) / scale)) };
    setLayout(state => current.kind === "camera" ? { ...state, camera: { ...state.camera, ...point } }
      : current.kind === "prompt" ? { ...state, promptPosition: clampPrompt(point) }
      : current.kind === "folder" ? { ...state, positions: { ...state.positions, [current.id]: point } }
      : { ...state, windows: state.windows.map(w => w.id === current.id ? { ...w, ...point, dock: undefined } : w) });
  }
  function endDrag(cancel = false) {
    const current = drag.current;
    if (!cancel && current?.kind === "window" && current.moved && dockTarget.current) dockWindowTo(current.id, dockTarget.current);
    drag.current = null; dockTarget.current = null; setDockPreview(null);
  }
  function clampPrompt(point: Point): Point {
    const width = promptRef.current?.offsetWidth ?? Math.min(720, size.width - 64);
    const height = promptRef.current?.offsetHeight ?? 220;
    return { x: Math.max(16, Math.min(size.width - width - 16, point.x)), y: Math.max(16, Math.min(size.height - height - 88, point.y)) };
  }
  function promptPoint(): Point {
    const prompt = promptRef.current?.getBoundingClientRect();
    const bounds = root.current?.getBoundingClientRect();
    return prompt && bounds ? { x: prompt.left - bounds.left, y: prompt.top - bounds.top } : { x: 16, y: 16 };
  }
  function nudge(event: KeyboardEvent, kind: "folder" | "window" | "prompt", id: string, point: Point) {
    const delta = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] }[event.key];
    if (!delta || focused) return;
    event.preventDefault(); event.stopPropagation();
    const step = event.shiftKey ? 100 : 24;
    const next = { x: Math.max(-100_000, Math.min(100_000, point.x + delta[0] * step)), y: Math.max(-100_000, Math.min(100_000, point.y + delta[1] * step)) };
    setLayout(current => kind === "prompt" ? { ...current, promptPosition: clampPrompt(next) } : kind === "folder" ? { ...current, positions: { ...current.positions, [id]: next } }
      : { ...current, windows: current.windows.map(w => w.id === id ? { ...w, ...next, dock: undefined } : w) });
  }
  function moveThread(threadId: string, folderId: string) {
    const thread = threadMap.get(threadId);
    if (!thread || (!layout.folders.some(f => f.id === folderId) && folderId !== `project:${thread.projectId}`)) return;
    setLayout(current => ({ ...current, membership: { ...current.membership, [threadId]: folderId } }));
  }
  function editFolder(id?: string) {
    setFolderName(id ? folders.find(f => f.id === id)?.name ?? "" : "");
    setFolderEditor(id ? { id } : {}); setLauncher(false); setContextMenu(null);
  }
  const floatPoint = layout.promptPosition ? clampPrompt(layout.promptPosition) : null;

  return <div className="cdc-desktop" ref={root} onPointerMove={dragMove} onPointerUp={() => endDrag()} onPointerCancel={() => endDrag(true)}
    onKeyDown={event => { if (event.key === "Escape") { setLauncher(false); setContextMenu(null); setFolderEditor(null); setFocused(null); setWindowMenu(null); endDrag(true); } }}>
    <div className="cdc-canvas" tabIndex={0} aria-label="Canvas. Arrow keys pan, plus and minus zoom, zero resets zoom."
      onPointerDown={event => { if (event.target === event.currentTarget) { setSelectedFolder(null); startDrag(event, "camera", "", camera); } }}
      onContextMenu={event => { if (event.target !== event.currentTarget) return; event.preventDefault(); const rect = root.current!.getBoundingClientRect(); setContextMenu({ x: event.clientX - rect.left, y: event.clientY - rect.top }); }}
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
          const point = folderPosition(folder.id, index);
          return <button key={folder.id} className="cdc-folder-icon" aria-label={`${folder.name} folder`} aria-pressed={selectedFolder === folder.id} title={folder.name}
            style={{ left: point.x, top: point.y, display: focused ? "none" : undefined }}
            onPointerDown={event => startDrag(event, "folder", folder.id, point)} onClick={() => setSelectedFolder(folder.id)} onDoubleClick={() => openWindow(folder.id, "folder")}
            onKeyDown={event => { if (event.key === "Enter") { event.preventDefault(); openWindow(folder.id, "folder"); } else nudge(event, "folder", folder.id, point); }}
            onContextMenu={event => { event.preventDefault(); setSelectedFolder(folder.id); const rect = root.current!.getBoundingClientRect(); setContextMenu({ x: event.clientX - rect.left, y: event.clientY - rect.top, folderId: folder.id }); }}
            onDragOver={event => { if (event.dataTransfer.types.includes(THREAD_DRAG)) { event.preventDefault(); event.dataTransfer.dropEffect = "move"; } }}
            onDrop={event => { event.preventDefault(); moveThread(event.dataTransfer.getData(THREAD_DRAG), folder.id); }}>
            <Icon name="Folder" /><span>{folder.name}</span>
          </button>;
        })}
      </div>
    </div>
    <div className="cdc-windows">
        {layout.windows.map((win, index) => {
          const isFolder = win.kind === "folder";
          const thread = threadMap.get(win.id);
          const title = windowTitle(win);
          const focus = focused === win.id;
          const docked = !!win.dock && !focus;
          const live = !win.minimized && (!!win.dock || ((focus || Math.abs(zoom - 1) < 0.001) && active === win.id));
          return <section key={win.id} className={`cdc-window ${focus ? "cdc-focused" : ""} ${docked ? "cdc-docked" : ""} ${active === win.id ? "cdc-active" : ""}`} aria-label={`${title} window`}
            data-dock={docked ? win.dock : undefined} data-screen={docked || focus ? true : undefined}
            onPointerDownCapture={() => setActive(win.id)}
            style={{ left: focus ? 24 : docked ? (win.dock === "left" ? 0 : size.width - dockWidth) : camera.x + win.x * zoom,
              top: focus ? 56 : docked ? 0 : camera.y + win.y * zoom,
              width: docked ? dockWidth : undefined, height: docked ? Math.max(220, size.height - 88) : undefined,
              transform: !focus && !docked ? `scale(${zoom})` : undefined,
              zIndex: docked ? 65 : active === win.id ? 60 : index + 1, display: win.minimized || (focused && !focus) ? "none" : undefined }}>
            <header onPointerDown={event => startDrag(event, "window", win.id, win)}>
              <button className="cdc-title" aria-label={`Move ${title} window with arrow keys`} onKeyDown={event => {
                if (win.dock && ["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"].includes(event.key)) { event.preventDefault(); event.stopPropagation(); dockWindowTo(win.id, undefined); }
                else nudge(event, "window", win.id, win);
              }}><Icon name={isFolder ? "Folder" : "MessageSquare"} /><span>{title}</span></button>
              <div className="cdc-window-actions" data-no-drag>
                <Button data-menu-toggle variant="ghost" size="icon" aria-label={`Position ${title} window`} aria-expanded={windowMenu === win.id} onClick={() => setWindowMenu(current => current === win.id ? null : win.id)}><Icon name="PanelRight" /></Button>
                <Action icon={focus ? "Minimize2" : "Maximize2"} label={focus ? "Return to canvas" : `Focus ${title}`} onClick={() => focus ? setFocused(null) : focusWindow(win.id)} />
                {!isFolder && <Action icon="ArrowUpRight" label={`Open ${title} in bb`} onClick={() => navigate.toThread(win.id)} />}
                <Action icon="Minus" label={`Minimize ${title}`} onClick={() => minimizeWindow(win.id)} />
                <Action icon="X" label={`Close ${title}`} onClick={() => closeWindow(win.id)} />
              </div>
            </header>
            {windowMenu === win.id && <div className="cdc-menu cdc-window-menu" data-menu data-screen aria-label={`Position ${title}`}>
              <Button variant="ghost" aria-label={`Dock ${title} left`} onClick={() => dockWindowTo(win.id, "left")}>Dock left</Button>
              <Button variant="ghost" aria-label={`Dock ${title} right`} onClick={() => dockWindowTo(win.id, "right")}>Dock right</Button>
              {win.dock && <Button variant="ghost" onClick={() => dockWindowTo(win.id, undefined)}>Undock</Button>}
            </div>}
            <div data-window-content className="cdc-window-body" onDragOver={event => { if (isFolder && event.dataTransfer.types.includes(THREAD_DRAG)) event.preventDefault(); }} onDrop={event => { if (isFolder) { event.preventDefault(); moveThread(event.dataTransfer.getData(THREAD_DRAG), win.id); } }}>
              {isFolder ? <FolderWindow name={title} threads={folderThreads(win.id)} folders={folders} projectNames={projectNames} openThread={openThread} moveThread={moveThread} />
                : live ? <ThreadChat threadId={win.id} layout="contained" variant="full" permissionPolicy="inherit" /> : <div className="cdc-overview">
                  <Icon name="MessageSquare" /><h2>{title}</h2><p>{projectNames.get(thread?.projectId ?? "") ?? "Conversation"}</p>
                  <div><Button size="sm" variant="secondary" onClick={() => openThread(win.id)}>Read at 100%</Button><Button size="sm" variant="ghost" onClick={() => focusWindow(win.id)}>Focus</Button></div>
                </div>}
            </div>
          </section>;
        })}
    </div>
    {dockPreview && <div className="cdc-dock-preview" data-side={dockPreview} style={{ width: dockWidth }}><span>Dock {dockPreview}</span></div>}

    <div ref={promptRef} className={`cdc-prompt ${layout.composer === "hidden" ? "cdc-prompt-hidden" : ""}`} data-screen
      style={floatPoint ? { left: floatPoint.x, top: floatPoint.y, bottom: "auto", transform: "none" } : undefined}
      aria-hidden={layout.composer === "hidden"} inert={layout.composer === "hidden"}>
      <header className="cdc-prompt-header">
        <button type="button" className="cdc-prompt-move" aria-label="Move composer. Drag or use arrow keys."
          onPointerDown={event => startDrag(event, "prompt", "main", promptPoint())}
          onKeyDown={event => nudge(event, "prompt", "main", promptPoint())}>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
            <circle cx="5" cy="3" r="1.25" /><circle cx="11" cy="3" r="1.25" />
            <circle cx="5" cy="8" r="1.25" /><circle cx="11" cy="8" r="1.25" />
            <circle cx="5" cy="13" r="1.25" /><circle cx="11" cy="13" r="1.25" />
          </svg>
        </button>
        <Button type="button" className="cdc-prompt-minimize" variant="ghost" size="icon" aria-label="Minimize composer" onClick={() => showPrompt(false)}><Icon name="X" /></Button>
      </header>
      <NewThreadComposer key="main-composer" draftKey={`${pluginId}:main`} layout="document" focusRequest={focusPrompt} placeholder="Ask anything, or start something new…"
        onSubmit={async request => {
          const created = await sdk.threads.spawn(request);
          try { openThread(created.id); }
          catch { setNotice(`Thread created. Open it from Threads (${created.id}).`); }
        }} />
    </div>

    {(notice || storageError || data.status === "error") && <div className="cdc-notice" role="status" data-screen>{notice || (storageError ? "Layout could not be saved on this device." : "Threads could not load. Reload to try again.")}<Action icon="X" label="Dismiss notice" onClick={() => setNotice("")} /></div>}
    {data.status === "loading" && <div className="cdc-loading" role="status">Loading your workspace…</div>}

    {launcher && <div className="cdc-menu cdc-launcher" data-screen data-menu aria-label="Launcher">
      <Button autoFocus variant="ghost" onClick={() => showPrompt()}><Icon name="MessageSquarePlus" />Composer</Button>
      <Button variant="ghost" onClick={() => openWindow(ALL_THREADS, "folder")}><Icon name="Folder" />Threads</Button>
      <Button variant="ghost" onClick={() => editFolder()}><Icon name="FolderPlus" />New folder</Button>
    </div>}
    {contextMenu && <div className="cdc-menu cdc-context-menu" data-screen data-menu style={{ left: Math.max(8, Math.min(contextMenu.x, size.width - 200)), top: Math.max(8, Math.min(contextMenu.y, size.height - 160)) }}>
      {contextMenu.folderId && <Button autoFocus variant="ghost" onClick={() => openWindow(contextMenu.folderId!, "folder")}>Open</Button>}
      {folders.find(f => f.id === contextMenu.folderId)?.custom && <Button variant="ghost" onClick={() => editFolder(contextMenu.folderId)}>Rename</Button>}
      <Button variant="ghost" onClick={() => editFolder()}>New folder</Button>
      {!contextMenu.folderId && <Button variant="ghost" onClick={() => { fitAll(); setContextMenu(null); }}>Fit all</Button>}
    </div>}
    {folderEditor && <form className="cdc-folder-editor" data-screen role="dialog" aria-label={folderEditor.id ? "Rename folder" : "New folder"} onSubmit={event => {
      event.preventDefault(); const name = folderName.trim(); if (!name || (!folderEditor.id && layout.folders.length >= 100)) return;
      const id = folderEditor.id ?? `folder:${crypto.randomUUID()}`;
      setLayout(current => folderEditor.id ? { ...current, folders: current.folders.map(f => f.id === id ? { ...f, name } : f) }
        : { ...current, folders: [...current.folders, { id, name }], positions: { ...current.positions, [id]: { x: (size.width / 2 - current.camera.x) / current.camera.zoom - FOLDER_WIDTH / 2, y: (size.height / 2 - current.camera.y) / current.camera.zoom - FOLDER_HEIGHT / 2 } } });
      setSelectedFolder(id); setFolderEditor(null); setFolderName("");
    }}><label>{folderEditor.id ? "Rename folder" : "New folder"}<input autoFocus aria-label="Folder name" maxLength={80} placeholder="Folder name" value={folderName} onChange={e => setFolderName(e.target.value)} /></label><div><Button type="button" variant="ghost" size="sm" onClick={() => setFolderEditor(null)}>Cancel</Button><Button size="sm" type="submit">{folderEditor.id ? "Save" : "Create"}</Button></div></form>}

    <div className={`cdc-camera ${cameraSpace < 230 ? "cdc-camera-compact" : ""}`} data-screen aria-label="Canvas controls" style={{ right: rightDockWidth + (cameraSpace < 230 ? 8 : 20), width: cameraSpace < 230 ? Math.max(72, cameraSpace - 16) : undefined }}>
      <Action icon="Minus" label="Zoom out" onClick={() => moveCamera(zoom - 0.1)} />
      <Button variant="ghost" size="sm" aria-label="Reset zoom to 100 percent" onClick={() => moveCamera(1)}>{Math.round(zoom * 100)}%</Button>
      <Action icon="Plus" label="Zoom in" onClick={() => moveCamera(zoom + 0.1)} />
      <Button variant="ghost" size="sm" onClick={fitAll}>Fit all</Button>
    </div>
    <nav className="cdc-dock" data-screen aria-label="Workspace taskbar">
      <Button data-menu-toggle variant={launcher ? "secondary" : "ghost"} size="sm" aria-expanded={launcher} onClick={() => setLauncher(value => !value)}><Icon name="GridView" />Launcher</Button>
      <Button ref={composerButton} variant={layout.composer !== "hidden" ? "secondary" : "ghost"} size="sm" aria-expanded={layout.composer !== "hidden"} onClick={() => showPrompt()}><Icon name="MessageSquarePlus" />Composer</Button>
      <div className="cdc-tasks">{layout.windows.map(win => <Button key={win.id} className="cdc-task" variant={active === win.id && !win.minimized ? "secondary" : "ghost"} size="sm" aria-label={`${win.minimized ? "Restore" : "Show"} ${windowTitle(win)}`} onClick={() => openWindow(win.id, win.kind ?? "thread")}><Icon name={win.kind === "folder" ? "Folder" : "MessageSquare"} /><span>{windowTitle(win)}</span>{win.minimized && <Icon name="Minus" />}</Button>)}</div>
    </nav>
  </div>;
}

export default definePluginApp(app => {
  app.slots.navPanel({ id: "desktop", path: "desktop", title: "Canvas Desktop", icon: "AppWindow", component: Desktop });
});
