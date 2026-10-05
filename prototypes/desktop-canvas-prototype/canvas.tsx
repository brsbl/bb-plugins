import { useCallback, useEffect, useMemo, useRef, useState, type KeyboardEvent as ReactKeyboardEvent, type MouseEvent as ReactMouseEvent, type PointerEvent as ReactPointerEvent, type ReactNode, type RefObject } from "react";
import { toast } from "sonner";
import { experimental_Icon as Icon } from "@get-bb/plugin-sdk/app";
import { RECYCLE_BIN_DROP, deleteGroups, groupMenu, threadDropTarget, viewMenuEntries } from "./actions";
import { useCamera, useCanvasControls, useWorkArea } from "./camera";
import {
  ICON_BOX,
  ICON_CELL,
  boundsOf,
  cascadeRects,
  fitCamera,
  folderSummary,
  gridPositions,
  groupSortValue,
  isDeletable,
  nextFreePosition,
  sortThreads,
  tileRects,
  toWorld,
  worldRect,
  zoomAt,
  type Camera,
  type DesktopGroup,
  type Point,
  type Rect,
} from "./core";
import { errorMessage, useDesktop } from "./data";
import { useMenu, type MenuEntry, type MenuTrigger } from "./menu";
import { StatusDot, groupIcon, useMenuContext } from "./programs";
import { usePointerTracker, useWindowManager, windowSize, type DesktopWindow } from "./windows";

/**
 * The canvas: Desktop's icon desktop on an infinite, zoomable surface. Icons select, marquee-select and drag as a
 * selection; positions persist on the server. Scroll or space-drag pans, pinch or ⌘-scroll zooms.
 */

export const RECYCLE_BIN_KEY = "recycle-bin";
export const MORE_KEY = "more";

type Entry =
  | { kind: "group"; key: string; title: string; group: DesktopGroup }
  | { kind: "more"; key: string; title: string }
  | { kind: "recycle-bin"; key: string; title: string };

/** Where icons without a saved position go: a fixed grid at the canvas origin, so they never drift with the view. */
const HOME_AREA: Rect = { x: 48, y: 48, width: ICON_CELL.width * 7, height: 100_000 };
const NUDGE = 16;

interface SavedPosition {
  point: Point;
  savedAt: number | null;
}

/** Taskbar order stays stable when focus raises a window, so repeated presses visit every window. */
export function cycleWindowId(windows: readonly DesktopWindow[], focusedId: string | null, direction: 1 | -1): string | null {
  if (windows.length === 0) return null;
  const current = windows.findIndex((window) => window.id === focusedId);
  const index = current === -1 ? (direction === 1 ? 0 : windows.length - 1) : (current + direction + windows.length) % windows.length;
  const next = windows[index]!;
  return next.id === focusedId ? null : next.id;
}

export function useCanvasEntries(): Entry[] {
  const { canvasGroups, moreGroups } = useDesktop();
  const hasMore = moreGroups.length > 0;
  return useMemo<Entry[]>(() => [
    { kind: "recycle-bin", key: RECYCLE_BIN_KEY, title: "Recycle Bin" },
    ...(hasMore ? [{ kind: "more" as const, key: MORE_KEY, title: "More" }] : []),
    ...canvasGroups.map((group) => ({ kind: "group" as const, key: group.key, title: group.name, group })),
  ], [canvasGroups, hasMore]);
}

/** Every icon's canvas position: saved, pending a save, or the next free slot at home. */
export function useIconPositions(entries: readonly Entry[], overrides: Record<string, SavedPosition>) {
  const { snapshot } = useDesktop();
  return useMemo(() => {
    const placed = new Map<string, Point>();
    for (const entry of entries) {
      const point = overrides[entry.key]?.point ?? snapshot.layout[entry.key];
      if (point !== undefined) placed.set(entry.key, point);
    }
    for (const entry of entries) {
      if (!placed.has(entry.key)) placed.set(entry.key, nextFreePosition([...placed.values()], HOME_AREA));
    }
    return placed;
  }, [entries, overrides, snapshot.layout]);
}

export function DesktopCanvas({ showComposer, showDesktop }: { showComposer: () => void; showDesktop: () => void }) {
  const desktop = useDesktop();
  const context = useMenuContext();
  const manager = useWindowManager();
  const menu = useMenu();
  const camera = useCamera();
  const area = useWorkArea();
  const controls = useCanvasControls();
  const track = usePointerTracker();
  const { call, refresh, sort } = desktop;
  const canvasRef = useRef<HTMLDivElement>(null);
  const binRef = useRef<HTMLDivElement>(null);
  const marqueeRef = useRef<HTMLDivElement>(null);
  const spaceHeld = useRef(false);
  const [panning, setPanning] = useState(false);
  const [selected, setSelected] = useState<ReadonlySet<string>>(() => new Set());
  const [overrides, setOverrides] = useState<Record<string, SavedPosition>>({});

  const entries = useCanvasEntries();
  const positions = useIconPositions(entries, overrides);
  const keys = useMemo(() => entries.map((entry) => entry.key), [entries]);
  const groups = useMemo(() => entries.flatMap((entry) => (entry.kind === "group" ? [entry.group] : [])), [entries]);

  // A snapshot requested before a save finished can arrive after it, so a position stays until the server has it.
  useEffect(() => {
    setOverrides((current) => {
      const pending = Object.entries(current).filter(([, saved]) => saved.savedAt === null || saved.savedAt >= desktop.snapshotRequestedAt);
      return pending.length === Object.keys(current).length ? current : Object.fromEntries(pending);
    });
  }, [desktop.snapshotRequestedAt]);

  // Forget selected icons that went away (a folder deleted, or organized differently).
  useEffect(() => {
    setSelected((current) => {
      const kept = [...current].filter((key) => keys.includes(key));
      return kept.length === current.size ? current : new Set(kept);
    });
  }, [keys]);

  const saveLayout = useCallback((changes: Record<string, Point>) => {
    const saving: Record<string, SavedPosition> = Object.fromEntries(Object.entries(changes).map(([key, point]) => [key, { point, savedAt: null }]));
    setOverrides((current) => ({ ...current, ...saving }));
    // Settles only positions a later drag hasn't replaced; a failed save puts the icons back.
    const settle = (savedAt: number | null) =>
      setOverrides((current) => {
        const next = { ...current };
        for (const [key, entry] of Object.entries(saving)) {
          if (next[key] !== entry) continue;
          if (savedAt === null) delete next[key];
          else next[key] = { point: entry.point, savedAt };
        }
        return next;
      });
    void call("setLayout", { entries: changes }).then(
      () => {
        settle(Date.now());
        refresh();
      },
      (error) => {
        settle(null);
        toast.error(errorMessage(error));
      },
    );
  }, [call, refresh]);

  const deletableIn = (keySet: ReadonlySet<string>) => groups.filter((group) => keySet.has(group.key) && isDeletable(group));
  const iconElements = () => Array.from(canvasRef.current?.querySelectorAll<HTMLElement>("[data-icon-key]") ?? []);

  const beginIconDrag = (key: string, event: ReactPointerEvent<HTMLDivElement>) => {
    if (event.button !== 0 || event.isPrimary === false) return;
    event.stopPropagation();
    if (event.metaKey || event.ctrlKey || event.shiftKey) {
      setSelected((current) => {
        const next = new Set(current);
        if (next.has(key)) next.delete(key);
        else next.add(key);
        return next;
      });
      return;
    }
    const moving = selected.has(key) ? selected : new Set([key]);
    if (!selected.has(key)) setSelected(moving);
    const elements = iconElements().filter((element) => moving.has(element.dataset.iconKey!));
    const bin = binRef.current?.getBoundingClientRect();
    const origin = { x: event.clientX, y: event.clientY };
    const { zoom } = controls.getCamera();
    let delta: Point = { x: 0, y: 0 };
    let overBin = false;
    track(event, (next) => {
      delta = { x: next.x / zoom, y: next.y / zoom };
      const pointer = { x: origin.x + next.x, y: origin.y + next.y };
      overBin = !moving.has(RECYCLE_BIN_KEY) && bin !== undefined && pointer.x >= bin.left && pointer.x <= bin.right && pointer.y >= bin.top && pointer.y <= bin.bottom;
      for (const element of elements) {
        element.style.transform = `translate(${delta.x}px, ${delta.y}px)`;
        element.dataset.dragging = "true";
      }
      if (binRef.current) binRef.current.dataset.dropTarget = String(overBin);
    }, (cancelled, moved) => {
      for (const element of elements) {
        element.style.transform = "";
        delete element.dataset.dragging;
      }
      if (binRef.current) binRef.current.dataset.dropTarget = "false";
      if (cancelled || !moved) return;
      if (overBin) {
        if (deleteGroups(context, deletableIn(moving))) setSelected(new Set());
        return;
      }
      saveLayout(Object.fromEntries([...moving].flatMap((movingKey) => {
        const point = positions.get(movingKey);
        return point ? [[movingKey, { x: point.x + delta.x, y: point.y + delta.y }]] : [];
      })));
    });
  };

  const beginPan = (event: ReactPointerEvent<HTMLDivElement>) => {
    const origin = controls.getCamera();
    setPanning(true);
    track(event, (delta) => controls.setCamera({ ...origin, x: origin.x + delta.x, y: origin.y + delta.y }), () => setPanning(false), { threshold: 1, cursor: "grabbing" });
  };

  const beginMarquee = (event: ReactPointerEvent<HTMLDivElement>) => {
    const additive = event.metaKey || event.ctrlKey || event.shiftKey;
    const base = additive ? selected : new Set<string>();
    if (!additive) setSelected(base);
    const start = controls.toLocal(event.clientX, event.clientY);
    const view = controls.getCamera();
    const elements = iconElements();
    let hit = new Set(base);
    track(event, (delta) => {
      const box = { x: Math.min(start.x, start.x + delta.x), y: Math.min(start.y, start.y + delta.y), width: Math.abs(delta.x), height: Math.abs(delta.y) };
      const marquee = marqueeRef.current;
      if (marquee) {
        marquee.hidden = false;
        Object.assign(marquee.style, { left: `${box.x}px`, top: `${box.y}px`, width: `${box.width}px`, height: `${box.height}px` });
      }
      const world = worldRect(view, box);
      hit = new Set(base);
      for (const [key, point] of positions) {
        if (point.x < world.x + world.width && point.x + ICON_BOX.width > world.x && point.y < world.y + world.height && point.y + ICON_BOX.height > world.y) hit.add(key);
      }
      for (const element of elements) {
        const value = String(hit.has(element.dataset.iconKey!));
        if (element.getAttribute("aria-selected") !== value) element.setAttribute("aria-selected", value);
      }
    }, (cancelled) => {
      if (marqueeRef.current) marqueeRef.current.hidden = true;
      const result = cancelled ? base : hit;
      for (const element of elements) element.setAttribute("aria-selected", String(result.has(element.dataset.iconKey!)));
      setSelected(result);
    });
  };

  const onBackgroundPointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (event.target !== event.currentTarget && !(event.target as HTMLElement).classList.contains("cdc-world")) return;
    canvasRef.current?.focus({ preventScroll: true });
    if (event.button === 1 || (event.button === 0 && (spaceHeld.current || event.pointerType === "touch"))) {
      event.preventDefault();
      beginPan(event);
    } else if (event.button === 0 && event.isPrimary) beginMarquee(event);
  };

  // Space held turns a drag on the canvas into a pan, as in design tools.
  useEffect(() => {
    const typing = (target: EventTarget | null) => target instanceof Element && target.closest("input, textarea, select, [contenteditable='true'], [role='textbox']") !== null;
    const down = (event: KeyboardEvent) => {
      if (event.code !== "Space" || event.repeat || typing(event.target) || !(event.target instanceof Element) || controls.rootRef.current?.contains(event.target) !== true) return;
      if (event.target.closest(".cdc-window, button, [role='button'], [role='option']") !== null) return;
      event.preventDefault();
      spaceHeld.current = true;
      canvasRef.current?.setAttribute("data-space", "true");
    };
    const up = (event: KeyboardEvent) => {
      if (event.code !== "Space") return;
      spaceHeld.current = false;
      canvasRef.current?.removeAttribute("data-space");
    };
    const blur = () => {
      spaceHeld.current = false;
      canvasRef.current?.removeAttribute("data-space");
    };
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    window.addEventListener("blur", blur);
    return () => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
      window.removeEventListener("blur", blur);
    };
  }, [controls]);

  useCanvasGestures(controls.rootRef);

  const zoomTo = (zoom: number) => controls.setCamera((current) => zoomAt(current, zoom, { x: area.x + area.width / 2, y: area.y + area.height / 2 }), { animate: true });
  const iconRects = () => [...positions.values()].map((point) => ({ ...point, ...ICON_BOX }));
  const fitAll = () => {
    const windows = manager.windows.filter((window) => !window.minimized && !window.maximized).map((window) => window.rect);
    controls.setCamera(fitCamera(boundsOf([...iconRects(), ...windows]), area), { animate: true });
  };

  const onKeyDown = (event: ReactKeyboardEvent<HTMLDivElement>) => {
    if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) return;
    if (event.target instanceof Element && event.target.closest(".cdc-window") !== null) return;
    const arrow = ({ ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] } as Record<string, [number, number]>)[event.key];
    if ((event.key === "Delete" || event.key === "Backspace") && selected.size > 0) {
      event.preventDefault();
      if (deleteGroups(context, deletableIn(selected))) setSelected(new Set());
    } else if (event.key === "Escape" && selected.size > 0) {
      setSelected(new Set());
    } else if (event.key === "a" && (event.metaKey || event.ctrlKey)) {
      event.preventDefault();
      setSelected(new Set(keys));
    } else if (arrow !== undefined && selected.size > 0) {
      // The keyboard alternative to dragging icons.
      event.preventDefault();
      const step = event.shiftKey ? ICON_CELL.width : NUDGE;
      saveLayout(Object.fromEntries([...selected].flatMap((key) => {
        const point = positions.get(key);
        return point ? [[key, { x: point.x + arrow[0] * step, y: point.y + arrow[1] * step }]] : [];
      })));
    } else if (arrow !== undefined && event.target === canvasRef.current) {
      event.preventDefault();
      const step = event.shiftKey ? 240 : 64;
      controls.setCamera((current) => ({ ...current, x: current.x - arrow[0] * step, y: current.y - arrow[1] * step }));
    } else if (event.target === canvasRef.current && (event.key === "+" || event.key === "=")) {
      event.preventDefault();
      zoomTo(camera.zoom * 1.25);
    } else if (event.target === canvasRef.current && event.key === "-") {
      event.preventDefault();
      zoomTo(camera.zoom / 1.25);
    } else if (event.target === canvasRef.current && event.key === "0") {
      event.preventDefault();
      zoomTo(1);
    } else if (event.target === canvasRef.current && event.key === "!" ) {
      event.preventDefault();
      fitAll();
    }
  };

  /** The visible part of the canvas at 100% around the current center, where Tile and Cascade lay windows out. */
  const viewAtFullSize = (): { camera: Camera; world: Rect } => {
    const target = zoomAt(controls.getCamera(), 1, { x: area.x + area.width / 2, y: area.y + area.height / 2 });
    return { camera: target, world: worldRect(target, area) };
  };

  const windowsInSortOrder = () => {
    const open = manager.windows;
    const threadOf = (window: DesktopWindow) => (window.spec.kind === "thread" ? desktop.threadById.get(window.spec.threadId) : undefined);
    const rank = new Map(sortThreads(open.flatMap((window) => threadOf(window) ?? []), sort.key, sort.direction).map((thread, index) => [thread.id, index]));
    return [...open].sort((left, right) => (rank.get(threadOf(left)?.id ?? "") ?? Number.MAX_SAFE_INTEGER) - (rank.get(threadOf(right)?.id ?? "") ?? Number.MAX_SAFE_INTEGER));
  };

  const tileWindows = () => {
    const ordered = windowsInSortOrder();
    const view = viewAtFullSize();
    const rects = tileRects(ordered.length, view.world);
    controls.setCamera(view.camera, { animate: true });
    manager.arrange(Object.fromEntries(ordered.map((window, index) => [window.id, rects[index]!])));
  };

  const cascadeWindows = () => {
    const ordered = windowsInSortOrder();
    const view = viewAtFullSize();
    const sizes = ordered.map((window) => ({
      width: Math.min(window.rect.width, view.world.width - 64 - (ordered.length - 1) * 32),
      height: Math.min(window.rect.height, view.world.height - 64 - (ordered.length - 1) * 32),
    }));
    const rects = cascadeRects(sizes.map((size) => ({ width: Math.max(windowSize({ kind: "more" }).width, size.width), height: Math.max(240, size.height) })), { x: view.world.x + 32, y: view.world.y + 32 });
    controls.setCamera(view.camera, { animate: true });
    manager.arrange(Object.fromEntries(ordered.map((window, index) => [window.id, rects[index]!])));
    ordered.forEach((window) => manager.focus(window.id));
  };

  const arrangeIcons = () => {
    const direction = sort.direction === "ascending" ? 1 : -1;
    const valueOf = (group: DesktopGroup) => groupSortValue(group, desktop.membersOf(group), sort.key);
    const ordered = [...groups].sort((left, right) => {
      const a = valueOf(left);
      const b = valueOf(right);
      return a < b ? -direction : a > b ? direction : 0;
    });
    const arranged = [...ordered.map((group) => group.key), ...(keys.includes(MORE_KEY) ? [MORE_KEY] : []), RECYCLE_BIN_KEY];
    // Laid out where you're looking, in sort order, as wide as the view.
    const view = worldRect(camera, area);
    const grid = gridPositions(arranged.length, { x: view.x + 32 / camera.zoom, y: view.y + 32 / camera.zoom, width: Math.max(ICON_CELL.width, view.width - 64 / camera.zoom), height: view.height });
    saveLayout(Object.fromEntries(arranged.map((key, index) => [key, grid[index]!])));
  };

  const cycle = (direction: 1 | -1) => {
    const id = cycleWindowId(manager.windows, manager.focusedId, direction);
    if (id !== null) manager.focus(id, { reveal: true });
  };
  const canCycle = cycleWindowId(manager.windows, manager.focusedId, 1) !== null;

  const canvasMenu = (event: MenuTrigger): MenuEntry[] => {
    const at = toWorld(controls.getCamera(), controls.toLocal(event.clientX, event.clientY));
    return [
      { label: "New folder", icon: "FolderPlus", run: () => manager.open({ kind: "new-folder", at: { x: at.x - ICON_BOX.width / 2, y: at.y - ICON_BOX.height / 2 } }) },
      { label: "New thread", icon: "MessageSquarePlus", run: showComposer },
      "separator",
      { label: "My Threads", icon: "MessageSquare", run: () => manager.open({ kind: "threads" }) },
      { label: "Recycle Bin", icon: "Trash2", run: () => manager.open({ kind: "recycle-bin" }) },
      "separator",
      { label: "Arrange icons", icon: "GridView", run: arrangeIcons },
      { label: "Tile windows", icon: "Columns2", disabled: manager.windows.length === 0, run: tileWindows },
      { label: "Cascade windows", icon: "Layers", disabled: manager.windows.length === 0, run: cascadeWindows },
      { label: "Show desktop", icon: "AppWindow", disabled: manager.windows.length === 0, run: showDesktop },
      { label: "Next window", disabled: !canCycle, run: () => cycle(1) },
      { label: "Previous window", disabled: !canCycle, run: () => cycle(-1) },
      "separator",
      { label: "Zoom to 100%", icon: "ZoomIn", hint: "0", disabled: camera.zoom === 1, run: () => zoomTo(1) },
      { label: "Fit all", icon: "Maximize2", hint: "⇧1", run: fitAll },
      "separator",
      ...viewMenuEntries(desktop),
    ];
  };

  const iconMenu = (key: string, single: MenuEntry[]): MenuEntry[] => {
    if (!(selected.has(key) && selected.size > 1)) return single;
    const chosen = groups.filter((group) => selected.has(group.key));
    const deletable = chosen.filter(isDeletable);
    return [
      { label: `Open ${chosen.length} folders`, icon: "FolderOpen", disabled: chosen.length === 0, run: () => chosen.forEach((group) => manager.open({ kind: "finder", key: group.key })) },
      "separator",
      { label: deletable.length === 1 ? "Delete 1 folder" : `Delete ${deletable.length} folders`, icon: "Trash2", disabled: deletable.length === 0, run: () => { if (deleteGroups(context, deletable)) setSelected(new Set()); } },
    ];
  };

  const select = (key: string) => {
    if (!selected.has(key)) setSelected(new Set([key]));
  };

  let grid = 24 * camera.zoom;
  while (grid < 12) grid *= 2;

  return (
    <div
      ref={canvasRef}
      className="cdc-canvas"
      tabIndex={0}
      aria-label="Canvas. Drag to select, scroll or hold Space and drag to pan, pinch or ⌘-scroll to zoom. Arrow keys pan; plus, minus and 0 zoom."
      data-panning={panning || undefined}
      style={{ backgroundSize: `${grid}px ${grid}px`, backgroundPosition: `${camera.x}px ${camera.y}px` }}
      onPointerDown={onBackgroundPointerDown}
      onMouseDown={(event) => {
        // A middle-button pan, not the browser's autoscroll.
        if (event.button === 1) event.preventDefault();
      }}
      onKeyDown={onKeyDown}
      onContextMenu={(event) => {
        if (event.target !== event.currentTarget && !(event.target as HTMLElement).classList.contains("cdc-world")) return;
        menu.open(event, canvasMenu(event));
      }}
    >
      <div className="cdc-world" style={{ transform: `translate(${camera.x}px, ${camera.y}px) scale(${camera.zoom})` }}>
        {entries.map((entry) => {
          const position = positions.get(entry.key)!;
          const common = {
            entryKey: entry.key,
            position,
            selected: selected.has(entry.key),
            onPointerDown: (event: ReactPointerEvent<HTMLDivElement>) => beginIconDrag(entry.key, event),
          };
          if (entry.kind === "group") {
            const { group } = entry;
            const members = desktop.membersOf(group);
            const open = () => manager.open({ kind: "finder", key: group.key });
            return (
              <CanvasIcon key={entry.key} {...common} label={group.name} icon={groupIcon(group)} summary={folderSummary(group.name, members)} empty={members.length === 0}
                badge={<StatusDot members={members} />} dropKey={threadDropTarget(group)["data-thread-drop"]} onOpen={open}
                onContextMenu={(event) => {
                  select(entry.key);
                  menu.open(event, iconMenu(entry.key, groupMenu(context, group, open, (target) => manager.open({ kind: "new-thread", groupKey: target.key }))));
                }} />
            );
          }
          if (entry.kind === "more") {
            const members = [...new Map(desktop.moreGroups.flatMap((group) => desktop.membersOf(group)).map((thread) => [thread.id, thread])).values()];
            const open = () => manager.open({ kind: "more" });
            return (
              <CanvasIcon key={entry.key} {...common} label="More" icon="Layers" summary={`${folderSummary("More", members)} · ${desktop.moreGroups.length} folders hidden in the sidebar`}
                badge={<StatusDot members={members} />} onOpen={open}
                onContextMenu={(event) => { select(entry.key); menu.open(event, [{ label: "Open", icon: "FolderOpen", run: open }]); }} />
            );
          }
          const count = desktop.archivedThreads.length;
          const open = () => manager.open({ kind: "recycle-bin" });
          return (
            <CanvasIcon key={entry.key} {...common} binRef={binRef} label="Recycle Bin" icon="Trash2" empty={count === 0}
              summary={count === 0 ? "Recycle Bin — empty" : `Recycle Bin — ${count} archived ${count === 1 ? "thread" : "threads"}`}
              dropKey={RECYCLE_BIN_DROP} onOpen={open}
              onContextMenu={(event) => { select(entry.key); menu.open(event, [{ label: "Open", icon: "FolderOpen", run: open }]); }} />
          );
        })}
      </div>
      <div ref={marqueeRef} className="cdc-marquee" hidden aria-hidden />
      <CameraControls zoom={camera.zoom} zoomTo={zoomTo} fitAll={fitAll} />
    </div>
  );
}

function CanvasIcon({ entryKey, position, selected, label, icon, summary, empty, badge, dropKey, binRef, onPointerDown, onOpen, onContextMenu }: {
  entryKey: string;
  position: Point;
  selected: boolean;
  label: string;
  icon: string;
  summary: string;
  empty?: boolean;
  badge?: ReactNode;
  dropKey?: string;
  binRef?: RefObject<HTMLDivElement | null>;
  onPointerDown: (event: ReactPointerEvent<HTMLDivElement>) => void;
  onOpen: () => void;
  onContextMenu: (event: ReactMouseEvent<HTMLDivElement>) => void;
}) {
  return (
    <div
      ref={binRef}
      role="button"
      tabIndex={0}
      aria-selected={selected}
      aria-label={summary}
      title={summary}
      className="cdc-icon"
      data-icon-key={entryKey}
      data-empty={empty || undefined}
      data-thread-drop={dropKey}
      style={{ left: position.x, top: position.y }}
      onPointerDown={onPointerDown}
      onDoubleClick={onOpen}
      onKeyDown={(event) => {
        if (event.key === "Enter") {
          event.preventDefault();
          onOpen();
        }
      }}
      onContextMenu={onContextMenu}
    >
      <span className="cdc-icon-art">
        <Icon name={icon} />
        {badge}
      </span>
      <span className="cdc-icon-label">{label}</span>
    </div>
  );
}

function CameraControls({ zoom, zoomTo, fitAll }: { zoom: number; zoomTo: (zoom: number) => void; fitAll: () => void }) {
  return (
    <div className="cdc-camera cdc-glass" data-screen role="toolbar" aria-label="Zoom" onPointerDown={(event) => event.stopPropagation()}>
      <button type="button" className="cdc-tool" aria-label="Zoom out" title="Zoom out" onClick={() => zoomTo(zoom / 1.25)}><Icon name="ZoomOut" /></button>
      <button type="button" className="cdc-zoom-value" aria-label="Zoom to 100%" title="Zoom to 100%" onClick={() => zoomTo(1)}>{Math.round(zoom * 100)}%</button>
      <button type="button" className="cdc-tool" aria-label="Zoom in" title="Zoom in" onClick={() => zoomTo(zoom * 1.25)}><Icon name="ZoomIn" /></button>
      <button type="button" className="cdc-tool" aria-label="Fit all" title="Fit all (⇧1)" onClick={fitAll}><Icon name="Maximize2" /></button>
    </div>
  );
}

/**
 * Wheel, trackpad and touch gestures anywhere over the canvas, windows included: pinch (ctrl-wheel in Chromium,
 * gesture events in Safari, two fingers on touch) zooms around the fingers, and scrolling outside windows pans.
 * Ordinary scrolling inside a window stays in the window.
 */
function useCanvasGestures(rootRef: RefObject<HTMLDivElement | null>) {
  const controls = useCanvasControls();
  useEffect(() => {
    const root = rootRef.current;
    if (root === null) return;
    const overScreenChrome = (target: EventTarget | null) => target instanceof Element && target.closest("[data-screen]") !== null;
    const wheel = (event: WheelEvent) => {
      if (overScreenChrome(event.target)) return;
      const unit = event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? root.clientHeight : 1;
      if (event.ctrlKey || event.metaKey) {
        event.preventDefault();
        event.stopPropagation();
        const anchor = controls.toLocal(event.clientX, event.clientY);
        controls.setCamera((camera) => zoomAt(camera, camera.zoom * Math.exp(-event.deltaY * unit * 0.008), anchor));
        return;
      }
      if (event.target instanceof Element && event.target.closest(".cdc-window") !== null) return;
      event.preventDefault();
      const dx = (event.shiftKey && event.deltaX === 0 ? event.deltaY : event.deltaX) * unit;
      const dy = (event.shiftKey && event.deltaX === 0 ? 0 : event.deltaY) * unit;
      controls.setCamera((camera) => ({ ...camera, x: camera.x - dx, y: camera.y - dy }));
    };

    let gesture: { camera: Camera; anchor: Point } | null = null;
    const gestureStart = (event: Event) => {
      const native = event as Event & { clientX: number; clientY: number };
      if (overScreenChrome(event.target)) return;
      event.preventDefault();
      gesture = { camera: controls.getCamera(), anchor: controls.toLocal(native.clientX, native.clientY) };
    };
    const gestureChange = (event: Event) => {
      if (gesture === null) return;
      event.preventDefault();
      const { scale } = event as Event & { scale: number };
      const start = gesture;
      controls.setCamera(zoomAt(start.camera, start.camera.zoom * scale, start.anchor));
    };
    const gestureEnd = () => {
      gesture = null;
    };

    let pinch: { distance: number; anchor: Point; camera: Camera } | null = null;
    const pair = (event: TouchEvent) => {
      const [a, b] = [event.touches[0]!, event.touches[1]!];
      return {
        distance: Math.max(1, Math.hypot(b.clientX - a.clientX, b.clientY - a.clientY)),
        anchor: controls.toLocal((a.clientX + b.clientX) / 2, (a.clientY + b.clientY) / 2),
      };
    };
    const touchStart = (event: TouchEvent) => {
      if (event.touches.length !== 2 || overScreenChrome(event.target)) return;
      event.preventDefault();
      pinch = { ...pair(event), camera: controls.getCamera() };
    };
    const touchMove = (event: TouchEvent) => {
      const start = pinch;
      if (start === null || event.touches.length !== 2) return;
      event.preventDefault();
      const next = pair(event);
      const scaled = zoomAt(start.camera, (start.camera.zoom * next.distance) / start.distance, start.anchor);
      controls.setCamera({ ...scaled, x: scaled.x + next.anchor.x - start.anchor.x, y: scaled.y + next.anchor.y - start.anchor.y });
    };
    const touchEnd = (event: TouchEvent) => {
      if (event.touches.length < 2) pinch = null;
    };

    root.addEventListener("wheel", wheel, { passive: false, capture: true });
    root.addEventListener("gesturestart", gestureStart, { passive: false });
    root.addEventListener("gesturechange", gestureChange, { passive: false });
    root.addEventListener("gestureend", gestureEnd);
    root.addEventListener("touchstart", touchStart, { passive: false, capture: true });
    root.addEventListener("touchmove", touchMove, { passive: false, capture: true });
    root.addEventListener("touchend", touchEnd, true);
    root.addEventListener("touchcancel", touchEnd, true);
    return () => {
      root.removeEventListener("wheel", wheel, true);
      root.removeEventListener("gesturestart", gestureStart);
      root.removeEventListener("gesturechange", gestureChange);
      root.removeEventListener("gestureend", gestureEnd);
      root.removeEventListener("touchstart", touchStart, true);
      root.removeEventListener("touchmove", touchMove, true);
      root.removeEventListener("touchend", touchEnd, true);
      root.removeEventListener("touchcancel", touchEnd, true);
    };
  }, [controls, rootRef]);
}

