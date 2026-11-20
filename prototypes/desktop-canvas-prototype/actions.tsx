import type { PointerEvent as ReactPointerEvent } from "react";
import { toast } from "sonner";
import type { experimental_useSidebarThreadActions as useSidebarThreadActions, PluginSidebarThread } from "@get-bb/plugin-sdk/app";
import { acceptsDrop, groupByEnvironment, type Collection } from "./canvas-organization";
import { errorMessage, type DesktopContextValue } from "./data";
import type { MenuEntry, useAskText } from "./menu";
import { windowId, type usePointerTracker, type WindowManager } from "./windows";

/** The thread, folder and view menus, and Desktop's thread drag. */

type SidebarThreadActions = ReturnType<typeof useSidebarThreadActions>;
type AskText = ReturnType<typeof useAskText>;

export interface MenuContext {
  desktop: DesktopContextValue;
  manager: WindowManager;
  actions: SidebarThreadActions;
  ask: AskText;
}

const fail = (error: unknown) => void toast.error(errorMessage(error));

export function threadMenu({ desktop, actions, ask }: MenuContext, thread: PluginSidebarThread, from: Collection | null, options: { includeOpen?: boolean } = {}): MenuEntry[] {
  const fromFolderId = from?.kind === "folder" ? from.folder?.id ?? null : null;
  const targets = desktop.organization.targets.filter(
    (target) =>
      target.key !== from?.key &&
      !(target.kind === "folder" && target.folder?.threadIds.includes(thread.id)) &&
      !(target.kind !== "folder" && thread.sectionId === target.sectionId),
  );
  return [
    ...(options.includeOpen === false ? [] : [{ label: "Open", icon: "AppWindow", run: () => desktop.openThread(thread.id) }]),
    { label: "Open in bb", icon: "ExternalLink", run: () => actions.open(thread.id) },
    { label: "Open in split", icon: "Columns2", run: () => actions.open(thread.id, { split: true }) },
    ...(targets.length > 0
      ? ["separator" as const, {
          label: "Move to",
          icon: "MoveTo",
          submenu: targets.map((target): MenuEntry => ({
            label: target.kind === "threads" ? "Threads (no section)" : target.name,
            icon: target.icon,
            run: () => void desktop.dropThread(target, { threadId: thread.id, fromFolderId }),
          })),
        }]
      : []),
    ...(from?.kind === "folder" && from.folder !== undefined
      ? [{ label: `Remove from ${from.name}`, icon: "FolderMinus", run: () => void desktop.call("removeFromFolder", { folderId: from.folder!.id, threadId: thread.id }).then(desktop.refresh, fail) }]
      : []),
    "separator",
    { label: "Copy thread link", icon: "Copy", run: () => void copyThreadLink(thread) },
    { label: thread.isUnread ? "Mark as read" : "Mark as unread", icon: thread.isUnread ? "MailOpen" : "Mail", run: () => void actions.setRead(thread.id, thread.isUnread).catch(fail) },
    ...(thread.isArchived ? [] : [{ label: thread.isPinned ? "Unpin" : "Pin", icon: thread.isPinned ? "PinOff" : "Pin", run: () => void actions.setPinned(thread.id, !thread.isPinned).catch(fail) }]),
    {
      label: "Rename…",
      icon: "Edit",
      run: () =>
        void ask({ title: "Rename thread", label: "Thread name", initial: thread.displayTitle, confirm: "Rename" }).then((title) => {
          if (title && title !== thread.displayTitle) void actions.rename(thread.id, title).catch(fail);
        }),
    },
    "separator",
    thread.isArchived
      ? { label: "Restore", icon: "ArchiveRestore", run: () => void desktop.restoreThread(thread.id) }
      : { label: "Archive", icon: "Archive", run: () => desktop.archiveThread(thread.id) },
    { label: "Delete…", icon: "Trash2", run: () => actions.requestDelete(thread.id) },
  ];
}

async function copyThreadLink(thread: PluginSidebarThread) {
  try {
    await navigator.clipboard.writeText(new URL(thread.href, window.location.origin).toString());
    toast.success("Thread link copied");
  } catch (error) {
    toast.error(errorMessage(error));
  }
}

export function deletePrompt(groups: readonly Collection[]): string {
  const [only] = groups;
  if (groups.length === 1 && only !== undefined) {
    return only.kind === "folder" ? `Delete “${only.name}”? Threads inside are kept.` : `Delete the “${only.name}” section? Its threads move to Threads.`;
  }
  return `Delete these ${groups.length} folders? Threads inside desktop folders are kept, and threads in deleted sections move to Threads.`;
}

/** Deletes desktop folders and sections after one confirmation, closing their windows. */
export function deleteGroups({ desktop, manager }: Pick<MenuContext, "desktop" | "manager">, groups: readonly Collection[]): boolean {
  if (groups.length === 0) {
    toast("Only desktop folders and sections can be deleted.");
    return false;
  }
  if (!window.confirm(deletePrompt(groups))) return false;
  for (const group of groups) {
    manager.close(windowId({ kind: "finder", key: group.key }));
    if (group.kind === "folder" && group.folder !== undefined) void desktop.call("deleteFolder", { id: group.folder.id }).then(desktop.refresh, fail);
    else if (group.kind === "section" && group.sectionId) void desktop.call("deleteSection", { id: group.sectionId }).then(desktop.refresh, fail);
  }
  return true;
}

export const canStartThread = (group: Collection) => group.kind === "section" || group.kind === "threads" || group.kind === "project" || group.kind === "folder";

export function groupMenu(context: MenuContext, group: Collection, open: () => void, newThread: (group: Collection) => void): MenuEntry[] {
  const { desktop, ask } = context;
  const openEntry: MenuEntry = { label: "Open", icon: "FolderOpen", run: open };
  const startThread: MenuEntry[] = canStartThread(group) ? [{ label: `New thread in ${group.name}`, icon: "MessageSquarePlus", run: () => newThread(group) }] : [];
  if (group.kind === "folder" && group.folder !== undefined) {
    const folder = group.folder;
    return [
      openEntry,
      ...startThread,
      "separator",
      {
        label: "Rename…",
        icon: "Edit",
        run: () =>
          void ask({ title: "Rename folder", label: "Folder name", initial: group.name, confirm: "Rename" }).then((name) => {
            if (name && name !== group.name) void desktop.call("renameFolder", { id: folder.id, name }).then(desktop.refresh, fail);
          }),
      },
      { label: "Delete folder", icon: "Trash2", run: () => void deleteGroups(context, [group]) },
    ];
  }
  if (group.kind === "section" && group.sectionId) {
    const sectionId = group.sectionId;
    return [
      openEntry,
      ...startThread,
      "separator",
      {
        label: "Rename section…",
        icon: "Edit",
        run: () =>
          void ask({ title: "Rename section", label: "Section name", initial: group.name, confirm: "Rename" }).then((name) => {
            if (name && name !== group.name) void desktop.call("renameSection", { id: sectionId, name }).catch(fail);
          }),
      },
      { label: "Delete section", icon: "Trash2", run: () => void deleteGroups(context, [group]) },
    ];
  }
  return [openEntry, ...startThread];
}

const ORGANIZE = [["chronological", "Custom"], ["project", "By project"], ["machine", "By machine"]] as const;
const SORT = [["updated", "Updated at"], ["created", "Created at"], ["alpha", "Alphabetical"]] as const;

/**
 * The sidebar's own View options: what changes here changes the sidebar too, and the canvas follows. Built from live
 * state, so the menu can stay open while you flip several options.
 */
export function viewMenuEntries(desktop: DesktopContextValue, arrange: () => void): MenuEntry[] {
  const p = desktop.preferences;
  const update = desktop.updatePreferences;
  const sort = p.chronologicalSort === "none" ? "updated" : p.chronologicalSort;
  return [
    {
      label: "Organize",
      icon: "Layers",
      submenu: [
        ...ORGANIZE.map(([value, label]): MenuEntry => ({ label, checked: p.organizationMode === value, keepOpen: true, run: () => update({ organizationMode: value }) })),
        "separator",
        { label: "By environment", checked: groupByEnvironment(p), keepOpen: true, run: () => update({ environmentGrouping: !groupByEnvironment(p) }) },
        { label: "Provider icons", checked: p.showProviderIcons, keepOpen: true, run: () => update({ showProviderIcons: !p.showProviderIcons }) },
      ],
    },
    {
      label: "Sort by",
      icon: "ArrowUpDown",
      submenu: SORT.map(([value, label]): MenuEntry => {
        const selected = sort === value;
        const direction = p.sortDirection === "default" ? (value === "alpha" ? "ascending" : "descending") : p.sortDirection;
        const next = selected ? (direction === "ascending" ? "descending" : "ascending") : value === "alpha" ? "ascending" : "descending";
        return { label, checked: selected, hint: selected ? (direction === "ascending" ? "↑" : "↓") : undefined, keepOpen: true, run: () => update({ chronologicalSort: value, sortDirection: next }) };
      }),
    },
    {
      label: "Filter",
      icon: "SlidersHorizontal",
      submenu: (["active", "archived"] as const).map((value): MenuEntry => {
        const checked = p.threadLifecycles.includes(value);
        return {
          label: value === "active" ? "Active" : "Archived",
          checked,
          keepOpen: true,
          disabled: checked && p.threadLifecycles.length === 1,
          run: () => update({ threadLifecycles: checked ? p.threadLifecycles.filter((lifecycle) => lifecycle !== value) : [...p.threadLifecycles, value] }),
        };
      }),
    },
    {
      label: "Visible groups",
      icon: "Eye",
      submenu: desktop.organization.groups
        .filter((group) => group.key !== "pinned")
        .map((group): MenuEntry => {
          const visible = !p.hiddenGroups.includes(group.key);
          return {
            label: group.name,
            checked: visible,
            keepOpen: true,
            run: () => update({ hiddenGroups: visible ? [...p.hiddenGroups, group.key] : p.hiddenGroups.filter((key) => key !== group.key) }),
          };
        }),
    },
    { label: "Arrange like sidebar", icon: "GridView", run: arrange },
  ];
}

/** The drop key of the Recycle Bin, which archives a dropped thread. */
export const RECYCLE_BIN_DROP = "recycle-bin";

/** Marks an element as a place a dragged thread can land. */
export function threadDropTarget(group: Collection | null): { "data-thread-drop"?: string } {
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
