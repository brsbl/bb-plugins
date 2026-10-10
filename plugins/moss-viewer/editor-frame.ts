// The parts of @moss-multi/editor's API version 1 (vendor/moss-editor.contract.d.ts)
// the panel uses around its frame: the entry the frame exposes, the status bb
// shows, and closing an editor without losing edits.
import type * as Moss from "./vendor/moss-editor.contract.js";

export const SUPPORTED_EDITOR_API = 1;

interface FrameGlobals {
  mossEditor?: {
    api: number;
    info: Moss.MossEditorInfo;
    mountMossEditor: Moss.MountMossEditor;
  };
}

/** The editor entry the frame exposes once its module has run, or null when it failed to load. */
export function frameEditor(frame: HTMLIFrameElement): NonNullable<FrameGlobals["mossEditor"]> | null {
  const editor = (frame.contentWindow as (Window & FrameGlobals) | null)?.mossEditor;
  return editor && editor.api === SUPPORTED_EDITOR_API && typeof editor.mountMossEditor === "function" ? editor : null;
}

export interface StatusLabel {
  label: string;
  icon: string;
  /** The user may need to act: shown stronger, never by color alone. */
  attention: boolean;
}

/** How long a save runs before the header says so; a quicker save needs no feedback. */
export const SLOW_SAVE_MS = 2_000;

/**
 * What the note's header says about saving. Saving is expected to just work,
 * so it is quiet while edits save; it speaks when the user may need to act, or
 * when a save has run longer than SLOW_SAVE_MS (`slow`).
 */
export function statusLabel(status: Moss.MossEditorStatus | null, { slow }: { slow: boolean }): StatusLabel | null {
  switch (status) {
    case "saving":
      return slow ? { label: "Saving…", icon: "Clock", attention: false } : null;
    case "conflict":
      return { label: "Changed in Moss", icon: "AlertTriangle", attention: true };
    case "error":
    case "removed":
      return { label: "Not saved", icon: "AlertTriangle", attention: true };
    default:
      return null;
  }
}

const KEEPER_ID = "moss-editor-keeper";

/**
 * Moves a closing editor's frame out of the panel, so React can remove the panel
 * while the editor finishes saving. Only `moveBefore` moves a frame without
 * reloading it; where it is missing the frame stays, and the editor's autosave
 * is all that saves the last edits. Returns whether the frame moved.
 */
export function parkFrame(frame: HTMLIFrameElement): boolean {
  const document = frame.ownerDocument;
  let keeper = document.getElementById(KEEPER_ID);
  if (keeper === null) {
    keeper = document.createElement("div");
    keeper.id = KEEPER_ID;
    keeper.setAttribute("aria-hidden", "true");
    Object.assign(keeper.style, { position: "fixed", width: "0", height: "0", overflow: "hidden", visibility: "hidden", pointerEvents: "none" });
    document.body.append(keeper);
  }
  const moveBefore = (keeper as HTMLElement & { moveBefore?: (node: Node, child: Node | null) => void }).moveBefore;
  if (typeof moveBefore !== "function") return false;
  try {
    moveBefore.call(keeper, frame, null);
    return true;
  } catch {
    return false;
  }
}

export interface KeepEdits {
  /** The bytes of the final save, to keep as the note's receipt. */
  saved(receipt: Moss.MossDraft, version: string): void;
  /** Edits the final flush could not save, kept so the next mount can restore them. */
  unsaved(draft: Moss.MossDraft): Promise<void>;
}

/** Unmounts an editor; edits it cannot save are kept as a draft before it goes. */
export async function closeEditor(handle: Moss.MossEditorHandle, keep: KeepEdits): Promise<void> {
  const result = await handle.unmount();
  if (result.kind === "unmounted") {
    if (result.flush.kind === "saved") keep.saved(result.flush.receipt, result.flush.version);
    return;
  }
  try {
    await keep.unsaved(result.flush.draft);
  } finally {
    // The panel is closing either way; the draft is all that can outlive it.
    await handle.unmount({ discardUnsaved: true });
  }
}

/** How long after the last keystroke the editor counts as idle, and may take a change from disk. */
export const TYPING_IDLE_MS = 1_500;

export interface TypingGate {
  /** The user typed, pasted or composed in the editor. */
  input(): void;
  /** Runs `apply` now, or holds it (replacing any held change) until the user pauses. */
  offer(apply: () => void): void;
  /** Runs any held change now, as when the editor loses focus. */
  flush(): void;
  dispose(): void;
}

/**
 * Holds changes from disk while the user is mid-edit: the editor has focus and
 * they typed in the last TYPING_IDLE_MS, or edits are still unsaved. The latest
 * held change goes in once they pause or leave the editor. A change that lands
 * on unsaved edits is the editor's to settle: it asks, and never overwrites them.
 */
export function createTypingGate({
  focused,
  unsaved,
  now = () => Date.now(),
  idleMs = TYPING_IDLE_MS,
}: {
  focused(): boolean;
  unsaved(): boolean;
  now?: () => number;
  idleMs?: number;
}): TypingGate {
  let lastInput = Number.NEGATIVE_INFINITY;
  let held: (() => void) | null = null;
  let timer: ReturnType<typeof setTimeout> | undefined;
  const editing = () => focused() && (now() - lastInput < idleMs || unsaved());
  const run = () => {
    clearTimeout(timer);
    timer = undefined;
    const apply = held;
    held = null;
    apply?.();
  };
  const check = () => {
    timer = undefined;
    if (held === null) return;
    if (editing()) timer = setTimeout(check, idleMs / 3);
    else run();
  };
  return {
    input() {
      lastInput = now();
    },
    offer(apply) {
      if (!editing()) {
        apply();
        return;
      }
      held = apply;
      if (timer === undefined) timer = setTimeout(check, idleMs / 3);
    },
    flush: run,
    dispose() {
      clearTimeout(timer);
      timer = undefined;
      held = null;
    },
  };
}
