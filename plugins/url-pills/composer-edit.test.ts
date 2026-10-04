// @vitest-environment jsdom
import { afterEach, expect, it } from 'vitest';
import { captureComposerEdit } from './composer-edit';

afterEach(() => document.body.replaceChildren());

it('replaces only the selected occurrence of a repeated URL', () => {
  const url = 'https://example.com/path?private=yes#part';
  let text = `First ${url}\n\nSecond ${url}`;
  document.body.innerHTML = `<div contenteditable="true"><p>First <span class="bb-url-pill-range">${url}</span></p><p>Second <span class="bb-url-pill-range">${url}</span></p></div>`;
  const source = { get text() { return text; }, updateText: (fn: (value: string) => string) => { text = fn(text); } };
  const spans = document.querySelectorAll<HTMLElement>('span');
  const edit = captureComposerEdit(spans[1], source)!;
  expect(edit.apply('https://changed.example/?x=1#two')).toBe(true);
  expect(text).toBe(`First ${url}\n\nSecond https://changed.example/?x=1#two`);
  expect(spans[1].textContent).toBe(url);
  expect(edit.apply('https://stale.example')).toBe(false);
});

it('refuses ambiguous host decorations and concurrent draft changes', () => {
  const url = 'https://example.com/';
  let text = `Read ${url}`;
  document.body.innerHTML = `<div contenteditable="true"><span class="bb-url-pill-range">${url}</span></div>`;
  const span = document.querySelector('span')!;
  const source = { get text() { return text; }, updateText: (fn: (value: string) => string) => { text = fn(text); } };
  const edit = captureComposerEdit(span, source)!;
  text += ' new work';
  expect(edit.current()).toBe(false); expect(edit.apply('https://changed.example/')).toBe(false);
  expect(text).toBe(`Read ${url} new work`);
  span.textContent = 'https://different.example/';
  expect(captureComposerEdit(span, source)).toBeNull();
});
