import { mkdtemp, readdir, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { github, row, snapshot } from "./fixtures.js";
import { createSnapshotStore, type SnapshotStore } from "./store.js";
import type { Sources } from "./update.js";
import { createUpdater, NO_TABLE } from "./updater.js";

let dir: string;
let store: SnapshotStore;
const log = { info: vi.fn(), warn: vi.fn() };
const NOW = new Date("2026-01-04T06:00:00.000Z");
const sources = (): Sources => ({
  github: github({ "https://github.com/example/app/issues/1": ["Issue 1", "2026-01-03", "open", "i", "octocat"] }),
  discord: null,
  census: null,
});

beforeEach(async () => {
  dir = await mkdtemp(join(tmpdir(), "companies-using-bb-"));
  store = createSnapshotStore(() => dir);
});
afterEach(async () => { await rm(dir, { recursive: true, force: true }); });

function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (error: unknown) => void;
  const promise = new Promise<T>((yes, no) => { resolve = yes; reject = no; });
  return { promise, resolve, reject };
}

describe("updater", () => {
  it("saves the new table when an update succeeds", async () => {
    await store.write(snapshot());
    const onChange = vi.fn();
    const updater = createUpdater({ store, loadSources: async () => sources(), onChange, log, signal: new AbortController().signal, now: () => NOW });
    await updater.run();
    expect(updater.status()).toEqual({ state: "idle", lastAttemptAt: NOW.toISOString() });
    const saved = await store.read();
    expect(saved?.updatedAt).toBe(NOW.toISOString());
    expect(saved?.rows[0]).toMatchObject({ iss: 1 });
    expect(onChange).toHaveBeenCalledTimes(2);
  });

  it("keeps the saved table when an update fails", async () => {
    const before = snapshot([row({ iss: 4 })]);
    await store.write(before);
    const updater = createUpdater({
      store, onChange: () => {}, log, signal: new AbortController().signal, now: () => NOW,
      loadSources: async () => { throw new Error("GitHub request failed (repos/example/app/issues): HTTP 502"); },
    });
    await updater.run();
    expect(updater.status()).toEqual({ state: "failed", lastAttemptAt: NOW.toISOString(), error: "GitHub request failed (repos/example/app/issues): HTTP 502" });
    expect(await store.read()).toEqual(before);
    expect(await readdir(dir)).toEqual(["snapshot.json"]);
  });

  it("doesn't start a second update while one is running", async () => {
    await store.write(snapshot());
    const pending = deferred<Sources>();
    const loadSources = vi.fn(() => pending.promise);
    const updater = createUpdater({ store, loadSources, onChange: () => {}, log, signal: new AbortController().signal, now: () => NOW });
    const first = updater.run();
    expect(updater.status()).toMatchObject({ state: "updating", startedAt: NOW.toISOString() });
    await vi.waitFor(() => expect(loadSources).toHaveBeenCalledTimes(1));
    const second = updater.run();
    expect(second).toBe(first);
    expect(updater.status().state).toBe("updating");
    expect(loadSources).toHaveBeenCalledTimes(1);
    // The saved table stays readable throughout the update.
    expect((await store.read())?.updatedAt).toBe("2026-01-02T06:00:00.000Z");
    pending.resolve(sources());
    await first;
    expect(updater.status().state).toBe("idle");
    await updater.run();
    expect(loadSources).toHaveBeenCalledTimes(2);
  });

  it("clears a previous failure while retrying", async () => {
    await store.write(snapshot());
    let fail = true;
    const updater = createUpdater({
      store, onChange: () => {}, log, signal: new AbortController().signal, now: () => NOW,
      loadSources: async () => { if (fail) throw new Error("offline"); return sources(); },
    });
    await updater.run();
    expect(updater.status().state).toBe("failed");
    fail = false;
    const retry = updater.run();
    expect(updater.status()).toEqual({ state: "updating", startedAt: NOW.toISOString(), lastAttemptAt: NOW.toISOString() });
    await retry;
    expect(updater.status().state).toBe("idle");
  });

  it("fails with a hint when nothing has been imported", async () => {
    const updater = createUpdater({ store, loadSources: async () => sources(), onChange: () => {}, log, signal: new AbortController().signal });
    await updater.run();
    expect(updater.status()).toMatchObject({ state: "failed", error: NO_TABLE });
    expect(await store.read()).toBeNull();
  });

  it("drops a failure once a table is imported", async () => {
    const updater = createUpdater({ store, loadSources: async () => sources(), onChange: () => {}, log, signal: new AbortController().signal });
    await updater.run();
    expect(updater.status().state).toBe("failed");
    updater.clearFailure();
    expect(updater.status().state).toBe("idle");
  });
});
