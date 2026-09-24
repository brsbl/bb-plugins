import { randomUUID } from "node:crypto";
import type { BbPluginApi } from "@get-bb/plugin-sdk";
import { z } from "zod";
import { isActionable, noteInputSchema, noteSchema, stillSchema, versionSchema, type FrameNote, type Media, type NoteStatus, type Still, type Version } from "./model.js";

type Database = ReturnType<BbPluginApi["storage"]["database"]>;
const jsonRow = z.object({body: z.string()});
export class VideoMarkupStore {
  constructor(private db: Database) {}
  versions(threadId: string): Version[] {
    return this.db.prepare("SELECT body FROM versions WHERE thread_id = ? ORDER BY rowid").all(threadId).map(row => versionSchema.parse(JSON.parse(jsonRow.parse(row).body)));
  }
  version(threadId: string, versionId: string): Version {
    const row = this.db.prepare("SELECT body FROM versions WHERE thread_id = ? AND id = ?").get(threadId, versionId);
    if (!row) throw new Error("This Video Markup version is no longer available in this thread");
    return versionSchema.parse(JSON.parse(jsonRow.parse(row).body));
  }
  register(input: {threadId: string; demo: string; label: string; summary: string; media: Media}): Version {
    return this.db.transaction(() => {
      const previous = this.versions(input.threadId).filter(v => v.demo === input.demo);
      if (previous.some(v => v.label === input.label)) throw new Error("This demo already has that version label. Choose a new label.");
      const version: Version = {...input, id: randomUUID(), createdAt: Date.now(), ordinal: previous.length + 1};
      this.db.prepare("INSERT INTO versions (id, thread_id, body) VALUES (?, ?, ?)").run(version.id, version.threadId, JSON.stringify(version));
      const last = previous.at(-1);
      if (last) for (const note of this.notes(input.threadId).filter(n => n.versionId === last.id && isActionable(n.status))) {
        this.putNote({...note, id: randomUUID(), versionId: version.id, carriedFrom: note.id, updatedAt: version.createdAt});
      }
      return version;
    })();
  }
  notes(threadId: string): FrameNote[] {
    return this.db.prepare("SELECT body FROM notes WHERE thread_id = ? ORDER BY rowid").all(threadId).map(row => noteSchema.parse(JSON.parse(jsonRow.parse(row).body)));
  }
  note(threadId: string, noteId: string): FrameNote {
    const row = this.db.prepare("SELECT body FROM notes WHERE thread_id = ? AND id = ?").get(threadId, noteId);
    if (!row) throw new Error("This frame note is no longer available in this thread");
    return noteSchema.parse(JSON.parse(jsonRow.parse(row).body));
  }
  private putNote(note: FrameNote): void {
    this.db.prepare("INSERT INTO notes (id, thread_id, body) VALUES (?, ?, ?) ON CONFLICT(id) DO UPDATE SET body = excluded.body").run(note.id, note.threadId, JSON.stringify(note));
  }
  addNote(input: z.output<typeof noteInputSchema>): FrameNote {
    const version = this.version(input.threadId, input.versionId);
    if (version.media.duration > 0 && input.timestamp > version.media.duration) throw new Error("Note is outside this video's duration");
    return this.db.transaction(() => {
      const noteId = randomUUID(), now = Date.now();
      const {still, ...fields} = input;
      const note: FrameNote = {...fields, id: noteId, demo: version.demo, frameVersionId: version.id, status: "open", createdAt: now, updatedAt: now, carriedFrom: null, stillId: noteId};
      this.db.prepare("INSERT INTO stills (id, body) VALUES (?, ?)").run(noteId, JSON.stringify(still));
      this.putNote(note);
      return note;
    })();
  }
  setStatus(threadId: string, noteId: string, status: NoteStatus): FrameNote {
    const note = {...this.note(threadId, noteId), status, updatedAt: Date.now()};
    this.putNote(note); return note;
  }
  still(threadId: string, noteId: string): Still {
    const note = this.note(threadId, noteId);
    return stillSchema.parse(JSON.parse(jsonRow.parse(this.db.prepare("SELECT body FROM stills WHERE id = ?").get(note.stillId)).body));
  }
  saveSelection(threadId: string, noteIds: string[]): string {
    if (noteIds.some(noteId => !isActionable(this.note(threadId, noteId).status))) throw new Error("Select only open, still wrong, or regressed notes");
    const selectionId = randomUUID();
    this.db.prepare("INSERT INTO selections (id, body) VALUES (?, ?)").run(selectionId, JSON.stringify({threadId, noteIds}));
    return selectionId;
  }
  selection(selectionId: string): {threadId: string; noteIds: string[]} {
    const row = this.db.prepare("SELECT body FROM selections WHERE id = ?").get(selectionId);
    if (!row) throw new Error("This Video Markup selection is no longer available");
    return z.object({threadId: z.string(), noteIds: z.array(z.string())}).parse(JSON.parse(jsonRow.parse(row).body));
  }
}

export function openStore(bb: BbPluginApi): VideoMarkupStore {
  const db = bb.storage.database();
  bb.storage.migrate(db, [
    "CREATE TABLE versions (id TEXT PRIMARY KEY, thread_id TEXT NOT NULL, body TEXT NOT NULL)",
    "CREATE INDEX versions_thread ON versions(thread_id)",
    "CREATE TABLE notes (id TEXT PRIMARY KEY, thread_id TEXT NOT NULL, body TEXT NOT NULL)",
    "CREATE INDEX notes_thread ON notes(thread_id)",
    "CREATE TABLE stills (id TEXT PRIMARY KEY, body TEXT NOT NULL)",
    "CREATE TABLE selections (id TEXT PRIMARY KEY, body TEXT NOT NULL)",
  ]);
  return new VideoMarkupStore(db);
}
