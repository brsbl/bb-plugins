import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { clearanceShift, type Point } from "../core";
import { NeedsInputBalloon } from "../page/balloon";
import { ProgramWindow } from "../programs/registry";
import { PLUGIN_SCOPE } from "../slots";
import { Taskbar, type DockFrame } from "../taskbar/taskbar";
import { setWindowNudges, useWindowManager, workAreaRect } from "../windows";
import { AskTextDialog } from "./ask-text";
import { useDesktop } from "./data";
import { chatWebLink, linkedThreadId, openChatWebLink, opensLinksInAppBrowser } from "./links";
import { useMenu } from "./menu";

/**
 * Moves windows out of the way of bb's home composer while it has focus, and puts them back when it loses it. It mounts
 * outside the data provider and starts from the current focus, because bb can autofocus the composer before the
 * desktop has loaded.
 */
export function ComposerClearance() {
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
      const area = workAreaRect();
      const bounds = composer?.getBoundingClientRect();
      if (bounds === undefined) return;
      const obstacle = { x: bounds.left, y: bounds.top, width: bounds.width, height: bounds.height };
      const next = new Map<string, Point>();
      for (const window of windowsRef.current) {
        if (window.minimized || window.restoreRect !== null) continue;
        const shift = clearanceShift(window.rect, obstacle, area);
        if (shift !== null) next.set(window.id, shift);
      }
      setWindowNudges(next);
    };
    const track = (next: HTMLElement | null) => {
      if (next === null || next === composer) return;
      observer?.disconnect();
      composer = next;
      observer = new ResizeObserver(clearComposer);
      observer.observe(next);
      clearComposer();
    };
    const onFocusIn = (event: FocusEvent) => track(homeComposer(event.target));
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
    track(homeComposer(document.activeElement));
    return () => {
      document.removeEventListener("focusin", onFocusIn);
      document.removeEventListener("focusout", onFocusOut);
      observer?.disconnect();
      setWindowNudges(new Map());
    };
  }, []);
  return null;
}

/**
 * Everything that floats over bb rather than sitting in the homepage: windows, the taskbar, and the needs-input
 * balloon, portaled to `document.body`. Thread and web links clicked inside a window open desktop windows.
 */
export function WindowLayer({ dockFrame }: { dockFrame: DockFrame | null }) {
  const desktop = useDesktop();
  const manager = useWindowManager();
  const menu = useMenu();
  return createPortal(
    <div
      {...PLUGIN_SCOPE}
      className="bbd-root bbd-window-layer"
      onClickCapture={(event) => {
        if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
        const threadId = linkedThreadId(event.target);
        // Web links follow bb's link setting: its in-app browser becomes the thread's bb Explorer window, and an
        // external browser is left to bb.
        const webLink = threadId === null && opensLinksInAppBrowser() ? chatWebLink(event.target) : null;
        if (threadId === null && webLink === null) return;
        event.preventDefault();
        event.stopPropagation();
        if (threadId !== null) desktop.openThread(threadId);
        else if (webLink !== null) openChatWebLink(manager, webLink);
      }}
      onContextMenuCapture={(event) => {
        // A link in a chat gets an XP menu like every other right-click on the desktop. Open does exactly what a click
        // does, so it follows the rules above and bb's link setting.
        const anchor = event.target instanceof Element ? event.target.closest<HTMLAnchorElement>(".bbd-window a[href]") : null;
        if (anchor === null || anchor.closest('[contenteditable="true"]') !== null) return;
        const webLink = linkedThreadId(anchor) === null ? chatWebLink(anchor) : null;
        menu.open(event, [
          { label: "Open link", run: () => anchor.click() },
          ...(webLink !== null && !opensLinksInAppBrowser()
            ? [{ label: "Open in bb Explorer", run: () => openChatWebLink(manager, webLink) }]
            : []),
          "separator",
          { label: "Copy link", run: () => void navigator.clipboard.writeText(anchor.href) },
        ]);
      }}
    >
      {manager.windows.map((window) => (
        <ProgramWindow key={window.id} window={window} />
      ))}
      <Taskbar frame={dockFrame} />
      <NeedsInputBalloon />
      <AskTextDialog />
    </div>,
    document.body,
  );
}
