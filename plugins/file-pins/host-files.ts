import { realpath, stat } from "node:fs/promises";
import { createReadStream } from "node:fs";
import { execFile } from "node:child_process";
import { homedir, platform } from "node:os";
import { basename, isAbsolute, relative, resolve } from "node:path";

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

// Recognize distinctive Moss markers only; rendering belongs to the Moss app.
async function isMossNote(path: string): Promise<boolean> {
  if (!/\.(?:md|markdown)$/i.test(path)) return false;
  const notes = await realpath(resolve(homedir(), "Moss/Notes")).catch(() => resolve(homedir(), "Moss/Notes"));
  const within = relative(notes, path);
  if (within && within !== ".." && !within.startsWith("../") && !isAbsolute(within)) return true;
  const marker = /\n[ \t]{0,3}(?:(?:`{3,}|~{3,})moss-[a-z][\w-]*\b|:::tabs\b)/;
  // Stream so checking a large Markdown file does not copy it into server memory.
  let tail = "\n";
  for await (const chunk of createReadStream(path, { encoding: "utf8" })) {
    const text = tail + chunk;
    if (marker.test(text)) return true;
    tail = text.slice(-256);
  }
  return false;
}

export async function openMossNote({ path }: { path: string }): Promise<{ opened: boolean }> {
  const file = await resolveFile({ path });
  if (!(await isMossNote(file.path))) return { opened: false };
  if (platform() !== "darwin") throw new Error("Moss notes must be opened on a Mac with the Moss app installed.");
  await new Promise<void>((accept, reject) => {
    execFile("/usr/bin/open", ["-a", "Moss", file.path], { timeout: 15_000 }, (error) => {
      if (error) reject(new Error("Could not open this note in Moss. Check that Moss is installed on the file's Mac."));
      else accept();
    });
  });
  return { opened: true };
}
