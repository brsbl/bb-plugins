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

import { NotePadArt, NotePadGlyph } from "./art";
import { workAreaRect, fitDragRect, previewRect, usePointerTracker, WindowTitleBar } from "./windows";
import { ProgramMenuBar, ProgramStatusBar } from "./apps/xp-chrome";
import { useDesktopEnabled } from "./enabled";

export interface StickyNote {
  id: string;
  text: string;
  side: "left" | "right";
  x: number;
  y: number;
  width: number;
  height: number;
  tone: number;
  /** Saved note pads keep a Desktop icon and survive closing. */
  saved?: boolean;
  /** A saved note pad whose window is closed; its Desktop icon reopens it. */
  hidden?: boolean;
}

const NOTES_KEY = "bb-desktop:notes:v1";
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

function saveNotes(next: StickyNote[]) {
  notes = next;
  localStorage.setItem(NOTES_KEY, JSON.stringify(next));
  emitNotes();
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
  saveNotes(notes.map((note) => (note.id === id ? { ...note, ...patch } : note)));
}

function raiseNote(id: string) {
  const note = notes.find((candidate) => candidate.id === id);
  if (note === undefined || notes[notes.length - 1]?.id === id) return;
  saveNotes([...notes.filter((candidate) => candidate.id !== id), note]);
}

/** Desktop icon label, taken from the note's first line like a saved file name. */
export function noteTitle(note: StickyNote) {
  return note.text.trim().split("\n")[0]?.trim().slice(0, 40) || "Untitled";
}

export function useSavedNotes(): StickyNote[] {
  const list = useNotes();
  return useMemo(() => list.filter((note) => note.saved === true), [list]);
}

export function openNote(id: string) {
  const note = notes.find((candidate) => candidate.id === id);
  if (note === undefined) return;
  focusNoteId = id;
  saveNotes([...notes.filter((candidate) => candidate.id !== id), { ...note, hidden: false }]);
}

function closeNote(note: StickyNote) {
  if (note.saved === true) updateNote(note.id, { hidden: true });
  else removeNote(note.id);
}

export function removeNote(id: string) {
  const index = notes.findIndex((note) => note.id === id);
  const note = notes[index];
  if (note === undefined) return;
  saveNotes(notes.filter((candidate) => candidate.id !== id));
  if (note.text.trim() === "") return;
  toast("Note pad deleted", {
    action: {
      label: "Undo",
      onClick: () => saveNotes([...notes.slice(0, index), note, ...notes.slice(index)]),
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
  };
  focusNoteId = note.id;
  saveNotes([...notes, note]);
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
      onPointerDown={() => raiseNote(note.id)}
    >
      <WindowTitleBar title="Note pad" icon={<NotePadArt size={16} />}
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
        onKeyDown={(event) => {
          if (event.key.toLowerCase() !== "s" || !(event.metaKey || event.ctrlKey)) return;
          event.preventDefault();
          if (event.shiftKey) exportFile();
          else save();
        }}
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
      <NotePadGlyph className="size-4" />
    </button>
  );
}
