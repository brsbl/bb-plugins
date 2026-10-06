import { useCallback, useEffect, useMemo, useRef, useState, type ComponentType, type ReactNode } from "react";
import {
  definePluginApp,
  experimental_Icon as Icon,
  experimental_useCodeTheme as useCodeTheme,
  useBbNavigate,
  useRealtime,
  useRealtimeConnectionState,
  useRpc,
  type PluginFileOpenerProps,
} from "@get-bb/plugin-sdk/app";
import { toast } from "sonner";
import type { MossNoteEntry, ReadResult, rpcContract } from "./contract";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "./components/ui/tooltip";
import { EDITOR_NOTE_CHANGED, asNoteChanged, createEditorBridge, fromFrame, type EditorBridge, type EditorBridgeOptions } from "./editor-bridge";
import { EditorStatus, MossEditorFrame, type EditorNote } from "./editor-panel";
import type * as Moss from "./vendor/moss-editor.contract.js";
import { formatHomePathForDisplay } from "./lib/utils";
import {
  assetHref,
  frameSource,
  frameViewer,
  routeFrameLinks,
  safeExternalUrl,
  setFrameTheme,
  type MossViewerHandle,
  type MossViewerNote,
  type MossViewerTarget,
  type MossViewerTheme,
} from "./viewer-frame";

type MossNote = Extract<ReadResult, { moss: true }>;
type ReadInput = {
  kind: "host" | "workspace";
  path: string;
  hostId: string | null;
  environmentId: string | null;
};

const NOTES_TTL_MS = 30_000;
/** Show the frame even if moss never reports ready, rather than leaving the tab blank. */
const READY_TIMEOUT_MS = 5_000;

function messageOf(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

function noteTitle(path: string): string {
  return (path.split("/").at(-1) ?? path).replace(/\.(?:md|markdown)$/i, "");
}

/** One note on one host, so state for a note never follows the tab to another. */
function noteKey(note: MossNote): string {
  return `${note.hostId}\0${note.path}`;
}

/** What bb kept for the note open in the editor, by `noteKey`. */
interface Kept {
  key: string;
  receipt: Moss.MossDraft | null;
  receiptVersion: string | null;
  draft: Moss.MossDraft | null;
}

function HeaderButton({
  icon,
  label,
  disabled = false,
  onClick,
}: {
  icon: string;
  label: string;
  disabled?: boolean;
  onClick: () => void;
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          aria-label={label}
          disabled={disabled}
          onClick={onClick}
          className="inline-flex size-5 shrink-0 cursor-pointer items-center justify-center rounded-md text-muted-foreground hover:bg-state-hover hover:text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-default disabled:opacity-50 max-md:pointer-coarse:size-9"
        >
          <Icon name={icon} fallback="MoreHorizontal" aria-hidden className="size-3 max-md:pointer-coarse:size-5" />
        </button>
      </TooltipTrigger>
      <TooltipContent side="bottom">{label}</TooltipContent>
    </Tooltip>
  );
}

function NoteHeader({
  path,
  canGoBack,
  refreshing,
  status,
  onBack,
  onRefresh,
  onRestore,
  onOpenInMoss,
}: {
  path: string;
  canGoBack: boolean;
  refreshing: boolean;
  /** The editor's save state; the editor refreshes itself, so it has no Refresh button. */
  status: ReactNode;
  onBack: () => void;
  onRefresh: (() => void) | null;
  onRestore: (() => void) | null;
  onOpenInMoss: () => void;
}) {
  const copyPath = () => {
    void navigator.clipboard.writeText(path).then(
      () => toast.success("File path copied"),
      () => toast.error("Failed to copy file path"),
    );
  };
  return (
    <TooltipProvider delayDuration={300}>
      <div className="flex h-9 shrink-0 items-center gap-1.5 bg-surface-raised px-4">
        {canGoBack ? <HeaderButton icon="ChevronLeft" label="Back" onClick={onBack} /> : null}
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              type="button"
              aria-label="Copy file path"
              onClick={copyPath}
              className="min-w-0 cursor-pointer rounded-sm text-left font-mono text-xs font-medium leading-5 text-file-accent underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring max-md:pointer-coarse:text-sm"
            >
              <span dir="rtl" className="block w-min max-w-full truncate">
                {`‎${formatHomePathForDisplay(path)}`}
              </span>
            </button>
          </TooltipTrigger>
          <TooltipContent side="bottom">Copy file path</TooltipContent>
        </Tooltip>
        {status}
        {onRestore ? <HeaderButton icon="ArrowTurnBackward" label="Restore your last save from bb" onClick={onRestore} /> : null}
        {onRefresh ? (
          <HeaderButton
            icon="RotateCcw"
            label={refreshing ? "Refreshing note" : "Refresh note"}
            disabled={refreshing}
            onClick={onRefresh}
          />
        ) : null}
        <HeaderButton icon="ExternalLink" label="Open in Moss" onClick={onOpenInMoss} />
      </div>
    </TooltipProvider>
  );
}

interface FrameProps {
  note: MossNote;
  theme: MossViewerTheme;
  notesFor: (hostId: string) => Promise<MossNoteEntry[]>;
  onNavigate: (note: MossNote, target: MossViewerTarget) => void;
  openUrl: (url: string) => void;
  onUnavailable: () => void;
}

/** moss-multi's viewer, mounted in its own document so moss's page-wide stylesheet stays inside it. */
function MossViewerFrame(props: FrameProps) {
  const { note, theme } = props;
  const frameRef = useRef<HTMLIFrameElement>(null);
  const latest = useRef(props);
  latest.current = props;
  const themeRef = useRef(theme);
  const handleRef = useRef<MossViewerHandle | null>(null);
  const [initialTheme] = useState(theme);
  const [loads, setLoads] = useState(0);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const frame = frameRef.current;
    if (loads === 0 || !frame) return;
    const viewer = frameViewer(frame);
    const element = frame.contentDocument?.getElementById("moss-viewer");
    if (!viewer || !element) {
      console.error("[moss-viewer] the viewer bundle did not load in its frame");
      latest.current.onUnavailable();
      return;
    }
    let handle: MossViewerHandle;
    try {
      handle = viewer.mountMossViewer(element, {
        markdown: note.markdown,
        layout: note.layout ?? undefined,
        theme: themeRef.current,
        ...(note.noteId ? { noteId: note.noteId } : {}),
        services: {
          assetUrl: (ref) => assetHref(note.assetRoute, note.hostId, note.path, ref),
          notes: () =>
            latest.current.notesFor(note.hostId).then((entries): MossViewerNote[] =>
              entries.map(({ id, title, folderPath, updatedAt }) => ({
                id,
                title,
                folderPath,
                ...(updatedAt === undefined ? {} : { updatedAt }),
              })),
            ),
          navigate: (target) => latest.current.onNavigate(note, target),
          unfurl: () => Promise.resolve(null),
          htmlFrameUrl: note.htmlFrameUrl,
        },
      });
    } catch (error) {
      console.error("[moss-viewer] could not render this note", error);
      latest.current.onUnavailable();
      return;
    }
    handleRef.current = handle;
    let live = true;
    const reveal = () => {
      if (live) setShown(true);
    };
    const timeout = window.setTimeout(reveal, READY_TIMEOUT_MS);
    void handle.ready.then(reveal);
    return () => {
      live = false;
      window.clearTimeout(timeout);
      handleRef.current = null;
      handle.unmount();
    };
  }, [loads, note]);

  useEffect(() => {
    themeRef.current = theme;
    const frame = frameRef.current;
    if (frame && loads > 0) setFrameTheme(frame, theme);
    handleRef.current?.setTheme(theme);
  }, [theme, loads]);

  useEffect(() => {
    const frame = frameRef.current;
    if (loads === 0 || !frame) return;
    return routeFrameLinks(frame, (url) => latest.current.openUrl(url));
  }, [loads]);

  return (
    <>
      {shown ? null : (
        <span role="status" className="sr-only">
          Loading note…
        </span>
      )}
      <iframe
        ref={frameRef}
        title={noteTitle(note.path)}
        src={frameSource(note.frameUrl, initialTheme)}
        sandbox="allow-scripts allow-same-origin allow-popups allow-popups-to-escape-sandbox"
        className={shown ? "block size-full border-0" : "invisible block size-full border-0"}
        onLoad={() => setLoads((count) => count + 1)}
      />
    </>
  );
}

function MossNoteTab(props: { initial: ReadInput; Original: ComponentType }) {
  const { Original } = props;
  // The parent keys this tab by its file, so the first request is the file for its lifetime.
  const [initial] = useState(props.initial);
  const rpc = useRpc<typeof rpcContract>();
  const rpcRef = useRef(rpc);
  rpcRef.current = rpc;
  const bbNavigate = useBbNavigate();
  const navigateRef = useRef(bbNavigate);
  navigateRef.current = bbNavigate;
  const theme = useCodeTheme().mode;
  const notesCache = useRef(new Map<string, { at: number; notes: Promise<MossNoteEntry[]> }>());
  const [stack, setStack] = useState<{ note: MossNote | null; back: MossNote[] }>({ note: null, back: [] });
  const [original, setOriginal] = useState(false);
  const [missing, setMissing] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const reads = useRef(0);
  // Notes that opened in the viewer after the editor could not take them.
  const [viewerOnly, setViewerOnly] = useState<ReadonlySet<string>>(() => new Set());
  const [kept, setKept] = useState<Kept | null>(null);
  const [editorState, setEditorState] = useState<{ status: Moss.MossEditorStatus | null; version: string | null }>({
    status: null,
    version: null,
  });
  // A restore remounts the editor with the receipt as its edits.
  const [mount, setMount] = useState<{ count: number; restore: Moss.MossDraft | null }>({ count: 0, restore: null });

  // One bridge per host serves every editor this tab opens on it.
  const bridges = useRef(new Map<string, EditorBridge>());
  const bridgeRpc = useMemo<EditorBridgeOptions["rpc"]>(
    () => ({
      call: ((...args: unknown[]) =>
        (rpcRef.current as unknown as { call(...rest: unknown[]): Promise<unknown> }).call(...args)) as unknown as EditorBridgeOptions["rpc"]["call"],
    }),
    [],
  );
  const bridgeFor = useCallback(
    (note: MossNote) => {
      let bridge = bridges.current.get(note.hostId);
      if (bridge === undefined) {
        bridge = createEditorBridge({ rpc: bridgeRpc, hostId: note.hostId, assetRoute: note.assetRoute });
        bridges.current.set(note.hostId, bridge);
      }
      return bridge;
    },
    [bridgeRpc],
  );
  useRealtime(EDITOR_NOTE_CHANGED, (payload) => {
    const change = asNoteChanged(payload);
    if (change) bridges.current.get(change.hostId)?.deliver(change);
  });
  // A change missed while the panel was away or offline shows once it is back.
  const connection = useRealtimeConnectionState();
  useEffect(() => {
    const refresh = () => {
      for (const bridge of bridges.current.values()) bridge.refresh();
    };
    if (connection === "connected") refresh();
    window.addEventListener("focus", refresh);
    return () => window.removeEventListener("focus", refresh);
  }, [connection]);

  useEffect(() => {
    const read = (reads.current += 1);
    rpcRef.current.call("read", initial).then(
      (result) => {
        if (read !== reads.current) return;
        if (result.moss) setStack({ note: result, back: [] });
        else if (result.message !== null) setMissing(result.message);
        else setOriginal(true);
      },
      () => {
        // bb's own preview reports a missing file or an offline host.
        if (read === reads.current) setOriginal(true);
      },
    );
  }, [initial]);

  const notesFor = useCallback((hostId: string) => {
    const cached = notesCache.current.get(hostId);
    if (cached && Date.now() - cached.at < NOTES_TTL_MS) return cached.notes;
    const notes = rpcRef.current.call("notes", { hostId }).then((result) => result.notes);
    notes.catch(() => notesCache.current.delete(hostId));
    notesCache.current.set(hostId, { at: Date.now(), notes });
    return notes;
  }, []);

  const openUrl = useCallback((url: string) => {
    const safe = safeExternalUrl(url);
    if (safe !== null && !navigateRef.current.openUrl(safe)) window.open(safe, "_blank", "noopener,noreferrer");
  }, []);

  const readNote = useCallback(async (hostId: string, path: string): Promise<MossNote | null> => {
    const read = (reads.current += 1);
    const result = await rpcRef.current.call("read", { kind: "host", path, hostId, environmentId: null });
    if (read !== reads.current) return null;
    if (!result.moss) throw new Error(result.message ?? `${formatHomePathForDisplay(path)} is not a Moss note.`);
    return result;
  }, []);

  const onNavigate = useCallback(
    (from: MossNote, target: MossViewerTarget) => {
      if (target.kind === "url") {
        openUrl(target.url);
        return;
      }
      void (async () => {
        const entry = (await notesFor(from.hostId)).find((note) => note.id === target.noteId);
        if (!entry) throw new Error("That note is not in ~/Moss/Notes.");
        if (entry.path === from.path) return;
        const next = await readNote(from.hostId, entry.path);
        if (next) setStack((current) => ({ note: next, back: current.note ? [...current.back, current.note] : current.back }));
      })().catch((error: unknown) => toast.error(`Couldn't open that note: ${messageOf(error)}`));
    },
    [notesFor, openUrl, readNote],
  );

  const note = stack.note;
  const key = note === null ? null : noteKey(note);
  const editorNote = note !== null && note.editor !== null && !viewerOnly.has(key!) ? (note as EditorNote) : null;
  const editorKey = editorNote === null ? null : key;

  // What bb kept for the note: its last save receipt, and a draft an earlier close could not save.
  useEffect(() => {
    if (editorNote === null || editorKey === null) return;
    let live = true;
    setEditorState({ status: null, version: null });
    rpcRef.current.call("editorKept", { hostId: editorNote.hostId, noteId: editorNote.editor.noteId }).then(
      (result) => {
        if (!live) return;
        setKept({ key: editorKey, ...result });
        setMount((current) => ({ count: current.count + 1, restore: result.draft }));
      },
      () => {
        if (!live) return;
        setKept({ key: editorKey, receipt: null, receiptVersion: null, draft: null });
        setMount((current) => ({ count: current.count + 1, restore: null }));
      },
    );
    return () => {
      live = false;
    };
    // The note's key names it; a new read of the same note keeps its editor.
  }, [editorKey]);

  if (original) return <Original />;
  if (missing !== null) {
    return (
      <div role="alert" className="mx-4 mt-4 rounded-lg border border-dashed border-border px-3 py-6 text-center text-sm text-muted-foreground">
        {missing}
      </div>
    );
  }
  if (note === null) {
    return (
      <span role="status" className="sr-only">
        Loading note…
      </span>
    );
  }

  const refresh = () => {
    setRefreshing(true);
    readNote(note.hostId, note.path)
      .then((next) => {
        if (next) setStack((current) => ({ ...current, note: next }));
      })
      .catch((error: unknown) => toast.error(`Couldn't refresh this note: ${messageOf(error)}`))
      .finally(() => setRefreshing(false));
  };

  const back = () =>
    setStack((current) =>
      current.back.length === 0
        ? current
        : { note: current.back[current.back.length - 1]!, back: current.back.slice(0, -1) },
    );

  const keep = (target: EditorNote, kind: "receipt" | "draft", draft: Moss.MossDraft, version: string | null) =>
    rpcRef.current
      .call("editorKeep", { hostId: target.hostId, noteId: target.editor.noteId, kind, draft: fromFrame(draft), version })
      .then(() => undefined);

  const editorFor = (target: EditorNote, targetKey: string) => (
    <MossEditorFrame
      key={`${targetKey}\0${mount.count}`}
      note={target}
      title={noteTitle(target.path)}
      theme={theme}
      bridge={bridgeFor(target)}
      restoreDraft={mount.restore}
      notesFor={notesFor}
      onNavigate={onNavigate}
      openUrl={openUrl}
      onStatus={(status) => setEditorState((current) => ({ ...current, status }))}
      onVersion={(version) => setEditorState((current) => ({ ...current, version }))}
      onRestoreSettled={() => {
        // Only now can the kept draft go: until it saves or the user settles its conflict, a reload would lose it.
        if (kept?.key !== targetKey || kept.draft === null || mount.restore !== kept.draft) return;
        setKept({ ...kept, draft: null });
        void rpcRef.current.call("editorForget", { hostId: target.hostId, noteId: target.editor.noteId, kind: "draft" }).catch(() => undefined);
      }}
      onSaved={(saved, version) => {
        // The receipt may be restored after the frame that made it is gone.
        const receipt = fromFrame(saved);
        setKept((current) => (current?.key === targetKey ? { ...current, receipt, receiptVersion: version } : current));
        keep(target, "receipt", receipt, version).catch((error: unknown) => console.warn("[moss-editor] could not keep this save's receipt", error));
      }}
      onUnsaved={(draft) => keep(target, "draft", draft, null)}
      onUnavailable={() => setViewerOnly((current) => new Set(current).add(targetKey))}
    />
  );

  // The receipt of bb's last save, offered when Moss has since replaced it.
  const restorable =
    editorNote !== null &&
    kept?.key === key &&
    kept.receipt !== null &&
    kept.receiptVersion !== null &&
    editorState.status === "clean" &&
    editorState.version !== null &&
    editorState.version !== kept.receiptVersion;
  const restoreLastSave = () => {
    if (kept?.receipt) setMount((current) => ({ count: current.count + 1, restore: kept.receipt }));
  };

  const openInMoss = () => {
    rpcRef.current
      .call("openInMoss", { hostId: note.hostId, path: note.path })
      .catch((error: unknown) => toast.error(`Couldn't open in Moss: ${messageOf(error)}`));
  };

  return (
    <div className="flex h-full min-h-0 flex-1 flex-col">
      <NoteHeader
        path={note.path}
        canGoBack={stack.back.length > 0}
        refreshing={refreshing}
        status={editorNote ? <EditorStatus status={editorState.status} /> : null}
        onBack={back}
        onRefresh={editorNote ? null : refresh}
        onRestore={restorable ? restoreLastSave : null}
        onOpenInMoss={openInMoss}
      />
      <div className="relative min-h-0 flex-1">
        {editorNote === null ? (
          <MossViewerFrame
            note={note}
            theme={theme}
            notesFor={notesFor}
            onNavigate={onNavigate}
            openUrl={openUrl}
            onUnavailable={() => setOriginal(true)}
          />
        ) : kept?.key === editorKey ? (
          editorFor(editorNote, editorKey!)
        ) : (
          <span role="status" className="sr-only">
            Loading note…
          </span>
        )}
      </div>
    </div>
  );
}

function MossNoteOpener({ path, source, Original }: PluginFileOpenerProps) {
  // Thread-storage files are agent scratch output, not notes; bb's preview keeps them.
  if (source.kind !== "host" && source.kind !== "workspace") return <Original />;
  const initial: ReadInput = {
    kind: source.kind,
    path,
    hostId: source.experimental_hostId ?? null,
    environmentId: source.environmentId,
  };
  return <MossNoteTab key={JSON.stringify(initial)} initial={initial} Original={Original} />;
}

export default definePluginApp((app) => {
  app.slots.fileOpener({
    id: "moss-note",
    title: "Moss viewer",
    extensions: ["md", "markdown"],
    component: MossNoteOpener,
  });
});
