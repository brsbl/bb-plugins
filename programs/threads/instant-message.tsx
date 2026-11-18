import { useEffect, useLayoutEffect, useRef, useState, type CSSProperties, type MouseEvent as ReactMouseEvent } from "react";
import { flushSync } from "react-dom";
import { ThreadChat, experimental_useSidebarThreadActions as useSidebarThreadActions } from "@get-bb/plugin-sdk/app";
import { BuddyListArt, CommandPromptArt, DetailsArt, ExternalLinkGlyph, InternetExplorerArt, MoreGlyph, SendArt, StopArt, ThreadArt } from "../../art";
import { playDoorClose, playDoorOpen } from "../../door-sounds";
import { aimScreenName } from "../../screen-names";
import { nativeBrowser } from "../../services/browser";
import { useDesktop } from "../../shell/data";
import { useMenu } from "../../shell/menu";
import { threadMenu } from "../../shell/menus";
import { WindowFrame, useWindowManager, viewportRect, windowId, type DesktopWindow, type ThreadTabKind } from "../../windows";
import { COMPOSER_SUBMIT, inspectChatContract, readComposerSend, type ChatContract, type ComposerSend } from "./chat-contract";
import { statusKind, typingLine } from "./status";
import { useSideChatActions } from "./side-chat";

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
  const archived = thread?.isArchived === true;
  const messageActions = useSideChatActions(thread !== undefined && !archived);
  const wasWorking = useRef<boolean | null>(null);
  const [chatRoot, setChatRoot] = useState<HTMLDivElement | null>(null);
  const contract = useChatContract(chatRoot);
  const restyled = contract !== "mismatch";
  // Only while the restyle (which hides bb's own Send) applies; otherwise bb's button in the message box is the way to send.
  const send = useComposerSend(chatRoot, restyled && !archived);
  const stop = send?.action === "stop";

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
        {/* Without .bbd-im-chat no contract rule applies, including the one hiding an archived thread's message box, so that falls back to bb's composer-less timeline. */}
        <div
          ref={setChatRoot}
          className={`bbd-im-transcript ${restyled ? "bbd-im-chat " : ""}min-h-0 flex-1`}
          data-bbd-chat-thread={threadId}
          data-bbd-chat-contract={contract}
          data-archived={archived}
        >
          <ThreadChat threadId={threadId} variant={archived && !restyled ? "timeline" : "compact"} layout="contained" permissionPolicy="editable" messageActions={messageActions} className="h-full" />
        </div>
        {archived ? (
          <div className="bbd-im-archived flex-none" role="status">
            <span className="flex-1 truncate">Thread is archived</span>
            <button type="button" className="bbd-button bbd-bevel" onClick={() => void desktop.restoreThread(threadId)}>
              Unarchive
            </button>
          </div>
        ) : null}
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
          <button
            type="button"
            className="bbd-im-action bbd-im-send"
            disabled={send === null || send.disabled}
            aria-label={stop ? "Stop" : "Send"}
            title={archived ? "Unarchive the thread to send" : send === null ? "Send from the message box" : send.title || (stop ? "Stop run" : "Send")}
            // Like bb's own Send, keep the caret in the message box rather than taking focus on click.
            onPointerDown={(event) => {
              if (event.button === 0) event.preventDefault();
            }}
            onClick={() => {
              const button = chatRoot?.querySelector<HTMLButtonElement>(COMPOSER_SUBMIT);
              // bb's button handles queue/steer, attachments and Stop; click it only if it still offers what this one shows.
              if (button && send !== null && readComposerSend(button).action === send.action && !button.disabled) button.click();
            }}
          >
            {stop ? <StopArt size={30} /> : <SendArt size={30} />}
            <span>{stop ? "Stop" : "Send"}</span>
            {working ? <span className="bbd-im-send-meter" aria-hidden /> : null}
          </button>
        </div>
      </div>
    </WindowFrame>
  );
}

/**
 * bb's Send/Stop button in this window's message box, mirrored for the strip's Send: null when there is none (loading,
 * archived, or a contract mismatch), so the strip's Send is disabled. Re-read at most once a frame as bb renders.
 */
function useComposerSend(root: HTMLDivElement | null, enabled: boolean): ComposerSend | null {
  const [send, setSend] = useState<ComposerSend | null>(null);
  useLayoutEffect(() => {
    if (root === null || !enabled) {
      setSend(null);
      return;
    }
    let frame: number | undefined;
    const read = () => {
      frame = undefined;
      const button = root.querySelector<HTMLButtonElement>(COMPOSER_SUBMIT);
      const next = button === null ? null : readComposerSend(button);
      setSend((previous) =>
        previous !== null && next !== null && previous.action === next.action && previous.disabled === next.disabled && previous.title === next.title
          ? previous
          : next,
      );
    };
    const observer = new MutationObserver(() => {
      frame ??= requestAnimationFrame(read);
    });
    observer.observe(root, { childList: true, subtree: true, attributes: true, attributeFilter: ["disabled", "aria-label", "type"] });
    read();
    return () => {
      observer.disconnect();
      if (frame !== undefined) cancelAnimationFrame(frame);
    };
  }, [root, enabled]);
  return send;
}

/**
 * Whether bb's chat markup still fits the restyle (see chat-contract.ts), checked as bb renders and at most every
 * 250 ms after the transcript appears, so streaming turns stay cheap. A mismatch is final for the window: it warns
 * once and stays on bb's look rather than flickering between the two.
 */
function useChatContract(root: HTMLDivElement | null): ChatContract {
  const [contract, setContract] = useState<ChatContract>("pending");
  const mismatch = contract === "mismatch";
  useLayoutEffect(() => {
    if (root === null || mismatch) return;
    let latest: ChatContract = "pending";
    let timer: ReturnType<typeof setTimeout> | undefined;
    let typingLabel: Text | null = null;
    const restoreLabel = () => {
      if (typingLabel?.data === "Typing...") typingLabel.data = "Working...";
      typingLabel = null;
    };
    // ThreadChat has no label prop. Keep the live non-thinking span and its semantics; only own this exact text.
    const relabelWorking = () => {
      const span = root.querySelector(".mt-4.min-h-7 > .animate-shine");
      const node = span?.childNodes.length === 1 && span.firstChild instanceof Text ? span.firstChild : null;
      if (typingLabel !== node) restoreLabel();
      if (node?.data === "Working...") {
        typingLabel = node;
        node.data = "Typing...";
      } else if (node?.data !== "Typing...") {
        typingLabel = null;
      }
    };
    const check = (fromObserver: boolean) => {
      timer = undefined;
      const result = inspectChatContract(root);
      latest = result.contract;
      if (latest !== "mismatch") {
        relabelWorking();
        setContract(latest);
        return;
      }
      observer.disconnect();
      restoreLabel();
      // Commit before the next paint, so an archived thread's message box is never drawn without the rule hiding it.
      if (fromObserver) flushSync(() => setContract("mismatch"));
      else setContract("mismatch");
      console.warn(`[desktop] bb's chat markup is missing ${result.failed.join(", ")}; showing bb's own chat in this Instant Message window`);
    };
    const observer = new MutationObserver(() => {
      if (latest === "pending") check(true);
      else {
        relabelWorking();
        timer ??= setTimeout(() => check(true), 250);
      }
    });
    observer.observe(root, { childList: true, subtree: true, characterData: true });
    check(false);
    return () => {
      observer.disconnect();
      clearTimeout(timer);
      restoreLabel();
    };
  }, [root, mismatch]);
  return contract;
}
