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

it('skips long non-link tokens and unsupported schemes without finding nested file paths', () => {
  expect(findComposerUrls('a'.repeat(100_000))).toEqual([]);
  expect(findComposerUrls('ftp://host/a.md moss://note/a.md')).toEqual([]);
});

it('recognizes a path containing spaces only when it is alone on its line', () => {
  const pick = (text: string) => findComposerUrls(text).map(({ from, to }) => text.slice(from, to));
  const moss = '/workspace/Notes/Project Plan/Project Plan.md';
  expect(pick(moss)).toEqual([moss]);
  expect(pick(`Read this\n  ${moss}.\nthen /work/a.md`)).toEqual([moss, '/work/a.md']);
  expect(pick('C:\\Work\\My Project\\Plan.ts:4-6')).toEqual(['C:\\Work\\My Project\\Plan.ts:4-6']);
  expect(pick(`Open ${moss} please`)).toEqual([]);
  expect(pick('/review the change in src/app.ts')).toEqual([]);
  expect(pick('/work/My Notes/draft v2')).toEqual([]);
  expect(pick('/work/a b.md /work/c.md')).toEqual(['/work/c.md']);
  expect(pick('/tmp/out.log shows errors from app.ts')).toEqual(['/tmp/out.log']);
  expect(pick('C:\\Work\\a.ts fails on node 20.1')).toEqual(['C:\\Work\\a.ts']);
  expect(pick(`[Plan](<${moss}>)\n> ${moss}\n\`\`\`\n${moss}\n\`\`\``)).toEqual([]);
});

it('keeps web links after punctuation and scans hostile drafts in linear time', () => {
  expect(findComposerUrls('URL:https://example.com/a')).toEqual([{ from: 4, to: 25 }]);
  const pick = (text: string) => findComposerUrls(text).map(({ from, to }) => text.slice(from, to));
  expect(pick('docs/api:https://example.com/a')).toEqual(['https://example.com/a']);
  expect(pick('and/or,https://example.com')).toEqual(['https://example.com']);
  expect(pick('/work/a.md,https://example.com')).toEqual(['/work/a.md', 'https://example.com']);
  const started = performance.now();
  findComposerUrls('/' + ')'.repeat(50_000));
  findComposerUrls(('/a/ ' + ')'.repeat(8180) + '\n').repeat(20));
  findComposerUrls('/a' + '.,'.repeat(4000) + 'x');
  findComposerUrls('/usr/local/bin '.repeat(20_000));
  findComposerUrls('/a/b c\n'.repeat(100_000));
  expect(findComposerUrls('```\n' + '/usr/lib/a b/x.so\n'.repeat(50_000) + '```')).toEqual([]);
  expect(performance.now() - started).toBeLessThan(1000);
});
