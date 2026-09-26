import { useMemo, useState } from "react";
import { experimental_useSidebarThreadActions as useSidebarThreadActions } from "@get-bb/plugin-sdk/app";
import { BuddyListArt, DetailsArt, StatusIcon, ThreadArt } from "../../art";
import type { DesktopThread } from "../../core";
import { useDesktop, type DesktopContextValue } from "../../shell/data";
import { useMenu } from "../../shell/menu";
import { threadMenu } from "../../shell/menus";
import { WindowFrame, useWindowManager, type DesktopWindow } from "../../windows";
import { describeStatus, idleFor, relativeTime, sortBuddies, statusKind } from "./status";

/** An AIM Buddy List of the threads in one thread's project or environment, grouped by desktop folder. */

type BuddyScope = "project" | "environment";

interface BuddyGroup {
  key: string;
  name: string;
  threads: DesktopThread[];
  total: number;
}


export function buddyListTitle(desktop: DesktopContextValue, threadId: string): string {
  const projectId = desktop.threadById.get(threadId)?.projectId;
  const name = desktop.snapshot.projects.find((project) => project.id === projectId)?.name;
  return name === undefined ? "Buddy List" : `${name}'s Buddy List`;

export function BuddyListWindow({ window: desktopWindow, threadId }: { window: DesktopWindow; threadId: string }) {
  const desktop = useDesktop();
  const manager = useWindowManager();
  const actions = useSidebarThreadActions();
  const menu = useMenu();
  const thread = desktop.threadById.get(threadId);
  const environment = desktop.liveById.get(threadId)?.environment ?? null;
  const environmentId = environment?.id ?? null;
  const [scope, setScope] = useState<BuddyScope>("project");
  const [collapsed, setCollapsed] = useState<ReadonlySet<string>>(() => new Set(["offline"]));
  const [selectedId, setSelectedId] = useState(threadId);
  const activeScope: BuddyScope = environmentId === null ? "project" : scope;
  const projectName = desktop.snapshot.projects.find((project) => project.id === thread?.projectId)?.name ?? "Project";
  const environmentName = environment?.name ?? environment?.branchName ?? "Environment";

  const buddyGroups = useMemo((): BuddyGroup[] => {
    if (thread === undefined) return [];
    const members = desktop.threads.filter(
      (candidate) =>
        candidate.projectId === thread.projectId &&
        (activeScope === "project" || desktop.liveById.get(candidate.id)?.environment?.id === environmentId),
    );
    const filed = new Set<string>();
    const group = (key: string, name: string, threads: DesktopThread[]): BuddyGroup => ({
      key,
      name,
      threads: sortBuddies(threads.filter((candidate) => !candidate.isArchived)),
      total: threads.length,
    });
    const folders = desktop.groups.flatMap((candidate): BuddyGroup[] => {
      if (candidate.kind !== "folder") return [];
      const inFolder = members.filter((member) => candidate.folder.threadIds.includes(member.id));
      for (const member of inFolder) filed.add(member.id);
      return inFolder.length === 0 ? [] : [group(candidate.key, candidate.name, inFolder)];
    });
    const unfiled = members.filter((candidate) => !filed.has(candidate.id));
    const offline = members.filter((candidate) => candidate.isArchived);
    return [
      ...folders,
      ...(unfiled.length > 0 ? [group("buddies", "Buddies", unfiled)] : []),
      ...(offline.length > 0
        ? [{ key: "offline", name: "Offline", threads: sortBuddies(offline), total: offline.length }]
        : []),
    ];
  }, [activeScope, desktop.groups, desktop.liveById, desktop.threads, environmentId, thread]);
  const onlineCount = new Set(
    buddyGroups.flatMap((group) => group.key === "offline" ? [] : group.threads.map((buddy) => buddy.id)),
  ).size;

  const selected = desktop.threadById.get(selectedId);
  const toggleGroup = (key: string) =>
    setCollapsed((current) => {
      const next = new Set(current);
      if (!next.delete(key)) next.add(key);
      return next;
    });

  return (
    <WindowFrame window={desktopWindow} title={buddyListTitle(desktop, threadId)} icon={<BuddyListArt size={16} />}>
      <div className="bbd-buddies flex h-full flex-col">
        <div className="bbd-buddies-banner flex-none">
          <BuddyListArt size={48} />
          <div className="min-w-0">
            <p className="bbd-buddies-brand">bb Messenger</p>
            <p className="truncate">{activeScope === "project" ? projectName : environmentName}</p>
          </div>
        </div>
        <p className="bbd-buddies-online flex-none">Online ({onlineCount})</p>
        {environmentId === null ? null : (
          <div className="bbd-buddies-tabs flex-none" role="tablist" aria-label="Buddy List scope">
            {(["project", "environment"] as const).map((value) => (
              <button
                key={value}
                type="button"
                role="tab"
                className="bbd-buddies-tab"
                aria-selected={activeScope === value}
                onClick={() => setScope(value)}
              >
                {value === "project" ? "Project" : "Environment"}
              </button>
            ))}
          </div>
        )}
        <div className="bbd-buddies-list min-h-0 flex-1 overflow-auto">
          {thread === undefined ? (
            <p className="p-3 text-xs text-muted-foreground">This thread is not available.</p>
          ) : (
            buddyGroups.map((group) => {
              const open = !collapsed.has(group.key);
              return (
                <section key={group.key}>
                  <button
                    type="button"
                    className="bbd-buddies-group"
                    aria-expanded={open}
                    title={
                      group.key === "offline"
                        ? "Archived threads"
                        : `${group.threads.length} of ${group.total} not archived`
                    }
                    onClick={() => toggleGroup(group.key)}
                  >
                    <span className="bbd-buddies-caret" aria-hidden data-open={open} />
                    <span className="truncate">{group.name}</span>
                    <span className="text-muted-foreground">
                      {group.key === "offline" ? `(${group.total})` : `(${group.threads.length}/${group.total})`}
                    </span>
                  </button>
                  {open ? (
                    <ul className="bbd-buddies-rows">
                      {group.threads.map((buddy) => {
                        const kind = statusKind(buddy);
                        return (
                          <li key={buddy.id}>
                            <button
                              type="button"
                              className="bbd-buddy"
                              aria-current={buddy.id === threadId ? "true" : undefined}
                              data-selected={buddy.id === selectedId}
                              data-dim={kind === "idle" || kind === "archived"}
                              data-bold={buddy.isUnread || kind === "attention"}
                              title={`${buddy.title}\n${describeStatus(buddy)} · last activity ${relativeTime(buddy.updatedAt)}`}
                              onClick={() => setSelectedId(buddy.id)}
                              onDoubleClick={() => desktop.openThread(buddy.id)}
                              onKeyDown={(event) => {
                                if (event.key !== "Enter") return;
                                event.preventDefault();
                                desktop.openThread(buddy.id);
                              }}
                              onContextMenu={(event) => {
                                setSelectedId(buddy.id);
                                menu.open(event, threadMenu(desktop, manager, actions, buddy, null));
                              }}
                            >
                              <StatusIcon kind={kind} size={14} />
                              <span className="min-w-0 flex-1 truncate">{buddy.title}</span>
                              {kind === "idle" ? <span className="bbd-buddy-idle">({idleFor(buddy.updatedAt)})</span> : null}
                            </button>
                          </li>
                        );
                      })}
                    </ul>
                  ) : null}
                </section>
              );
            })
          )}
        </div>
        <div className="bbd-im-actions flex-none">
          <button
            type="button"
            className="bbd-im-action"
            disabled={selected === undefined}
            title="Open the selected thread"
            onClick={() => desktop.openThread(selectedId)}
          >
            <ThreadArt size={22} />
            <span>IM</span>
          </button>
          <button
            type="button"
            className="bbd-im-action"
            disabled={selected === undefined}
            title="Info for the selected thread"
            onClick={() => manager.open({ kind: "panel", threadId: selectedId })}
          >
            <DetailsArt size={24} />
            <span>Info</span>
          </button>
        </div>
      </div>
    </WindowFrame>
  );
}
