import { useCallback, useEffect, useLayoutEffect, useRef, useState, type FormEvent } from "react";
import { experimental_Icon as Icon } from "@get-bb/plugin-sdk/app";
import { BROWSER_HOME, browserTab, nativeBrowser, normalizeAddress, rememberUrl, storedUrl, type BrowserState, type ViewBounds } from "./browser";
import { useCamera, useCanvasControls } from "./camera";
import { boundsOf } from "./core";
import { useDesktop } from "./data";
import { WindowFrame, useWindowManager, type DesktopWindow, type WindowManager } from "./windows";

/**
 * A web page opened from a thread's chat, as Desktop's bb Explorer shows one: bb desktop's native browser view, bound to
 * the thread, drawn over the window. A native view can't be zoomed, clipped or stacked under other windows, so the page
 * shows only while the window is at 100%, fully on the canvas and uncovered; otherwise a quiet placeholder names it.
 */

/** Plugin and bb surfaces that draw over a browser window; native views would otherwise paint over them. */
const OCCLUDERS = [
  ".cdc-menu",
  ".cdc-dialog-scrim",
  ".cdc-composer[data-open]",
  ".cdc-dock",
  ".cdc-camera",
  ".cdc-dock-preview",
  ".cdc-thread-drag-preview",
  "[role='menu']",
  "[role='alertdialog']",
  "[role='dialog'][aria-modal='true']",
  "[data-radix-popper-content-wrapper]",
  "[data-sonner-toast]",
].join(",");

const overlaps = (a: DOMRect, b: ViewBounds) => a.width > 0 && a.height > 0 && a.left < b.x + b.width && a.right > b.x && a.top < b.y + b.height && a.bottom > b.y;

function readBounds(element: HTMLElement): ViewBounds {
  const rect = element.getBoundingClientRect();
  return { x: Math.round(rect.left), y: Math.round(rect.top), width: Math.round(rect.width), height: Math.round(rect.height) };
}

/** Whether the page can show at the view's place: unscaled, inside the canvas, and with nothing over it. */
function canShow(element: HTMLElement, bounds: ViewBounds, root: HTMLElement | null, z: number): boolean {
  if (document.querySelector(".cdc-drag-shield") !== null) return false;
  if (bounds.width <= 0 || bounds.height <= 0 || Math.abs(bounds.width - element.offsetWidth) > 1) return false;
  const area = root?.getBoundingClientRect();
  if (area === undefined || bounds.x < area.left - 1 || bounds.y < area.top - 1 || bounds.x + bounds.width > area.right + 1 || bounds.y + bounds.height > area.bottom + 1) return false;
  const own = element.closest<HTMLElement>(".cdc-window");
  for (const candidate of document.querySelectorAll<HTMLElement>(`${OCCLUDERS}, .cdc-window`)) {
    if (candidate === own || own?.contains(candidate) || candidate.hidden) continue;
    const isWindow = candidate.classList.contains("cdc-window");
    if (!isWindow && candidate.closest(".cdc-window") !== null) continue;
    if (isWindow && Number(candidate.style.zIndex) <= z) continue;
    if (overlaps(candidate.getBoundingClientRect(), bounds)) return false;
  }
  return true;
}

/** Opens a link from a thread's chat in that thread's browser window, beside the thread window, or reuses it. */
export function openThreadLink(manager: WindowManager, threadId: string, url: string) {
  const existing = manager.windows.find((window) => window.spec.kind === "browser" && window.spec.threadId === threadId);
  if (existing?.spec.kind === "browser") {
    const tab = browserTab(existing.spec.tabId);
    rememberUrl(tab.urlKey, url);
    nativeBrowser()?.navigate({ tabId: tab.tabId, url });
    manager.focus(existing.id, { reveal: true });
    return;
  }
  const tabId = Math.random().toString(36).slice(2, 10);
  rememberUrl(browserTab(tabId).urlKey, url);
  const thread = manager.windows.find((window) => window.spec.kind === "thread" && window.spec.threadId === threadId);
  if (thread === undefined || thread.dock !== undefined || thread.maximized) {
    manager.open({ kind: "browser", threadId, tabId });
    return;
  }
  // Beside the thread, past its Info window if that is docked on the right; both stay in view.
  const info = manager.windows.find((window) => window.spec.kind === "info" && window.spec.threadId === threadId && !window.minimized);
  const right = Math.max(thread.rect.x + thread.rect.width, info === undefined ? -Infinity : info.rect.x + info.rect.width);
  const beside = { x: right + 24, y: thread.rect.y, width: 960, height: Math.max(560, thread.rect.height) };
  manager.open({ kind: "browser", threadId, tabId }, beside, { reveal: boundsOf([thread.rect, beside])! });
}

export function BrowserWindow({ window: desktopWindow, threadId, tabId }: { window: DesktopWindow; threadId: string; tabId: string }) {
  const desktop = useDesktop();
  const manager = useWindowManager();
  const controls = useCanvasControls();
  const camera = useCamera();
  const browser = nativeBrowser();
  const tab = browserTab(tabId);
  const viewRef = useRef<HTMLDivElement>(null);
  const [state, setState] = useState<BrowserState | null>(null);
  const [address, setAddress] = useState(() => storedUrl(tab.urlKey));
  const [editing, setEditing] = useState(false);
  const [shown, setShown] = useState(false);
  const lastBounds = useRef<ViewBounds | null>(null);
  const shownRef = useRef(false);
  const attached = useRef(false);

  useEffect(() => {
    const element = viewRef.current;
    if (browser === null || element === null) return;
    const bounds = readBounds(element);
    lastBounds.current = bounds;
    browser.attach({ tabId: tab.tabId, threadId, url: storedUrl(tab.urlKey), bounds, visible: false });
    attached.current = true;
    const unsubscribe = browser.onState((next) => {
      if (next.tabId !== tab.tabId) return;
      setState(next);
      if (next.url !== "") {
        rememberUrl(tab.urlKey, next.url);
        setAddress((current) => (document.activeElement?.classList.contains("cdc-address") ? current : next.url));
      }
    });
    return () => {
      unsubscribe();
      attached.current = false;
      shownRef.current = false;
      browser.setVisible({ tabId: tab.tabId, visible: false });
    };
  }, [browser, tab.tabId, tab.urlKey, threadId]);

  const sync = useCallback((reassert = false) => {
    const element = viewRef.current;
    if (browser === null || element === null || !attached.current) return;
    const bounds = readBounds(element);
    const visible = !desktopWindow.minimized && !document.hidden && canShow(element, bounds, controls.rootRef.current, desktopWindow.z);
    const previous = lastBounds.current;
    if (visible && (previous === null || previous.x !== bounds.x || previous.y !== bounds.y || previous.width !== bounds.width || previous.height !== bounds.height)) {
      lastBounds.current = bounds;
      browser.setBounds({ tabId: tab.tabId, bounds });
    }
    if (shownRef.current === visible && !reassert) return;
    shownRef.current = visible;
    const request = { tabId: tab.tabId, visible };
    if (browser.setVisibleWithoutFocus !== undefined) browser.setVisibleWithoutFocus(request);
    else browser.setVisible(request);
    setShown(visible);
  }, [browser, controls.rootRef, desktopWindow.minimized, desktopWindow.z, tab.tabId]);

  // Follow the window and the camera at once; a short tick catches menus, drags and windows passing over it.
  useLayoutEffect(() => sync(), [sync, desktopWindow.rect, desktopWindow.dock, desktopWindow.maximized, camera]);
  useEffect(() => {
    if (browser === null) return;
    let timer = 0;
    let count = 0;
    const tick = () => {
      count += 1;
      sync(count % 8 === 0);
      timer = window.setTimeout(tick, 120);
    };
    tick();
    const onResize = () => sync();
    window.addEventListener("resize", onResize);
    document.addEventListener("visibilitychange", onResize);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener("resize", onResize);
      document.removeEventListener("visibilitychange", onResize);
    };
  }, [browser, sync]);

  const go = (event: FormEvent) => {
    event.preventDefault();
    const url = normalizeAddress(address);
    if (url === null || browser === null) return;
    browser.navigate({ tabId: tab.tabId, url });
    (document.activeElement as HTMLElement | null)?.blur();
  };

  const loading = state?.isLoading === true;
  const disabled = browser === null;
  let hostname = "";
  try {
    hostname = new URL(state?.url || storedUrl(tab.urlKey)).hostname;
  } catch {
    // No page identity until the browser reports a valid URL.
  }
  const pageTitle = state?.title?.trim() || hostname || "Browser";
  const thread = desktop.threadById.get(threadId);

  return (
    <WindowFrame window={desktopWindow} title={pageTitle} icon="Globe" keepMounted overview={{ detail: hostname || undefined }}
      titleActions={thread === undefined ? undefined : (
        <button type="button" className="cdc-title-button" aria-label={`Show ${thread.displayTitle}`} title={`From ${thread.displayTitle}`}
          onClick={() => desktop.openThread(threadId)}>
          <Icon name="ArrowTurnBackward" />
        </button>
      )}
      statusBar={<span className="cdc-statusbar-note">{browser === null ? "Browser windows need the bb desktop app." : state?.errorText ?? (loading ? `Opening ${hostname}…` : thread === undefined ? hostname : `From ${thread.displayTitle}`)}</span>}>
      <div className="cdc-browser">
        <form className="cdc-toolbar" onSubmit={go}>
          <span className="cdc-nav">
            <button type="button" className="cdc-tool" aria-label="Back" title="Back" disabled={disabled || state?.canGoBack !== true} onClick={() => browser?.goBack(tab.tabId)}><Icon name="ChevronLeft" /></button>
            <button type="button" className="cdc-tool" aria-label="Forward" title="Forward" disabled={disabled || state?.canGoForward !== true} onClick={() => browser?.goForward(tab.tabId)}><Icon name="ChevronRight" /></button>
            {loading
              ? <button type="button" className="cdc-tool" aria-label="Stop" title="Stop" disabled={disabled} onClick={() => browser?.stop(tab.tabId)}><Icon name="X" /></button>
              : <button type="button" className="cdc-tool" aria-label="Reload" title="Reload" disabled={disabled} onClick={() => browser?.reload(tab.tabId)}><Icon name="RotateCcw" /></button>}
          </span>
          <label className="cdc-search cdc-address-field">
            <Icon name={loading ? "Loading" : "Globe"} />
            <input className="cdc-address" aria-label="Address" value={address} spellCheck={false} autoComplete="off" disabled={disabled}
              onFocus={(event) => { setEditing(true); event.currentTarget.select(); }}
              onBlur={() => setEditing(false)}
              onChange={(event) => setAddress(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Escape") {
                  setAddress(state?.url ?? storedUrl(tab.urlKey));
                  event.currentTarget.blur();
                }
              }} />
          </label>
          {editing ? <button type="submit" className="cdc-tool" aria-label="Go" title="Go"><Icon name="ArrowRight" /></button> : null}
        </form>
        <div ref={viewRef} className="cdc-browser-view" data-shown={shown || undefined}>
          {shown ? null : (
            <div className="cdc-browser-placeholder">
              <Icon name="Globe" />
              <p className="cdc-browser-title">{browser === null ? "Browser windows need the bb desktop app" : pageTitle}</p>
              {browser === null
                ? <a href={state?.url || storedUrl(tab.urlKey) || BROWSER_HOME} target="_blank" rel="noopener noreferrer">Open {hostname || "the page"} in a new tab</a>
                : hostname ? <p className="cdc-browser-host">{hostname}</p> : null}
            </div>
          )}
        </div>
      </div>
    </WindowFrame>
  );
}
