import { parsePillUrl, type PillUrl } from "./urls";
import { cssString, pillStyles, STYLESHEET } from "./stylesheet";
import type { ComposerEdit } from './composer-edit';

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
  editComposer?: (element: HTMLElement) => ComposerEdit | null;
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
  let positionFrame: number | null = null;
  let composition: HTMLElement | null = null;
  let explicitEdit: HTMLElement | null = null;
  let inputEdit: HTMLElement | null = null;
  let inspector: HTMLElement | null = null;
  let inspected: HTMLElement | null = null;
  let editing: ComposerEdit | null = null;
  let savedSelection: Range | null = null;
  let linkMenu: { element: HTMLElement; anchor: HTMLElement; url: string; selection: Range | null } | null = null;
  let inspectUrl = '';
  let touchTimer: ReturnType<typeof setTimeout> | null = null;
  let touchStart: { x: number; y: number; anchor: HTMLElement } | null = null;
  let suppressClick: HTMLElement | null = null;
  let suppressUntil = 0;
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
    const activeAnchor = inspected ?? linkMenu?.anchor;
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
      }).join('\n') + (activeAnchor && entries.get(activeAnchor)?.selector
        ? `${entries.get(activeAnchor)!.selector} { outline: 1px solid var(--ring, #8888); outline-offset: 2px; }` : '');
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

  function closeInspector(restoreFocus = true): void {
    if (positionFrame !== null) cancelAnimationFrame(positionFrame);
    positionFrame = null;
    inspector?.remove(); inspector = null;
    if (restoreFocus && inspected?.isConnected) {
      const editor = inspected.closest<HTMLElement>(EDITOR);
      (editor ?? inspected).focus({ preventScroll: true });
      if (editor && savedSelection && editor.contains(savedSelection.startContainer)) {
        const selection = document.getSelection();
        selection?.removeAllRanges(); selection?.addRange(savedSelection);
      }
    }
    inspected = null; inspectUrl = ''; editing = null; savedSelection = null;
    queue();
  }

  function action(label: string, path: string): HTMLButtonElement {
    const button = document.createElement('button'); button.type = 'button';
    button.setAttribute('aria-label', label); button.title = label;
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('viewBox', '0 0 24 24'); svg.setAttribute('aria-hidden', 'true');
    const shape = document.createElementNS(svg.namespaceURI, 'path'); shape.setAttribute('d', path);
    svg.append(shape); button.append(svg); return button;
  }

  function positionPanel(panel: HTMLElement, anchor: HTMLElement, above: boolean): void {
    const rect = anchor.getBoundingClientRect();
    const viewport = window.visualViewport;
    const left = (viewport?.offsetLeft ?? 0) + 12, top = (viewport?.offsetTop ?? 0) + 12;
    const right = left + (viewport?.width ?? innerWidth) - 24;
    const bottom = top + (viewport?.height ?? innerHeight) - 24;
    const upper = rect.top - panel.offsetHeight - 8;
    const lower = rect.bottom + 8;
    const y = above ? (upper >= top ? upper : lower) : (lower + panel.offsetHeight <= bottom ? lower : upper);
    const xValue = `${Math.max(left, Math.min(rect.left, right - panel.offsetWidth))}px`;
    const yValue = `${Math.max(top, Math.min(y, bottom - panel.offsetHeight))}px`;
    if (panel.style.left !== xValue) panel.style.left = xValue;
    if (panel.style.top !== yValue) panel.style.top = yValue;
  }

  function trackInspectorPosition(): void {
    positionFrame = null;
    if (disposed || !inspector || !inspected) return;
    if (!inspected.isConnected) { closeInspector(false); return; }
    // The host can animate its composer after focus leaves, without a scroll
    // or URL mutation. Follow only this anchor while its editor is open.
    positionPanel(inspector, inspected, !!entries.get(inspected)?.composer);
    positionFrame = requestAnimationFrame(trackInspectorPosition);
  }

  function closeLinkMenu(restoreFocus = true): void {
    const menu = linkMenu;
    if (!menu) return;
    linkMenu = null; menu.element.remove();
    const editor = menu.anchor.closest<HTMLElement>(EDITOR);
    if (restoreFocus && editor?.isConnected) {
      editor.focus({ preventScroll: true });
      if (menu.selection && editor.contains(menu.selection.startContainer)) {
        const selection = document.getSelection();
        selection?.removeAllRanges(); selection?.addRange(menu.selection);
      }
    }
    queue();
  }

  function showLinkActions(anchor: HTMLElement, point?: { x: number; y: number }): void {
    if (!entries.get(anchor)?.composer || !options.editComposer) { showInspector(anchor); return; }
    closeLinkMenu(false); closeInspector(false);
    const selection = document.getSelection();
    const element = document.createElement('div'); element.dataset.bbUrlPillMenu = '';
    element.setAttribute('role', 'menu'); element.setAttribute('aria-label', 'Link');
    const button = action('Edit Link', 'M10 13a5 5 0 0 0 7 0l3-3a5 5 0 0 0-7-7l-2 2 M14 11a5 5 0 0 0-7 0l-3 3a5 5 0 0 0 7 7l2-2');
    button.setAttribute('role', 'menuitem');
    const label = document.createElement('span'); label.textContent = 'Edit Link'; button.append(label);
    button.addEventListener('click', () => {
      const saved = linkMenu?.selection;
      closeLinkMenu(false); showInspector(anchor, saved);
    });
    element.addEventListener('keydown', (event) => {
      event.stopPropagation();
      if (event.key === 'Escape' || event.key === 'Tab') { event.preventDefault(); closeLinkMenu(); }
      if (['ArrowUp', 'ArrowDown', 'Home', 'End'].includes(event.key)) { event.preventDefault(); button.focus(); }
    });
    element.append(button); document.body.append(element);
    linkMenu = { element, anchor, url: anchor.textContent ?? '', selection: selection?.rangeCount ? selection.getRangeAt(0).cloneRange() : null };
    if (point) {
      const viewport = window.visualViewport;
      const left = (viewport?.offsetLeft ?? 0) + 12, top = (viewport?.offsetTop ?? 0) + 12;
      element.style.left = `${Math.max(left, Math.min(point.x, left + (viewport?.width ?? innerWidth) - 24 - element.offsetWidth))}px`;
      element.style.top = `${Math.max(top, Math.min(point.y, top + (viewport?.height ?? innerHeight) - 24 - element.offsetHeight))}px`;
    } else positionPanel(element, anchor, false);
    button.focus({ preventScroll: true }); queue();
  }

  function showInspector(anchor: HTMLElement, selectionOverride?: Range | null): void {
    const entry = entries.get(anchor);
    if (!entry || anchor.textContent !== entry.url.text) return;
    closeLinkMenu(false);
    closeInspector(false);
    editing = entry.composer ? options.editComposer?.(anchor) ?? null : null;
    const selection = document.getSelection();
    savedSelection = selectionOverride ?? (selection?.rangeCount ? selection.getRangeAt(0).cloneRange() : null);
    inspected = anchor; inspectUrl = entry.url.text;
    const panel = document.createElement('div');
    panel.dataset.bbUrlPillInspector = '';
    panel.setAttribute('role', 'dialog'); panel.setAttribute('aria-label', editing ? 'Edit link' : 'Link destination');
    const row = document.createElement('div'); row.dataset.bbUrlPillRow = '';
    const address = document.createElement('input'); address.type = 'text'; address.inputMode = 'url'; address.readOnly = !editing; address.value = inspectUrl;
    address.setAttribute('aria-label', editing ? 'URL' : 'Full destination'); address.spellcheck = false;
    address.autocomplete = 'off';
    const copy = action('Copy link', 'M9 9h11v11H9z M15 5V3H3v12h2');
    const apply = editing ? action('Apply link changes', 'M19 4v10H5 M9 10l-4 4 4 4') : null;
    const status = document.createElement('div'); status.setAttribute('role', 'status');
    function commit(): void {
      const value = address.value.trim();
      const url = /^[a-z][a-z0-9+.-]*:/i.test(value) ? value : `https://${value}`;
      if (!value || !parsePillUrl(url, location.origin)) {
        status.textContent = 'Enter a valid http or https URL.'; address.setAttribute('aria-invalid', 'true'); return;
      }
      if (!editing?.apply(url)) { status.textContent = 'The draft changed. Reopen this link to edit it.'; return; }
      // The host owns the edit, mention reconciliation and undo transaction.
      const editor = anchor.closest<HTMLElement>(EDITOR);
      closeInspector(false);
      editor?.focus({ preventScroll: true });
    }
    apply?.addEventListener('click', commit);
    address.addEventListener('input', () => { status.textContent = ''; address.removeAttribute('aria-invalid'); });
    copy.addEventListener('click', () => {
      const url = address.value;
      void Promise.resolve().then(() => navigator.clipboard.writeText(url)).then(() => {
        if (inspector === panel && !editing) closeInspector();
      }).catch(() => {
        if (inspector !== panel) return;
        status.textContent = 'Select and copy the address above.'; address.focus(); address.select();
      });
    });
    panel.addEventListener('keydown', (event) => {
      event.stopPropagation();
      if (event.key === 'Enter' && event.target === address && !event.isComposing && editing) { event.preventDefault(); commit(); }
      if (event.key === 'Escape') { event.preventDefault(); event.stopPropagation(); closeInspector(); }
      if (event.key === 'Tab') {
        const focusable: HTMLElement[] = apply ? [address, apply, copy] : [address, copy];
        const index = focusable.indexOf(document.activeElement as HTMLElement);
        event.preventDefault(); focusable[(index + (event.shiftKey ? focusable.length - 1 : 1)) % focusable.length].focus();
      }
    });
    row.append(address); if (apply) row.append(apply); row.append(copy);
    panel.append(row, status); document.body.append(panel); inspector = panel;
    positionPanel(panel, anchor, entry.composer);
    address.focus({ preventScroll: true });
    address.setSelectionRange(0, 0);
    positionFrame = requestAnimationFrame(trackInspectorPosition);
    queue();
  }

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
        entry.expanded = element !== inspected && element !== linkMenu?.anchor && !!(explicitEdit === element || composition?.contains(element)
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
    if (inspected && (!entries.has(inspected) || entries.get(inspected)?.url.text !== inspectUrl || (editing && !editing.current()))) closeInspector(false);
    if (inspector && inspected) positionPanel(inspector, inspected, !!entries.get(inspected)?.composer);
    if (linkMenu && (!entries.has(linkMenu.anchor) || linkMenu.anchor.textContent !== linkMenu.url)) closeLinkMenu(false);
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
  function cancelTouch(): void { if (touchTimer) clearTimeout(touchTimer); touchTimer = null; touchStart = null; }
  function pointerDown(event: PointerEvent): void {
    if (event.target instanceof Node && (inspector?.contains(event.target) || linkMenu?.element.contains(event.target))) return;
    closeLinkMenu(false);
    inputEdit = null;
    if (inspector && event.target instanceof Node && !inspector.contains(event.target)) closeInspector(false);
    const range = event.target instanceof Element ? event.target.closest<HTMLElement>(`.${EFFECT_CLASS}`) : null;
    const navigable = range && entries.get(range)?.composer && !entries.get(range)?.expanded && options.openUrl;
    explicitEdit = !navigable && range && entries.get(range)?.composer ? range : null;
    if (navigable && event.button === 0) event.preventDefault();
    // Keep geometry unchanged while the browser places the caret. The next
    // frame reveals only the explicitly clicked range or actual selection.
    queue();
    const anchor = pillAt(event.target);
    if (event.pointerType === 'touch' && anchor) {
      touchStart = { x: event.clientX, y: event.clientY, anchor };
      touchTimer = setTimeout(() => {
        touchTimer = null; suppressClick = anchor; suppressUntil = Date.now() + 1200;
        showLinkActions(anchor, touchStart ? { x: touchStart.x, y: touchStart.y } : undefined);
      }, 550);
    }
  }
  function pointerMove(event: PointerEvent): void {
    if (touchStart && Math.hypot(event.clientX - touchStart.x, event.clientY - touchStart.y) > 8) cancelTouch();
  }
  function pointerUp(): void { cancelTouch(); queue(); }
  function keyDown(event: KeyboardEvent): void {
    const editor = event.target instanceof Element ? event.target.closest(EDITOR) : null;
    const anchor = pillAt(event.target) ?? (editor ? Array.from(entries).find(([element, entry]) => entry.composer && editor.contains(element) && caretTouches(element))?.[0] : null);
    if (anchor && (event.key === 'ContextMenu' || (event.shiftKey && event.key === 'F10'))) {
      event.preventDefault(); event.stopPropagation(); showLinkActions(anchor); return;
    }
    if (event.target instanceof Element && event.target.closest(EDITOR)) queue();
  }
  function contextMenu(event: MouseEvent): void {
    const anchor = pillAt(event.target);
    if (anchor) { event.preventDefault(); event.stopPropagation(); cancelTouch(); showLinkActions(anchor, { x: event.clientX, y: event.clientY }); }
  }
  function click(event: MouseEvent): void {
    if (suppressClick && event.target instanceof Node && suppressClick.contains(event.target) && Date.now() < suppressUntil) {
      event.preventDefault(); event.stopPropagation(); suppressClick = null;
      return;
    }
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
  function scroll(): void { cancelTouch(); closeLinkMenu(false); queue(); }
  const listeners: [string, EventListener][] = [
    ['selectionchange', queue], ['pointerdown', pointerDown as EventListener], ['pointermove', pointerMove as EventListener],
    ['pointerup', pointerUp], ['pointercancel', pointerUp], ['keydown', keyDown as EventListener],
    ['contextmenu', contextMenu as EventListener], ['click', click as EventListener],
    ['compositionstart', compositionStart as EventListener], ['compositionend', compositionEnd],
    ['beforeinput', beforeInput as EventListener], ['paste', paste],
    ['focusout', focusOut as EventListener], ['visibilitychange', queue],
  ];
  for (const [type, listener] of listeners) document.addEventListener(type, listener, true);
  window.addEventListener('resize', scroll);
  window.addEventListener('scroll', scroll, true);
  window.visualViewport?.addEventListener('resize', scroll);
  window.visualViewport?.addEventListener('scroll', scroll);

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
    observer.disconnect(); visibility?.disconnect(); cancelTouch(); closeInspector(false); closeLinkMenu(false);
    for (const controller of requests.values()) controller.abort();
    requests.clear(); cache.clear();
    for (const [element, entry] of entries) if (!entry.composer) removeDecoration(element);
    for (const [root, id] of composerRoots) if (root.getAttribute(COMPOSER_ROOT) === id) root.removeAttribute(COMPOSER_ROOT);
    composerRoots.clear(); entries.clear(); style.remove(); composerStyle.remove();
    for (const [type, listener] of listeners) document.removeEventListener(type, listener, true);
    window.removeEventListener('resize', scroll); window.removeEventListener('scroll', scroll, true);
    window.visualViewport?.removeEventListener('resize', scroll);
    window.visualViewport?.removeEventListener('scroll', scroll);
    signal.removeEventListener('abort', dispose);
  }
  signal.addEventListener('abort', dispose, { once: true });
  if (signal.aborted) dispose(); else scan();
  return { dispose, setIconsEnabled };
}
