import { useEffect, useRef, useState } from "react";
import { experimental_Icon as Icon } from "@get-bb/plugin-sdk/app";
import { trackNeedsInput, type NeedsInputTracker } from "./core";
import { useDesktop } from "./data";
import { useWindowManager } from "./windows";

/**
 * Desktop's needs-input balloon: when a thread starts waiting for you, a notice rises above the dock naming it; click to
 * open its window. Several waiting threads share one notice. It hides after ten seconds or when dismissed, returns only
 * when another thread starts waiting, and never names a thread whose window is in front.
 */

const TIMEOUT_MS = 10_000;
const LISTED = 3;

export function NeedsInputNotice() {
  const desktop = useDesktop();
  const manager = useWindowManager();
  const tracker = useRef<NeedsInputTracker>({ known: null, queue: [] });
  const [queue, setQueue] = useState<readonly string[]>([]);
  const [version, setVersion] = useState(0);
  const [hovered, setHovered] = useState(false);

  const pendingKey = [...desktop.threadById.values()]
    .filter((thread) => thread.hasPendingInteraction && !thread.isArchived && !thread.isHidden)
    .map((thread) => thread.id)
    .join(" ");
  useEffect(() => {
    const { arrived, ...next } = trackNeedsInput(tracker.current, pendingKey === "" ? [] : pendingKey.split(" "));
    tracker.current = next;
    setQueue(next.queue);
    if (arrived) setVersion((value) => value + 1);
  }, [pendingKey]);

  const focusedThread = manager.windows.find((window) => window.id === manager.focusedId)?.spec;
  const shown = queue.filter((id) => !(focusedThread?.kind === "thread" && focusedThread.threadId === id));
  const visible = shown.length > 0;

  const dismiss = () => {
    tracker.current = { ...tracker.current, queue: [] };
    setQueue([]);
  };
  useEffect(() => {
    if (!visible || hovered) return;
    const timer = setTimeout(dismiss, TIMEOUT_MS);
    return () => clearTimeout(timer);
  }, [visible, hovered, version]);

  if (!visible) return null;
  const open = (threadId: string) => {
    const rest = queue.filter((id) => id !== threadId);
    tracker.current = { ...tracker.current, queue: rest };
    setQueue(rest);
    desktop.openThread(threadId);
  };
  const title = (id: string) => desktop.threadById.get(id)?.displayTitle ?? "A thread";
  const [first] = shown;

  return (
    <div className="cdc-notice cdc-glass" role="status" aria-live="polite" data-screen
      onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}>
      <span className="cdc-status-pip" data-tone="attention" />
      <div className="cdc-notice-body">
        <p className="cdc-notice-title">{shown.length === 1 ? "A thread needs your input" : `${shown.length} threads need your input`}</p>
        {shown.length === 1 && first !== undefined ? (
          <button type="button" className="cdc-notice-link" onClick={() => open(first)}>{title(first)}</button>
        ) : (
          <ul>
            {shown.slice(0, LISTED).map((id) => (
              <li key={id}><button type="button" className="cdc-notice-link" onClick={() => open(id)}>{title(id)}</button></li>
            ))}
            {shown.length > LISTED ? <li className="cdc-notice-more">and {shown.length - LISTED} more</li> : null}
          </ul>
        )}
      </div>
      <button type="button" className="cdc-title-button" aria-label="Dismiss" title="Dismiss" onClick={dismiss}><Icon name="X" /></button>
    </div>
  );
}
