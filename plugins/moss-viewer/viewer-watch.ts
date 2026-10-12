// The viewer's live reload: while a panel shows a note read-only, the host
// watches the note's folder and signals when the note or its layout changes on
// disk. The panel renews the watch as a lease, and each renewal also reports
// the current version, which catches a missed signal.
import { readdir } from "node:fs/promises";
import { dirname, join } from "node:path";
import type { ExperimentalHostRpcContext, ExperimentalHostWatchSubscription } from "@get-bb/plugin-sdk/host";
import type { hostSignals } from "./contract.js";
import { HostFileError, canonicalFile, noteVersion, readNote } from "./host-notes.js";

/** A watch the panel stops renewing ends after this long. */
export const VIEWER_WATCH_LEASE_MS = 60_000;
/** The most notes a host watches at once; a new one past this ends the watch renewed longest ago. */
export const MAX_VIEWER_WATCHES = 32;
/** Subfolders skipped by name, so the native watcher never descends into them. */
const MAX_IGNORED_FOLDERS = 500;
/** Every path below a subfolder, including subfolders made after the watch started or past MAX_IGNORED_FOLDERS. */
const BELOW_SUBFOLDERS = "*/**";

type HostContext = ExperimentalHostRpcContext<typeof hostSignals>;

interface ViewerWatch {
  path: string;
  file: string;
  version: string;
  context: HostContext;
  renewedAt: number;
  subscription: Promise<ExperimentalHostWatchSubscription> | null;
  expiry: ReturnType<typeof setTimeout> | undefined;
}

/** What a note's watch skips: everything below its folder, so a note at the top of a large tree watches only its own files. */
async function ignoredBelow(directory: string): Promise<string[]> {
  const entries = await readdir(directory, { withFileTypes: true }).catch(() => []);
  const folders = entries
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .slice(0, MAX_IGNORED_FOLDERS);
  return [...folders, BELOW_SUBFOLDERS];
}

/** Only a Moss note may be watched: the same test that decides the viewer shows it. */
async function mossNote(path: string): Promise<void> {
  const note = await readNote({ path });
  if (!note.moss) throw new HostFileError("not_allowed", "Only Moss notes can be watched.");
}

export function createViewerWatches({ isMossNote = mossNote }: { isMossNote?: (path: string) => Promise<void> } = {}) {
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
    // The note and its layout, by full path; temp files, assets, comments and anything else in the folder are not.
    const paths = new Set([watch.file, join(directory, "layout.json")]);
    const subscription = watch.context.experimental_watch(
      { rootPath: directory, ignoredPaths: await ignoredBelow(directory), debounceMs: 200 },
      (event) => {
        if (event.kind === "watch-error") return;
        if (event.kind === "changed" && !event.changes.some((change) => paths.has(change.path))) return;
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
        await isMossNote(file);
        if (watches.size >= MAX_VIEWER_WATCHES) {
          const oldest = [...watches.values()].reduce((a, b) => (b.renewedAt < a.renewedAt ? b : a));
          void stop(oldest);
        }
        watch = { path, file, version: await noteVersion(file), context, renewedAt: Date.now(), subscription: null, expiry: undefined };
        watches.set(file, watch);
        await start(watch);
      } else {
        watch.path = path;
        watch.context = context;
        watch.renewedAt = Date.now();
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
