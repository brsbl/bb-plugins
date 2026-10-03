import {
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
  type PointerEvent as ReactPointerEvent,
} from "react";
import { createRoot } from "react-dom/client";
import { toast } from "sonner";

import { NotePadArt } from "../art";
import { workAreaRect, fitDragRect, previewRect, usePointerTracker, WindowTitleBar } from "../windows";
import { ProgramMenuBar, ProgramStatusBar } from "../apps/xp-chrome";
import { useDesktopEnabled } from "../enabled";
import { NOTE_MENTIONS, noteTitle as titleOf, type StickyNote } from "../library";
import { SendButton, libraryCall, onLibraryChange, sendToThread, useSendLabel } from "./library-bridge";

export type { StickyNote };

/** This browser's copy of the notes, so they paint at once; the plugin's server holds the real ones. */
const NOTES_KEY = "bb-desktop:notes:v1";
/** Set once this browser's notes have been moved to the server. */
const IMPORTED_KEY = "bb-desktop:notes:imported:v1";
const SAVE_DELAY_MS = 400;
const TONES = ["Yellow", "Pink", "Green", "Blue"] as const;
const DEFAULT_SIZE = { width: 360, height: 260 };
const MARGIN = 16;
const MIN_SIZE = { width: 150, height: 110 };
const EDGE = 8;

function isNote(value: unknown): value is StickyNote {
  if (typeof value !== "object" || value === null) return false;
  const note = value as Record<string, unknown>;
  return (
    typeof note.id === "string" &&
    typeof note.text === "string" &&
    (note.side === "left" || note.side === "right") &&
    [note.x, note.y, note.width, note.height, note.tone].every((field) => typeof field === "number")
  );
}

function loadNotes(): StickyNote[] {
  try {
    const parsed: unknown = JSON.parse(localStorage.getItem(NOTES_KEY) ?? "[]");
    return Array.isArray(parsed) ? parsed.filter(isNote) : [];
  } catch {
    return [];
  }
}

let notes: StickyNote[] = typeof localStorage === "undefined" ? [] : loadNotes();
let focusNoteId: string | null = null;
const noteListeners = new Set<() => void>();

function emitNotes() {
  for (const listener of noteListeners) listener();
}

let writeTimer: ReturnType<typeof setTimeout> | null = null;

function writeNotes() {
  if (writeTimer !== null) clearTimeout(writeTimer);
  writeTimer = null;
  localStorage.setItem(NOTES_KEY, JSON.stringify(notes));
}

// Typing rewrites every note, so storage (and the other tabs reading it) gets the result once typing pauses, or as
// the page goes away.
function saveNotes(next: StickyNote[]) {
  notes = next;
  if (writeTimer !== null) clearTimeout(writeTimer);
  writeTimer = setTimeout(writeNotes, 300);
  emitNotes();
}

if (typeof window !== "undefined") {
  window.addEventListener("pagehide", () => {
    if (writeTimer !== null) writeNotes();
  });
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden" && writeTimer !== null) writeNotes();
  });
}

/** Notes edited here whose newest text the server hasn't stored yet; a server reload keeps these local copies. */
const pendingSaves = new Map<string, ReturnType<typeof setTimeout>>();

function pushNote(id: string) {
  const timer = pendingSaves.get(id);
  if (timer !== undefined) clearTimeout(timer);
  pendingSaves.set(id, setTimeout(() => void flushNote(id), SAVE_DELAY_MS));
}

async function flushNote(id: string) {
  const timer = pendingSaves.get(id);
  if (timer !== undefined) clearTimeout(timer);
  const note = notes.find((candidate) => candidate.id === id);
  if (note === undefined) {
    pendingSaves.delete(id);
    return;
  }
  try {
    const { note: stored } = await libraryCall<{ note: StickyNote }>("saveNote", { note });
    // A newer edit typed while this save was in flight keeps its own pending save.
    if (pendingSaves.get(id) === timer || pendingSaves.get(id) === undefined) pendingSaves.delete(id);
    if (stored.updatedAt !== note.updatedAt && !pendingSaves.has(id)) {
      saveNotes(notes.map((candidate) => (candidate.id === id ? stored : candidate)));
    }
  } catch {
    pendingSaves.delete(id);
  }
}

let syncing: Promise<void> | null = null;

/**
 * Loads the notes from the server, keeping notes with unsaved local edits. The first time, notes this browser kept
 * before the server stored them move over, so nothing written earlier is lost.
 */
export function syncNotes(): Promise<void> {
  syncing ??= (async () => {
    try {
      if (localStorage.getItem(IMPORTED_KEY) === null) {
        const local = loadNotes();
        if (local.length > 0) await libraryCall("importNotes", { notes: local.map((note) => ({ ...note, updatedAt: note.updatedAt ?? Date.now() })) });
        localStorage.setItem(IMPORTED_KEY, String(Date.now()));
      }
      const { notes: remote } = await libraryCall<{ notes: StickyNote[] }>("listNotes");
      const byId = new Map(remote.map((note) => [note.id, note]));
      const local = notes.filter((note) => pendingSaves.has(note.id) || byId.has(note.id));
      const merged = local.map((note) => (pendingSaves.has(note.id) ? note : byId.get(note.id)!));
      const known = new Set(merged.map((note) => note.id));
      saveNotes([...merged, ...remote.filter((note) => !known.has(note.id))]);
    } catch {
      // Offline or the plugin is reloading: keep this browser's copy and try again on the next change.
    } finally {
      syncing = null;
    }
  })();
  return syncing;
}

function subscribeNotes(listener: () => void) {
  noteListeners.add(listener);
  const onStorage = (event: StorageEvent) => {
    if (event.key !== NOTES_KEY) return;
    notes = loadNotes();
    listener();
  };
  window.addEventListener("storage", onStorage);
  return () => {
    noteListeners.delete(listener);
    window.removeEventListener("storage", onStorage);
  };
}

function updateNote(id: string, patch: Partial<StickyNote>) {
  saveNotes(notes.map((note) => (note.id === id ? { ...note, ...patch, updatedAt: Date.now() } : note)));
  pushNote(id);
}

function raiseNote(id: string) {
  const note = notes.find((candidate) => candidate.id === id);
  if (note === undefined || notes[notes.length - 1]?.id === id) return;
  saveNotes([...notes.filter((candidate) => candidate.id !== id), note]);
}

/** Desktop icon label, taken from the note's first line like a saved file name. */
export function noteTitle(note: StickyNote) {
  return titleOf(note.text);
}

/** Flushes the note's latest text to the server, then adds it to the message being written. */
async function sendNote(note: StickyNote) {
  if (note.text.trim() === "") {
    toast("Write something in the note pad first.");
    return;
  }
  await flushNote(note.id);
  sendToThread({ kind: NOTE_MENTIONS, id: note.id, label: noteTitle(note) });
}

/** Saved note pads for desktop icons; the same array while their ids and titles hold, so typing doesn't re-render it. */
export function useSavedNotes(): StickyNote[] {
  const list = useNotes();
  const previous = useRef<StickyNote[]>([]);
  return useMemo(() => {
    const saved = list.filter((note) => note.saved === true);
    const last = previous.current;
    const same =
      saved.length === last.length &&
      saved.every((note, index) => note.id === last[index]!.id && noteTitle(note) === noteTitle(last[index]!));
    if (!same) previous.current = saved;
    return previous.current;
  }, [list]);
}

export function openNote(id: string) {
  const note = notes.find((candidate) => candidate.id === id);
  if (note === undefined) return;
  focusNoteId = id;
  saveNotes([...notes.filter((candidate) => candidate.id !== id), { ...note, hidden: false, updatedAt: Date.now() }]);
  pushNote(id);
}

function closeNote(note: StickyNote) {
  if (note.saved === true) updateNote(note.id, { hidden: true });
  else removeNote(note.id);
}

/** Saved note pads deleted in this tab whose Desktop icon position the desktop hasn't cleared yet. */
const removedSavedNotes = new Set<string>();

export function takeRemovedNoteIds(): string[] {
  const ids = [...removedSavedNotes];
  removedSavedNotes.clear();
  return ids;
}

export function removeNote(id: string) {
  const index = notes.findIndex((note) => note.id === id);
  const note = notes[index];
  if (note === undefined) return;
  if (note.saved === true) removedSavedNotes.add(id);
  const timer = pendingSaves.get(id);
  if (timer !== undefined) clearTimeout(timer);
  pendingSaves.delete(id);
  saveNotes(notes.filter((candidate) => candidate.id !== id));
  void libraryCall("deleteNote", { id }).catch(() => undefined);
  if (note.text.trim() === "") return;
  toast("Note pad deleted", {
    action: {
      label: "Undo",
      onClick: () => {
        removedSavedNotes.delete(id);
        saveNotes([...notes.slice(0, index), { ...note, updatedAt: Date.now() }, ...notes.slice(index)]);
        pushNote(id);
      },
    },
  });
}

function anchoredNote(left: number, top: number, width: number, height: number) {
  const side: StickyNote["side"] = left + width / 2 > window.innerWidth / 2 ? "right" : "left";
  return {
    side,
    x: Math.round(side === "left" ? left : window.innerWidth - left - width),
    y: Math.round(top),
    width,
    height,
  };
}

function screenRect(note: StickyNote) {
  const area = workAreaRect();
  const rect = fitDragRect({
    x: note.side === "left" ? note.x : window.innerWidth - note.x - note.width,
    y: note.y, width: note.width, height: note.height,
  }, { ...area, x: EDGE, width: Math.max(0, area.width - EDGE * 2) }, MIN_SIZE);
  return { left: rect.x, top: rect.y, width: rect.width, height: rect.height };
}

interface SaveFileHandle {
  name: string;
  createWritable(): Promise<{ write(data: string): Promise<void>; close(): Promise<void> }>;
}
type SaveFilePicker = (options: {
  suggestedName: string;
  types: { description: string; accept: Record<string, string[]> }[];
}) => Promise<SaveFileHandle>;

function suggestedFileName(note: StickyNote) {
  return `${noteTitle(note).replace(/[\\/:*?"<>|]/g, "").trim() || "Untitled"}.txt`;
}

/** Exports the note as a .txt file wherever the user picks. */
async function exportNoteFile(note: StickyNote): Promise<string | null> {
  const picker = (window as Window & { showSaveFilePicker?: SaveFilePicker }).showSaveFilePicker;
  if (picker === undefined) {
    const url = URL.createObjectURL(new Blob([note.text], { type: "text/plain" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = suggestedFileName(note);
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    return link.download;
  }
  try {
    const handle = await picker({
      suggestedName: suggestedFileName(note),
      types: [{ description: "Text Document", accept: { "text/plain": [".txt"] } }],
    });
    const writable = await handle.createWritable();
    await writable.write(note.text);
    await writable.close();
    return handle.name;
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") return null;
    toast("Couldn't export the note pad", { description: error instanceof Error ? error.message : String(error) });
    return null;
  }
}

export function addStickyNote(at?: { left: number; top: number }) {
  const { width, height } = DEFAULT_SIZE;
  const base = at ?? { left: window.innerWidth - width - MARGIN, top: 72 };
  let top = base.top;
  while (notes.some((note) => Math.abs(screenRect(note).top - top) < 12 && Math.abs(screenRect(note).left - base.left) < 12)) {
    top += 28;
  }
  const note: StickyNote = {
    id: crypto.randomUUID(),
    text: "",
    tone: 0,
    ...anchoredNote(base.left, top, width, height),
    updatedAt: Date.now(),
  };
  focusNoteId = note.id;
  saveNotes([...notes, note]);
  pushNote(note.id);
}

function useNotes(): StickyNote[] {
  return useSyncExternalStore(subscribeNotes, () => notes);
}

function useViewportSize() {
  const [, setSize] = useState(0);
  useEffect(() => {
    const onResize = () => setSize((count) => count + 1);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);
}

function StickyNoteView({ note }: { note: StickyNote }) {
  const textRef = useRef<HTMLTextAreaElement>(null);
  const noteRef = useRef<HTMLElement>(null);
  const trackPointer = usePointerTracker();
  const rect = screenRect(note);
  const [wrap, setWrap] = useState(true);
  const sendLabel = useSendLabel();
  const save = () => updateNote(note.id, { saved: true });
  const exportFile = () => {
    void exportNoteFile(note).then((name) => {
      if (name !== null) toast(`Exported ${name}`);
    });
  };

  useEffect(() => {
    if (focusNoteId !== note.id) return;
    focusNoteId = null;
    textRef.current?.focus();
  }, [note.id]);

  const track = (event: ReactPointerEvent<HTMLElement>, resize = false) => {
    if (event.button !== 0 || event.isPrimary === false) return;
    const element = noteRef.current;
    if (!element) return;
    raiseNote(note.id);
    const area = workAreaRect();
    const bounds = { ...area, x: EDGE, width: Math.max(0, area.width - EDGE * 2) };
    const origin = { x: rect.left, y: rect.top, width: rect.width, height: rect.height };
    let latest = origin;
    trackPointer(event, (delta) => {
      latest = fitDragRect(resize ? { ...origin,
        width: Math.min(Math.max(MIN_SIZE.width, origin.width + delta.x), bounds.x + bounds.width - origin.x),
        height: Math.min(Math.max(MIN_SIZE.height, origin.height + delta.y), bounds.y + bounds.height - origin.y),
      } : { ...origin, x: origin.x + delta.x, y: origin.y + delta.y }, bounds, MIN_SIZE);
      element.dataset.dragging = "true";
      if (resize) previewRect(element, latest);
      else element.style.transform = `translate(${latest.x - origin.x}px, ${latest.y - origin.y}px)`;
    }, (cancelled, moved) => {
      element.style.transform = "";
      previewRect(element, cancelled || !moved ? origin : latest);
      // Flush once on drop so the shared window transition cannot animate the reset.
      if (moved) element.getBoundingClientRect();
      delete element.dataset.dragging;
      if (!cancelled && moved) updateNote(note.id, anchoredNote(latest.x, latest.y, latest.width, latest.height));
    });
  };


  return (
    <section
      ref={noteRef}
      className="bbd-note bbd-window bbd-program-note"
      data-focused="true"
      data-tone={TONES[note.tone % TONES.length]}
      aria-label="Note pad"
      style={{ left: rect.left, top: rect.top, width: rect.width, height: rect.height }}
      tabIndex={-1}
      onPointerDown={() => raiseNote(note.id)}
      onKeyDown={(event) => {
        if (event.key.toLowerCase() !== "s" || !(event.metaKey || event.ctrlKey)) return;
        event.preventDefault();
        if (event.shiftKey) exportFile();
        else save();
      }}
    >
      <WindowTitleBar title="Note pad" icon={<NotePadArt size={16} />}
        titleActions={<SendButton onSend={() => void sendNote(note)} />}
        onPointerDown={(event) => {
          if ((event.target as HTMLElement).closest("button")) return;
          track(event);
        }}
        onClose={() => closeNote(note)}
      />
      <ProgramMenuBar menus={[
        { label: "File", items: [
          { label: "New", action: () => addStickyNote() },
          { label: "Save to Desktop", shortcut: "Ctrl+S", action: save },
          { label: "Export as .txt…", action: exportFile },
          "separator",
          { label: sendLabel, action: () => void sendNote(note) },
          "separator",
          { label: "Delete note pad", action: () => removeNote(note.id) },
        ] },
        { label: "Edit", items: [{ label: "Select All", action: () => { textRef.current?.focus(); textRef.current?.select(); } }] },
        { label: "Format", items: [{ label: "Word Wrap", checked: wrap, action: () => setWrap(!wrap) }] },
        { label: "View", items: TONES.map((tone, index) => ({ label: tone, checked: note.tone === index, action: () => updateNote(note.id, { tone: index }) })) },
        { label: "Help", items: [{ label: "Notes save automatically" }] },
      ]} />
      <textarea
        ref={textRef}
        className="bbd-note-text"
        value={note.text}
        aria-label="Note text"
        wrap={wrap ? "soft" : "off"}
        placeholder=""
        spellCheck={false}
        onChange={(event) => updateNote(note.id, { text: event.target.value })}
      />
      <ProgramStatusBar><span className="flex-1">{note.saved === true ? "Saved to Desktop" : "Not saved · Ctrl+S"}</span><span>{note.text.length} characters</span></ProgramStatusBar>
      <span
        className="bbd-note-grip"
        aria-hidden
        onPointerDown={(event) => track(event, true)}
      />
    </section>
  );
}

function StickyNotes() {
  const enabled = useDesktopEnabled();
  const list = useNotes();
  useViewportSize();
  useEffect(() => {
    void syncNotes();
    const onVisible = () => {
      if (document.visibilityState === "visible") void syncNotes();
    };
    document.addEventListener("visibilitychange", onVisible);
    const stop = onLibraryChange((kind) => {
      if (kind === "notes") void syncNotes();
    });
    return () => {
      document.removeEventListener("visibilitychange", onVisible);
      stop();
    };
  }, []);
  if (!enabled) return null;
  return (
    <>
      {list.filter((note) => note.hidden !== true).map((note) => (
        <StickyNoteView key={note.id} note={note} />
      ))}
    </>
  );
}

export function mountStickyNotes() {
  const host = document.createElement("div");
  host.setAttribute("data-bb-plugin", "desktop");
  host.className = "bbd-root bbd-notes-layer";
  document.body.append(host);
  const root = createRoot(host);
  root.render(<StickyNotes />);
  return () => {
    root.unmount();
    host.remove();
  };
}

export function StickyNoteHeaderButton({ isCompactViewport }: { isCompactViewport: boolean }) {
  const enabled = useDesktopEnabled();
  if (!enabled || isCompactViewport) return null;
  return (
    <button
      type="button"
      className="bbd-root bbd-note-add"
      aria-label="Add a note pad"
      title="Add a note pad"
      onClick={(event) => {
        const button = event.currentTarget.getBoundingClientRect();
        addStickyNote({ left: window.innerWidth - DEFAULT_SIZE.width - MARGIN, top: button.bottom + 12 });
      }}
    >
      <NotePadArt size={20} />
    </button>
  );
}
