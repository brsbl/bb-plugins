import { useCallback, useEffect, useMemo, useRef, useState, type ComponentType, type ReactNode } from "react";
import {
  definePluginApp,
  experimental_Icon as Icon,
  experimental_useCodeTheme as useCodeTheme,
  useBbNavigate,
  useComposer,
  useRealtime,
  useRealtimeConnectionState,
  useRpc,
  type PluginFileOpenerProps,
} from "@get-bb/plugin-sdk/app";
import { toast } from "sonner";
import type { MossNoteEntry, ReadResult, rpcContract } from "./contract";
import { SHARE_PROVIDER, shareLabel, sharedSelection } from "./share";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "./components/ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./components/ui/dropdown-menu";
import { EDITOR_NOTE_CHANGED, asNoteChanged, createEditorBridge, fromFrame, type EditorBridge, type EditorBridgeOptions } from "./editor-bridge";
import { EditorStatus, MossEditorFrame, type EditorNote } from "./editor-panel";
import type * as Moss from "./vendor/moss-editor.contract.js";
import { COARSE_POINTER_HEADER_ICON_BUTTON_CLASS } from "./components/ui/coarse-pointer-sizing";
import { cn, formatHomePathForDisplay } from "./lib/utils";
import {
  assetHref,
  frameSource,
  frameViewer,
  VIEWER_NOTE_CHANGED,
  asViewerNoteChanged,
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
/** Well inside the host's 60s watch lease, so a watch outlives a missed renewal. */
const VIEWER_WATCH_RENEW_MS = 20_000;
/** How long a note on disk must stay still before the viewer reads it again. */
const RELOAD_QUIET_MS = 750;
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

// bb's header icon button (28px, 16px glyph), the size its roomier panel and thread headers use.
const HEADER_ICON_BUTTON_CLASS = cn(
  "inline-flex shrink-0 cursor-pointer items-center justify-center text-muted-foreground hover:bg-state-hover hover:text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-default disabled:opacity-50",
  COARSE_POINTER_HEADER_ICON_BUTTON_CLASS,
);
/** Below this header width bb's file header folds its actions into a menu. */
const NARROW_HEADER_PX = 560;
/** How long the path's tooltip says Copied. */
const COPIED_MS = 1_500;

function useElementWidth<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [width, setWidth] = useState(0);
  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    const observer = new ResizeObserver(([entry]) => setWidth(entry?.contentRect.width ?? 0));
    observer.observe(element);
    return () => observer.disconnect();
  }, []);
  return { ref, width };
}

const HEADER_COLLAPSED_KEY = "moss-viewer:header-collapsed";

/** Whether the note header is hidden, remembered across notes and reloads on this device. */
function useHeaderCollapsed(): [boolean, (collapsed: boolean) => void] {
  const [collapsed, setCollapsed] = useState(() => {
    try {
      return window.localStorage.getItem(HEADER_COLLAPSED_KEY) === "1";
    } catch {
      return false;
    }
  });
  const set = useCallback((next: boolean) => {
    setCollapsed(next);
    try {
      if (next) window.localStorage.setItem(HEADER_COLLAPSED_KEY, "1");
      else window.localStorage.removeItem(HEADER_COLLAPSED_KEY);
    } catch {
      // Without storage the choice lasts for this panel only.
    }
  }, []);
  return [collapsed, set];
}

/** How long a slid-down header stays after the pointer leaves it. */
const SLIDE_UP_DELAY_MS = 300;

/**
 * A collapsed header: hovering (or tapping) the top edge of the note slides it
 * down over the note, and it slides back up once the pointer leaves. Keyboard
 * focus inside it keeps it down, so a focused control is never hidden.
 */
function SlideDownHeader({ children }: { children: ReactNode }) {
  const [shown, setShown] = useState(false);
  const panel = useRef<HTMLDivElement>(null);
  const timer = useRef<number | undefined>(undefined);
  const show = () => {
    window.clearTimeout(timer.current);
    setShown(true);
  };
  const hide = () => {
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(function later() {
      // An open menu from the header lives outside it; wait for it to close.
      const focused = panel.current?.contains(document.activeElement) && document.activeElement?.matches(":focus-visible");
      if (panel.current?.querySelector('[data-state="open"]') || focused) {
        timer.current = window.setTimeout(later, SLIDE_UP_DELAY_MS);
        return;
      }
      setShown(false);
    }, SLIDE_UP_DELAY_MS);
  };
  useEffect(() => () => window.clearTimeout(timer.current), []);
  return (
    <>
      <div aria-hidden className="absolute inset-x-0 top-0 z-10 h-3" onPointerEnter={show} onClick={show} />
      <div
        ref={panel}
        className={cn(
          "absolute inset-x-0 top-0 z-20 shadow-sm transition-transform duration-200 ease-out motion-reduce:transition-none",
          shown ? "translate-y-0" : "-translate-y-full",
        )}
        onPointerEnter={show}
        onPointerLeave={hide}
        onFocus={show}
        onBlur={(event) => {
          if (!event.currentTarget.contains(event.relatedTarget as Node | null)) hide();
        }}
      >
        {children}
      </div>
    </>
  );
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
          // Keeps the note's selection, which Send to agent reads on click.
          onMouseDown={(event) => event.preventDefault()}
          onClick={onClick}
          className={HEADER_ICON_BUTTON_CLASS}
        >
          <Icon name={icon} fallback="MoreHorizontal" aria-hidden />
        </button>
      </TooltipTrigger>
      <TooltipContent side="bottom">{label}</TooltipContent>
    </Tooltip>
  );
}

function NoteIcon() {
  return (
    <span className="flex size-4 shrink-0 items-center justify-center text-subtle-foreground max-md:pointer-coarse:size-5">
      <Icon name="File" fallback="FileText" aria-hidden className="size-full" />
    </span>
  );
}

/** The note's path: clicking it copies the path, and its tooltip says Copied for a moment. */
function NotePath({ path }: { path: string }) {
  const [hovered, setHovered] = useState(false);
  const [copied, setCopied] = useState(false);
  useEffect(() => {
    if (!copied) return;
    const timer = window.setTimeout(() => setCopied(false), COPIED_MS);
    return () => window.clearTimeout(timer);
  }, [copied]);
  const copyPath = () => {
    void navigator.clipboard.writeText(path).then(
      () => setCopied(true),
      () => toast.error("Failed to copy file path"),
    );
  };
  return (
    <>
      <Tooltip open={hovered || copied} onOpenChange={setHovered}>
        <TooltipTrigger asChild>
          <button
            type="button"
            aria-label="Copy file path"
            onClick={copyPath}
            className="min-w-0 cursor-pointer rounded-sm text-left font-mono text-sm font-medium leading-6 text-file-accent underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          >
            <span dir="rtl" className="block w-min max-w-full truncate">
              {`\u200e${formatHomePathForDisplay(path)}`}
            </span>
          </button>
        </TooltipTrigger>
        <TooltipContent side="bottom">{copied ? "Copied" : "Copy file path"}</TooltipContent>
      </Tooltip>
      <span role="status" className="sr-only">
        {copied ? "File path copied" : ""}
      </span>
    </>
  );
}

interface HeaderAction {
  icon: string;
  label: string;
  disabled?: boolean;
  onSelect: () => void;
}

function NoteHeader({
  path,
  canGoBack,
  status,
  actions,
  onBack,
  onSendToAgent,
  collapsed,
  onToggleCollapsed,
}: {
  path: string;
  canGoBack: boolean;
  /** The editor's save state. */
  status: ReactNode;
  /** The note's other actions: buttons beside Send to agent, or a menu when the panel is narrow. */
  actions: HeaderAction[];
  onBack: () => void;
  onSendToAgent: () => void;
  /** The header is hidden, and showing only while it slides down over the note. */
  collapsed: boolean;
  /** Hides the header, or keeps a slid-down one shown. */
  onToggleCollapsed: () => void;
}) {
  const { ref, width } = useElementWidth<HTMLDivElement>();
  const narrow = width > 0 && width < NARROW_HEADER_PX;
  return (
    <TooltipProvider delayDuration={300}>
      <div
        ref={ref}
        className="flex h-12 shrink-0 items-center gap-4 bg-surface-raised px-5 max-md:pointer-coarse:h-14 max-md:pointer-coarse:px-4"
      >
        <div className="flex min-w-0 flex-1 items-center gap-2">
          {canGoBack ? <HeaderButton icon="ChevronLeft" label="Back" onClick={onBack} /> : null}
          <NoteIcon />
          <NotePath path={path} />
          {status}
        </div>
        <div className="ml-auto flex shrink-0 items-center gap-1.5">
          {narrow
            ? null
            : actions.map((action) => (
                <HeaderButton key={action.label} icon={action.icon} label={action.label} disabled={action.disabled} onClick={action.onSelect} />
              ))}
          <HeaderButton icon="MessageSquarePlus" label="Send to agent" onClick={onSendToAgent} />
          {narrow ? (
            <DropdownMenu modal={false}>
              <DropdownMenuTrigger asChild>
                <button type="button" aria-label="Note actions" className={HEADER_ICON_BUTTON_CLASS}>
                  <Icon name="MoreHorizontal" aria-hidden />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                mobileTitle="Note actions"
                className="min-w-44 p-1.5 [&_[role=menuitem]]:min-h-9 [&_[role=menuitem]]:gap-2.5 [&_[role=menuitem]]:px-2.5 max-md:pointer-coarse:[&_[role=menuitem]]:min-h-11 max-md:pointer-coarse:[&_[role=menuitem]]:text-sm"
              >
                {actions.map((action) => (
                  <DropdownMenuItem key={action.label} disabled={action.disabled} onSelect={action.onSelect}>
                    <Icon name={action.icon} fallback="MoreHorizontal" aria-hidden /> {action.label}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          ) : null}
          <HeaderButton
            icon={collapsed ? "ChevronDown" : "ChevronUp"}
            label={collapsed ? "Keep header shown" : "Hide header"}
            onClick={onToggleCollapsed}
          />
        </div>
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
  /** Where the header's Send to agent reads the viewer's selection; null while no viewer is open. */
  onSelectionSource: (source: (() => Moss.MossSelection | null) | null) => void;
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
  // Where the reader was, so a note read again after a change on disk opens at the same place.
  const scrolled = useRef<{ path: string; top: number } | null>(null);

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
    latest.current.onSelectionSource(handle.selection ? () => handle.selection?.() ?? null : null);
    let live = true;
    const reveal = () => {
      if (live) setShown(true);
    };
    const timeout = window.setTimeout(reveal, READY_TIMEOUT_MS);
    const kept = scrolled.current;
    void handle.ready.then(() => {
      reveal();
      if (live && kept?.path === note.path) frame.contentDocument?.scrollingElement?.scrollTo({ top: kept.top });
    });
    return () => {
      scrolled.current = { path: note.path, top: frame.contentDocument?.scrollingElement?.scrollTop ?? 0 };
      live = false;
      window.clearTimeout(timeout);
      handleRef.current = null;
      latest.current.onSelectionSource(null);
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
  const composer = useComposer();
  const bbNavigate = useBbNavigate();
  const navigateRef = useRef(bbNavigate);
  navigateRef.current = bbNavigate;
  const theme = useCodeTheme().mode;
  const notesCache = useRef(new Map<string, { at: number; notes: Promise<MossNoteEntry[]> }>());
  const [stack, setStack] = useState<{ note: MossNote | null; back: MossNote[] }>({ note: null, back: [] });
  const [original, setOriginal] = useState(false);
  const [missing, setMissing] = useState<string | null>(null);
  const [collapsed, setCollapsed] = useHeaderCollapsed();
  // The open viewer's or editor's selection, read when the user sends the note to the agent.
  const selectionSource = useRef<(() => Moss.MossSelection | null) | null>(null);
  const setSelectionSource = useCallback((source: (() => Moss.MossSelection | null) | null) => {
    selectionSource.current = source;
  }, []);
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

  // A note in the viewer follows its file: the host watches it while the panel renews the lease,
  // and the panel reads it again when the host signals a change or a renewal reports a new version.
  const viewerNote = editorNote === null ? note : null;
  const viewerRef = useRef(viewerNote);
  viewerRef.current = viewerNote;
  // The version on screen, by note: it moves only when a read lands, so a failed read is tried again.
  const shownVersion = useRef<{ key: string; version: string | null } | null>(null);
  // Changes in a burst read the note once: one read at a time, started after a short quiet spell,
  // with one more after it when something changed meanwhile.
  const reload = useRef<{ timer: number | undefined; reading: boolean; again: boolean }>({ timer: undefined, reading: false, again: false });
  const readChanged = useCallback(() => {
    const state = reload.current;
    const shown = viewerRef.current;
    if (shown === null) return;
    if (state.reading) {
      state.again = true;
      return;
    }
    state.reading = true;
    state.again = false;
    const { hostId, path } = shown;
    const key = noteKey(shown);
    rpcRef.current
      .call("read", { kind: "host", path, hostId, environmentId: null })
      .then(
        (result) => {
          if (!result.moss || viewerRef.current === null || noteKey(viewerRef.current) !== key) return;
          if (shownVersion.current?.key === key) shownVersion.current = { key, version: result.version ?? null };
          setStack((current) =>
            current.note?.hostId === hostId && current.note.path === path ? { ...current, note: result } : current,
          );
        },
        (error: unknown) => console.warn("[moss-viewer] could not read the changed note", error),
      )
      .finally(() => {
        state.reading = false;
        if (state.again) readChanged();
      });
  }, []);
  const reloadViewer = useCallback(() => {
    const state = reload.current;
    window.clearTimeout(state.timer);
    state.timer = window.setTimeout(readChanged, RELOAD_QUIET_MS);
  }, [readChanged]);
  useEffect(() => () => window.clearTimeout(reload.current.timer), []);
  const watchKey = viewerNote === null ? null : noteKey(viewerNote);
  useEffect(() => {
    const shown = viewerRef.current;
    if (watchKey === null || shown === null) return;
    const { hostId, path } = shown;
    let live = true;
    // A note opened (or returned to with Back) is as new as the read that brought it, whatever changed since.
    if (shownVersion.current?.key !== watchKey) shownVersion.current = { key: watchKey, version: shown.version ?? null };
    const renew = () => {
      rpcRef.current.call("watchNote", { hostId, path }).then(
        ({ version }) => {
          if (!live || shownVersion.current?.key !== watchKey) return;
          // A host older than live reload reads no version; its first renewal stands in.
          if (shownVersion.current.version === null) shownVersion.current = { key: watchKey, version };
          else if (shownVersion.current.version !== version) reloadViewer();
        },
        // The host is away or cannot watch this file; the next renewal tries again.
        () => undefined,
      );
    };
    renew();
    const timer = window.setInterval(renew, VIEWER_WATCH_RENEW_MS);
    window.addEventListener("focus", renew);
    return () => {
      live = false;
      window.clearInterval(timer);
      window.removeEventListener("focus", renew);
    };
  }, [watchKey, connection, reloadViewer]);
  useRealtime(VIEWER_NOTE_CHANGED, (payload) => {
    const change = asViewerNoteChanged(payload);
    const shown = viewerRef.current;
    if (change === null || shown === null || change.hostId !== shown.hostId || change.path !== shown.path) return;
    if (change.version === shownVersion.current?.version) return;
    reloadViewer();
  });

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
      onSelectionSource={setSelectionSource}
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

  const revealNote = () => {
    rpcRef.current
      .call("revealNote", { hostId: note.hostId, path: note.path })
      .catch((error: unknown) => toast.error(`Couldn't show in Finder: ${messageOf(error)}`));
  };

  // Send to agent, for this panel's thread: a mention of the selection, or the whole note, that the user sends.
  const sendToAgent = () => {
    const target = note;
    let selection: Moss.MossSelection | null = null;
    try {
      selection = selectionSource.current?.() ?? null;
    } catch (error) {
      console.warn("[moss-viewer] could not read the selection; sending the whole note", error);
    }
    const title = noteTitle(target.path);
    const shared = sharedSelection(selection);
    rpcRef.current
      .call("shareNote", { hostId: target.hostId, path: target.path, title, noteId: target.noteId, selection: shared })
      .then(({ id }) => {
        // insertMention focuses the composer itself.
        composer.insertMention({ provider: SHARE_PROVIDER, id, label: shareLabel(title, shared === null ? null : selection?.text || shared.markdown) });
      })
      .catch((error: unknown) => toast.error(`Couldn't send this note to the agent: ${messageOf(error)}`));
  };

  const header = (
    <NoteHeader
      path={note.path}
      canGoBack={stack.back.length > 0}
      status={editorNote ? <EditorStatus status={editorState.status} /> : null}
      actions={[
        ...(restorable ? [{ icon: "ArrowTurnBackward", label: "Restore your last save from bb", onSelect: restoreLastSave }] : []),
        { icon: "FolderOpen", label: "Show in Finder", onSelect: revealNote },
        { icon: "ExternalLink", label: "Open in Moss", onSelect: openInMoss },
      ]}
      onBack={back}
      onSendToAgent={sendToAgent}
      collapsed={collapsed}
      onToggleCollapsed={() => setCollapsed(!collapsed)}
    />
  );

  return (
    <div className="flex h-full min-h-0 flex-1 flex-col">
      {collapsed ? null : header}
      <div className={cn("relative min-h-0 flex-1", collapsed && "overflow-hidden")}>
        {collapsed ? <SlideDownHeader>{header}</SlideDownHeader> : null}
        {collapsed && editorNote ? (
          // A save that needs attention stays in view while the header is hidden; the badge is empty otherwise.
          <div className="pointer-events-none absolute right-4 top-4 z-10 rounded-md bg-surface-raised px-2 has-[[role=status]:empty]:hidden">
            <EditorStatus status={editorState.status} />
          </div>
        ) : null}
        {editorNote === null ? (
          <MossViewerFrame
            note={note}
            theme={theme}
            notesFor={notesFor}
            onNavigate={onNavigate}
            openUrl={openUrl}
            onSelectionSource={setSelectionSource}
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
