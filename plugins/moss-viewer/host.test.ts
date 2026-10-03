import { execFile } from "node:child_process";
import { mkdir, mkdtemp, realpath, rm, symlink, writeFile } from "node:fs/promises";
import { homedir, platform, tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { listNotes, openInMoss, readAsset, readNote } from "./host-notes.js";

vi.mock("node:child_process", () => ({ execFile: vi.fn((_file, _args, _options, callback) => callback(null)) }));
vi.mock("node:os", async (original) => ({
  ...(await original<typeof import("node:os")>()),
  homedir: vi.fn(),
  platform: vi.fn(() => "darwin"),
}));

let home = "";
const notes = () => join(home, "Moss", "Notes");

async function note(folder: string, markdown: string, meta?: Record<string, unknown>) {
  const directory = join(notes(), folder);
  await mkdir(join(directory, "assets"), { recursive: true });
  const name = folder.split("/").at(-1)!;
  const path = join(directory, `${name}.md`);
  await writeFile(path, markdown);
  if (meta) await writeFile(join(directory, "meta.json"), JSON.stringify(meta));
  return { directory, path };
}

beforeEach(async () => {
  home = await realpath(await mkdtemp(join(tmpdir(), "moss-viewer-host-")));
  vi.mocked(homedir).mockReturnValue(home);
});

afterEach(async () => {
  await rm(home, { recursive: true, force: true });
});

it("reads a Moss note with its layout and id, and leaves other Markdown to bb", async () => {
  const layout = { version: 1, tableCount: 1, tables: [{ columnWidths: [120, 240] }] };
  const tweets = await note("Tweets", "# Tweets\n\n| a | b |\n| - | - |\n", { id: "note-1", title: "Tweets" });
  await writeFile(join(tweets.directory, "layout.json"), JSON.stringify(layout));
  expect(await readNote({ path: tweets.path })).toEqual({
    moss: true,
    path: tweets.path,
    markdown: "# Tweets\n\n| a | b |\n| - | - |\n",
    layout,
    noteId: "note-1",
    modifiedMs: expect.any(Number),
  });

  await mkdir(join(home, "Code"), { recursive: true });
  const readme = join(home, "Code", "README.md");
  await writeFile(readme, "# Readme\n\nPlain Markdown.\n");
  expect(await readNote({ path: readme })).toEqual({ moss: false, path: readme });

  const marked = join(home, "Code", "spec.md");
  await writeFile(marked, "# Spec\n\n```moss-callout\nNote\n```\n");
  expect(await readNote({ path: marked })).toMatchObject({ moss: true, layout: null, noteId: null });

  expect(await readNote({ path: join(home, "Code", "notes.txt") })).toEqual({ moss: false, path: join(home, "Code", "notes.txt") });
  await expect(readNote({ path: join(home, "Code", "gone.md") })).rejects.toThrow("no longer available");
});

it("lists notes for wiki links by id and title, skipping asset folders and folders without an id", async () => {
  await note("Marketing Calendar", "# Marketing Calendar\n", { id: "cal", title: "Marketing Calendar", folderPath: "Notes", updatedAt: 1790000000 });
  await note("Archive/Old Post", "# Old Post\n", { id: "old", title: "Old Post" });
  const decoy = await note("Decoy", "# Decoy\n", { title: "No id" });
  await writeFile(join(decoy.directory, "assets", "meta.json"), JSON.stringify({ id: "asset", title: "Asset" }));

  const listed = await listNotes();
  expect(listed.truncated).toBe(false);
  expect([...listed.notes].sort((left, right) => left.id.localeCompare(right.id))).toEqual([
    { id: "cal", title: "Marketing Calendar", path: join(notes(), "Marketing Calendar", "Marketing Calendar.md"), folderPath: "Notes", updatedAt: 1790000000 },
    { id: "old", title: "Old Post", path: join(notes(), "Archive", "Old Post", "Old Post.md"), folderPath: "Notes/Archive" },
  ]);
});

it("reads byte ranges of media inside the note's folder and refuses everything else", async () => {
  const shots = await note("Shots", "# Shots\n", { id: "shots", title: "Shots" });
  const bytes = Buffer.from(Array.from({ length: 100 }, (_, index) => index));
  await writeFile(join(shots.directory, "assets", "My Pic.png"), bytes);
  await writeFile(join(shots.directory, "assets", "clip.mp4"), bytes);
  await writeFile(join(shots.directory, "assets", "secrets.txt"), "no");
  await writeFile(join(home, "outside.png"), bytes);
  await symlink(join(home, "outside.png"), join(shots.directory, "assets", "escape.png"));
  const read = (ref: string, offset = 0, length = 10) => readAsset({ notePath: shots.path, ref, offset, length });

  expect(await read("assets/My%20Pic.png", 10, 5)).toEqual({
    ok: true,
    contentType: "image/png",
    size: 100,
    modifiedMs: expect.any(Number),
    offset: 10,
    data: bytes.subarray(10, 15).toString("base64"),
  });
  expect(await read("./assets/clip.mp4", 95, 10)).toMatchObject({ ok: true, contentType: "video/mp4", offset: 95, data: bytes.subarray(95).toString("base64") });
  expect(await read("assets/clip.mp4", 0, 0)).toMatchObject({ ok: true, size: 100, data: "" });
  expect(await read("assets/secrets.txt")).toMatchObject({ ok: false, code: "unsupported" });
  expect(await read("assets/escape.png")).toMatchObject({ ok: false, code: "not_found" });
  expect(await read("../../outside.png")).toMatchObject({ ok: false, code: "not_found" });
  expect(await read(join(home, "outside.png"))).toMatchObject({ ok: false, code: "not_found" });
  expect(await read("https://example.com/a.png")).toMatchObject({ ok: false, code: "not_allowed" });

  await mkdir(join(home, "Code"), { recursive: true });
  await writeFile(join(home, "Code", "README.md"), "# Plain\n");
  await writeFile(join(home, "Code", "pic.png"), bytes);
  expect(await readAsset({ notePath: join(home, "Code", "README.md"), ref: "pic.png", offset: 0, length: 10 })).toMatchObject({
    ok: false,
    code: "not_allowed",
  });
});

it("opens only the canonical note in the Moss app, and only on a Mac", async () => {
  const tweets = await note("Tweets", "# Tweets\n", { id: "t", title: "Tweets" });
  await symlink(tweets.path, join(home, "alias.md"));
  expect(await openInMoss({ path: join(home, "alias.md") })).toEqual({ opened: true });
  expect(execFile).toHaveBeenLastCalledWith("/usr/bin/open", ["-a", "Moss", tweets.path], { timeout: 15_000 }, expect.any(Function));
  vi.mocked(platform).mockReturnValueOnce("linux");
  await expect(openInMoss({ path: tweets.path })).rejects.toThrow("Mac");
});
