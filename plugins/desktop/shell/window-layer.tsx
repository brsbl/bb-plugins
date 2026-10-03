import { createPortal } from "react-dom";
import { NeedsInputBalloon } from "../page/balloon";
import { ProgramWindow } from "../programs/registry";
import { PLUGIN_SCOPE } from "../slots";
import { Taskbar, type DockFrame } from "../taskbar/taskbar";
import { useWindowManager } from "../windows";
import { AskTextDialog } from "./ask-text";
import { useDesktop } from "./data";
import { chatWebLink, linkedThreadId, openChatWebLink, opensLinksInAppBrowser } from "./links";

/**
 * Everything that floats over bb rather than sitting in the homepage: windows, the taskbar, and the needs-input
 * balloon, portaled to `document.body`. Thread and web links clicked inside a window open desktop windows.
 */
export function WindowLayer({ dockFrame }: { dockFrame: DockFrame | null }) {
  const desktop = useDesktop();
  const manager = useWindowManager();
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
