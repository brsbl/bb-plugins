import { useEffect, useRef, useState, type KeyboardEvent as ReactKeyboardEvent, type PointerEvent as ReactPointerEvent } from "react";
import {
  definePluginApp,
  experimental_Icon as Icon,
  experimental_NewThreadComposer as NewThreadComposer,
  type NewThreadRequest,
} from "@get-bb/plugin-sdk/app";
import { viewMenuEntries } from "./actions";
import { toast } from "sonner";
import { nativeBrowser, windowWebLink } from "./browser";
import { openThreadLink } from "./browser-window";
import { CanvasProvider, DOCK_RESERVE, useViewport, useWorkArea } from "./camera";
import { DesktopCanvas } from "./canvas";
import { DesktopDataProvider, useDesktop } from "./data";
import { AskTextProvider, MenuProvider, PLUGIN_SCOPE, useMenu, type MenuEntry } from "./menu";
import { NeedsInputNotice } from "./needs-input";
import { ProgramWindow, windowIcon, windowTitle } from "./programs";
import { isAttached } from "./window-state";
import { dockWidth, usePointerTracker, useWindowManager, WindowManagerProvider, type DesktopWindow } from "./windows";
import "./app.css";

const PLUGIN_ID = "desktop-canvas-prototype";
const COMPOSER_KEY = `${PLUGIN_ID}:composer:v2`;

interface ComposerState {
  open: boolean;
  /** Where it was dragged to; null opens it just above the dock. */
  position: { x: number; y: number } | null;
}

/** Reads the composer's state, including the first prototype's placement modes. */
function readComposer(): ComposerState {
  try {
    const parsed: unknown = JSON.parse(
      localStorage.getItem(COMPOSER_KEY) ?? localStorage.getItem(`${PLUGIN_ID}:composer:v1`) ?? localStorage.getItem(`${PLUGIN_ID}:layout:v1`) ?? "null",
    );
    const record = typeof parsed === "object" && parsed !== null ? (parsed as Record<string, unknown>) : {};
    const legacyMode = record.mode ?? record.composer;
    const position = (record.position ?? record.promptPosition) as Record<string, unknown> | null | undefined;
    return {
      open: typeof record.open === "boolean" ? record.open : legacyMode !== "hidden",
      position: typeof position?.x === "number" && typeof position?.y === "number" ? { x: position.x, y: position.y } : null,
    };
  } catch {
    return { open: true, position: null };
  }
}

const THREAD_ROUTE = /^(?:\/projects\/[^/]+)?\/threads\/([^/?#]+)\/?$/;

/** A thread link or mention clicked inside a canvas window, which opens that thread's window instead of navigating. */
function linkedThreadId(target: EventTarget | null): string | null {
  if (!(target instanceof Element) || target.closest(".cdc-window") === null || target.closest('[contenteditable="true"]') !== null) return null;
  const mention = target.closest("[data-prompt-mention-resource]");
  if (mention !== null) {
    try {
      const resource: unknown = JSON.parse(mention.getAttribute("data-prompt-mention-resource") ?? "null");
      const record = typeof resource === "object" && resource !== null ? (resource as Record<string, unknown>) : null;
      if (record?.kind === "thread" && typeof record.threadId === "string") return record.threadId;
    } catch {
      return null;
    }
  }
  const anchor = target.closest("a[href]");
  if (!(anchor instanceof HTMLAnchorElement) || anchor.target === "_blank" || anchor.origin !== window.location.origin) return null;
  const match = THREAD_ROUTE.exec(anchor.pathname);
  return match === null ? null : decodeURIComponent(match[1]!);
}

/**
 * Windows, and the links inside them: a thread link opens that thread's window, and a web link in a thread's window
 * opens in that thread's browser window on the canvas (bb desktop app). Clicks are caught natively in the capture phase,
 * before bb's own chat link handling, so the page never leaves for the system browser.
 */
function WindowLayer() {
  const manager = useWindowManager();
  const desktop = useDesktop();
  const viewport = useViewport();
  const menu = useMenu();
  const layerRef = useRef<HTMLDivElement>(null);
  const latest = useRef({ manager, desktop });
  latest.current = { manager, desktop };
  const explained = useRef(false);

  useEffect(() => {
    const layer = layerRef.current;
    if (layer === null) return;
    const onClick = (event: MouseEvent) => {
      if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      const threadId = linkedThreadId(event.target);
      if (threadId !== null) {
        event.preventDefault();
        event.stopPropagation();
        latest.current.desktop.openThread(threadId);
        return;
      }
      const webLink = windowWebLink(event.target);
      if (webLink === null) return;
      if (nativeBrowser() === null) {
        // On the web there is no bb browser to draw a page into; the link opens as usual, once explained.
        if (!explained.current) {
          explained.current = true;
          toast("Links open in a canvas browser window in the bb desktop app. Here they open in a new tab.");
        }
        return;
      }
      event.preventDefault();
      event.stopPropagation();
      openThreadLink(latest.current.manager, webLink.threadId, webLink.url);
    };
    layer.addEventListener("click", onClick, true);
    return () => layer.removeEventListener("click", onClick, true);
  }, []);

  return (
    <div
      ref={layerRef}
      className="cdc-window-layer"
      onContextMenuCapture={(event) => {
        // A link in a window gets the canvas's own menu; Open does exactly what a click does.
        const anchor = event.target instanceof Element ? event.target.closest<HTMLAnchorElement>(".cdc-window a[href]") : null;
        if (anchor === null || anchor.closest('[contenteditable="true"]') !== null) return;
        const webLink = linkedThreadId(anchor) === null ? windowWebLink(anchor) : null;
        menu.open(event, [
          { label: "Open link", icon: "ArrowUpRight", run: () => anchor.click() },
          ...(webLink !== null ? [{ label: "Open in your browser", icon: "ExternalLink", run: () => void window.open(webLink.url, "_blank", "noopener,noreferrer") }] : []),
          "separator",
          { label: "Copy link", icon: "Copy", run: () => void navigator.clipboard.writeText(anchor.href) },
        ]);
      }}
    >
      {manager.windows.map((window) => <ProgramWindow key={window.id} window={window} />)}
      {manager.dockPreview === null ? null : (
        <div className="cdc-dock-preview" data-side={manager.dockPreview} style={{ width: dockWidth(viewport.width), height: viewport.height - DOCK_RESERVE }}>
          <span>Dock {manager.dockPreview}</span>
        </div>
      )}
    </div>
  );
}

/** Taskbar buttons that don't fit collapse into one overflow button, keeping the focused window's button visible. */
function TaskButtons({ width }: { width: number }) {
  const manager = useWindowManager();
  const desktop = useDesktop();
  const menu = useMenu();
  // A thread's docked Info and Related threads belong to its button; they minimize and restore with it.
  const tasks = manager.windows.filter((window) => !manager.windows.some((thread) => isAttached(window, thread)));
  const capacity = Math.max(1, Math.floor((width - 300) / 156));
  const shown = tasks.slice(0, capacity);
  const focused = tasks.find((window) => window.id === manager.focusedId) ?? tasks.find((window) => manager.windows.some((other) => other.id === manager.focusedId && isAttached(other, window)));
  if (focused !== undefined && !shown.includes(focused)) shown[shown.length - 1] = focused;
  const hidden = tasks.filter((window) => !shown.includes(window));
  const activate = (window: DesktopWindow) => {
    if (focused?.id === window.id && !window.minimized) manager.minimize(window.id, true);
    else manager.focus(window.id, { reveal: true });
  };
  const taskMenu = (window: DesktopWindow): MenuEntry[] => [
    window.minimized ? { label: "Restore", icon: "AppWindow", run: () => manager.focus(window.id, { reveal: true }) } : { label: "Minimize", icon: "Minus", run: () => manager.minimize(window.id, true) },
    { label: window.maximized ? "Restore size" : "Maximize", icon: window.maximized ? "Minimize2" : "Maximize2", run: () => manager.toggleMaximize(window.id) },
    { label: "Dock left", icon: "PanelLeft", checked: window.dock === "left", run: () => manager.dock(window.id, "left") },
    { label: "Dock right", icon: "PanelRight", checked: window.dock === "right", run: () => manager.dock(window.id, "right") },
    ...(window.dock === undefined ? [] : [{ label: "Undock", icon: "AppWindow", run: () => manager.dock(window.id, null) }]),
    "separator",
    { label: "Close", icon: "X", run: () => manager.close(window.id) },
  ];
  if (tasks.length === 0) return null;
  return (
    <div className="cdc-tasks">
      {shown.map((window) => {
        const title = windowTitle(window.spec, desktop);
        const icon = windowIcon(window.spec, desktop);
        return (
          <button key={window.id} type="button" className="cdc-task" title={title} aria-label={`${title}${window.minimized ? " (minimized)" : ""}`}
            data-focused={focused?.id === window.id && !window.minimized} data-minimized={window.minimized || undefined}
            onClick={() => activate(window)} onContextMenu={(event) => menu.open(event, taskMenu(window))}>
            {icon.name === undefined ? null : <Icon name={icon.name} className={icon.className} />}
            <span>{title}</span>
          </button>
        );
      })}
      {hidden.length > 0 ? (
        <button type="button" className="cdc-task cdc-task-more" aria-haspopup="menu" aria-label={`${hidden.length} more ${hidden.length === 1 ? "window" : "windows"}`}
          onClick={(event) => menu.openFrom(event.currentTarget, hidden.map((window): MenuEntry => ({ label: windowTitle(window.spec, desktop), icon: windowIcon(window.spec, desktop).name, run: () => manager.focus(window.id, { reveal: true }) })), "above")}>
          +{hidden.length}
        </button>
      ) : null}
    </div>
  );
}

function Dock({ composerOpen, toggleComposer, arrangeLikeSidebar }: { composerOpen: boolean; toggleComposer: () => void; arrangeLikeSidebar: () => void }) {
  const manager = useWindowManager();
  const menu = useMenu();
  const viewport = useViewport();
  return (
    <nav className="cdc-dock cdc-glass" data-screen aria-label="Dock">
      <button type="button" className="cdc-dock-button" aria-haspopup="menu"
        onClick={(event) => menu.openFrom(event.currentTarget, (latest) => [
          { label: "Composer", icon: "MessageSquarePlus", run: () => { if (!composerOpen) toggleComposer(); } },
          { label: "My Threads", icon: "ListView", run: () => manager.open({ kind: "threads" }) },
          { label: "New folder", icon: "FolderPlus", run: () => manager.open({ kind: "new-folder", at: null }) },
          "separator",
          { label: "View options", icon: "SlidersHorizontal", submenu: viewMenuEntries(latest, arrangeLikeSidebar) },
        ], "above")}>
        <Icon name="GridView" />
        <span>Launcher</span>
      </button>
      <button type="button" className="cdc-dock-button" data-active={composerOpen || undefined} aria-expanded={composerOpen} onClick={toggleComposer}>
        <Icon name="MessageSquarePlus" />
        <span>Composer</span>
      </button>
      <TaskButtons width={viewport.width} />
    </nav>
  );
}

const GRIP = (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
    <circle cx="5" cy="3" r="1.25" /><circle cx="11" cy="3" r="1.25" />
    <circle cx="5" cy="8" r="1.25" /><circle cx="11" cy="8" r="1.25" />
    <circle cx="5" cy="13" r="1.25" /><circle cx="11" cy="13" r="1.25" />
  </svg>
);

/** bb's own composer in one rounded frame with its grip and ×, opening just above the dock. */
function Composer({ state, setState, focusRequest, onMinimized }: { state: ComposerState; setState: (next: ComposerState) => void; focusRequest: number; onMinimized: () => void }) {
  const desktop = useDesktop();
  const area = useWorkArea();
  const viewport = useViewport();
  const track = usePointerTracker();
  const ref = useRef<HTMLDivElement>(null);

  const clamp = (point: { x: number; y: number }) => {
    const width = ref.current?.offsetWidth ?? 720;
    const height = ref.current?.offsetHeight ?? 220;
    return { x: Math.max(16, Math.min(viewport.width - width - 16, point.x)), y: Math.max(16, Math.min(area.height - height, point.y)) };
  };
  const current = () => {
    const element = ref.current;
    return element === null ? { x: 16, y: 16 } : { x: element.offsetLeft, y: element.offsetTop };
  };
  const position = state.position === null ? null : clamp(state.position);

  const startMove = (event: ReactPointerEvent<HTMLButtonElement>) => {
    if (event.button !== 0) return;
    const origin = current();
    let latest = origin;
    track(event, (delta) => {
      latest = clamp({ x: origin.x + delta.x, y: origin.y + delta.y });
      if (ref.current) Object.assign(ref.current.style, { left: `${latest.x}px`, top: `${latest.y}px`, bottom: "auto", transform: "none" });
    }, (cancelled, moved) => {
      if (moved && !cancelled) setState({ ...state, position: latest });
    });
  };

  const nudge = (event: ReactKeyboardEvent<HTMLButtonElement>) => {
    const delta = ({ ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] } as Record<string, [number, number]>)[event.key];
    if (delta === undefined) return;
    event.preventDefault();
    const step = event.shiftKey ? 120 : 24;
    const from = current();
    setState({ ...state, position: clamp({ x: from.x + delta[0] * step, y: from.y + delta[1] * step }) });
  };

  const submit = async (request: NewThreadRequest) => {
    const { threadId } = await desktop.call("spawnThread", { request: request as unknown as Record<string, unknown> });
    desktop.openThread(threadId);
  };

  return (
    <div
      ref={ref}
      className="cdc-composer"
      data-open={state.open || undefined}
      data-screen
      aria-hidden={!state.open}
      inert={!state.open}
      style={position === null ? undefined : { left: position.x, top: position.y, bottom: "auto", transform: "none" }}
      onWheel={(event) => event.stopPropagation()}
    >
      <header className="cdc-composer-header">
        <button type="button" className="cdc-composer-grip" aria-label="Move composer. Drag, or use arrow keys." onPointerDown={startMove} onKeyDown={nudge}>{GRIP}</button>
        <button type="button" className="cdc-title-button" aria-label="Minimize composer" title="Minimize" onClick={() => { setState({ open: false, position: null }); onMinimized(); }}>
          <Icon name="X" />
        </button>
      </header>
      <NewThreadComposer key="main-composer" draftKey={`${PLUGIN_ID}:main`} layout="document" focusRequest={focusRequest} placeholder="Ask anything, or start something new…" onSubmit={submit} />
    </div>
  );
}

function Shell() {
  const manager = useWindowManager();
  const [composer, setComposerState] = useState(readComposer);
  const [focusRequest, setFocusRequest] = useState(0);
  const arrange = useRef<(() => void) | null>(null);
  const minimizedByShowDesktop = useRef<string[]>([]);
  const windowCount = useRef(manager.windows.length);

  const setComposer = (next: ComposerState) => {
    setComposerState(next);
    try {
      localStorage.setItem(COMPOSER_KEY, JSON.stringify(next));
    } catch {
      // The composer's place is a convenience.
    }
  };
  // Reopening puts it back just above the dock.
  const openComposer = () => {
    setComposer({ open: true, position: null });
    setFocusRequest((value) => value + 1);
  };
  const toggleComposer = () => (composer.open ? setComposer({ open: false, position: null }) : openComposer());

  // The composer steps aside when a new window opens.
  useEffect(() => {
    if (manager.windows.length > windowCount.current && composer.open) setComposer({ ...composer, open: false });
    windowCount.current = manager.windows.length;
  });

  const showDesktop = () => {
    const visible = manager.windows.filter((window) => !window.minimized);
    if (visible.length === 0) {
      for (const id of minimizedByShowDesktop.current) manager.minimize(id, false);
      minimizedByShowDesktop.current = [];
      return;
    }
    minimizedByShowDesktop.current = visible.map((window) => window.id);
    for (const window of visible) manager.minimize(window.id, true);
  };

  return (
    <>
      <DesktopCanvas showComposer={openComposer} showDesktop={showDesktop} arrangeRef={arrange} />
      <WindowLayer />
      <Composer state={composer} setState={setComposer} focusRequest={focusRequest}
        onMinimized={() => document.querySelector<HTMLElement>(".cdc-dock [aria-expanded]")?.focus()} />
      <Dock composerOpen={composer.open} toggleComposer={toggleComposer} arrangeLikeSidebar={() => arrange.current?.()} />
      <NeedsInputNotice />
    </>
  );
}

function Desktop() {
  return (
    <CanvasProvider className="cdc-desktop" rootProps={PLUGIN_SCOPE}>
      <WindowManagerProvider>
        <DesktopDataProvider>
          <MenuProvider>
            <AskTextProvider>
              <Shell />
            </AskTextProvider>
          </MenuProvider>
        </DesktopDataProvider>
      </WindowManagerProvider>
    </CanvasProvider>
  );
}

export default definePluginApp((app) => {
  app.slots.navPanel({ id: "desktop", path: "desktop", title: "Canvas Desktop", icon: "AppWindow", component: Desktop });
});
