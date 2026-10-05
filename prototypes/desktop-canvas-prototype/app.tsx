import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import {
  definePluginApp,
  experimental_Icon as Icon,
  experimental_NewThreadComposer as NewThreadComposer,
  type NewThreadRequest,
} from "@get-bb/plugin-sdk/app";
import { CanvasProvider, useWorkArea } from "./camera";
import { DesktopCanvas } from "./canvas";
import { DesktopDataProvider, useDesktop } from "./data";
import { AskTextProvider, MenuProvider, PLUGIN_SCOPE, useMenu, type MenuEntry } from "./menu";
import { ProgramWindow, windowIcon, windowTitle } from "./programs";
import { usePointerTracker, useWindowManager, WindowManagerProvider, type DesktopWindow } from "./windows";
import "./app.css";

type ComposerMode = "center" | "float" | "hidden";
interface ComposerState {
  mode: ComposerMode;
  position: { x: number; y: number } | null;
}

const PLUGIN_ID = "desktop-canvas-prototype";
const COMPOSER_KEY = `${PLUGIN_ID}:composer:v1`;
const COMPOSER_WIDTH = 720;

function readComposer(): ComposerState {
  try {
    const parsed: unknown = JSON.parse(localStorage.getItem(COMPOSER_KEY) ?? localStorage.getItem(`${PLUGIN_ID}:layout:v1`) ?? "null");
    const record = typeof parsed === "object" && parsed !== null ? (parsed as Record<string, unknown>) : {};
    const mode = record.mode ?? record.composer;
    const position = (record.position ?? record.promptPosition) as Record<string, unknown> | null | undefined;
    return {
      mode: mode === "center" || mode === "float" || mode === "hidden" ? mode : "center",
      position: typeof position?.x === "number" && typeof position?.y === "number" ? { x: position.x, y: position.y } : null,
    };
  } catch {
    return { mode: "center", position: null };
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

function WindowLayer() {
  const manager = useWindowManager();
  const desktop = useDesktop();
  return (
    <div
      className="cdc-window-layer"
      onClickCapture={(event) => {
        if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
        const threadId = linkedThreadId(event.target);
        if (threadId === null) return;
        event.preventDefault();
        event.stopPropagation();
        desktop.openThread(threadId);
      }}
    >
      {manager.windows.map((window) => <ProgramWindow key={window.id} window={window} />)}
    </div>
  );
}

/** Taskbar buttons that don't fit collapse into one overflow button, keeping the focused window's button visible. */
function TaskButtons({ width }: { width: number }) {
  const manager = useWindowManager();
  const desktop = useDesktop();
  const menu = useMenu();
  const capacity = Math.max(1, Math.floor((width - 360) / 156));
  const shown = manager.windows.slice(0, capacity);
  const focused = manager.windows.find((window) => window.id === manager.focusedId);
  if (focused !== undefined && !shown.includes(focused)) shown[shown.length - 1] = focused;
  const hidden = manager.windows.filter((window) => !shown.includes(window));
  const activate = (window: DesktopWindow) => {
    if (manager.focusedId === window.id && !window.minimized) manager.minimize(window.id, true);
    else manager.focus(window.id, { reveal: true });
  };
  const taskMenu = (window: DesktopWindow): MenuEntry[] => [
    window.minimized ? { label: "Restore", icon: "AppWindow", run: () => manager.focus(window.id, { reveal: true }) } : { label: "Minimize", icon: "Minus", run: () => manager.minimize(window.id, true) },
    { label: window.maximized ? "Restore size" : "Maximize", icon: window.maximized ? "Minimize2" : "Maximize2", run: () => manager.toggleMaximize(window.id) },
    "separator",
    { label: "Close", icon: "X", run: () => manager.close(window.id) },
  ];
  return (
    <div className="cdc-tasks">
      {shown.map((window) => {
        const title = windowTitle(window.spec, desktop);
        return (
          <button key={window.id} type="button" className="cdc-task" title={title} aria-label={`${title}${window.minimized ? " (minimized)" : ""}`}
            data-focused={manager.focusedId === window.id && !window.minimized} data-minimized={window.minimized || undefined}
            onClick={() => activate(window)} onContextMenu={(event) => menu.open(event, taskMenu(window))}>
            <Icon name={windowIcon(window.spec, desktop)} />
            <span>{title}</span>
          </button>
        );
      })}
      {hidden.length > 0 ? (
        <button type="button" className="cdc-task cdc-task-more" aria-haspopup="menu" aria-label={`${hidden.length} more ${hidden.length === 1 ? "window" : "windows"}`}
          onClick={(event) => menu.openFrom(event.currentTarget, hidden.map((window): MenuEntry => ({ label: windowTitle(window.spec, desktop), icon: windowIcon(window.spec, desktop), run: () => manager.focus(window.id, { reveal: true }) })), "above")}>
          +{hidden.length}
        </button>
      ) : null}
    </div>
  );
}

function Dock({ composer, showComposer }: { composer: ComposerMode; showComposer: (mode: ComposerMode) => void }) {
  const manager = useWindowManager();
  const menu = useMenu();
  const area = useWorkArea();
  return (
    <nav className="cdc-dock cdc-glass" data-screen aria-label="Dock">
      <button type="button" className="cdc-dock-button" aria-haspopup="menu"
        onClick={(event) => menu.openFrom(event.currentTarget, [
          { label: "Composer", icon: "MessageSquarePlus", run: () => showComposer("float") },
          { label: "My Threads", icon: "MessageSquare", run: () => manager.open({ kind: "threads" }) },
          { label: "New folder", icon: "FolderPlus", run: () => manager.open({ kind: "new-folder", at: null }) },
        ], "above")}>
        <Icon name="GridView" />
        <span>Launcher</span>
      </button>
      <span className="cdc-divider" />
      <button type="button" className="cdc-dock-button" data-active={composer !== "hidden" || undefined} onClick={() => showComposer(composer === "hidden" ? "float" : "hidden")}>
        <Icon name="MessageSquarePlus" />
        <span>Composer</span>
      </button>
      <button type="button" className="cdc-dock-button cdc-dock-chevron" aria-label="Composer placement" title="Composer placement" aria-haspopup="menu"
        onClick={(event) => menu.openFrom(event.currentTarget, [
          { label: "Center", icon: "Target", checked: composer === "center", run: () => showComposer("center") },
          { label: "Float", icon: "PanelBottom", checked: composer === "float", run: () => showComposer("float") },
          { label: "Hide", icon: "Minus", checked: composer === "hidden", run: () => showComposer("hidden") },
        ], "above")}>
        <Icon name="ChevronUp" />
      </button>
      {manager.windows.length > 0 ? <span className="cdc-divider" /> : null}
      <TaskButtons width={area.width} />
    </nav>
  );
}

function Composer({ state, setState, focusRequest }: { state: ComposerState; setState: (next: ComposerState) => void; focusRequest: number }) {
  const desktop = useDesktop();
  const manager = useWindowManager();
  const area = useWorkArea();
  const track = usePointerTracker();
  const ref = useRef<HTMLDivElement>(null);
  const width = Math.min(COMPOSER_WIDTH, area.width - 32);
  const clamp = (point: { x: number; y: number }) => ({
    x: Math.max(16, Math.min(area.width - width - 16, point.x)),
    y: Math.max(16, Math.min(area.height - 160, point.y)),
  });
  const floatPoint = clamp(state.position ?? { x: area.width - width - 24, y: area.height - 280 });

  const startMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (state.mode !== "float" || event.target !== event.currentTarget || event.button !== 0) return;
    const origin = floatPoint;
    let latest = origin;
    track(event, (delta) => {
      latest = clamp({ x: origin.x + delta.x, y: origin.y + delta.y });
      if (ref.current) Object.assign(ref.current.style, { left: `${latest.x}px`, top: `${latest.y}px` });
    }, (cancelled, moved) => {
      if (moved && !cancelled) setState({ ...state, position: latest });
    });
  };

  const submit = async (request: NewThreadRequest) => {
    const { threadId } = await desktop.call("spawnThread", { request: request as unknown as Record<string, unknown> });
    setState({ ...state, mode: "hidden" });
    manager.open({ kind: "thread", threadId });
  };

  return (
    <div
      ref={ref}
      className="cdc-composer"
      data-mode={state.mode}
      data-screen
      aria-hidden={state.mode === "hidden"}
      inert={state.mode === "hidden"}
      tabIndex={state.mode === "float" ? 0 : -1}
      aria-label={state.mode === "float" ? "Composer. Drag the top edge or use arrow keys to move it." : undefined}
      style={state.mode === "float" ? { left: floatPoint.x, top: floatPoint.y, width } : { width }}
      onPointerDown={startMove}
      onKeyDown={(event) => {
        if (state.mode !== "float" || event.target !== event.currentTarget) return;
        const delta = ({ ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] } as Record<string, [number, number]>)[event.key];
        if (delta === undefined) return;
        event.preventDefault();
        const step = event.shiftKey ? 120 : 24;
        setState({ ...state, position: clamp({ x: floatPoint.x + delta[0] * step, y: floatPoint.y + delta[1] * step }) });
      }}
      onWheel={(event) => event.stopPropagation()}
    >
      <NewThreadComposer key="main-composer" draftKey={`${PLUGIN_ID}:main`} layout="document" focusRequest={focusRequest} placeholder="Ask anything, or start something new…" onSubmit={submit} />
    </div>
  );
}

function Shell() {
  const manager = useWindowManager();
  const [composer, setComposerState] = useState(readComposer);
  const [focusRequest, setFocusRequest] = useState(0);
  const minimizedByShowDesktop = useRef<string[]>([]);
  const windowCount = useRef(manager.windows.length);

  const setComposer = (next: ComposerState) => {
    setComposerState(next);
    try {
      localStorage.setItem(COMPOSER_KEY, JSON.stringify(next));
    } catch {
      // The placement is a convenience.
    }
  };
  const showComposer = (mode: ComposerMode) => {
    setComposer({ ...composer, mode });
    if (mode !== "hidden") setFocusRequest((value) => value + 1);
  };

  // A centered composer steps aside when a window opens over it.
  useEffect(() => {
    if (manager.windows.length > windowCount.current && composer.mode === "center") setComposer({ ...composer, mode: "hidden" });
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
      <DesktopCanvas showComposer={() => showComposer("float")} showDesktop={showDesktop} />
      <WindowLayer />
      <Composer state={composer} setState={setComposer} focusRequest={focusRequest} />
      <Dock composer={composer.mode} showComposer={showComposer} />
    </>
  );
}

function Desktop() {
  const rootRef = useRef<HTMLDivElement>(null);
  return (
    <div ref={rootRef} className="cdc-desktop" {...PLUGIN_SCOPE}>
      <CanvasProvider rootRef={rootRef}>
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
    </div>
  );
}

export default definePluginApp((app) => {
  app.slots.navPanel({ id: "desktop", path: "desktop", title: "Canvas Desktop", icon: "AppWindow", component: Desktop });
});
