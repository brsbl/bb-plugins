import { parsePillUrl, type PillUrl } from "./urls";
import { cssString, pillStyles, STYLESHEET } from "./stylesheet";

export const EFFECT_CLASS = "bb-url-pill-range";
const ATTR = "data-bb-url-pill";
const EXPANDED = "data-bb-url-pill-expanded";
const LABEL = "data-bb-url-pill-label";
const ICON = "--bb-url-pill-icon";
const MASK = "--bb-url-pill-mask";
const ICON_BACKGROUND = "--bb-url-pill-icon-background";
const EDITOR = '[data-app-composer] [contenteditable="true"]';
const ANCHOR = '[data-message-column] [data-markdown-preview] a[href]';
const EXCLUDED = 'code, pre, blockquote, [data-prompt-mention], [data-prompt-mention-serialized-text], [data-citation], [role="doc-noteref"]';
const BLOCK = 'p, li, h1, h2, h3, h4, h5, h6, table, pre, blockquote, hr';
const COMPOSER_ROOT = 'data-bb-url-pill-composer-root';
let composerGeneration = 0;

export interface IconResult { enabled: boolean; dataUrl: string | null }
export interface DecorationOptions {
  signal: AbortSignal;
  iconsEnabled?: boolean;
  fetchIcon?: (origin: string, signal: AbortSignal) => Promise<IconResult>;
  openUrl?: (url: string) => boolean;
}
interface Entry { url: PillUrl; composer: boolean; visible: boolean; selector?: string; expanded?: boolean }

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
  element.style.removeProperty(ICON_BACKGROUND);
}

/** Composer content is read-only: only its outer wrapper and an owned stylesheet are changed. */
export function mountUrlPills(options: DecorationOptions): { dispose(): void; setIconsEnabled(enabled: boolean): void } {
  const { signal, fetchIcon = requestIcon } = options;
  let enabled = options.iconsEnabled ?? false;
  let disposed = false;
  let frame: number | null = null;
  let composition: HTMLElement | null = null;
  let explicitEdit: HTMLElement | null = null;
  let inputEdit: HTMLElement | null = null;
  const entries = new Map<HTMLElement, Entry>();
  const cache = new Map<string, { value: string | null; expires: number }>();
  const requests = new Map<string, AbortController>();
  const composerRoots = new Map<HTMLElement, string>();
  const generation = ++composerGeneration;
  let nextRoot = 0;
  const composerStyle = document.createElement('style');
  composerStyle.dataset.bbUrlPillsComposer = '';
  document.head.append(composerStyle);
  const style = document.createElement('style');
  style.dataset.bbUrlPills = '';
  style.textContent = STYLESHEET;
  document.head.append(style);

  function iconValue(entry: Entry): string | null {
    const cached = enabled && entry.url.iconOrigin ? cache.get(entry.url.iconOrigin) : undefined;
    return cached && cached.expires > Date.now() ? cached.value : null;
  }

  function composerSelector(element: HTMLElement): string | undefined {
    const editor = element.closest<HTMLElement>(EDITOR);
    const root = editor?.closest<HTMLElement>('[data-promptbox-editor-content]')
      ?? editor?.closest<HTMLElement>('[data-app-composer]');
    // Never place a marker on or inside the ProseMirror-controlled tree.
    if (!editor || !root || root.closest('[contenteditable]') || editor.contains(root)) return;
    let id = composerRoots.get(root);
    if (!id) { id = `url-pills-${generation}-${++nextRoot}`; composerRoots.set(root, id); }
    if (root.getAttribute(COMPOSER_ROOT) !== id) root.setAttribute(COMPOSER_ROOT, id);
    const path: string[] = [];
    let current: Element = element;
    while (current !== root) {
      const parent = current.parentElement;
      if (!parent) return;
      path.unshift(`:nth-child(${Array.prototype.indexOf.call(parent.children, current) + 1})${current === editor ? '[contenteditable="true"]' : ''}`);
      current = parent;
    }
    return `[${COMPOSER_ROOT}="${id}"] > ${path.join(' > ')}.${EFFECT_CLASS}`;
  }

  function updateComposerStyle(): void {
    const compact: { selector: string; entry: Entry }[] = [];
    for (const [element, entry] of entries) {
      if (entry.composer && !entry.expanded && entry.selector && element.isConnected && element.matches(entry.selector) && element.textContent === entry.url.text) {
        compact.push({ selector: entry.selector, entry });
      }
    }
    const rules = pillStyles(compact.map(({ selector }) => selector), 'var(--bb-url-pill-label)')
      + compact.map(({ selector, entry }) => {
        const icon = iconValue(entry);
        return `${selector} { --bb-url-pill-label: ${cssString(entry.url.label)};${icon ? ` ${ICON}: url(${cssString(icon)}); ${MASK}: none; ${ICON_BACKGROUND}: #fff;` : ''} }`;
      }).join('\n');
    if (composerStyle.textContent !== rules) composerStyle.textContent = rules;
  }

  function syncIcon(element: HTMLElement, entry: Entry): void {
    if (entry.composer) return;
    const value = iconValue(entry);
    if (value) { element.style.setProperty(ICON, `url("${value}")`); element.style.setProperty(MASK, "none"); element.style.setProperty(ICON_BACKGROUND, "#fff"); }
    else { element.style.removeProperty(ICON); element.style.removeProperty(MASK); element.style.removeProperty(ICON_BACKGROUND); }
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
        updateComposerStyle();
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

  function scan(): void {
    frame = null;
    if (disposed) return;
    if (explicitEdit && (!explicitEdit.isConnected || !caretTouches(explicitEdit))) explicitEdit = null;
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
      if (entry.composer) {
        entry.selector = composerSelector(element);
        entry.expanded = !!(explicitEdit === element || composition?.contains(element)
          || (inputEdit?.contains(element) && caretTouches(element)) || revealForSelection(element));
      } else {
        if (element.getAttribute(ATTR) !== 'message') element.setAttribute(ATTR, 'message');
        if (element.getAttribute(LABEL) !== entry.url.label) element.setAttribute(LABEL, entry.url.label);
        syncIcon(element, entry);
      }
    }
    for (const [element, entry] of entries) if (!found.has(element)) {
      if (!entry.composer) removeDecoration(element);
      entries.delete(element); visibility?.unobserve(element);
    }
    for (const [root, id] of composerRoots) if (!root.isConnected || !Array.from(entries).some(([element, entry]) => entry.composer && root.contains(element))) {
      if (root.getAttribute(COMPOSER_ROOT) === id) root.removeAttribute(COMPOSER_ROOT);
      composerRoots.delete(root);
    }
    updateComposerStyle();
    syncRequests();
    // Only owned attribute/style mutations occurred during this synchronous pass.
    observer.takeRecords();
  }

  function queue(): void { if (!disposed && frame === null) frame = requestAnimationFrame(scan); }
  const observer = new MutationObserver((records) => {
    const relevant = records.some((record) => {
      const target = record.target instanceof Element ? record.target : record.target.parentElement;
      if (target?.closest('[data-app-composer], [data-message-column]')) return true;
      return [...Array.from(record.addedNodes), ...Array.from(record.removedNodes)].some((node) => node instanceof Element
        && (node.matches('[data-app-composer], [data-message-column]')
          || node.querySelector('[data-app-composer], [data-message-column]')));
    });
    if (relevant) {
      // Child positions may have changed. Drop old selectors before the next
      // paint instead of briefly applying yesterday's label to a new range.
      if (records.some((record) => {
        const target = record.target instanceof Element ? record.target : record.target.parentElement;
        return target?.closest(EDITOR);
      }) && composerStyle.textContent) composerStyle.textContent = '';
      queue();
    }
  });
  observer.observe(document.body, { childList: true, characterData: true, subtree: true, attributes: true, attributeFilter: ['href', 'class', 'contenteditable'] });

  function caretTouches(element: HTMLElement): boolean {
    const selection = document.getSelection();
    if (!selection?.isCollapsed || !selection.anchorNode || !element.parentElement) return false;
    const bounds = document.createRange();
    bounds.selectNode(element);
    if (bounds.comparePoint(selection.anchorNode, selection.anchorOffset) === 0) return true;
    // Browsers may represent the same visual edge using an adjacent Text node.
    const node = selection.anchorNode;
    return node instanceof Text && ((selection.anchorOffset === 0 && node.previousSibling === element)
      || (selection.anchorOffset === node.length && node.nextSibling === element));
  }
  function revealForComposition(target: EventTarget | null): HTMLElement | null {
    const editor = target instanceof Element ? target.closest<HTMLElement>(EDITOR) : null;
    if (editor) {
      for (const [element, entry] of entries) if (entry.composer && editor.contains(element)) entry.expanded = true;
      updateComposerStyle();
    }
    return editor;
  }
  function pillAt(target: EventTarget | null): HTMLElement | null {
    const pill = target instanceof Element ? target.closest<HTMLElement>(`.${EFFECT_CLASS}, a[${ATTR}="message"]`) : null;
    return pill && entries.has(pill) ? pill : null;
  }
  function pointerDown(event: PointerEvent): void {
    inputEdit = null;
    const range = event.target instanceof Element ? event.target.closest<HTMLElement>(`.${EFFECT_CLASS}`) : null;
    const navigable = range && entries.get(range)?.composer && !entries.get(range)?.expanded && options.openUrl;
    explicitEdit = !navigable && range && entries.get(range)?.composer ? range : null;
    if (navigable && event.button === 0) event.preventDefault();
    // Keep geometry unchanged while the browser places the caret. The next
    // frame reveals only the explicitly clicked range or actual selection.
    queue();
  }
  function keyDown(event: KeyboardEvent): void {
    if (event.target instanceof Element && event.target.closest(EDITOR)) queue();
  }
  function click(event: MouseEvent): void {
    const pill = pillAt(event.target);
    const entry = pill ? entries.get(pill) : null;
    if (pill && entry?.composer && !entry.expanded && pill.textContent === entry.url.text && options.openUrl && event.button === 0) {
      event.preventDefault(); event.stopPropagation();
      options.openUrl(entry.url.text);
    }
  }
  function compositionStart(event: CompositionEvent): void { composition = revealForComposition(event.target); }
  function compositionEnd(): void { composition = null; queue(); }
  function beforeInput(event: InputEvent): void {
    const editor = event.target instanceof Element ? event.target.closest<HTMLElement>(EDITOR) : null;
    if (!editor) return;
    // Native edits may replace the range span. Keep intent on its stable editor
    // and reveal only the range at the caret, including a query/fragment end.
    const insertsText = /^insert(?:Text|CompositionText|ReplacementText)$/.test(event.inputType) && /\S/u.test(event.data ?? '');
    inputEdit = insertsText || event.inputType.startsWith('delete') ? editor : null;
    queue();
  }
  function paste(): void { inputEdit = null; queue(); }
  function focusOut(event: FocusEvent): void {
    const editor = event.target instanceof Element ? event.target.closest(EDITOR) : null;
    if (explicitEdit && editor?.contains(explicitEdit)) explicitEdit = null;
    if (editor === inputEdit) inputEdit = null;
    queue();
  }
  const listeners: [string, EventListener][] = [
    ['selectionchange', queue], ['pointerdown', pointerDown as EventListener],
    ['pointerup', queue], ['pointercancel', queue], ['keydown', keyDown as EventListener],
    ['click', click as EventListener],
    ['compositionstart', compositionStart as EventListener], ['compositionend', compositionEnd],
    ['beforeinput', beforeInput as EventListener], ['paste', paste],
    ['focusout', focusOut as EventListener], ['visibilitychange', queue],
  ];
  for (const [type, listener] of listeners) document.addEventListener(type, listener, true);
  window.addEventListener('resize', queue);
  window.addEventListener('scroll', queue, true);
  window.visualViewport?.addEventListener('resize', queue);
  window.visualViewport?.addEventListener('scroll', queue);

  function setIconsEnabled(value: boolean): void {
    if (disposed || enabled === value) return;
    enabled = value;
    if (!enabled) {
      for (const controller of requests.values()) controller.abort();
      requests.clear(); cache.clear();
    }
    for (const [element, entry] of entries) syncIcon(element, entry);
    updateComposerStyle();
    syncRequests();
  }
  function dispose(): void {
    if (disposed) return;
    disposed = true;
    if (frame !== null) cancelAnimationFrame(frame);
    observer.disconnect(); visibility?.disconnect();
    for (const controller of requests.values()) controller.abort();
    requests.clear(); cache.clear();
    for (const [element, entry] of entries) if (!entry.composer) removeDecoration(element);
    for (const [root, id] of composerRoots) if (root.getAttribute(COMPOSER_ROOT) === id) root.removeAttribute(COMPOSER_ROOT);
    composerRoots.clear(); entries.clear(); style.remove(); composerStyle.remove();
    for (const [type, listener] of listeners) document.removeEventListener(type, listener, true);
    window.removeEventListener('resize', queue); window.removeEventListener('scroll', queue, true);
    window.visualViewport?.removeEventListener('resize', queue);
    window.visualViewport?.removeEventListener('scroll', queue);
    signal.removeEventListener('abort', dispose);
  }
  signal.addEventListener('abort', dispose, { once: true });
  if (signal.aborted) dispose(); else scan();
  return { dispose, setIconsEnabled };
}
