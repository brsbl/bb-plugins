#!/usr/bin/env node
import { execFileSync } from 'node:child_process';
import { lstatSync, readFileSync, readlinkSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { gunzipSync } from 'node:zlib';

// Keep examples explicit; never exempt whole files, tests, or vendored sources.
const syntheticHomes = new Set(['/home/user', '/Users/alex']);
const syntheticThread = /^thr_example[0-9]{3}$/;
// Split the denied account names so the policy itself does not repeat them
// verbatim in tracked files. The public GitHub owner is intentionally allowed.
const personalIdentifiers = new RegExp(['brs' + 'abel', 'ber' + 'sabel', 'ta' + 'desse'].join('|'), 'gi');

export function privateDataHits(text) {
  const hits = [];
  const patterns = [
    { kind: 'personal identifier', pattern: personalIdentifiers, allowed: () => false },
    { kind: 'home path', pattern: /\/(?:home|Users)\/[a-zA-Z0-9_.-]+/g, allowed: value => syntheticHomes.has(value) },
    { kind: 'thread ID', pattern: /thr_[a-z0-9]{10}(?![a-z0-9])/g, allowed: value => syntheticThread.test(value) },
  ];
  for (const { kind, pattern, allowed } of patterns) {
    for (const match of text.matchAll(pattern)) {
      if (!allowed(match[0])) hits.push({ kind, line: text.slice(0, match.index).split('\n').length });
    }
  }
  return hits;
}

export function checkPrivateData(root = fileURLToPath(new URL('../', import.meta.url))) {
  const files = execFileSync('git', ['ls-files', '-z'], { cwd: root, encoding: 'utf8', maxBuffer: 16 * 1024 * 1024 }).split('\0').filter(Boolean);
  const findings = [];
  for (const file of files) {
    const path = resolve(root, file);
    // Scan symlink text, not files outside the checkout. Do not skip binary files:
    // ASCII paths/IDs can appear in generated bundles and binary metadata too.
    const contents = lstatSync(path).isSymbolicLink() ? Buffer.from(readlinkSync(path)) : readFileSync(path);
    const sources = [['filename', file], ['content', contents.toString('utf8')]];
    if (/\.(tgz|gz)$/i.test(file)) sources.push(['gzip content', gunzipSync(contents).toString('utf8')]);
    for (const [source, text] of sources) {
      for (const hit of privateDataHits(text)) findings.push({ file, source, ...hit });
    }
  }
  return findings;
}

if (resolve(process.argv[1] ?? '') === fileURLToPath(import.meta.url)) {
  const findings = checkPrivateData();
  for (const { file, source, kind, line } of findings) {
    // Do not echo the private value into public CI logs.
    console.error(`${file}:${line}: private ${kind} in ${source}; use a documented synthetic example`);
  }
  if (findings.length) process.exitCode = 1;
  else console.log('Tracked-file privacy check passed (including generated and vendored files).');
}
