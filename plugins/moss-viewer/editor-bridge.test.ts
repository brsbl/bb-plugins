import { afterEach, expect, it, vi } from "vitest";
import { ASSET_CHUNK_BYTES, NOTE_CHANGED_CHANNEL } from "./contract.js";
import { EDITOR_NOTE_CHANGED, UPLOAD_CHUNK_BYTES, asNoteChanged, createEditorBridge, type EditorBridgeOptions } from "./editor-bridge.js";
import type * as Moss from "./vendor/moss-editor.contract.js";

const ID = "6f1c2a8e-3b4d-4e5f-8a9b-0c1d2e3f4a5b";
const ROUTE = "/api/v1/plugins/moss-viewer/http/asset";
const ORIGIN = "http://localhost:3000";
const changed = (version: string): Moss.MossExternalChange => ({ kind: "changed", version, metaVersion: "m" });

afterEach(() => {
  vi.useRealTimers();
});

function fakeRpc(answers: Record<string, (input: Record<string, unknown>) => unknown> = {}) {
  const calls: Array<{ method: string; input: Record<string, unknown> }> = [];
  const rpc = {
    call: vi.fn(async (method: string, input: Record<string, unknown>) => {
      calls.push({ method, input });
      const answer = answers[method];
      if (!answer) throw new Error(`unexpected ${method}`);
      return answer(input);
    }),
  } as unknown as EditorBridgeOptions["rpc"];
  return { rpc, calls };
}

const bridgeWith = (rpc: EditorBridgeOptions["rpc"], options: Partial<EditorBridgeOptions> = {}) =>
  createEditorBridge({ rpc, hostId: "mac", assetRoute: ROUTE, origin: ORIGIN, ...options });

it("sends reads and writes to the note's host", async () => {
  const { rpc, calls } = fakeRpc({
    editorRead: () => ({ kind: "notFound" }),
    editorReadCompanion: () => ({ kind: "absent", version: "c" }),
    editorWrite: () => ({ kind: "notFound" }),
  });
  const bridge = bridgeWith(rpc);
  const write: Moss.MossNoteWrite = { baseVersion: "v", baseMetaVersion: "m", companions: [], rename: null, ops: [{ kind: "put", file: "meta", text: "{}" }] };
  expect(bridge.api).toBe(1);
  expect(await bridge.read(ID)).toEqual({ kind: "notFound" });
  expect(await bridge.readCompanion(ID, "assets/a-mockup.html")).toEqual({ kind: "absent", version: "c" });
  expect(await bridge.write(ID, write)).toEqual({ kind: "notFound" });
  expect(calls).toEqual([
    { method: "editorRead", input: { hostId: "mac", noteId: ID } },
    { method: "editorReadCompanion", input: { hostId: "mac", noteId: ID, relativePath: "assets/a-mockup.html" } },
    { method: "editorWrite", input: { hostId: "mac", noteId: ID, write } },
  ]);
});

it("watches by renewing with the host, delivers each new state once, and stops when the last listener leaves", async () => {
  vi.useFakeTimers();
  let version = "v1";
  const { rpc, calls } = fakeRpc({ editorWatch: () => changed(version) });
  const bridge = bridgeWith(rpc, { renewMs: 1_000 });
  const first: Moss.MossExternalChange[] = [];
  const second: Moss.MossExternalChange[] = [];
  const stopFirst = bridge.watch(ID, (change) => first.push(change));
  const stopSecond = bridge.watch(ID, (change) => second.push(change));
  // Nothing arrives from inside `watch`.
  expect(first).toEqual([]);
  await vi.advanceTimersByTimeAsync(0);
  expect(first).toEqual([changed("v1")]);
  expect(second).toEqual([changed("v1")]);

  await vi.advanceTimersByTimeAsync(1_000);
  expect(first).toHaveLength(1);
  version = "v2";
  await vi.advanceTimersByTimeAsync(1_000);
  expect(first).toEqual([changed("v1"), changed("v2")]);

  // A realtime signal for this host arrives at once; another host's does not.
  bridge.deliver({ hostId: "mac", noteId: ID, change: changed("v3") });
  bridge.deliver({ hostId: "studio", noteId: ID, change: changed("v4") });
  bridge.deliver({ hostId: "mac", noteId: ID, change: changed("v3") });
  expect(first.at(-1)).toEqual(changed("v3"));
  expect(first).toHaveLength(3);

  stopFirst();
  stopSecond();
  const renewals = calls.length;
  await vi.advanceTimersByTimeAsync(5_000);
  expect(calls).toHaveLength(renewals);
  bridge.deliver({ hostId: "mac", noteId: ID, change: changed("v5") });
  expect(second.at(-1)).toEqual(changed("v3"));
});

it("uploads media in chunks, then commits it under the editor's name", async () => {
  const chunks: string[] = [];
  const { rpc, calls } = fakeRpc({
    editorAssetChunk: (input) => {
      chunks.push(input.data as string);
      return { kind: "staged", size: (input.offset as number) + Buffer.from(input.data as string, "base64").length };
    },
    editorAssetCommit: (input) => ({ kind: "stored", ref: `assets/${input.name as string}` }),
  });
  const bridge = bridgeWith(rpc, { chunkBytes: 2 });
  const data = new Blob([new Uint8Array([1, 2, 3, 4, 5])], { type: "image/png" });
  expect(await bridge.assets.put(ID, { name: "a-1-1a2b3c4d.png", data, mimeType: "image/png", purpose: "body" })).toEqual({
    kind: "stored",
    ref: "assets/a-1-1a2b3c4d.png",
  });
  expect(chunks.map((chunk) => [...Buffer.from(chunk, "base64")])).toEqual([[1, 2], [3, 4], [5]]);
  expect(calls.map(({ input }) => input.offset)).toEqual([0, 2, 4, undefined]);
  const upload = calls[0]!.input.upload;
  expect(upload).toMatch(/^[0-9a-f]{32}$/);
  expect(calls.at(-1)).toEqual({
    method: "editorAssetCommit",
    input: { hostId: "mac", noteId: ID, upload, name: "a-1-1a2b3c4d.png", mimeType: "image/png", size: 5 },
  });
  expect(UPLOAD_CHUNK_BYTES).toBe(ASSET_CHUNK_BYTES);
});

it("stops an upload the host refuses, and still sends an empty file to the host's checks", async () => {
  const { rpc, calls } = fakeRpc({
    editorAssetChunk: (input) => ((input.offset as number) > 0 ? { kind: "refused", reason: "tooLarge", maxBytes: 2 } : { kind: "staged", size: 2 }),
    editorAssetCommit: () => ({ kind: "refused", reason: "type" }),
  });
  const bridge = bridgeWith(rpc, { chunkBytes: 2 });
  const put = (bytes: number[]) =>
    bridge.assets.put(ID, { name: "a.png", data: new Blob([new Uint8Array(bytes)]), mimeType: "image/png", purpose: "comment" });
  expect(await put([1, 2, 3])).toEqual({ kind: "refused", reason: "tooLarge", maxBytes: 2 });
  expect(calls.map(({ method }) => method)).toEqual(["editorAssetChunk", "editorAssetChunk"]);
  calls.length = 0;
  expect(await put([])).toEqual({ kind: "refused", reason: "type" });
  expect(calls.map(({ method, input }) => [method, input.data ?? input.size])).toEqual([
    ["editorAssetChunk", ""],
    ["editorAssetCommit", 0],
  ]);
});

it("gives note media URLs keyed by id, and recognises only its own", () => {
  const bridge = bridgeWith(fakeRpc().rpc);
  const url = bridge.assets.url(ID, " assets/My Shot.png ", "image");
  expect(url).toBe(`${ROUTE}?host=mac&id=${ID}&ref=assets%2FMy+Shot.png`);
  expect(bridge.assets.parseUrl(url!)).toEqual({ noteId: ID, ref: "assets/My Shot.png" });
  expect(bridge.assets.parseUrl(`${ORIGIN}${url}`)).toEqual({ noteId: ID, ref: "assets/My Shot.png" });

  expect(bridge.assets.url(ID, "https://example.com/a.png", "image")).toBe("https://example.com/a.png");
  expect(bridge.assets.url(ID, "data:image/png;base64,AAAA", "image")).toBe("data:image/png;base64,AAAA");
  expect(bridge.assets.url(ID, "javascript:alert(1)", "image")).toBeNull();
  expect(bridge.assets.url(ID, "", "image")).toBeNull();

  for (const foreign of [
    `https://evil.example${url}`,
    `${ROUTE}?host=studio&id=${ID}&ref=assets%2Fa.png`,
    `${ROUTE}?host=mac&id=${ID}&ref=..%2Fsecret.png`,
    `${ROUTE}?host=mac&ref=assets%2Fa.png`,
    `/api/v1/plugins/other/http/asset?host=mac&id=${ID}&ref=assets%2Fa.png`,
    "not a url ::",
  ]) {
    expect(bridge.assets.parseUrl(foreign)).toBeNull();
  }
});

it("reads realtime payloads on the contract's channel", () => {
  expect(EDITOR_NOTE_CHANGED).toBe(NOTE_CHANGED_CHANNEL);
  const payload = { hostId: "mac", noteId: ID, change: changed("v1") };
  expect(asNoteChanged(payload)).toBe(payload);
  expect(asNoteChanged({ hostId: "mac", noteId: ID, change: { kind: "removed", reason: "trashed" } })).not.toBeNull();
  for (const other of [null, "x", { hostId: "mac", noteId: ID }, { hostId: "mac", noteId: ID, change: { kind: "other" } }, { noteId: ID, change: changed("v1") }]) {
    expect(asNoteChanged(other)).toBeNull();
  }
});
