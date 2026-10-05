/**
 * bb desktop's native browser views, as Desktop's bb Explorer uses them: a page that belongs to a thread, drawn by the
 * desktop app over the window that hosts it. The bridge exists only in the bb desktop app.
 */

export const BROWSER_HOME = "https://www.google.com";

export interface ViewBounds {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface BrowserState {
  tabId: string;
  url: string;
  title: string | null;
  isLoading: boolean;
  canGoBack: boolean;
  canGoForward: boolean;
  errorText: string | null;
}

export interface NativeBrowser {
  attach(request: { tabId: string; threadId: string; url: string; bounds: ViewBounds; visible: boolean }): void;
  detach(tabId: string): void;
  navigate(request: { tabId: string; url: string }): void;
  goBack(tabId: string): void;
  goForward(tabId: string): void;
  reload(tabId: string): void;
  stop(tabId: string): void;
  setBounds(request: { tabId: string; bounds: ViewBounds }): void;
  setVisible(request: { tabId: string; visible: boolean }): void;
  setVisibleWithoutFocus?(request: { tabId: string; visible: boolean }): void;
  onState(listener: (state: BrowserState) => void): () => void;
}

export function nativeBrowser(): NativeBrowser | null {
  const bridge = (window as { bbDesktop?: { browser?: Partial<NativeBrowser> } }).bbDesktop?.browser;
  return typeof bridge?.attach === "function" && typeof bridge.onState === "function" ? (bridge as NativeBrowser) : null;
}

/** A canvas browser window's native tab and the key that remembers its page across reloads. */
export function browserTab(tabId: string): { tabId: string; urlKey: string } {
  return { tabId: `desktop-canvas-prototype-browser-${tabId}`, urlKey: `desktop-canvas-prototype:browser:${tabId}:url` };
}

export function closeBrowserTab(tabId: string) {
  const tab = browserTab(tabId);
  nativeBrowser()?.detach(tab.tabId);
  try {
    localStorage.removeItem(tab.urlKey);
  } catch {
    // Nothing to forget.
  }
}

export function storedUrl(urlKey: string): string {
  try {
    const stored = localStorage.getItem(urlKey);
    return stored !== null && /^https?:\/\//.test(stored) ? stored : BROWSER_HOME;
  } catch {
    return BROWSER_HOME;
  }
}

export function rememberUrl(urlKey: string, url: string) {
  try {
    localStorage.setItem(urlKey, url);
  } catch {
    // The page still opens; it just won't come back after a reload.
  }
}

/** bb's "open links in the in-app browser" setting, which bb keeps in this key (on by default). */
export function opensLinksInAppBrowser(): boolean {
  try {
    return JSON.parse(localStorage.getItem("bb.openLinksInAppBrowser") ?? "true") !== false;
  } catch {
    return true;
  }
}

/** A web link clicked in a thread window's chat, with the thread it belongs to. */
export function chatWebLink(target: EventTarget | null): { threadId: string; url: string; anchor: HTMLAnchorElement } | null {
  if (!(target instanceof Element) || target.closest('[contenteditable="true"]') !== null) return null;
  const threadId = target.closest<HTMLElement>("[data-chat-thread]")?.dataset.chatThread;
  const anchor = target.closest("a[href]");
  if (threadId === undefined || !(anchor instanceof HTMLAnchorElement)) return null;
  if (!/^https?:$/.test(anchor.protocol) || anchor.origin === window.location.origin) return null;
  return { threadId, url: anchor.href, anchor };
}

/** Turns what was typed in the address field into a URL: an address as is, anything else as a search. */
export function normalizeAddress(input: string): string | null {
  const text = input.trim();
  if (text === "") return null;
  if (/^https?:\/\//i.test(text)) return text;
  if (/^[\w-]+(\.[\w-]+)+(:\d+)?(\/.*)?$/.test(text) || /^localhost(:\d+)?(\/.*)?$/.test(text)) {
    return `${text.startsWith("localhost") ? "http" : "https"}://${text}`;
  }
  return `https://www.google.com/search?q=${encodeURIComponent(text)}`;
}
