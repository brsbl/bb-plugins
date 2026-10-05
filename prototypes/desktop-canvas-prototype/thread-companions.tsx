import { useMemo, useState, type ReactNode } from "react";
import { toast } from "sonner";
import {
  experimental_Icon as Icon,
  experimental_ProviderIcon as ProviderIcon,
  experimental_useProviders as useProviders,
  experimental_useSidebarThreadActions as useSidebarThreadActions,
  experimental_useSidebarThreadPullRequest as useSidebarThreadPullRequest,
  type PluginSidebarThread,
} from "@get-bb/plugin-sdk/app";
import { threadMenu } from "./actions";
import { Button } from "./components/ui/button";
import { describeStatus, relativeTime, statusTone } from "./core";
import { errorMessage, useDesktop } from "./data";
import { useMenu } from "./menu";
import { useMenuContext } from "./programs";
import { WindowFrame, useWindowManager, type DesktopWindow } from "./windows";

/**
 * A thread's companions, docked beside its window as Desktop docks Buddy Info and the Buddy List: its details, and the
 * other threads in its project or environment.
 */

export function idleFor(timestamp: number, now = Date.now()): string {
  const minutes = Math.max(0, Math.round((now - timestamp) / 60_000));
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.round(minutes / 60);
  return hours < 48 ? `${hours}h` : `${Math.round(hours / 24)}d`;
}

/** What a thread's agent is doing, as Desktop's status line says it. */
export function activityLine(thread: PluginSidebarThread, agent: string): string {
  if (thread.hasPendingInteraction) return `${agent} is waiting for your reply`;
  if (thread.isArchived) return "Archived";
  if (thread.status === "error") return `${agent} hit an error`;
  if (thread.status === "active" || thread.status === "starting") return `${agent} is working…`;
  if (thread.status === "stopping") return `${agent} is stopping…`;
  return `Idle for ${idleFor(thread.latestAttentionAt)}`;
}

export function useAgentName(providerId: string | undefined): string {
  const { providers } = useProviders();
  return providers.find((provider) => provider.id === providerId)?.displayName ?? "The agent";
}

/** Waiting threads first, then working, errored and idle; most recent first within each. */
function rank(thread: PluginSidebarThread): number {
  const tone = statusTone(thread);
  return tone === "attention" ? 0 : tone === "running" ? 1 : thread.status === "error" ? 2 : 3;
}

const sortRelated = (threads: readonly PluginSidebarThread[]) => [...threads].sort((a, b) => rank(a) - rank(b) || b.latestAttentionAt - a.latestAttentionAt);

function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="cdc-info-row">
      <span>{label}</span>
      <span>{children}</span>
    </div>
  );
}

function PullRequestRow({ threadId }: { threadId: string }) {
  const { pullRequest } = useSidebarThreadPullRequest(threadId);
  if (pullRequest === null) return null;
  return (
    <Row label="Pull request">
      <a href={pullRequest.url} target="_blank" rel="noreferrer">#{pullRequest.number} {pullRequest.title}</a> <small>({pullRequest.state})</small>
    </Row>
  );
}

export function InfoWindow({ window: desktopWindow, threadId }: { window: DesktopWindow; threadId: string }) {
  const desktop = useDesktop();
  const actions = useSidebarThreadActions();
  const thread = desktop.threadById.get(threadId);
  const agent = useAgentName(thread?.providerId);
  const fail = (error: unknown) => void toast.error(errorMessage(error));
  const section = thread?.sectionId ? desktop.organization.byKey.get(`section:${thread.sectionId}`)?.name : undefined;
  const folders = desktop.foldersOf(threadId);

  return (
    <WindowFrame window={desktopWindow} title="Info" icon="Info">
      {thread === undefined ? <div className="cdc-empty"><p>This thread isn’t available.</p></div> : (
        <div className="cdc-info">
          <header className="cdc-info-header">
            <ProviderIcon providerKind="agent" provider={{ id: thread.providerId }} />
            <div>
              <strong>{thread.displayTitle}</strong>
              <span>{activityLine(thread, agent)}</span>
            </div>
          </header>
          <div className="cdc-info-rows">
            <Row label="Status">{describeStatus(thread)}</Row>
            <Row label="Agent">{agent}</Row>
            <Row label="Project">{desktop.projectName(thread.projectId) || "No project"}</Row>
            {thread.environment?.branchName ? <Row label="Branch">{thread.environment.branchName}</Row> : null}
            {thread.environment?.name ? <Row label="Environment">{thread.environment.name}</Row> : null}
            {thread.host ? <Row label="Machine">{thread.host.name}</Row> : null}
            <PullRequestRow threadId={threadId} />
            <Row label="Section">{section ?? "None"}</Row>
            <Row label="Folders">{folders.length === 0 ? "None" : folders.join(", ")}</Row>
            <Row label="Created">{new Date(thread.createdAt).toLocaleString()}</Row>
            <Row label="Last activity">{relativeTime(thread.latestAttentionAt)}</Row>
          </div>
          <div className="cdc-info-actions">
            <Button size="sm" variant="secondary" onClick={() => actions.open(threadId)}><Icon name="ExternalLink" />Open in bb</Button>
            <Button size="sm" variant="ghost" onClick={() => void actions.setRead(threadId, thread.isUnread).catch(fail)}>{thread.isUnread ? "Mark read" : "Mark unread"}</Button>
            {thread.isArchived ? null : <Button size="sm" variant="ghost" onClick={() => void actions.setPinned(threadId, !thread.isPinned).catch(fail)}>{thread.isPinned ? "Unpin" : "Pin"}</Button>}
            {thread.isArchived
              ? <Button size="sm" variant="ghost" onClick={() => void desktop.restoreThread(threadId)}>Restore</Button>
              : <Button size="sm" variant="ghost" onClick={() => desktop.archiveThread(threadId)}>Archive</Button>}
          </div>
        </div>
      )}
    </WindowFrame>
  );
}

type Scope = "project" | "environment";

interface RelatedGroup {
  key: string;
  name: string;
  threads: PluginSidebarThread[];
  total: number;
}

/** The threads in a thread's project, or its environment, grouped by desktop folder, as Desktop's Buddy List. */
export function RelatedWindow({ window: desktopWindow, threadId }: { window: DesktopWindow; threadId: string }) {
  const desktop = useDesktop();
  const manager = useWindowManager();
  const context = useMenuContext();
  const menu = useMenu();
  const thread = desktop.threadById.get(threadId);
  const environmentId = thread?.environment?.id ?? null;
  const [scope, setScope] = useState<Scope>("project");
  const [collapsed, setCollapsed] = useState<ReadonlySet<string>>(() => new Set(["archived"]));
  const [selectedId, setSelectedId] = useState(threadId);
  const activeScope: Scope = environmentId === null ? "project" : scope;

  const groups = useMemo((): RelatedGroup[] => {
    if (thread === undefined) return [];
    const members = [...desktop.threadById.values()].filter(
      (candidate) =>
        !candidate.isHidden &&
        candidate.projectId === thread.projectId &&
        (activeScope === "project" || candidate.environment?.id === environmentId),
    );
    const filed = new Set<string>();
    const group = (key: string, name: string, threads: PluginSidebarThread[]): RelatedGroup => ({
      key,
      name,
      threads: sortRelated(threads.filter((candidate) => !candidate.isArchived)),
      total: threads.length,
    });
    const folders = desktop.organization.roots.flatMap((candidate): RelatedGroup[] => {
      if (candidate.kind !== "folder" || candidate.folder === undefined) return [];
      const inFolder = members.filter((member) => candidate.folder!.threadIds.includes(member.id));
      for (const member of inFolder) filed.add(member.id);
      return inFolder.length === 0 ? [] : [group(candidate.key, candidate.name, inFolder)];
    });
    const unfiled = members.filter((candidate) => !filed.has(candidate.id));
    const archived = members.filter((candidate) => candidate.isArchived);
    return [
      ...folders,
      ...(unfiled.length > 0 ? [group("threads", "Threads", unfiled)] : []),
      ...(archived.length > 0 ? [{ key: "archived", name: "Archived", threads: sortRelated(archived), total: archived.length }] : []),
    ];
  }, [activeScope, desktop.organization.roots, desktop.threadById, environmentId, thread]);

  const toggle = (key: string) =>
    setCollapsed((current) => {
      const next = new Set(current);
      if (!next.delete(key)) next.add(key);
      return next;
    });

  const scopeName = activeScope === "project" ? desktop.projectName(thread?.projectId ?? "") || "No project" : thread?.environment?.name ?? thread?.environment?.branchName ?? "Environment";

  return (
    <WindowFrame window={desktopWindow} title={scopeName} icon="Layers">
      <div className="cdc-related">
        {environmentId === null ? null : (
          <div className="cdc-related-tabs" role="tablist" aria-label="Show threads in">
            {(["project", "environment"] as const).map((value) => (
              <button key={value} type="button" role="tab" aria-selected={activeScope === value} onClick={() => setScope(value)}>
                {value === "project" ? "Project" : "Environment"}
              </button>
            ))}
          </div>
        )}
        <div className="cdc-related-list">
          {thread === undefined ? <div className="cdc-empty"><p>This thread isn’t available.</p></div> : groups.map((group) => {
            const open = !collapsed.has(group.key);
            return (
              <section key={group.key}>
                <button type="button" className="cdc-related-group" aria-expanded={open} onClick={() => toggle(group.key)}
                  title={group.key === "archived" ? "Archived threads" : `${group.threads.length} of ${group.total} not archived`}>
                  <Icon name={open ? "ChevronDown" : "ChevronRight"} />
                  <span>{group.name}</span>
                  <small>{group.key === "archived" ? group.total : `${group.threads.length}/${group.total}`}</small>
                </button>
                {open ? (
                  <ul>
                    {group.threads.map((related) => {
                      const tone = statusTone(related);
                      const idle = tone === null && related.status !== "error" && !related.isArchived;
                      return (
                        <li key={related.id}>
                          <button type="button" className="cdc-related-thread" aria-current={related.id === threadId ? "true" : undefined}
                            aria-selected={related.id === selectedId} data-idle={idle || related.isArchived || undefined} data-unread={related.isUnread || tone === "attention" || undefined}
                            title={`${related.displayTitle}\n${describeStatus(related)} · last activity ${relativeTime(related.latestAttentionAt)}`}
                            onClick={() => setSelectedId(related.id)}
                            onDoubleClick={() => desktop.openThread(related.id)}
                            onKeyDown={(event) => {
                              if (event.key !== "Enter") return;
                              event.preventDefault();
                              desktop.openThread(related.id);
                            }}
                            onContextMenu={(event) => {
                              setSelectedId(related.id);
                              menu.open(event, threadMenu(context, related, null));
                            }}>
                            <span className="cdc-status-pip" data-tone={tone ?? (related.status === "error" ? "error" : "idle")} />
                            <span className="cdc-related-title">{related.displayTitle}</span>
                            {idle ? <small>{idleFor(related.latestAttentionAt)}</small> : null}
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                ) : null}
              </section>
            );
          })}
        </div>
        <div className="cdc-related-actions">
          <Button size="sm" variant="secondary" disabled={!desktop.threadById.has(selectedId)} onClick={() => desktop.openThread(selectedId)}>Open</Button>
          <Button size="sm" variant="ghost" disabled={!desktop.threadById.has(selectedId)} onClick={() => manager.open({ kind: "info", threadId: selectedId })}>Info</Button>
        </div>
      </div>
    </WindowFrame>
  );
}
