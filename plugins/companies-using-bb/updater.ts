import type { Snapshot, Status } from "./model.js";
import type { SnapshotStore } from "./store.js";
import { buildSnapshot, type Sources } from "./update.js";

export interface UpdaterOptions {
  store: SnapshotStore;
  /** Reads every source. Throws only when the update can't go ahead (GitHub failed). */
  loadSources(previous: Snapshot, signal: AbortSignal): Promise<Sources>;
  /** Called whenever the status or the saved table changes. */
  onChange(): void;
  log: { info(message: string): void; warn(message: string): void };
  signal: AbortSignal;
  now?: () => Date;
}

export const NO_TABLE = "There's no saved table yet. Import one with `bb companies-using-bb import <file>`.";

/** Runs one update at a time. The saved table changes only when a whole update succeeds. */
export function createUpdater(options: UpdaterOptions) {
  const now = options.now ?? (() => new Date());
  let status: Status = { state: "idle" };
  let running: Promise<void> | null = null;

  const set = (next: Status) => { status = next; options.onChange(); };

  async function update(startedAt: string) {
    try {
      const previous = await options.store.read();
      if (!previous) throw new Error(NO_TABLE);
      const sources = await options.loadSources(previous, options.signal);
      options.signal.throwIfAborted();
      const next = buildSnapshot(previous, sources, now());
      await options.store.write(next);
      options.log.info(`Updated: ${next.rows.length} companies, ${next.rows.reduce((sum, row) => sum + row.n, 0)} users.`);
      set({ state: "idle", lastAttemptAt: startedAt });
    } catch (error) {
      const reason = error instanceof Error ? error.message : String(error);
      options.log.warn(`Update failed: ${reason}`);
      set({ state: "failed", lastAttemptAt: startedAt, error: reason });
    }
  }

  return {
    status: (): Status => status,
    /** Drops a failure once a new table is imported, so its banner doesn't sit over data it no longer describes. */
    clearFailure(): void {
      if (status.state === "failed") set({ state: "idle", ...(status.lastAttemptAt ? { lastAttemptAt: status.lastAttemptAt } : {}) });
    },
    /** Starts an update unless one is running; resolves when that update ends. Never rejects. */
    run(): Promise<void> {
      if (running) return running;
      const startedAt = now().toISOString();
      set({ state: "updating", startedAt, ...(status.lastAttemptAt ? { lastAttemptAt: status.lastAttemptAt } : {}) });
      running = update(startedAt).finally(() => { running = null; });
      return running;
    },
  };
}

export type Updater = ReturnType<typeof createUpdater>;
