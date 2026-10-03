import { realpath, stat } from "node:fs/promises";
import { homedir } from "node:os";
import { basename, isAbsolute, resolve } from "node:path";
import { experimental_defineHostEntry } from "@get-bb/plugin-sdk/host";
import { hostContract } from "./contract.js";

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

export default experimental_defineHostEntry({
  contract: hostContract,
  handlers: { resolveFile },
});
