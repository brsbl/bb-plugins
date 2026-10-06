import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { experimental_Icon as Icon } from "@get-bb/plugin-sdk/app";
import type { MossNoteEntry, ReadResult } from "./contract";
import type { EditorBridge } from "./editor-bridge";
import { SLOW_SAVE_MS, closeEditor, frameEditor, parkFrame, statusLabel } from "./editor-frame";
import { cn } from "./lib/utils";
import type * as Moss from "./vendor/moss-editor.contract.js";
import { frameSource, routeFrameLinks, setFrameTheme, type MossViewerTarget } from "./viewer-frame";

type MossNote = Extract<ReadResult, { moss: true }>;
export type EditorNote = MossNote & { editor: NonNullable<MossNote["editor"]> };

export interface EditorFrameProps {
  note: EditorNote;
  title: string;
  theme: Moss.MossEditorTheme;
  bridge: EditorBridge;
  /** Edits to reopen: a draft an earlier close kept, or a receipt the user restores. */
  restoreDraft: Moss.MossDraft | null;
  notesFor(hostId: string): Promise<MossNoteEntry[]>;
  onNavigate(note: MossNote, target: MossViewerTarget): void;
  openUrl(url: string): void;
  onStatus(status: Moss.MossEditorStatus): void;
  /** The version on disk as the editor last read, saved or reloaded it. */
  onVersion(version: string): void;
  /**
   * The edits in `restoreDraft` are safe without the draft: on disk (opened clean,
   * or saved), or settled by the user in the conflict (Overwrite, or Reload).
   */
  onRestoreSettled(): void;
  onSaved(receipt: Moss.MossDraft, version: string): void;
  onUnsaved(draft: Moss.MossDraft): Promise<void>;
  /** The note cannot be edited after all; the viewer takes over. */
  onUnavailable(): void;
}

/**
 * moss-multi's editor, mounted in its own document as the viewer is. The frame
 * is made here rather than by React, so a closing panel can hand it to
 * `parkFrame` and let the editor finish saving before it goes.
 */
export function MossEditorFrame(props: EditorFrameProps) {
  const { note, theme } = props;
  const slot = useRef<HTMLDivElement>(null);
  const latest = useRef(props);
  latest.current = props;
  const frameRef = useRef<HTMLIFrameElement | null>(null);
  const handleRef = useRef<Moss.MossEditorHandle | null>(null);
  const [shown, setShown] = useState(false);

  useLayoutEffect(() => {
    const container = slot.current;
    if (!container) return;
    const frame = container.ownerDocument.createElement("iframe");
    frame.title = latest.current.title;
    frame.src = frameSource(note.editor.frameUrl, latest.current.theme);
    frame.setAttribute("sandbox", "allow-scripts allow-same-origin allow-popups allow-popups-to-escape-sandbox");
    frame.className = "block size-full border-0";
    container.append(frame);
    frameRef.current = frame;
    let handle: Moss.MossEditorHandle | null = null;
    let stopLinks: () => void = () => undefined;

    const mount = () => {
      const editor = frameEditor(frame);
      const element = frame.contentDocument?.getElementById("moss-editor");
      if (!editor || !element) {
        console.error("[moss-editor] the editor bundle did not load in its frame");
        latest.current.onUnavailable();
        return;
      }
      stopLinks = routeFrameLinks(frame, (url) => latest.current.openUrl(url));
      const bridge = latest.current.bridge;
      // The panel learns the version on disk from the editor's own reads.
      const reading: Moss.MossEditorBridge = {
        ...bridge,
        read: async (noteId) => {
          const result = await bridge.read(noteId);
          if (result.kind === "note") latest.current.onVersion(result.version);
          return result;
        },
      };
      const restoreDraft = latest.current.restoreDraft;
      let restoring = restoreDraft !== null;
      const settleRestore = () => {
        if (!restoring) return;
        restoring = false;
        latest.current.onRestoreSettled();
      };
      try {
        handle = editor.mountMossEditor(element, {
          noteId: note.editor.noteId,
          bridge: reading,
          theme: latest.current.theme,
          htmlFrameUrl: note.editor.htmlFrameUrl,
          ...(restoreDraft ? { restoreDraft } : {}),
          services: {
            notes: () =>
              latest.current
                .notesFor(note.hostId)
                .then((entries) =>
                  entries.map(({ id, title, folderPath, updatedAt }) => ({ id, title, folderPath, ...(updatedAt === undefined ? {} : { updatedAt }) })),
                ),
            navigate: (target) => latest.current.onNavigate(note, target),
            unfurl: () => Promise.resolve(null),
          },
          onEvent: (event) => {
            latest.current.onStatus(event.status);
            if (event.kind === "saved") {
              latest.current.onSaved(event.receipt, event.version);
              latest.current.onVersion(event.version);
            } else if (event.kind === "reloaded") {
              latest.current.onVersion(event.version);
            }
            // A restored draft that opened in conflict is only in this editor until it saves or the user decides.
            if (event.kind === "saved" || event.kind === "conflictResolved" || (event.kind === "reloaded" && event.cause === "conflict")) {
              settleRestore();
            }
          },
        });
      } catch (error) {
        console.error("[moss-editor] could not open this note", error);
        latest.current.onUnavailable();
        return;
      }
      const mounted = handle;
      handleRef.current = mounted;
      mounted.ready.then(
        () => {
          setShown(true);
          latest.current.onStatus(mounted.status);
          // Opened clean: the disk already holds what the draft held.
          if (mounted.status === "clean") settleRestore();
        },
        (error: unknown) => {
          // Not editable after all, or the read failed: the note opens read-only instead.
          console.warn("[moss-editor] opening this note in the viewer", error);
          if (handleRef.current === mounted) latest.current.onUnavailable();
        },
      );
    };

    frame.addEventListener("load", mount, { once: true });
    return () => {
      frame.removeEventListener("load", mount);
      stopLinks();
      frameRef.current = null;
      handleRef.current = null;
      if (handle === null) {
        frame.remove();
        return;
      }
      // React removes the panel next; the editor saves, or keeps as a draft, what it still holds.
      parkFrame(frame);
      void closeEditor(handle, {
        saved: (receipt, version) => latest.current.onSaved(receipt, version),
        unsaved: (draft) => latest.current.onUnsaved(draft),
      })
        .catch((error: unknown) => console.error("[moss-editor] could not close this note cleanly", error))
        .finally(() => frame.remove());
    };
  }, [note]);

  useEffect(() => {
    const frame = frameRef.current;
    if (frame) setFrameTheme(frame, theme);
    handleRef.current?.setTheme(theme);
  }, [theme]);

  return (
    <>
      {shown ? null : (
        <span role="status" className="sr-only">
          Loading note…
        </span>
      )}
      <div ref={slot} className={shown ? "size-full" : "invisible size-full"} />
    </>
  );
}

/** The editor's save state in the note's header, when there is something worth saying. */
export function EditorStatus({ status }: { status: Moss.MossEditorStatus | null }) {
  const [slow, setSlow] = useState(false);
  useEffect(() => {
    setSlow(false);
    if (status !== "saving") return;
    const timer = window.setTimeout(() => setSlow(true), SLOW_SAVE_MS);
    return () => window.clearTimeout(timer);
  }, [status]);
  const shown = statusLabel(status, { slow });
  return (
    <span
      role="status"
      aria-live="polite"
      className={cn(
        "inline-flex shrink-0 items-center gap-1 text-xs leading-5 max-md:pointer-coarse:text-sm",
        shown?.attention ? "font-medium text-foreground" : "text-muted-foreground",
      )}
    >
      {shown ? (
        <>
          <Icon name={shown.icon} fallback="MoreHorizontal" aria-hidden className="size-3 max-md:pointer-coarse:size-4" />
          {shown.label}
        </>
      ) : null}
    </span>
  );
}
