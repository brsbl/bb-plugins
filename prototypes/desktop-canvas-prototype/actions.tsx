import type { PointerEvent as ReactPointerEvent } from "react";
import { toast } from "sonner";
import type { experimental_useSidebarThreadActions as useSidebarThreadActions } from "@get-bb/plugin-sdk/app";
import { acceptsDrop, type DesktopGroup, type DesktopThread, type Organize, type SortKey } from "./core";
import { errorMessage, type DesktopContextValue } from "./data";
import type { MenuEntry, useAskText } from "./menu";
import { windowId, type usePointerTracker, type WindowManager } from "./windows";

/** The thread, folder and view menus Desktop offers, and its thread drag. */

type SidebarThreadActions = ReturnType<typeof useSidebarThreadActions>;
type AskText = ReturnType<typeof useAskText>;

export interface MenuContext {
  desktop: DesktopContextValue;
  manager: WindowManager;
  actions: SidebarThreadActions;
  ask: AskText;
}

export function threadMenu({ desktop, actions, ask }: MenuContext, thread: DesktopThread, group: DesktopGroup | null, options: { includeOpen?: boolean } = {}): MenuEntry[] {
  const fromFolderId = group?.kind === "folder" ? group.folder.id : null;
  const targets = desktop.groups.filter(
    (candidate) =>
      acceptsDrop(candidate) &&
      candidate.key !== group?.key &&
      !(candidate.kind === "folder" && candidate.folder.threadIds.includes(thread.id)) &&
      !(candidate.kind === "section" && thread.sectionId === candidate.id),
  );
  const fail = (error: unknown) => void toast.error(errorMessage(error));
  return [
    ...(options.includeOpen === false ? [] : [{ label: "Open", icon: "AppWindow", run: () => desktop.openThread(thread.id) }]),
    { label: "Open in bb", icon: "ExternalLink", run: () => actions.open(thread.id) },
    { label: "Open in split", icon: "Columns2", run: () => actions.open(thread.id, { split: true }) },
    ...(targets.length > 0
      ? ["separator" as const, {
          label: "Move to",
          icon: "MoveTo",
          submenu: targets.map((target): MenuEntry => ({
            label: target.name,
            icon: target.kind === "section" ? "Folder" : "Folder02",
            run: () => void desktop.dropThread(target, { threadId: thread.id, fromFolderId }),
          })),
        }]
      : []),
    ...(group?.kind === "folder"
      ? [{ label: `Remove from ${group.name}`, icon: "FolderMinus", run: () => void desktop.call("removeFromFolder", { folderId: group.folder.id, threadId: thread.id }).then(desktop.refresh, fail) }]
      : []),
    "separator",
    { label: "Copy thread link", icon: "Copy", run: () => void copyThreadLink(thread) },
    { label: thread.isUnread ? "Mark as read" : "Mark as unread", icon: thread.isUnread ? "MailOpen" : "Mail", run: () => void actions.setRead(thread.id, thread.isUnread).catch(fail) },
    ...(thread.isArchived ? [] : [{ label: thread.isPinned ? "Unpin" : "Pin", icon: thread.isPinned ? "PinOff" : "Pin", run: () => void actions.setPinned(thread.id, !thread.isPinned).then(desktop.refresh, fail) }]),
    {
      label: "Rename…",
      icon: "Edit",
      run: () =>
        void ask({ title: "Rename thread", label: "Thread name", initial: thread.title, confirm: "Rename" }).then((title) => {
          if (title && title !== thread.title) void actions.rename(thread.id, title).then(desktop.refresh, fail);
        }),
    },
    "separator",
    thread.isArchived
      ? { label: "Restore", icon: "ArchiveRestore", run: () => void desktop.restoreThread(thread.id) }
      : { label: "Archive", icon: "Archive", run: () => desktop.archiveThread(thread.id) },
    { label: "Delete…", icon: "Trash2", run: () => actions.requestDelete(thread.id) },
  ];
}

function threadLink(thread: DesktopThread): string {
  const path = thread.projectId === "proj_personal" ? `/threads/${thread.id}` : `/projects/${encodeURIComponent(thread.projectId)}/threads/${thread.id}`;
  return new URL(path, window.location.origin).toString();
}

async function copyThreadLink(thread: DesktopThread) {
  try {
    await navigator.clipboard.writeText(threadLink(thread));
    toast.success("Thread link copied");
  } catch (error) {
    toast.error(errorMessage(error));
  }
}

export function deletePrompt(groups: readonly DesktopGroup[]): string {
  const [only] = groups;
  if (groups.length === 1 && only !== undefined) {
    return only.kind === "folder" ? `Delete “${only.name}”? Threads inside are kept.` : `Delete the “${only.name}” section? Its threads move to Threads.`;
  }
  return `Delete these ${groups.length} folders? Threads inside desktop folders are kept, and threads in deleted sections move to Threads.`;
}

/** Deletes desktop folders and sections after one confirmation, closing their windows. */
export function deleteGroups({ desktop, manager }: Pick<MenuContext, "desktop" | "manager">, groups: readonly DesktopGroup[]): boolean {
  if (groups.length === 0) {
    toast("Only desktop folders and sections can be deleted.");
    return false;
  }
  if (!window.confirm(deletePrompt(groups))) return false;
  const fail = (error: unknown) => void toast.error(errorMessage(error));
  for (const group of groups) {
    manager.close(windowId({ kind: "finder", key: group.key }));
    if (group.kind === "folder") void desktop.call("deleteFolder", { id: group.folder.id }).then(desktop.refresh, fail);
    else if (group.kind === "section" && group.id !== null) void desktop.call("deleteSection", { id: group.id }).then(desktop.refresh, fail);
  }
  return true;
}

export function groupMenu(context: MenuContext, group: DesktopGroup, open: () => void, newThread: (group: DesktopGroup) => void): MenuEntry[] {
  const { desktop, ask } = context;
  const fail = (error: unknown) => void toast.error(errorMessage(error));
  const startThread: MenuEntry = { label: `New thread in ${group.name}`, icon: "MessageSquarePlus", run: () => newThread(group) };
  if (group.kind === "folder") {
    return [
      { label: "Open", icon: "FolderOpen", run: open },
      startThread,
      "separator",
      {
        label: "Rename…",
        icon: "Edit",
        run: () =>
          void ask({ title: "Rename folder", label: "Folder name", initial: group.name, confirm: "Rename" }).then((name) => {
            if (name && name !== group.name) void desktop.call("renameFolder", { id: group.folder.id, name }).then(desktop.refresh, fail);
          }),
      },
      { label: "Delete folder", icon: "Trash2", run: () => void deleteGroups(context, [group]) },
    ];
  }
  if (group.kind === "section" && group.id !== null) {
    const sectionId = group.id;
    return [
      { label: "Open", icon: "FolderOpen", run: open },
      startThread,
      "separator",
      {
        label: "Rename section…",
        icon: "Edit",
        run: () =>
          void ask({ title: "Rename section", label: "Section name", initial: group.name, confirm: "Rename" }).then((name) => {
            if (name && name !== group.name) void desktop.call("renameSection", { id: sectionId, name }).then(desktop.refresh, fail);
          }),
      },
      { label: "Delete section", icon: "Trash2", run: () => void deleteGroups(context, [group]) },
    ];
  }
  return [{ label: "Open", icon: "FolderOpen", run: open }, ...(group.kind === "machine" || group.kind === "pinned" ? [] : [startThread])];
}

const ORGANIZE_LABELS: Record<Organize, string> = { section: "Sections", project: "Projects", machine: "Machines" };
const SORT_LABELS: Record<SortKey, string> = { updated: "Updated at", created: "Created at", alpha: "Alphabetical" };

export function viewMenuEntries(desktop: DesktopContextValue): MenuEntry[] {
  const { preferences } = desktop.snapshot;
  return [
    {
      label: "Organize by",
      icon: "Layers",
      submenu: [
        { label: "Same as sidebar", checked: preferences.organize === "sidebar", run: () => desktop.setPreferences({ organize: "sidebar" }) },
        ...(["section", "project", "machine"] as const).map((organize) => ({
          label: ORGANIZE_LABELS[organize],
          checked: preferences.organize === organize,
          run: () => desktop.setPreferences({ organize }),
        })),
      ],
    },
    {
      label: "Sort by",
      icon: "Sort",
      submenu: [
        { label: "Same as sidebar", checked: preferences.sort === "sidebar", run: () => desktop.setPreferences({ sort: "sidebar" }) },
        ...(["updated", "created", "alpha"] as const).map((sort) => ({ label: SORT_LABELS[sort], checked: preferences.sort === sort, run: () => desktop.setPreferences({ sort }) })),
      ],
    },
  ];
}

/** The drop key of the Recycle Bin, which archives a dropped thread. */
export const RECYCLE_BIN_DROP = "recycle-bin";

/** Marks an element as a place a dragged thread can land. */
export function threadDropTarget(group: DesktopGroup | null): { "data-thread-drop"?: string } {
  return group !== null && acceptsDrop(group) ? { "data-thread-drop": group.key } : {};
}

/**
 * Drags a thread with a floating label onto the topmost `[data-thread-drop]` under the pointer, skipping targets a
 * higher window covers. Calls `onDrop` with the target's key when the drag ends over one.
 */
export function beginThreadDrag(event: ReactPointerEvent<HTMLElement>, title: string, track: ReturnType<typeof usePointerTracker>, onDrop: (key: string) => void) {
  const source = event.currentTarget;
  const origin = { x: event.clientX, y: event.clientY };
  const layer = (element: Element) => Number(element.closest<HTMLElement>(".cdc-window")?.style.zIndex ?? 0);
  let targets: { element: HTMLElement; key: string; rect: DOMRect; z: number }[] = [];
  let windows: { rect: DOMRect; z: number }[] = [];
  const preview = document.createElement("div");
  preview.className = "cdc-thread-drag-preview";
  preview.textContent = title;
  let target: (typeof targets)[number] | undefined;
  track(event, (delta) => {
    if (!preview.isConnected) {
      // Measured once the drag starts, after the press has settled any focus changes.
      targets = Array.from(document.querySelectorAll<HTMLElement>("[data-thread-drop]"))
        .map((element) => ({ element, key: element.dataset.threadDrop!, rect: element.getBoundingClientRect(), z: layer(element) }))
        .sort((a, b) => b.z - a.z);
      windows = Array.from(document.querySelectorAll<HTMLElement>(".cdc-window")).map((element) => ({ rect: element.getBoundingClientRect(), z: Number(element.style.zIndex) || 0 }));
      document.body.append(preview);
      source.style.opacity = "0.5";
    }
    const x = origin.x + delta.x;
    const y = origin.y + delta.y;
    const inside = (rect: DOMRect) => x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom;
    const topZ = Math.max(0, ...windows.filter(({ rect }) => inside(rect)).map(({ z }) => z));
    const next = targets.find(({ rect, z }) => z >= topZ && inside(rect));
    preview.style.transform = `translate(${x + 12}px, ${y + 12}px)`;
    if (target !== next) {
      if (target) target.element.dataset.dropTarget = "false";
      target = next;
      if (target) target.element.dataset.dropTarget = "true";
    }
  }, (cancelled, moved) => {
    source.style.opacity = "";
    preview.remove();
    if (target) target.element.dataset.dropTarget = "false";
    if (cancelled || !moved || !target) return;
    onDrop(target.key);
  });
}
