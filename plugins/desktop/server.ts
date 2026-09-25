import { randomBytes, timingSafeEqual } from "node:crypto";
import { parseArgs } from "node:util";

import { defineRpcContract, type BbPluginApi } from "@get-bb/plugin-sdk";
import { z } from "zod";

import {
  webhookMessage,
  type DesktopThread,
  type Folder,
  type Point,
  type Preferences,
  type Webhook,
} from "./core";

const MAX_WEBHOOK_BODY_BYTES = 256 * 1024;
const ACTIVE_THREAD_LIMIT = 500;
const ARCHIVED_THREAD_LIMIT = 200;

const pointSchema = z.object({ x: z.number().finite(), y: z.number().finite() }).strict();
const preferencesSchema = z
  .object({
    sort: z.enum(["sidebar", "updated", "created", "alpha"]),
    organize: z.enum(["sidebar", "section", "project", "machine"]),
    lifecycle: z.enum(["sidebar", "active", "archived", "all"]),
  })
  .strict();
const DEFAULT_PREFERENCES: Preferences = { sort: "sidebar", organize: "sidebar", lifecycle: "sidebar" };
const namedSchema = z.object({ id: z.string(), name: z.string() }).strict();
const nameSchema = z.string().trim().min(1).max(80);

const folderSchema = z
  .object({
    id: z.string(),
    name: z.string(),
    hideFromSidebar: z.boolean(),
    threadIds: z.array(z.string()),
    createdAt: z.number(),
  })
  .strict();

const threadSchema = z
  .object({
    id: z.string(),
    title: z.string(),
    projectId: z.string(),
    sectionId: z.string().nullable(),
    hostId: z.string().nullable(),
    providerId: z.string(),
    status: z.enum(["active", "error", "idle", "starting", "stopping"]),
    isArchived: z.boolean(),
    isHidden: z.boolean(),
    isUnread: z.boolean(),
    needsInput: z.boolean(),
    createdAt: z.number(),
    updatedAt: z.number(),
  })
  .strict();

const webhookSchema = z
  .object({
    id: z.string(),
    name: z.string(),
    threadId: z.string(),
    secret: z.string(),
    unread: z.number(),
    lastEventAt: z.number().nullable(),
    createdAt: z.number(),
  })
  .strict();

const snapshotSchema = z
  .object({
    folders: z.array(folderSchema),
    webhooks: z.array(webhookSchema),
    threads: z.array(threadSchema),
    sections: z.array(namedSchema),
    projects: z.array(namedSchema),
    machines: z.array(namedSchema),
    layout: z.record(z.string(), pointSchema),
    preferences: preferencesSchema,
    webhookBaseUrl: z.string(),
  })
  .strict();

export type DesktopSnapshot = z.infer<typeof snapshotSchema>;

const okSchema = z.object({ ok: z.literal(true) }).strict();

export const rpcContract = defineRpcContract({
  snapshot: { input: z.null(), output: snapshotSchema },
  createFolder: {
    input: z
      .object({
        name: nameSchema,
        hideFromSidebar: z.boolean(),
        position: pointSchema.nullable(),
      })
      .strict(),
    output: folderSchema,
  },
  updateFolder: {
    input: z
      .object({
        id: z.string(),
        name: nameSchema.optional(),
        hideFromSidebar: z.boolean().optional(),
      })
      .strict(),
    output: folderSchema,
  },
  deleteFolder: { input: z.object({ id: z.string() }).strict(), output: okSchema },
  addToFolder: {
    input: z
      .object({
        folderId: z.string(),
        threadIds: z.array(z.string()).min(1).max(200),
        fromFolderId: z.string().nullable(),
      })
      .strict(),
    output: folderSchema,
  },
  removeFromFolder: {
    input: z.object({ folderId: z.string(), threadId: z.string() }).strict(),
    output: folderSchema,
  },
  setLayout: {
    input: z
      .object({ entries: z.record(z.string(), pointSchema.nullable()) })
      .strict(),
    output: okSchema,
  },
  setPreferences: { input: preferencesSchema.partial().strict(), output: okSchema },
  createSection: { input: z.object({ name: nameSchema }).strict(), output: namedSchema },
  renameSection: { input: z.object({ id: z.string(), name: nameSchema }).strict(), output: okSchema },
  deleteSection: { input: z.object({ id: z.string() }).strict(), output: okSchema },
  moveToSection: {
    input: z
      .object({ threadIds: z.array(z.string()).min(1).max(200), sectionId: z.string().nullable() })
      .strict(),
    output: okSchema,
  },
  createWebhook: {
    input: z
      .object({
        name: nameSchema,
        threadId: z.string().min(1),
        position: pointSchema.nullable(),
      })
      .strict(),
    output: webhookSchema,
  },
  deleteWebhook: { input: z.object({ id: z.string() }).strict(), output: okSchema },
  markRead: {
    input: z
      .object({
        threadId: z.string().nullable(),
        webhookId: z.string().nullable(),
      })
      .strict(),
    output: okSchema,
  },
  spawnThread: {
    input: z.object({ request: z.record(z.string(), z.unknown()) }).strict(),
    output: z.object({ threadId: z.string() }).strict(),
  },
});

type ThreadSpawnArgs = Parameters<BbPluginApi["sdk"]["threads"]["spawn"]>[0];

type Row = Record<string, unknown>;

function folderFromRow(row: Row, threadIds: string[]): Folder {
  return folderSchema.parse({
    id: row.id,
    name: row.name,
    hideFromSidebar: row.hide_from_sidebar === 1,
    threadIds,
    createdAt: row.created_at,
  });
}

function webhookFromRow(row: Row): Webhook {
  return webhookSchema.parse({
    id: row.id,
    name: row.name,
    threadId: row.thread_id,
    secret: row.secret,
    unread: row.unread,
    lastEventAt: row.last_event_at,
    createdAt: row.created_at,
  });
}

interface ListedThread {
  id: string;
  title: string | null;
  titleFallback: string | null;
  projectId: string;
  sectionId: string | null;
  environmentHostId: string | null;
  providerId: string;
  status: DesktopThread["status"];
  archivedAt: number | null;
  visibility: "hidden" | "visible";
  lastReadAt: number | null;
  latestAttentionAt: number;
  hasPendingInteraction: boolean;
  createdAt: number;
  updatedAt: number;
}

export function toDesktopThread(thread: ListedThread): DesktopThread {
  return {
    id: thread.id,
    title: thread.title ?? thread.titleFallback ?? "Untitled thread",
    projectId: thread.projectId,
    sectionId: thread.sectionId,
    hostId: thread.environmentHostId,
    providerId: thread.providerId,
    status: thread.status,
    isArchived: thread.archivedAt !== null,
    isHidden: thread.visibility === "hidden",
    isUnread:
      thread.lastReadAt === null || thread.lastReadAt < thread.latestAttentionAt,
    needsInput: thread.hasPendingInteraction,
    createdAt: thread.createdAt,
    updatedAt: thread.updatedAt,
  };
}

function secretsMatch(expected: string, actual: string): boolean {
  const left = Buffer.from(expected);
  const right = Buffer.from(actual);
  return left.length === right.length && timingSafeEqual(left, right);
}

const CLI_USAGE = [
  "Usage:",
  "  bb desktop folders",
  "  bb desktop folder create <name> [--hide-from-sidebar]",
  "  bb desktop folder add <folder-id> <thread-id>...",
  "  bb desktop folder remove <folder-id> <thread-id>",
  "  bb desktop folder delete <folder-id>",
  "  bb desktop webhooks",
  "  bb desktop webhook create <name> [--thread <thread-id>]",
  "  bb desktop webhook delete <webhook-id>",
].join("\n");

export default function plugin(bb: BbPluginApi) {
  const settings = bb.settings.define({
    publicBaseUrl: {
      type: "string",
      label: "Public base URL for webhooks",
      description:
        "Origin external services use to reach this bb server, such as https://example.getbb.app. Leave empty to show the server's loopback URL.",
      default: "",
    },
  });

  const db = bb.storage.database();
  bb.storage.migrate(db, [
    `CREATE TABLE folders (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      kind TEXT NOT NULL,
      lifecycle TEXT NOT NULL,
      hide_from_sidebar INTEGER NOT NULL DEFAULT 0,
      created_at INTEGER NOT NULL
    )`,
    `CREATE TABLE folder_threads (
      folder_id TEXT NOT NULL REFERENCES folders(id) ON DELETE CASCADE,
      thread_id TEXT NOT NULL,
      added_at INTEGER NOT NULL,
      PRIMARY KEY (folder_id, thread_id)
    )`,
    `CREATE INDEX folder_threads_thread ON folder_threads(thread_id)`,
    `CREATE TABLE webhooks (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      thread_id TEXT NOT NULL,
      secret TEXT NOT NULL,
      unread INTEGER NOT NULL DEFAULT 0,
      last_event_at INTEGER,
      created_at INTEGER NOT NULL
    )`,
    `CREATE TABLE notifications (
      id TEXT PRIMARY KEY,
      thread_id TEXT NOT NULL,
      kind TEXT NOT NULL,
      title TEXT NOT NULL,
      body TEXT NOT NULL,
      created_at INTEGER NOT NULL,
      read INTEGER NOT NULL DEFAULT 0
    )`,
    `CREATE INDEX notifications_created ON notifications(created_at DESC)`,
    `DELETE FROM folders WHERE kind = 'smart'`,
    `DROP TABLE notifications`,
  ]);
  db.pragma("foreign_keys = ON");

  const changed = (scope: string) => bb.realtime.publish("changed", { scope });

  function readFolder(id: string): Folder | null {
    const row = db.prepare(`SELECT * FROM folders WHERE id = ?`).get(id) as Row | undefined;
    if (row === undefined) return null;
    const threadIds = (
      db
        .prepare(`SELECT thread_id FROM folder_threads WHERE folder_id = ? ORDER BY added_at`)
        .all(id) as Row[]
    ).map((member) => String(member.thread_id));
    return folderFromRow(row, threadIds);
  }

  function requireFolder(id: string): Folder {
    const folder = readFolder(id);
    if (folder === null) throw new Error(`folder ${id} not found`);
    return folder;
  }

  function listFolders(): Folder[] {
    const rows = db.prepare(`SELECT * FROM folders ORDER BY created_at`).all() as Row[];
    const members = db
      .prepare(`SELECT folder_id, thread_id FROM folder_threads ORDER BY added_at`)
      .all() as Row[];
    const byFolder = new Map<string, string[]>();
    for (const member of members) {
      const list = byFolder.get(String(member.folder_id)) ?? [];
      list.push(String(member.thread_id));
      byFolder.set(String(member.folder_id), list);
    }
    return rows.map((row) => folderFromRow(row, byFolder.get(String(row.id)) ?? []));
  }

  function listWebhooks(): Webhook[] {
    return (db.prepare(`SELECT * FROM webhooks ORDER BY created_at`).all() as Row[]).map(
      webhookFromRow,
    );
  }

  async function readLayout(): Promise<Record<string, Point>> {
    const stored = await bb.storage.kv.get<unknown>("layout");
    const parsed = z.record(z.string(), pointSchema).safeParse(stored);
    return parsed.success ? parsed.data : {};
  }

  async function writeLayout(entries: Record<string, Point | null>): Promise<void> {
    const layout = await readLayout();
    for (const [key, point] of Object.entries(entries)) {
      if (point === null) delete layout[key];
      else layout[key] = { x: Math.round(point.x), y: Math.round(point.y) };
    }
    await bb.storage.kv.set("layout", layout);
  }

  async function readPreferences(): Promise<Preferences> {
    const parsed = preferencesSchema.safeParse(await bb.storage.kv.get<unknown>("preferences"));
    return parsed.success ? parsed.data : DEFAULT_PREFERENCES;
  }

  async function listOrganization() {
    const [sections, projects, hosts] = await Promise.all([
      bb.sdk.threadSections.list(),
      bb.sdk.projects.list({ includePersonal: true }),
      bb.sdk.hosts.list(),
    ]);
    const named = (items: readonly { id: string; name: string }[]) =>
      items.map(({ id, name }) => ({ id, name }));
    return { sections: named(sections), projects: named(projects), machines: named(hosts) };
  }

  async function listThreads(): Promise<DesktopThread[]> {
    const [active, archived] = await Promise.all([
      bb.sdk.threads.list({
        hasParent: false,
        includeHidden: true,
        limit: ACTIVE_THREAD_LIMIT,
      }),
      bb.sdk.threads.list({
        archived: true,
        hasParent: false,
        includeHidden: true,
        limit: ARCHIVED_THREAD_LIMIT,
      }),
    ]);
    const seen = new Set<string>();
    const threads: DesktopThread[] = [];
    for (const thread of [...active, ...archived]) {
      if (thread.deletedAt !== null || seen.has(thread.id)) continue;
      seen.add(thread.id);
      threads.push(toDesktopThread(thread));
    }
    return threads;
  }

  async function setVisibility(threadId: string, visibility: "hidden" | "visible") {
    try {
      await bb.sdk.threads.update({ threadId, visibility });
    } catch (error) {
      bb.log.warn(
        `could not set ${threadId} ${visibility}: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  function isInHidingFolder(threadId: string, exceptFolderId: string | null): boolean {
    const row = db
      .prepare(
        `SELECT 1 FROM folder_threads ft JOIN folders f ON f.id = ft.folder_id
         WHERE ft.thread_id = ? AND f.hide_from_sidebar = 1 AND f.id IS NOT ?
         LIMIT 1`,
      )
      .get(threadId, exceptFolderId);
    return row !== undefined;
  }

  async function releaseVisibility(threadIds: readonly string[], folderId: string | null) {
    for (const threadId of threadIds) {
      if (!isInHidingFolder(threadId, folderId)) await setVisibility(threadId, "visible");
    }
  }

  async function webhookBaseUrl(): Promise<string> {
    const { publicBaseUrl } = await settings.get();
    const base = publicBaseUrl.trim().replace(/\/+$/, "") || bb.server.loopbackBaseUrl;
    return `${base}/api/v1/plugins/${encodeURIComponent(bb.pluginId)}/http/hook`;
  }

  async function createFolder(input: {
    name: string;
    hideFromSidebar: boolean;
    position: Point | null;
  }): Promise<Folder> {
    const id = `fld_${randomBytes(6).toString("hex")}`;
    db.prepare(
      `INSERT INTO folders (id, name, kind, lifecycle, hide_from_sidebar, created_at)
       VALUES (?, ?, 'manual', 'all', ?, ?)`,
    ).run(id, input.name, input.hideFromSidebar ? 1 : 0, Date.now());
    if (input.position !== null) await writeLayout({ [`folder:${id}`]: input.position });
    changed("folders");
    return requireFolder(id);
  }

  async function addToFolder(input: {
    folderId: string;
    threadIds: string[];
    fromFolderId: string | null;
  }): Promise<Folder> {
    const folder = requireFolder(input.folderId);
    const insert = db.prepare(
      `INSERT OR IGNORE INTO folder_threads (folder_id, thread_id, added_at) VALUES (?, ?, ?)`,
    );
    const remove = db.prepare(
      `DELETE FROM folder_threads WHERE folder_id = ? AND thread_id = ?`,
    );
    const now = Date.now();
    db.transaction(() => {
      for (const threadId of input.threadIds) {
        insert.run(folder.id, threadId, now);
        if (input.fromFolderId !== null && input.fromFolderId !== folder.id) {
          remove.run(input.fromFolderId, threadId);
        }
      }
    })();
    if (folder.hideFromSidebar) {
      for (const threadId of input.threadIds) await setVisibility(threadId, "hidden");
    } else if (input.fromFolderId !== null) {
      await releaseVisibility(input.threadIds, null);
    }
    changed("folders");
    return requireFolder(folder.id);
  }

  async function removeFromFolder(folderId: string, threadId: string): Promise<Folder> {
    const folder = requireFolder(folderId);
    db.prepare(`DELETE FROM folder_threads WHERE folder_id = ? AND thread_id = ?`).run(
      folderId,
      threadId,
    );
    if (folder.hideFromSidebar) await releaseVisibility([threadId], folderId);
    changed("folders");
    return requireFolder(folderId);
  }

  async function deleteFolder(id: string): Promise<void> {
    const folder = requireFolder(id);
    db.prepare(`DELETE FROM folders WHERE id = ?`).run(id);
    if (folder.hideFromSidebar) await releaseVisibility(folder.threadIds, id);
    await writeLayout({ [`folder:${id}`]: null });
    changed("folders");
  }

  async function createWebhook(input: {
    name: string;
    threadId: string;
    position: Point | null;
  }): Promise<Webhook> {
    await bb.sdk.threads.get({ threadId: input.threadId });
    const id = `whk_${randomBytes(6).toString("hex")}`;
    db.prepare(
      `INSERT INTO webhooks (id, name, thread_id, secret, unread, last_event_at, created_at)
       VALUES (?, ?, ?, ?, 0, NULL, ?)`,
    ).run(id, input.name, input.threadId, randomBytes(24).toString("base64url"), Date.now());
    if (input.position !== null) await writeLayout({ [`webhook:${id}`]: input.position });
    changed("webhooks");
    return webhookFromRow(db.prepare(`SELECT * FROM webhooks WHERE id = ?`).get(id) as Row);
  }

  async function deleteWebhook(id: string): Promise<void> {
    db.prepare(`DELETE FROM webhooks WHERE id = ?`).run(id);
    await writeLayout({ [`webhook:${id}`]: null });
    changed("webhooks");
  }

  function markRead(threadId: string | null, webhookId: string | null) {
    if (threadId !== null) {
      db.prepare(`UPDATE webhooks SET unread = 0 WHERE thread_id = ?`).run(threadId);
    }
    if (webhookId !== null) {
      db.prepare(`UPDATE webhooks SET unread = 0 WHERE id = ?`).run(webhookId);
    }
    if (threadId === null && webhookId === null) {
      db.prepare(`UPDATE webhooks SET unread = 0`).run();
    }
    changed("webhooks");
  }

  bb.rpc.register(rpcContract, {
    async snapshot() {
      const [threads, organization, layout, preferences, baseUrl] = await Promise.all([
        listThreads(),
        listOrganization(),
        readLayout(),
        readPreferences(),
        webhookBaseUrl(),
      ]);
      return {
        folders: listFolders(),
        webhooks: listWebhooks(),
        threads,
        ...organization,
        layout,
        preferences,
        webhookBaseUrl: baseUrl,
      };
    },
    createFolder: (input) => createFolder(input),
    async updateFolder(input) {
      const folder = requireFolder(input.id);
      const hide = input.hideFromSidebar ?? folder.hideFromSidebar;
      db.prepare(`UPDATE folders SET name = ?, hide_from_sidebar = ? WHERE id = ?`).run(
        input.name ?? folder.name,
        hide ? 1 : 0,
        folder.id,
      );
      if (hide && !folder.hideFromSidebar) {
        for (const threadId of folder.threadIds) await setVisibility(threadId, "hidden");
      } else if (!hide && folder.hideFromSidebar) {
        await releaseVisibility(folder.threadIds, folder.id);
      }
      changed("folders");
      return requireFolder(folder.id);
    },
    async deleteFolder({ id }) {
      await deleteFolder(id);
      return { ok: true as const };
    },
    addToFolder: (input) => addToFolder(input),
    removeFromFolder: ({ folderId, threadId }) => removeFromFolder(folderId, threadId),
    async setLayout({ entries }) {
      await writeLayout(entries);
      return { ok: true as const };
    },
    async setPreferences(patch) {
      await bb.storage.kv.set("preferences", { ...(await readPreferences()), ...patch });
      changed("preferences");
      return { ok: true as const };
    },
    async createSection({ name }) {
      const section = await bb.sdk.threadSections.create({ name });
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
      threadsChanged();
      return { ok: true as const };
    },
    createWebhook: (input) => createWebhook(input),
    async deleteWebhook({ id }) {
      await deleteWebhook(id);
      return { ok: true as const };
    },
    markRead({ threadId, webhookId }) {
      markRead(threadId, webhookId);
      return { ok: true as const };
    },
    async spawnThread({ request }) {
      const thread = await bb.sdk.threads.spawn(request as unknown as ThreadSpawnArgs);
      threadsChanged();
      return { threadId: thread.id };
    },
  });

  bb.http.route(
    "POST",
    "/hook",
    async (context) => {
      const url = new URL(context.req.url);
      const id = url.searchParams.get("id") ?? "";
      const key =
        context.req.header("x-desktop-secret") ?? url.searchParams.get("key") ?? "";
      const row = db.prepare(`SELECT * FROM webhooks WHERE id = ?`).get(id) as Row | undefined;
      if (row === undefined) return context.json({ ok: false, error: "unknown webhook" }, 404);
      const webhook = webhookFromRow(row);
      if (!secretsMatch(webhook.secret, key)) {
        return context.json({ ok: false, error: "invalid secret" }, 401);
      }
      const body = await context.req.text();
      if (Buffer.byteLength(body) > MAX_WEBHOOK_BODY_BYTES) {
        return context.json({ ok: false, error: "payload too large" }, 413);
      }
      const receivedAt = new Date();
      try {
        await bb.sdk.threads.send({
          threadId: webhook.threadId,
          mode: "queue-if-active",
          input: [
            {
              type: "text",
              text: webhookMessage({
                webhookName: webhook.name,
                contentType: context.req.header("content-type") ?? null,
                body,
                receivedAt,
              }),
              mentions: [],
            },
          ],
        });
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        bb.log.warn(`webhook ${webhook.id} delivery failed: ${message}`);
        return context.json({ ok: false, error: `delivery failed: ${message}` }, 502);
      }
      db.prepare(`UPDATE webhooks SET unread = unread + 1, last_event_at = ? WHERE id = ?`).run(
        receivedAt.getTime(),
        webhook.id,
      );
      changed("webhooks");
      return context.json({ ok: true }, 202);
    },
    { auth: "none" },
  );

  let threadsTimer: ReturnType<typeof setTimeout> | null = null;
  const threadsChanged = () => {
    if (threadsTimer !== null) return;
    threadsTimer = setTimeout(() => {
      threadsTimer = null;
      bb.realtime.publish("changed", { scope: "threads" });
    }, 750);
  };
  bb.onDispose(() => {
    if (threadsTimer !== null) clearTimeout(threadsTimer);
  });

  bb.events.on("thread.created", threadsChanged);
  bb.events.on("thread.active", threadsChanged);
  bb.events.on("thread.archived", threadsChanged);
  bb.events.on("thread.deleted", ({ thread }) => {
    db.prepare(`DELETE FROM folder_threads WHERE thread_id = ?`).run(thread.id);
    threadsChanged();
  });
  bb.events.on("thread.idle", threadsChanged);
  bb.events.on("thread.failed", threadsChanged);

  bb.cli.register({
    name: "desktop",
    summary: "Manage Desktop folders and webhooks",
    commands: [
      { name: "folders", summary: "List desktop folders", usage: "bb desktop folders" },
      {
        name: "folder",
        summary: "Create, fill, empty, or delete a folder",
        usage:
          "bb desktop folder create <name> [--hide-from-sidebar] | add <folder-id> <thread-id>... | remove <folder-id> <thread-id> | delete <folder-id>",
      },
      { name: "webhooks", summary: "List webhooks and their URLs", usage: "bb desktop webhooks" },
      {
        name: "webhook",
        summary: "Register or delete a webhook that feeds a thread",
        usage: "bb desktop webhook create <name> [--thread <thread-id>] | delete <webhook-id>",
      },
    ],
    async run(argv, context) {
      const fail = (message: string) => ({ exitCode: 2, stderr: `${message}\n\n${CLI_USAGE}` });
      const [command, subcommand, ...rest] = argv;
      try {
        if (command === "folders") {
          const lines = listFolders().map(
            (folder) =>
              `${folder.id}\t${folder.name}\t${folder.threadIds.length} threads${folder.hideFromSidebar ? "\thidden from sidebar" : ""}`,
          );
          return { exitCode: 0, stdout: lines.join("\n") || "No folders." };
        }
        if (command === "folder") {
          if (subcommand === "create") {
            const parsed = parseArgs({
              args: rest,
              allowPositionals: true,
              strict: true,
              options: {
                "hide-from-sidebar": { type: "boolean", default: false },
              },
            });
            const name = nameSchema.safeParse(parsed.positionals.join(" "));
            if (!name.success) return fail("folder create needs a name");
            const folder = await createFolder({
              name: name.data,
              hideFromSidebar: parsed.values["hide-from-sidebar"],
              position: null,
            });
            return { exitCode: 0, stdout: `Created ${folder.id} (${folder.name}).` };
          }
          if (subcommand === "add") {
            const [folderId, ...threadIds] = rest;
            if (folderId === undefined || threadIds.length === 0) {
              return fail("folder add needs a folder id and at least one thread id");
            }
            const folder = await addToFolder({ folderId, threadIds, fromFolderId: null });
            return { exitCode: 0, stdout: `${folder.name} now has ${folder.threadIds.length} threads.` };
          }
          if (subcommand === "remove") {
            const [folderId, threadId] = rest;
            if (folderId === undefined || threadId === undefined) {
              return fail("folder remove needs a folder id and a thread id");
            }
            const folder = await removeFromFolder(folderId, threadId);
            return { exitCode: 0, stdout: `${folder.name} now has ${folder.threadIds.length} threads.` };
          }
          if (subcommand === "delete") {
            const [folderId] = rest;
            if (folderId === undefined) return fail("folder delete needs a folder id");
            await deleteFolder(folderId);
            return { exitCode: 0, stdout: `Deleted ${folderId}.` };
          }
          return fail(`unknown folder command: ${subcommand ?? "(none)"}`);
        }
        if (command === "webhooks") {
          const base = await webhookBaseUrl();
          const lines = listWebhooks().map(
            (webhook) =>
              `${webhook.id}\t${webhook.name}\tthread ${webhook.threadId}\t${webhook.unread} unread\n  POST ${base}?id=${webhook.id}\n  header x-desktop-secret: ${webhook.secret}`,
          );
          return { exitCode: 0, stdout: lines.join("\n") || "No webhooks." };
        }
        if (command === "webhook") {
          if (subcommand === "create") {
            const parsed = parseArgs({
              args: rest,
              allowPositionals: true,
              strict: true,
              options: { thread: { type: "string" } },
            });
            const name = nameSchema.safeParse(parsed.positionals.join(" "));
            const threadId = parsed.values.thread ?? context.threadId;
            if (!name.success) return fail("webhook create needs a name");
            if (threadId === undefined) return fail("pass --thread <thread-id>");
            const webhook = await createWebhook({ name: name.data, threadId, position: null });
            return {
              exitCode: 0,
              stdout: `Created ${webhook.id}.\nPOST ${await webhookBaseUrl()}?id=${webhook.id}\nheader x-desktop-secret: ${webhook.secret}`,
            };
          }
          if (subcommand === "delete") {
            const [webhookId] = rest;
            if (webhookId === undefined) return fail("webhook delete needs a webhook id");
            await deleteWebhook(webhookId);
            return { exitCode: 0, stdout: `Deleted ${webhookId}.` };
          }
          return fail(`unknown webhook command: ${subcommand ?? "(none)"}`);
        }
        return fail(command === undefined ? "missing command" : `unknown command: ${command}`);
      } catch (error) {
        return { exitCode: 1, stderr: error instanceof Error ? error.message : String(error) };
      }
    },
  });
}
