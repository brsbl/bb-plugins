import { mkdir, mkdtemp, realpath, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import type { ExperimentalHostWatchListener } from "@get-bb/plugin-sdk/host";
import { createViewerWatches } from "./viewer-watch.js";

let root: string;

beforeEach(async () => {
  root = await realpath(await mkdtemp(join(tmpdir(), "moss-viewer-watch-")));
});

afterEach(async () => {
  vi.useRealTimers();
  await rm(root, { recursive: true, force: true });
});

function fakeContext() {
  const listeners: ExperimentalHostWatchListener[] = [];
  const roots: { rootPath: string; ignoredPaths?: readonly string[] }[] = [];
  const signals: unknown[] = [];
  const disposed = vi.fn(async () => undefined);
  const context = {
    experimental_watch: vi.fn(async (options: { rootPath: string; ignoredPaths?: readonly string[] }, listener: ExperimentalHostWatchListener) => {
      roots.push(options);
      listeners.push(listener);
      return { dispose: disposed };
    }),
    experimental_emitSignal: vi.fn(async (name: string, payload: unknown) => {
      signals.push({ name, payload });
    }),
  };
  return { context: context as never, listeners, roots, signals, disposed };
}

it("watches the note's own folder and signals when the note or its layout changes", async () => {
  const folder = join(root, "Plan");
  await mkdir(join(folder, "assets"), { recursive: true });
  const note = join(folder, "Plan.md");
  await writeFile(note, "# Plan\n");
  const watches = createViewerWatches();
  const fake = fakeContext();

  const { version } = await watches.watchNote({ path: note }, fake.context);
  expect(fake.roots).toEqual([{ rootPath: folder, ignoredPaths: ["assets"], debounceMs: 200 }]);

  // A change elsewhere in the folder is not the note's.
  await writeFile(join(folder, "other.md"), "x");
  await fake.listeners[0]!({ kind: "changed", changes: [{ path: join(folder, "other.md"), type: "create" }] });
  expect(fake.signals).toEqual([]);

  await writeFile(note, "# Plan\n\nMore.\n");
  await fake.listeners[0]!({ kind: "changed", changes: [{ path: note, type: "update" }] });
  expect(fake.signals).toHaveLength(1);
  const changed = (fake.signals[0] as { payload: { version: string } }).payload.version;
  expect(changed).not.toBe(version);
  expect(fake.signals[0]).toEqual({ name: "viewerNoteChanged", payload: { path: note, version: changed } });

  await writeFile(join(folder, "layout.json"), "{}");
  await fake.listeners[0]!({ kind: "changed", changes: [{ path: join(folder, "layout.json"), type: "create" }] });
  expect(fake.signals).toHaveLength(2);

  // A renewal reuses the watch and reports the current version.
  expect(await watches.watchNote({ path: note }, fake.context)).toEqual({ version: (fake.signals[1] as { payload: { version: string } }).payload.version });
  expect(fake.roots).toHaveLength(1);
  await watches.dispose();
  expect(fake.disposed).toHaveBeenCalledOnce();
});

it("ends a watch the panel stops renewing", async () => {
  vi.useFakeTimers({ toFake: ["setTimeout", "clearTimeout"] });
  const note = join(root, "Plan.md");
  await writeFile(note, "# Plan\n");
  const watches = createViewerWatches();
  const fake = fakeContext();
  await watches.watchNote({ path: note }, fake.context);
  await vi.advanceTimersByTimeAsync(60_000);
  expect(fake.disposed).toHaveBeenCalledOnce();
});
