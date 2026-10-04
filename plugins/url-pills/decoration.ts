import { parsePillUrl, type PillUrl } from "./urls";
import { STYLESHEET } from "./stylesheet";

export const EFFECT_CLASS = "bb-url-pill-range";
const ATTR = "data-bb-url-pill";
const EXPANDED = "data-bb-url-pill-expanded";
const LABEL = "data-bb-url-pill-label";
const ICON = "--bb-url-pill-icon";
const MASK = "--bb-url-pill-mask";
const EDITOR = '[data-app-composer] [contenteditable="true"]';
const ANCHOR = '[data-message-column] [data-markdown-preview] a[href]';
const EXCLUDED = 'code, pre, blockquote, [data-prompt-mention], [data-prompt-mention-serialized-text], [data-citation], [role="doc-noteref"]';
const BLOCK = 'p, li, h1, h2, h3, h4, h5, h6, table, pre, blockquote, hr';

export interface IconResult { enabled: boolean; dataUrl: string | null }
export interface DecorationOptions {
  signal: AbortSignal;
  iconsEnabled?: boolean;
  fetchIcon?: (origin: string, signal: AbortSignal) => Promise<IconResult>;
}
interface Entry { url: PillUrl; composer: boolean; visible: boolean }

async function requestIcon(origin: string, signal: AbortSignal): Promise<IconResult> {
  const response = await fetch('/api/v1/plugins/url-pills/rpc/icon', {
    method: 'POST', headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ origin }), signal,
  });
  const body = await response.json() as { ok: boolean; result?: IconResult };
  if (!response.ok || !body.ok || !body.result) throw new Error('Icon unavailable');
  return body.result;
}

/** A trailing assistant URL is not proven complete by being a valid URL. */
export function hasFollowingBoundary(anchor: HTMLAnchorElement, preview: Element): boolean {
  let node: Node = anchor;
  while (node !== preview) {
    for (let next = node.nextSibling; next; next = next.nextSibling) {
      if (next instanceof Element && (next.matches(BLOCK) || next.tagName === 'BR')) return true;
      const text = next.textContent ?? '';
      if (text) return /^\s/u.test(text);
    }
    if (!node.parentNode) return false;
    node = node.parentNode;
  }
  return false;
}

export function candidateForElement(element: HTMLElement, origin: string): { url: PillUrl; composer: boolean } | null {
  if (element.closest(EXCLUDED)) return null;
  const text = element.textContent ?? '';
  const url = parsePillUrl(text, origin);
  if (!url) return null;
  if (element.classList.contains(EFFECT_CLASS)) {
    if (!element.closest(EDITOR) || element.querySelector('[contenteditable="false"], img, svg')) return null;
    return { url, composer: true };
  }
  if (!(element instanceof HTMLAnchorElement) || !element.matches(ANCHOR) || element.closest('[contenteditable]') || element.childElementCount) return null;
  const destination = element.getAttribute('href');
  // Preserve authored labels and any host destination rewriting.
  if (!destination) return null;
  try { if (new URL(text).href !== new URL(destination, origin).href) return null; } catch { return null; }
  const column = element.closest('[data-message-column]')!;
  const userMessage = element.closest('.ml-auto')?.parentElement === column;
  const preview = element.closest('[data-markdown-preview]')!;
  if (!userMessage && !hasFollowingBoundary(element, preview)) return null;
  return { url, composer: false };
}

function revealForSelection(element: HTMLElement): boolean {
  const selection = document.getSelection();
  if (!selection?.rangeCount) return false;
  for (let i = 0; i < selection.rangeCount; i++) {
    const range = selection.getRangeAt(i);
    if (!range.collapsed) {
      if (range.intersectsNode(element)) return true;
    } else if (element.contains(range.startContainer)) {
      const contents = document.createRange();
      contents.selectNodeContents(element);
      contents.setEnd(range.startContainer, range.startOffset);
      const offset = contents.toString().length;
      // A caret just after a paste can remain outside the compact visual.
      if (offset > 0 && offset < (element.textContent?.length ?? 0)) return true;
    }
  }
  return false;
}

function removeDecoration(element: HTMLElement): void {
  element.removeAttribute(ATTR);
  element.removeAttribute(EXPANDED);
  element.removeAttribute(LABEL);
  element.style.removeProperty(ICON);
  element.style.removeProperty(MASK);
}

/** Owns only attributes, custom properties and its detached inspection overlay. */
export function mountUrlPills(options: DecorationOptions): { dispose(): void; setIconsEnabled(enabled: boolean): void } {
  const { signal, fetchIcon = requestIcon } = options;
  let enabled = options.iconsEnabled ?? false;
  let disposed = false;
  let frame: number | null = null;
  let composition: HTMLElement | null = null;
  let dragging = false;
  let inspector: HTMLElement | null = null;
  let inspected: HTMLAnchorElement | null = null;
  let inspectUrl = '';
  let touchTimer: ReturnType<typeof setTimeout> | null = null;
  let touchStart: { x: number; y: number; anchor: HTMLAnchorElement } | null = null;
  let suppressClick: HTMLAnchorElement | null = null;
  let suppressUntil = 0;
  const entries = new Map<HTMLElement, Entry>();
  const cache = new Map<string, { value: string | null; expires: number }>();
  const requests = new Map<string, AbortController>();
  const style = document.createElement('style');
  style.dataset.bbUrlPills = '';
  style.textContent = STYLESHEET;
  document.head.append(style);

  function syncIcon(element: HTMLElement, entry: Entry): void {
    const cached = enabled && entry.url.iconOrigin ? cache.get(entry.url.iconOrigin) : undefined;
    const value = cached && cached.expires > Date.now() ? cached.value : null;
    if (value) { element.style.setProperty(ICON, `url("${value}")`); element.style.setProperty(MASK, "none"); }
    else { element.style.removeProperty(ICON); element.style.removeProperty(MASK); }
  }

  function syncRequests(): void {
    if (disposed) return;
    const needed = new Set<string>();
    if (enabled && document.visibilityState !== 'hidden') for (const entry of entries.values()) {
      if (entry.visible && entry.url.iconOrigin) needed.add(entry.url.iconOrigin);
    }
    for (const [origin, controller] of requests) if (!needed.has(origin)) {
      controller.abort(); requests.delete(origin);
    }
    for (const origin of needed) {
      if (requests.size >= 4) break;
      if (requests.has(origin)) continue;
      const cached = cache.get(origin);
      if (cached && cached.expires > Date.now()) continue;
      const controller = new AbortController();
      requests.set(origin, controller);
      const timeout = setTimeout(() => controller.abort(), 7000);
      void fetchIcon(origin, controller.signal).then((result) => {
        if (disposed || controller.signal.aborted || requests.get(origin) !== controller) return;
        if (!result.enabled) { setIconsEnabled(false); return; }
        const value = typeof result.dataUrl === 'string' && result.dataUrl.length <= 360000
          && /^data:image\/(?:png|jpeg|gif|webp|x-icon|vnd\.microsoft\.icon);base64,[A-Za-z0-9+/]+=*$/.test(result.dataUrl) ? result.dataUrl : null;
        cache.delete(origin);
        cache.set(origin, { value, expires: Date.now() + (value ? 7 * 86400000 : 3600000) });
        while (cache.size > 500) cache.delete(cache.keys().next().value!);
        for (const [element, entry] of entries) if (entry.url.iconOrigin === origin) syncIcon(element, entry);
      }).catch(() => {
        if (!disposed && requests.get(origin) === controller) {
          cache.set(origin, { value: null, expires: Date.now() + 3600000 });
          while (cache.size > 500) cache.delete(cache.keys().next().value!);
        }
      }).finally(() => {
        clearTimeout(timeout);
        if (requests.get(origin) === controller) requests.delete(origin);
        syncRequests();
      });
    }
  }

  const visibility = typeof IntersectionObserver === 'undefined' ? null : new IntersectionObserver((changes) => {
    for (const change of changes) {
      const entry = entries.get(change.target as HTMLElement);
      if (entry) entry.visible = change.isIntersecting;
    }
    syncRequests();
  });

  function closeInspector(restoreFocus = true): void {
    inspector?.remove(); inspector = null;
    if (restoreFocus && inspected?.isConnected) inspected.focus({ preventScroll: true });
    inspected = null; inspectUrl = '';
  }

  function showInspector(anchor: HTMLAnchorElement): void {
    const entry = entries.get(anchor);
    if (!entry || entry.composer) return;
    closeInspector(false);
    inspected = anchor; inspectUrl = entry.url.text;
    const panel = document.createElement('div');
    panel.dataset.bbUrlPillInspector = '';
    panel.setAttribute('role', 'dialog'); panel.setAttribute('aria-label', 'Link destination');
    const label = document.createElement('label'); label.textContent = 'Full destination';
    const address = document.createElement('textarea'); address.readOnly = true; address.value = inspectUrl;
    address.setAttribute('aria-label', 'Full destination'); address.rows = 3;
    const copy = document.createElement('button'); copy.type = 'button'; copy.textContent = 'Copy link';
    const close = document.createElement('button'); close.type = 'button'; close.textContent = 'Close';
    const status = document.createElement('div'); status.setAttribute('role', 'status');
    copy.addEventListener('click', () => {
      const url = address.value;
      void Promise.resolve().then(() => navigator.clipboard.writeText(url)).then(() => {
        if (inspector === panel) closeInspector();
      }).catch(() => {
        if (inspector !== panel) return;
        status.textContent = 'Select and copy the address above.'; address.focus(); address.select();
      });
    });
    close.addEventListener('click', () => closeInspector());
    panel.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') { event.preventDefault(); event.stopPropagation(); closeInspector(); }
      if (event.key === 'Tab') {
        const focusable = [address, copy, close];
        const index = focusable.indexOf(document.activeElement as typeof address);
        event.preventDefault(); focusable[(index + (event.shiftKey ? 2 : 1)) % 3].focus();
      }
    });
    panel.append(label, address, copy, close, status); document.body.append(panel); inspector = panel;
    const bounds = anchor.getBoundingClientRect();
    panel.style.left = `${Math.max(12, Math.min(bounds.left, innerWidth - panel.offsetWidth - 12))}px`;
    panel.style.top = `${Math.max(12, Math.min(bounds.bottom + 8, innerHeight - panel.offsetHeight - 12))}px`;
    address.focus({ preventScroll: true });
  }

  function scan(): void {
    frame = null;
    if (disposed) return;
    const found = new Set<HTMLElement>();
    const candidates = document.querySelectorAll<HTMLElement>(`${EDITOR} .${EFFECT_CLASS}, ${ANCHOR}`);
    for (const element of Array.from(candidates)) {
      const candidate = candidateForElement(element, location.origin);
      if (!candidate) continue;
      found.add(element);
      let entry = entries.get(element);
      if (!entry || entry.url.text !== candidate.url.text || entry.composer !== candidate.composer) {
        entry = { ...candidate, visible: entry?.visible ?? (!visibility && element.getClientRects().length > 0) };
        entries.set(element, entry); visibility?.observe(element);
      }
      if (element.getAttribute(ATTR) !== (entry.composer ? 'composer' : 'message')) element.setAttribute(ATTR, entry.composer ? 'composer' : 'message');
      if (element.getAttribute(LABEL) !== entry.url.label) element.setAttribute(LABEL, entry.url.label);
      const expanded = entry.composer && (dragging || composition?.contains(element) || revealForSelection(element));
      element.toggleAttribute(EXPANDED, !!expanded);
      syncIcon(element, entry);
    }
    for (const [element] of entries) if (!found.has(element)) {
      removeDecoration(element); entries.delete(element); visibility?.unobserve(element);
    }
    if (inspected && (!entries.has(inspected) || entries.get(inspected)?.url.text !== inspectUrl)) closeInspector(false);
    syncRequests();
    // Only owned attribute/style mutations occurred during this synchronous pass.
    observer.takeRecords();
  }

  function queue(): void { if (!disposed && frame === null) frame = requestAnimationFrame(scan); }
  const observer = new MutationObserver((records) => {
    const relevant = records.some((record) => {
      const target = record.target instanceof Element ? record.target : record.target.parentElement;
      if (target?.closest('[data-bb-url-pill-inspector]')) return false;
      if (target?.closest('[data-app-composer], [data-message-column]')) return true;
      return [...Array.from(record.addedNodes), ...Array.from(record.removedNodes)].some((node) => node instanceof Element
        && (node.matches('[data-app-composer], [data-message-column]')
          || node.querySelector('[data-app-composer], [data-message-column]')));
    });
    if (relevant) queue();
  });
  observer.observe(document.body, { childList: true, characterData: true, subtree: true, attributes: true, attributeFilter: ['href', 'class', 'contenteditable'] });

  function revealEditor(target: EventTarget | null): HTMLElement | null {
    const editor = target instanceof Element ? target.closest<HTMLElement>(EDITOR) : null;
    if (editor) for (const [element, entry] of entries) if (entry.composer && editor.contains(element)) element.setAttribute(EXPANDED, '');
    return editor;
  }
  function messageAnchor(target: EventTarget | null): HTMLAnchorElement | null {
    const anchor = target instanceof Element ? target.closest<HTMLAnchorElement>(`a[${ATTR}="message"]`) : null;
    return anchor && entries.has(anchor) ? anchor : null;
  }
  function cancelTouch(): void { if (touchTimer) clearTimeout(touchTimer); touchTimer = null; touchStart = null; }
  function pointerDown(event: PointerEvent): void {
    if (inspector && event.target instanceof Node && !inspector.contains(event.target)) closeInspector(false);
    dragging = !!revealEditor(event.target);
    const anchor = messageAnchor(event.target);
    if (event.pointerType === 'touch' && anchor) {
      touchStart = { x: event.clientX, y: event.clientY, anchor };
      touchTimer = setTimeout(() => {
        touchTimer = null; suppressClick = anchor; suppressUntil = Date.now() + 1200; showInspector(anchor);
      }, 550);
    }
  }
  function pointerMove(event: PointerEvent): void {
    if (touchStart && Math.hypot(event.clientX - touchStart.x, event.clientY - touchStart.y) > 8) cancelTouch();
  }
  function pointerUp(): void { dragging = false; cancelTouch(); queue(); }
  function keyDown(event: KeyboardEvent): void {
    const anchor = messageAnchor(event.target);
    if (anchor && (event.key === 'ContextMenu' || (event.shiftKey && event.key === 'F10'))) {
      event.preventDefault(); event.stopPropagation(); showInspector(anchor); return;
    }
    if (revealEditor(event.target)) queue();
  }
  function contextMenu(event: MouseEvent): void {
    const anchor = messageAnchor(event.target);
    if (anchor) { event.preventDefault(); event.stopPropagation(); cancelTouch(); showInspector(anchor); }
  }
  function click(event: MouseEvent): void {
    if (suppressClick && event.target instanceof Node && suppressClick.contains(event.target) && Date.now() < suppressUntil) {
      event.preventDefault(); event.stopPropagation(); suppressClick = null;
    }
  }
  function compositionStart(event: CompositionEvent): void { composition = revealEditor(event.target); }
  function compositionEnd(): void { composition = null; queue(); }
  const listeners: [string, EventListener][] = [
    ['selectionchange', queue], ['pointerdown', pointerDown as EventListener], ['pointermove', pointerMove as EventListener],
    ['pointerup', pointerUp], ['pointercancel', pointerUp], ['keydown', keyDown as EventListener],
    ['contextmenu', contextMenu as EventListener], ['click', click as EventListener],
    ['compositionstart', compositionStart as EventListener], ['compositionend', compositionEnd],
    ['focusout', queue], ['visibilitychange', queue],
  ];
  for (const [type, listener] of listeners) document.addEventListener(type, listener, true);
  window.addEventListener('resize', queue);
  window.addEventListener('scroll', cancelTouch, true);

  function setIconsEnabled(value: boolean): void {
    if (disposed || enabled === value) return;
    enabled = value;
    if (!enabled) {
      for (const controller of requests.values()) controller.abort();
      requests.clear(); cache.clear();
    }
    for (const [element, entry] of entries) syncIcon(element, entry);
    syncRequests();
  }
  function dispose(): void {
    if (disposed) return;
    disposed = true;
    if (frame !== null) cancelAnimationFrame(frame);
    observer.disconnect(); visibility?.disconnect(); cancelTouch(); closeInspector(false);
    for (const controller of requests.values()) controller.abort();
    requests.clear(); cache.clear();
    for (const element of entries.keys()) removeDecoration(element);
    entries.clear(); style.remove();
    for (const [type, listener] of listeners) document.removeEventListener(type, listener, true);
    window.removeEventListener('resize', queue); window.removeEventListener('scroll', cancelTouch, true);
    signal.removeEventListener('abort', dispose);
  }
  signal.addEventListener('abort', dispose, { once: true });
  if (signal.aborted) dispose(); else scan();
  return { dispose, setIconsEnabled };
}
