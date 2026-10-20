import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, rmSync, symlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { test } from 'node:test';
import { gzipSync } from 'node:zlib';
import { checkPrivateData, privateDataHits } from './check-private-data.mjs';

// Assemble forbidden fixtures so this test does not itself publish private data.
const home = name => '/' + 'home/' + name;
const mac = name => '/' + 'Users/' + name;
const thread = suffix => 'thr_' + suffix;

test('rejects personal home paths and real-shaped thread IDs, including links', () => {
  for (const value of [mac('brsbl'), home('someone'), mac('other-user'), home('user2'), mac('alexander'), home('name.with-dots')]) {
    assert.equal(privateDataHits(`first\n[file](file://${value}/note.md)`).length, 1);
    assert.equal(privateDataHits(`first\n${value}`)[0].line, 2);
  }
  for (const value of [thread('a1b2c3d4e5'), thread('0123456789'), thread('exampleabc')]) {
    assert.equal(privateDataHits(`@thread:${value}#msg=42`).length, 1);
    assert.equal(privateDataHits(`/worktrees/${value}-1/report.json`).length, 1);
    assert.equal(privateDataHits(`${value}_screenshot.png`).length, 1);
  }
});

test('rejects personal account names case-insensitively without banning the public GitHub owner', () => {
  const accounts = ['brs' + 'abel', 'bt' + 'adesse11', 'ber' + 'sabel', 'ta' + 'desse'];
  for (const name of accounts) {
    for (const value of [name, name.toUpperCase(), `gmail-${name}`, `${name}@example.com`]) {
      assert.ok(privateDataHits(value).some(hit => hit.kind === 'personal identifier'));
    }
  }
  for (const value of [home('ber' + 'sabel'), mac('brsbl')]) {
    assert.ok(privateDataHits(value).some(hit => hit.kind === 'home path'));
  }
  for (const url of [
    'https://github.com/brsbl/bb-plugins',
    'git:https://github.com/brsbl/bb-plugins.git@plugin/playgrounds',
    'https://github.com/brsbl/marketplace',
    'https://raw.githubusercontent.com/brsbl/marketplace/main/marketplace.json',
    'alex@example.com',
    'https://stackoverflow.com/users/1/someone',
  ]) assert.deepEqual(privateDataHits(url), []);
});

test('allows only explicit synthetic homes and thread examples', () => {
  for (const value of ['/home/user/file', '/Users/alex/file', 'thr_example001', 'thr_example999', '/absolute/worktree', 'thr_short', 'thr_descriptive_fixture']) {
    assert.deepEqual(privateDataHits(value), []);
  }
});

test('scans tracked files, filenames, symlinks, binary metadata and gzip vendors without scanning untracked output', () => {
  const root = mkdtempSync(join(tmpdir(), 'privacy-check-'));
  try {
    const git = (...args) => execFileSync('git', args, { cwd: root });
    git('init', '-q');
    mkdirSync(join(root, 'vendor'));
    writeFileSync(join(root, 'vendor/generated.js'), `\0${home('someone')}/file\n${thread('a1b2c3d4e5')}`);
    writeFileSync(join(root, 'vendor/sdk.tgz'), gzipSync(`tar metadata\0${mac('someone')}/file`));
    symlinkSync(home('someone') + '/missing', join(root, 'link'));
    writeFileSync(join(root, thread('a1b2c3d4e5') + '.md'), 'example');
    writeFileSync(join(root, '.gitignore'), 'reports/\n');
    git('add', '.');
    mkdirSync(join(root, 'reports'));
    writeFileSync(join(root, 'reports/raw.json'), mac('someone'));
    const findings = checkPrivateData(root);
    assert.equal(findings.length, 5);
    assert.equal(findings.filter(hit => hit.file === 'vendor/generated.js').length, 2);
    assert.ok(findings.some(hit => hit.source === 'gzip content'));
    assert.ok(findings.some(hit => hit.source === 'filename'));
    assert.ok(findings.some(hit => hit.file === 'link'));
    assert.ok(findings.every(hit => !hit.file.startsWith('reports/')));
    // Force-added ignored files still get checked.
    git('add', '-f', 'reports/raw.json');
    assert.equal(checkPrivateData(root).length, 6);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});
