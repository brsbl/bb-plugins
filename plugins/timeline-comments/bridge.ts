import type { PluginMessageActionContext } from "@bb/plugin-sdk/app";
import type { TimelineCommentThreadSummary } from "./server.js";

export interface TimelineCommentsControllerBridge {
  beginComment(context: PluginMessageActionContext): void;
  focusThread(anchor: TimelineCommentThreadSummary): Promise<boolean>;
  registerThreadWindow(threadId: string, window: HTMLElement): () => void;
  refreshAnchors(): void;
}

let activeController: TimelineCommentsControllerBridge | null = null;
export type TimelineCommentAnchorHealth =
  | "anchored"
  | "unanchored"
  | "not-mounted";
let anchorHealthSnapshot: ReadonlyMap<string, TimelineCommentAnchorHealth> =
  new Map();
const anchorHealthListeners = new Set<() => void>();
const handoffListeners = new Set<(threadId: string) => void>();

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
  anchor: TimelineCommentThreadSummary,
): Promise<boolean> {
  return (await activeController?.focusThread(anchor)) ?? false;
}

export function registerTimelineCommentThreadWindow(
  threadId: string,
  window: HTMLElement,
): () => void {
  return activeController?.registerThreadWindow(threadId, window) ?? (() => {});
}

export function refreshTimelineCommentAnchors(): void {
  activeController?.refreshAnchors();
}

export function requestTimelineCommentHandoff(threadId: string): void {
  for (const listener of handoffListeners) listener(threadId);
}

export function subscribeTimelineCommentHandoff(
  listener: (threadId: string) => void,
): () => void {
  handoffListeners.add(listener);
  return () => handoffListeners.delete(listener);
}
