import { useCallback, useState } from "react";
import { CommandPromptArt, InternetExplorerArt } from "../../art";
import { closeThreadBrowser, threadBrowserTab } from "../../services/browser";
import { closeCommandPromptSession, threadTerminalSessionKey } from "../../services/terminal";
import { useDesktop } from "../../shell/data";
import { WindowFrame, type DesktopWindow, type ThreadTabKind } from "../../windows";
import { CommandPrompt } from "../command-prompt";
import { InternetExplorer } from "../internet-explorer";

/** A browser or terminal opened from an Instant Message, bound to that thread's environment. */

export function threadTabTitle(tab: ThreadTabKind, threadTitle: string, pageTitle: string | null = null): string {
  if (tab === "terminal") return `Command Prompt — ${threadTitle}`;
  return `${pageTitle === null || pageTitle === "" ? threadTitle : pageTitle} - Internet Explorer`;
}

export function ThreadTabWindow({
  window: desktopWindow,
  threadId,
  tab,
  tabId,
}: {
  window: DesktopWindow;
  threadId: string;
  tab: ThreadTabKind;
  tabId: string;
}) {
  const desktop = useDesktop();
  const [pageTitle, setPageTitle] = useState<string | null>(null);
  const threadTitle = desktop.threadById.get(threadId)?.title ?? "Thread";
  const loadThread = useCallback(async () => threadId, [threadId]);
  const browserTab = threadBrowserTab(tabId);
  return (
    <WindowFrame
      window={desktopWindow}
      title={threadTabTitle(tab, threadTitle, pageTitle)}
      icon={tab === "browser" ? <InternetExplorerArt size={16} /> : <CommandPromptArt size={16} />}
      keepMounted={tab === "browser"}
    >
      {tab === "browser" ? (
        <InternetExplorer
          window={desktopWindow}
          tabId={browserTab.tabId}
          urlKey={browserTab.urlKey}
          loadThread={loadThread}
          onTitle={setPageTitle}
        />
      ) : (
        <CommandPrompt
          target={{ kind: "thread", threadId }}
          sessionKey={threadTerminalSessionKey(tabId)}
          unavailable="This thread has no environment to open a terminal in."
        />
      )}
    </WindowFrame>
  );
}


/** Releases the native browser tab or terminal session behind a thread tab once its window closes. */
export function closeThreadTab(spec: { tab: ThreadTabKind; tabId: string }) {
  if (spec.tab === "browser") closeThreadBrowser(spec.tabId);
  else closeCommandPromptSession(threadTerminalSessionKey(spec.tabId));
}
