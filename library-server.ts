import { randomUUID } from "node:crypto";

import { defineRpcContract, type BbPluginApi } from "@get-bb/plugin-sdk";
import type Database from "better-sqlite3";
import { z } from "zod";

import {
  COMPOSER_TOKEN_PREFIX,
  LIBRARY_CHANNEL,
  NOTE_DEFAULTS,
  NOTE_MENTIONS,
  PICTURE_MENTIONS,
  noteTitle,
  parsePictureMentionId,
  type LibraryKind,
  type Picture,
  type PictureSummary,
  type StickyNote,
} from "./library";

/** Table definitions, appended to the server's migration list so they keep their order. */
export const LIBRARY_MIGRATIONS = [
  `CREATE TABLE notes (
    id TEXT PRIMARY KEY,
    data TEXT NOT NULL,
    updated_at INTEGER NOT NULL,
    deleted_at INTEGER
  )`,
  `CREATE TABLE pictures (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    format TEXT NOT NULL,
    data BLOB NOT NULL,
    width INTEGER NOT NULL,
    height INTEGER NOT NULL,
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL,
    deleted_at INTEGER
  )`,
  `CREATE TABLE picture_uploads (
    picture_id TEXT NOT NULL,
    project_id TEXT NOT NULL,
    version INTEGER NOT NULL,
    path TEXT NOT NULL,
    PRIMARY KEY (picture_id, project_id)
  )`,
];

const NOTE_TEXT_LIMIT = 100_000;
const PICTURE_BYTES_LIMIT = 6 * 1024 * 1024;
const SVG_LIMIT = 512 * 1024;
const PICTURE_SIDE_LIMIT = 4096;

const noteSchema = z
  .object({
    id: z.string().min(1).max(100),
    text: z.string().max(NOTE_TEXT_LIMIT),
    side: z.enum(["left", "right"]),
    x: z.number().finite(),
    y: z.number().finite(),
    width: z.number().finite(),
    height: z.number().finite(),
    tone: z.number().int().min(0).max(16),
    saved: z.boolean().optional(),
    hidden: z.boolean().optional(),
    updatedAt: z.number().finite().optional(),
  })
  .strict();

const pictureSummarySchema = z
  .object({
    id: z.string(),
    name: z.string(),
    width: z.number(),
    height: z.number(),
    format: z.enum(["png", "svg"]),
    updatedAt: z.number(),
  })
  .strict();

const pictureNameSchema = z.string().trim().min(1).max(80);
/** bb files a thread sent with "No project" here. */
const PERSONAL_PROJECT_ID = "proj_personal";
/** New-thread message boxes remembered at once; the oldest is forgotten first. */
const COMPOSER_LIMIT = 200;
const sideSchema = z.number().int().min(1).max(PICTURE_SIDE_LIMIT);
const okSchema = z.object({ ok: z.literal(true) }).strict();

export const libraryContract = defineRpcContract({
  listNotes: { input: z.null(), output: z.object({ notes: z.array(noteSchema) }).strict() },
  /** Stores the note unless the server holds a newer copy, and returns whichever copy won. */
  saveNote: { input: z.object({ note: noteSchema }).strict(), output: z.object({ note: noteSchema }).strict() },
  deleteNote: { input: z.object({ id: z.string() }).strict(), output: okSchema },
  /** Moves notes saved in a browser before the server kept them; ids the server already has are left alone. */
  importNotes: {
    input: z.object({ notes: z.array(noteSchema).max(500) }).strict(),
    output: z.object({ imported: z.number() }).strict(),
  },
  listPictures: { input: z.null(), output: z.object({ pictures: z.array(pictureSummarySchema) }).strict() },
  getPicture: {
    input: z.object({ id: z.string() }).strict(),
    output: pictureSummarySchema.extend({ mimeType: z.string(), dataBase64: z.string() }).strict(),
  },
  savePicture: {
    input: z
      .object({
        id: z.string().nullable(),
        name: pictureNameSchema,
        width: sideSchema,
        height: sideSchema,
        pngBase64: z.string().max(Math.ceil((PICTURE_BYTES_LIMIT * 4) / 3)),
      })
      .strict(),
    output: pictureSummarySchema,
  },
  deletePicture: { input: z.object({ id: z.string() }).strict(), output: okSchema },
  /** A new-thread message box reports its project whenever the user picks one, for pictures mentioned in it. */
  setComposerProject: {
    input: z.object({ token: z.string().startsWith(COMPOSER_TOKEN_PREFIX).max(80), projectId: z.string().min(1).max(100) }).strict(),
    output: okSchema,
  },
});

type Row = Record<string, unknown>;

function noteFromRow(row: Row): StickyNote {
  return { ...(JSON.parse(String(row.data)) as StickyNote), updatedAt: Number(row.updated_at) };
}

function summaryFromRow(row: Row): PictureSummary {
  return {
    id: String(row.id),
    name: String(row.name),
    width: Number(row.width),
    height: Number(row.height),
    format: row.format === "svg" ? "svg" : "png",
    updatedAt: Number(row.updated_at),
  };
}

function svgSize(svg: string): { width: number; height: number } {
  const attribute = (name: string) => Number(new RegExp(`<svg[^>]*\\s${name}="([\\d.]+)`, "u").exec(svg)?.[1]);
  const viewBox = /<svg[^>]*\sviewBox="[\d.\s-]*?([\d.]+)\s+([\d.]+)"/u.exec(svg);
  const clamp = (value: number, fallback: number) =>
    Number.isFinite(value) && value > 0 ? Math.min(PICTURE_SIDE_LIMIT, Math.round(value)) : fallback;
  return {
    width: clamp(attribute("width"), clamp(Number(viewBox?.[1]), 640)),
    height: clamp(attribute("height"), clamp(Number(viewBox?.[2]), 480)),
  };
}

function slug(name: string): string {
  return name.replace(/[^a-zA-Z0-9._-]+/gu, "-").replace(/^-+|-+$/gu, "").slice(0, 60) || "picture";
}

/**
 * Note pads and Paint pictures: storage, the app's rpc, the `@` mention providers that hand them to agents, and the
 * agent tools that read and change them.
 */
export function registerLibrary(bb: BbPluginApi, db: Database.Database) {
  const changed = (kind: LibraryKind) => bb.realtime.publish(LIBRARY_CHANNEL, { kind });
  /** Each new-thread message box's current project, by the token its picture mentions carry. */
  const composerProjects = new Map<string, string>();

  const listNotes = (): StickyNote[] =>
    (db.prepare(`SELECT * FROM notes WHERE deleted_at IS NULL ORDER BY updated_at`).all() as Row[]).map(noteFromRow);

  const readNote = (id: string): StickyNote | null => {
    const row = db.prepare(`SELECT * FROM notes WHERE id = ? AND deleted_at IS NULL`).get(id) as Row | undefined;
    return row === undefined ? null : noteFromRow(row);
  };

  function writeNote(note: StickyNote): StickyNote {
    const stored = { ...note, updatedAt: note.updatedAt ?? Date.now() };
    const { updatedAt, ...data } = stored;
    db.prepare(
      `INSERT INTO notes (id, data, updated_at, deleted_at) VALUES (?, ?, ?, NULL)
       ON CONFLICT(id) DO UPDATE SET data = excluded.data, updated_at = excluded.updated_at, deleted_at = NULL`,
    ).run(stored.id, JSON.stringify(data), updatedAt);
    return stored;
  }

  function saveNote(note: StickyNote): StickyNote {
    const current = db.prepare(`SELECT * FROM notes WHERE id = ?`).get(note.id) as Row | undefined;
    if (current !== undefined && current.deleted_at === null && Number(current.updated_at) > (note.updatedAt ?? 0)) {
      return noteFromRow(current);
    }
    const stored = writeNote(note);
    changed("notes");
    return stored;
  }

  const listPictures = (): PictureSummary[] =>
    (db.prepare(`SELECT id, name, format, width, height, updated_at FROM pictures WHERE deleted_at IS NULL ORDER BY updated_at DESC`).all() as Row[]).map(summaryFromRow);

  function readPicture(id: string): Picture | null {
    const row = db.prepare(`SELECT * FROM pictures WHERE id = ? AND deleted_at IS NULL`).get(id) as Row | undefined;
    if (row === undefined) return null;
    const summary = summaryFromRow(row);
    return {
      ...summary,
      mimeType: summary.format === "svg" ? "image/svg+xml" : "image/png",
      dataBase64: Buffer.from(row.data as Uint8Array).toString("base64"),
    };
  }

  function requirePicture(id: string): Picture {
    const picture = readPicture(id);
    if (picture === null) throw new Error(`No Paint picture ${id}.`);
    return picture;
  }

  function storePicture(args: { id: string | null; name: string; format: "png" | "svg"; data: Buffer; width: number; height: number }): PictureSummary {
    const now = Date.now();
    const id = args.id ?? `pic_${randomUUID()}`;
    db.prepare(
      `INSERT INTO pictures (id, name, format, data, width, height, created_at, updated_at, deleted_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, NULL)
       ON CONFLICT(id) DO UPDATE SET name = excluded.name, format = excluded.format, data = excluded.data,
         width = excluded.width, height = excluded.height, updated_at = excluded.updated_at, deleted_at = NULL`,
    ).run(id, args.name, args.format, args.data, args.width, args.height, now, now);
    changed("pictures");
    return summaryFromRow(db.prepare(`SELECT * FROM pictures WHERE id = ?`).get(id) as Row);
  }

  /** A PNG picture as a project attachment, which bb copies to the agent's machine with the message. */
  async function uploadPicture(picture: Picture, projectId: string): Promise<string> {
    const cached = db
      .prepare(`SELECT path FROM picture_uploads WHERE picture_id = ? AND project_id = ? AND version = ?`)
      .get(picture.id, projectId, picture.updatedAt) as Row | undefined;
    if (cached !== undefined) return String(cached.path);
    const uploaded = await bb.sdk.projects.attachments.upload({
      projectId,
      clientFile: Buffer.from(picture.dataBase64, "base64"),
      filename: `${slug(picture.name)}.png`,
      mimeType: "image/png",
    });
    db.prepare(
      `INSERT INTO picture_uploads (picture_id, project_id, version, path) VALUES (?, ?, ?, ?)
       ON CONFLICT(picture_id, project_id) DO UPDATE SET version = excluded.version, path = excluded.path`,
    ).run(picture.id, projectId, picture.updatedAt, uploaded.path);
    return uploaded.path;
  }

  bb.rpc.register(libraryContract, {
    listNotes: async () => ({ notes: listNotes() }),
    saveNote: async ({ note }) => ({ note: saveNote(note) }),
    async deleteNote({ id }) {
      db.prepare(`UPDATE notes SET deleted_at = ? WHERE id = ?`).run(Date.now(), id);
      changed("notes");
      return { ok: true as const };
    },
    async importNotes({ notes }) {
      const known = db.prepare(`SELECT 1 FROM notes WHERE id = ?`);
      let imported = 0;
      for (const note of notes) {
        if (known.get(note.id) !== undefined) continue;
        writeNote(note);
        imported += 1;
      }
      if (imported > 0) changed("notes");
      return { imported };
    },
    listPictures: async () => ({ pictures: listPictures() }),
    getPicture: async ({ id }) => requirePicture(id),
    async savePicture({ id, name, width, height, pngBase64 }) {
      const data = Buffer.from(pngBase64, "base64");
      if (data.byteLength > PICTURE_BYTES_LIMIT) throw new Error("The picture is too large to save.");
      return storePicture({ id, name, format: "png", data, width, height });
    },
    async deletePicture({ id }) {
      db.prepare(`UPDATE pictures SET deleted_at = ? WHERE id = ?`).run(Date.now(), id);
      changed("pictures");
      return { ok: true as const };
    },
    async setComposerProject({ token, projectId }) {
      composerProjects.delete(token);
      composerProjects.set(token, projectId);
      if (composerProjects.size > COMPOSER_LIMIT) composerProjects.delete(composerProjects.keys().next().value!);
      return { ok: true as const };
    },
  });

  const matches = (query: string, ...fields: string[]) => {
    const needle = query.trim().toLocaleLowerCase();
    return needle === "" || fields.some((field) => field.toLocaleLowerCase().includes(needle));
  };

  bb.ui.registerMentionProvider({
    id: NOTE_MENTIONS,
    label: "Note pads",
    search: ({ query }) =>
      listNotes()
        .reverse()
        .filter((note) => note.text.trim() !== "" && matches(query, note.text))
        .slice(0, 20)
        .map((note) => ({ id: note.id, title: noteTitle(note.text), subtitle: "Note pad" })),
    resolve(itemId) {
      const note = readNote(itemId);
      if (note === null) throw new Error("That note pad was deleted.");
      return {
        context: [
          `Desktop note pad "${noteTitle(note.text)}" (id ${note.id}). The user wrote:`,
          "",
          note.text,
          "",
          `To change this note, use desktop_note_write with id ${note.id}.`,
        ].join("\n"),
      };
    },
  });

  bb.ui.registerMentionProvider({
    id: PICTURE_MENTIONS,
    label: "Paint pictures",
    search: ({ query, threadId, projectId }) =>
      listPictures()
        .filter((picture) => matches(query, picture.name))
        .slice(0, 20)
        .map((picture) => ({
          id: threadId !== null ? `${picture.id}@${threadId}` : projectId !== null ? `${picture.id}@${projectId}` : picture.id,
          title: picture.name,
          subtitle: `Paint picture · ${picture.width} × ${picture.height}`,
        })),
    async resolve(itemId) {
      const target = parsePictureMentionId(itemId);
      const picture = readPicture(target.pictureId);
      if (picture === null) throw new Error("That Paint picture was deleted.");
      const about = `Desktop Paint picture "${picture.name}" (id ${picture.id}), ${picture.width} × ${picture.height} pixels.`;
      if (picture.format === "svg") {
        return {
          context: `${about} It is an SVG drawing:\n\n${Buffer.from(picture.dataBase64, "base64").toString("utf8")}`,
        };
      }
      // A new thread goes to whichever project its box has selected now; one the server never heard about (it restarted
      // since) is most likely "No project", which bb files under the personal project.
      const projectId =
        target.threadId !== null
          ? (await bb.sdk.threads.get({ threadId: target.threadId })).projectId
          : target.composerToken !== null
            ? (composerProjects.get(target.composerToken) ?? PERSONAL_PROJECT_ID)
            : target.projectId;
      if (projectId === null) {
        return { context: `${about} Use desktop_picture_view with id ${picture.id} to see it.` };
      }
      const path = await uploadPicture(picture, projectId);
      return {
        context: `${about} It is attached below. To draw a new version for the user, use desktop_picture_create.`,
        experimental_images: [{ type: "localImage" as const, path }],
      };
    },
  });

  const notFound = (what: string) => ({ content: [{ type: "text" as const, text: what }], isError: true });

  bb.agents.registerTool({
    name: "desktop_library_list",
    description: "List the user's Desktop note pads and Paint pictures with their ids.",
    parameters: z.object({}),
    presentation: { label: { pending: "Listing note pads and pictures", completed: "Listed note pads and pictures" } },
    execute() {
      const notes = listNotes().reverse();
      const pictures = listPictures();
      return [
        `Note pads (${notes.length}):`,
        ...notes.map((note) => `- ${note.id}\t${noteTitle(note.text)}`),
        "",
        `Paint pictures (${pictures.length}):`,
        ...pictures.map((picture) => `- ${picture.id}\t${picture.name}\t${picture.width} × ${picture.height}\t${picture.format}`),
      ].join("\n");
    },
  });

  bb.agents.registerTool({
    name: "desktop_note_read",
    description: "Read one of the user's Desktop note pads by id.",
    parameters: z.object({ id: z.string() }),
    presentation: { label: { pending: "Reading a note pad", completed: "Read a note pad" } },
    execute({ id }) {
      const note = readNote(id);
      return note === null ? notFound(`No note pad ${id}.`) : note.text;
    },
  });

  bb.agents.registerTool({
    name: "desktop_note_write",
    description:
      "Write a Desktop note pad the user sees on screen. Pass an id to replace (or append to) that note's text; leave it out to open a new note pad. Returns the note's id.",
    parameters: z.object({
      id: z.string().optional(),
      text: z.string().max(NOTE_TEXT_LIMIT),
      append: z.boolean().optional().describe("Add the text to the end of the note instead of replacing it."),
    }),
    presentation: { label: { pending: "Writing a note pad", completed: "Wrote a note pad" } },
    execute({ id, text, append }) {
      const now = Date.now();
      if (id !== undefined) {
        const note = readNote(id);
        if (note === null) return notFound(`No note pad ${id}.`);
        const next = append === true ? `${note.text}${note.text.endsWith("\n") || note.text === "" ? "" : "\n"}${text}` : text;
        writeNote({ ...note, text: next, hidden: false, updatedAt: now });
        changed("notes");
        return `Updated note pad ${id} ("${noteTitle(next)}").`;
      }
      const note: StickyNote = { id: randomUUID(), text, ...NOTE_DEFAULTS, saved: true, hidden: false, updatedAt: now };
      writeNote(note);
      changed("notes");
      return `Opened note pad ${note.id} ("${noteTitle(text)}") on the user's Desktop.`;
    },
  });

  bb.agents.registerTool({
    name: "desktop_picture_view",
    description: "Look at one of the user's Paint pictures by id.",
    parameters: z.object({ id: z.string() }),
    presentation: { label: { pending: "Looking at a picture", completed: "Looked at a picture" } },
    execute({ id }) {
      const picture = readPicture(id);
      if (picture === null) return notFound(`No Paint picture ${id}.`);
      const about = `Paint picture "${picture.name}", ${picture.width} × ${picture.height} pixels.`;
      if (picture.format === "svg") {
        return `${about} SVG source:\n\n${Buffer.from(picture.dataBase64, "base64").toString("utf8")}`;
      }
      return {
        content: [
          { type: "text", text: about },
          { type: "image", data: picture.dataBase64, mimeType: "image/png" },
        ],
      };
    },
  });

  bb.agents.registerTool({
    name: "desktop_picture_create",
    description:
      "Add a picture to the user's Paint as SVG markup (a sketch, mockup, or diagram). It appears under File in Paint, where the user can open, edit and save it. Pass an id to replace a picture you made earlier. Returns the picture's id.",
    parameters: z.object({
      name: pictureNameSchema,
      svg: z.string().max(SVG_LIMIT).describe("A complete <svg> document with width and height or a viewBox."),
      id: z.string().optional(),
    }),
    presentation: { label: { pending: "Drawing a picture", completed: "Drew a picture" } },
    execute({ name, svg, id }) {
      const trimmed = svg.trim();
      if (!/^(<\?xml[^>]*>\s*)?<svg[\s>]/u.test(trimmed)) return notFound("The picture must be an <svg> document.");
      if (/<script|\son[a-z]+\s*=/iu.test(trimmed)) return notFound("The SVG can't contain scripts or event handlers.");
      if (id !== undefined && readPicture(id) === null) return notFound(`No Paint picture ${id}.`);
      const picture = storePicture({ id: id ?? null, name, format: "svg", data: Buffer.from(trimmed, "utf8"), ...svgSize(trimmed) });
      return `Saved "${picture.name}" (${picture.id}, ${picture.width} × ${picture.height}). The user can open it from Paint's File menu.`;
    },
  });
}

export const LIBRARY_TOOLS = [
  "desktop_library_list",
  "desktop_note_read",
  "desktop_note_write",
  "desktop_picture_view",
  "desktop_picture_create",
] as const;
