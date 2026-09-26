import { useCallback, useLayoutEffect, useRef, useState } from "react";
import { ChevronsRightGlyph } from "../art";
import { useLaunchers } from "../programs/launchers";
import { MediaDeskband } from "../programs/media-player";
import { windowArt, windowTitle } from "../programs/registry";
import { useMic } from "../services/mic";
import { useDesktop } from "../shell/data";
import { useMenu, type MenuEntry } from "../shell/menu";
import { useWindowManager } from "../windows";
import { useTaskbarCapacity } from "./capacity";
import { QuickLaunch, quickLaunchMenu } from "./quick-launch";
import { StartFlag, StartMenu } from "./start-menu";
import { TrayClock, TrayIcons } from "./tray";

/** Where the floating taskbar centers: the desktop section's horizontal center and width. */
export interface DockFrame {
  left: number;
  maxWidth: number;
}

/**
 * Start, Quick Launch, one button per window, and the tray. A playing Media Player that is closed or minimized
 * shows as the tray deskband instead of a task button.
 */
export function Taskbar({ frame }: { frame: DockFrame | null }) {
  const desktop = useDesktop();
  const manager = useWindowManager();
  const menu = useMenu();
  const catalog = useLaunchers().quickLaunch;
  const quickLaunch = desktop.snapshot.preferences.quickLaunch.flatMap(
    (id) => catalog.find((item) => item.id === id) ?? [],
  );
  const { status } = useMic();
  const playing = status === "live" || status === "starting";
  const player = manager.windows.find((window) => window.spec.kind === "media-player");
  const deskband = playing && (player === undefined || player.minimized);
  const [startOpen, setStartOpen] = useState(false);
  const closeStart = useCallback(() => setStartOpen(false), []);
  const activate = (id: string) => {
    if (manager.focusedId === id) manager.minimize(id, true);
    else manager.focus(id);
  };
  const navRef = useRef<HTMLElement>(null);
  const fitMaximized = useRef(manager.fitMaximized);
  fitMaximized.current = manager.fitMaximized;
  // Maximized windows stop just above the taskbar, which can only be measured once it has rendered.
  useLayoutEffect(() => {
    const nav = navRef.current;
    if (nav === null) return;
    const observer = new ResizeObserver(() => fitMaximized.current());
    observer.observe(nav);
    return () => observer.disconnect();
  }, []);
  const tasks = manager.windows.filter((window) => !(deskband && window.id === player?.id));
  const { quick: quickCapacity, tasks: capacity } = useTaskbarCapacity(navRef, quickLaunch.length, tasks.length);
  const quickShown = quickLaunch.slice(0, quickCapacity);
  const quickHidden = quickLaunch.slice(quickCapacity);
  const shown = tasks.slice(0, capacity);
  const focused = tasks.find((window) => window.id === manager.focusedId);
  if (capacity > 0 && focused !== undefined && !shown.includes(focused)) shown[capacity - 1] = focused;
  const hidden = tasks.filter((window) => !shown.includes(window));
  return (
    <nav
      ref={navRef}
      className="bbd-taskbar"
      aria-label="Taskbar"
      style={frame === null ? undefined : { left: frame.left, maxWidth: frame.maxWidth - 24 }}
      onContextMenu={(event) => menu.open(event, quickLaunchMenu(desktop, catalog, null))}
    >
      <button
        type="button"
        className="bbd-start"
        aria-haspopup="menu"
        aria-expanded={startOpen}
        onClick={() => setStartOpen((open) => !open)}
      >
        <StartFlag />
        <span>start</span>
      </button>
      {startOpen && <StartMenu onClose={closeStart} />}
      <QuickLaunch shown={quickShown} hidden={quickHidden} catalog={catalog} />
      <div className="bbd-tasks">
        {shown.map((window) => {
          const title = windowTitle(window.spec, desktop);
          return (
            <button
              key={window.id}
              type="button"
              className="bbd-task"
              aria-label={`${title}${window.minimized ? " (minimized)" : ""}`}
              title={title}
              data-focused={manager.focusedId === window.id && !window.minimized}
              onClick={() => activate(window.id)}
            >
              <span className="bbd-task-icon">{windowArt(window.spec, desktop, 16)}</span>
              <span className="min-w-0 truncate">{title}</span>
            </button>
          );
        })}
        {hidden.length > 0 ? (
          <button
            type="button"
            className="bbd-task bbd-task-more"
            aria-label={`${hidden.length} more ${hidden.length === 1 ? "window" : "windows"}`}
            title={`${hidden.length} more ${hidden.length === 1 ? "window" : "windows"}`}
            aria-haspopup="menu"
            onClick={(event) =>
              menu.open(
                event,
                hidden.map((window): MenuEntry => ({
                  label: `${windowTitle(window.spec, desktop)}${window.minimized ? " (minimized)" : ""}`,
                  icon: windowArt(window.spec, desktop, 16),
                  run: () => manager.focus(window.id),
                })),
              )
            }
          >
            <ChevronsRightGlyph className="size-3" strokeWidth={2.5} />
            <span>{hidden.length}</span>
          </button>
        ) : null}
      </div>
      <div className="bbd-tray">
        {deskband && <MediaDeskband onRestore={() => manager.open({ kind: "media-player" })} />}
        <TrayIcons />
        <TrayClock />
      </div>
    </nav>
  );
}
