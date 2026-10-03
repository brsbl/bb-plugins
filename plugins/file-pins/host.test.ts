import { mkdtemp, mkdir, rm, symlink, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { expect, it } from "vitest";
import { resolveFile } from "./host-files.js";

it("resolves paths on the owning host, canonicalizes aliases, and refuses directories and missing files", async () => {
  const directory = await mkdtemp(join(tmpdir(), "file-pins-"));
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
