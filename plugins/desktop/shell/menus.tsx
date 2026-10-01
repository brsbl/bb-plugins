import { toast } from "sonner";
import type { experimental_useSidebarThreadActions as useSidebarThreadActions } from "@get-bb/plugin-sdk/app";
import { DetailsArt, ExternalLinkGlyph, NewThreadArt, TrashGlyph } from "../art";
import { acceptsDrop, type DesktopGroup, type DesktopThread, type Organize, type SortKey } from "../core";
import { windowId, type WindowManager } from "../windows";
import { errorMessage, type DesktopContextValue } from "./data";
import type { MenuEntry } from "./menu";

type SidebarThreadActions = ReturnType<typeof useSidebarThreadActions>;

export function threadMenu(
  desktop: DesktopContextValue,
  manager: WindowManager,
  actions: SidebarThreadActions,
  thread: DesktopThread,
  group: DesktopGroup | null,
): MenuEntry[] {
  const fromFolderId = group?.kind === "folder" ? group.folder.id : null;
  const targets = desktop.groups.filter(
    (candidate) =>
      acceptsDrop(candidate) &&
      candidate.key !== group?.key &&
      !(candidate.kind === "folder" && candidate.folder.threadIds.includes(thread.id)) &&
      !(candidate.kind === "section" && thread.sectionId === candidate.id),
  );
  return [
    { label: "Open", run: () => desktop.openThread(thread.id) },
    { label: "Open details", icon: <DetailsArt size={16} />, run: () => manager.open({ kind: "panel", threadId: thread.id }) },
    { label: "Open in bb", icon: <ExternalLinkGlyph className="size-3.5" />, run: () => actions.open(thread.id) },
    { label: "Open in split", run: () => actions.open(thread.id, { split: true }) },
    ...(targets.length > 0 ? ["separator" as const, { heading: "Move to" }] : []),
    ...targets.map((target): MenuEntry => ({
      label: target.name,
      run: () => void desktop.dropThread(target, { threadId: thread.id, fromFolderId }),
    })),
    ...(group?.kind === "folder"
      ? [
          "separator" as const,
          {
            label: `Remove from ${group.name}`,
            run: () =>
              void desktop
                .call("removeFromFolder", { folderId: group.folder.id, threadId: thread.id })
                .catch((error) => toast.error(errorMessage(error))),
          },
        ]
      : []),
    "separator",
    { label: "Copy thread link", run: () => void copyThreadLink(thread) },
    {
      label: thread.isUnread ? "Mark as read" : "Mark as unread",
      run: () => void actions.setRead(thread.id, thread.isUnread).catch((error) => toast.error(errorMessage(error))),
    },
    ...(thread.isArchived
      ? []
      : [
          {
            label: thread.isPinned ? "Unpin" : "Pin",
            run: () =>
              void actions.setPinned(thread.id, !thread.isPinned).then(desktop.refresh, (error) => toast.error(errorMessage(error))),
          },
        ]),
    {
      label: "Rename…",
      run: () => {
        const title = window.prompt("Thread name", thread.title)?.trim();
        if (title && title !== thread.title) {
          void actions.rename(thread.id, title).then(desktop.refresh, (error) => toast.error(errorMessage(error)));
        }
      },
    },
    "separator",
    thread.isArchived
      ? { label: "Restore", run: () => void desktop.restoreThread(thread.id) }
      : { label: "Archive", run: () => desktop.archiveThread(thread.id) },
    { label: "Delete…", run: () => actions.requestDelete(thread.id) },
  ];
}

function threadLink(thread: DesktopThread): string {
  const path =
    thread.projectId === "proj_personal"
      ? `/threads/${thread.id}`
      : `/projects/${encodeURIComponent(thread.projectId)}/threads/${thread.id}`;
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

export function groupMenu(
  desktop: DesktopContextValue,
  manager: WindowManager,
  group: DesktopGroup,
  open: () => void,
): MenuEntry[] {
  const newThread: MenuEntry = {
    label: `New thread in ${group.name}`,
    icon: <NewThreadArt size={16} />,
    run: () => manager.open({ kind: "new-thread", groupKey: group.key }),
  };
  const fail = (error: unknown) => toast.error(errorMessage(error));
  if (group.kind === "folder") {
    return [
      { label: "Open", run: open },
      newThread,
      "separator",
      {
        label: "Rename…",
        run: () => {
          const name = window.prompt("Folder name", group.name)?.trim();
          if (name) void desktop.call("updateFolder", { id: group.folder.id, name }).catch(fail);
        },
      },
      {
        label: "Delete folder",
        icon: <TrashGlyph className="size-3.5" />,
        run: () => {
          if (!window.confirm(`Delete “${group.name}”? Threads inside are kept.`)) return;
          manager.close(windowId({ kind: "finder", key: group.key }));
          void desktop.call("deleteFolder", { id: group.folder.id }).catch(fail);
        },
      },
    ];
  }
  if (group.kind === "section" && group.id !== null) {
    const sectionId = group.id;
    return [
      { label: "Open", run: open },
      newThread,
      "separator",
      {
        label: "Rename section…",
        run: () => {
          const name = window.prompt("Section name", group.name)?.trim();
          if (name) void desktop.call("renameSection", { id: sectionId, name }).catch(fail);
        },
      },
      {
        label: "Delete section",
        icon: <TrashGlyph className="size-3.5" />,
        run: () => {
          if (!window.confirm(`Delete the “${group.name}” section? Its threads move to Threads.`)) return;
          manager.close(windowId({ kind: "finder", key: group.key }));
          void desktop.call("deleteSection", { id: sectionId }).catch(fail);
        },
      },
    ];
  }
  return [{ label: "Open", run: open }, ...(group.kind === "machine" ? [] : [newThread])];
}

const ORGANIZE_LABELS: Record<Organize, string> = {
  section: "Sections",
  project: "Projects",
  machine: "Machines",
};

const SORT_LABELS: Record<SortKey, string> = {
  updated: "Updated at",
  created: "Created at",
  alpha: "Alphabetical",
};

export function viewMenuEntries(desktop: DesktopContextValue): MenuEntry[] {
  const { preferences } = desktop.snapshot;
  return [
    { heading: "Organize by" },
    {
      label: "Same as sidebar",
      checked: preferences.organize === "sidebar",
      run: () => desktop.setPreferences({ organize: "sidebar" }),
    },
    ...(["section", "project", "machine"] as const).map((organize) => ({
      label: ORGANIZE_LABELS[organize],
      checked: preferences.organize === organize,
      run: () => desktop.setPreferences({ organize }),
    })),
    { heading: "Sort by" },
    {
      label: "Same as sidebar",
      checked: preferences.sort === "sidebar",
      run: () => desktop.setPreferences({ sort: "sidebar" }),
    },
    ...(["updated", "created", "alpha"] as const).map((sort) => ({
      label: SORT_LABELS[sort],
      checked: preferences.sort === sort,
      run: () => desktop.setPreferences({ sort }),
    })),
  ];
}
