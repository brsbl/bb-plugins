import { createHash } from "node:crypto";
import { extname, posix } from "node:path";
import { cliCommand, defineCli, PluginCliError, type BbPluginApi, type PluginCliContext } from "@get-bb/plugin-sdk";
import { z } from "zod";
import { CHANGED, attachmentInput, hostContract, rpcContract, type AttachmentInput, type ConnectionState, type ConnectionStatus, type GateInput } from "./contract.js";
import { createCalendarService } from "./engine.js";
import {
  FORMATS, LIMITS, STATUSES, TRAYS, TRAY_LABELS, attachmentSchema, gateLabel, isoDate, isoMonth, mondayOf, viewDirective,
  weekRange, itemSubtitle, type Attachment, type Format, type Item,
} from "./model.js";
import { CalendarError, type Credentials } from "./service-api.js";

const INSTRUCTIONS =
  "Content Calendar: when the user asks to see their content schedule, and right after you change it, run `bb content-calendar view --week <YYYY-MM-DD>` (or `--month <YYYY-MM>`) and paste the directive it prints once, on its own line. It renders the live calendar; describe what changed in words instead of re-listing items. Load the content-calendar skill before editing items.";
const PASTE_STEP = "Open it, approve, then copy the address your browser lands on (it won't load) and run `bb content-calendar connect --paste '<url>'`.";
const NEEDS_CLIENT_HINT = "Save a Google OAuth client ID and secret in Settings → Content Calendar, or run `bb plugin config content-calendar set clientId <id>` and `… set clientSecret <secret>`. `bb content-calendar connect` in a thread shows a masked form instead.";
const STATE_LABELS: Record<ConnectionState, string> = {
  needs_client: "Needs a Google OAuth client",
  not_connected: "Not connected",
  synced: "Synced",
  syncing: "Syncing",
  offline: "Offline",
  reconnect: "Reconnect Google Calendar",
  calendar_deleted: "The Content calendar was deleted in Google Calendar",
};
const MAX_NOTES_FILE_BYTES = 64 * 1024;
const MAX_STDOUT = 900 * 1024;

const clientForm = z.object({ clientId: z.string().trim().min(1).max(500), clientSecret: z.string().trim().min(1).max(500) });

/** `owner/repo#123` or a GitHub pull request URL. */
export function parsePr(value: string): { repo: string; number: number } | null {
  const short = /^([A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+)#(\d+)$/.exec(value.trim());
  const long = /^https:\/\/github\.com\/([A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+)\/pull\/(\d+)(?:[/?#].*)?$/.exec(value.trim());
  const match = short ?? long;
  return match ? { repo: match[1]!, number: Number(match[2]) } : null;
}

export function itemLine(item: Item): string {
  const when = item.date ?? (item.tray ? TRAY_LABELS[item.tray] : "—");
  const sync = item.sync === "synced" ? "" : item.sync === "queued" ? "  [not synced yet]" : "  [conflict]";
  return `${item.id}  ${when}  ${item.status === "posted" ? "☑" : "☐"} ${item.title}  (${itemSubtitle(item)})${sync}`;
}

function itemDetail(item: Item): string {
  const lines = [itemLine(item)];
  if (item.time) lines.push(`Time: ${item.time}${item.days > 1 ? ` · ${item.days} days` : ""}`);
  if (item.target) lines.push(`Target: ${item.target}`);
  for (const gate of item.waitsOn) lines.push(`Waits on [${gate.id}]: ${gateLabel(gate)}${gate.cleared ? " (cleared)" : ""}`);
  for (const attachment of item.attachments) lines.push(`Attachment [${attachment.id}]: ${attachmentLabel(attachment)}`);
  if (item.conflict) lines.push(`Conflict: ${item.conflict.message}`);
  if (item.notice) lines.push(`Notice: ${item.notice}`);
  if (item.notes) lines.push("Notes:", item.notes);
  return lines.join("\n");
}

function attachmentLabel(attachment: Attachment): string {
  if (attachment.kind === "file") return `${attachment.name} (${attachment.path} on ${attachment.machineId})`;
  if (attachment.kind === "url") return attachment.title ? `${attachment.title} (${attachment.url})` : attachment.url;
  if (attachment.kind === "pr") return `${attachment.repo}#${attachment.number}`;
  return attachment.title ? `${attachment.title} (${attachment.threadId})` : attachment.threadId;
}

function statusLine(status: ConnectionStatus): string {
  const parts = [STATE_LABELS[status.state]];
  if (status.lastSyncedAt) parts.push(`last synced ${status.lastSyncedAt}`);
  parts.push(`${status.queued} queued`, `${status.conflicts} conflicts`);
  return [parts.join(" · "), status.message].filter(Boolean).join("\n");
}

/** Maps every failure onto bb's CLI error envelope. */
function toCliError(error: unknown): PluginCliError {
  if (error instanceof PluginCliError) return error;
  if (error instanceof CalendarError) {
    const kept = error.code === "conflict" && error.fields?.length ? `Google Calendar kept: ${error.fields.join(", ")}.` : undefined;
    const hint = [kept, error.hint].filter(Boolean).join(" ");
    return new PluginCliError(error.message, { code: error.code, ...(hint ? { hint } : {}) });
  }
  if (error instanceof z.ZodError) {
    const issue = error.issues[0];
    const where = issue?.path.length ? `${issue.path.join(".")}: ` : "";
    return new PluginCliError(`${where}${issue?.message ?? "Invalid input"}`, { code: "invalid" });
  }
  return new PluginCliError(error instanceof Error ? error.message : String(error), { code: "failed" });
}

async function guard<T>(run: () => Promise<T>): Promise<T> {
  try { return await run(); } catch (error) { throw toCliError(error); }
}

function output(json: boolean, value: unknown, human: () => string) {
  const stdout = json ? JSON.stringify(value) : human();
  if (Buffer.byteLength(stdout) > MAX_STDOUT) {
    throw new PluginCliError("The result is too large to print.", { code: "too_large", hint: "Narrow it with --limit, a date range, or `export --out <path>`." });
  }
  return { exitCode: 0, stdout };
}

function formatOption(value: string | undefined): Format | null | undefined {
  return value === undefined ? undefined : value === "none" ? null : (value as Format);
}

/** Dev QA only: point the engine at `fake-google-server.ts` instead of Google. */
function devGoogleEndpoints(base: string | undefined) {
  if (!base || !/^http:\/\/127\.0\.0\.1:\d+$/.test(base)) return undefined;
  return { apiBase: `${base}/calendar/v3`, authUrl: `${base}/o/oauth2/v2/auth`, tokenUrl: `${base}/token` };
}

export default function plugin(bb: BbPluginApi): void {
  const settings = bb.settings.define({
    clientId: { type: "string", label: "Google OAuth client ID", description: "From your Google Cloud project's Desktop app OAuth client", secret: true },
    clientSecret: { type: "string", label: "Google OAuth client secret", secret: true },
    refreshToken: { type: "string", label: "Google refresh token", description: "Set by Connect", secret: true },
    calendarId: { type: "string", label: "Content calendar ID", description: "Set by Connect; the Content calendar's ID", secret: true },
  });
  const text = (value: unknown) => (typeof value === "string" && value.trim() ? value.trim() : undefined);
  const host = bb.hosts.experimental_client({ contract: hostContract });

  const service = createCalendarService({
    db: bb.storage.database(),
    migrate: (db, statements) => bb.storage.migrate(db, statements),
    credentials: {
      async get(): Promise<Credentials> {
        const values = await settings.get();
        return { clientId: text(values.clientId), clientSecret: text(values.clientSecret), refreshToken: text(values.refreshToken), calendarId: text(values.calendarId) };
      },
      async set(values) {
        const next: { refreshToken?: string | null; calendarId?: string | null } = {};
        if (values.refreshToken !== undefined) next.refreshToken = values.refreshToken;
        if (values.calendarId !== undefined) next.calendarId = values.calendarId;
        await settings.experimental_set(next);
      },
    },
    publish: (reason) => bb.realtime.publish(CHANGED, { reason }),
    // Read at call time so the fake Google server and tests can swap it.
    fetch: ((input: Parameters<typeof fetch>[0], init?: RequestInit) => globalThis.fetch(input, init)) as typeof fetch,
    now: () => new Date(),
    log: bb.log,
    google: devGoogleEndpoints(process.env.BB_CONTENT_CALENDAR_FAKE_GOOGLE),
  });
  bb.onDispose(() => service.dispose());

  // The poll loop: tick, then wait until the engine's next delay. A nudge re-reads the delay
  // (a view became visible, a write queued) without ticking early.
  let nudgeSleep: (() => void) | null = null;
  const nudge = () => nudgeSleep?.();
  bb.background.service("sync", {
    async start(signal) {
      while (!signal.aborted) {
        try { await service.tick(); } catch (error) { bb.log.warn(`Sync failed: ${error instanceof Error ? error.message : String(error)}`); }
        const last = Date.now();
        while (!signal.aborted) {
          const remaining = last + service.nextTickDelay() - Date.now();
          if (remaining <= 0) break;
          await new Promise<void>((resolve) => {
            const done = () => { clearTimeout(timer); signal.removeEventListener("abort", done); nudgeSleep = null; resolve(); };
            const timer = setTimeout(done, remaining);
            nudgeSleep = done;
            signal.addEventListener("abort", done, { once: true });
          });
        }
      }
    },
  });
  const after = async <T>(work: Promise<T>): Promise<T> => { try { return await work; } finally { nudge(); } };

  // Machines and the invoking host. The server never reads a Mac path from its own disk.
  const machines = async () => (await bb.sdk.hosts.list())
    .filter((entry) => entry.lifecycle.phase !== "destroyed")
    .map((entry) => ({ id: entry.id, name: entry.name, connected: entry.status === "connected" }));
  const onlineMachine = async (machineId: string) => {
    const machine = (await machines()).find((entry) => entry.id === machineId);
    if (!machine) throw new PluginCliError("That machine isn't enrolled in bb.", { code: "not_found" });
    if (!machine.connected) throw new PluginCliError(`${machine.name} is offline.`, { code: "offline", hint: "Try again when it reconnects." });
    return machine;
  };
  const threadHost = async (threadId: string) => {
    const thread = await bb.sdk.threads.get({ threadId });
    if (!thread.environmentId) return null;
    const environment = await bb.sdk.environments.get({ environmentId: thread.environmentId });
    return { hostId: environment.hostId, path: environment.path };
  };
  /** The machine a CLI path names a file on: --machine, else the invoking thread's machine. */
  const invokingMachine = async (ctx: PluginCliContext, machine: string | undefined) => {
    const own = ctx.threadId ? await threadHost(ctx.threadId).catch(() => null) : null;
    const hostId = machine ?? own?.hostId;
    if (!hostId) throw new PluginCliError("Which machine is that file on?", { code: "machine_required", hint: "Run this from a bb thread, or pass --machine <host-id>." });
    // A cwd belongs only to the invoking thread's machine.
    const cwd = own && own.hostId === hostId ? ctx.cwd ?? own.path ?? undefined : undefined;
    return { hostId, cwd };
  };
  const readInvokingFile = async (path: string, ctx: PluginCliContext, machine: string | undefined) => {
    const { hostId, cwd } = await invokingMachine(ctx, machine);
    await onlineMachine(hostId);
    const file = await host.call("resolveFile", { path, ...(cwd ? { cwd } : {}) }, { hostId, signal: ctx.signal });
    const read = await bb.sdk.files.read({ hostId, path: file.path, signal: ctx.signal });
    if (read.contentEncoding !== "utf8" || read.sizeBytes > MAX_NOTES_FILE_BYTES) {
      throw new PluginCliError("Use a UTF-8 text file.", { code: "invalid", hint: `Notes are up to ${LIMITS.notes} characters.` });
    }
    return read.content;
  };
  const writeInvokingFile = async (path: string, content: string, ctx: PluginCliContext, machine: string | undefined) => {
    const { hostId, cwd } = await invokingMachine(ctx, machine);
    if (path.startsWith("~")) throw new PluginCliError("Use an absolute path or one relative to this directory.", { code: "invalid" });
    if (!posix.isAbsolute(path) && !cwd) throw new PluginCliError("Use an absolute path.", { code: "invalid", hint: "Relative paths work only on the machine this thread runs on." });
    const target = posix.resolve(cwd ?? "/", path);
    await onlineMachine(hostId);
    const result = await bb.sdk.files.write({ hostId, path: target, content, createParents: true });
    if (result.outcome !== "written") throw new PluginCliError(`Could not write ${target}.`, { code: "failed" });
    return { hostId, path: target };
  };

  const attachFile = async (id: string, machineId: string, path: string, cwd: string | undefined, strict: boolean, signal?: AbortSignal) => {
    await onlineMachine(machineId);
    const file = await host.call("resolveFile", { path, ...(cwd ? { cwd } : {}) }, { hostId: machineId, signal });
    const attachment = attachmentInput.parse({ kind: "file", machineId, path: file.path, name: file.name });
    await bb.storage.kv.set(trustKey(machineId, file.path), true);
    return strict ? service.strict.attach({ id, attachment }) : service.attach({ id, attachment });
  };
  // File records round-trip through Google Calendar, where other apps can rewrite them. bb only checks
  // or opens a machine path that was attached through bb itself.
  const trustKey = (machineId: string, path: string) => `attached-file:${createHash("sha256").update(`${machineId}\0${path}`).digest("hex")}`;
  const attachedThroughBb = async (machineId: string, path: string) => (await bb.storage.kv.get<boolean>(trustKey(machineId, path))) === true;

  const threadRoute = async (threadId: string) => {
    const base = (bb.server.experimental_appUrl ?? "").replace(/\/+$/, "");
    const thread = await bb.sdk.threads.get({ threadId }).catch(() => null);
    return `${base}${thread ? `/projects/${encodeURIComponent(thread.projectId)}` : ""}/threads/${encodeURIComponent(threadId)}`;
  };

  bb.rpc.register(rpcContract, {
    status: (input) => service.status(input),
    calendar: (input) => service.calendar(input),
    list: (input) => service.list(input),
    show: (input) => service.show(input),
    add: (input) => after(service.add(input)),
    update: (input) => after(service.update(input)),
    move: (input) => after(service.move(input)),
    gateAdd: (input) => after(service.gateAdd(input)),
    gateClear: (input) => after(service.gateClear(input)),
    gateRemove: (input) => after(service.gateRemove(input)),
    attach: (input) => after(service.attach(input)),
    detach: (input) => after(service.detach(input)),
    delete: (input) => after(service.delete(input)),
    reapply: (input) => after(service.reapply(input)),
    sync: (input) => after(service.sync(input)),
    export: (input) => service.export(input),
    visible: (input) => after(service.visible(input)),
    connectStart: (input) => service.connectStart(input),
    connectFinish: (input) => after(service.connectFinish(input)),
    disconnect: (input) => after(service.disconnect(input)),
    restoreCalendar: (input) => after(service.restoreCalendar(input)),

    machines: async () => ({ machines: await machines() }),
    searchFiles: async ({ machineId, query }) => {
      await onlineMachine(machineId);
      return host.call("search", { query, limit: 50 }, { hostId: machineId });
    },
    attachFile: ({ id, machineId, path }) => after(attachFile(id, machineId, path, undefined, false)),
    inspectFiles: async ({ id }) => {
      const item = await service.get(id);
      const all = item.attachments.filter((attachment): attachment is Extract<Attachment, { kind: "file" }> => attachment.kind === "file");
      const trusted = new Set<string>();
      for (const file of all) if (await attachedThroughBb(file.machineId, file.path)) trusted.add(file.id);
      const files = all.filter((file) => trusted.has(file.id));
      const online = new Map((await machines()).map((machine) => [machine.id, machine.connected]));
      const result: Array<{ attachmentId: string; status: "available" | "missing" | "offline" }> = [];
      for (const machineId of new Set(files.map((file) => file.machineId))) {
        const owned = files.filter((file) => file.machineId === machineId);
        const facts = online.get(machineId)
          ? await host.call("inspect", { paths: owned.map((file) => file.path) }, { hostId: machineId }).catch(() => null)
          : null;
        for (const file of owned) {
          result.push({ attachmentId: file.id, status: facts ? facts.files.find((fact) => fact.path === file.path)?.status ?? "missing" : "offline" });
        }
      }
      return { files: all.map((file) => result.find((entry) => entry.attachmentId === file.id) ?? { attachmentId: file.id, status: "missing" as const }) };
    },
    openAttachment: async ({ id, attachmentId }) => {
      const item = await service.get(id);
      const found = item.attachments.find((entry) => entry.id === attachmentId);
      if (!found) throw new CalendarError("not_found", "That attachment is no longer on this item.");
      // Attachments round-trip through Google Calendar; re-validate before acting on one.
      const parsed = attachmentSchema.safeParse(found);
      if (!parsed.success) throw new CalendarError("invalid", "This attachment's record is damaged. Remove it and attach it again.");
      const attachment = parsed.data;
      if (attachment.kind === "url") return { opened: "url" as const, url: attachment.url };
      if (attachment.kind === "pr") return { opened: "url" as const, url: `https://github.com/${attachment.repo}/pull/${attachment.number}` };
      if (attachment.kind === "thread") return { opened: "url" as const, url: await threadRoute(attachment.threadId) };
      if (!(await attachedThroughBb(attachment.machineId, attachment.path))) {
        throw new CalendarError("invalid", "This file was attached outside bb, so bb won't open it.", "Remove it and attach the file again from bb.");
      }
      const preview = { opened: "preview" as const, hostId: attachment.machineId, path: attachment.path };
      if (![".md", ".markdown"].includes(extname(attachment.path).toLowerCase())) return preview;
      // The Mac decides whether this is a Moss note under ~/Moss; anything it refuses opens in the preview.
      await onlineMachine(attachment.machineId);
      const result = await host.call("openInMoss", { path: attachment.path }, { hostId: attachment.machineId });
      return result.opened ? { opened: "moss" as const } : preview;
    },
  });

  bb.agents.contributeInstructions(() => INSTRUCTIONS);

  // CLI. Every command calls the same service as the UI; writes use the strict
  // variants so a same-field conflict exits non-zero with code `conflict`.
  const json = { type: "boolean", description: "Print the result as JSON" } as const;
  const machine = { type: "string", aliases: ["host"], description: "Machine (host ID) a path is on; defaults to the machine this thread runs on" } as const;
  const formatValues = [...FORMATS, "none"] as const;
  const id = [{ name: "id", required: true, description: "Item ID, like cc_7k2m9q" }] as const;
  const requireThreadForm = (ctx: PluginCliContext) => {
    if (!ctx.threadId) throw new PluginCliError("No Google OAuth client is saved.", { code: "needs_client", hint: NEEDS_CLIENT_HINT });
    return ctx.threadId;
  };

  bb.cli.register(defineCli({
    name: "content-calendar",
    summary: "Plan content on the Content calendar stored in Google Calendar",
    commands: {
      list: cliCommand({
        summary: `List items by date range, format, status, or tray (${LIMITS.listDefault} per page; continue with --cursor)`,
        options: {
          month: { type: "string", placeholder: "YYYY-MM", description: "Items dated in this month" },
          week: { type: "string", placeholder: "DATE", description: "Items in the Monday–Sunday week containing DATE" },
          from: { type: "string", placeholder: "DATE", description: "First date (with --to)" },
          to: { type: "string", placeholder: "DATE", description: "Last date (with --from)" },
          format: { type: "enum", values: FORMATS, description: "Only this format" },
          status: { type: "enum", values: STATUSES, description: "Only this status; posted = checked" },
          tray: { type: "enum", values: TRAYS, description: "Only this tray's undated items" },
          limit: { type: "integer", min: 1, max: LIMITS.listMax, description: `Items per page, up to ${LIMITS.listMax}` },
          cursor: { type: "string", description: "nextCursor from the previous page" },
          json,
        },
        constraints: [
          { kind: "at-most-one", options: ["month", "week", "from"] },
          { kind: "at-most-one", options: ["month", "week", "to"] },
          { kind: "requires", option: "from", needs: ["to"] },
          { kind: "requires", option: "to", needs: ["from"] },
        ],
        run: ({ options }) => guard(async () => {
          const range = options.month
            ? (() => { const month = isoMonth.parse(options.month); return { from: `${month}-01`, to: lastDayOf(month) }; })()
            : options.week ? weekRange(isoDate.parse(options.week))
              : options.from && options.to ? { from: isoDate.parse(options.from), to: isoDate.parse(options.to) } : {};
          const result = await service.list({
            ...range,
            ...(options.format ? { format: options.format } : {}),
            ...(options.status ? { status: options.status } : {}),
            ...(options.tray ? { tray: options.tray } : {}),
            ...(options.limit ? { limit: options.limit } : {}),
            ...(options.cursor ? { cursor: options.cursor } : {}),
          });
          return output(options.json, result, () => [
            ...(result.items.length ? result.items.map(itemLine) : ["No items."]),
            ...(result.nextCursor ? [`More: --cursor ${result.nextCursor}`] : []),
          ].join("\n"));
        }),
      }),
      show: cliCommand({
        summary: "Show one item with its gates, attachments, and sync state",
        positionals: id,
        options: { json },
        run: ({ positionals, options }) => guard(async () => {
          const item = await service.show({ id: positionals.id });
          return output(options.json, item, () => itemDetail(item));
        }),
      }),
      add: cliCommand({
        summary: "Create an item on a date or in a tray",
        positionals: [{ name: "title", required: true, description: `Title, up to ${LIMITS.title} characters` }],
        options: {
          format: { type: "enum", values: formatValues, required: true, description: "tweet, blog, essay, site, or none" },
          date: { type: "string", placeholder: "DATE", description: "YYYY-MM-DD in America/Los_Angeles" },
          tray: { type: "enum", values: TRAYS, description: "Undated tray" },
          status: { type: "enum", values: STATUSES, description: "Defaults to idea; posted = checked" },
          target: { type: "string", description: `What success looks like, up to ${LIMITS.target} characters` },
          "notes-file": { type: "string", placeholder: "PATH", description: `Text file on this machine to use as notes (up to ${LIMITS.notes} characters)` },
          machine,
          json,
        },
        constraints: [{ kind: "exactly-one", options: ["date", "tray"] }],
        run: ({ positionals, options }, ctx) => guard(async () => {
          const notes = options["notes-file"] ? await readInvokingFile(options["notes-file"], ctx, options.machine) : undefined;
          const item = await service.strict.add(rpcContract.add.input.parse({
            title: positionals.title,
            format: formatOption(options.format) ?? null,
            when: options.date ? { date: isoDate.parse(options.date) } : { tray: options.tray! },
            ...(options.status ? { status: options.status } : {}),
            ...(options.target !== undefined ? { target: options.target } : {}),
            ...(notes !== undefined ? { notes } : {}),
          }));
          return output(options.json, item, () => itemLine(item));
        }),
      }),
      update: cliCommand({
        summary: "Edit an item's fields; --status posted checks it",
        positionals: id,
        options: {
          title: { type: "string", description: `New title, up to ${LIMITS.title} characters` },
          format: { type: "enum", values: formatValues, description: "tweet, blog, essay, site, or none" },
          status: { type: "enum", values: STATUSES, description: "idea, drafting, ready, or posted (checked)" },
          target: { type: "string", description: "New target; an empty string clears it" },
          "notes-file": { type: "string", placeholder: "PATH", description: "Replace notes with this text file on this machine" },
          time: { type: "string", placeholder: "HH:MM", description: "Time of day; `none` makes it all-day" },
          machine,
          json,
        },
        constraints: [{ kind: "at-least-one", options: ["title", "format", "status", "target", "notes-file", "time"] }],
        run: ({ positionals, options }, ctx) => guard(async () => {
          const notes = options["notes-file"] ? await readInvokingFile(options["notes-file"], ctx, options.machine) : undefined;
          const format = formatOption(options.format);
          const item = await service.strict.update(rpcContract.update.input.parse({
            id: positionals.id,
            ...(options.title !== undefined ? { title: options.title } : {}),
            ...(format !== undefined ? { format } : {}),
            ...(options.status ? { status: options.status } : {}),
            ...(options.target !== undefined ? { target: options.target.trim() ? options.target : null } : {}),
            ...(notes !== undefined ? { notes } : {}),
            ...(options.time !== undefined ? { time: options.time === "none" || !options.time ? null : options.time } : {}),
          }));
          return output(options.json, item, () => itemLine(item));
        }),
      }),
      move: cliCommand({
        summary: "Move an item to a date or tray, optionally before or after another item there",
        positionals: id,
        options: {
          date: { type: "string", placeholder: "DATE", description: "YYYY-MM-DD" },
          tray: { type: "enum", values: TRAYS, description: "Undated tray" },
          before: { type: "string", placeholder: "ID", description: "Place before this item" },
          after: { type: "string", placeholder: "ID", description: "Place after this item" },
          json,
        },
        constraints: [{ kind: "exactly-one", options: ["date", "tray"] }, { kind: "at-most-one", options: ["before", "after"] }],
        run: ({ positionals, options }) => guard(async () => {
          const item = await service.strict.move(rpcContract.move.input.parse({
            id: positionals.id,
            when: options.date ? { date: isoDate.parse(options.date) } : { tray: options.tray! },
            ...(options.before ? { before: options.before } : {}),
            ...(options.after ? { after: options.after } : {}),
          }));
          return output(options.json, item, () => itemLine(item));
        }),
      }),
      "gate add": cliCommand({
        summary: `Make an item wait on a PR, another item, or a note (up to ${LIMITS.gates})`,
        positionals: id,
        options: {
          pr: { type: "string", placeholder: "owner/repo#n", description: "Pull request, as owner/repo#n or its GitHub URL" },
          item: { type: "string", placeholder: "ID", description: "Another item; cleared when that item is checked" },
          text: { type: "string", description: `Free text, up to ${LIMITS.gateText} characters` },
          url: { type: "string", description: "Link for a --text gate" },
          json,
        },
        constraints: [{ kind: "exactly-one", options: ["pr", "item", "text"] }, { kind: "requires", option: "url", needs: ["text"] }],
        run: ({ positionals, options }) => guard(async () => {
          let gate: GateInput;
          if (options.pr) {
            const pr = parsePr(options.pr);
            if (!pr) throw new PluginCliError("Use owner/repo#n or a GitHub pull request URL.", { code: "invalid" });
            gate = { kind: "pr", ...pr };
          } else if (options.item) gate = { kind: "item", itemId: options.item };
          else gate = { kind: "text", text: options.text!, ...(options.url ? { url: options.url } : {}) };
          const item = await service.strict.gateAdd(rpcContract.gateAdd.input.parse({ id: positionals.id, gate }));
          return output(options.json, item, () => itemDetail(item));
        }),
      }),
      "gate clear": cliCommand({
        summary: "Clear a gate (or reopen it with --reopen)",
        positionals: [{ name: "id", required: true, description: "Item ID" }, { name: "gateId", required: true, description: "Gate ID from show" }],
        options: { reopen: { type: "boolean", description: "Mark the gate open again" }, json },
        run: ({ positionals, options }) => guard(async () => {
          const item = await service.strict.gateClear(rpcContract.gateClear.input.parse({ id: positionals.id, gateId: positionals.gateId, cleared: !options.reopen }));
          return output(options.json, item, () => itemLine(item));
        }),
      }),
      "gate remove": cliCommand({
        summary: "Remove a gate",
        positionals: [{ name: "id", required: true, description: "Item ID" }, { name: "gateId", required: true, description: "Gate ID from show" }],
        options: { json },
        run: ({ positionals, options }) => guard(async () => {
          const item = await service.strict.gateRemove(rpcContract.gateRemove.input.parse({ id: positionals.id, gateId: positionals.gateId }));
          return output(options.json, item, () => itemLine(item));
        }),
      }),
      attach: cliCommand({
        summary: `Attach a file, link, PR, or bb thread (up to ${LIMITS.attachments}; references only, never copies)`,
        positionals: id,
        options: {
          file: { type: "string", placeholder: "PATH", description: "File on this machine (absolute, ~/, or relative), or on --machine" },
          machine,
          url: { type: "string", description: `http(s) URL, up to ${LIMITS.reference} characters` },
          title: { type: "string", description: "Label for a --url or --thread attachment" },
          pr: { type: "string", placeholder: "owner/repo#n", description: "Pull request, as owner/repo#n or its GitHub URL" },
          thread: { type: "string", placeholder: "thr_…", description: "bb thread ID" },
          json,
        },
        constraints: [
          { kind: "exactly-one", options: ["file", "url", "pr", "thread"] },
          { kind: "requires", option: "machine", needs: ["file"] },
          { kind: "at-most-one", options: ["title", "file"] },
          { kind: "at-most-one", options: ["title", "pr"] },
        ],
        run: ({ positionals, options }, ctx) => guard(async () => {
          let item: Item;
          if (options.file) {
            const { hostId, cwd } = await invokingMachine(ctx, options.machine);
            item = await attachFile(positionals.id, hostId, options.file, cwd, true, ctx.signal);
          } else {
            let attachment: AttachmentInput;
            if (options.url) attachment = { kind: "url", url: options.url, ...(options.title ? { title: options.title } : {}) };
            else if (options.pr) {
              const pr = parsePr(options.pr);
              if (!pr) throw new PluginCliError("Use owner/repo#n or a GitHub pull request URL.", { code: "invalid" });
              attachment = { kind: "pr", ...pr };
            } else {
              const threadId = options.thread!;
              const title = options.title ?? (await bb.sdk.threads.get({ threadId }).then((thread) => thread.title ?? undefined, () => undefined));
              attachment = { kind: "thread", threadId, ...(title ? { title: title.slice(0, 300) } : {}) };
            }
            item = await service.strict.attach(rpcContract.attach.input.parse({ id: positionals.id, attachment: attachmentInput.parse(attachment) }));
          }
          return output(options.json, item, () => itemDetail(item));
        }),
      }),
      detach: cliCommand({
        summary: "Remove an attachment (the file or page itself is untouched)",
        positionals: [{ name: "id", required: true, description: "Item ID" }, { name: "attachmentId", required: true, description: "Attachment ID from show" }],
        options: { json },
        run: ({ positionals, options }) => guard(async () => {
          const item = await service.strict.detach(rpcContract.detach.input.parse({ id: positionals.id, attachmentId: positionals.attachmentId }));
          return output(options.json, item, () => itemLine(item));
        }),
      }),
      delete: cliCommand({
        summary: "Delete an item and its Google Calendar event. This is final.",
        positionals: id,
        options: { json },
        run: ({ positionals, options }) => guard(async () => {
          const result = await service.delete({ id: positionals.id });
          return output(options.json, result, () => (result.deleted ? `Deleted ${positionals.id}.` : `${positionals.id} was already gone.`));
        }),
      }),
      reapply: cliCommand({
        summary: "After a conflict, write bb's values over Google Calendar's",
        positionals: id,
        options: { json },
        run: ({ positionals, options }) => guard(async () => {
          const item = await service.strict.reapply(rpcContract.reapply.input.parse({ id: positionals.id }));
          return output(options.json, item, () => itemLine(item));
        }),
      }),
      view: cliCommand({
        summary: "Print the inline-calendar directive to paste once, on its own line, in chat",
        options: {
          week: { type: "string", placeholder: "DATE", description: "Any date in the week (starts Monday)" },
          month: { type: "string", placeholder: "YYYY-MM", description: "Month" },
          json,
        },
        constraints: [{ kind: "exactly-one", options: ["week", "month"] }],
        run: ({ options }) => guard(async () => {
          const view = options.week ? "week" as const : "month" as const;
          const start = options.week ? mondayOf(isoDate.parse(options.week)) : isoMonth.parse(options.month);
          const directive = viewDirective(view, start);
          return output(options.json, { view, start, directive }, () => `${directive}\nPaste the line above once, on its own line, in your reply. It shows the live calendar.`);
        }),
      }),
      export: cliCommand({
        summary: "Export every item, including both trays, as JSON",
        options: {
          out: { type: "string", placeholder: "PATH", description: "Write to this file on this machine (or --machine) instead of printing" },
          machine,
          json,
        },
        constraints: [{ kind: "requires", option: "machine", needs: ["out"] }],
        run: ({ options }, ctx) => guard(async () => {
          const result = await service.export({});
          if (!options.out) return output(true, result, () => "");
          const written = await writeInvokingFile(options.out, `${JSON.stringify(result, null, 2)}\n`, ctx, options.machine);
          const summary = { ...written, items: result.items.length, exportedAt: result.exportedAt };
          return output(options.json, summary, () => `Exported ${result.items.length} items to ${written.path}.`);
        }),
      }),
      status: cliCommand({
        summary: "Connection state, last sync, queued writes, and conflicts",
        options: { json },
        run: ({ options }) => guard(async () => {
          const status = await service.status({});
          return output(options.json, status, () => statusLine(status));
        }),
      }),
      sync: cliCommand({
        summary: "Sync with Google Calendar now",
        options: { json },
        run: ({ options }) => guard(async () => {
          const status = await after(service.sync({}));
          return output(options.json, status, () => statusLine(status));
        }),
      }),
      connect: cliCommand({
        summary: "Sign in to Google (one time); finish with --paste",
        description: "Without a saved OAuth client, a thread shows a masked form that saves it straight to secret settings. Prints Google's sign-in address; after approving, paste the address the browser lands on with --paste.",
        options: {
          "calendar-id": { type: "string", description: "Reuse an existing Content calendar (its ID from Google Calendar settings)" },
          paste: { type: "string", placeholder: "URL", description: "The loopback address Google redirected to" },
          json,
        },
        constraints: [{ kind: "at-most-one", options: ["calendar-id", "paste"] }],
        run: ({ options }, ctx) => guard(async () => {
          if (options.paste) {
            const status = await after(service.connectFinish({ redirectUrl: options.paste }));
            return output(options.json, status, () => `Connected to Google Calendar.\n${statusLine(status)}`);
          }
          const credentials = await settings.get();
          if (!text(credentials.clientId) || !text(credentials.clientSecret)) {
            const threadId = requireThreadForm(ctx);
            const answer = await bb.ui.requestInput({
              threadId,
              rendererId: "connect-client",
              title: "Google OAuth client",
              payload: {},
              // The values never enter the transcript.
              describeSubmission: () => ({ title: "Saved Google OAuth client" }),
            }, { ...(ctx.signal ? { signal: ctx.signal } : {}) });
            if (answer.outcome !== "submitted") throw new PluginCliError("No Google OAuth client was saved.", { code: "needs_client", hint: NEEDS_CLIENT_HINT });
            const client = clientForm.safeParse(answer.value);
            if (!client.success) throw new PluginCliError("Enter both the client ID and the client secret.", { code: "needs_client", hint: NEEDS_CLIENT_HINT });
            await settings.experimental_set({ clientId: client.data.clientId, clientSecret: client.data.clientSecret });
          }
          const { authUrl } = await service.connectStart(options["calendar-id"] ? { calendarId: options["calendar-id"] } : {});
          return output(options.json, { authUrl, next: PASTE_STEP }, () => `${authUrl}\n${PASTE_STEP}`);
        }),
      }),
      disconnect: cliCommand({
        summary: "Sign out of Google; the Content calendar stays and is reused on reconnect",
        options: { json },
        run: ({ options }) => guard(async () => {
          const status = await after(service.disconnect({}));
          return output(options.json, status, () => statusLine(status));
        }),
      }),
      "restore-calendar": cliCommand({
        summary: "Recreate a deleted Content calendar and its events from bb's copy",
        options: { json },
        run: ({ options }) => guard(async () => {
          const status = await after(service.restoreCalendar({}));
          return output(options.json, status, () => statusLine(status));
        }),
      }),
    },
  }));
}

function lastDayOf(month: string): string {
  const next = new Date(`${month}-01T00:00:00Z`);
  next.setUTCMonth(next.getUTCMonth() + 1);
  next.setUTCDate(0);
  return next.toISOString().slice(0, 10);
}
