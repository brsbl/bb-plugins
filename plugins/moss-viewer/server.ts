import { randomBytes } from "node:crypto";
import { posix } from "node:path";
import type { BbPluginApi } from "@get-bb/plugin-sdk";
import { ASSET_CHUNK_BYTES, hostContract, rpcContract, type AssetRefusal } from "./contract.js";
import { findViewerDirectory, frameDocument, loadViewerBundle } from "./viewer-bundle.js";

type HttpContext = Parameters<Parameters<BbPluginApi["http"]["route"]>[2]>[0];

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
  const host = bb.hosts.experimental_client({ contract: hostContract });
  const bundle = await loadViewerBundle(await findViewerDirectory(import.meta.url));
  const httpRoot = `/api/v1/plugins/${encodeURIComponent(bb.pluginId)}/http`;
  const frameUrl = `${httpRoot}${bundle.base}/frame.html`;

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

  bb.rpc.register(rpcContract, {
    read: async (input) => {
      const target = await locate(input);
      const note = await host.call("readNote", { path: target.path }, { hostId: target.hostId });
      if (!note.moss) return { moss: false as const };
      return { ...note, hostId: target.hostId, frameUrl, assetRoute: `${httpRoot}/asset` };
    },
    notes: async ({ hostId }) => ({ notes: (await host.call("listNotes", {}, { hostId })).notes }),
    openInMoss: ({ hostId, path }) => host.call("openInMoss", { path }, { hostId }),
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
    const notePath = context.req.query("note");
    const ref = context.req.query("ref");
    if (!hostId || !notePath || !ref || notePath.length > 4096 || ref.length > 4096 || hostId.length > 200) {
      return text("A note asset needs a host, a note, and a reference.", 400);
    }
    const read = (offset: number, length: number) =>
      host.call("readAsset", { notePath, ref, offset, length }, { hostId });
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
      const headers: Record<string, string> = {
        "accept-ranges": "bytes",
        "cache-control": "private, max-age=300",
        "content-security-policy": "sandbox; default-src 'none'; style-src 'unsafe-inline'",
        "content-type": first.contentType,
        "x-content-type-options": "nosniff",
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
