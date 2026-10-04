// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { candidateForElement, mountUrlPills, type IconResult } from './decoration';
import { cssString } from './stylesheet';
import * as stylesheet from './stylesheet';
import * as urls from './urls';

const URL_TEXT = 'https://example.com/a?private=yes#part';
let frames: Map<number, FrameRequestCallback>;
let nextFrame: number;
let abort: AbortController;
async function settle() {
  await Promise.resolve();
  await Promise.resolve();
  const queued = [...frames]; frames.clear();
  for (const [, callback] of queued) callback(0);
  await Promise.resolve();
}
function composer() {
  const root = document.createElement('div'); root.dataset.appComposer = '';
  root.innerHTML = `<div data-promptbox-editor-content><div contenteditable="true"><p>Review <span class="bb-url-pill-range">${URL_TEXT}</span> please</p></div></div>`;
  document.body.append(root);
  return root.querySelector('span')!;
}
function composerCss(): string { return document.querySelector('style[data-bb-url-pills-composer]')?.textContent ?? ''; }
function message(user = true, following = ' please') {
  const root = document.createElement('div'); root.dataset.messageColumn = '';
  root.innerHTML = `${user ? '<div class="ml-auto">' : '<div>'}<div data-markdown-preview><p>Review <a href="${URL_TEXT}">${URL_TEXT}</a>${following}</p></div></div>`;
  document.body.append(root);
  return root.querySelector('a')!;
}

beforeEach(() => {
  frames = new Map(); nextFrame = 0; abort = new AbortController();
  vi.stubGlobal('requestAnimationFrame', (callback: FrameRequestCallback) => { frames.set(++nextFrame, callback); return nextFrame; });
  vi.stubGlobal('cancelAnimationFrame', (id: number) => frames.delete(id));
  vi.stubGlobal('IntersectionObserver', undefined);
  vi.spyOn(HTMLElement.prototype, 'getClientRects').mockReturnValue([{ width: 100, height: 20 }] as unknown as DOMRectList);
});
afterEach(() => {
  abort.abort(); document.getSelection()?.removeAllRanges(); document.body.replaceChildren();
  vi.restoreAllMocks(); vi.unstubAllGlobals();
});

describe('DOM-only URL decoration', () => {
  it.each([false, true])('leaves overlapping host decorations native (nested marks: %s)', (nested) => {
    const span = composer(), editor = span.closest('[contenteditable]')!;
    const prefix = '<span class="bb-url-pill-range">https://example.com/docs/</span>';
    const middle = '<span class="bb-url-pill-range ultracode">ultracode</span>';
    span.parentElement!.innerHTML = prefix + (nested ? `<strong>${middle}</strong>` : middle)
      + '<span class="bb-url-pill-range">/setup?mode=1#quickstart</span>';
    const original = editor.outerHTML, openUrl = vi.fn(() => true);
    mountUrlPills({ signal: abort.signal, openUrl });
    expect(composerCss()).toBe('');
    editor.querySelectorAll<HTMLElement>('.bb-url-pill-range').forEach((fragment) => fragment.click());
    expect(openUrl).not.toHaveBeenCalled();
    expect(editor.outerHTML).toBe(original);
  });
  it('decorates all three surfaces without altering nodes, href, copied source or click ownership', () => {
    const draft = composer(), user = message(), agent = message(false);
    const originals = [draft, user, agent].map((el) => el.firstChild);
    const editor = draft.closest('[contenteditable]')!;
    const originalEditor = editor.outerHTML;
    const activated = vi.fn((event: Event) => event.preventDefault()); user.addEventListener('click', activated);
    const mounted = mountUrlPills({ signal: abort.signal });
    [draft, user, agent].forEach((el, index) => {
      expect(el.firstChild).toBe(originals[index]); expect(el.textContent).toBe(URL_TEXT);
      if (el !== draft) {
        expect(el.hasAttribute('data-bb-url-pill')).toBe(true);
        expect(el.getAttribute('data-bb-url-pill-label')).toBe('example.com/a');
      }
    });
    expect(editor.outerHTML).toBe(originalEditor);
    expect(composerCss()).toContain('--bb-url-pill-label: "example.com/a"');
    expect(composerCss()).toContain('.bb-url-pill-range::after');
    expect(document.querySelector('[data-bb-url-pill-composer-root]')).toBe(editor.parentElement);
    const range = document.createRange(); range.selectNodeContents(user.parentElement!);
    expect(range.toString()).toBe(`Review ${URL_TEXT} please`);
    user.click(); expect(activated).toHaveBeenCalledOnce(); expect(user.getAttribute('href')).toBe(URL_TEXT);
    mounted.dispose();
    for (const el of [draft, user, agent]) {
      expect(el.hasAttribute('data-bb-url-pill')).toBe(false); expect(el.textContent).toBe(URL_TEXT);
    }
    expect(document.querySelector('[data-bb-url-pills]')).toBeNull();
    expect(document.querySelector('[data-bb-url-pill-composer-root]')).toBeNull();
    expect(document.querySelector('[data-bb-url-pills-composer]')).toBeNull();
    expect(editor.outerHTML).toBe(originalEditor);
  });
  it('reveals a caret within original text and compacts at the end without moving the caret', async () => {
    const span = composer(); mountUrlPills({ signal: abort.signal });
    const source = span.firstChild!;
    const range = document.createRange(); range.setStart(source, 10); range.collapse(true);
    const selection = document.getSelection()!; selection.removeAllRanges(); selection.addRange(range);
    document.dispatchEvent(new Event('selectionchange')); await settle();
    expect(composerCss()).toBe('');
    expect(span.getAttributeNames()).toEqual(['class']);
    expect(selection.anchorNode).toBe(source); expect(selection.anchorOffset).toBe(10);
    range.setStart(source, URL_TEXT.length); range.collapse(true); selection.removeAllRanges(); selection.addRange(range);
    document.dispatchEvent(new Event('selectionchange')); await settle();
    expect(composerCss()).toContain('--bb-url-pill-label: "example.com/a"');
    expect(span.getAttributeNames()).toEqual(['class']);
    expect(selection.anchorOffset).toBe(URL_TEXT.length);
  });
  it('preserves geometry until native pointer placement and keyboard navigation finish', async () => {
    const span = composer(); const editor = span.closest('[contenteditable]')!;
    mountUrlPills({ signal: abort.signal });
    const compact = composerCss();
    const trailing = span.nextSibling!;
    span.parentElement!.dispatchEvent(new MouseEvent('pointerdown', { bubbles: true }));
    expect(composerCss()).toBe(compact);
    const selection = document.getSelection()!;
    const range = document.createRange(); range.setStart(trailing, 3); range.collapse(true);
    selection.removeAllRanges(); selection.addRange(range);
    document.dispatchEvent(new Event('selectionchange')); await settle();
    expect(composerCss()).toBe(compact);
    expect(selection.anchorNode).toBe(trailing); expect(selection.anchorOffset).toBe(3);
    editor.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowLeft', bubbles: true }));
    expect(composerCss()).toBe(compact);
    range.setStart(span.firstChild!, 10); range.collapse(true);
    selection.removeAllRanges(); selection.addRange(range);
    document.dispatchEvent(new Event('selectionchange')); await settle();
    expect(composerCss()).toBe('');
    expect(selection.anchorNode).toBe(span.firstChild); expect(selection.anchorOffset).toBe(10);
  });
  it.each(['insertText', 'deleteContentBackward'])('reveals trailing-edge %s edits across native range replacement', async (inputType) => {
    const span = composer(), editor = span.closest('[contenteditable]')!;
    mountUrlPills({ signal: abort.signal });
    const selection = document.getSelection()!;
    const range = document.createRange(); range.setStart(span.firstChild!, URL_TEXT.length); range.collapse(true);
    selection.removeAllRanges(); selection.addRange(range);
    expect(composerCss()).toContain('--bb-url-pill-label: "example.com/a"');
    editor.dispatchEvent(new InputEvent('beforeinput', { bubbles: true, inputType, data: inputType === 'insertText' ? 'X' : null }));
    // The host editor owns the edit and may replace its decoration wrapper.
    const replacement = span.cloneNode(false) as HTMLElement;
    const edited = inputType === 'insertText' ? URL_TEXT + 'X' : URL_TEXT.slice(0, -1);
    replacement.textContent = edited; span.replaceWith(replacement);
    range.setStart(replacement.firstChild!, edited.length); range.collapse(true);
    selection.removeAllRanges(); selection.addRange(range);
    const originalEditor = editor.outerHTML;
    document.dispatchEvent(new Event('selectionchange')); await settle();
    expect(composerCss()).toBe('');
    expect(editor.outerHTML).toBe(originalEditor);
    expect(selection.anchorOffset).toBe(edited.length);
    editor.dispatchEvent(new FocusEvent('focusout', { bubbles: true })); await settle();
    expect(composerCss()).toContain('--bb-url-pill-label: "example.com/a"');
  });
  it('reveals only a directly clicked pill after native placement, including its edge', async () => {
    const span = composer();
    const other = document.createElement('span'); other.className = 'bb-url-pill-range'; other.textContent = 'https://other.example/path';
    span.parentElement!.append(document.createTextNode(' '), other);
    mountUrlPills({ signal: abort.signal });
    const compact = composerCss();
    span.dispatchEvent(new MouseEvent('pointerdown', { bubbles: true }));
    expect(composerCss()).toBe(compact);
    const selection = document.getSelection()!;
    const range = document.createRange(); range.setStart(span.firstChild!, URL_TEXT.length); range.collapse(true);
    selection.removeAllRanges(); selection.addRange(range);
    document.dispatchEvent(new Event('selectionchange')); await settle();
    expect(composerCss()).not.toContain('--bb-url-pill-label: "example.com/a"');
    expect(composerCss()).toContain('--bb-url-pill-label: "other.example/path"');
    expect(selection.anchorNode).toBe(span.firstChild); expect(selection.anchorOffset).toBe(URL_TEXT.length);
    // Blur ends explicit edge editing even if the browser retains its selection.
    span.closest('[contenteditable]')!.dispatchEvent(new FocusEvent('focusout', { bubbles: true })); await settle();
    expect(composerCss()).toContain('--bb-url-pill-label: "example.com/a"');
    span.dispatchEvent(new MouseEvent('pointerdown', { bubbles: true })); await settle();
    expect(composerCss()).not.toContain('--bb-url-pill-label: "example.com/a"');
    span.parentElement!.dispatchEvent(new MouseEvent('pointerdown', { bubbles: true }));
    expect(composerCss()).not.toContain('--bb-url-pill-label: "example.com/a"');
    range.setStart(span.nextSibling!, 3); range.collapse(true); selection.removeAllRanges(); selection.addRange(range);
    document.dispatchEvent(new Event('selectionchange')); await settle();
    expect(composerCss()).toContain('--bb-url-pill-label: "example.com/a"');
  });
  it('reveals during composition and never writes to changed host text on cleanup', async () => {
    const span = composer(); mountUrlPills({ signal: abort.signal });
    span.dispatchEvent(new CompositionEvent('compositionstart', { bubbles: true }));
    expect(composerCss()).toBe('');
    expect(span.getAttributeNames()).toEqual(['class']);
    span.firstChild!.textContent = 'https://changed.example/path'; await settle();
    expect(composerCss()).toBe('');
    span.dispatchEvent(new CompositionEvent('compositionend', { bubbles: true })); await settle();
    expect(composerCss()).toContain('--bb-url-pill-label: "changed.example/path"');
    expect(span.getAttributeNames()).toEqual(['class']);
    abort.abort(); expect(span.textContent).toBe('https://changed.example/path');
  });
  it('keeps all editor DOM untouched when icons arrive and recomputation has no changes', async () => {
    const span = composer(); const editor = span.closest('[contenteditable]')!;
    const original = editor.outerHTML;
    const mutations: MutationRecord[] = [];
    const observer = new MutationObserver((records) => mutations.push(...records));
    observer.observe(editor, { attributes: true, childList: true, characterData: true, subtree: true });
    const fetchIcon = vi.fn().mockResolvedValue({ enabled: true, dataUrl: 'data:image/png;base64,aGVsbG8=' });
    mountUrlPills({ signal: abort.signal, iconsEnabled: true, fetchIcon }); await settle();
    expect(composerCss()).toContain('data:image/png;base64,aGVsbG8=');
    expect(editor.outerHTML).toBe(original); expect(mutations).toEqual([]);
    const styleTextNode = document.querySelector('[data-bb-url-pills-composer]')!.firstChild;
    document.dispatchEvent(new Event('selectionchange')); await settle();
    expect(document.querySelector('[data-bb-url-pills-composer]')!.firstChild).toBe(styleTextNode);
    abort.abort(); await settle(); observer.disconnect();
    expect(editor.outerHTML).toBe(original); expect(mutations).toEqual([]);
  });
  it('escapes generated CSS strings instead of interpreting label content as CSS', () => {
    expect(cssString('a"b\\c\n')).toBe('"a\\22 b\\5c c\\a "');
  });
  it('does no discovery or CSS construction for scrolling and unchanged selection in a large draft', async () => {
    const span = composer();
    const editor = span.closest<HTMLElement>('[contenteditable]')!;
    editor.className = 'tiptap ProseMirror ProseMirror-focused';
    for (let i = 1; i < 256; i++) {
      const next = span.cloneNode(true) as HTMLElement;
      next.textContent = `https://example.com/path-${i}`;
      span.parentElement!.append(document.createTextNode(' '), next);
    }
    const anchor = message();
    const parse = vi.spyOn(urls, 'parsePillUrl'), styles = vi.spyOn(stylesheet, 'pillStyles');
    mountUrlPills({ signal: abort.signal }); await settle();
    parse.mockClear(); styles.mockClear();
    for (let i = 0; i < 3; i++) {
      // The real editor reapplies this identical attribute on selection changes.
      editor.setAttribute('class', editor.className);
      window.dispatchEvent(new Event('scroll'));
      anchor.parentElement!.dispatchEvent(new Event('scroll'));
      document.dispatchEvent(new Event('selectionchange'));
      await settle();
    }
    expect(parse).not.toHaveBeenCalled(); expect(styles).not.toHaveBeenCalled();
    const range = document.createRange(); range.setStart(span.firstChild!, 10); range.collapse(true);
    document.getSelection()!.addRange(range);
    document.dispatchEvent(new Event('selectionchange')); await settle();
    expect(parse).not.toHaveBeenCalled();
    expect(composerCss()).not.toContain('--bb-url-pill-label: "example.com/a"');
    expect(composerCss()).toContain('--bb-url-pill-label: "example.com/path-255"');
  });
  it('limits streamed message discovery to the changed preview and retains draft selectors', async () => {
    composer(); const anchor = message(false, ''), unchanged = message();
    const parse = vi.spyOn(urls, 'parsePillUrl');
    mountUrlPills({ signal: abort.signal }); await settle();
    const originalCss = composerCss(); parse.mockClear();
    anchor.textContent = 'https://stream.example/path'; anchor.href = anchor.textContent;
    anchor.after(document.createTextNode(' done'));
    await settle();
    expect(parse.mock.calls.map(([text]) => text)).toEqual(['https://stream.example/path']);
    expect(anchor.getAttribute('data-bb-url-pill-label')).toBe('stream.example/path');
    expect(unchanged.getAttribute('data-bb-url-pill-label')).toBe('example.com/a');
    expect(composerCss()).toBe(originalCss);
  });
  it('discovers added surfaces and removes detached composer styles', async () => {
    mountUrlPills({ signal: abort.signal });
    const span = composer(), anchor = message(); await settle();
    expect(composerCss()).toContain('--bb-url-pill-label: "example.com/a"');
    expect(anchor.hasAttribute('data-bb-url-pill')).toBe(true);
    const root = span.closest('[data-app-composer]')!; root.remove(); await settle();
    expect(composerCss()).toBe('');
    expect(root.querySelector('[data-bb-url-pill-composer-root]')).toBeNull();
  });
  it('does not fetch a valid partial streamed hostname, including after a pause', async () => {
    const anchor = message(false, '');
    anchor.textContent = 'https://github.co'; anchor.href = anchor.textContent;
    const fetchIcon = vi.fn().mockResolvedValue({ enabled: true, dataUrl: null });
    mountUrlPills({ signal: abort.signal, iconsEnabled: true, fetchIcon }); await settle();
    expect(anchor.hasAttribute('data-bb-url-pill')).toBe(false); expect(fetchIcon).not.toHaveBeenCalled();
    anchor.firstChild!.textContent = 'https://github.com/get-bb/bb'; anchor.href = anchor.textContent!;
    await settle(); expect(fetchIcon).not.toHaveBeenCalled();
    anchor.after(document.createTextNode(' next')); await settle();
    expect(anchor.hasAttribute('data-bb-url-pill')).toBe(true);
    expect(fetchIcon).toHaveBeenCalledWith('https://github.com', expect.any(AbortSignal));
  });
  it('keeps authored labels, code, images and unknown surfaces native', () => {
    const anchor = message(); anchor.textContent = 'Read docs';
    expect(candidateForElement(anchor, location.origin)).toBeNull();
    anchor.textContent = URL_TEXT; const code = document.createElement('code'); anchor.replaceWith(code); code.append(anchor);
    expect(candidateForElement(anchor, location.origin)).toBeNull();
    const outside = document.createElement('a'); outside.href = URL_TEXT; outside.textContent = URL_TEXT; document.body.append(outside);
    expect(candidateForElement(outside, location.origin)).toBeNull();
  });
  it('deduplicates origin lookups and cancels disabled work without accepting stale results', async () => {
    const first = message(), second = message();
    let resolve!: (value: IconResult) => void;
    const fetchIcon = vi.fn((_origin: string, _signal: AbortSignal) => new Promise<IconResult>((done) => { resolve = done; }));
    const mounted = mountUrlPills({ signal: abort.signal, iconsEnabled: true, fetchIcon });
    expect(fetchIcon).toHaveBeenCalledOnce(); expect(fetchIcon.mock.calls[0][0]).toBe('https://example.com');
    const requestSignal = fetchIcon.mock.calls[0][1]; mounted.setIconsEnabled(false); expect(requestSignal.aborted).toBe(true);
    resolve({ enabled: true, dataUrl: 'data:image/png;base64,aGVsbG8=' }); await settle();
    expect(first.style.getPropertyValue('--bb-url-pill-icon')).toBe('');
    expect(second.style.getPropertyValue('--bb-url-pill-icon')).toBe('');
  });
  it('opens a compact composer URL through the host opener without moving the caret or changing text', async () => {
    const span = composer(), editor = span.closest('[contenteditable]')!;
    const original = editor.outerHTML, openUrl = vi.fn(() => true);
    mountUrlPills({ signal: abort.signal, openUrl });
    const event = new MouseEvent('pointerdown', { bubbles: true, cancelable: true, button: 0 });
    span.dispatchEvent(event); await settle();
    expect(event.defaultPrevented).toBe(true);
    expect(composerCss()).toContain('--bb-url-pill-label');
    span.click(); expect(openUrl).toHaveBeenCalledExactlyOnceWith(URL_TEXT);
    expect(editor.outerHTML).toBe(original);
  });
});
