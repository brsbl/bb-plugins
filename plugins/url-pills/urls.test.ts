import { describe, expect, it } from 'vitest';
import { findComposerUrls, parsePillUrl } from './urls';

describe('URL recognition without text normalization', () => {
  it('keeps original paths, query and fragment while shortening only the label', () => {
    const text = 'https://EXAMPLE.com:443/a%20b?token=private#part';
    expect(parsePillUrl(text)).toEqual({ text, label: 'example.com:443/a%20b', origin: 'https://example.com', iconOrigin: 'https://example.com' });
    expect(parsePillUrl('https://münich.example/straße')?.label).toBe('xn--mnich-kva.example/stra%C3%9Fe');
  });
  it.each(['https://user:pass@example.com/', 'mailto:me@example.com', '/relative', 'example.com', 'https://bad port/', 'https://', 'https://example.com\\hidden'])('leaves malformed or unsupported input native: %s', (input) => {
    expect(parsePillUrl(input)).toBeNull();
  });
  it.each(['http://example.com/', 'https://localhost/a', 'https://host.local/a', 'https://127.0.0.1/a', 'https://[::1]/a', 'https://example.com:8443/a', 'https://intranet/a'])('never requests an icon for %s', (input) => {
    expect(parsePillUrl(input)?.iconOrigin).toBeNull();
  });
  it('defers current-origin thread routes to native references', () => {
    expect(parsePillUrl('https://bb.test/projects/proj_a/threads/thr_b', 'https://bb.test')).toBeNull();
    expect(parsePillUrl('https://other.test/projects/proj_a/threads/thr_b', 'https://bb.test')).not.toBeNull();
  });
  it('retains balanced URL punctuation and UTF-16 offsets', () => {
    const input = '✨ Review (https://example.com/a_(b)), then https://example.com/?q=1#frag.\nhttps://example.com/';
    expect(findComposerUrls(input).map(({ from, to }) => input.slice(from, to))).toEqual([
      'https://example.com/a_(b)', 'https://example.com/?q=1#frag', 'https://example.com/',
    ]);
  });
  it('excludes source code, authored links and quotes', () => {
    const input = [
      '`https://inline.example/`',
      '[Read docs](https://authored.example/)',
      '> https://quote.example/',
      '```text', 'https://code.example/', '```',
      'https://keep.example/path',
    ].join('\n');
    expect(findComposerUrls(input).map(({ from, to }) => input.slice(from, to))).toEqual(['https://keep.example/path']);
  });
  it('bounds decorations in a large paste', () => {
    expect(findComposerUrls('https://example.com/ '.repeat(600))).toHaveLength(512);
  });
});
