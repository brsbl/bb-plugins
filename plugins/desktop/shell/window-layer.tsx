import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { clearanceShift, type Point } from "../core";
import { NeedsInputBalloon } from "../page/balloon";
import { ProgramWindow } from "../programs/registry";
import { PLUGIN_SCOPE } from "../slots";
import { Taskbar, type DockFrame } from "../taskbar/taskbar";
import { setWindowNudges, useWindowManager, workAreaRect } from "../windows";
import { useDesktop } from "./data";
import { chatWebLink, linkedThreadId, openChatWebLink } from "./links";

/** Moves windows out of the way of bb's home composer while it has focus, and puts them back when it loses it. */
function useComposerClearance() {
  const manager = useWindowManager();
  const windowsRef = useRef(manager.windows);
  windowsRef.current = manager.windows;
  useEffect(() => {
    let composer: HTMLElement | null = null;
    let observer: ResizeObserver | null = null;
    const homeComposer = (target: EventTarget | null) =>
      target instanceof Element && target.closest(".bbd-window-layer, [data-thread-window]") === null
        ? target.closest<HTMLElement>("[data-app-composer]")
        : null;
    const clearComposer = () => {
      const { width, height } = workAreaRect();
      const bounds = composer?.getBoundingClientRect();
      if (bounds === undefined) return;
      const obstacle = { x: bounds.left, y: bounds.top, width: bounds.width, height: bounds.height };
      const next = new Map<string, Point>();
      for (const window of windowsRef.current) {
        if (window.minimized || window.restoreRect !== null) continue;
        const shift = clearanceShift(window.rect, obstacle, { width, height });
        if (shift !== null) next.set(window.id, shift);
      }
      setWindowNudges(next);
    };
    const onFocusIn = (event: FocusEvent) => {
      const next = homeComposer(event.target);
      if (next === null || next === composer) return;
      observer?.disconnect();
      composer = next;
      observer = new ResizeObserver(clearComposer);
      observer.observe(next);
      clearComposer();
    };
    const onFocusOut = (event: FocusEvent) => {
      if (composer === null) return;
      if (event.relatedTarget instanceof Node && composer.contains(event.relatedTarget)) return;
      observer?.disconnect();
      observer = null;
      composer = null;
      setWindowNudges(new Map());
    };
    document.addEventListener("focusin", onFocusIn);
    document.addEventListener("focusout", onFocusOut);
    return () => {
      document.removeEventListener("focusin", onFocusIn);
      document.removeEventListener("focusout", onFocusOut);
      observer?.disconnect();
      setWindowNudges(new Map());
    };
  }, []);
}

/**
 * Everything that floats over bb rather than sitting in the homepage: windows, the taskbar, and the needs-input
 * balloon, portaled to `document.body`. Thread and web links clicked inside a window open desktop windows.
 */
export function WindowLayer({ dockFrame }: { dockFrame: DockFrame | null }) {
  const desktop = useDesktop();
  const manager = useWindowManager();
  useComposerClearance();
  return createPortal(
    <div
      {...PLUGIN_SCOPE}
      className="bbd-root bbd-window-layer"
      onClickCapture={(event) => {
        if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
        const threadId = linkedThreadId(event.target);
        const webLink = threadId === null ? chatWebLink(event.target) : null;
        if (threadId === null && webLink === null) return;
        event.preventDefault();
        event.stopPropagation();
        if (threadId !== null) desktop.openThread(threadId);
        else if (webLink !== null) openChatWebLink(manager, webLink);
      }}
    >
      {manager.windows.map((window) => (
        <ProgramWindow key={window.id} window={window} />
      ))}
      <Taskbar frame={dockFrame} />
      <NeedsInputBalloon />
    </div>,
    document.body,
  );
}
