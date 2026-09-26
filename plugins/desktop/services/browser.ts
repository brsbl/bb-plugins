/** bb desktop's native browser views, shared by Internet Explorer and thread browser tabs. */
export const BROWSER_HOME = "https://www.google.com";
export const TAB_ID = "bb-desktop-internet-explorer";
export const URL_KEY = "bb-desktop:internet-explorer:url";

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

export function closeInternetExplorer() {
  nativeBrowser()?.detach(TAB_ID);
}

export function threadBrowserTab(tabId: string): { tabId: string; urlKey: string } {
  return { tabId: `bb-desktop-thread-browser-${tabId}`, urlKey: `bb-desktop:thread-browser:${tabId}:url` };
}

export function closeThreadBrowser(tabId: string) {
  const tab = threadBrowserTab(tabId);
  nativeBrowser()?.detach(tab.tabId);
  localStorage.removeItem(tab.urlKey);
}
