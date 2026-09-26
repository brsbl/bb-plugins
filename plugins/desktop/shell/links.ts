import { nativeBrowser, threadBrowserTab } from "../services/browser";
import type { WindowManager } from "../windows";

const THREAD_ROUTE = /^(?:\/projects\/[^/]+)?\/threads\/([^/?#]+)\/?$/;

/** A thread link or mention clicked inside a desktop window, which opens that thread's window instead of navigating. */
export function linkedThreadId(target: EventTarget | null): string | null {
  if (!(target instanceof Element) || target.closest(".bbd-window") === null) return null;
  if (target.closest('[contenteditable="true"]') !== null) return null;
  const mention = target.closest("[data-prompt-mention-resource]");
  if (mention !== null) {
    try {
      const resource: unknown = JSON.parse(mention.getAttribute("data-prompt-mention-resource") ?? "null");
      const record = typeof resource === "object" && resource !== null ? (resource as Record<string, unknown>) : null;
      if (record?.kind === "thread" && typeof record.threadId === "string") return record.threadId;
    } catch {
      return null;
    }
  }
  const anchor = target.closest("a[href]");
  if (!(anchor instanceof HTMLAnchorElement) || anchor.target === "_blank" || anchor.origin !== window.location.origin) return null;
  const match = THREAD_ROUTE.exec(anchor.pathname);
  return match === null ? null : decodeURIComponent(match[1]!);
}

/** A web link clicked in a thread's chat, which opens in that thread's browser window instead of the system browser. */
export function chatWebLink(target: EventTarget | null): { threadId: string; url: string } | null {
  if (!(target instanceof Element) || nativeBrowser() === null) return null;
  const threadId = target.closest<HTMLElement>("[data-bbd-chat-thread]")?.dataset.bbdChatThread;
  const anchor = target.closest("a[href]");
  if (threadId === undefined || !(anchor instanceof HTMLAnchorElement)) return null;
  if (!/^https?:$/.test(anchor.protocol) || anchor.origin === window.location.origin) return null;
  return { threadId, url: anchor.href };
}

export function openChatWebLink(manager: WindowManager, link: { threadId: string; url: string }) {
  const existing = manager.windows.find(
    (window) => window.spec.kind === "thread-tab" && window.spec.tab === "browser" && window.spec.threadId === link.threadId,
  );
  if (existing?.spec.kind === "thread-tab") {
    nativeBrowser()?.navigate({ tabId: threadBrowserTab(existing.spec.tabId).tabId, url: link.url });
    if (existing.minimized) manager.minimize(existing.id, false);
    manager.focus(existing.id);
    return;
  }
  const tabId = Math.random().toString(36).slice(2, 10);
  localStorage.setItem(threadBrowserTab(tabId).urlKey, link.url);
  manager.open({ kind: "thread-tab", threadId: link.threadId, tab: "browser", tabId });
}
