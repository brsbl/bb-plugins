// The viewer's live reload: while a panel shows a note read-only, the host
// watches the note's folder and signals when the note or its layout changes on
// disk. The panel renews the watch as a lease, and each renewal also reports
// the current version, which catches a missed signal.
import { readdir } from "node:fs/promises";
import { basename, dirname } from "node:path";
import type { ExperimentalHostRpcContext, ExperimentalHostWatchSubscription } from "@get-bb/plugin-sdk/host";
import type { hostSignals } from "./contract.js";
import { canonicalFile, noteVersion } from "./host-notes.js";

/** A watch the panel stops renewing ends after this long. */
export const VIEWER_WATCH_LEASE_MS = 60_000;
/** Subfolders a note's folder may have before its watch skips them; past this, they are watched too. */
const MAX_IGNORED_FOLDERS = 500;

type HostContext = ExperimentalHostRpcContext<typeof hostSignals>;

interface ViewerWatch {
  path: string;
  file: string;
  version: string;
  context: HostContext;
  subscription: Promise<ExperimentalHostWatchSubscription> | null;
  expiry: ReturnType<typeof setTimeout> | undefined;
}

/** The note's subfolders, so a note at the top of a large tree watches only its own folder. */
async function subfolders(directory: string): Promise<string[]> {
  const entries = await readdir(directory, { withFileTypes: true }).catch(() => []);
  return entries
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .slice(0, MAX_IGNORED_FOLDERS);
}

export function createViewerWatches() {
  const watches = new Map<string, ViewerWatch>();

  async function stop(watch: ViewerWatch): Promise<void> {
    clearTimeout(watch.expiry);
    if (watches.get(watch.file) === watch) watches.delete(watch.file);
    const subscription = watch.subscription;
    watch.subscription = null;
    await subscription?.then((handle) => handle.dispose()).catch(() => undefined);
  }

  async function changed(watch: ViewerWatch): Promise<void> {
    if (watches.get(watch.file) !== watch) return;
    const version = await noteVersion(watch.file);
    if (version === watch.version) return;
    watch.version = version;
    await watch.context.experimental_emitSignal("viewerNoteChanged", { path: watch.path, version }).catch(() => undefined);
  }

  async function start(watch: ViewerWatch): Promise<void> {
    const directory = dirname(watch.file);
    const names = new Set([basename(watch.file), "layout.json"]);
    const subscription = watch.context.experimental_watch(
      { rootPath: directory, ignoredPaths: await subfolders(directory), debounceMs: 200 },
      (event) => {
        if (event.kind === "changed" && !event.changes.some((change) => names.has(basename(change.path)))) return;
        return changed(watch);
      },
    );
    watch.subscription = subscription;
    subscription.catch(() => {
      // The watch could not start; renewals still report the note's version.
      if (watch.subscription === subscription) watch.subscription = null;
    });
  }

  return {
    async watchNote({ path }: { path: string }, context: HostContext): Promise<{ version: string }> {
      const file = (await canonicalFile(path)).path;
      let watch = watches.get(file);
      if (watch === undefined) {
        watch = { path, file, version: await noteVersion(file), context, subscription: null, expiry: undefined };
        watches.set(file, watch);
        await start(watch);
      } else {
        watch.path = path;
        watch.context = context;
        watch.version = await noteVersion(file);
      }
      const renewed = watch;
      clearTimeout(renewed.expiry);
      renewed.expiry = setTimeout(() => void stop(renewed), VIEWER_WATCH_LEASE_MS);
      return { version: renewed.version };
    },
    async dispose(): Promise<void> {
      await Promise.all([...watches.values()].map(stop));
    },
  };
}
