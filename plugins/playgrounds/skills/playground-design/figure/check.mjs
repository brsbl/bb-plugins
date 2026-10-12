import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const LIMIT = 400_000;
const PROSE_WORDS = 70;
const without = (html, pattern) => html.replace(pattern, ' ');
const count = (html, pattern) => (html.match(pattern) ?? []).length;

export function visibleWords(html) {
  let text = html;
  for (const pattern of [/<!--[\s\S]*?-->/g, /<script[\s\S]*?<\/script>/gi, /<style[\s\S]*?<\/style>/gi, /<figure[\s\S]*?<\/figure>/gi, /<svg[\s\S]*?<\/svg>/gi, /<details[\s\S]*?<\/details>/gi]) text = without(text, pattern);
  return text.replace(/<[^>]+>/g, ' ').replace(/&[a-z#0-9]+;/gi, ' ').split(/\s+/).filter((word) => /[A-Za-z]/.test(word)).length;
}

export function check({ html, width }) {
  const errors = [];
  const warnings = [];
  if (html.length > LIMIT) errors.push(`HTML is ${html.length} characters; the limit is ${LIMIT}.`);
  if (/100vh|body\s*\{[^}]*height\s*:\s*100%/i.test(html)) errors.push('Never size from the viewport (100vh, body height 100%): the frame grows to fit its content.');
  const blocked = [...html.matchAll(/\bsrc\s*=\s*["'](https?:\/\/[^"']+)["']|@import\s+url\(\s*["']?(https?:[^"')]+)/gi)].map((m) => m[1] ?? m[2]).filter((url) => !url.startsWith('https://upload.wikimedia.org/'));
  if (blocked.length) errors.push(`Remote resources are blocked: ${blocked.slice(0, 3).join(', ')}`);
  if (!/class\s*=\s*["'][^"']*\bpg-fig\b/.test(html)) warnings.push('No figure.pg-fig: frame the hero with Fig n and a title on top, the hint and a live <output> readout below.');
  const words = visibleWords(html);
  if (words > PROSE_WORDS) warnings.push(`${words} words of visible prose outside the figure (budget ${PROSE_WORDS}). Put explanations, assumptions and sources in your chat reply.`);
  if (count(html, /<details\b/gi) > 1) warnings.push('More than one <details>. Keep at most one; the rest belongs in your reply.');
  if (/<select\b/i.test(html)) warnings.push('A native <select>: use .pg-seg or chips for up to six choices.');
  if (count(html, /type\s*=\s*["']number["']/gi) > 2) warnings.push('Several number boxes: use sliders (.pg-field + range) for continuous values; keep number boxes for exact figures the user knows.');
  const fig = html.match(/<figure[^>]*\bpg-fig\b[\s\S]*?<\/figure>/i)?.[0] ?? '';
  const solids = count(fig, /class="iso-solid/g);
  if (/iso-svg/.test(fig) && solids < 40) warnings.push(`The figure has ${solids} kit solids. Build the object from at least 40 purposeful parts: bases on feet, rails, bushings, screws, hooks, ticks.`);
  if (count(fig, /<text\b/gi) > 2) warnings.push(`${count(fig, /<text\b/gi)} <text> labels inside the figure. Keep words out of the drawing (one engraved label at most); name parts in a .pg-legend under it.`);
  if (/<button[^>]*(?:pg-btn-primary[^>]*\bdisabled\b|\bdisabled\b[^>]*pg-btn-primary)/i.test(html)) warnings.push('The primary button starts disabled. Open on a state where the main action already works.');
  if (/slider-thumb|range-thumb/i.test(html)) warnings.push('Custom slider styling: the kit styles input[type=range] with --pg-accent; set the accent instead.');
  if (!/playground\.save\s*\(/.test(html)) warnings.push('Nothing is saved: call window.playground.save after meaningful changes.');
  if (!/playground\.expose\s*\(/.test(html)) warnings.push('No actions exposed: expose the verbs a person would use so the agent can drive the playground.');
  if (width !== undefined && width > 620) warnings.push(`Width ${width}: keep 440–560 unless a side-by-side comparison or map needs more.`);
  return { errors, warnings, words };
}

export function report({ errors, warnings }) {
  if (!errors.length && !warnings.length) return 'Check passed.';
  return [...errors.map((e) => `error: ${e}`), ...warnings.map((w) => `warning: ${w}`)].join('\n');
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const [file, ...extra] = process.argv.slice(2);
  if (!file || extra.length) throw new Error('Usage: node figure/check.mjs <payload.json>');
  const result = check(JSON.parse(readFileSync(resolve(file), 'utf8')));
  console.log(report(result));
  if (result.errors.length) process.exitCode = 1;
}
