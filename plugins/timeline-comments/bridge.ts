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

export interface TimelineCommentHandoffTarget {
  threadId: string;
  getThreadWindow(): HTMLElement | null;
  accept(): Promise<boolean>;
}

const handoffTargets = new Set<TimelineCommentHandoffTarget>();

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

function isRendered(node: HTMLElement | null): node is HTMLElement {
  if (node === null || !node.isConnected) return false;
  if (node.closest('[aria-hidden="true"], [hidden], [inert]') !== null) {
    return false;
  }
  const checkVisibility = (
    node as HTMLElement & {
      checkVisibility?: (options?: {
        contentVisibilityAuto?: boolean;
        visibilityProperty?: boolean;
      }) => boolean;
    }
  ).checkVisibility;
  return (
    checkVisibility?.call(node, {
      contentVisibilityAuto: true,
      visibilityProperty: true,
    }) ?? true
  );
}

export async function requestTimelineCommentHandoff(
  threadId: string,
): Promise<boolean> {
  const candidates = [...handoffTargets].filter((target) => {
    return (
      target.threadId === threadId && isRendered(target.getThreadWindow())
    );
  });
  if (candidates.length === 0) return false;

  const activeWindow =
    document.activeElement instanceof Element
      ? document.activeElement.closest<HTMLElement>("[data-thread-window]")
      : null;
  const target =
    candidates.find(
      (candidate) => candidate.getThreadWindow() === activeWindow,
    ) ??
    candidates.find(
      (candidate) =>
        candidate
          .getThreadWindow()
          ?.closest('[data-split-pane-id][data-focused="true"]') !== null,
    ) ??
    candidates[0]!;
  return target.accept();
}

export function subscribeTimelineCommentHandoff(
  target: TimelineCommentHandoffTarget,
): () => void {
  handoffTargets.add(target);
  return () => handoffTargets.delete(target);
}
