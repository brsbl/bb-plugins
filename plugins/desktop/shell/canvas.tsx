import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
  type PointerEvent as ReactPointerEvent,
} from "react";
import { toast } from "sonner";
import {
  GridViewGlyph,
  MediaPlayerArt,
  NewFolderArt,
  NewThreadArt,
  NotePadGlyph,
  RecycleBinArt,
  ThreadsArt,
  TileGlyph,
  TrashGlyph,
} from "../art";
import {
  ICON_CELL,
  gridPositions,
  groupThreads,
  nextFreePosition,
  sortThreads,
  tileRects,
  type DesktopGroup,
  type DesktopThread,
  type Point,
  type SortKey,
} from "../core";
import { addStickyNote, removeNote, useSavedNotes } from "../page/sticky-notes";
import { usePointerTracker, useWindowManager, windowId, workAreaRect, type DesktopWindow } from "../windows";
import { DesktopIcon, MORE_KEY, MoreIcon, NOTE_KEY_PREFIX, NoteIcon, RECYCLE_BIN_KEY, RecycleBinIcon } from "./canvas-icons";
import { errorMessage, useDesktop } from "./data";
import { useMenu, type MenuEntry, type MenuTrigger } from "./menu";
import { viewMenuEntries } from "./menus";
import { usePageBackgroundMenu } from "./page-menu";

const ICON_BOX = { width: 88, height: 84 } as const;

function groupSortValue(
  group: DesktopGroup,
  threads: readonly DesktopThread[],
  key: SortKey,
): number | string {
  if (key === "alpha") return group.name.toLocaleLowerCase();
  const members = groupThreads(group, threads);
  if (key === "created") {
    return group.kind === "folder"
      ? group.folder.createdAt
      : Math.min(Number.MAX_SAFE_INTEGER, ...members.map((thread) => thread.createdAt));
  }
  return Math.max(0, ...members.map((thread) => thread.updatedAt));
}

function isDeletable(group: DesktopGroup): boolean {
  return group.kind === "folder" || (group.kind === "section" && group.id !== null);
}

function deletePrompt(groups: DesktopGroup[]): string {
  const [only] = groups;
  if (groups.length === 1 && only !== undefined) {
    return only.kind === "folder"
      ? `Delete “${only.name}”? Threads inside are kept.`
      : `Delete the “${only.name}” section? Its threads move to Threads.`;
  }
  return `Delete these ${groups.length} items? Threads inside folders are kept, and threads in deleted sections move to Threads.`;
}

/**
 * The icon grid on bb's homepage: folders and sections, note pads, More, and the Recycle Bin. Icons drag as a
 * selection, a marquee selects, and positions persist through the `setLayout` RPC.
 */
export function DesktopCanvas() {
  const desktop = useDesktop();
  const manager = useWindowManager();
  const menu = useMenu();
  const { snapshot, call, sort } = desktop;
  const canvasRef = useRef<HTMLDivElement>(null);
  const binRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(900);
  const [selected, setSelected] = useState<ReadonlySet<string>>(() => new Set());
  const trackPointer = usePointerTracker();
  const marqueeRef = useRef<HTMLDivElement>(null);
  const [overrides, setOverrides] = useState<Record<string, Point>>({});

  useEffect(() => {
    const element = canvasRef.current;
    if (element === null) return;
    const observer = new ResizeObserver(([entry]) => {
      if (entry !== undefined) setWidth(entry.contentRect.width);
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  useEffect(() => setOverrides({}), [snapshot.layout]);

  const items = desktop.desktopGroups;
  const hasMore = desktop.moreGroups.length > 0;
  const savedNotes = useSavedNotes();
  const noteKeys = useMemo(() => savedNotes.map((note) => NOTE_KEY_PREFIX + note.id), [savedNotes]);
  const keys = useMemo(
    () => [RECYCLE_BIN_KEY, ...(hasMore ? [MORE_KEY] : []), ...items.map((item) => item.key), ...noteKeys],
    [hasMore, items, noteKeys],
  );

  const positions = useMemo(() => {
    const placed = new Map<string, Point>();
    for (const key of keys) {
      const point = overrides[key] ?? snapshot.layout[key];
      if (point !== undefined) placed.set(key, { x: Math.max(0, Math.min(point.x, width - ICON_BOX.width)), y: Math.max(0, point.y) });
    }
    for (const key of keys) {
      if (placed.has(key)) continue;
      placed.set(key, nextFreePosition([...placed.values()], width));
    }
    return placed;
  }, [keys, overrides, snapshot.layout, width]);

  const saveLayout = useCallback(
    (entries: Record<string, Point>) => {
      setOverrides((current) => ({ ...current, ...entries }));
      void call("setLayout", { entries }).catch((error) => toast.error(errorMessage(error)));
    },
    [call],
  );

  const deletableIn = (keySet: ReadonlySet<string>) =>
    items.filter((group) => keySet.has(group.key) && isDeletable(group));

  const deleteNotesIn = (keySet: ReadonlySet<string>) => {
    const ids = [...keySet].filter((key) => key.startsWith(NOTE_KEY_PREFIX)).map((key) => key.slice(NOTE_KEY_PREFIX.length));
    for (const id of ids) removeNote(id);
    return ids.length > 0;
  };

  const deleteGroups = (groups: DesktopGroup[], notesDeleted = false) => {
    if (groups.length === 0) {
      if (notesDeleted) {
        setSelected(new Set());
        return;
      }
      toast("Only folders and sections can be deleted.");
      return;
    }
    if (!window.confirm(deletePrompt(groups))) return;
    const fail = (error: unknown) => toast.error(errorMessage(error));
    for (const group of groups) {
      manager.close(windowId({ kind: "finder", key: group.key }));
      if (group.kind === "folder") void desktop.call("deleteFolder", { id: group.folder.id }).catch(fail);
      else if (group.kind === "section" && group.id !== null) {
        void desktop.call("deleteSection", { id: group.id }).catch(fail);
      }
    }
    setSelected(new Set());
  };

  const iconElements = () => Array.from(canvasRef.current?.querySelectorAll<HTMLElement>("[data-desktop-key]") ?? []);

  const beginIconDrag = (key: string, event: ReactPointerEvent<HTMLDivElement>) => {
    if (event.button !== 0 || event.isPrimary === false) return;
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
    const elements = iconElements().filter((element) => moving.has(element.dataset.desktopKey!));
    const bin = binRef.current?.getBoundingClientRect();
    const origin = { x: event.clientX, y: event.clientY };
    const points = [...moving].map((movingKey) => positions.get(movingKey)!).filter(Boolean);
    const minX = Math.min(...points.map((point) => point.x));
    const minY = Math.min(...points.map((point) => point.y));
    const maxX = Math.max(...points.map((point) => point.x));
    let delta: Point = { x: 0, y: 0 };
    let overBin = false;
    trackPointer(event, (next) => {
      // Clamp the group as a unit so items retain their spacing at an edge.
      delta = { x: Math.max(-minX, Math.min(next.x, Math.max(0, width - ICON_BOX.width) - maxX)), y: Math.max(-minY, next.y) };
      overBin = !moving.has(RECYCLE_BIN_KEY) && bin !== undefined &&
        origin.x + next.x >= bin.left && origin.x + next.x <= bin.right &&
        origin.y + next.y >= bin.top && origin.y + next.y <= bin.bottom;
      for (const element of elements) {
        element.style.transform = `translate(${delta.x}px, ${delta.y}px)`;
        element.dataset.dragging = "true";
      }
      if (binRef.current) binRef.current.dataset.dropTarget = String(overBin);
    }, (cancelled, moved) => {
      for (const element of elements) {
        element.style.transform = "";
        element.dataset.dragging = "false";
      }
      if (binRef.current) binRef.current.dataset.dropTarget = "false";
      if (cancelled || !moved) return;
      if (overBin) {
        deleteGroups(deletableIn(moving), deleteNotesIn(moving));
        return;
      }
      saveLayout(Object.fromEntries([...moving].flatMap((movingKey) => {
        const point = positions.get(movingKey);
        return point ? [[movingKey, { x: point.x + delta.x, y: point.y + delta.y }]] : [];
      })));
    });
  };

  const beginMarquee = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (event.target !== event.currentTarget || event.button !== 0 || event.isPrimary === false) return;
    const base = event.metaKey || event.ctrlKey || event.shiftKey ? selected : new Set<string>();
    setSelected(base);
    const bounds = event.currentTarget.getBoundingClientRect();
    const start = { x: event.clientX - bounds.left, y: event.clientY - bounds.top };
    const elements = iconElements();
    let hit = new Set(base);
    trackPointer(event, (delta) => {
      const box = { left: Math.min(start.x, start.x + delta.x), top: Math.min(start.y, start.y + delta.y),
        width: Math.abs(delta.x), height: Math.abs(delta.y) };
      const marquee = marqueeRef.current;
      if (marquee) {
        marquee.hidden = false;
        Object.assign(marquee.style, { left: `${box.left}px`, top: `${box.top}px`, width: `${box.width}px`, height: `${box.height}px` });
      }
      hit = new Set(base);
      for (const [key, point] of positions) {
        if (point.x < box.left + box.width && point.x + ICON_BOX.width > box.left &&
            point.y < box.top + box.height && point.y + ICON_BOX.height > box.top) hit.add(key);
      }
      for (const element of elements) {
        const value = String(hit.has(element.dataset.desktopKey!));
        if (element.getAttribute("aria-selected") !== value) element.setAttribute("aria-selected", value);
      }
    }, (cancelled) => {
      if (marqueeRef.current) marqueeRef.current.hidden = true;
      const result = cancelled ? base : hit;
      for (const element of elements) element.setAttribute("aria-selected", String(result.has(element.dataset.desktopKey!)));
      setSelected(result);
    });
  };

  const onKeyDown = (event: ReactKeyboardEvent<HTMLDivElement>) => {
    if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) return;
    if ((event.key === "Delete" || event.key === "Backspace") && selected.size > 0) {
      event.preventDefault();
      deleteGroups(deletableIn(selected), deleteNotesIn(selected));
    } else if (event.key === "Escape") {
      setSelected(new Set());
    } else if (event.key === "a" && (event.metaKey || event.ctrlKey)) {
      event.preventDefault();
      setSelected(new Set(keys));
    }
  };

  const iconMenu = (key: string, single: MenuEntry[]): MenuEntry[] => {
    if (!(selected.has(key) && selected.size > 1)) return single;
    const groups = items.filter((group) => selected.has(group.key));
    const deletable = groups.filter(isDeletable);
    return [
      {
        label: `Open ${groups.length} folders`,
        disabled: groups.length === 0,
        run: () => {
          for (const group of groups) manager.open({ kind: "finder", key: group.key });
        },
      },
      "separator",
      {
        label: deletable.length === 1 ? "Delete 1 item" : `Delete ${deletable.length} items`,
        icon: <TrashGlyph className="size-3.5" />,
        disabled: deletable.length === 0,
        run: () => deleteGroups(deletable),
      },
    ];
  };

  const placed = (key: string): Point => positions.get(key)!;
  const selectOnly = (key: string) => () => {
    if (!selected.has(key)) setSelected(new Set([key]));
  };

  const arrange = () => {
    const direction = sort.direction === "ascending" ? 1 : -1;
    const valueOf = (group: DesktopGroup) => groupSortValue(group, desktop.visibleThreads, sort.key);
    const ordered = [...items].sort((left, right) => {
      const leftValue = valueOf(left);
      const rightValue = valueOf(right);
      return leftValue < rightValue ? -direction : leftValue > rightValue ? direction : 0;
    });
    const keys = [...ordered.map((item) => item.key), ...noteKeys, ...(hasMore ? [MORE_KEY] : []), RECYCLE_BIN_KEY];
    const grid = gridPositions(keys.length, width);
    saveLayout(Object.fromEntries(keys.map((key, index) => [key, grid[index]!])));
  };

  const tileWindows = () => {
    const open = manager.windows;
    const threadOf = (window: DesktopWindow) =>
      window.spec.kind === "thread" || window.spec.kind === "panel"
        ? desktop.threadById.get(window.spec.threadId)
        : undefined;
    const sortedThreads = sortThreads(
      open.flatMap((window) => {
        const thread = threadOf(window);
        return thread === undefined ? [] : [thread];
      }),
      sort.key,
      sort.direction,
    );
    const rank = new Map(sortedThreads.map((thread, index) => [thread.id, index]));
    const ordered = [...open].sort(
      (left, right) =>
        (rank.get(threadOf(left)?.id ?? "") ?? Number.MAX_SAFE_INTEGER) -
        (rank.get(threadOf(right)?.id ?? "") ?? Number.MAX_SAFE_INTEGER),
    );
    const rects = tileRects(ordered.length, workAreaRect());
    manager.arrange(Object.fromEntries(ordered.map((window, index) => [window.id, rects[index]!])));
  };

  const commands: MenuEntry[] = [
    { label: "New folder", icon: <NewFolderArt size={16} />, run: () => manager.open({ kind: "new-folder" }) },
    { label: "New thread", icon: <NewThreadArt size={16} />, run: () => manager.open({ kind: "new-thread", groupKey: null }) },
    "separator",
    { label: "My Threads", icon: <ThreadsArt size={16} />, run: () => manager.open({ kind: "threads" }) },
    { label: "Recycle Bin", icon: <RecycleBinArt size={14} />, run: () => manager.open({ kind: "recycle-bin" }) },
    { label: "Media Player", icon: <MediaPlayerArt size={14} />, run: () => manager.open({ kind: "media-player" }) },
    "separator",
    { label: "Arrange icons", icon: <GridViewGlyph className="size-3.5" />, run: arrange },
    {
      label: "Tile windows",
      icon: <TileGlyph className="size-3.5" />,
      disabled: manager.windows.length === 0,
      run: tileWindows,
    },
  ];
  const canvasMenu = (event: MenuTrigger): MenuEntry[] => [
    ...commands.slice(0, 2),
    {
      label: "New note pad",
      icon: <NotePadGlyph className="size-3.5" />,
      run: () => addStickyNote({ left: event.clientX, top: event.clientY }),
    },
    ...commands.slice(2),
    "separator",
    ...viewMenuEntries(desktop),
  ];
  usePageBackgroundMenu(canvasRef, canvasMenu);

  const bottom = Math.max(
    ICON_CELL.height * 2,
    ...[...positions.values()].map((point) => point.y + ICON_CELL.height),
  );

  return (
    <div className="bbd-desktop flex flex-col">
      <div
        ref={canvasRef}
        className="relative flex-1"
        style={{ minHeight: bottom + 8 }}
        onPointerDown={beginMarquee}
        onKeyDown={onKeyDown}
        onContextMenu={(event) => menu.open(event, canvasMenu(event))}
      >
        {items.map((item) => (
          <DesktopIcon
            key={item.key}
            group={item}
            position={placed(item.key)}
            selected={selected.has(item.key)}
            onPointerDown={(event) => beginIconDrag(item.key, event)}
            menu={(single) => iconMenu(item.key, single)}
            onSelect={selectOnly(item.key)}
          />
        ))}
        {hasMore ? (
          <MoreIcon
            position={placed(MORE_KEY)}
            selected={selected.has(MORE_KEY)}
            onPointerDown={(event) => beginIconDrag(MORE_KEY, event)}
            onSelect={selectOnly(MORE_KEY)}
          />
        ) : null}
        {savedNotes.map((note) => {
          const key = NOTE_KEY_PREFIX + note.id;
          return (
            <NoteIcon
              key={key}
              note={note}
              position={placed(key)}
              selected={selected.has(key)}
              onPointerDown={(event) => beginIconDrag(key, event)}
              onSelect={selectOnly(key)}
            />
          );
        })}
        <RecycleBinIcon
          binRef={binRef}
          position={placed(RECYCLE_BIN_KEY)}
          selected={selected.has(RECYCLE_BIN_KEY)}
          onPointerDown={(event) => beginIconDrag(RECYCLE_BIN_KEY, event)}
          onSelect={selectOnly(RECYCLE_BIN_KEY)}
        />
        <div ref={marqueeRef} className="bbd-marquee" hidden aria-hidden />
      </div>
    </div>
  );
}
