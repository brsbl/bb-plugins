import { useEffect, useState, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import {
  experimental_useSidebarThreadActions as useSidebarThreadActions,
  experimental_useSidebarThreads as useSidebarThreads,
  useBbContext,
  type PluginSidebarThread,
} from "@get-bb/plugin-sdk/app";

import { CloseGlyph, WarningArt } from "../art";
import { trackNeedsInput, type NeedsInputTracker } from "../core";
import { useDesktopEnabled } from "../enabled";

const BALLOON_WIDTH = 300;
const BALLOON_TIMEOUT_MS = 10_000;
const LISTED = 3;

interface BalloonState extends NeedsInputTracker {
  version: number;
}

let balloon: BalloonState = { known: null, queue: [], version: 0 };
const balloonListeners = new Set<() => void>();

function setBalloon(next: BalloonState) {
  balloon = next;
  for (const listener of balloonListeners) listener();
}

function subscribeBalloon(listener: () => void) {
  balloonListeners.add(listener);
  return () => balloonListeners.delete(listener);
}

function observeNeedsInput(pendingIds: readonly string[]) {
  const { arrived, ...tracker } = trackNeedsInput(balloon, pendingIds);
  setBalloon({ ...tracker, version: arrived ? balloon.version + 1 : balloon.version });
}

function dismissBalloon() {
  if (balloon.queue.length > 0) setBalloon({ ...balloon, queue: [] });
}

function dropFromBalloon(threadId: string) {
  setBalloon({ ...balloon, queue: balloon.queue.filter((id) => id !== threadId) });
}

const owners: symbol[] = [];
const ownerListeners = new Set<() => void>();

function subscribeOwners(listener: () => void) {
  ownerListeners.add(listener);
  return () => ownerListeners.delete(listener);
}

function useIsBalloonOwner(): boolean {
  const [token] = useState(() => Symbol("balloon"));
  useEffect(() => {
    owners.push(token);
    for (const listener of ownerListeners) listener();
    return () => {
      owners.splice(owners.indexOf(token), 1);
      for (const listener of ownerListeners) listener();
    };
  }, [token]);
  return useSyncExternalStore(subscribeOwners, () => owners[0] === token);
}

function threadTitle(thread: PluginSidebarThread | undefined): string {
  return thread?.title ?? thread?.titleFallback ?? "Untitled thread";
}

function balloonPlacement(): { left: number; bottom: number; tail: number } {
  const clock = document.querySelector(".bbd-clock")?.getBoundingClientRect();
  if (clock === undefined || clock.width === 0) {
    const left = window.innerWidth - BALLOON_WIDTH - 20;
    return { left, bottom: 34, tail: BALLOON_WIDTH - 48 };
  }
  const anchor = clock.left + clock.width / 2;
  const left = Math.min(Math.max(12, anchor - BALLOON_WIDTH + 48), window.innerWidth - BALLOON_WIDTH - 12);
  return { left, bottom: window.innerHeight - clock.top + 14, tail: anchor - left - 8 };
}

export function NeedsInputBalloon() {
  const enabled = useDesktopEnabled();
  const { status, threads } = useSidebarThreads();
  const actions = useSidebarThreadActions();
  const { threadId: currentThreadId } = useBbContext();
  const owner = useIsBalloonOwner();
  const state = useSyncExternalStore(subscribeBalloon, () => balloon);
  const [hovered, setHovered] = useState(false);
  const [, setViewport] = useState(0);

  const pendingKey = threads
    .filter((thread) => thread.hasPendingInteraction && !thread.isArchived)
    .map((thread) => thread.id)
    .join(" ");
  useEffect(() => {
    if (status === "ready") observeNeedsInput(pendingKey === "" ? [] : pendingKey.split(" "));
  }, [pendingKey, status]);

  const shown = state.queue.filter((id) => id !== currentThreadId);
  const visible = owner && enabled && shown.length > 0;

  useEffect(() => {
    if (!visible || hovered) return;
    const timer = setTimeout(dismissBalloon, BALLOON_TIMEOUT_MS);
    return () => clearTimeout(timer);
  }, [visible, hovered, state.version]);

  useEffect(() => {
    if (!visible) return;
    const onResize = () => setViewport((count) => count + 1);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [visible]);

  if (!visible) return null;

  const byId = new Map(threads.map((thread) => [thread.id, thread]));
  const open = (threadId: string) => {
    dropFromBalloon(threadId);
    actions.open(threadId);
  };
  const [first] = shown;
  const placement = balloonPlacement();

  return createPortal(
    <div data-bb-plugin="desktop" className="bbd-root">
      <div
        className="bbd-balloon"
        role="status"
        aria-live="polite"
        data-single={shown.length === 1}
        style={{ left: placement.left, bottom: placement.bottom, width: BALLOON_WIDTH }}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        onClick={() => {
          if (shown.length === 1 && first !== undefined) open(first);
        }}
      >
        <WarningArt />
        <div className="min-w-0 flex-1">
          <p className="bbd-balloon-title">
            {shown.length === 1 ? "A thread needs your input" : `${shown.length} threads need your input`}
          </p>
          {shown.length === 1 && first !== undefined ? (
            <p>
              <button type="button" className="bbd-balloon-link" onClick={(event) => { event.stopPropagation(); open(first); }}>
                {threadTitle(byId.get(first))}
              </button>{" "}
              is waiting for an answer. Click here to open it.
            </p>
          ) : (
            <>
              <ul className="bbd-balloon-list">
                {shown.slice(0, LISTED).map((id) => (
                  <li key={id}>
                    <button type="button" className="bbd-balloon-link" onClick={() => open(id)}>
                      {threadTitle(byId.get(id))}
                    </button>
                  </li>
                ))}
              </ul>
              {shown.length > LISTED ? <p>and {shown.length - LISTED} more…</p> : null}
            </>
          )}
        </div>
        <button
          type="button"
          className="bbd-balloon-close"
          aria-label="Dismiss"
          title="Dismiss"
          onClick={(event) => {
            event.stopPropagation();
            dismissBalloon();
          }}
        >
          <CloseGlyph className="size-2.5" strokeWidth={2.5} />
        </button>
        <svg className="bbd-balloon-tail" width="18" height="16" viewBox="0 0 18 16" style={{ left: placement.tail }} aria-hidden>
          <path d="M1 0V15L17 0" />
        </svg>
      </div>
    </div>,
    document.body,
  );
}
