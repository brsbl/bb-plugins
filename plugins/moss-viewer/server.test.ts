import { createHash } from "node:crypto";
import { cp, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { gunzipSync } from "node:zlib";
import { createFakePluginHost, makeHostResponse } from "@get-bb/plugin-sdk/testing";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ASSET_CHUNK_BYTES } from "./contract.js";
import plugin, { parseRange } from "./server.js";
import { loadViewerBundle } from "./viewer-bundle.js";

const vendor = fileURLToPath(new URL("./vendor/moss-viewer/", import.meta.url));
const httpRoot = "/api/v1/plugins/moss-viewer/http";
const video = Buffer.from(Array.from({ length: ASSET_CHUNK_BYTES * 2 + 10 }, (_, index) => index % 251));
const notePath = "/Users/me/Moss/Notes/Clip/Clip.md";
const V1 = "sha256:content-1";
const V2 = "sha256:content-2";
const M1 = "sha256:meta-1";
const NOTE_ID = "6f1c2a8e-3b4d-4e5f-8a9b-0c1d2e3f4a5b";
const location = { folderPath: "Notes", folderName: "Clip", markdownName: "Clip.md" };

const disposers: Array<() => Promise<void>> = [];
afterEach(async () => {
  for (const dispose of disposers.splice(0)) await dispose();
});

interface Machines {
  /** The thread environment's host. */
  envHost?: string;
  hosts?: Array<{ id: string; name: string; status: "connected" | "disconnected" }>;
  /** What each host has at a path. Without it, every host has every /Moss/ path as a note. */
  files?: Record<string, Record<string, "moss" | "plain">>;
}

async function setup(machines: Machines = {}) {
  const { bb, harness } = createFakePluginHost({
    pluginId: "moss-viewer",
    experimental_hostEntry: true,
    sdk: {
      environments: { get: async () => ({ hostId: machines.envHost ?? "mac", path: "/Users/me/project" }) },
      hosts: { list: async () => (machines.hosts ?? []).map((machine) => makeHostResponse(machine)) },
    } as never,
    experimental_callHostRpc: async ({ method, input, hostId }) => {
      if (hostId === "offline") throw new Error("Host offline");
      const request = input as Record<string, unknown>;
      if (method === "readNote") {
        const path = request.path as string;
        const file = machines.files ? machines.files[hostId]?.[path] : path.includes("/Moss/") ? "moss" : "plain";
        if (file === "moss") return { moss: true, path, markdown: "# Clip\n", layout: null, noteId: "clip", modifiedMs: 1 };
        return { moss: false, path, missing: file === undefined };
      }
      if (method === "editorRead") return { kind: "note", files: { markdown: "# Clip\n", comments: null, layout: null, meta: "{}" }, location, version: V1, metaVersion: M1 };
      if (method === "editorReadCompanion") return { kind: "absent", version: V2 };
      if (method === "editorWrite") return { kind: "saved", version: V2, metaVersion: M1, location };
      if (method === "editorWatch") return { kind: "changed", version: V1, metaVersion: M1 };
      if (method === "editorAssetChunk") return { kind: "staged", size: Buffer.from(request.data as string, "base64").length };
      if (method === "editorAssetCommit" || method === "editorAssetCopy") return { kind: "stored", ref: `assets/${request.name as string}` };
      if (method === "editorAsset") {
        const start = Math.min(request.offset as number, video.length);
        return { ok: true, contentType: "video/mp4", size: video.length, modifiedMs: 1, offset: start, data: video.subarray(start, start + (request.length as number)).toString("base64") };
      }
      if (method === "listNotes") {
        return { notes: [{ id: "clip", title: "Clip", path: notePath, folderPath: "Notes" }], truncated: false };
      }
      if (method === "openInMoss") return { opened: true };
      if (method === "readAsset") {
        if (request.ref === "assets/missing.mp4") return { ok: false, code: "not_found", message: "assets/missing.mp4 is not in this note's folder." };
        if (request.ref === "assets/drawing.svg") return { ok: true, contentType: "image/svg+xml", size: 4, modifiedMs: 1, offset: 0, data: Buffer.from("<svg").toString("base64") };
        const start = Math.min(request.offset as number, video.length);
        const end = Math.min(start + (request.length as number), video.length);
        return { ok: true, contentType: "video/mp4", size: video.length, modifiedMs: 1, offset: start, data: video.subarray(start, end).toString("base64") };
      }
      throw new Error(`unexpected ${method}`);
    },
  });
  await plugin(bb);
  disposers.push(() => harness.lifecycle.dispose());
  return harness;
}

function assetPath(ref: string, host = "mac") {
  return `/asset?${new URLSearchParams({ host, note: notePath, ref }).toString()}`;
}

async function bytes(response: Response): Promise<Buffer> {
  return Buffer.from(await response.arrayBuffer());
}

describe("reading notes", () => {
  it("reads host files on the named host or the thread's environment host, and workspace files inside the worktree", async () => {
    const h = await setup();
    const result = (await h.behavior.callRpc("read", { kind: "host", path: notePath, hostId: null, environmentId: "env" })) as Record<string, unknown>;
    expect(result).toMatchObject({ moss: true, hostId: "mac", path: notePath, markdown: "# Clip\n", noteId: "clip", assetRoute: `${httpRoot}/asset` });
    expect(result.frameUrl).toMatch(new RegExp(`^${httpRoot}/viewer/[0-9a-f]{16}/frame\\.html$`));
    expect(h.inspection.experimental_hostRpcCalls.at(-1)).toMatchObject({ method: "readNote", hostId: "mac", input: { path: notePath } });

    await h.behavior.callRpc("read", { kind: "host", path: notePath, hostId: "studio", environmentId: null });
    expect(h.inspection.experimental_hostRpcCalls.at(-1)).toMatchObject({ hostId: "studio" });

    expect(await h.behavior.callRpc("read", { kind: "workspace", path: "docs/plan.md", hostId: null, environmentId: "env" })).toEqual({ moss: false, message: null });
    expect(h.inspection.experimental_hostRpcCalls.at(-1)).toMatchObject({ input: { path: "/Users/me/project/docs/plan.md" } });
    await expect(h.behavior.callRpc("read", { kind: "workspace", path: "../secret.md", hostId: null, environmentId: "env" })).rejects.toThrow("inside its worktree");
    await expect(h.behavior.callRpc("read", { kind: "host", path: notePath, hostId: null, environmentId: null })).rejects.toThrow("no host");
  });

  describe("a note on another machine than the thread's", () => {
    const hosts = [
      { id: "linux", name: "bb-worker-1", status: "connected" as const },
      { id: "mac-b", name: "Studio", status: "connected" as const },
      { id: "mac-a", name: "MacBook", status: "connected" as const },
      { id: "offline", name: "Old Mac", status: "connected" as const },
      { id: "mac-away", name: "Away", status: "disconnected" as const },
    ];
    const chatLink = { kind: "host", path: notePath, hostId: null, environmentId: "env" };
    const readNoteHosts = (h: Awaited<ReturnType<typeof setup>>) =>
      h.inspection.experimental_hostRpcCalls.filter((call) => call.method === "readNote").map((call) => call.hostId);

    it("reads it from the connected host that has it, lowest host ID first, past an unreachable one", async () => {
      const h = await setup({ envHost: "linux", hosts, files: { "mac-a": { [notePath]: "moss" }, "mac-b": { [notePath]: "moss" } } });
      expect(await h.behavior.callRpc("read", chatLink)).toMatchObject({ moss: true, hostId: "mac-a", path: notePath });
      const probed = readNoteHosts(h);
      expect(probed[0]).toBe("linux");
      expect([...probed.slice(1)].sort()).toEqual(["mac-a", "mac-b", "offline"]);
    });

    it("prefers a host where the path is a Moss note", async () => {
      const h = await setup({ envHost: "linux", hosts, files: { "mac-a": { [notePath]: "plain" }, "mac-b": { [notePath]: "moss" } } });
      expect(await h.behavior.callRpc("read", chatLink)).toMatchObject({ moss: true, hostId: "mac-b" });
    });

    it("looks elsewhere when the thread's host cannot be reached", async () => {
      const h = await setup({ envHost: "offline", hosts, files: { "mac-b": { [notePath]: "moss" } } });
      expect(await h.behavior.callRpc("read", chatLink)).toMatchObject({ moss: true, hostId: "mac-b" });
    });

    it("names the host it checked when no connected host has the note", async () => {
      expect(await (await setup({ envHost: "linux", hosts, files: {} })).behavior.callRpc("read", chatLink)).toEqual({
        moss: false,
        message: `${notePath} is not on bb-worker-1, and no other connected machine has it as a Moss note.`,
      });
      expect(await (await setup({ envHost: "offline", hosts, files: {} })).behavior.callRpc("read", chatLink)).toEqual({
        moss: false,
        message: `Old Mac could not be reached, and no other connected machine has ${notePath} as a Moss note.`,
      });
    });

    it("asks no other host when bb named the host, the file exists as plain Markdown, or it is a workspace file", async () => {
      const named = await setup({ envHost: "linux", hosts, files: { "mac-a": { [notePath]: "moss" } } });
      expect(await named.behavior.callRpc("read", { ...chatLink, hostId: "linux" })).toEqual({
        moss: false,
        message: `${notePath} is not on bb-worker-1.`,
      });
      expect(readNoteHosts(named)).toEqual(["linux"]);

      const plain = await setup({ envHost: "linux", hosts, files: { linux: { [notePath]: "plain" }, "mac-a": { [notePath]: "moss" } } });
      expect(await plain.behavior.callRpc("read", chatLink)).toEqual({ moss: false, message: null });
      expect(readNoteHosts(plain)).toEqual(["linux"]);

      const workspace = await setup({ envHost: "linux", hosts, files: { "mac-a": { "/Users/me/project/Tweets.md": "moss" } } });
      expect(await workspace.behavior.callRpc("read", { kind: "workspace", path: "Tweets.md", hostId: null, environmentId: "env" })).toEqual({
        moss: false,
        message: null,
      });
      expect(readNoteHosts(workspace)).toEqual(["linux"]);
    });
  });

  it("lists notes and opens a note in Moss on the note's host", async () => {
    const h = await setup();
    expect(await h.behavior.callRpc("notes", { hostId: "mac" })).toEqual({
      notes: [{ id: "clip", title: "Clip", path: notePath, folderPath: "Notes" }],
    });
    expect(await h.behavior.callRpc("openInMoss", { hostId: "mac", path: notePath })).toEqual({ opened: true });
    expect(h.inspection.experimental_hostRpcCalls.at(-1)).toMatchObject({ method: "openInMoss", hostId: "mac", input: { path: notePath } });
  });
});

describe("the editor's file bridge", () => {
  const write = {
    baseVersion: V1,
    baseMetaVersion: M1,
    companions: [],
    rename: null,
    ops: [
      { kind: "put", file: "markdown", text: "# Clip\n\nMore.\n" },
      { kind: "delete", file: "comments" },
      { kind: "put", file: "meta", text: "{}" },
    ],
  };

  it("sends each bridge call to the note's host by id", async () => {
    const h = await setup();
    const lastCall = () => h.inspection.experimental_hostRpcCalls.at(-1);
    const calls: Array<[string, Record<string, unknown>, unknown]> = [
      ["editorRead", { noteId: NOTE_ID }, { kind: "note", files: { markdown: "# Clip\n", comments: null, layout: null, meta: "{}" }, location, version: V1, metaVersion: M1 }],
      ["editorReadCompanion", { noteId: NOTE_ID, relativePath: "assets/plan-mockup.html" }, { kind: "absent", version: V2 }],
      ["editorWrite", { noteId: NOTE_ID, write }, { kind: "saved", version: V2, metaVersion: M1, location }],
      ["editorWatch", { noteId: NOTE_ID }, { kind: "changed", version: V1, metaVersion: M1 }],
      ["editorAssetChunk", { noteId: NOTE_ID, upload: "f".repeat(32), offset: 0, data: "AAEC" }, { kind: "staged", size: 3 }],
      [
        "editorAssetCommit",
        { noteId: NOTE_ID, upload: "f".repeat(32), name: "shot-1-abcd1234.png", mimeType: "image/png", size: 3 },
        { kind: "stored", ref: "assets/shot-1-abcd1234.png" },
      ],
      [
        "editorAssetCopy",
        { noteId: NOTE_ID, sourceNoteId: "0f1c2a8e-3b4d-4e5f-8a9b-0c1d2e3f4a5b", sourceRef: "assets/a.png", name: "a-1-abcd1234.png" },
        { kind: "stored", ref: "assets/a-1-abcd1234.png" },
      ],
    ];
    for (const [method, input, output] of calls) {
      expect(await h.behavior.callRpc(method, { hostId: "studio", ...input })).toEqual(output);
      expect(lastCall()).toMatchObject({ method, hostId: "studio", input });
    }
  });

  it("keeps a malformed write from reaching the host", async () => {
    const h = await setup();
    const send = (changes: Record<string, unknown>) => h.behavior.callRpc("editorWrite", { hostId: "mac", noteId: NOTE_ID, write: { ...write, ...changes } });
    const [markdown, comments, meta] = write.ops;
    // Out of order, without meta.json, a rename without its markdown, a markdown delete, and an unknown file.
    await expect(send({ ops: [meta, markdown] })).rejects.toThrow();
    await expect(send({ ops: [markdown, comments] })).rejects.toThrow();
    await expect(send({ rename: { kind: "renameFolder", desiredName: "Clip 2" }, ops: [meta] })).rejects.toThrow();
    await expect(send({ ops: [{ kind: "delete", file: "markdown" }, meta] })).rejects.toThrow();
    await expect(send({ ops: [{ kind: "put", file: "notes.txt", text: "" }, meta] })).rejects.toThrow();
    await expect(
      h.behavior.callRpc("editorAssetCommit", { hostId: "mac", noteId: NOTE_ID, upload: "f".repeat(32), name: "../a.png", mimeType: "image/png", size: 1 }),
    ).rejects.toThrow();
    await expect(h.behavior.callRpc("editorReadCompanion", { hostId: "mac", noteId: NOTE_ID, relativePath: "~/.ssh/id_ed25519" })).rejects.toThrow();
    await expect(h.behavior.callRpc("editorReadCompanion", { hostId: "mac", noteId: NOTE_ID, relativePath: "/etc/hosts" })).rejects.toThrow();
    expect(h.inspection.experimental_hostRpcCalls).toEqual([]);
  });

  it("tells open editors when a note changes outside bb", async () => {
    const h = await setup();
    await h.experimental_emitHostSignal("mac", "editorNoteChanged", { noteId: NOTE_ID, change: { kind: "changed", version: V2, metaVersion: M1 } });
    await h.experimental_emitHostSignal("mac", "editorNoteChanged", { noteId: NOTE_ID, change: { kind: "removed", reason: "trashed" } });
    expect(h.realtimeSignals).toEqual([
      { channel: "editor-note-changed", payload: { hostId: "mac", noteId: NOTE_ID, change: { kind: "changed", version: V2, metaVersion: M1 } } },
      { channel: "editor-note-changed", payload: { hostId: "mac", noteId: NOTE_ID, change: { kind: "removed", reason: "trashed" } } },
    ]);
  });

  it("serves an editor's media by note id", async () => {
    const h = await setup();
    const response = await h.behavior.fetchHttp("GET", `/asset?${new URLSearchParams({ host: "mac", id: NOTE_ID, ref: "assets/clip.mp4" }).toString()}`, {
      headers: { range: "bytes=5-9" },
    });
    expect(response.status).toBe(206);
    expect((await bytes(response)).equals(video.subarray(5, 10))).toBe(true);
    expect(h.inspection.experimental_hostRpcCalls.at(-1)).toMatchObject({ method: "editorAsset", input: { noteId: NOTE_ID, ref: "assets/clip.mp4", offset: 5, length: 5 } });
  });
});

describe("kept drafts and save receipts", () => {
  const draftFor = (markdown: string, noteId = NOTE_ID) => ({
    noteId,
    baseVersion: V1,
    companions: [],
    files: { markdown, comments: null, layout: null },
    intents: { frontmatterMetaUpdates: {}, commentColors: { c1: 2 } },
    at: 1,
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("keeps each note's latest receipt and unsaved draft apart, per host, until forgotten", async () => {
    const h = await setup();
    const kept = (hostId = "mac") => h.behavior.callRpc("editorKept", { hostId, noteId: NOTE_ID });
    expect(await kept()).toEqual({ receipt: null, draft: null });

    await h.behavior.callRpc("editorKeep", { hostId: "mac", noteId: NOTE_ID, kind: "receipt", draft: draftFor("# One\n") });
    await h.behavior.callRpc("editorKeep", { hostId: "mac", noteId: NOTE_ID, kind: "receipt", draft: draftFor("# Two\n") });
    await h.behavior.callRpc("editorKeep", { hostId: "mac", noteId: NOTE_ID, kind: "draft", draft: draftFor("# Unsaved\n") });
    expect(await kept()).toEqual({ receipt: draftFor("# Two\n"), draft: draftFor("# Unsaved\n") });
    expect(await kept("studio")).toEqual({ receipt: null, draft: null });

    expect(await h.behavior.callRpc("editorForget", { hostId: "mac", noteId: NOTE_ID, kind: "draft" })).toEqual({ forgotten: true });
    expect(await kept()).toEqual({ receipt: draftFor("# Two\n"), draft: null });
    await expect(
      h.behavior.callRpc("editorKeep", { hostId: "mac", noteId: NOTE_ID, kind: "draft", draft: draftFor("# Other\n", "0f1c2a8e-3b4d-4e5f-8a9b-0c1d2e3f4a5b") }),
    ).rejects.toThrow("another note");
  });

  it("lets a kept receipt lapse after thirty days", async () => {
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(new Date("2026-10-05T00:00:00Z"));
    const h = await setup();
    await h.behavior.callRpc("editorKeep", { hostId: "mac", noteId: NOTE_ID, kind: "receipt", draft: draftFor("# Old\n") });
    vi.setSystemTime(new Date("2026-11-05T00:00:00Z"));
    expect(await h.behavior.callRpc("editorKept", { hostId: "mac", noteId: NOTE_ID })).toEqual({ receipt: null, draft: null });
  });
});

describe("the viewer bundle", () => {
  it("serves the verified bundle and its frame from one immutable prefix", async () => {
    const h = await setup();
    const { frameUrl } = (await h.behavior.callRpc("read", { kind: "host", path: notePath, hostId: "mac", environmentId: null })) as { frameUrl: string };
    const base = frameUrl.slice(httpRoot.length).replace(/\/frame\.html$/, "");

    const frame = await h.behavior.fetchHttp("GET", `${base}/frame.html?theme=dark`);
    expect(frame.status).toBe(200);
    expect(frame.headers.get("content-type")).toBe("text/html; charset=utf-8");
    expect(frame.headers.get("cache-control")).toBe("no-store");
    const nonce = frame.headers.get("content-security-policy")?.match(/script-src 'nonce-([^']+)' 'strict-dynamic'/)?.[1];
    expect(nonce).toBeTruthy();
    const html = await frame.text();
    expect(html).toContain(`<script nonce="${nonce}" src="./theme.js">`);
    expect(html).toContain(`<script type="module" nonce="${nonce}" src="./frame.js">`);
    expect(html).toContain("./moss-viewer.css");
    const again = await h.behavior.fetchHttp("GET", `${base}/frame.html`);
    expect(again.headers.get("content-security-policy")).not.toContain(`'nonce-${nonce}'`);
    expect(await (await h.behavior.fetchHttp("GET", `${base}/frame.js`)).text()).toContain('from "./moss-viewer.js"');

    const script = await h.behavior.fetchHttp("GET", `${base}/moss-viewer.js`, { headers: { "accept-encoding": "gzip, br" } });
    expect(script.headers.get("content-encoding")).toBe("gzip");
    expect(script.headers.get("cache-control")).toContain("immutable");
    expect(gunzipSync(await bytes(script)).equals(await readFile(join(vendor, "moss-viewer.js")))).toBe(true);

    const font = await h.behavior.fetchHttp("GET", `${base}/assets/inter-latin-wght-normal-Dx4kXJAl.woff2`);
    expect(font.headers.get("content-type")).toBe("font/woff2");
    expect(font.headers.get("content-encoding")).toBeNull();
    expect((await bytes(font)).equals(await readFile(join(vendor, "assets/inter-latin-wght-normal-Dx4kXJAl.woff2")))).toBe(true);
  });

  it("records the release the vendored bundle came from", async () => {
    const provenance = JSON.parse(await readFile(join(vendor, "../moss-viewer.provenance.json"), "utf8")) as Record<string, any>;
    const manifest = await readFile(join(vendor, "viewer.json"));
    const record = JSON.parse(manifest.toString("utf8")) as Record<string, any>;
    expect(provenance).toMatchObject({
      version: record.version,
      api: record.api,
      release: { tag: `viewer-v${record.version}` },
      build: { sourceCommit: record.source.commit },
      mossPin: record.moss.commit,
      bundleHash: record.bundleHash,
      viewerJsonSha256: createHash("sha256").update(manifest).digest("hex"),
    });
    expect((await loadViewerBundle(vendor)).bundleHash).toBe(record.bundleHash);
  });

  it("refuses a bundle whose files no longer match viewer.json", async () => {
    const copy = await mkdtemp(join(tmpdir(), "moss-viewer-bundle-"));
    try {
      await cp(vendor, copy, { recursive: true });
      await writeFile(join(copy, "moss-viewer.css"), `${await readFile(join(copy, "moss-viewer.css"), "utf8")}\n/* edited */`);
      await expect(loadViewerBundle(copy)).rejects.toThrow("moss-viewer.css does not match viewer.json");
    } finally {
      await rm(copy, { recursive: true, force: true });
    }
  });
});

describe("note media", () => {
  it("answers Range requests with 206 in bounded chunks", async () => {
    const h = await setup();
    const open = await h.behavior.fetchHttp("GET", assetPath("assets/clip.mp4"), { headers: { range: "bytes=0-" } });
    expect(open.status).toBe(206);
    expect(open.headers.get("accept-ranges")).toBe("bytes");
    expect(open.headers.get("content-type")).toBe("video/mp4");
    expect(open.headers.get("content-range")).toBe(`bytes 0-${ASSET_CHUNK_BYTES - 1}/${video.length}`);
    expect((await bytes(open)).equals(video.subarray(0, ASSET_CHUNK_BYTES))).toBe(true);

    const middle = await h.behavior.fetchHttp("GET", assetPath("assets/clip.mp4"), { headers: { range: "bytes=5-9" } });
    expect(middle.headers.get("content-range")).toBe(`bytes 5-9/${video.length}`);
    expect((await bytes(middle)).equals(video.subarray(5, 10))).toBe(true);

    const tail = await h.behavior.fetchHttp("GET", assetPath("assets/clip.mp4"), { headers: { range: "bytes=-4" } });
    expect(tail.headers.get("content-range")).toBe(`bytes ${video.length - 4}-${video.length - 1}/${video.length}`);
    expect((await bytes(tail)).equals(video.subarray(video.length - 4))).toBe(true);

    const past = await h.behavior.fetchHttp("GET", assetPath("assets/clip.mp4"), { headers: { range: `bytes=${video.length}-` } });
    expect(past.status).toBe(416);
    expect(past.headers.get("content-range")).toBe(`bytes */${video.length}`);
  });

  it("streams a whole file across host reads when no range is asked for", async () => {
    const h = await setup();
    const whole = await h.behavior.fetchHttp("GET", assetPath("assets/clip.mp4"));
    expect(whole.status).toBe(200);
    expect(whole.headers.get("content-length")).toBe(String(video.length));
    expect(whole.headers.get("x-content-type-options")).toBe("nosniff");
    expect((await bytes(whole)).equals(video)).toBe(true);
    expect(h.inspection.experimental_hostRpcCalls.filter((call) => call.method === "readAsset")).toHaveLength(3);
  });

  it("serves SVG sandboxed and as a download, so its script never runs on bb's origin", async () => {
    const h = await setup();
    const svg = await h.behavior.fetchHttp("GET", assetPath("assets/drawing.svg"));
    expect(svg.headers.get("content-type")).toBe("image/svg+xml");
    expect(svg.headers.get("content-security-policy")).toBe("sandbox; default-src 'none'");
    expect(svg.headers.get("content-disposition")).toBe("attachment");
    expect(svg.headers.get("x-content-type-options")).toBe("nosniff");
    const video = await h.behavior.fetchHttp("GET", assetPath("assets/clip.mp4"));
    expect(video.headers.get("content-security-policy")).toMatch(/^sandbox; default-src 'none'/);
    expect(video.headers.get("content-disposition")).toBeNull();
  });

  it("maps refusals and host failures to HTTP errors", async () => {
    const h = await setup();
    expect((await h.behavior.fetchHttp("GET", assetPath("assets/missing.mp4"))).status).toBe(404);
    expect((await h.behavior.fetchHttp("GET", assetPath("assets/clip.mp4", "offline"))).status).toBe(502);
    expect((await h.behavior.fetchHttp("GET", "/asset?host=mac")).status).toBe(400);
  });

  it("parses one byte range and ignores anything else", () => {
    expect(parseRange("bytes=0-")).toEqual({ kind: "range", start: 0, end: null });
    expect(parseRange("bytes=10-20")).toEqual({ kind: "range", start: 10, end: 20 });
    expect(parseRange("bytes=-500")).toEqual({ kind: "suffix", length: 500 });
    for (const header of [undefined, "bytes=20-10", "bytes=0-1,4-5", "items=0-1", "bytes=-"]) {
      expect(parseRange(header)).toBeNull();
    }
  });
});
