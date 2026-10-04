import { realpath, stat } from "node:fs/promises";
import { homedir } from "node:os";
import { basename, isAbsolute, resolve } from "node:path";

export async function home() { return { path: homedir() }; }

export async function recentFiles({ paths, cwd }: { paths: string[]; cwd: string }) {
  const files: Array<{ path: string; name: string }> = [];
  for (const path of paths) {
    try {
      const file = await resolveFile({ path, cwd });
      if (!files.some((other) => other.path === file.path)) files.push(file);
    } catch { /* History may refer to deleted files or folders; neither is a suggestion. */ }
  }
  return { files };
}

export async function inspect({ paths }: { paths: string[] }) {
  const files: Array<{ path: string; status: "available" | "missing" | "unavailable" }> = [];
  // Serialize filesystem reads on the host; never read a Mac path on the server.
  for (const path of paths) {
    try {
      files.push({ path, status: (await stat(path)).isFile() ? "available" : "missing" });
    } catch (error) {
      const code = (error as NodeJS.ErrnoException).code;
      files.push({ path, status: code === "ENOENT" || code === "ENOTDIR" ? "missing" : "unavailable" });
    }
  }
  return { files };
}

export async function resolveFile({ path, cwd }: { path: string; cwd?: string }) {
  const expanded = path.startsWith("~/") ? resolve(homedir(), path.slice(2)) : path;
  if (!isAbsolute(expanded) && (!cwd || !isAbsolute(cwd))) {
    throw new Error("Enter an absolute path or a path beginning with ~/.");
  }
  const absolute = resolve(cwd ?? homedir(), expanded);
  try {
    const canonical = await realpath(absolute);
    if (!(await stat(canonical)).isFile()) throw new Error("not-file");
    return { path: canonical, name: basename(canonical) };
  } catch (error) {
    if (error instanceof Error && error.message === "not-file") {
      throw new Error("Choose a file, not a folder.");
    }
    throw new Error(`Cannot access ${absolute} on this host. Check the path and file permissions.`);
  }
}
