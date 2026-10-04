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
  nextFreePosition,
  sortThreads,
  tileRects,
  type DesktopGroup,
  type DesktopThread,
  type Point,
  type SortKey,
} from "../core";
import { addStickyNote, removeNote, takeRemovedNoteIds } from "../page/sticky-notes";
import { usePointerTracker, useWindowManager, windowId, workAreaRect, type DesktopWindow } from "../windows";
import { DesktopIcon, MoreIcon, NoteIcon, RecycleBinIcon } from "./canvas-icons";
import { MORE_KEY, NOTE_KEY_PREFIX, RECYCLE_BIN_KEY, useDesktopEntries } from "./desktop-entries";
import { errorMessage, useDesktop } from "./data";
import { useMenu, type MenuEntry, type MenuTrigger } from "./menu";
import { viewMenuEntries } from "./menus";
import { usePageBackgroundMenu } from "./page-menu";
import { useWindowShortcuts } from "./window-shortcuts";

const ICON_BOX = { width: 88, height: 84 } as const;

function groupSortValue(
  group: DesktopGroup,
  members: readonly DesktopThread[],
  key: SortKey,
): number | string {
  if (key === "alpha") return group.name.toLocaleLowerCase();
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

function deletePrompt(groups: DesktopGroup[], notePads: number): string {
  const [only] = groups;
  if (groups.length === 1 && notePads === 0 && only !== undefined) {
    return only.kind === "folder"
      ? `Delete “${only.name}”? Threads inside are kept.`
      : `Delete the “${only.name}” section? Its threads move to Threads.`;
  }
  return `Delete these ${groups.length + notePads} items? Threads inside folders are kept, and threads in deleted sections move to Threads.`;
}

/** A position this tab saved, shown until a snapshot requested after the save finished carries it. */
interface SavedPosition {
  point: Point;
  savedAt: number | null;
}

/**
 * The icon grid on bb's homepage: folders and sections, note pads, More, and the Recycle Bin. Icons drag as a
 * selection, a marquee selects, and positions persist through the `setLayout` RPC.
 */
export function DesktopCanvas() {
  const { cycle, canCycle } = useWindowShortcuts();
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
  const [overrides, setOverrides] = useState<Record<string, SavedPosition>>({});

  useEffect(() => {
    const element = canvasRef.current;
    if (element === null) return;
    const observer = new ResizeObserver(([entry]) => {
      if (entry !== undefined) setWidth(entry.contentRect.width);
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  // A snapshot requested before a save finished can arrive after it, so a position stays until the server has it.
  useEffect(() => {
    setOverrides((current) => {
      const pending = Object.entries(current).filter(
        ([, saved]) => saved.savedAt === null || saved.savedAt >= desktop.snapshotRequestedAt,
      );
      return pending.length === Object.keys(current).length ? current : Object.fromEntries(pending);
    });
  }, [desktop.snapshotRequestedAt]);

  const entries = useDesktopEntries();
  const items = useMemo(() => entries.flatMap((entry) => entry.kind === "group" ? [entry.group] : []), [entries]);
  const hasMore = entries.some((entry) => entry.kind === "more");
  const noteKeys = useMemo(() => entries.filter((entry) => entry.kind === "note").map((entry) => entry.key), [entries]);

  // Forget the icon positions of note pads deleted in this tab, including from a thread page while the desktop was away.
  useEffect(() => {
    const removed = takeRemovedNoteIds();
    if (removed.length === 0) return;
    const entries = Object.fromEntries(removed.map((id) => [NOTE_KEY_PREFIX + id, null]));
    void call("setLayout", { entries }).catch(() => undefined);
  }, [call, entries]);

  const keys = useMemo(
    () => entries.map((entry) => entry.key),
    [entries],
  );

  const positions = useMemo(() => {
    const placed = new Map<string, Point>();
    for (const key of keys) {
      const point = overrides[key]?.point ?? snapshot.layout[key];
      if (point !== undefined) placed.set(key, { x: Math.max(0, Math.min(point.x, width - ICON_BOX.width)), y: Math.max(0, point.y) });
    }
    for (const key of keys) {
      if (placed.has(key)) continue;
      placed.set(key, nextFreePosition([...placed.values()], width));
    }
    return placed;
  }, [keys, overrides, snapshot.layout, width]);

  const { refresh } = desktop;
  const saveLayout = useCallback(
    (entries: Record<string, Point>) => {
      const saving: Record<string, SavedPosition> = Object.fromEntries(
        Object.entries(entries).map(([key, point]) => [key, { point, savedAt: null }]),
      );
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
      void call("setLayout", { entries }).then(
        () => {
          settle(Date.now());
          refresh();
        },
        (error) => {
          settle(null);
          toast.error(errorMessage(error));
        },
      );
    },
    [call, refresh],
  );

  const deletableIn = (keySet: ReadonlySet<string>) =>
    items.filter((group) => keySet.has(group.key) && isDeletable(group));

  const noteIdsIn = (keySet: ReadonlySet<string>) =>
    [...keySet].filter((key) => key.startsWith(NOTE_KEY_PREFIX)).map((key) => key.slice(NOTE_KEY_PREFIX.length));

  const deleteGroups = (groups: DesktopGroup[], noteIds: readonly string[] = []) => {
    if (groups.length === 0 && noteIds.length === 0) {
      toast("Only folders and sections can be deleted.");
      return;
    }
    // Ask before deleting anything, so cancelling keeps the selected note pads too.
    if (groups.length > 0 && !window.confirm(deletePrompt(groups, noteIds.length))) return;
    for (const id of noteIds) removeNote(id);
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
        deleteGroups(deletableIn(moving), noteIdsIn(moving));
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
      deleteGroups(deletableIn(selected), noteIdsIn(selected));
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
    const valueOf = (group: DesktopGroup) => groupSortValue(group, desktop.membersOf(group), sort.key);
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
    { label: "Next window (Ctrl+`)", disabled: !canCycle, run: () => cycle(1) },
    { label: "Previous window (Ctrl+Shift+`)", disabled: !canCycle, run: () => cycle(-1) },
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
        {entries.map((entry) => {
          const props = {
            position: placed(entry.key),
            selected: selected.has(entry.key),
            onPointerDown: (event: ReactPointerEvent<HTMLDivElement>) => beginIconDrag(entry.key, event),
            onSelect: selectOnly(entry.key),
          };
          switch (entry.kind) {
            case "group":
              return <DesktopIcon key={entry.key} group={entry.group} menu={(single) => iconMenu(entry.key, single)} {...props} />;
            case "more":
              return <MoreIcon key={entry.key} {...props} />;
            case "note":
              return <NoteIcon key={entry.key} note={entry.note} {...props} />;
            case "recycle-bin":
              return <RecycleBinIcon key={entry.key} binRef={binRef} {...props} />;
          }
        })}
        <div ref={marqueeRef} className="bbd-marquee" hidden aria-hidden />
      </div>
    </div>
  );
}
