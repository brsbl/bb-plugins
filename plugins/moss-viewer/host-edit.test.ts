import { randomBytes } from "node:crypto";
import { chmod, lstat, mkdir, mkdtemp, readdir, readFile, realpath, rm, stat, symlink, writeFile } from "node:fs/promises";
import { homedir, tmpdir } from "node:os";
import { join } from "node:path";
import type { ExperimentalHostWatchListener, ExperimentalHostWatchOptions } from "@get-bb/plugin-sdk/host";
import { experimental_createHostEntryHarness } from "@get-bb/plugin-sdk/testing/host";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { MAX_ASSET_BYTES, MAX_SIDECAR_BYTES } from "./contract.js";
import { WATCH_LEASE_MS, assetFileName, noteVersion } from "./host-edit.js";
import entry from "./host.js";

vi.mock("node:os", async (original) => ({
  ...(await original<typeof import("node:os")>()),
  homedir: vi.fn(),
}));

const LAYOUT = '{"version":1,"tableCount":1,"tables":[{"columnWidths":[120,240]}]}\n';

interface FakeWatch {
  options: ExperimentalHostWatchOptions;
  listener: ExperimentalHostWatchListener;
  disposed: boolean;
}

let home = "";
let watchers: FakeWatch[] = [];
const createHost = () =>
  experimental_createHostEntryHarness(entry, {
    experimental_paths: { dataDir: join(home, ".data"), tempDir: join(home, ".tmp") },
    experimental_watch: (options, listener) => {
      const watcher: FakeWatch = { options, listener, disposed: false };
      watchers.push(watcher);
      return { dispose: async () => void (watcher.disposed = true) };
    },
  });
let host: ReturnType<typeof createHost>;

beforeEach(async () => {
  home = await realpath(await mkdtemp(join(tmpdir(), "moss-editor-host-")));
  vi.mocked(homedir).mockReturnValue(home);
  watchers = [];
  host = createHost();
});

afterEach(async () => {
  await host.experimental_dispose();
  vi.useRealTimers();
  await rm(home, { recursive: true, force: true });
});

async function note(title = "Plan", markdown = "# Plan\n", sidecars: { layout?: string; comments?: string } = {}) {
  const directory = join(home, "Moss", "Notes", title);
  await mkdir(directory, { recursive: true });
  const path = join(directory, `${title}.md`);
  await writeFile(path, markdown);
  if (sidecars.layout !== undefined) await writeFile(join(directory, "layout.json"), sidecars.layout);
  if (sidecars.comments !== undefined) await writeFile(join(directory, "comments.json"), sidecars.comments);
  return { directory, path };
}

const read = (path: string) => host.experimental_call("readNoteFiles", { path });
const save = (path: string, baseVersion: string, files: { markdown?: string; layout?: string | null; comments?: string | null }) =>
  host.experimental_call("writeNoteFiles", { path, baseVersion, files });
const listing = async (directory: string) => (await readdir(directory)).sort();

describe("reading a note to edit", () => {
  it("returns its Markdown, layout.json and comments.json byte for byte, with one version over all three", async () => {
    const markdown = "﻿# Plan\r\n\r\nThe %%m:c1:start%%launch%%m:c1:end%% slips.\r\n";
    const comments = '{\n  "c1": {"text":"Why?","createdAt":1,"updatedAt":1,"source":"user"}\n}\n';
    const plan = await note("Plan", markdown, { layout: LAYOUT, comments });
    const files = await read(plan.path);
    expect(files).toEqual({ path: plan.path, markdown, layout: LAYOUT, comments, version: expect.stringMatching(/^[0-9a-f]{64}$/) });
    expect(files.version).toBe(noteVersion({ markdown: Buffer.from(markdown), layout: Buffer.from(LAYOUT), comments: Buffer.from(comments) }));
    expect((await read(plan.path)).version).toBe(files.version);

    await rm(join(plan.directory, "layout.json"));
    const withoutLayout = await read(plan.path);
    expect(withoutLayout.layout).toBeNull();
    expect(withoutLayout.version).not.toBe(files.version);
    // An empty sidecar is not a missing one.
    await writeFile(join(plan.directory, "layout.json"), "");
    const emptyLayout = await read(plan.path);
    expect(emptyLayout).toMatchObject({ layout: "" });
    expect(emptyLayout.version).not.toBe(withoutLayout.version);

    // meta.json and assets/ are Moss's to manage and not part of the version.
    await writeFile(join(plan.directory, "meta.json"), '{"id":"plan"}');
    await mkdir(join(plan.directory, "assets"));
    await writeFile(join(plan.directory, "assets", "a.png"), "png");
    expect((await read(plan.path)).version).toBe(emptyLayout.version);
  });

  it("edits only <Title>/<Title>.md notes in ~/Moss/Notes, reaching a linked note's real file", async () => {
    await mkdir(join(home, "Code"), { recursive: true });
    const spec = join(home, "Code", "spec.md");
    await writeFile(spec, "# Spec\n\n:::tabs\n");
    const loose = join(home, "Moss", "Notes", "Loose.md");
    await writeFile(loose, "# Loose\n");
    const plan = await note();
    const other = join(plan.directory, "Other.md");
    await writeFile(other, "# Other\n");
    for (const path of [spec, loose, other]) {
      await expect(read(path)).rejects.toThrow("Only notes in ~/Moss/Notes can be edited in bb.");
      await expect(save(path, "0".repeat(64), { markdown: "# Mine\n" })).rejects.toThrow("Only notes in ~/Moss/Notes");
    }
    expect(await readFile(spec, "utf8")).toBe("# Spec\n\n:::tabs\n");

    const alias = join(home, "Code", "alias.md");
    await symlink(plan.path, alias);
    const files = await read(alias);
    expect(files.path).toBe(plan.path);
    expect(await save(alias, files.version, { markdown: "# Plan\n\nVia a link.\n" })).toMatchObject({ status: "saved" });
    expect((await lstat(alias)).isSymbolicLink()).toBe(true);
    expect(await readFile(plan.path, "utf8")).toBe("# Plan\n\nVia a link.\n");
  });

  it("keeps a note read-only when a sidecar is a link or too large, or the note is not UTF-8", async () => {
    const plan = await note();
    await writeFile(join(home, "secret.json"), '{"token":"x"}');
    await symlink(join(home, "secret.json"), join(plan.directory, "comments.json"));
    await expect(read(plan.path)).rejects.toThrow("This note's comments.json is a link");
    await expect(save(plan.path, "0".repeat(64), { comments: "{}" })).rejects.toThrow("is a link");
    expect(await readFile(join(home, "secret.json"), "utf8")).toBe('{"token":"x"}');
    await rm(join(plan.directory, "comments.json"));

    await writeFile(join(plan.directory, "layout.json"), "x".repeat(MAX_SIDECAR_BYTES + 1));
    await expect(read(plan.path)).rejects.toThrow("This note's layout.json is too large to edit in bb.");
    await rm(join(plan.directory, "layout.json"));

    await writeFile(plan.path, Buffer.from([0x23, 0x20, 0xff, 0xfe, 0x0a]));
    await expect(read(plan.path)).rejects.toThrow("This note is not UTF-8 text");
  });
});

describe("saving a note", () => {
  it("replaces only the files that changed, in place of the old ones, keeping their mode", async () => {
    const plan = await note("Plan", "# Plan\n", { layout: LAYOUT, comments: "{}\n" });
    await chmod(plan.path, 0o600);
    const before = await read(plan.path);
    const layoutFile = await stat(join(plan.directory, "layout.json"));
    const noteFile = await stat(plan.path);

    const markdown = "# Plan\n\nThe %%m:c2:start%%date%%m:c2:end%% moved.\n";
    const comments = '{"c2":{"text":"Confirm","createdAt":2,"updatedAt":2,"source":"user"}}';
    const saved = await save(plan.path, before.version, { markdown, layout: LAYOUT, comments });
    expect(saved).toEqual({ status: "saved", version: expect.stringMatching(/^[0-9a-f]{64}$/) });
    expect(await read(plan.path)).toEqual({ path: plan.path, markdown, layout: LAYOUT, comments, version: saved.version });

    const after = await stat(plan.path);
    expect(after.mode & 0o777).toBe(0o600);
    // A new file renamed over the old one, so Moss never reads half a note.
    expect(after.ino).not.toBe(noteFile.ino);
    // layout.json was sent unchanged, so it was left alone.
    expect((await stat(join(plan.directory, "layout.json"))).ino).toBe(layoutFile.ino);
    expect(await listing(plan.directory)).toEqual(["Plan.md", "comments.json", "layout.json"]);
  });

  it("adds and removes sidecars, and writes nothing when nothing changed", async () => {
    const plan = await note("Plan", "# Plan\n", { comments: "{}" });
    const saved = await save(plan.path, (await read(plan.path)).version, { comments: null, layout: LAYOUT });
    expect(await read(plan.path)).toEqual({ path: plan.path, markdown: "# Plan\n", layout: LAYOUT, comments: null, version: saved.version });
    expect(await listing(plan.directory)).toEqual(["Plan.md", "layout.json"]);

    const modified = (await stat(plan.path)).mtimeMs;
    expect(await save(plan.path, saved.version, { markdown: "# Plan\n", comments: null })).toEqual(saved);
    expect((await stat(plan.path)).mtimeMs).toBe(modified);
  });

  it("refuses a save made from an older version and leaves the newer files as they are", async () => {
    const plan = await note();
    const opened = await read(plan.path);
    await writeFile(plan.path, "# Plan\n\nEdited in Moss.\n");
    const current = await read(plan.path);
    expect(await save(plan.path, opened.version, { markdown: "# Plan\n\nEdited in bb.\n" })).toEqual({
      status: "conflict",
      version: current.version,
    });
    expect(await readFile(plan.path, "utf8")).toBe("# Plan\n\nEdited in Moss.\n");

    // A sidecar Moss added counts as a change too.
    await writeFile(join(plan.directory, "comments.json"), "{}");
    expect(await save(plan.path, current.version, { markdown: "# Plan\n" })).toMatchObject({ status: "conflict" });
    expect(await save(plan.path, (await read(plan.path)).version, { markdown: "# Plan\n\nBoth.\n" })).toMatchObject({ status: "saved" });
    expect(await listing(plan.directory)).toEqual(["Plan.md", "comments.json"]);
  });

  it("lets exactly one of two saves from the same version win", async () => {
    const plan = await note();
    const { version } = await read(plan.path);
    const results = await Promise.all([save(plan.path, version, { markdown: "# A\n" }), save(plan.path, version, { markdown: "# B\n" })]);
    expect(results.map((result) => result.status).sort()).toEqual(["conflict", "saved"]);
    expect((await read(plan.path)).version).toBe(results.find((result) => result.status === "saved")!.version);
  });

  it("refuses a sidecar too large to read back and writes nothing", async () => {
    const plan = await note();
    const { version } = await read(plan.path);
    await expect(save(plan.path, version, { markdown: "# Big\n", layout: "x".repeat(MAX_SIDECAR_BYTES + 1) })).rejects.toThrow(
      "This note's layout.json is too large to save from bb.",
    );
    expect(await readFile(plan.path, "utf8")).toBe("# Plan\n");
    expect(await listing(plan.directory)).toEqual(["Plan.md"]);
  });
});

describe("watching a note", () => {
  const changed = (watcher: FakeWatch, path: string) => watcher.listener({ kind: "changed", changes: [{ path, type: "update" }] });

  it("watches the note's folder while an editor renews it and signals each change made outside bb", async () => {
    const plan = await note();
    const { version } = await host.experimental_call("watchNote", { path: plan.path });
    expect(version).toBe((await read(plan.path)).version);
    await host.experimental_call("watchNote", { path: plan.path });
    expect(watchers).toHaveLength(1);
    const [watcher] = watchers as [FakeWatch];
    expect(watcher.options).toMatchObject({ rootPath: plan.directory, ignoredPaths: ["assets"] });

    await writeFile(plan.path, "# Plan\n\nFrom Moss.\n");
    await changed(watcher, plan.path);
    const fromMoss = (await read(plan.path)).version;
    expect(host.experimental_getSignals()).toEqual([{ signal: "noteChanged", payload: { path: plan.path, version: fromMoss } }]);

    // Other files, and events with nothing new, stay quiet.
    await writeFile(join(plan.directory, "meta.json"), "{}");
    await changed(watcher, join(plan.directory, "meta.json"));
    await changed(watcher, plan.path);
    // So does bb's own save.
    await save(plan.path, fromMoss, { markdown: "# Plan\n\nFrom bb.\n" });
    await changed(watcher, plan.path);
    expect(host.experimental_getSignals()).toHaveLength(1);

    await writeFile(join(plan.directory, "comments.json"), "{}");
    await changed(watcher, join(plan.directory, "comments.json"));
    expect(host.experimental_getSignals()).toHaveLength(2);

    await rm(plan.path);
    await watcher.listener({ kind: "rescan-required" });
    expect(host.experimental_getSignals().at(-1)).toEqual({ signal: "noteChanged", payload: { path: plan.path, version: null } });
  });

  it("stops watching when no editor renews it, and when the host worker stops", async () => {
    vi.useFakeTimers({ toFake: ["setTimeout", "clearTimeout"] });
    const settle = () => new Promise((resolve) => setImmediate(resolve));
    const plan = await note();
    await host.experimental_call("watchNote", { path: plan.path });
    vi.advanceTimersByTime(WATCH_LEASE_MS - 1_000);
    await host.experimental_call("watchNote", { path: plan.path });
    vi.advanceTimersByTime(WATCH_LEASE_MS - 1_000);
    await settle();
    expect(watchers[0]!.disposed).toBe(false);
    vi.advanceTimersByTime(1_000);
    await settle();
    expect(watchers[0]!.disposed).toBe(true);

    await host.experimental_call("watchNote", { path: plan.path });
    expect(watchers).toHaveLength(2);
    await host.experimental_dispose();
    expect(watchers[1]!.disposed).toBe(true);
  });

  it("watches only notes bb can edit", async () => {
    await mkdir(join(home, "Code"), { recursive: true });
    await writeFile(join(home, "Code", "spec.md"), "# Spec\n\n:::tabs\n");
    await expect(host.experimental_call("watchNote", { path: join(home, "Code", "spec.md") })).rejects.toThrow("Only notes in ~/Moss/Notes");
    expect(watchers).toEqual([]);
  });
});

describe("adding media to a note", () => {
  async function upload(notePath: string, name: string, bytes: Buffer, chunk = 128) {
    const id = randomBytes(16).toString("hex");
    for (let offset = 0; offset < bytes.length; offset += chunk) {
      const data = bytes.subarray(offset, offset + chunk).toString("base64");
      expect(await host.experimental_call("writeAssetChunk", { notePath, upload: id, offset, data })).toEqual({
        ok: true,
        size: Math.min(offset + chunk, bytes.length),
      });
    }
    return host.experimental_call("commitAsset", { notePath, upload: id, name, size: bytes.length });
  }

  it("puts an upload in the note's assets folder under a free, safe name", async () => {
    const plan = await note();
    const image = Buffer.from(Array.from({ length: 300 }, (_, index) => index % 256));
    expect(await upload(plan.path, "Screen Shot 1.PNG", image)).toEqual({ ok: true, ref: "assets/Screen-Shot-1.png" });
    expect(await readFile(join(plan.directory, "assets", "Screen-Shot-1.png"))).toEqual(image);

    expect(await upload(plan.path, "Screen Shot 1.png", Buffer.from("other"))).toEqual({ ok: true, ref: "assets/Screen-Shot-1-2.png" });
    expect(await readFile(join(plan.directory, "assets", "Screen-Shot-1.png"))).toEqual(image);
    expect(await upload(plan.path, "../../escape.gif", Buffer.from("gif"))).toEqual({ ok: true, ref: "assets/escape.gif" });

    expect(await listing(join(plan.directory, "assets"))).toEqual(["Screen-Shot-1-2.png", "Screen-Shot-1.png", "escape.gif"]);
    expect(await listing(plan.directory)).toEqual(["Plan.md", "assets"]);
    expect(await listing(join(home, ".tmp", "moss-uploads"))).toEqual([]);
  });

  it("refuses chunks out of order, an incomplete or non-media upload, and oversized files", async () => {
    const plan = await note();
    const id = "a".repeat(32);
    const chunk = (offset: number) => host.experimental_call("writeAssetChunk", { notePath: plan.path, upload: id, offset, data: "AAAA" });
    const commit = (name: string, size: number) => host.experimental_call("commitAsset", { notePath: plan.path, upload: id, name, size });

    expect(await chunk(3)).toMatchObject({ ok: false, code: "invalid" });
    expect(await chunk(0)).toEqual({ ok: true, size: 3 });
    expect(await chunk(9)).toEqual({ ok: false, code: "invalid", message: "This upload's chunks arrived out of order." });
    expect(await commit("a.png", 99)).toEqual({ ok: false, code: "invalid", message: "This upload is incomplete. Add the file again." });
    // A refused commit discards the upload.
    expect(await chunk(3)).toMatchObject({ ok: false, code: "invalid" });

    expect(await chunk(MAX_ASSET_BYTES - 1)).toMatchObject({ ok: false, code: "too_large" });
    expect(await chunk(0)).toMatchObject({ ok: true });
    expect(await commit("page.html", 3)).toEqual({ ok: false, code: "unsupported", message: "page.html is not an image or video." });
    expect(await listing(plan.directory)).toEqual(["Plan.md"]);
  });

  it("writes only into the folder of a note bb can edit", async () => {
    await mkdir(join(home, "Code"), { recursive: true });
    await writeFile(join(home, "Code", "spec.md"), "# Spec\n\n:::tabs\n");
    expect(
      await host.experimental_call("writeAssetChunk", { notePath: join(home, "Code", "spec.md"), upload: "b".repeat(32), offset: 0, data: "AAAA" }),
    ).toMatchObject({ ok: false, code: "not_allowed" });

    const plan = await note();
    await mkdir(join(home, "elsewhere"));
    await symlink(join(home, "elsewhere"), join(plan.directory, "assets"));
    expect(await upload(plan.path, "a.png", Buffer.from("png"))).toMatchObject({ ok: false, code: "not_allowed" });
    expect(await readdir(join(home, "elsewhere"))).toEqual([]);
  });

  it("names assets from the editor's file name", () => {
    expect(assetFileName("photo.JPG")).toBe("photo.jpg");
    expect(assetFileName("Été à Paris.png")).toBe("Été-à-Paris.png");
    expect(assetFileName(".hidden.png")).toBe("hidden.png");
    expect(assetFileName("..\\..\\a b.webm")).toBe("a-b.webm");
    expect(assetFileName("😀.gif")).toBe("file.gif");
    expect(() => assetFileName("notes.txt")).toThrow("notes.txt is not an image or video.");
    expect(() => assetFileName(".png")).toThrow("not an image or video");
  });
});
