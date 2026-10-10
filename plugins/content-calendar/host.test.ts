import { mkdir, mkdtemp, realpath, rm, symlink, utimes, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { inspect, openInMoss, resolveFile, search, systemDeps, type HostDeps } from "./host-files.js";

let home: string;
let deps: HostDeps & { openInMoss: ReturnType<typeof vi.fn> };
beforeEach(async () => {
  home = await realpath(await mkdtemp(join(tmpdir(), "content-calendar-host-")));
  await mkdir(join(home, "Moss", "Notes", "Drafts"), { recursive: true });
  await mkdir(join(home, "Moss", "Notes", ".hidden"), { recursive: true });
  await mkdir(join(home, "Moss", "Notes", "folder.md"), { recursive: true });
  await mkdir(join(home, "Elsewhere"), { recursive: true });
  await writeFile(join(home, "Moss", "Notes", "Drafts", "Ambient Tweet.md"), "# Ambient");
  await writeFile(join(home, "Moss", "Notes", "Drafts", "ambient.png"), "png");
  await writeFile(join(home, "Moss", "Notes", "Older.markdown"), "# Older");
  await writeFile(join(home, "Moss", "Notes", ".hidden", "ambient secret.md"), "hidden");
  await writeFile(join(home, "Elsewhere", "outside.md"), "# Outside");
  await symlink(join(home, "Elsewhere", "outside.md"), join(home, "Moss", "Notes", "escape.md"));
  await symlink(join(home, "Moss", "Notes", "Drafts", "ambient.png"), join(home, "Moss", "Notes", "image.md"));
  deps = { ...systemDeps, platform: "darwin", homedir: () => home, openInMoss: vi.fn(async () => undefined) };
});
afterEach(async () => { await rm(home, { recursive: true, force: true }); });

describe("openInMoss", () => {
  it("opens an existing .md note under ~/Moss with its canonical path", async () => {
    const note = join(home, "Moss", "Notes", "Drafts", "Ambient Tweet.md");
    expect(await openInMoss({ path: note }, deps)).toEqual({ opened: true });
    expect(deps.openInMoss).toHaveBeenCalledWith(note);
  });

  it("refuses anything that is not a regular .md file under ~/Moss, and never launches it", async () => {
    const refused = [
      join(home, "Moss", "Notes", "Drafts", "ambient.png"), // not Markdown
      join(home, "Elsewhere", "outside.md"), // outside ~/Moss
      join(home, "Moss", "Notes", "escape.md"), // symlink escaping ~/Moss
      join(home, "Moss", "Notes", "image.md"), // .md name resolving to a non-Markdown file
      join(home, "Moss", "Notes", "folder.md"), // a folder
      join(home, "Moss", "Notes", "gone.md"), // missing
      "Moss/Notes/Drafts/Ambient Tweet.md", // relative
    ];
    for (const path of refused) {
      const result = await openInMoss({ path }, deps);
      expect(result.opened, path).toBe(false);
      expect(result.reason).toBeTruthy();
    }
    expect(deps.openInMoss).not.toHaveBeenCalled();
  });

  it("refuses on any platform but macOS and reports a failed launch", async () => {
    const note = join(home, "Moss", "Notes", "Drafts", "Ambient Tweet.md");
    expect(await openInMoss({ path: note }, { ...deps, platform: "linux" })).toMatchObject({ opened: false });
    expect(deps.openInMoss).not.toHaveBeenCalled();
    deps.openInMoss.mockRejectedValueOnce(new Error("no Moss"));
    expect(await openInMoss({ path: note }, deps)).toMatchObject({ opened: false, reason: "Moss could not open that note." });
  });
});

describe("files on the Mac", () => {
  it("searches ~/Moss/Notes by relative path, preferring notes and skipping dot folders", async () => {
    const result = await search({ query: "ambient", limit: 50 }, deps);
    expect(result.root).toBe(join(home, "Moss", "Notes"));
    expect(result.files.map((file) => file.relative)).toEqual([join("Drafts", "Ambient Tweet.md"), join("Drafts", "ambient.png")]);
  });

  it("lists recent notes for an empty query", async () => {
    await utimes(join(home, "Moss", "Notes", "Older.markdown"), new Date("2020-01-01"), new Date("2020-01-01"));
    const result = await search({ query: "", limit: 50 }, deps);
    expect(result.files.map((file) => file.name)).toEqual(["Ambient Tweet.md", "Older.markdown"]);
  });

  it("resolves ~/ paths to canonical regular files and inspects them", async () => {
    const note = join(home, "Moss", "Notes", "Drafts", "Ambient Tweet.md");
    expect(await resolveFile({ path: "~/Moss/Notes/Drafts/Ambient Tweet.md" }, deps)).toEqual({ path: note, name: "Ambient Tweet.md" });
    await expect(resolveFile({ path: "~/Moss/Notes/folder.md" }, deps)).rejects.toThrow("Choose a file");
    await expect(resolveFile({ path: "relative.md" }, deps)).rejects.toThrow("absolute path");
    expect(await inspect({ paths: [note, join(home, "gone.md")] }, deps)).toEqual({
      files: [{ path: note, status: "available" }, { path: join(home, "gone.md"), status: "missing" }],
    });
  });
});
