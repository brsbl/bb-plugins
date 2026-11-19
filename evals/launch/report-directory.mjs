import { existsSync, realpathSync } from 'node:fs';
import { dirname, isAbsolute, relative, resolve } from 'node:path';

// Resolve existing ancestors before creating anything, so a symlink cannot send
// raw reports into a tracked directory (or outside this private output tree).
export function reportDirectory(here, requested) {
  const root = resolve(realpathSync(here), 'reports');
  const out = resolve(requested);
  let ancestor = out;
  while (!existsSync(ancestor)) ancestor = dirname(ancestor);
  const physical = resolve(realpathSync(ancestor), relative(ancestor, out));
  for (const candidate of [out, physical]) {
    const child = relative(root, candidate);
    if (!child || child === '..' || child.startsWith('../') || isAbsolute(child)) {
      throw new Error('Raw eval output must be a run directory inside evals/launch/reports/ (gitignored).');
    }
  }
  return out;
}
