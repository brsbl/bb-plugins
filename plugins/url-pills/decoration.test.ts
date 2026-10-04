// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { candidateForElement, mountUrlPills, type IconResult } from './decoration';

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
  root.innerHTML = `<div contenteditable="true"><p>Review <span class="bb-url-pill-range">${URL_TEXT}</span> please</p></div>`;
  document.body.append(root);
  return root.querySelector('span')!;
}
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
  it('decorates all three surfaces without altering nodes, href, copied source or click ownership', () => {
    const draft = composer(), user = message(), agent = message(false);
    const originals = [draft, user, agent].map((el) => el.firstChild);
    const activated = vi.fn((event: Event) => event.preventDefault()); user.addEventListener('click', activated);
    const mounted = mountUrlPills({ signal: abort.signal });
    [draft, user, agent].forEach((el, index) => {
      expect(el.hasAttribute('data-bb-url-pill')).toBe(true);
      expect(el.firstChild).toBe(originals[index]); expect(el.textContent).toBe(URL_TEXT);
      expect(el.getAttribute('data-bb-url-pill-label')).toBe('example.com/a');
    });
    const range = document.createRange(); range.selectNodeContents(user.parentElement!);
    expect(range.toString()).toBe(`Review ${URL_TEXT} please`);
    user.click(); expect(activated).toHaveBeenCalledOnce(); expect(user.getAttribute('href')).toBe(URL_TEXT);
    mounted.dispose();
    for (const el of [draft, user, agent]) {
      expect(el.hasAttribute('data-bb-url-pill')).toBe(false); expect(el.textContent).toBe(URL_TEXT);
    }
    expect(document.querySelector('[data-bb-url-pills]')).toBeNull();
  });
  it('reveals a caret within original text and compacts at the end without moving the caret', async () => {
    const span = composer(); mountUrlPills({ signal: abort.signal });
    const source = span.firstChild!;
    const range = document.createRange(); range.setStart(source, 10); range.collapse(true);
    const selection = document.getSelection()!; selection.removeAllRanges(); selection.addRange(range);
    document.dispatchEvent(new Event('selectionchange')); await settle();
    expect(span.hasAttribute('data-bb-url-pill-expanded')).toBe(true);
    expect(selection.anchorNode).toBe(source); expect(selection.anchorOffset).toBe(10);
    range.setStart(source, URL_TEXT.length); range.collapse(true); selection.removeAllRanges(); selection.addRange(range);
    document.dispatchEvent(new Event('selectionchange')); await settle();
    expect(span.hasAttribute('data-bb-url-pill-expanded')).toBe(false);
    expect(selection.anchorOffset).toBe(URL_TEXT.length);
  });
  it('reveals during composition and never writes to changed host text on cleanup', async () => {
    const span = composer(); mountUrlPills({ signal: abort.signal });
    span.dispatchEvent(new CompositionEvent('compositionstart', { bubbles: true }));
    expect(span.hasAttribute('data-bb-url-pill-expanded')).toBe(true);
    span.firstChild!.textContent = 'https://changed.example/path'; await settle();
    expect(span.getAttribute('data-bb-url-pill-label')).toBe('changed.example/path');
    abort.abort(); expect(span.textContent).toBe('https://changed.example/path');
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
  it('supports keyboard inspection of the full destination and Escape restores link focus', () => {
    const anchor = message(); mountUrlPills({ signal: abort.signal }); anchor.focus();
    anchor.dispatchEvent(new KeyboardEvent('keydown', { key: 'F10', shiftKey: true, bubbles: true, cancelable: true }));
    const address = document.querySelector('textarea')!;
    expect(address.value).toBe(URL_TEXT); expect(document.activeElement).toBe(address);
    address.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true }));
    expect(document.querySelector('[data-bb-url-pill-inspector]')).toBeNull(); expect(document.activeElement).toBe(anchor);
  });
});
