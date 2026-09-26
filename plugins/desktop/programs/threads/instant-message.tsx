import { useEffect, useRef, type CSSProperties, type MouseEvent as ReactMouseEvent } from "react";
import { ThreadChat, experimental_useSidebarThreadActions as useSidebarThreadActions } from "@get-bb/plugin-sdk/app";
import { BuddyListArt, CommandPromptArt, DetailsArt, ExternalLinkGlyph, InternetExplorerArt, MoreGlyph, ThreadArt } from "../../art";
import { playDoorClose, playDoorOpen } from "../../door-sounds";
import { aimScreenName } from "../../screen-names";
import { nativeBrowser } from "../../services/browser";
import { useDesktop } from "../../shell/data";
import { useMenu } from "../../shell/menu";
import { threadMenu } from "../../shell/menus";
import { WindowFrame, useWindowManager, viewportRect, windowId, type DesktopWindow, type ThreadTabKind } from "../../windows";
import { statusKind, typingLine } from "./status";

/** A thread as an AIM conversation, with the Buddy List and Buddy Info docked beside it. */

export function ThreadWindow({ window: desktopWindow, threadId }: { window: DesktopWindow; threadId: string }) {
  const desktop = useDesktop();
  const manager = useWindowManager();
  const actions = useSidebarThreadActions();
  const menu = useMenu();
  const thread = desktop.threadById.get(threadId);
  const panelOpen = manager.windows.some((window) => window.id === windowId({ kind: "panel", threadId }));
  const buddiesOpen = manager.windows.some((window) => window.id === windowId({ kind: "buddy-list", threadId }));
  const buddy = aimScreenName(thread?.providerId ?? "", threadId);
  const browserAvailable = nativeBrowser() !== null;
  const working = thread === undefined ? null : statusKind(thread) === "working";
  const wasWorking = useRef<boolean | null>(null);

  useEffect(() => {
    if (working === null) return;
    const previous = wasWorking.current;
    wasWorking.current = working;
    if (previous === null || previous === working) return;
    if (working) playDoorOpen();
    else playDoorClose();
  }, [working]);

  const openTab = (tab: ThreadTabKind) => {
    const tabId = Math.random().toString(36).slice(2, 10);
    manager.open({ kind: "thread-tab", threadId, tab, tabId });
  };

  const toggleDocked = (spec: { kind: "panel" | "buddy-list"; threadId: string }, width: number) => {
    const id = windowId(spec);
    if (manager.windows.some((window) => window.id === id)) {
      manager.close(id);
      return;
    }
    const { rect } = desktopWindow;
    const viewport = viewportRect();
    const right = rect.x + rect.width + 8;
    const left = rect.x - width - 8;
    const fitsRight = right + width <= viewport.width;
    const fitsLeft = left >= 0;
    const x =
      spec.kind === "buddy-list"
        ? fitsLeft ? left : fitsRight ? right : 0
        : fitsRight ? right : Math.max(0, left);
    manager.open(spec, { x, y: rect.y, width, height: rect.height });
  };

  const openThreadMenu = (event: ReactMouseEvent<HTMLButtonElement>) => {
    if (thread === undefined) return;
    const bounds = event.currentTarget.getBoundingClientRect();
    menu.open(
      { clientX: bounds.left, clientY: bounds.bottom + 2, preventDefault: () => event.preventDefault(), stopPropagation: () => event.stopPropagation() },
      threadMenu(desktop, manager, actions, thread, null).filter((entry) => typeof entry !== "object" || !("label" in entry) || entry.label !== "Open"),
    );
  };

  return (
    <WindowFrame
      window={desktopWindow}
      title={`${thread?.title ?? "Thread"} - Instant Message`}
      icon={<ThreadArt size={16} />}
      titleActions={
        <>
          {thread === undefined ? null : (
            <button
              type="button"
              className="bbd-titlebar-button mr-1"
              aria-label="Thread actions"
              aria-haspopup="menu"
              title="Thread actions"
              onClick={openThreadMenu}
            >
              <MoreGlyph className="size-3.5" strokeWidth={2} />
            </button>
          )}
          <button
            type="button"
            className="bbd-titlebar-button mr-1"
            aria-label="Open in bb"
            title="Open in bb"
            onClick={() => actions.open(threadId)}
          >
            <ExternalLinkGlyph className="size-3" strokeWidth={2} />
          </button>
        </>
      }
      statusBar={
        thread === undefined ? undefined : (
          <span className="flex-1 truncate" aria-live="polite" data-typing={statusKind(thread) === "working"}>
            {typingLine(thread, buddy)}
          </span>
        )
      }
    >
      <div className="bbd-im flex h-full flex-col" style={{ "--bbd-im-buddy": JSON.stringify(`${buddy}:`) } as CSSProperties}>
        <div className="bbd-im-menubar flex-none">
          <button type="button" aria-haspopup="menu" disabled={thread === undefined} onClick={openThreadMenu}>Thread</button>
          <span title={`Screen name: ${buddy}`}>To: <strong>{buddy}</strong></span>
        </div>
        <div className="bbd-im-chat min-h-0 flex-1" data-bbd-chat-thread={threadId}>
          <ThreadChat threadId={threadId} variant="compact" layout="contained" permissionPolicy="editable" className="h-full" />
        </div>
        <div className="bbd-im-actions flex-none">
          <button
            type="button"
            className="bbd-im-action"
            aria-pressed={buddiesOpen}
            title={buddiesOpen ? "Close the Buddy List" : "Buddy List: threads in this project and environment"}
            onClick={() => toggleDocked({ kind: "buddy-list", threadId }, 280)}
          >
            <BuddyListArt size={24} />
            <span>Buddy List</span>
          </button>
          <button
            type="button"
            className="bbd-im-action"
            aria-pressed={panelOpen}
            title={panelOpen ? "Close thread info" : "Status, branch, pull request, and folders"}
            onClick={() => toggleDocked({ kind: "panel", threadId }, 320)}
          >
            <DetailsArt size={24} />
            <span>Get Info</span>
          </button>
          <button
            type="button"
            className="bbd-im-action"
            disabled={!browserAvailable}
            title={browserAvailable ? "Open a new browser tab for this thread" : "Browser tabs need the bb desktop app"}
            onClick={() => openTab("browser")}
          >
            <InternetExplorerArt size={24} />
            <span>Browser</span>
          </button>
          <button
            type="button"
            className="bbd-im-action"
            title="Open a new terminal in this thread's environment"
            onClick={() => openTab("terminal")}
          >
            <CommandPromptArt size={24} />
            <span>Terminal</span>
          </button>
        </div>
      </div>
    </WindowFrame>
  );
}
