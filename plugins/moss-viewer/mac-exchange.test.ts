import type { ChildProcessWithoutNullStreams } from "node:child_process";
import { EventEmitter } from "node:events";
import { lstat, mkdtemp, readdir, readFile, realpath, rename, rm, writeFile } from "node:fs/promises";
import { constants, tmpdir } from "node:os";
import { join } from "node:path";
import { createInterface } from "node:readline";
import { PassThrough } from "node:stream";
import { afterEach, beforeEach, expect, it } from "vitest";
import { EXCHANGE_HELPER, macPathExchange, type SpawnHelper } from "./mac-exchange.js";

let directory = "";
beforeEach(async () => {
  directory = await realpath(await mkdtemp(join(tmpdir(), "moss-exchange-")));
});
afterEach(async () => {
  await rm(directory, { recursive: true, force: true });
});

interface FakeOptions {
  /** Exit at once instead of announcing it is ready, as when JXA cannot bind renamex_np. */
  failToStart?: boolean;
  /** Answer failures with an errno the host does not know. */
  unknownErrno?: boolean;
  /** Break the pipe on the first request, as writing to a helper that just died does. */
  brokenPipe?: boolean;
}

/** Plays the osascript helper over the same line-JSON protocol, renaming on this Linux volume. */
function fakeHelper(options: FakeOptions = {}) {
  const spawned: Array<{ command: string; args: readonly string[] }> = [];
  const lines: string[] = [];
  const children: EventEmitter[] = [];
  const failure = (code: string) => Object.assign(new Error(code), { code });
  const exists = (path: string) => lstat(path).then(() => true, () => false);
  async function rename2(op: string, from: string, to: string) {
    if (op === "excl") {
      if (await exists(to)) throw failure("EEXIST");
      await rename(from, to);
      return;
    }
    if (!(await exists(from)) || !(await exists(to))) throw failure("ENOENT");
    await rename(from, `${from}.swapping`);
    await rename(to, from);
    await rename(`${from}.swapping`, to);
  }
  const spawn: SpawnHelper = (command, args) => {
    spawned.push({ command, args });
    const stdin = new PassThrough();
    const stdout = new PassThrough();
    const child = Object.assign(new EventEmitter(), {
      stdin,
      stdout,
      stderr: new PassThrough(),
      kill: () => {
        queueMicrotask(() => child.emit("exit", null, "SIGTERM"));
        return true;
      },
      unref: () => undefined,
    });
    children.push(child);
    if (options.failToStart) {
      queueMicrotask(() => child.stderr.write("execution error: Error: renamex_np is not a function\n"));
      setImmediate(() => child.emit("exit", 1, null));
    } else {
      queueMicrotask(() => stdout.write('{"ready":true}\n'));
    }
    if (options.brokenPipe) {
      // The helper is gone: nothing answers, and the first write breaks the pipe.
      stdin.on("data", () => stdin.destroy(failure("EPIPE")));
      return child as unknown as ChildProcessWithoutNullStreams;
    }
    createInterface({ input: stdin }).on("line", (line) => {
      lines.push(line);
      const request = JSON.parse(line) as { id: number; op: string; from: string; to: string };
      rename2(request.op, request.from, request.to).then(
        () => stdout.write(`${JSON.stringify({ id: request.id, ok: true })}\n`),
        (error: NodeJS.ErrnoException) =>
          stdout.write(`${JSON.stringify({ id: request.id, ok: false, errno: options.unknownErrno ? 9999 : constants.errno[error.code as keyof typeof constants.errno] })}\n`),
      );
    });
    return child as unknown as ChildProcessWithoutNullStreams;
  };
  return { spawn, spawned, lines, children };
}

it("swaps and renames exclusively through one long-lived helper", async () => {
  const helper = fakeHelper();
  const paths = macPathExchange({ spawn: helper.spawn, isMac: true });
  const [first, second] = [join(directory, "Été.md"), join(directory, "b.md")];
  await writeFile(first, "first");
  await writeFile(second, "second");

  await paths.exchange(first, second);
  expect([await readFile(first, "utf8"), await readFile(second, "utf8")]).toEqual(["second", "first"]);
  await expect(paths.renameExclusive(first, second)).rejects.toMatchObject({ code: "EEXIST" });
  await paths.renameExclusive(first, join(directory, "c.md"));
  await expect(paths.exchange(first, second)).rejects.toMatchObject({ code: "ENOENT" });

  expect(helper.spawned).toEqual([{ command: "/usr/bin/osascript", args: ["-l", "JavaScript", "-e", EXCHANGE_HELPER] }]);
  // Requests are ASCII, so a path never splits inside a UTF-8 sequence.
  expect(helper.lines[0]).toMatch(/^[\x20-\x7e]+$/);
  expect(JSON.parse(helper.lines[0]!)).toEqual({ id: 1, op: "swap", from: first, to: second });
  paths.dispose();
});

it("supports a volume once a probe exchange works, and leaves nothing behind", async () => {
  const helper = fakeHelper();
  const paths = macPathExchange({ spawn: helper.spawn, isMac: true });
  expect(await paths.supports(directory)).toBe(true);
  expect(await paths.supports(directory)).toBe(true);
  expect(helper.lines).toHaveLength(1);
  expect(await readdir(directory)).toEqual([]);
  paths.dispose();
});

it("supports nothing where the helper cannot run, so notes stay read-only", async () => {
  const notMac = fakeHelper();
  expect(await macPathExchange({ spawn: notMac.spawn, isMac: false }).supports(directory)).toBe(false);
  expect(notMac.spawned).toEqual([]);

  const broken = fakeHelper({ failToStart: true });
  const paths = macPathExchange({ spawn: broken.spawn, isMac: true });
  expect(await paths.supports(directory)).toBe(false);
  expect(await readdir(directory)).toEqual([]);
  await writeFile(join(directory, "a"), "a");
  await writeFile(join(directory, "b"), "b");
  await expect(paths.exchange(join(directory, "a"), join(directory, "b"))).rejects.toMatchObject({
    code: "EIO",
    message: expect.stringContaining("renamex_np is not a function"),
  });
  expect(await readFile(join(directory, "a"), "utf8")).toBe("a");
});

it("names the failure from the paths when the helper cannot", async () => {
  const helper = fakeHelper({ unknownErrno: true });
  const paths = macPathExchange({ spawn: helper.spawn, isMac: true });
  await writeFile(join(directory, "a"), "a");
  await writeFile(join(directory, "b"), "b");
  await expect(paths.renameExclusive(join(directory, "a"), join(directory, "b"))).rejects.toMatchObject({ code: "EEXIST" });
  await expect(paths.exchange(join(directory, "a"), join(directory, "gone"))).rejects.toMatchObject({ code: "ENOENT" });
  paths.dispose();
});

it("starts a new helper after one stops", async () => {
  const helper = fakeHelper();
  const paths = macPathExchange({ spawn: helper.spawn, isMac: true });
  await writeFile(join(directory, "a"), "a");
  await writeFile(join(directory, "b"), "b");
  await paths.exchange(join(directory, "a"), join(directory, "b"));
  helper.children[0]!.emit("exit", 1, null);
  await paths.exchange(join(directory, "a"), join(directory, "b"));
  expect(helper.spawned).toHaveLength(2);
  expect(await readFile(join(directory, "a"), "utf8")).toBe("a");
  paths.dispose();
});

it("fails a request cleanly, without crashing, when the helper's pipe breaks", async () => {
  const helper = fakeHelper({ brokenPipe: true });
  const paths = macPathExchange({ spawn: helper.spawn, isMac: true });
  await writeFile(join(directory, "a"), "a");
  await writeFile(join(directory, "b"), "b");
  await expect(paths.exchange(join(directory, "a"), join(directory, "b"))).rejects.toMatchObject({ code: "EIO" });
  expect(await readFile(join(directory, "a"), "utf8")).toBe("a");
  paths.dispose();
});
