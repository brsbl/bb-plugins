import path from "node:path";
import { randomUUID } from "node:crypto";
import { parseArgs } from "node:util";
import { defineRpcContract, type BbPluginApi } from "@get-bb/plugin-sdk";
import { z } from "zod";
import { hostContract } from "./host-contract.js";
import { directive, id, isActionable, listSchema, mediaSchema, MENTION_PROVIDER, noteInputSchema, noteSchema, promptContext, registerSchema, selectionSchema, sourceSchema, statusInputSchema, stillSchema, versionSchema, videoName, VIDEO_EXTENSIONS, type Media } from "./model.js";
import { openStore } from "./store.js";
import { mediaResponse } from "./media.js";

const target = z.object({threadId: id, versionId: id}).strict();
const frameTarget = z.object({threadId: id, noteId: id}).strict();
const libraryInput = z.object({threadId: id, offset: z.number().int().nonnegative().default(0)}).strict();
const demoInput = z.object({threadId: id, demo: id}).strict();
const openInput = z.object({file: z.string().min(1), source: sourceSchema}).strict();
const previewSchema = z.object({url: z.string(), expiresAt: z.number(), media: mediaSchema});
export const videoMarkupContract = defineRpcContract({
  register: {input: registerSchema, output: versionSchema},
  versions: {input: libraryInput, output: z.object({versions: z.array(versionSchema), nextOffset: z.number().nullable(), currentDemo: id.nullable()})},
  selectDemo: {input: demoInput, output: z.object({demo: id})},
  version: {input: target, output: versionSchema},
  preview: {input: target, output: previewSchema},
  openFile: {input: openInput, output: previewSchema},
  probeFile: {input: openInput, output: mediaSchema},
  notes: {input: listSchema, output: z.object({notes: z.array(noteSchema), nextOffset: z.number().nullable()})},
  addNote: {input: noteInputSchema, output: noteSchema},
  status: {input: statusInputSchema, output: noteSchema},
  frame: {input: frameTarget, output: stillSchema},
  context: {input: selectionSchema, output: z.object({id, context: z.string(), count: z.number()})},
  post: {input: target, output: z.object({directive: z.string(), instruction: z.string()})},
});

export default function plugin(bb: BbPluginApi): void {
  const store = openStore(bb);
  const host = bb.hosts.experimental_client({contract: hostContract});
  const leases = new Map<string, {media: Media; expiresAt: number}>();
  // BB matches plugin route paths literally; per-preview keys belong in the query.
  for (const method of ["HEAD", "GET"]) bb.http.route(method, "/media", context => {
    const lease = leases.get(context.req.query("lease") ?? "");
    if (!lease || lease.expiresAt <= Date.now()) return new Response("Video preview expired. Reopen the version.", {status: 404});
    return mediaResponse({media: lease.media, range: context.req.header("range") ?? null, head: context.req.method === "HEAD", signal: context.req.raw.signal,
      read: async (start, length, signal) => (await host.call("readChunk", {path: lease.media.path, size: lease.media.size, modifiedAt: lease.media.modifiedAt, start, length}, {hostId: lease.media.hostId, signal})).data,
    });
  });
  const currentDemo = async (threadId: string) => await bb.storage.kv.get<string>(`demo:${threadId}`) ?? store.versions(threadId).at(-1)?.demo ?? null;
  const changed = (threadId: string) => bb.realtime.publish("changed", {threadId});
  async function resolveFile(file: string, source: z.infer<typeof sourceSchema>) {
    if (!VIDEO_EXTENSIONS.includes(path.extname(file).slice(1).toLowerCase())) throw new Error("Choose an MP4, WebM, or MOV file");
    let environment = source.environmentId ? await bb.sdk.environments.get({environmentId: source.environmentId}) : null;
    if (!environment && source.threadId) {
      const thread = await bb.sdk.threads.get({threadId: source.threadId, include: "environment"});
      if ("environment" in thread) environment = thread.environment ?? null;
    }
    let hostId = source.experimental_hostId ?? environment?.hostId;
    let root = environment?.path;
    if (source.kind === "thread-storage" && source.threadId) {
      const storage = await bb.sdk.threads.storageFiles({threadId: source.threadId, limit: "1"});
      root = storage.storageRootPath;
    }
    if (!hostId) hostId = (await bb.sdk.system.config()).primaryHostId ?? undefined;
    if (!hostId) throw new Error("No machine is available for this video");
    if (source.kind === "host") {
      if (!path.isAbsolute(file)) throw new Error("Host video paths must be absolute");
      root = path.dirname(file);
    } else if (!root && source.projectId) {
      const project = await bb.sdk.projects.get({projectId: source.projectId});
      const sources = project.sources.filter(s => s.hostId === hostId);
      if (sources.length === 1) root = sources[0].path;
    }
    if (!root) throw new Error("This video needs a workspace or an absolute host path");
    const resolved = path.resolve(root, file);
    const relative = path.relative(root, resolved);
    if (relative === ".." || relative.startsWith(`..${path.sep}`) || path.isAbsolute(relative)) throw new Error("Video escapes its workspace");
    return {path: resolved, rootPath: root, hostId};
  }
  async function inspect(file: string, source: z.infer<typeof sourceSchema>, fps?: number, probe = true, retain = false): Promise<Media> {
    const resolved = await resolveFile(file, source);
    const result = await host.call("inspect", {path: resolved.path, rootPath: resolved.rootPath, probe, retain, ...(fps === undefined ? {} : {fps})}, {hostId: resolved.hostId});
    return {...result, hostId: resolved.hostId};
  }
  async function prepare(media: Media) {
    const live = await host.call("inspect", {path: media.path, rootPath: path.dirname(media.path), probe: false}, {hostId: media.hostId});
    if (live.size !== media.size || live.modifiedAt !== media.modifiedAt) throw new Error("This video changed on disk. Register the new render as a new version before reviewing it.");
    const now = Date.now();
    for (const [id, lease] of leases) if (lease.expiresAt <= now) leases.delete(id);
    const leaseId = randomUUID(), expiresAt = now + 3_600_000;
    leases.set(leaseId, {media, expiresAt});
    return {url: `/api/v1/plugins/${encodeURIComponent(bb.pluginId)}/http/media?lease=${leaseId}`, expiresAt, media};
  }
  const handlers = {
    async register(input: z.output<typeof registerSchema>) {
      const source = input.source ?? {kind: path.isAbsolute(input.file) ? "host" as const : "workspace" as const, threadId: input.threadId, environmentId: null, projectId: null};
      const media = await inspect(input.file, source, input.fps, true, input.attachment);
      const demo = input.demo ?? await currentDemo(input.threadId) ?? (videoName(media.path).replace(/\.[^.]+$/, "").slice(0,160) || "Video");
      const version = store.register({threadId: input.threadId, demo, summary: input.summary, media});
      await bb.storage.kv.set(`demo:${input.threadId}`, demo);
      changed(input.threadId); return version;
    },
    async versions(input: z.output<typeof libraryInput>) {
      const all = store.versions(input.threadId);
      return {versions: all.slice(input.offset, input.offset + 100).map(v => ({...v, media: {...v.media, frameTimes: []}})), nextOffset: all.length > input.offset + 100 ? input.offset + 100 : null, currentDemo: await currentDemo(input.threadId)};
    },
    async selectDemo({threadId, demo}: z.output<typeof demoInput>) {
      if (!store.versions(threadId).some(v => v.demo === demo)) throw new Error("This demo is no longer available");
      await bb.storage.kv.set(`demo:${threadId}`, demo); changed(threadId); return {demo};
    },
    version: ({threadId, versionId}: z.output<typeof target>) => store.version(threadId, versionId),
    preview: ({threadId, versionId}: z.output<typeof target>) => prepare(store.version(threadId, versionId).media),
    // A full frame scan must never delay the first playable URL.
    async openFile({file, source}: z.output<typeof openInput>) { return prepare(await inspect(file, source, undefined, false)); },
    probeFile: ({file, source}: z.output<typeof openInput>) => inspect(file, source),
    notes(input: z.output<typeof listSchema>) {
      const notes = store.notes(input.threadId).filter(n => (!input.demo || n.demo === input.demo) && (!input.versionId || n.versionId === input.versionId) && (!input.status || n.status === input.status) && (!input.actionable || isActionable(n.status)));
      return {notes: notes.slice(input.offset, input.offset + 100), nextOffset: notes.length > input.offset + 100 ? input.offset + 100 : null};
    },
    addNote(input: z.output<typeof noteInputSchema>) {
      const bytes = Buffer.from(input.still.dataUrl.split(",")[1], "base64");
      if (bytes[0] !== 0xff || bytes[1] !== 0xd8 || bytes[2] !== 0xff) throw new Error("A captured JPEG frame is required");
      const note = store.addNote(input); changed(input.threadId); return note;
    },
    status({threadId, noteId, status}: z.output<typeof statusInputSchema>) { const note = store.setStatus(threadId, noteId, status); changed(threadId); return note; },
    frame: ({threadId, noteId}: z.output<typeof frameTarget>) => store.still(threadId, noteId),
    context({threadId, noteIds}: z.output<typeof selectionSchema>) {
      const selected = [...new Set(noteIds)];
      const selectionId = store.saveSelection(threadId, selected);
      return {id: selectionId, count: selected.length, context: promptContext(selected.map(noteId => store.note(threadId, noteId)), store.versions(threadId))};
    },
    post({threadId, versionId}: z.output<typeof target>) {
      store.version(threadId, versionId);
      return {directive: directive(versionId), instruction: "Emit this directive exactly once on its own line in your reply, outside a code fence, after stating known rough spots."};
    },
  };
  bb.rpc.register(videoMarkupContract, handlers);
  bb.ui.registerMentionProvider({
    id: MENTION_PROVIDER, label: "Video Markup frame notes", search: () => [],
    resolve(selectionId) {
      const {threadId, noteIds} = store.selection(selectionId);
      const notes = noteIds.map(noteId => store.note(threadId, noteId));
      return {
        context: promptContext(notes, store.versions(threadId)),
        // Public additive SDK API documented in bb's Plugin Guide and api_to_audit.md.
        // Structural return typing also supports the repository's pinned declarations.
        experimental_images: notes.map(note => ({type: "image" as const, url: store.still(threadId, note.id).dataUrl, context: `Video Markup note ${note.id}; frame from version ${note.frameVersionId}, ${note.timestamp}s. ${note.text}`})),
      };
    },
  });
  async function present(input: z.output<typeof registerSchema>) {
    const version = await handlers.register(input);
    bb.realtime.publish("present", {threadId: input.threadId, versionId: version.id});
    return {version, ...handlers.post({threadId: input.threadId, versionId: version.id})};
  }
  const operations = {
    present: {schema: registerSchema, tool: "video_markup_present", description: "Present an attached or rendered video for markup: register it if needed, request its review panel, and return the inline player directive to emit. Set attachment=true for temporary composer attachment files.", run: present},
    register: {schema: registerSchema, tool: "video_markup_register_version", description: "Register a rendered demo version and carry forward unresolved notes.", run: handlers.register},
    versions: {schema: libraryInput, tool: "video_markup_versions", description: "List a thread's demos and versions in order.", run: handlers.versions},
    notes: {schema: listSchema, tool: "video_markup_list_notes", description: "Read frame notes before revising a demo; filter by version, status, or actionable.", run: handlers.notes},
    "add-note": {schema: noteInputSchema, tool: "video_markup_add_note", description: "Save a timestamped note, normalized box/arrow/zoom shapes, and a captured JPEG still.", run: handlers.addNote},
    status: {schema: statusInputSchema, tool: "video_markup_update_note_status", description: "Mark a note open, fixed, still wrong, or regressed. Its copies in later versions of the demo take the same status.", run: handlers.status},
    context: {schema: selectionSchema, tool: "video_markup_context", description: "Prepare selected actionable notes as structured prompt context.", run: handlers.context},
    frame: {schema: frameTarget, tool: "video_markup_frame", description: "Read the captured still for a frame note.", run: handlers.frame},
    post: {schema: target, tool: "video_markup_post_player", description: "Get a playable Video Markup directive to emit inline in the assistant reply.", run: handlers.post},
  };
  async function run(command: string, input: unknown) {
    const operation = operations[command as keyof typeof operations];
    if (!operation) throw new Error(`Unknown Video Markup command: ${command}`);
    return (operation.run as (value: unknown) => unknown)(operation.schema.parse(input));
  }
  for (const [command, operation] of Object.entries(operations)) {
    bb.agents.registerTool({name: operation.tool, description: operation.description,
      parameters: z.toJSONSchema(operation.schema, {io: "input"}),
      async execute(input, context) {
        const fields = z.record(z.string(), z.unknown()).parse(input);
        const result = await run(command, {...fields, threadId: fields.threadId ?? context.threadId});
        if (command === "frame") {
          const still = stillSchema.parse(result);
          return {content: [{type: "image" as const, data: still.dataUrl.split(",")[1], mimeType: "image/jpeg"}]};
        }
        return JSON.stringify(result);
      },
    });
  }
  bb.cli.register({name: "video-markup", summary: "Register demo versions and act on frame feedback",
    commands: Object.entries(operations).map(([name, operation]) => ({name, summary: operation.description, usage: `bb video-markup ${name} [--thread ID] [--data JSON] [--json]`})),
    async run(argv, context) {
      try {
        const {values, positionals} = parseArgs({args: argv, allowPositionals: true, options: {
          thread: {type: "string"}, demo: {type: "string"}, file: {type: "string"}, attachment: {type: "boolean"}, summary: {type: "string"}, fps: {type: "string"}, version: {type: "string"}, note: {type: "string"}, status: {type: "string"}, offset: {type: "string"}, actionable: {type: "boolean"}, data: {type: "string"}, json: {type: "boolean"}, help: {type: "boolean"},
        }});
        if (!positionals.length || values.help) return {exitCode: 0, stdout: `Video Markup commands: ${Object.keys(operations).join(", ")}\npresent --file PATH [--attachment] [--demo NAME] [--summary TEXT] [--fps N]\nUse --data JSON for note timestamps, shapes, stills, and selected note IDs. See the Video Markup README.\n`};
        if (positionals.length !== 1) throw new Error("Use named flags or --data JSON; unexpected positional argument");
        const fields: Record<string, unknown> = values.data ? z.record(z.string(), z.unknown()).parse(JSON.parse(values.data)) : {};
        for (const [flag, field] of Object.entries({thread: "threadId", demo: "demo", file: "file", attachment: "attachment", summary: "summary", version: "versionId", note: "noteId", status: "status", actionable: "actionable"})) {
          const value = values[flag as keyof typeof values]; if (value !== undefined) fields[field] = value;
        }
        for (const field of ["fps", "offset"] as const) if (values[field] !== undefined) fields[field] = Number(values[field]);
        fields.threadId ??= context.threadId;
        const result = await run(positionals[0], fields);
        return {exitCode: 0, stdout: JSON.stringify(result, null, 2) + "\n"};
      } catch (error) { return {exitCode: 1, stderr: `${error instanceof Error ? error.message : String(error)}\n`}; }
    },
  });
}
