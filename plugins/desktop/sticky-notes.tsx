import {
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
  type PointerEvent as ReactPointerEvent,
} from "react";
import { createRoot } from "react-dom/client";
import { toast } from "sonner";

import { NotePadArt, NotePadGlyph } from "./art";
import { WindowTitleBar } from "./windows";
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

function removeNote(id: string) {
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
  const width = Math.min(note.width, window.innerWidth - EDGE * 2);
  const height = Math.min(note.height, window.innerHeight - EDGE * 2);
  const offset = Math.min(Math.max(note.x, EDGE), window.innerWidth - width - EDGE);
  return {
    left: note.side === "left" ? offset : window.innerWidth - offset - width,
    top: Math.min(Math.max(note.y, EDGE), window.innerHeight - height - EDGE),
    width,
    height,
  };
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
  const [drag, setDrag] = useState<{ left: number; top: number; width: number; height: number } | null>(null);
  const rect = drag ?? screenRect(note);
  const [wrap, setWrap] = useState(true);

  useEffect(() => {
    if (focusNoteId !== note.id) return;
    focusNoteId = null;
    textRef.current?.focus();
  }, [note.id]);

  const track = (
    event: ReactPointerEvent,
    next: (dx: number, dy: number) => { left: number; top: number; width: number; height: number },
  ) => {
    if (event.button !== 0) return;
    event.preventDefault();
    raiseNote(note.id);
    const startX = event.clientX;
    const startY = event.clientY;
    let latest = screenRect(note);
    const onMove = (move: PointerEvent) => {
      latest = next(move.clientX - startX, move.clientY - startY);
      setDrag(latest);
    };
    const onUp = () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", onUp);
      setDrag(null);
      updateNote(note.id, anchoredNote(latest.left, latest.top, latest.width, latest.height));
    };
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    window.addEventListener("pointercancel", onUp);
  };

  const start = screenRect(note);

  return (
    <section
      className="bbd-note bbd-window bbd-program-note"
      data-focused="true"
      data-tone={TONES[note.tone % TONES.length]}
      data-dragging={drag !== null}
      aria-label="Note pad"
      style={{ left: rect.left, top: rect.top, width: rect.width, height: rect.height }}
      onPointerDown={() => raiseNote(note.id)}
    >
      <WindowTitleBar title="Note pad" icon={<NotePadArt size={16} />}
        onPointerDown={(event) => {
          if ((event.target as HTMLElement).closest("button")) return;
          track(event, (dx, dy) => ({ ...start, left: start.left + dx, top: start.top + dy }));
        }}
        onClose={() => removeNote(note.id)}
      />
      <ProgramMenuBar menus={[
        { label: "File", items: [{ label: "New", action: () => addStickyNote() }, { label: "Delete note pad", action: () => removeNote(note.id) }] },
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
      <ProgramStatusBar><span className="flex-1">Saved</span><span>{note.text.length} characters</span></ProgramStatusBar>
      <span
        className="bbd-note-grip"
        aria-hidden
        onPointerDown={(event) =>
          track(event, (dx, dy) => ({
            ...start,
            width: Math.max(MIN_SIZE.width, start.width + dx),
            height: Math.max(MIN_SIZE.height, start.height + dy),
          }))
        }
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
      {list.map((note) => (
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
