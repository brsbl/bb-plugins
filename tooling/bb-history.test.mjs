import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { after, test } from "node:test";

import {
  advanceState,
  buildScan,
  clipUtf8,
  ensureCleanTree,
  isDirectFeedback,
  loadRows,
  readState,
  redactText,
  releaseState,
  selectRows,
  stableHash,
} from "./bb-history.mjs";

const here = dirname(fileURLToPath(import.meta.url));
const cli = resolve(here, "bb-history.mjs");
const fixture = resolve(here, "fixtures/bb-history-sample.jsonl");
const rows = loadRows({ fixture });

const scratchDirs = [];
function scratch() {
  const dir = mkdtempSync(resolve(tmpdir(), "bb-history-"));
  scratchDirs.push(dir);
  return dir;
}
after(() => {
  for (const dir of scratchDirs) rmSync(dir, { recursive: true, force: true });
});

function scanCli(args, dir) {
  const out = execFileSync("node", [cli, "scan", "--state", resolve(dir, "state.json"), "--fixture", fixture, ...args], {
    encoding: "utf8",
  });
  return out;
}

test("direct-feedback filter keeps user words, drops relays", () => {
  assert.equal(isDirectFeedback("Prefer one primary action"), true);
  assert.equal(isDirectFeedback("[bb message from thread:thr_x] continue"), false);
  assert.equal(isDirectFeedback("[bb system] note"), false);
  assert.equal(isDirectFeedback("<bb system>x"), false);
});

test("scan returns only direct user feedback, excludes assistant and relays", () => {
  const { envelope } = buildScan(rows, { version: 1, cursor: null }, { now: 1 });
  assert.equal(envelope.message_count, 3); // seg_0001, seg_0004, seg_0005
  assert.equal(envelope.messages.every((m) => !m.text.startsWith("[bb")), true);
});

test("incremental filtering: a second scan sees only newer rows", () => {
  const first = buildScan(rows, { version: 1, cursor: null }, { now: 1, limit: 1 });
  assert.equal(first.envelope.message_count, 1);
  const advanced = advanceState(first.nextState, {
    createdAt: first.envelope.cursor_commit.created_at,
    segmentId: first.envelope.cursor_commit.segment_id,
    leaseId: first.envelope.lease_id,
    now: 1,
  });
  const second = buildScan(rows, advanced, { now: 2 });
  assert.equal(second.envelope.cursor_before.segment_id, "seg_0001");
  assert.deepEqual(
    second.envelope.messages.map((m) => m.created_at),
    [3000, 4000],
  );
});

test("project, thread, and time filters", () => {
  assert.deepEqual(
    selectRows(rows, { projects: ["proj_other"] }).map((r) => r.id),
    ["seg_0004", "seg_0005"],
  );
  assert.deepEqual(
    selectRows(rows, { threads: ["thr_sample_a"] }).map((r) => r.id),
    ["seg_0001", "seg_0003"], // assistant seg_0002 excluded by kind
  );
  assert.deepEqual(
    selectRows(rows, { since: 2500, until: 3500 }).map((r) => r.id),
    ["seg_0004"],
  );
});

test("redaction removes emails, urls, bb ids, secrets, and local usernames", () => {
  const redacted = redactText(
    "mail a@b.com see https://x.example/y token sk-live-0123456789abcdef id thr_abc123 path /Users/jane/x",
  );
  assert.match(redacted, /\[redacted-email\]/);
  assert.match(redacted, /https:\/\/\[redacted-url\]/);
  assert.match(redacted, /\[redacted-token\]/);
  assert.match(redacted, /\[redacted-id\]/);
  assert.match(redacted, /\/Users\/\[redacted-user\]\/x/);
  assert.doesNotMatch(redacted, /a@b\.com|jane|thr_abc123|sk-live/);
});

test("redacted scan hashes identifiers and never emits raw ids", () => {
  const { envelope } = buildScan(rows, { version: 1, cursor: null }, { now: 1, redact: true });
  const blob = JSON.stringify(envelope);
  assert.doesNotMatch(blob, /thr_sample|proj_sample|proj_other|designer@example|sk-live/);
  assert.equal(envelope.messages[0].thread, stableHash("thr_sample_a"));
  assert.equal(envelope.redacted, true);
});

test("no-redact preserves raw identifiers for local-only use", () => {
  const { envelope } = buildScan(rows, { version: 1, cursor: null }, { now: 1, redact: false });
  assert.equal(envelope.messages[0].thread, "thr_sample_a");
  assert.equal(envelope.redacted, false);
});

test("clipUtf8 respects a byte budget without splitting code points", () => {
  const { text, truncated } = clipUtf8("café ☕ more", 5);
  assert.equal(truncated, true);
  assert.equal(Buffer.byteLength(text, "utf8") <= 5, true);
  assert.doesNotThrow(() => Buffer.from(text, "utf8").toString("utf8"));
});

test("checkpointing: scan does not move the cursor, advance does", () => {
  const dir = scratch();
  const statePath = resolve(dir, "state.json");
  scanCli(["--limit", "5"], dir);
  const afterScan = readState(statePath);
  assert.equal(afterScan.cursor, null); // scan only takes a lease
  assert.ok(afterScan.lease, "scan should hold a lease");
  execFileSync("node", [
    cli, "advance", "--state", statePath,
    "--created-at", String(afterScan.lease.cursor_commit.created_at),
    "--segment-id", afterScan.lease.cursor_commit.segment_id,
    "--lease-id", afterScan.lease.id,
  ]);
  const afterAdvance = readState(statePath);
  assert.equal(afterAdvance.cursor.segment_id, "seg_0005");
  assert.equal(afterAdvance.lease, undefined);
});

test("failure safety: advance rejects wrong lease, backward, and mismatched cursor", () => {
  const first = buildScan(rows, { version: 1, cursor: null }, { now: 1 });
  const state = first.nextState;
  const commit = first.envelope.cursor_commit;
  assert.throws(
    () => advanceState(state, { createdAt: commit.created_at, segmentId: commit.segment_id, leaseId: "wrong", now: 1 }),
    /lease does not match/,
  );
  assert.throws(
    () => advanceState(state, { createdAt: 1, segmentId: "seg_0001", leaseId: first.envelope.lease_id, now: 1 }),
    /backward|match the leased/,
  );
});

test("release drops a lease without advancing the cursor", () => {
  const first = buildScan(rows, { version: 1, cursor: null }, { now: 1 });
  const released = releaseState(first.nextState, { leaseId: first.envelope.lease_id });
  assert.equal(released.lease, undefined);
  assert.equal(released.cursor ?? null, null);
});

test("concurrency: a second scan refuses while a lease is active", () => {
  const dir = scratch();
  scanCli([], dir); // takes a lease
  assert.throws(
    () => scanCli([], dir),
    /lease .* is active|checkpoint lock/,
  );
});

test("preview JSONL emits one redacted message per stdout line", () => {
  const dir = scratch();
  const out = scanCli(["--format", "jsonl"], dir);
  const lines = out.trim().split("\n").filter(Boolean);
  assert.equal(lines.length, 3);
  for (const line of lines) {
    const parsed = JSON.parse(line);
    assert.ok(parsed.text);
    assert.doesNotMatch(line, /thr_sample|designer@example/);
  }
});

test("ensureCleanTree refuses to run over uncommitted artifact work", () => {
  const dir = scratch();
  execFileSync("git", ["init", "-q"], { cwd: dir });
  execFileSync("git", ["config", "user.email", "t@example.com"], { cwd: dir });
  execFileSync("git", ["config", "user.name", "t"], { cwd: dir });
  // Clean tree: no artifact changes -> allowed.
  assert.doesNotThrow(() => ensureCleanTree(["rules"], dir));
  // Uncommitted artifact work -> refused, preserving it.
  writeFileSync(resolve(dir, "rules-wip.md"), "draft\n");
  execFileSync("git", ["add", "rules-wip.md"], { cwd: dir });
  assert.throws(() => ensureCleanTree(["rules-wip.md"], dir), /uncommitted work/);
});

test("lease-id semantics: no new rows means caught up (null lease, cursor unchanged)", () => {
  const state = { version: 1, cursor: { created_at: 4000, segment_id: "seg_0005" } };
  const { envelope } = buildScan(rows, state, { now: 1 });
  assert.equal(envelope.message_count, 0);
  assert.equal(envelope.lease_id, null); // caught up: stop signal
  assert.deepEqual(envelope.cursor_commit, state.cursor);
});

test("lease-id semantics: an all-relay batch advances the cursor with a non-null lease and zero messages", () => {
  // Skipped relays must still move the cursor, so message_count 0 does NOT mean
  // caught up — the lease is non-null and the cursor advances past the relays.
  const relayRows = [
    { id: "r1", thread_id: "t", source_kind: "user_message", created_at: 10, text: "[bb message from thread:thr_x] continue", project_id: "p", title: "T" },
    { id: "r2", thread_id: "t", source_kind: "user_message", created_at: 20, text: "[bb system] note", project_id: "p", title: "T" },
  ];
  const { envelope } = buildScan(relayRows, { version: 1, cursor: null }, { now: 1 });
  assert.equal(envelope.message_count, 0);
  assert.notEqual(envelope.lease_id, null); // a no-change batch to advance, not caught up
  assert.deepEqual(envelope.cursor_commit, { created_at: 20, segment_id: "r2" });
});
