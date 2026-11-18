import { randomBytes } from "node:crypto";

import { defineRpcContract, type BbPluginApi } from "@get-bb/plugin-sdk";
import { z } from "zod";

import type { Folder, Point } from "./core";

/**
 * Canvas Desktop's own data, modeled on Desktop's server: desktop-only folders and icon positions, kept here so they
 * follow you across browsers. Threads, sections and the sidebar's organization come live from bb.
 */

const FOLDER_THREAD_LIMIT = 1000;
const ADD_THREAD_LIMIT = 200;
const LAYOUT_KEY_LIMIT = 250;
const LAYOUT_ENTRY_LIMIT = 2000;

const pointSchema = z.object({ x: z.number().finite(), y: z.number().finite() }).strict();
const nameSchema = z.string().trim().min(1).max(80);
const namedSchema = z.object({ id: z.string(), name: z.string() }).strict();

const folderSchema = z
  .object({ id: z.string(), name: z.string(), threadIds: z.array(z.string()), createdAt: z.number() })
  .strict();

const snapshotSchema = z
  .object({
    folders: z.array(folderSchema),
    layout: z.record(z.string(), pointSchema),
    /** Whether folders this browser kept before the server stored them have been brought over. */
    importedLegacy: z.boolean(),
  })
  .strict();

export type DesktopSnapshot = z.infer<typeof snapshotSchema>;

const okSchema = z.object({ ok: z.literal(true) }).strict();

export const rpcContract = defineRpcContract({
  snapshot: { input: z.null(), output: snapshotSchema },
  createFolder: {
    input: z.object({ name: nameSchema, position: pointSchema.nullable() }).strict(),
    output: folderSchema,
  },
  renameFolder: { input: z.object({ id: z.string(), name: nameSchema }).strict(), output: folderSchema },
  deleteFolder: { input: z.object({ id: z.string() }).strict(), output: okSchema },
  addToFolder: {
    input: z
      .object({
        folderId: z.string(),
        threadIds: z.array(z.string()).min(1).max(ADD_THREAD_LIMIT),
        fromFolderId: z.string().nullable(),
      })
      .strict(),
    output: folderSchema,
  },
  removeFromFolder: { input: z.object({ folderId: z.string(), threadId: z.string() }).strict(), output: folderSchema },
  setLayout: {
    input: z
      .object({
        entries: z
          .record(z.string().max(LAYOUT_KEY_LIMIT), pointSchema.nullable())
          .refine((entries) => Object.keys(entries).length <= LAYOUT_ENTRY_LIMIT, { message: `at most ${LAYOUT_ENTRY_LIMIT} layout entries` }),
      })
      .strict(),
    output: okSchema,
  },
  createSection: { input: z.object({ name: nameSchema, position: pointSchema.nullable() }).strict(), output: namedSchema },
  renameSection: { input: z.object({ id: z.string(), name: nameSchema }).strict(), output: okSchema },
  deleteSection: { input: z.object({ id: z.string() }).strict(), output: okSchema },
  moveToSection: {
    input: z.object({ threadIds: z.array(z.string()).min(1).max(ADD_THREAD_LIMIT), sectionId: z.string().nullable() }).strict(),
    output: okSchema,
  },
  unarchiveThread: { input: z.object({ threadId: z.string() }).strict(), output: okSchema },
  spawnThread: {
    input: z.object({ request: z.record(z.string(), z.unknown()), folderId: z.string().optional() }).strict(),
    output: z.object({ threadId: z.string() }).strict(),
  },
  /** One-time import of the folders the first prototype kept in browser storage. */
  importLegacy: {
    input: z
      .object({
        folders: z
          .array(z.object({ name: nameSchema, threadIds: z.array(z.string()).max(FOLDER_THREAD_LIMIT), position: pointSchema.nullable() }).strict())
          .max(100),
      })
      .strict(),
    output: okSchema,
  },
});

type ThreadSpawnArgs = Parameters<BbPluginApi["sdk"]["threads"]["spawn"]>[0];
type Row = Record<string, unknown>;

export default function plugin(bb: BbPluginApi) {
  const db = bb.storage.database();
  bb.storage.migrate(db, [
    `CREATE TABLE folders (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      created_at INTEGER NOT NULL
    )`,
    `CREATE TABLE folder_threads (
      folder_id TEXT NOT NULL REFERENCES folders(id) ON DELETE CASCADE,
      thread_id TEXT NOT NULL,
      added_at INTEGER NOT NULL,
      PRIMARY KEY (folder_id, thread_id)
    )`,
    `CREATE INDEX folder_threads_thread ON folder_threads(thread_id)`,
  ]);
  db.pragma("foreign_keys = ON");

  const changed = (scope: string) => bb.realtime.publish("changed", { scope });

  function folderFromRow(row: Row, threadIds: string[]): Folder {
    return folderSchema.parse({ id: row.id, name: row.name, threadIds, createdAt: row.created_at });
  }

  function readFolder(id: string): Folder | null {
    const row = db.prepare(`SELECT * FROM folders WHERE id = ?`).get(id) as Row | undefined;
    if (row === undefined) return null;
    const threadIds = (db.prepare(`SELECT thread_id FROM folder_threads WHERE folder_id = ? ORDER BY added_at`).all(id) as Row[]).map((member) =>
      String(member.thread_id),
    );
    return folderFromRow(row, threadIds);
  }

  function requireFolder(id: string): Folder {
    const folder = readFolder(id);
    if (folder === null) throw new Error(`folder ${id} not found`);
    return folder;
  }

  function listFolders(): Folder[] {
    const rows = db.prepare(`SELECT * FROM folders ORDER BY created_at`).all() as Row[];
    const members = db.prepare(`SELECT folder_id, thread_id FROM folder_threads ORDER BY added_at`).all() as Row[];
    const byFolder = new Map<string, string[]>();
    for (const member of members) {
      const list = byFolder.get(String(member.folder_id)) ?? [];
      list.push(String(member.thread_id));
      byFolder.set(String(member.folder_id), list);
    }
    return rows.map((row) => folderFromRow(row, byFolder.get(String(row.id)) ?? []));
  }

  async function readLayout(): Promise<Record<string, Point>> {
    const parsed = z.record(z.string(), pointSchema).safeParse(await bb.storage.kv.get<unknown>("layout"));
    return parsed.success ? parsed.data : {};
  }

  // Layout saves read, merge and write one kv value, so they run one at a time.
  let kvWrites: Promise<unknown> = Promise.resolve();
  function serializeWrite<T>(write: () => Promise<T>): Promise<T> {
    const next = kvWrites.then(write, write);
    kvWrites = next.catch(() => undefined);
    return next;
  }

  function writeLayout(entries: Record<string, Point | null>): Promise<void> {
    return serializeWrite(async () => {
      const layout = await readLayout();
      for (const [key, point] of Object.entries(entries)) {
        if (point === null) delete layout[key];
        else layout[key] = { x: Math.round(point.x), y: Math.round(point.y) };
      }
      await bb.storage.kv.set("layout", layout);
    });
  }

  async function createFolder(name: string, position: Point | null): Promise<Folder> {
    const id = `fld_${randomBytes(6).toString("hex")}`;
    db.prepare(`INSERT INTO folders (id, name, created_at) VALUES (?, ?, ?)`).run(id, name, Date.now());
    if (position !== null) await writeLayout({ [`folder:${id}`]: position });
    changed("folders");
    return requireFolder(id);
  }

  function addToFolder(input: { folderId: string; threadIds: string[]; fromFolderId: string | null }): Folder {
    const folder = requireFolder(input.folderId);
    const arriving = new Set(input.threadIds.filter((threadId) => !folder.threadIds.includes(threadId)));
    if (folder.threadIds.length + arriving.size > FOLDER_THREAD_LIMIT) throw new Error(`${folder.name} can hold at most ${FOLDER_THREAD_LIMIT} threads`);
    const insert = db.prepare(`INSERT OR IGNORE INTO folder_threads (folder_id, thread_id, added_at) VALUES (?, ?, ?)`);
    const remove = db.prepare(`DELETE FROM folder_threads WHERE folder_id = ? AND thread_id = ?`);
    const now = Date.now();
    db.transaction(() => {
      for (const threadId of input.threadIds) {
        insert.run(folder.id, threadId, now);
        if (input.fromFolderId !== null && input.fromFolderId !== folder.id) remove.run(input.fromFolderId, threadId);
      }
    })();
    changed("folders");
    return requireFolder(folder.id);
  }

  bb.rpc.register(rpcContract, {
    async snapshot() {
      const [layout, importedLegacy] = await Promise.all([readLayout(), bb.storage.kv.get<unknown>("importedLegacy")]);
      return { folders: listFolders(), layout, importedLegacy: importedLegacy === true };
    },
    createFolder: ({ name, position }) => createFolder(name, position),
    renameFolder({ id, name }) {
      requireFolder(id);
      db.prepare(`UPDATE folders SET name = ? WHERE id = ?`).run(name, id);
      changed("folders");
      return requireFolder(id);
    },
    async deleteFolder({ id }) {
      requireFolder(id);
      db.prepare(`DELETE FROM folders WHERE id = ?`).run(id);
      await writeLayout({ [`folder:${id}`]: null });
      changed("folders");
      return { ok: true as const };
    },
    addToFolder: (input) => addToFolder(input),
    removeFromFolder({ folderId, threadId }) {
      requireFolder(folderId);
      db.prepare(`DELETE FROM folder_threads WHERE folder_id = ? AND thread_id = ?`).run(folderId, threadId);
      changed("folders");
      return requireFolder(folderId);
    },
    async setLayout({ entries }) {
      await writeLayout(entries);
      changed("layout");
      return { ok: true as const };
    },
    async createSection({ name, position }) {
      const section = await bb.sdk.threadSections.create({ name });
      if (position !== null) await writeLayout({ [`section:${section.id}`]: position });
      changed("sections");
      return { id: section.id, name: section.name };
    },
    async renameSection({ id, name }) {
      await bb.sdk.threadSections.update({ id, name });
      changed("sections");
      return { ok: true as const };
    },
    async deleteSection({ id }) {
      await bb.sdk.threadSections.delete({ id });
      await writeLayout({ [`section:${id}`]: null });
      changed("sections");
      return { ok: true as const };
    },
    async moveToSection({ threadIds, sectionId }) {
      for (const threadId of threadIds) await bb.sdk.threads.update({ threadId, sectionId });
      return { ok: true as const };
    },
    async unarchiveThread({ threadId }) {
      await bb.sdk.threads.unarchive({ threadId });
      return { ok: true as const };
    },
    async spawnThread({ request, folderId }) {
      // Filed in the same call, so a folder that went away fails before any thread exists.
      const folder = folderId === undefined ? null : requireFolder(folderId);
      const thread = await bb.sdk.threads.spawn(request as unknown as ThreadSpawnArgs);
      if (folder !== null) {
        db.prepare(`INSERT OR IGNORE INTO folder_threads (folder_id, thread_id, added_at) VALUES (?, ?, ?)`).run(folder.id, thread.id, Date.now());
        changed("folders");
      }
      return { threadId: thread.id };
    },
    async importLegacy({ folders }) {
      if ((await bb.storage.kv.get<unknown>("importedLegacy")) === true) return { ok: true as const };
      for (const legacy of folders) {
        const folder = await createFolder(legacy.name, legacy.position);
        if (legacy.threadIds.length > 0) addToFolder({ folderId: folder.id, threadIds: legacy.threadIds.slice(0, ADD_THREAD_LIMIT), fromFolderId: null });
      }
      await bb.storage.kv.set("importedLegacy", true);
      changed("folders");
      return { ok: true as const };
    },
  });

  // Threads arrive live through the sidebar; a deleted thread also leaves every desktop folder.
  bb.events.on("thread.deleted", ({ thread }) => {
    db.prepare(`DELETE FROM folder_threads WHERE thread_id = ?`).run(thread.id);
    bb.realtime.publish("changed", { scope: "thread-deleted", threadId: thread.id });
  });

  bb.log.info("Canvas Desktop loaded");
}
