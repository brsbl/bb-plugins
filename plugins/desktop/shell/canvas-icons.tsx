import type { PointerEvent as ReactPointerEvent, RefObject } from "react";
import { FolderArt, NotePadArt, RecycleBinArt, TrashGlyph } from "../art";
import { groupThreads, type DesktopGroup, type DesktopThread, type Point } from "../core";
import { noteTitle, openNote, removeNote, type StickyNote } from "../page/sticky-notes";
import { folderSummary, groupTone } from "../programs/threads/status";
import { StatusDot } from "../programs/threads/status-ui";
import { useWindowManager } from "../windows";
import { useDesktop, type DesktopContextValue } from "./data";
import { useMenu, type MenuEntry } from "./menu";
import { groupMenu } from "./menus";
import { RECYCLE_BIN_DROP, threadDropTarget } from "./thread-drag";

export const RECYCLE_BIN_KEY = "recycle-bin";
export const MORE_KEY = "more";
export const NOTE_KEY_PREFIX = "note:";

/** What every desktop icon shares: the canvas owns its position, selection, and drag. */
interface IconProps {
  position: Point;
  selected: boolean;
  onPointerDown: (event: ReactPointerEvent<HTMLDivElement>) => void;
  /** Selects the icon before its menu opens, unless it is already part of the selection. */
  onSelect: () => void;
}

export function DesktopIcon({
  group,
  position,
  selected,
  onPointerDown,
  onSelect,
  menu: selectionMenu,
}: IconProps & {
  group: DesktopGroup;
  /** Widens the icon's own menu to the whole selection when several icons are selected. */
  menu: (single: MenuEntry[]) => MenuEntry[];
}) {
  const desktop = useDesktop();
  const manager = useWindowManager();
  const menu = useMenu();

  const open = () => manager.open({ kind: "finder", key: group.key });

  const members = groupThreads(group, desktop.visibleThreads);
  const { tone, toneCount } = groupTone(members);
  const summary = folderSummary(group.name, members.length, tone, toneCount);

  return (
    <div
      role="button"
      tabIndex={0}
      aria-selected={selected}
      aria-label={summary}
      title={summary}
      className="bbd-icon"
      data-desktop-key={group.key}
      style={{ left: position.x, top: position.y }}
      onPointerDown={onPointerDown}
      onDoubleClick={open}
      onKeyDown={(event) => {
        if (event.key === "Enter") open();
      }}
      onContextMenu={(event) => {
        onSelect();
        menu.open(event, selectionMenu(groupMenu(desktop, manager, group, open)));
      }}
      {...threadDropTarget(group)}
    >
      <span className="bbd-icon-art">
        <FolderArt kind={group.kind} empty={members.length === 0} />
        <StatusDot members={members} />
      </span>
      <span className="bbd-icon-label">{group.name}</span>
    </div>
  );
}

function moreMembers(desktop: DesktopContextValue): DesktopThread[] {
  const byId = new Map(
    desktop.moreGroups.flatMap((group) => groupThreads(group, desktop.visibleThreads)).map((thread) => [thread.id, thread]),
  );
  return [...byId.values()];
}

export function MoreIcon({ position, selected, onPointerDown, onSelect }: IconProps) {
  const desktop = useDesktop();
  const manager = useWindowManager();
  const menu = useMenu();
  const open = () => manager.open({ kind: "more" });
  const members = moreMembers(desktop);
  const { tone, toneCount } = groupTone(members);
  const count = desktop.moreGroups.length;
  const summary = `${folderSummary("More", members.length, tone, toneCount)} · ${count} ${count === 1 ? "folder" : "folders"} hidden in the sidebar`;
  return (
    <div
      role="button"
      tabIndex={0}
      aria-selected={selected}
      aria-label={summary}
      title={summary}
      className="bbd-icon"
      data-desktop-key={MORE_KEY}
      style={{ left: position.x, top: position.y }}
      onPointerDown={onPointerDown}
      onDoubleClick={open}
      onKeyDown={(event) => {
        if (event.key === "Enter") open();
      }}
      onContextMenu={(event) => {
        onSelect();
        menu.open(event, [{ label: "Open", run: open }]);
      }}
    >
      <span className="bbd-icon-art">
        <FolderArt kind="section" empty={count === 0} />
        <StatusDot members={members} />
      </span>
      <span className="bbd-icon-label">More</span>
    </div>
  );
}

export function NoteIcon({ note, position, selected, onPointerDown, onSelect }: IconProps & { note: StickyNote }) {
  const menu = useMenu();
  const title = noteTitle(note);
  const open = () => openNote(note.id);
  return (
    <div
      role="button"
      tabIndex={0}
      aria-selected={selected}
      aria-label={`Note pad — ${title}`}
      title={title}
      className="bbd-icon"
      data-desktop-key={NOTE_KEY_PREFIX + note.id}
      style={{ left: position.x, top: position.y }}
      onPointerDown={onPointerDown}
      onDoubleClick={open}
      onKeyDown={(event) => {
        if (event.key === "Enter") open();
      }}
      onContextMenu={(event) => {
        onSelect();
        menu.open(event, [
          { label: "Open", run: open },
          "separator",
          { label: "Delete", icon: <TrashGlyph className="size-3.5" />, run: () => removeNote(note.id) },
        ]);
      }}
    >
      <span className="bbd-icon-art">
        <NotePadArt />
      </span>
      <span className="bbd-icon-label">{title}</span>
    </div>
  );
}

/**
 * Dragged threads land here through `data-thread-drop`, and dragged icons through `binRef`; both mark it as the
 * drop target imperatively while they are over it.
 */
export function RecycleBinIcon({
  binRef,
  position,
  selected,
  onPointerDown,
  onSelect,
}: IconProps & { binRef: RefObject<HTMLDivElement | null> }) {
  const desktop = useDesktop();
  const manager = useWindowManager();
  const menu = useMenu();
  const open = () => manager.open({ kind: "recycle-bin" });
  const count = desktop.archivedThreads.length;
  const summary =
    count === 0 ? "Recycle Bin — empty" : `Recycle Bin — ${count} archived ${count === 1 ? "thread" : "threads"}`;

  return (
    <div
      ref={binRef}
      role="button"
      tabIndex={0}
      aria-selected={selected}
      aria-label={summary}
      title={summary}
      className="bbd-icon"
      data-desktop-key={RECYCLE_BIN_KEY}
      data-thread-drop={RECYCLE_BIN_DROP}
      style={{ left: position.x, top: position.y }}
      onPointerDown={onPointerDown}
      onDoubleClick={open}
      onKeyDown={(event) => {
        if (event.key === "Enter") open();
      }}
      onContextMenu={(event) => {
        onSelect();
        menu.open(event, [{ label: "Open", run: open }]);
      }}
    >
      <span className="bbd-icon-art">
        <RecycleBinArt full={count > 0} />
      </span>
      <span className="bbd-icon-label">Recycle Bin</span>
    </div>
  );
}
