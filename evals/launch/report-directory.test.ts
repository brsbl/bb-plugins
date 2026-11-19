import { expect, it } from 'vitest';
import { mkdtempSync, mkdirSync, rmSync, symlinkSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
// @ts-expect-error eval-only Node ESM
import { reportDirectory } from './report-directory.mjs';

it('keeps new and resumed reports in the ignored tree and refuses path/symlink escapes', () => {
  const here = mkdtempSync(join(tmpdir(), 'launch-report-'));
  try {
    const out = join(here, 'reports', 'baseline');
    expect(reportDirectory(here, out)).toBe(out);
    mkdirSync(out, { recursive: true });
    expect(reportDirectory(here, out)).toBe(out);
    for (const path of [here, join(here, 'reports'), join(here, 'reports-public', 'run'), join(here, 'reports', '..', 'tracked')]) {
      expect(() => reportDirectory(here, path)).toThrow('gitignored');
    }
    mkdirSync(join(here, 'tracked'));
    symlinkSync(join(here, 'tracked'), join(here, 'reports', 'escape'));
    expect(() => reportDirectory(here, join(here, 'reports', 'escape', 'new-run'))).toThrow('gitignored');
    rmSync(join(here, 'reports'), { recursive: true });
    symlinkSync(join(here, 'tracked'), join(here, 'reports'));
    expect(() => reportDirectory(here, out)).toThrow('gitignored');
  } finally {
    rmSync(here, { recursive: true, force: true });
  }
});
