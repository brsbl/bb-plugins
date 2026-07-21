#!/usr/bin/env node
// Reusable reader that turns bb thread history into a practical, previewable input.
//
// One repository-owned utility so every plugin that personalizes from history
// (Design Doctrine rules, the prompt-shaper skill) reads the same source the
// same way instead of forking query, checkpoint, and redaction logic. Plugin-
// specific interpretation stays in each plugin; this only reads, filters,
// redacts, and checkpoints.
//
// It reconciles with plugins/design-doctrine/scripts/scan-history.py: the same
// segment table, the same (created_at, segment_id) cursor, the same direct-
// feedback filter, and the same lease/advance/release checkpoint contract. The
// generic additions are explicit project/thread/time filters, redaction, and
// JSONL preview.
//
// Commands (never create or mutate a live automation — this only reads history
// and writes its own checkpoint file):
//   scan       Print new history since the checkpoint and take a lease.
//   advance    Atomically commit the checkpoint after a successful run.
//   release    Drop a lease without advancing so a later run can retry.
//
// Rows come from bb's local SQLite database by default, or from a synthetic
// --fixture JSONL file. Tests and committed previews use fixtures; private
// thread contents are never committed.

import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import {
  closeSync,
  mkdirSync,
  openSync,
  readFileSync,
  renameSync,
  rmSync,
  statSync,
  writeSync,
} from "node:fs";
import { createRequire } from "node:module";
import { homedir } from "node:os";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

// `require` shim for the ESM module (only used to reach node:sqlite).
const require = createRequire(import.meta.url);

const RELAY_PREFIXES = ["[bb system]", "[bb message", "<bb system"];
const DEFAULT_LEASE_SECONDS = 6 * 60 * 60;
const LOCK_STALE_MS = 60_000;

// ---------------------------------------------------------------------------
// Pure helpers (exported for tests)
// ---------------------------------------------------------------------------

export function defaultDbPath(env = process.env, home = homedir()) {
  if (env.BB_DB_PATH) return resolve(expandHome(env.BB_DB_PATH, home));
  if (env.BB_DATA_DIR) return resolve(expandHome(env.BB_DATA_DIR, home), "bb.db");
  return resolve(home, ".bb", "bb.db");
}

function expandHome(value, home = homedir()) {
  return value.startsWith("~") ? home + value.slice(1) : value;
}

// A relay is bb re-posting an instruction; only the user's own words are direct
// feedback. Mirrors scan-history.py:is_direct_feedback.
export function isDirectFeedback(text) {
  const stripped = String(text).replace(/^\s+/, "");
  return !RELAY_PREFIXES.some((prefix) => stripped.startsWith(prefix));
}

// Clip to a UTF-8 byte budget without splitting a multi-byte character.
export function clipUtf8(text, maxBytes) {
  const buffer = Buffer.from(String(text), "utf8");
  if (buffer.length <= maxBytes) return { text: String(text), truncated: false };
  let end = maxBytes;
  // Back off to a code-point boundary (continuation bytes are 0b10xxxxxx).
  while (end > 0 && (buffer[end] & 0xc0) === 0x80) end -= 1;
  return { text: buffer.toString("utf8", 0, end), truncated: true };
}

// Deterministic, non-reversible short id so previews can group by thread or
// project without exposing raw bb identifiers.
export function stableHash(value) {
  return createHash("sha256").update(String(value)).digest("hex").slice(0, 12);
}

// Redaction suitable for committed or previewed evidence. Removes the classes
// of data governance forbids in evidence: identifiers, addresses, secrets,
// and local usernames.
export function redactText(input) {
  let text = String(input);
  text = text.replace(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/g, "[redacted-email]");
  text = text.replace(/\b(?:thr|msg|wf|run|env|proj|auto|seg)_[A-Za-z0-9]+/g, "[redacted-id]");
  text = text.replace(/\b(?:sk|pk|ghp|gho|ghs|ghu|xox[baprs]|AKIA)[-_A-Za-z0-9]{10,}\b/g, "[redacted-token]");
  text = text.replace(/\bBearer\s+[A-Za-z0-9._-]{10,}/gi, "Bearer [redacted-token]");
  text = text.replace(/(https?:\/\/)[^\s)]+/g, "$1[redacted-url]");
  text = text.replace(/\/(?:Users|home)\/[^/\s]+/g, (match) => match.slice(0, match.indexOf("/", 1) + 1) + "[redacted-user]");
  return text;
}

// SQL-equivalent selection: cursor range, kind, project/thread/time filters,
// stable ordering, and limit. Used verbatim on fixture rows so a fixture
// behaves like the database.
export function selectRows(rows, options) {
  const {
    kind = "user_message",
    cursor = null,
    projects = null,
    threads = null,
    since = null,
    until = null,
    limit = 200,
  } = options;
  const after = cursor ? [Number(cursor.created_at), String(cursor.segment_id)] : [0, ""];
  const projectSet = projects && projects.length ? new Set(projects) : null;
  const threadSet = threads && threads.length ? new Set(threads) : null;
  return rows
    .filter((row) => row.source_kind === kind)
    .filter((row) => {
      const key = [Number(row.created_at), String(row.id)];
      if (key[0] < after[0] || (key[0] === after[0] && key[1] <= after[1])) return false;
      if (projectSet && !projectSet.has(row.project_id)) return false;
      if (threadSet && !threadSet.has(row.thread_id)) return false;
      if (since != null && Number(row.created_at) < since) return false;
      if (until != null && Number(row.created_at) > until) return false;
      return true;
    })
    .sort((a, b) =>
      Number(a.created_at) - Number(b.created_at) || String(a.id).localeCompare(String(b.id)),
    )
    .slice(0, limit);
}

// Cursor helpers ------------------------------------------------------------

export function cursorTuple(cursor) {
  if (cursor == null) return [0, ""];
  return [Number(cursor.created_at), String(cursor.segment_id)];
}

function cursorFromRow(row) {
  return { created_at: Number(row.created_at), segment_id: String(row.id) };
}

function cursorLessOrEqual(a, b) {
  return a[0] < b[0] || (a[0] === b[0] && a[1] <= b[1]);
}

// State (explicit checkpoint) ----------------------------------------------

export function readState(path) {
  let raw;
  try {
    raw = readFileSync(path, "utf8");
  } catch (error) {
    if (error.code === "ENOENT") return { version: 1, cursor: null };
    throw error;
  }
  const value = JSON.parse(raw);
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    throw new Error("state must be a JSON object");
  }
  return value;
}

export function writeState(path, value) {
  mkdirSync(dirname(path), { recursive: true });
  const temporary = `${path}.tmp-${process.pid}-${stableHash(String(hrtimeNow()))}`;
  const fd = openSync(temporary, "w");
  try {
    writeSync(fd, `${JSON.stringify(value, null, 2)}\n`);
  } finally {
    closeSync(fd);
  }
  renameSync(temporary, path); // atomic replace on the same filesystem
}

function hrtimeNow() {
  return process.hrtime.bigint().toString();
}

export function activeLease(state, now) {
  const lease = state.lease;
  if (typeof lease !== "object" || lease === null) return null;
  if (typeof lease.id !== "string" || !lease.id) {
    throw new Error("state contains an invalid maintenance lease id");
  }
  const expiresAt = Number(lease.expires_at);
  if (!Number.isFinite(expiresAt)) {
    throw new Error("state contains an invalid maintenance lease expiry");
  }
  return expiresAt <= now ? null : lease;
}

// Cross-run concurrency: only one holder may read-modify-write the checkpoint
// at a time. The persisted lease guards across separate invocations; this file
// lock guards the brief critical section within one.
function withLock(statePath, fn) {
  const lockPath = `${statePath}.lock`;
  mkdirSync(dirname(lockPath), { recursive: true });
  let fd;
  try {
    fd = openSync(lockPath, "wx");
  } catch (error) {
    if (error.code !== "EEXIST") throw error;
    let stale = false;
    try {
      stale = Date.now() - statSync(lockPath).mtimeMs > LOCK_STALE_MS;
    } catch {
      stale = true;
    }
    if (!stale) {
      throw new Error("another bb-history run holds the checkpoint lock");
    }
    rmSync(lockPath, { force: true });
    fd = openSync(lockPath, "wx");
  }
  try {
    return fn();
  } finally {
    closeSync(fd);
    rmSync(lockPath, { force: true });
  }
}

// Refuse to run while an artifact tree has uncommitted work, so a scheduled
// refresh never buries a person's in-progress edits. Generalizes scan-history.py's
// clean-rules guard for any consumer.
export function ensureCleanTree(paths, cwd = process.cwd()) {
  if (!paths || paths.length === 0) return;
  const status = execFileSync(
    "git",
    ["status", "--porcelain=v1", "--untracked-files=all", "--", ...paths],
    { cwd, encoding: "utf8" },
  );
  if (status.trim()) {
    throw new Error(
      `uncommitted work under ${paths.join(", ")}; commit, stash, or move it before scanning`,
    );
  }
}

// ---------------------------------------------------------------------------
// Core scan (pure over rows, so fixtures and SQLite share one path)
// ---------------------------------------------------------------------------

export function buildScan(rows, state, options) {
  const {
    now,
    limit = 200,
    maxBytes = 262_144,
    maxMessageBytes = 8_192,
    leaseSeconds = DEFAULT_LEASE_SECONDS,
    includeRelays = false,
    redact = true,
    kind = "user_message",
    projects = null,
    threads = null,
    since = null,
    until = null,
  } = options;

  const cursor = state.cursor ?? null;
  const selected = selectRows(rows, { kind, cursor, projects, threads, since, until, limit });

  const messages = [];
  let usedBytes = 0;
  let commit = cursor;
  for (const row of selected) {
    const { text: clipped, truncated } = clipUtf8(row.text, maxMessageBytes);
    const clippedBytes = Buffer.byteLength(clipped, "utf8");
    if (usedBytes + clippedBytes > maxBytes) break;
    commit = cursorFromRow(row); // advance the cursor even past skipped relays
    if (!includeRelays && !isDirectFeedback(row.text)) continue;
    usedBytes += clippedBytes;
    const text = redact ? redactText(clipped) : clipped;
    messages.push({
      thread: redact ? stableHash(row.thread_id) : row.thread_id,
      project: redact ? stableHash(row.project_id ?? "") : (row.project_id ?? null),
      title: redact ? redactText(row.title ?? "") : (row.title ?? ""),
      created_at: Number(row.created_at),
      text,
      truncated,
    });
  }

  const advanced = JSON.stringify(commit) !== JSON.stringify(cursor);
  let lease = null;
  const nextState = { ...state, version: 1 };
  delete nextState.lease;
  if (advanced) {
    lease = {
      id: stableHash(`${now}:${hrtimeNow()}:${JSON.stringify(commit)}`),
      acquired_at: now,
      expires_at: now + leaseSeconds,
      cursor_before: cursor,
      cursor_commit: commit,
    };
    nextState.lease = lease;
  }

  return {
    nextState,
    envelope: {
      cursor_before: cursor,
      cursor_commit: commit,
      lease_id: lease ? lease.id : null,
      lease_expires_at: lease ? lease.expires_at : null,
      redacted: redact,
      message_count: messages.length,
      message_bytes: usedBytes,
      messages,
    },
  };
}

export function advanceState(state, { createdAt, segmentId, leaseId, now }) {
  const lease = activeLease(state, now);
  if (!lease) throw new Error("no active checkpoint lease; run scan first");
  if (leaseId !== lease.id) throw new Error("checkpoint lease does not match this run");
  const current = cursorTuple(state.cursor);
  const requested = [Number(createdAt), String(segmentId)];
  if (cursorLessOrEqual(requested, current) && !(requested[0] === current[0] && requested[1] === current[1])) {
    throw new Error("cursor cannot move backward");
  }
  const commit = cursorTuple(lease.cursor_commit);
  if (requested[0] !== commit[0] || requested[1] !== commit[1]) {
    throw new Error("cursor must match the leased scan result");
  }
  const next = { ...state, version: 1, cursor: { created_at: requested[0], segment_id: requested[1] } };
  delete next.lease;
  return next;
}

export function releaseState(state, { leaseId }) {
  const lease = state.lease;
  if (typeof lease !== "object" || lease === null || leaseId !== lease.id) {
    throw new Error("checkpoint lease does not match this run");
  }
  const next = { ...state };
  delete next.lease;
  return next;
}

// ---------------------------------------------------------------------------
// Row sources
// ---------------------------------------------------------------------------

function readFixtureRows(fixturePath) {
  return readFileSync(fixturePath, "utf8")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => JSON.parse(line));
}

function readDatabaseRows(dbPath, { kind, cursor, projects, threads, since, until, limit }) {
  // node:sqlite is experimental on Node 22; silence only that warning so JSON
  // output stays clean, then read strictly read-only.
  const originalEmit = process.emitWarning;
  process.emitWarning = (warning, ...rest) => {
    const message = typeof warning === "string" ? warning : warning?.message;
    if (message && /SQLite is an experimental feature/.test(message)) return undefined;
    return originalEmit.call(process, warning, ...rest);
  };
  let DatabaseSync;
  try {
    ({ DatabaseSync } = require("node:sqlite"));
  } finally {
    process.emitWarning = originalEmit;
  }
  const db = new DatabaseSync(dbPath, { readOnly: true });
  try {
    const after = cursorTuple(cursor);
    const clauses = [
      "s.source_kind = ?",
      "(s.created_at > ? OR (s.created_at = ? AND s.id > ?))",
    ];
    const params = [kind, after[0], after[0], after[1]];
    if (projects && projects.length) {
      clauses.push(`t.project_id IN (${projects.map(() => "?").join(",")})`);
      params.push(...projects);
    }
    if (threads && threads.length) {
      clauses.push(`s.thread_id IN (${threads.map(() => "?").join(",")})`);
      params.push(...threads);
    }
    if (since != null) {
      clauses.push("s.created_at >= ?");
      params.push(since);
    }
    if (until != null) {
      clauses.push("s.created_at <= ?");
      params.push(until);
    }
    const statement = db.prepare(
      `SELECT s.id, s.thread_id, s.source_kind, s.source_key, s.created_at, s.text,
              t.project_id, COALESCE(t.title, t.title_fallback, '') AS title
         FROM thread_search_segments AS s
         JOIN threads AS t ON t.id = s.thread_id
        WHERE ${clauses.join(" AND ")}
        ORDER BY s.created_at, s.id
        LIMIT ?`,
    );
    return statement.all(...params, limit);
  } finally {
    db.close();
  }
}

export function loadRows(options) {
  if (options.fixture) return readFixtureRows(options.fixture);
  return readDatabaseRows(options.db, options);
}

// ---------------------------------------------------------------------------
// CLI
// ---------------------------------------------------------------------------

function parseArgs(argv) {
  const [command, ...rest] = argv;
  const options = { _: [] };
  for (let i = 0; i < rest.length; i += 1) {
    const token = rest[i];
    if (token.startsWith("--")) {
      const key = token.slice(2);
      const next = rest[i + 1];
      if (next === undefined || next.startsWith("--")) {
        options[key] = true;
      } else {
        options[key] = next;
        i += 1;
      }
    } else {
      options._.push(token);
    }
  }
  return { command, options };
}

function list(value) {
  if (value == null) return null;
  return String(value)
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean);
}

function parseTime(value) {
  if (value == null) return null;
  if (/^\d+$/.test(String(value))) return Number(value);
  const parsed = Date.parse(String(value));
  if (Number.isNaN(parsed)) throw new Error(`invalid time value: ${value}`);
  return parsed;
}

function requireState(options) {
  const state = options.state ?? process.env.BB_HISTORY_STATE;
  if (!state) throw new Error("--state <path> is required (the explicit checkpoint file)");
  return resolve(String(state));
}

function runScan(options) {
  const statePath = requireState(options);
  const now = Math.floor(Date.now() / 1000);
  const scanOptions = {
    now,
    limit: options.limit ? Number(options.limit) : 200,
    maxBytes: options["max-bytes"] ? Number(options["max-bytes"]) : 262_144,
    maxMessageBytes: options["max-message-bytes"] ? Number(options["max-message-bytes"]) : 8_192,
    leaseSeconds: options["lease-seconds"] ? Number(options["lease-seconds"]) : DEFAULT_LEASE_SECONDS,
    includeRelays: Boolean(options["include-relays"]),
    redact: !options["no-redact"],
    kind: options.kind ? String(options.kind) : "user_message",
    projects: list(options.project),
    threads: list(options.thread),
    since: parseTime(options.since),
    until: parseTime(options.until),
  };
  const dbPath = options.db ? resolve(expandHome(String(options.db))) : defaultDbPath();
  const fixture = options.fixture ? resolve(String(options.fixture)) : null;

  const requireClean = list(options["require-clean"]);
  const result = withLock(statePath, () => {
    if (requireClean) ensureCleanTree(requireClean);
    const state = readState(statePath);
    if (activeLease(state, now)) {
      throw new Error(`checkpoint lease ${state.lease.id} is active until ${state.lease.expires_at}`);
    }
    // Read rows under the lock, bounded by the checkpoint cursor, so a big
    // database scan never outruns the batch limit and buildScan's re-filter is
    // idempotent. Fixtures return every row; buildScan applies the cursor.
    const rows = loadRows({
      db: dbPath,
      fixture,
      kind: scanOptions.kind,
      cursor: state.cursor ?? null,
      projects: scanOptions.projects,
      threads: scanOptions.threads,
      since: scanOptions.since,
      until: scanOptions.until,
      limit: scanOptions.limit,
    });
    const scan = buildScan(rows, state, scanOptions);
    writeState(statePath, scan.nextState);
    return scan.envelope;
  });

  const format = options.format ? String(options.format) : "json";
  if (format === "jsonl") {
    for (const message of result.messages) process.stdout.write(`${JSON.stringify(message)}\n`);
    const { messages, ...meta } = result;
    process.stderr.write(`${JSON.stringify(meta)}\n`);
  } else {
    process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
  }
  return 0;
}

function runAdvance(options) {
  const statePath = requireState(options);
  const now = Math.floor(Date.now() / 1000);
  const next = withLock(statePath, () => {
    const state = readState(statePath);
    const updated = advanceState(state, {
      createdAt: Number(options["created-at"]),
      segmentId: String(options["segment-id"]),
      leaseId: String(options["lease-id"]),
      now,
    });
    writeState(statePath, updated);
    return updated;
  });
  process.stdout.write(`${JSON.stringify(next.cursor)}\n`);
  return 0;
}

function runRelease(options) {
  const statePath = requireState(options);
  const next = withLock(statePath, () => {
    const state = readState(statePath);
    const updated = releaseState(state, { leaseId: String(options["lease-id"]) });
    writeState(statePath, updated);
    return updated;
  });
  process.stdout.write(`${JSON.stringify({ released: options["lease-id"], cursor: next.cursor })}\n`);
  return 0;
}

export function main(argv) {
  const { command, options } = parseArgs(argv);
  switch (command) {
    case "scan":
      return runScan(options);
    case "advance":
      return runAdvance(options);
    case "release":
      return runRelease(options);
    default:
      process.stderr.write(
        "usage: bb-history <scan|advance|release> --state <path> [filters]\n",
      );
      return command ? 1 : 1;
  }
}

if (resolve(process.argv[1] ?? "") === fileURLToPath(import.meta.url)) {
  try {
    process.exit(main(process.argv.slice(2)));
  } catch (error) {
    process.stderr.write(`bb-history: ${error.message}\n`);
    process.exit(1);
  }
}
