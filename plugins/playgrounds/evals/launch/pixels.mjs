import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';
const require = createRequire(import.meta.url);
// Optional absolute module path supports an existing bb checkout without adding
// a browser/image stack to the shipped plugin's runtime dependencies.
const { PNG } = require(process.env.LAUNCH_PNGJS || 'pngjs');
export const readPng = file => PNG.sync.read(readFileSync(file));
const delta = (a, b, i) => Math.max(...[0, 1, 2].map(c => Math.abs(a.data[i + c] - b.data[i + c])));
export function visualDelta(files, masks = []) {
  const [a, b, c, d, e] = files.map(readPng);
  if ([b, c, d, e].some(p => p.width !== a.width || p.height !== a.height))
    return { pass: false, reason: 'screenshot dimensions changed; needs review' };
  let stable = 0, changed = 0, ambient = 0;
  for (let y = 0; y < a.height; y++) for (let x = 0; x < a.width; x++) {
    if (masks.some(r => x >= r.x - 6 && x <= r.x + r.w + 6 && y >= r.y - 6 && y <= r.y + r.h + 6)) continue;
    const i = (y * a.width + x) * 4;
    if (delta(a, b, i) > 12 || delta(b, c, i) > 12) { ambient++; continue; }
    stable++;
    if (delta(c, d, i) > 18 && delta(c, e, i) > 18 && delta(d, e, i) <= 12) changed++;
  }
  // Moving scenes cannot pass solely because motion crossed previously still
  // pixels. Require a large excess over the no-input motion observed before it.
  const required = Math.max(24, ambient * 4);
  return { pass: changed >= required, changed, required, ambient, stable,
    reason: changed >= required ? 'stable output changed outside controls' : 'no proven output change outside controls' };
}
export function hasInk(file) {
  const p = readPng(file);
  const colors = new Set();
  for (let i = 0; i < p.data.length; i += 16) colors.add(`${p.data[i] >> 4},${p.data[i+1] >> 4},${p.data[i+2] >> 4}`);
  return p.width > 80 && p.height > 40 && colors.size > 8;
}
