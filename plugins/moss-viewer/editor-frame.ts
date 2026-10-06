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

/** The save state bb shows once, in the note's header; null while there is nothing to say. */
export function statusLabel(status: Moss.MossEditorStatus | null): StatusLabel | null {
  switch (status) {
    case "clean":
      return { label: "Saved", icon: "Check", attention: false };
    case "dirty":
      return { label: "Edited", icon: "Clock", attention: false };
    case "saving":
      return { label: "Saving…", icon: "Clock", attention: false };
    case "conflict":
      return { label: "Changed in Moss", icon: "AlertTriangle", attention: true };
    case "error":
      return { label: "Not saved", icon: "AlertTriangle", attention: true };
    case "removed":
      return { label: "Can't save here", icon: "AlertTriangle", attention: true };
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
