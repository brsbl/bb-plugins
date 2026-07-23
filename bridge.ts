import type { PluginMessageActionContext } from "@bb/plugin-sdk/app";

export interface TimelineCommentsControllerBridge {
  beginComment(context: PluginMessageActionContext): void;
  focusThread(commentThreadId: string): Promise<boolean>;
}

let activeController: TimelineCommentsControllerBridge | null = null;
export type TimelineCommentAnchorHealth =
  | "anchored"
  | "unanchored"
  | "not-mounted";
let anchorHealthSnapshot: ReadonlyMap<string, TimelineCommentAnchorHealth> =
  new Map();
const anchorHealthListeners = new Set<() => void>();

export function publishTimelineCommentAnchorHealth(
  health: ReadonlyMap<string, TimelineCommentAnchorHealth>,
): void {
  anchorHealthSnapshot = new Map(health);
  for (const listener of anchorHealthListeners) listener();
}

export function getTimelineCommentAnchorHealth(): ReadonlyMap<
  string,
  TimelineCommentAnchorHealth
> {
  return anchorHealthSnapshot;
}

export function subscribeTimelineCommentAnchorHealth(
  listener: () => void,
): () => void {
  anchorHealthListeners.add(listener);
  return () => anchorHealthListeners.delete(listener);
}

export function installTimelineCommentsController(
  controller: TimelineCommentsControllerBridge,
): () => void {
  activeController = controller;
  return () => {
    if (activeController === controller) activeController = null;
  };
}

export function beginTimelineComment(
  context: PluginMessageActionContext,
): void {
  activeController?.beginComment(context);
}

export async function focusTimelineComment(
  commentThreadId: string,
): Promise<boolean> {
  return (await activeController?.focusThread(commentThreadId)) ?? false;
}
