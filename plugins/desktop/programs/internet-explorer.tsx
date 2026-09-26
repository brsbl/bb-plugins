import { useCallback, useEffect, useId, useLayoutEffect, useRef, useState, type FormEvent } from "react";

import { ProgramMenuBar, ProgramStatusBar } from "../apps/xp-chrome";
import { InternetExplorerArt } from "../art";
import { BROWSER_HOME, TAB_ID, URL_KEY, nativeBrowser, type BrowserState, type ViewBounds } from "../services/browser";
import { useDesktop } from "../shell/data";
import { WindowFrame, type DesktopWindow } from "../windows";


const OCCLUDERS = [
  ".bbd-note",
  ".bbd-menu-list",
  ".bbd-start-menu",
  ".bbd-balloon",
  "[role='menu']",
  "[role='listbox']",
  "[role='alertdialog']",
  "[role='dialog'][aria-modal='true']",
  "[data-radix-popper-content-wrapper]",
  "[data-sonner-toast]",
].join(",");

function overlaps(a: DOMRect, b: ViewBounds): boolean {
  return a.width > 0 && a.height > 0 && a.left < b.x + b.width && a.right > b.x && a.top < b.y + b.height && a.bottom > b.y;
}

function readBounds(element: HTMLElement): ViewBounds {
  const rect = element.getBoundingClientRect();
  const x = Math.max(0, Math.round(rect.left));
  const y = Math.max(0, Math.round(rect.top));
  let bottom = Math.min(window.innerHeight, Math.round(rect.bottom));
  const taskbar = document.querySelector(".bbd-taskbar")?.getBoundingClientRect();
  if (taskbar !== undefined && taskbar.left < rect.right && taskbar.right > rect.left && taskbar.top < bottom) {
    bottom = Math.max(y, Math.round(taskbar.top));
  }
  const right = Math.min(window.innerWidth, Math.round(rect.right));
  return { x, y, width: Math.max(0, right - x), height: Math.max(0, bottom - y) };
}

function occluded(element: HTMLElement, bounds: ViewBounds, z: number): boolean {
  if (document.querySelector(".bbd-drag-shield")) return true;
  const own = element.closest(".bbd-window");
  for (const candidate of document.querySelectorAll<HTMLElement>(`${OCCLUDERS}, .bbd-window`)) {
    if (candidate === own || own?.contains(candidate)) continue;
    const isWindow = candidate.classList.contains("bbd-window");
    if (!isWindow && candidate.closest(".bbd-window") !== null) continue;
    if (isWindow && Number(candidate.style.zIndex) <= z) continue;
    if (candidate.hidden) continue;
    if (overlaps(candidate.getBoundingClientRect(), bounds)) return true;
  }
  return false;
}

function normalizeAddress(input: string): string | null {
  const text = input.trim();
  if (text === "") return null;
  if (/^https?:\/\//i.test(text)) return text;
  if (/^[\w-]+(\.[\w-]+)+(:\d+)?(\/.*)?$/.test(text) || /^localhost(:\d+)?(\/.*)?$/.test(text)) {
    return `${text.startsWith("localhost") ? "http" : "https"}://${text}`;
  }
  return `https://www.google.com/search?q=${encodeURIComponent(text)}`;
}

function storedUrl(urlKey: string): string {
  const stored = localStorage.getItem(urlKey);
  return stored !== null && /^https?:\/\//.test(stored) ? stored : BROWSER_HOME;
}

function NavArt({ kind }: { kind: "back" | "forward" }) {
  // Unique per instance: a shared id resolves to the first match, which may sit in a hidden window and paint nothing.
  const gradientId = useId();
  return (
    <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden>
      <defs>
        <radialGradient id={gradientId} cx="35%" cy="30%" r="75%">
          <stop offset="0" stopColor="oklch(0.9 0.14 140)" />
          <stop offset="0.55" stopColor="oklch(0.66 0.19 142)" />
          <stop offset="1" stopColor="oklch(0.45 0.14 145)" />
        </radialGradient>
      </defs>
      <circle cx="12" cy="12" r="10.5" fill={`url(#${gradientId}) oklch(0.66 0.19 142)`} stroke="oklch(0.38 0.1 145)" strokeWidth="1" />
      <path
        d={kind === "back" ? "M13.5 6.5 8 12l5.5 5.5M8.5 12H17" : "M10.5 6.5 16 12l-5.5 5.5M15.5 12H7"}
        fill="none"
        stroke="oklch(0.99 0.004 250)"
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function StopArt() {
  return (
    <svg viewBox="0 0 16 16" width="16" height="16" aria-hidden>
      <rect x="1.5" y="1.5" width="13" height="13" rx="2" fill="oklch(0.6 0.2 28)" stroke="oklch(0.42 0.15 28)" />
      <path d="m5 5 6 6m0-6-6 6" stroke="oklch(0.99 0.004 250)" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

function RefreshArt() {
  return (
    <svg viewBox="0 0 16 16" width="16" height="16" aria-hidden>
      <rect x="1.5" y="1.5" width="13" height="13" rx="2" fill="oklch(0.97 0.01 250)" stroke="oklch(0.6 0.04 250)" />
      <path d="M11.4 6.2A3.8 3.8 0 1 0 11.6 9" fill="none" stroke="oklch(0.55 0.17 145)" strokeWidth="1.6" strokeLinecap="round" />
      <path d="M11.9 3.6v3h-3" fill="none" stroke="oklch(0.55 0.17 145)" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function HomeArt() {
  return (
    <svg viewBox="0 0 16 16" width="16" height="16" aria-hidden>
      <path d="M2 8 8 2.5 14 8" fill="none" stroke="oklch(0.5 0.16 28)" strokeWidth="1.6" strokeLinejoin="round" />
      <path d="M3.8 7.2V14h8.4V7.2L8 3.6Z" fill="oklch(0.96 0.03 85)" stroke="oklch(0.5 0.05 60)" />
      <rect x="6.6" y="9.6" width="2.8" height="4.4" fill="oklch(0.55 0.13 50)" />
    </svg>
  );
}

export function InternetExplorer({
  window: desktopWindow,
  tabId = TAB_ID,
  urlKey = URL_KEY,
  loadThread,
  onTitle,
}: {
  window: DesktopWindow;
  tabId?: string;
  urlKey?: string;
  loadThread: () => Promise<string>;
  onTitle: (title: string | null) => void;
}) {
  const browser = nativeBrowser();
  const viewRef = useRef<HTMLDivElement>(null);
  const [threadId, setThreadId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [state, setState] = useState<BrowserState | null>(null);
  const [address, setAddress] = useState(() => storedUrl(urlKey));
  const [editing, setEditing] = useState(false);
  const [shown, setShown] = useState(false);
  const lastBounds = useRef<ViewBounds | null>(null);
  const shownRef = useRef(false);
  const addressId = useId();
  const onTitleRef = useRef(onTitle);
  onTitleRef.current = onTitle;

  useEffect(() => {
    let cancelled = false;
    loadThread().then(
      (id) => {
        if (!cancelled) setThreadId(id);
      },
      (loadError: unknown) => {
        if (!cancelled) setError(loadError instanceof Error ? loadError.message : String(loadError));
      },
    );
    return () => {
      cancelled = true;
    };
  }, [loadThread]);

  useEffect(() => {
    const element = viewRef.current;
    if (browser === null || threadId === null || element === null) return;
    const bounds = readBounds(element);
    lastBounds.current = bounds;
    browser.attach({ tabId, threadId, url: storedUrl(urlKey), bounds, visible: false });
    const unsubscribe = browser.onState((next) => {
      if (next.tabId !== tabId) return;
      setState(next);
      if (next.url !== "") {
        localStorage.setItem(urlKey, next.url);
        setAddress((current) => (document.activeElement?.classList.contains("bbd-ie-address") ? current : next.url));
      }
      onTitleRef.current(next.title);
    });
    return () => {
      unsubscribe();
      shownRef.current = false;
      browser.setVisible({ tabId, visible: false });
    };
  }, [browser, threadId, tabId, urlKey]);

  const sync = useCallback((reassert = false) => {
    const element = viewRef.current;
    if (browser === null || threadId === null || element === null) return;
    const bounds = readBounds(element);
    const visible =
      !desktopWindow.minimized &&
      !document.hidden &&
      bounds.width > 0 &&
      bounds.height > 0 &&
      !occluded(element, bounds, desktopWindow.z);
    const previous = lastBounds.current;
    if (
      previous === null ||
      previous.x !== bounds.x ||
      previous.y !== bounds.y ||
      previous.width !== bounds.width ||
      previous.height !== bounds.height
    ) {
      lastBounds.current = bounds;
      browser.setBounds({ tabId, bounds });
    }
    if (shownRef.current === visible && !reassert) return;
    shownRef.current = visible;
    const request = { tabId, visible };
    if (browser.setVisibleWithoutFocus !== undefined) browser.setVisibleWithoutFocus(request);
    else browser.setVisible(request);
    setShown(visible);
  }, [browser, threadId, tabId, desktopWindow.minimized, desktopWindow.z]);

  useLayoutEffect(() => sync(), [sync, desktopWindow.rect]);

  useEffect(() => {
    if (browser === null || threadId === null) return;
    let frame = 0;
    let count = 0;
    const tick = () => {
      count += 1;
      sync(count % 8 === 0);
      frame = window.setTimeout(tick, 120);
    };
    const onResize = () => sync();
    tick();
    window.addEventListener("resize", onResize);
    window.addEventListener("bbd-drag-state", onResize);
    return () => {
      window.clearTimeout(frame);
      window.removeEventListener("resize", onResize);
      window.removeEventListener("bbd-drag-state", onResize);
    };
  }, [browser, threadId, sync]);

  const go = (event: FormEvent) => {
    event.preventDefault();
    const url = normalizeAddress(address);
    if (url === null || browser === null) return;
    browser.navigate({ tabId, url });
    (document.activeElement as HTMLElement | null)?.blur();
  };

  const loading = state?.isLoading === true;
  const disabled = browser === null || threadId === null;
  const status = error !== null
    ? `Could not open the browser: ${error}`
    : browser === null
      ? "Internet Explorer needs the bb desktop app."
      : threadId === null
        ? "Connecting…"
        : state?.errorText !== null && state?.errorText !== undefined
          ? state.errorText
          : loading
            ? `Opening page ${state?.url ?? ""}…`
            : "Done";

  return (
    <div className="bbd-program bbd-ie flex h-full flex-col">
      <ProgramMenuBar menus={[
        { label: "File", items: [{ label: "Open…", disabled, action: () => document.getElementById(addressId)?.focus() }] },
        { label: "Edit", items: [{ label: "Copy", disabled: true }, { label: "Select All", disabled: true }] },
        { label: "View", items: [{ label: "Stop", disabled: disabled || !loading, action: () => browser?.stop(tabId) }, { label: "Refresh", disabled, action: () => browser?.reload(tabId) }] },
        { label: "Favorites", items: [{ label: "Add to Favorites…", disabled: true }] },
        { label: "Tools", items: [{ label: "Internet Options…", disabled: true }] },
        { label: "Help", items: [{ label: "Browser content is provided by bb" }] },
      ]} />
      <div className="bbd-ie-toolbar flex-none">
        <button type="button" className="bbd-ie-nav" disabled={disabled || state?.canGoBack !== true} onClick={() => browser?.goBack(tabId)}>
          <NavArt kind="back" />
          <span>Back</span>
        </button>
        <button type="button" className="bbd-ie-nav" aria-label="Forward" title="Forward" disabled={disabled || state?.canGoForward !== true} onClick={() => browser?.goForward(tabId)}>
          <NavArt kind="forward" />
        </button>
        <button type="button" className="bbd-ie-tool" aria-label="Stop" title="Stop" disabled={disabled || !loading} onClick={() => browser?.stop(tabId)}>
          <StopArt />
        </button>
        <button type="button" className="bbd-ie-tool" aria-label="Refresh" title="Refresh" disabled={disabled} onClick={() => browser?.reload(tabId)}>
          <RefreshArt />
        </button>
        <button type="button" className="bbd-ie-tool" aria-label="Home" title="Home" disabled={disabled} onClick={() => browser?.navigate({ tabId, url: BROWSER_HOME })}>
          <HomeArt />
        </button>
      </div>
      <form className="bbd-ie-addressbar flex-none" onSubmit={go}>
        <label htmlFor={addressId} className="bbd-ie-address-label">
          Address
        </label>
        <input
          id={addressId}
          className="bbd-ie-address bbd-field bbd-sunken"
          value={address}
          spellCheck={false}
          autoComplete="off"
          disabled={disabled}
          onFocus={(event) => {
            setEditing(true);
            event.currentTarget.select();
          }}
          onBlur={() => setEditing(false)}
          onChange={(event) => setAddress(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Escape") {
              setAddress(state?.url ?? storedUrl(urlKey));
              event.currentTarget.blur();
            }
          }}
        />
        <button type="submit" className="bbd-button bbd-bevel bbd-ie-go" disabled={disabled || (!editing && address === state?.url)}>
          <span className="bbd-ie-go-arrow" aria-hidden>➜</span> Go
        </button>
      </form>
      <div ref={viewRef} className="bbd-ie-view min-h-0 flex-1" data-shown={shown}>
        {shown ? null : (
          <div className="bbd-ie-placeholder">
            <p>{state?.title ?? (browser === null ? "" : "Internet Explorer")}</p>
            {browser === null ? <p>Open bb's desktop app to browse here, or use the link below.</p> : null}
            {browser === null ? (
              <a href={BROWSER_HOME} target="_blank" rel="noopener noreferrer">
                Open {BROWSER_HOME} in a new tab
              </a>
            ) : null}
          </div>
        )}
      </div>
      <ProgramStatusBar>
        <span className="min-w-0 flex-1 truncate">{status}</span>
        <span className="bbd-ie-zone">Internet</span>
      </ProgramStatusBar>
    </div>
  );
}

/** The desktop's own browser window, backed by the native tab `TAB_ID`. */
export function InternetExplorerWindow({ window: desktopWindow }: { window: DesktopWindow }) {
  const desktop = useDesktop();
  const [pageTitle, setPageTitle] = useState<string | null>(null);
  const { call } = desktop;
  const loadThread = useCallback(async () => (await call("browserThread", {})).threadId, [call]);
  return (
    <WindowFrame
      window={desktopWindow}
      title={pageTitle === null || pageTitle === "" ? "Internet Explorer" : `${pageTitle} - Internet Explorer`}
      icon={<InternetExplorerArt size={16} />}
      keepMounted
    >
      <InternetExplorer window={desktopWindow} loadThread={loadThread} onTitle={setPageTitle} />
    </WindowFrame>
  );
}
