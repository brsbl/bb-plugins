import { mkdtemp, mkdir, rm, symlink, writeFile } from "node:fs/promises";
import { homedir, platform, tmpdir } from "node:os";
import { execFile } from "node:child_process";
import { join } from "node:path";
import { expect, it, vi } from "vitest";
import { openMossNote, resolveFile } from "./host-files.js";

vi.mock("node:child_process", () => ({ execFile: vi.fn((_file, _args, _options, callback) => callback(null)) }));
vi.mock("node:os", async (original) => ({ ...await original<typeof import("node:os")>(), homedir: vi.fn(), platform: vi.fn(() => "darwin") }));

it("resolves paths on the owning host, canonicalizes aliases, and refuses directories and missing files", async () => {
  const directory = await mkdtemp(join(tmpdir(), "file-pins-"));
  vi.mocked(homedir).mockReturnValue(directory);
  try {
    await writeFile(join(directory, "note.md"), "# Kept on host");
    await symlink(join(directory, "note.md"), join(directory, "alias.md"));
    const canonical = await resolveFile({ path: join(directory, "note.md") });
    expect(await resolveFile({ path: "alias.md", cwd: directory })).toEqual(canonical);
    await mkdir(join(directory, "folder"));
    await expect(resolveFile({ path: join(directory, "folder") })).rejects.toThrow("Choose a file");
    await expect(resolveFile({ path: join(directory, "gone.md") })).rejects.toThrow("Cannot access");
    await expect(resolveFile({ path: "relative.md" })).rejects.toThrow("absolute path");
  } finally { await rm(directory, { recursive: true, force: true }); }
});

it("detects Moss on the file host at click time and launches only the canonical note in the Mac app", async () => {
  const directory = await mkdtemp(join(tmpdir(), "file-pins-moss-"));
  vi.mocked(homedir).mockReturnValue(directory);
  try {
    const ordinary = join(directory, "ordinary.md");
    await writeFile(ordinary, "# Regular Markdown\nMoss is an app, not a marker.");
    expect(await openMossNote({ path: ordinary })).toEqual({ opened: false });
    expect(execFile).not.toHaveBeenCalled();
    await writeFile(ordinary, "x".repeat(65530) + "\n```moss-callout\nHello\n```\n");
    expect(await openMossNote({ path: ordinary })).toEqual({ opened: true });
    expect(execFile).toHaveBeenLastCalledWith("/usr/bin/open", ["-a", "Moss", ordinary], { timeout: 15_000 }, expect.any(Function));
    await writeFile(ordinary, ":::tabs\n@tab=One\nHello\n:::");
    expect(await openMossNote({ path: ordinary })).toEqual({ opened: true });
    const notes = join(directory, "Moss", "Notes");
    await mkdir(notes, { recursive: true });
    const note = join(notes, "quoted '$note.md");
    await writeFile(note, "# A note with no special syntax");
    await symlink(note, join(directory, "alias.md"));
    expect(await openMossNote({ path: join(directory, "alias.md") })).toEqual({ opened: true });
    expect(execFile).toHaveBeenLastCalledWith("/usr/bin/open", ["-a", "Moss", note], { timeout: 15_000 }, expect.any(Function));
    vi.mocked(platform).mockReturnValue("linux");
    await expect(openMossNote({ path: note })).rejects.toThrow("Mac");
  } finally {
    vi.mocked(platform).mockReturnValue("darwin");
    await rm(directory, { recursive: true, force: true });
  }
});
