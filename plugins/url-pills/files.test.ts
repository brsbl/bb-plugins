import { expect, it } from 'vitest';
import { parseLocalFile, fileIconMask } from './files';
import { findComposerUrls } from './urls';

it.each([
  ['/work/plan.md', '/work/plan.md', 'plan.md'],
  ['C:\\work\\app.ts:42', 'C:\\work\\app.ts', 'app.ts:42'],
  ['file:///work/Project%20Plan.md#L4-L6', '/work/Project Plan.md', 'Project Plan.md#L4-L6'],
  ['file:///C:/work/app.ts', 'C:/work/app.ts', 'app.ts'],
])('recognizes %s without losing its destination', (source, path, label) => {
  expect(parseLocalFile(source)).toMatchObject({ path, label });
});
it('retains native rewritten paths and line ranges', () => {
  expect(parseLocalFile('./%2Fwork%2Fa.md', true)?.path).toBe('/work/a.md');
  expect(parseLocalFile('/work/a.ts:4-6')?.location).toEqual({ line: 4, endLine: 6 });
  expect(parseLocalFile('/work/a.md#heading', true)?.label).toBe('a.md#heading');
});
it.each(['//server/a.md', 'file://server/a.md', 'file:///a.md?x=1', 'file:///bad%00.md', '~/a.md', '../a.md', '/route', '/a.md:0', '/a.md:6-4', 'file:///bad%GG.md', 'moss://note/id'])('leaves unsupported input native: %s', source => {
  expect(parseLocalFile(source)).toBeNull();
});
it('matches bounded paths without treating URL fragments, relative paths or code as files', () => {
  const text = 'See /work/a.md:42 and C:\\work\\b.ts. https://example.com/a.md ftp://host/a.md ~/notes/c.md ./relative/d.md `file:///code.md`';
  expect(findComposerUrls(text).map(({from,to})=>text.slice(from,to))).toEqual(['/work/a.md:42', 'C:\\work\\b.ts', 'https://example.com/a.md']);
});
it('uses the existing file type shapes', () => {
  expect(fileIconMask('/a.md')).toContain(encodeURIComponent('M10 9H8M16 13H8M16 17H8'));
  expect(fileIconMask('/a.ts')).toContain(encodeURIComponent('M10 12.5 8 15l2 2.5M14 12.5l2 2.5-2 2.5'));
  expect(fileIconMask('/a.png')).not.toBe(fileIconMask('/a.bin'));
});
it('does not reinterpret encoded filename punctuation as navigation', () => {
  expect(parseLocalFile('file:///work/a%23b%3F.md')).toEqual({ path: '/work/a#b?.md', label: 'a#b?.md' });
  expect(parseLocalFile('./%2Fwork%2Fa%23b.md', true)).toEqual({ path: '/work/a#b.md', label: 'a#b.md' });
});
