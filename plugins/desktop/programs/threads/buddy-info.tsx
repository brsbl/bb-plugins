import type { ReactNode } from "react";
import { toast } from "sonner";
import {
  experimental_useSidebarThreadActions as useSidebarThreadActions,
  experimental_useSidebarThreadPullRequest as useSidebarThreadPullRequest,
} from "@get-bb/plugin-sdk/app";
import { BuddyListArt, DetailsArt, ExternalLinkGlyph } from "../../art";
import { aimScreenName } from "../../screen-names";
import { errorMessage, useDesktop } from "../../shell/data";
import { WindowFrame, type DesktopWindow } from "../../windows";
import { describeStatus } from "./status";

/** Buddy Info: a thread's status, branch, pull request and folders, docked beside its Instant Message. */

function PullRequestLine({ threadId }: { threadId: string }) {
  const { pullRequest } = useSidebarThreadPullRequest(threadId);
  if (pullRequest === null) return null;
  return (
    <DetailRow label="Pull request">
      <a className="text-primary underline" href={pullRequest.url} target="_blank" rel="noreferrer">
        #{pullRequest.number} {pullRequest.title}
      </a>{" "}
      <span className="text-muted-foreground">({pullRequest.state})</span>
    </DetailRow>
  );
}

function DetailRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="grid grid-cols-[92px_1fr] gap-2 py-0.5 text-xs">
      <span className="text-muted-foreground">{label}</span>
      <span className="min-w-0 break-words">{children}</span>
    </div>
  );
}

export function PanelWindow({ window: desktopWindow, threadId }: { window: DesktopWindow; threadId: string }) {
  const desktop = useDesktop();
  const actions = useSidebarThreadActions();
  const thread = desktop.threadById.get(threadId);
  const live = desktop.liveById.get(threadId);
  const section = desktop.snapshot.sections.find((candidate) => candidate.id === thread?.sectionId);

  return (
    <WindowFrame
      window={desktopWindow}
      title={`${thread?.title ?? "Thread"} - Buddy Info`}
      icon={<DetailsArt size={16} />}
    >
      <div className="bbd-im-info h-full overflow-auto">
        {thread === undefined ? (
          <p className="text-xs text-muted-foreground">This thread is not available.</p>
        ) : (
          <div className="space-y-3">
            <div className="bbd-im-info-heading">
              <BuddyListArt size={32} />
              <div className="min-w-0">
                <strong>{aimScreenName(thread.providerId, thread.id)}</strong>
                <span>{describeStatus(thread)}</span>
              </div>
            </div>
            <fieldset className="bbd-fieldset">
              <legend>Thread</legend>
              <DetailRow label="Status">{describeStatus(thread)}</DetailRow>
              <DetailRow label="Screen name">{aimScreenName(thread.providerId, thread.id)}</DetailRow>
              <DetailRow label="Agent">{thread.providerId}</DetailRow>
              {live?.environment?.branchName ? <DetailRow label="Branch">{live.environment.branchName}</DetailRow> : null}
              {live?.environment?.name ? <DetailRow label="Environment">{live.environment.name}</DetailRow> : null}
              {live?.host ? <DetailRow label="Machine">{live.host.name}</DetailRow> : null}
              <PullRequestLine threadId={threadId} />
              <DetailRow label="Created">{new Date(thread.createdAt).toLocaleString()}</DetailRow>
              <DetailRow label="Sidebar">{thread.isHidden ? "Hidden (filed in a folder)" : "Visible"}</DetailRow>
              <DetailRow label="Section">{section?.name ?? "None"}</DetailRow>
              <DetailRow label="Folders">
                {desktop.foldersOf(threadId).length === 0 ? "None" : desktop.foldersOf(threadId).join(", ")}
              </DetailRow>
            </fieldset>
            <div className="flex flex-wrap gap-1">
              <button type="button" className="bbd-button bbd-bevel" onClick={() => actions.open(threadId)}>
                <ExternalLinkGlyph className="size-3.5" /> Open in bb
              </button>
              <button
                type="button"
                className="bbd-button bbd-bevel"
                onClick={() => void actions.setRead(threadId, thread.isUnread).catch((error) => toast.error(errorMessage(error)))}
              >
                {thread.isUnread ? "Mark read" : "Mark unread"}
              </button>
              <button
                type="button"
                className="bbd-button bbd-bevel"
                disabled={thread.isArchived}
                onClick={() => desktop.archiveThread(threadId)}
              >
                Archive
              </button>
            </div>
          </div>
        )}
      </div>
    </WindowFrame>
  );
}
