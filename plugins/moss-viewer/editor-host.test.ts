import { chmod, mkdir, mkdtemp, readdir, readFile, realpath, rename, rm, stat, symlink, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import type { ExperimentalHostWatchListener, ExperimentalHostWatchOptions } from "@get-bb/plugin-sdk/host";
import { experimental_createHostEntryHarness } from "@get-bb/plugin-sdk/testing/host";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { MAX_ASSET_BYTES, hostContract, hostSignals } from "./contract.js";
import { WATCH_LEASE_MS, createEditorHost } from "./editor-host.js";
import { listNotes, openInMoss, readAsset, readNote } from "./host-notes.js";
import { TestPaths, hostHelpers } from "./test/editor-doubles.js";
import type * as Moss from "./vendor/moss-editor-contract.js";

const ID = "6f1c2a8e-3b4d-4e5f-8a9b-0c1d2e3f4a5b";
const OTHER_ID = "0aa1b2c3-d4e5-4f60-8172-839405a6b7c8";
const meta = (id = ID, title = "Plan", extra: Record<string, unknown> = {}) => JSON.stringify({ id, title, ...extra }, null, 2);

interface FakeWatch {
  options: ExperimentalHostWatchOptions;
  listener: ExperimentalHostWatchListener;
  disposed: boolean;
}

let home = "";
let paths: TestPaths;
let watchers: FakeWatch[];
let host: ReturnType<typeof createHost>;

function createHost() {
  let count = 0;
  const { dispose, ...editor } = createEditorHost({
    helpers: hostHelpers,
    paths,
    workspaceRoot: () => realpath(join(home, "Moss")),
    uuid: () => `u${(count += 1)}`,
  });
  return experimental_createHostEntryHarness(
    {
      experimental_apiVersion: 1,
      contract: hostContract,
      experimental_signals: hostSignals,
      handlers: { readNote, listNotes, readAsset, openInMoss, ...editor },
      dispose,
    },
    {
      experimental_paths: { dataDir: join(home, ".data"), tempDir: join(home, ".tmp") },
      experimental_watch: (options, listener) => {
        const watcher: FakeWatch = { options, listener, disposed: false };
        watchers.push(watcher);
        return { dispose: async () => void (watcher.disposed = true) };
      },
    },
  );
}

beforeEach(async () => {
  home = await realpath(await mkdtemp(join(tmpdir(), "moss-editor-")));
  await mkdir(join(home, "Moss", "Notes"), { recursive: true });
  paths = new TestPaths();
  watchers = [];
  host = createHost();
});

afterEach(async () => {
  await host.experimental_dispose();
  vi.useRealTimers();
  await rm(home, { recursive: true, force: true });
});

interface NoteOptions {
  id?: string;
  markdown?: string;
  markdownName?: string;
  comments?: string;
  layout?: string;
  meta?: string | null;
}

async function note(folder = "Plan", options: NoteOptions = {}) {
  const directory = join(home, "Moss", ...folder.split("/"));
  await mkdir(directory, { recursive: true });
  const name = folder.split("/").at(-1)!;
  const path = join(directory, options.markdownName ?? `${name}.md`);
  await writeFile(path, options.markdown ?? `# ${name}\n`);
  if (options.meta !== null) await writeFile(join(directory, "meta.json"), options.meta ?? meta(options.id ?? ID, name));
  if (options.comments !== undefined) await writeFile(join(directory, "comments.json"), options.comments);
  if (options.layout !== undefined) await writeFile(join(directory, "layout.json"), options.layout);
  return { directory, path };
}

const read = (noteId = ID) => host.experimental_call("editorRead", { noteId });
const save = (write: Moss.MossNoteWrite, noteId = ID) => host.experimental_call("editorWrite", { noteId, write });
const listing = async (directory: string) => (await readdir(directory)).sort();
const text = (path: string) => readFile(path, "utf8");
const settle = () => new Promise((resolve) => setImmediate(resolve));

/** A write from the versions just read, as the editor sends it. */
async function writeFrom(ops: Moss.MossFileOp[], extra: Partial<Moss.MossNoteWrite> = {}): Promise<Moss.MossNoteWrite> {
  const current = await read();
  if (current.kind !== "note") throw new Error(`not editable: ${JSON.stringify(current)}`);
  return { baseVersion: current.version, baseMetaVersion: current.metaVersion, companions: [], rename: null, ops, ...extra };
}

const put = (file: Moss.MossNoteFile, text: string): Moss.MossFileOp => ({ kind: "put", file, text });

describe("reading a note", () => {
  it("returns its four files exactly as on disk, where it sits, and its two versions", async () => {
    const markdown = "﻿# Plan\r\n\r\nThe %%m:c1:start%%launch%%m:c1:end%% slips.\r\n";
    const comments = '{"c1":{"text":"Why?","createdAt":1,"updatedAt":1,"source":"user"}}';
    const plan = await note("Notes/Projects/Plan", { markdown, comments });
    const result = await read();
    expect(result).toEqual({
      kind: "note",
      files: { markdown, comments, layout: null, meta: meta() },
      location: { folderPath: "Notes/Projects", folderName: "Plan", markdownName: "Plan.md" },
      version: hostHelpers.versionToken([
        { role: "markdown", bytes: Buffer.from(markdown) },
        { role: "comments", bytes: Buffer.from(comments) },
        { role: "layout", bytes: null },
      ]),
      metaVersion: hostHelpers.versionToken([
        { role: "meta", bytes: Buffer.from(meta()) },
        { role: "folderPath", bytes: Buffer.from("Notes/Projects") },
      ]),
    });
    if (result.kind !== "note") return;

    // meta.json and the folder's place only move the meta version.
    await writeFile(join(plan.directory, "meta.json"), meta(ID, "Plan", { lastOpenedAt: 1 }));
    const stamped = await read();
    expect(stamped).toMatchObject({ version: result.version });
    expect(stamped).not.toMatchObject({ metaVersion: result.metaVersion });
    await mkdir(join(home, "Moss", "Notes", "Archive"));
    await rename(plan.directory, join(home, "Moss", "Notes", "Archive", "Plan"));
    const moved = await read();
    expect(moved).toMatchObject({ version: result.version, location: { folderPath: "Notes/Archive", folderName: "Plan" } });
    expect(moved).not.toMatchObject({ metaVersion: (stamped as { metaVersion: string }).metaVersion });
  });

  it("resolves the markdown as Moss does: <folder>.md, <id>.md, note.md, then the newest listed file", async () => {
    const plan = await note("Notes/Plan", { markdownName: "note.md", markdown: "# Legacy\n" });
    await writeFile(join(plan.directory, "Other.md"), "# Newer, but not a candidate\n");
    expect(await read()).toMatchObject({ files: { markdown: "# Legacy\n" }, location: { markdownName: "note.md" } });

    await writeFile(join(plan.directory, `${ID}.md`), "# By id\n");
    expect(await read()).toMatchObject({ location: { markdownName: `${ID}.md` } });

    await rm(join(plan.directory, `${ID}.md`));
    await rm(join(plan.directory, "note.md"));
    await writeFile(join(plan.directory, "Draft.md"), "# Newest\n");
    expect(await read()).toMatchObject({ files: { markdown: "# Newest\n" }, location: { markdownName: "Draft.md" } });
  });

  it("follows a note by id when Moss renames or moves its folder", async () => {
    const plan = await note("Notes/Plan");
    expect(await read()).toMatchObject({ location: { folderName: "Plan" } });
    await rename(plan.directory, join(home, "Moss", "Notes", "Renamed"));
    expect(await read()).toMatchObject({ kind: "note", location: { folderName: "Renamed", markdownName: "Plan.md" } });
  });

  it("refuses notes API 1 may not edit, so they stay in the viewer", async () => {
    expect(await read()).toEqual({ kind: "notFound" });
    await note("Notes/External/Mirror");
    expect(await read()).toEqual({ kind: "notEditable", reason: "external" });
    await rm(join(home, "Moss", "Notes", "External"), { recursive: true });

    await note("Notes/Done", { meta: meta(ID, "Done", { trashedAt: 1 }) });
    expect(await read()).toEqual({ kind: "notEditable", reason: "trashed" });
    await rm(join(home, "Moss", "Notes", "Done"), { recursive: true });

    await note("Notes/Loose", { id: "not-a-moss-id" });
    expect(await read("not-a-moss-id")).toEqual({ kind: "notEditable", reason: "unadopted" });

    await note("Notes/Plan");
    await note("Notes/Plan copy");
    expect(await read()).toEqual({ kind: "notEditable", reason: "duplicateId" });
    await rm(join(home, "Moss", "Notes", "Plan copy"), { recursive: true });

    paths.supported = false;
    expect(await read()).toEqual({ kind: "notEditable", reason: "hostUnsupported" });
  });

  it("reads companion files only inside the note's folder", async () => {
    const plan = await note("Notes/Plan");
    await mkdir(join(plan.directory, "assets"));
    await writeFile(join(plan.directory, "assets", "plan-mockup.html"), "<p>mockup</p>");
    await writeFile(join(home, "secret.html"), "secret");
    await symlink(join(home, "secret.html"), join(plan.directory, "assets", "escape-mockup.html"));
    const companion = (relativePath: string) => host.experimental_call("editorReadCompanion", { noteId: ID, relativePath });
    const absent = hostHelpers.versionToken([{ role: "companion", bytes: null }]);
    expect(await companion("assets/plan-mockup.html")).toEqual({
      kind: "file",
      text: "<p>mockup</p>",
      version: hostHelpers.versionToken([{ role: "companion", bytes: Buffer.from("<p>mockup</p>") }]),
    });
    expect(await companion("assets/gone-mockup.html")).toEqual({ kind: "absent", version: absent });
    expect(await companion("assets/escape-mockup.html")).toEqual({ kind: "absent", version: absent });
    expect(await companion("../../../secret.html")).toEqual({ kind: "absent", version: absent });
  });
});

describe("saving a note", () => {
  it("applies only the ops, byte for byte, and leaves no temp or held files", async () => {
    const plan = await note("Notes/Plan", { layout: '{\n  "version": 1\n}', comments: "{}" });
    await chmod(plan.path, 0o600);
    const commentsBefore = await stat(join(plan.directory, "comments.json"));
    const markdown = "# Plan\n\nThe %%m:c2:start%%date%%m:c2:end%% moved.\n";
    const newMeta = meta(ID, "Plan", { updatedAt: 2 });
    const result = await save(await writeFrom([put("markdown", markdown), { kind: "delete", file: "layout" }, put("meta", newMeta)]));
    const after = await read();
    expect(after).toMatchObject({ kind: "note", files: { markdown, comments: "{}", layout: null, meta: newMeta } });
    expect(result).toEqual({
      kind: "saved",
      version: (after as { version: string }).version,
      metaVersion: (after as { metaVersion: string }).metaVersion,
      location: { folderPath: "Notes", folderName: "Plan", markdownName: "Plan.md" },
    });
    expect((await stat(plan.path)).mode & 0o777).toBe(0o600);
    // comments.json had no op, so it was not touched.
    expect((await stat(join(plan.directory, "comments.json"))).ino).toBe(commentsBefore.ino);
    expect(await listing(plan.directory)).toEqual(["Plan.md", "comments.json", "meta.json"]);
  });

  it("refuses a stale save, naming what changed, and writes nothing", async () => {
    const plan = await note("Notes/Plan");
    await mkdir(join(plan.directory, "assets"));
    await writeFile(join(plan.directory, "assets", "plan-mockup.html"), "<p>v1</p>");
    const companion = await host.experimental_call("editorReadCompanion", { noteId: ID, relativePath: "assets/plan-mockup.html" });
    const write = await writeFrom([put("markdown", "# Mine\n"), put("meta", meta())], {
      companions: [{ relativePath: "assets/plan-mockup.html", version: companion.version }],
    });

    await writeFile(join(plan.directory, "meta.json"), meta(ID, "Plan", { pinned: true }));
    expect(await save(write)).toMatchObject({ kind: "conflict", reason: "meta", applied: [], preserved: [] });
    await writeFile(join(plan.directory, "assets", "plan-mockup.html"), "<p>v2</p>");
    expect(await save(write)).toMatchObject({ kind: "conflict", reason: "companion" });
    await writeFile(join(plan.directory, "comments.json"), "{}");
    const now = await read();
    expect(await save(write)).toEqual({
      kind: "conflict",
      reason: "content",
      version: (now as { version: string }).version,
      metaVersion: (now as { metaVersion: string }).metaVersion,
      applied: [],
      preserved: [],
      location: { folderPath: "Notes", folderName: "Plan", markdownName: "Plan.md" },
    });
    expect(await text(plan.path)).toBe("# Plan\n");
  });

  it("gives back a Moss save that lands after the check, and undoes its own files", async () => {
    const plan = await note("Notes/Plan");
    const write = await writeFrom([put("markdown", "# From bb\n"), put("meta", meta(ID, "Plan", { updatedAt: 2 }))]);
    paths.before = async (_temp, target) => {
      if (!target.endsWith("meta.json")) return;
      paths.before = null;
      await writeFile(target, meta(ID, "Plan", { fromMoss: true }));
    };
    expect(await save(write)).toMatchObject({ kind: "conflict", reason: "raced", applied: [], preserved: [] });
    expect(await text(plan.path)).toBe("# Plan\n");
    expect(await text(join(plan.directory, "meta.json"))).toBe(meta(ID, "Plan", { fromMoss: true }));
    expect(await listing(plan.directory)).toEqual(["Plan.md", "meta.json"]);
  });

  it("keeps displaced Moss bytes it cannot put back, and reports them", async () => {
    const plan = await note("Notes/Plan");
    const write = await writeFrom([put("markdown", "# From bb\n"), put("meta", meta(ID, "Plan", { updatedAt: 2 }))]);
    paths.before = async (_temp, target) => {
      if (!target.endsWith("meta.json")) return;
      paths.before = null;
      await writeFile(target, meta(ID, "Plan", { first: true }));
    };
    paths.after = async (_temp, target) => {
      if (!target.endsWith("meta.json")) return;
      paths.after = null;
      await writeFile(target, meta(ID, "Plan", { second: true }));
    };
    const result = await save(write);
    expect(result).toMatchObject({ kind: "conflict", reason: "raced", applied: [] });
    const preserved = (result as { preserved: string[] }).preserved;
    expect(preserved).toEqual([".meta.json.u4.displaced"]);
    expect(await text(join(plan.directory, preserved[0]!))).toBe(meta(ID, "Plan", { first: true }));
    expect(await text(join(plan.directory, "meta.json"))).toBe(meta(ID, "Plan", { second: true }));
    expect(await text(plan.path)).toBe("# Plan\n");
  });

  it("puts back a sidecar Moss rewrote before bb deleted it, and one Moss created before bb did", async () => {
    const plan = await note("Notes/Plan", { layout: "{}" });
    const landsDuringMarkdown = (path: string, bytes: string) => {
      paths.before = async (_temp, target) => {
        if (!target.endsWith("Plan.md")) return;
        paths.before = null;
        await writeFile(path, bytes);
      };
    };
    const newMeta = meta(ID, "Plan", { updatedAt: 2 });

    landsDuringMarkdown(join(plan.directory, "layout.json"), '{"widths":[1]}');
    expect(await save(await writeFrom([put("markdown", "# From bb\n"), { kind: "delete", file: "layout" }, put("meta", newMeta)]))).toMatchObject({
      kind: "conflict",
      reason: "raced",
      applied: [],
      preserved: [],
    });
    expect(await text(join(plan.directory, "layout.json"))).toBe('{"widths":[1]}');
    expect(await text(plan.path)).toBe("# Plan\n");

    landsDuringMarkdown(join(plan.directory, "comments.json"), '{"moss":{}}');
    expect(await save(await writeFrom([put("markdown", "# From bb\n"), put("comments", '{"c":{}}'), put("meta", newMeta)]))).toMatchObject({
      kind: "conflict",
      reason: "raced",
      applied: [],
      preserved: [],
    });
    expect(await text(join(plan.directory, "comments.json"))).toBe('{"moss":{}}');
    expect(await text(plan.path)).toBe("# Plan\n");
    expect(await listing(plan.directory)).toEqual(["Plan.md", "comments.json", "layout.json", "meta.json"]);
  });

  it("reports a replacement that lands after its exchange, without rolling back", async () => {
    const plan = await note("Notes/Plan");
    const write = await writeFrom([put("markdown", "# From bb\n"), put("meta", meta(ID, "Plan", { updatedAt: 2 }))]);
    paths.after = async (_temp, target) => {
      if (!target.endsWith("Plan.md")) return;
      paths.after = null;
      await writeFile(target, "# From Moss\n");
    };
    const result = await save(write);
    expect(result).toMatchObject({ kind: "conflict", reason: "raced", applied: ["meta"], preserved: [".Plan.md.u2.displaced"] });
    expect(await text(plan.path)).toBe("# From Moss\n");
    // What the exchange displaced was the original; it is kept, since its target holds neither it nor bb's bytes.
    expect(await text(join(plan.directory, ".Plan.md.u2.displaced"))).toBe("# Plan\n");
  });

  it("rolls back and reports an I/O failure", async () => {
    const plan = await note("Notes/Plan");
    const write = await writeFrom([put("markdown", "# From bb\n"), put("meta", meta(ID, "Plan", { updatedAt: 2 }))]);
    paths.before = (_temp, target) => {
      if (target.endsWith("meta.json")) paths.failNext = "EIO";
    };
    expect(await save(write)).toEqual({
      kind: "failed",
      code: "EIO",
      message: "EIO: exchange failed",
      applied: [],
      preserved: [],
      location: { folderPath: "Notes", folderName: "Plan", markdownName: "Plan.md" },
    });
    expect(await text(plan.path)).toBe("# Plan\n");
    expect(await listing(plan.directory)).toEqual(["Plan.md", "meta.json"]);
  });

  it("renames the folder on a retitle to a free name, moves the markdown, and is found by id afterwards", async () => {
    const plan = await note("Notes/Plan");
    await mkdir(join(home, "Moss", "Notes", "Q3 Plan"));
    const write = await writeFrom([put("markdown", "# Q3 Plan\n"), put("meta", meta(ID, "Q3 Plan"))], {
      rename: { kind: "renameFolder", desiredName: "Q3 Plan" },
    });
    const location = { folderPath: "Notes", folderName: "Q3 Plan (1)", markdownName: "Q3 Plan (1).md" };
    expect(await save(write)).toMatchObject({ kind: "saved", location });
    const renamed = join(home, "Moss", "Notes", "Q3 Plan (1)");
    expect(await listing(renamed)).toEqual(["Q3 Plan (1).md", "meta.json"]);
    expect(await text(join(renamed, "Q3 Plan (1).md"))).toBe("# Q3 Plan\n");
    expect(await stat(plan.directory).catch(() => null)).toBeNull();
    expect(await read()).toMatchObject({ kind: "note", location, files: { markdown: "# Q3 Plan\n" } });
  });

  it("moves a legacy note.md to <folder>.md", async () => {
    const plan = await note("Notes/Plan", { markdownName: "note.md", markdown: "# Plan\n" });
    expect(await save(await writeFrom([put("markdown", "# Plan\n"), put("meta", meta())]))).toMatchObject({
      kind: "saved",
      location: { markdownName: "Plan.md" },
    });
    expect(await listing(plan.directory)).toEqual(["Plan.md", "meta.json"]);
  });

  it("refuses a retitle onto a different file that already has the new name", async () => {
    const plan = await note("Notes/Plan");
    await writeFile(join(plan.directory, "Q3.md"), "# Someone else's\n");
    const write = await writeFrom([put("markdown", "# Q3\n"), put("meta", meta(ID, "Q3"))], {
      rename: { kind: "renameFolder", desiredName: "Q3" },
    });
    const result = await save(write);
    // The folder rename stands; nothing else moved.
    expect(result).toMatchObject({ kind: "conflict", reason: "raced", applied: [], location: { folderName: "Q3" } });
    const renamed = join(home, "Moss", "Notes", "Q3");
    expect(await text(join(renamed, "Q3.md"))).toBe("# Someone else's\n");
    expect(await text(join(renamed, "Plan.md"))).toBe("# Plan\n");
  });

  it("answers notFound and notEditable without writing", async () => {
    const write: Moss.MossNoteWrite = { baseVersion: "v", baseMetaVersion: "m", companions: [], rename: null, ops: [put("meta", "{}")] };
    expect(await save(write)).toEqual({ kind: "notFound" });
    await note("Notes/Plan");
    paths.supported = false;
    expect(await save(write)).toEqual({ kind: "notEditable", reason: "hostUnsupported" });
  });
});

describe("watching a note", () => {
  it("reports changes made outside bb, follows the folder, and stays quiet about its own saves", async () => {
    const plan = await note("Notes/Plan");
    const first = await host.experimental_call("editorWatch", { noteId: ID });
    expect(first).toMatchObject({ kind: "changed" });
    expect(watchers).toHaveLength(1);
    expect(watchers[0]!.options).toMatchObject({ rootPath: plan.directory, ignoredPaths: ["assets"] });
    const changed = (watcher: FakeWatch, name: string) =>
      watcher.listener({ kind: "changed", changes: [{ path: join(watcher.options.rootPath, name), type: "update" }] });

    await writeFile(plan.path, "# Plan\n\nFrom Moss.\n");
    await changed(watchers[0]!, "Plan.md");
    const fromMoss = await read();
    expect(host.experimental_getSignals()).toEqual([
      {
        signal: "editorNoteChanged",
        payload: { noteId: ID, change: { kind: "changed", version: (fromMoss as { version: string }).version, metaVersion: (fromMoss as { metaVersion: string }).metaVersion } },
      },
    ]);

    await save(await writeFrom([put("markdown", "# Plan\n\nFrom bb.\n"), put("meta", meta())]));
    await changed(watchers[0]!, "Plan.md");
    await changed(watchers[0]!, ".Plan.md.u9.tmp");
    expect(host.experimental_getSignals()).toHaveLength(1);

    // A rename in place changes neither version, so there is nothing to announce, but the watch follows the folder.
    await rename(plan.directory, join(home, "Moss", "Notes", "Renamed"));
    await watchers[0]!.listener({ kind: "rescan-required" });
    await settle();
    expect(host.experimental_getSignals()).toHaveLength(1);
    expect(watchers[0]!.disposed).toBe(true);
    expect(watchers[1]!.options.rootPath).toBe(join(home, "Moss", "Notes", "Renamed"));

    await mkdir(join(home, "Moss", "Trash"));
    await rename(join(home, "Moss", "Notes", "Renamed"), join(home, "Moss", "Trash", "Renamed"));
    await watchers[1]!.listener({ kind: "rescan-required" });
    await settle();
    expect(watchers[1]!.disposed).toBe(true);
    expect(host.experimental_getSignals()).toHaveLength(2);
    expect(host.experimental_getSignals().at(-1)).toEqual({
      signal: "editorNoteChanged",
      payload: { noteId: ID, change: { kind: "removed", reason: "notFound" } },
    });
  });

  it("stops watching when no editor renews it, and when the host worker stops", async () => {
    vi.useFakeTimers({ toFake: ["setTimeout", "clearTimeout"] });
    await note("Notes/Plan");
    await host.experimental_call("editorWatch", { noteId: ID });
    vi.advanceTimersByTime(WATCH_LEASE_MS - 1_000);
    await host.experimental_call("editorWatch", { noteId: ID });
    vi.advanceTimersByTime(WATCH_LEASE_MS - 1_000);
    await settle();
    expect(watchers[0]!.disposed).toBe(false);
    vi.advanceTimersByTime(1_000);
    await settle();
    expect(watchers[0]!.disposed).toBe(true);

    await host.experimental_call("editorWatch", { noteId: ID });
    await host.experimental_dispose();
    expect(watchers[1]!.disposed).toBe(true);
  });
});

describe("note media", () => {
  async function upload(name: string, bytes: Buffer, noteId = ID) {
    const id = "a".repeat(32);
    for (let offset = 0; offset < bytes.length; offset += 128) {
      const data = bytes.subarray(offset, offset + 128).toString("base64");
      const staged = await host.experimental_call("editorAssetChunk", { noteId, upload: id, offset, data });
      if (staged.kind !== "staged") return staged;
    }
    return host.experimental_call("editorAssetCommit", { noteId, upload: id, name, size: bytes.length });
  }

  it("creates each upload exclusively under the editor's name", async () => {
    const plan = await note("Notes/Plan");
    const image = Buffer.from(Array.from({ length: 300 }, (_, index) => index % 256));
    expect(await upload("shot-1700000000000-1a2b3c4d.png", image)).toEqual({ kind: "stored", ref: "assets/shot-1700000000000-1a2b3c4d.png" });
    expect(await readFile(join(plan.directory, "assets", "shot-1700000000000-1a2b3c4d.png"))).toEqual(image);
    expect(await upload("shot-1700000000000-1a2b3c4d.png", Buffer.from("other"))).toEqual({ kind: "exists" });
    expect(await readFile(join(plan.directory, "assets", "shot-1700000000000-1a2b3c4d.png"))).toEqual(image);
    expect(await upload("page.html", Buffer.from("<p>"))).toEqual({ kind: "refused", reason: "type" });
    expect(await host.experimental_call("editorAssetChunk", { noteId: ID, upload: "b".repeat(32), offset: MAX_ASSET_BYTES, data: "AAAA" })).toEqual({
      kind: "refused",
      reason: "tooLarge",
      maxBytes: MAX_ASSET_BYTES,
    });
    expect(await listing(join(plan.directory, "assets"))).toEqual(["shot-1700000000000-1a2b3c4d.png"]);
    expect(await listing(join(home, ".tmp", "moss-uploads"))).toEqual([]);
    expect(await upload("a.png", Buffer.from("png"), OTHER_ID)).toEqual({ kind: "notFound" });
  });

  it("copies an asset from another note, confined to that note's folder", async () => {
    const plan = await note("Notes/Plan");
    const source = await note("Notes/Source", { id: OTHER_ID });
    await mkdir(join(source.directory, "assets"));
    await writeFile(join(source.directory, "assets", "a.png"), "png");
    await writeFile(join(home, "secret.png"), "secret");
    await symlink(join(home, "secret.png"), join(source.directory, "assets", "escape.png"));
    const copy = (sourceRef: string, name: string) =>
      host.experimental_call("editorAssetCopy", { noteId: ID, sourceNoteId: OTHER_ID, sourceRef: sourceRef as Moss.MossAssetRef, name });
    expect(await copy("assets/a.png", "a-1-1a2b3c4d.png")).toEqual({ kind: "stored", ref: "assets/a-1-1a2b3c4d.png" });
    expect(await text(join(plan.directory, "assets", "a-1-1a2b3c4d.png"))).toBe("png");
    expect(await copy("assets/escape.png", "e-1-1a2b3c4d.png")).toEqual({ kind: "notFound" });
    expect(await copy("assets/gone.png", "g-1-1a2b3c4d.png")).toEqual({ kind: "notFound" });
  });

  it("serves media by note id, so a URL outlives a folder rename", async () => {
    const plan = await note("Notes/Plan");
    await mkdir(join(plan.directory, "assets"));
    await writeFile(join(plan.directory, "assets", "a.png"), "png-bytes");
    await rename(plan.directory, join(home, "Moss", "Notes", "Renamed"));
    expect(await host.experimental_call("editorAsset", { noteId: ID, ref: "assets/a.png", offset: 0, length: 3 })).toMatchObject({
      ok: true,
      contentType: "image/png",
      size: 9,
      data: Buffer.from("png").toString("base64"),
    });
  });
});
