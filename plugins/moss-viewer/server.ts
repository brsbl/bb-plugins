import { randomBytes } from "node:crypto";
import { posix } from "node:path";
import type { BbPluginApi } from "@get-bb/plugin-sdk";
import {
  ASSET_CHUNK_BYTES,
  NOTE_CHANGED_CHANNEL,
  hostContract,
  hostSignals,
  rpcContract,
  type AssetRefusal,
  type HostNote,
  type NoteChanged,
} from "./contract.js";
import { editorSaves } from "./editor-saves.js";
import { findViewerDirectory, frameDocument, HTML_FRAME_CSP, loadViewerBundle } from "./viewer-bundle.js";

type HttpContext = Parameters<Parameters<BbPluginApi["http"]["route"]>[2]>[0];

/** How long one other host may take to answer before the note is looked for elsewhere. */
const PROBE_TIMEOUT_MS = 10_000;

const REFUSAL_STATUS: Readonly<Record<AssetRefusal, number>> = {
  invalid: 400,
  not_found: 404,
  not_allowed: 403,
  unsupported: 415,
};

export type ByteRange =
  | { kind: "range"; start: number; end: number | null }
  | { kind: "suffix"; length: number };

/** One `bytes=` range; anything else (multiple ranges, other units) is served whole, as RFC 9110 allows. */
export function parseRange(header: string | undefined): ByteRange | null {
  const match = header?.trim().match(/^bytes=(\d*)-(\d*)$/);
  if (!match || (match[1] === "" && match[2] === "")) return null;
  if (match[1] === "") return { kind: "suffix", length: Number(match[2]) };
  const start = Number(match[1]);
  const end = match[2] === "" ? null : Number(match[2]);
  if (!Number.isSafeInteger(start) || (end !== null && (!Number.isSafeInteger(end) || end < start))) return null;
  return { kind: "range", start, end };
}

function text(body: string, status: number, headers: Record<string, string> = {}): Response {
  return new Response(body, { status, headers: { "content-type": "text/plain; charset=utf-8", ...headers } });
}

function decode(data: string): Uint8Array<ArrayBuffer> {
  return new Uint8Array(Buffer.from(data, "base64"));
}

function acceptsGzip(header: string | undefined): boolean {
  return (header ?? "").split(",").some((part) => {
    const [coding, ...params] = part.trim().toLowerCase().split(";");
    return coding === "gzip" && !params.some((param) => param.trim() === "q=0");
  });
}

export default async function plugin(bb: BbPluginApi): Promise<void> {
  const host = bb.hosts.experimental_client({ contract: hostContract, experimental_signals: hostSignals });
  // A note changed outside bb: tell open editors, which compare the version with their own.
  host.experimental_onSignal("editorNoteChanged", ({ hostId, payload }) => {
    bb.realtime.publish(NOTE_CHANGED_CHANNEL, { hostId, ...payload } satisfies NoteChanged);
  });
  const saves = editorSaves(bb);
  const bundle = await loadViewerBundle(await findViewerDirectory(import.meta.url));
  const httpRoot = `/api/v1/plugins/${encodeURIComponent(bb.pluginId)}/http`;
  const frameUrl = `${httpRoot}${bundle.base}/frame.html`;
  const htmlFramePath = `${bundle.base}/moss-viewer-frame.html`;

  async function locate(input: {
    kind: "host" | "workspace";
    path: string;
    hostId: string | null;
    environmentId: string | null;
  }): Promise<{ hostId: string; path: string }> {
    if (input.kind === "host") {
      if (!posix.isAbsolute(input.path)) throw new Error("A host file path must be absolute.");
      if (input.hostId !== null) return { hostId: input.hostId, path: input.path };
      if (input.environmentId === null) throw new Error("This file has no host to read it from.");
      const environment = await bb.sdk.environments.get({ environmentId: input.environmentId });
      return { hostId: environment.hostId, path: input.path };
    }
    if (input.environmentId === null) throw new Error("This workspace file has no environment.");
    const relativePath = posix.normalize(input.path);
    if (posix.isAbsolute(relativePath) || relativePath === ".." || relativePath.startsWith("../")) {
      throw new Error("A workspace file path must stay inside its worktree.");
    }
    const environment = await bb.sdk.environments.get({ environmentId: input.environmentId });
    if (!environment.path) throw new Error("This environment has no worktree yet.");
    return { hostId: environment.hostId, path: posix.join(environment.path, relativePath) };
  }

  const opened = (note: Extract<HostNote, { moss: true }>, hostId: string) => ({
    ...note,
    hostId,
    frameUrl,
    htmlFrameUrl: `${httpRoot}${htmlFramePath}`,
    assetRoute: `${httpRoot}/asset`,
  });

  /**
   * bb implies a chat link's host from the thread's environment, which may not be
   * the machine that holds the notes. Ask every other connected host: a slow or
   * offline one must not block one that has the note, and the lowest host ID wins
   * when several have it.
   */
  async function findNoteElsewhere(path: string, checked: string, hosts: ReadonlyArray<{ id: string; status: string }>) {
    const candidates = hosts
      .filter((machine) => machine.status === "connected" && machine.id !== checked)
      .map((machine) => machine.id)
      .sort();
    const probes = await Promise.allSettled(
      candidates.map((hostId) => host.call("readNote", { path }, { hostId, timeoutMs: PROBE_TIMEOUT_MS })),
    );
    for (const [index, probe] of probes.entries()) {
      if (probe.status === "fulfilled" && probe.value.moss) return opened(probe.value, candidates[index]!);
    }
    return null;
  }

  bb.rpc.register(rpcContract, {
    read: async (input) => {
      const target = await locate(input);
      const impliedHost = input.kind === "host" && input.hostId === null;
      const note = await host.call("readNote", { path: target.path }, { hostId: target.hostId }).catch((error: unknown) => {
        if (impliedHost) return null;
        throw error;
      });
      if (note !== null) {
        if (note.moss) return opened(note, target.hostId);
        // An existing file that is not a Moss note is bb's preview's to show.
        if (!note.missing) return { moss: false as const, message: null };
      }
      // So is a missing workspace file: bb resolved it inside the thread's own worktree.
      if (input.kind === "workspace") return { moss: false as const, message: null };
      let hosts: Awaited<ReturnType<typeof bb.sdk.hosts.list>> = [];
      try {
        hosts = await bb.sdk.hosts.list();
      } catch {
        // Without the host list, only the host bb implied has been checked.
      }
      const hostName = hosts.find((machine) => machine.id === target.hostId)?.name ?? target.hostId;
      if (!impliedHost) return { moss: false as const, message: `${target.path} is not on ${hostName}.` };
      const found = await findNoteElsewhere(target.path, target.hostId, hosts);
      if (found) return found;
      return {
        moss: false as const,
        message:
          note === null
            ? `${hostName} could not be reached, and no other connected machine has ${target.path} as a Moss note.`
            : `${target.path} is not on ${hostName}, and no other connected machine has it as a Moss note.`,
      };
    },
    notes: async ({ hostId }) => ({ notes: (await host.call("listNotes", {}, { hostId })).notes }),
    openInMoss: ({ hostId, path }) => host.call("openInMoss", { path }, { hostId }),
    // The editor's file bridge: every call goes to the note's host.
    editorRead: ({ hostId, ...input }) => host.call("editorRead", input, { hostId }),
    editorReadCompanion: ({ hostId, ...input }) => host.call("editorReadCompanion", input, { hostId }),
    editorWrite: ({ hostId, ...input }) => host.call("editorWrite", input, { hostId }),
    editorWatch: ({ hostId, ...input }) => host.call("editorWatch", input, { hostId }),
    editorAssetChunk: ({ hostId, ...input }) => host.call("editorAssetChunk", input, { hostId }),
    editorAssetCommit: ({ hostId, ...input }) => host.call("editorAssetCommit", input, { hostId }),
    editorAssetCopy: ({ hostId, ...input }) => host.call("editorAssetCopy", input, { hostId }),
    editorKeep: ({ hostId, noteId, kind, draft }) => {
      if (draft.noteId !== noteId) throw new Error("This draft belongs to another note.");
      saves.keep(hostId, noteId, kind, draft);
      return { kept: true as const };
    },
    editorKept: ({ hostId, noteId }) => saves.kept(hostId, noteId),
    editorForget: ({ hostId, noteId, kind }) => {
      saves.forget(hostId, noteId, kind);
      return { forgotten: true as const };
    },
  });

  bb.http.route(
    "GET",
    `${bundle.base}/frame.html`,
    () => {
      const { html, csp } = frameDocument(randomBytes(18).toString("base64"));
      return new Response(html, {
        headers: {
          "cache-control": "no-store",
          "content-security-policy": csp,
          "content-type": "text/html; charset=utf-8",
          "x-content-type-options": "nosniff",
        },
      });
    },
    { auth: "local" },
  );

  bb.http.route(
    "GET",
    htmlFramePath,
    () =>
      new Response(bundle.htmlFrame, {
        headers: {
          "cache-control": "no-store",
          "content-security-policy": HTML_FRAME_CSP,
          "content-type": "text/html; charset=utf-8",
          "x-content-type-options": "nosniff",
        },
      }),
    { auth: "local" },
  );

  for (const [name, file] of bundle.files) {
    bb.http.route(
      "GET",
      `${bundle.base}/${name}`,
      (context) => {
        const gzip = file.gzip !== undefined && acceptsGzip(context.req.header("accept-encoding"));
        const headers: Record<string, string> = {
          "cache-control": "private, max-age=31536000, immutable",
          "content-type": file.contentType,
          "x-content-type-options": "nosniff",
        };
        if (file.gzip) headers.vary = "accept-encoding";
        if (gzip) headers["content-encoding"] = "gzip";
        return new Response(gzip ? file.gzip : file.body, { headers });
      },
      { auth: "local" },
    );
  }

  bb.http.route("GET", "/asset", (context) => serveAsset(context), { auth: "local" });

  async function serveAsset(context: HttpContext): Promise<Response> {
    const hostId = context.req.query("host");
    // The viewer names a note by path; the editor by meta.json id, which survives a folder rename.
    const notePath = context.req.query("note");
    const noteId = context.req.query("id");
    const ref = context.req.query("ref");
    const note = notePath ?? noteId;
    if (!hostId || !note || !ref || note.length > 4096 || (noteId && noteId.length > 200) || ref.length > 4096 || hostId.length > 200) {
      return text("A note asset needs a host, a note, and a reference.", 400);
    }
    const read = (offset: number, length: number) =>
      notePath
        ? host.call("readAsset", { notePath, ref, offset, length }, { hostId })
        : host.call("editorAsset", { noteId: note, ref, offset, length }, { hostId });
    const range = parseRange(context.req.header("range"));
    try {
      let start = 0;
      let end: number | null = null;
      if (range?.kind === "suffix") {
        const probe = await read(0, 0);
        if (!probe.ok) return text(probe.message, REFUSAL_STATUS[probe.code]);
        if (range.length === 0 || probe.size === 0) {
          return text("Range not satisfiable", 416, { "content-range": `bytes */${probe.size}` });
        }
        start = Math.max(0, probe.size - range.length);
        end = probe.size - 1;
      } else if (range?.kind === "range") {
        start = range.start;
        end = range.end;
      }
      const first = await read(start, end === null ? ASSET_CHUNK_BYTES : Math.min(end - start + 1, ASSET_CHUNK_BYTES));
      if (!first.ok) return text(first.message, REFUSAL_STATUS[first.code]);
      // An SVG can carry script: it renders only through <img>, and opened on its own
      // it is a download in an opaque origin, never a document on bb's origin.
      const svg = first.contentType === "image/svg+xml";
      const headers: Record<string, string> = {
        "accept-ranges": "bytes",
        "cache-control": "private, max-age=300",
        "content-security-policy": svg ? "sandbox; default-src 'none'" : "sandbox; default-src 'none'; style-src 'unsafe-inline'",
        "content-type": first.contentType,
        "x-content-type-options": "nosniff",
        ...(svg ? { "content-disposition": "attachment" } : {}),
      };
      const firstBody = decode(first.data);
      if (range !== null) {
        if (start >= first.size) {
          return text("Range not satisfiable", 416, { "content-range": `bytes */${first.size}` });
        }
        // A partial reply may be shorter than asked; media elements request the next range.
        headers["content-range"] = `bytes ${start}-${start + firstBody.length - 1}/${first.size}`;
        headers["content-length"] = String(firstBody.length);
        return new Response(firstBody, { status: 206, headers });
      }
      headers["content-length"] = String(first.size);
      let offset = firstBody.length;
      const body = new ReadableStream<Uint8Array>({
        start(controller) {
          if (firstBody.length > 0) controller.enqueue(firstBody);
          if (offset >= first.size) controller.close();
        },
        async pull(controller) {
          const next = await read(offset, ASSET_CHUNK_BYTES).catch(() => null);
          if (!next?.ok || next.size !== first.size || next.modifiedMs !== first.modifiedMs || next.data === "") {
            controller.error(new Error("The asset changed or became unavailable while it was being sent."));
            return;
          }
          const chunk = decode(next.data);
          offset += chunk.length;
          controller.enqueue(chunk);
          if (offset >= first.size) controller.close();
        },
      });
      return new Response(body, { status: 200, headers });
    } catch (error) {
      bb.log.warn(`Note asset read failed on ${hostId}: ${error instanceof Error ? error.message : String(error)}`);
      return text("The note's host could not read this file.", 502);
    }
  }
}
