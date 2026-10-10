import { execFile } from "node:child_process";
import type { Dirent } from "node:fs";
import { readdir, realpath, stat } from "node:fs/promises";
import { homedir } from "node:os";
import { basename, extname, isAbsolute, join, relative, resolve, sep } from "node:path";

// Runs on the Mac. Attachment records come back from Google Calendar, where
// other apps can edit them, so every input is checked again here.

type FileStat = { isFile(): boolean; mtimeMs: number };

export interface HostDeps {
  platform: string;
  homedir(): string;
  realpath(path: string): Promise<string>;
  stat(path: string): Promise<FileStat>;
  readdir(path: string): Promise<Dirent[]>;
  /** Opens one canonical .md file in Moss. Never a generic open. */
  openInMoss(path: string): Promise<void>;
}

function launchMoss(path: string): Promise<void> {
  return new Promise((done, fail) => {
    execFile("/usr/bin/open", ["-a", "Moss", path], { timeout: 15_000 }, (error) => (error ? fail(error) : done()));
  });
}

export const systemDeps: HostDeps = {
  platform: process.platform,
  homedir,
  realpath,
  stat,
  readdir: (path) => readdir(path, { withFileTypes: true }),
  openInMoss: launchMoss,
};

const MAX_DEPTH = 6;
const MAX_ENTRIES = 5000;

function isMarkdown(path: string): boolean {
  const extension = extname(path).toLowerCase();
  return extension === ".md" || extension === ".markdown";
}

function expand(path: string, deps: HostDeps): string {
  return path === "~" ? deps.homedir() : path.startsWith("~/") ? resolve(deps.homedir(), path.slice(2)) : path;
}

type Found = { path: string; name: string; relative: string };

/** Files under ~/Moss/Notes whose relative path contains the query; an empty query lists recent notes. */
export async function search({ query, limit }: { query: string; limit: number }, deps: HostDeps = systemDeps) {
  const root = join(deps.homedir(), "Moss", "Notes");
  const needle = query.trim().toLowerCase();
  const found: Array<Found & { mtime: number }> = [];
  const queue: Array<{ dir: string; depth: number }> = [{ dir: root, depth: 0 }];
  let scanned = 0;
  while (queue.length && scanned < MAX_ENTRIES) {
    const { dir, depth } = queue.shift()!;
    let entries: Dirent[];
    try { entries = await deps.readdir(dir); } catch { continue; }
    for (const entry of entries) {
      if (++scanned > MAX_ENTRIES) break;
      if (entry.name.startsWith(".") || entry.name === "node_modules") continue;
      const path = join(dir, entry.name);
      // Symlinks are never followed, so a search cannot leave ~/Moss/Notes.
      if (entry.isDirectory()) {
        if (depth + 1 < MAX_DEPTH) queue.push({ dir: path, depth: depth + 1 });
        continue;
      }
      if (!entry.isFile()) continue;
      const rel = relative(root, path);
      if (needle ? !rel.toLowerCase().includes(needle) : !isMarkdown(path)) continue;
      let mtime = 0;
      if (!needle) { try { mtime = (await deps.stat(path)).mtimeMs; } catch { continue; } }
      found.push({ path, name: entry.name, relative: rel, mtime });
    }
  }
  const nameHit = (file: Found) => (file.name.toLowerCase().includes(needle) ? 0 : 1);
  found.sort(needle
    ? (a, b) => Number(!isMarkdown(a.path)) - Number(!isMarkdown(b.path)) || nameHit(a) - nameHit(b) || a.relative.length - b.relative.length || a.relative.localeCompare(b.relative)
    : (a, b) => b.mtime - a.mtime);
  return { root, files: found.slice(0, limit).map(({ path, name, relative: rel }) => ({ path, name, relative: rel })) };
}

export async function resolveFile({ path, cwd }: { path: string; cwd?: string }, deps: HostDeps = systemDeps) {
  const expanded = expand(path, deps);
  if (!isAbsolute(expanded) && (!cwd || !isAbsolute(cwd))) throw new Error("Enter an absolute path or a path beginning with ~/.");
  const absolute = resolve(cwd ?? deps.homedir(), expanded);
  let canonical: string;
  try { canonical = await deps.realpath(absolute); } catch { throw new Error(`Cannot access ${absolute} on this Mac. Check the path and file permissions.`); }
  let file: FileStat;
  try { file = await deps.stat(canonical); } catch { throw new Error(`Cannot access ${absolute} on this Mac. Check the path and file permissions.`); }
  if (!file.isFile()) throw new Error("Choose a file, not a folder.");
  return { path: canonical, name: basename(canonical) };
}

export async function inspect({ paths }: { paths: string[] }, deps: HostDeps = systemDeps) {
  const files: Array<{ path: string; status: "available" | "missing" }> = [];
  for (const path of paths) {
    let available = false;
    if (isAbsolute(path)) { try { available = (await deps.stat(path)).isFile(); } catch { available = false; } }
    files.push({ path, status: available ? "available" : "missing" });
  }
  return { files };
}

/** Opens only an existing regular .md/.markdown file whose real path is under ~/Moss, and only on macOS. */
export async function openInMoss({ path }: { path: string }, deps: HostDeps = systemDeps): Promise<{ opened: boolean; reason?: string }> {
  const refuse = (reason: string) => ({ opened: false, reason });
  if (deps.platform !== "darwin") return refuse("Moss notes open only on macOS.");
  if (!isAbsolute(path) || path.includes("\0")) return refuse("Not an absolute file path.");
  if (!isMarkdown(path)) return refuse("Only .md notes open in Moss.");
  let canonical: string;
  let mossRoot: string;
  try { canonical = await deps.realpath(path); } catch { return refuse("That note is no longer available."); }
  try { mossRoot = await deps.realpath(join(deps.homedir(), "Moss")); } catch { return refuse("This Mac has no ~/Moss folder."); }
  if (!isMarkdown(canonical)) return refuse("Only .md notes open in Moss.");
  if (!canonical.startsWith(mossRoot.endsWith(sep) ? mossRoot : mossRoot + sep)) return refuse("Only notes under ~/Moss open in Moss.");
  try { if (!(await deps.stat(canonical)).isFile()) return refuse("Not a regular file."); } catch { return refuse("That note is no longer available."); }
  try { await deps.openInMoss(canonical); } catch { return refuse("Moss could not open that note."); }
  return { opened: true };
}
