// The editor's atomic exchange on a Mac. Node cannot call renamex_np(2), so a
// long-lived `osascript -l JavaScript` helper calls it through JXA's
// ObjC.bindFunction and answers one JSON line per request. Plain text, no binary.
// Wherever it cannot run, `supports` says no and notes stay read-only.
import { spawn as spawnProcess, type ChildProcessWithoutNullStreams } from "node:child_process";
import { randomUUID } from "node:crypto";
import { lstat, readFile, stat, unlink, writeFile } from "node:fs/promises";
import { constants, platform } from "node:os";
import { join } from "node:path";
import { createInterface } from "node:readline";
import { codedError, errorCode, type PathExchange } from "./editor-files.js";

/** The helper program. Requests are `{id, op: "swap" | "excl", from, to}`; replies `{id, ok, errno?}`. */
export const EXCHANGE_HELPER = `ObjC.import("Foundation");
ObjC.bindFunction("renamex_np", ["int", ["char *", "char *", "unsigned int"]]);
ObjC.bindFunction("__error", ["int *", []]);
// <stdio.h>: RENAME_SWAP and RENAME_EXCL.
const FLAGS = { swap: 0x2, excl: 0x4 };
function run() {
  const input = $.NSFileHandle.fileHandleWithStandardInput;
  const output = $.NSFileHandle.fileHandleWithStandardOutput;
  const reply = (value) => output.writeData($(JSON.stringify(value) + "\\n").dataUsingEncoding($.NSUTF8StringEncoding));
  reply({ ready: true });
  let pending = "";
  for (;;) {
    const data = input.availableData;
    if (data.length === 0) return "";
    pending += $.NSString.alloc.initWithDataEncoding(data, $.NSUTF8StringEncoding).js;
    let end;
    while ((end = pending.indexOf("\\n")) !== -1) {
      const request = JSON.parse(pending.slice(0, end));
      pending = pending.slice(end + 1);
      const flags = FLAGS[request.op];
      const status = flags === undefined ? -1 : $.renamex_np(request.from, request.to, flags);
      reply(status === 0 ? { id: request.id, ok: true } : { id: request.id, ok: false, errno: flags === undefined ? 22 : $.__error()[0] });
    }
  }
}
`;

const OSASCRIPT = "/usr/bin/osascript";
const START_TIMEOUT_MS = 10_000;
const REQUEST_TIMEOUT_MS = 10_000;
/** The helper exits after this long unused; the next request starts another. */
const IDLE_MS = 5 * 60_000;
/** How long a volume that failed the probe stays unsupported before it is probed again. */
const UNSUPPORTED_RETRY_MS = 60_000;

type Op = "swap" | "excl";
export type SpawnHelper = (command: string, args: readonly string[]) => ChildProcessWithoutNullStreams;

const errnoNames = new Map<number, string>(Object.entries(constants.errno).map(([name, value]) => [value, name]));

/** Requests stay ASCII, so a path never splits inside a UTF-8 sequence between the helper's reads. */
const asciiJson = (value: unknown) =>
  JSON.stringify(value).replace(/[\u007f-￿]/g, (char) => `\\u${char.charCodeAt(0).toString(16).padStart(4, "0")}`);

class Helper {
  private readonly child: ChildProcessWithoutNullStreams;
  private readonly waiting = new Map<number, { resolve: () => void; reject: (error: Error) => void; timer: ReturnType<typeof setTimeout> }>();
  private nextId = 1;
  private stopped = false;
  private stderr = "";
  readonly ready: Promise<void>;

  constructor(spawn: SpawnHelper) {
    this.child = spawn(OSASCRIPT, ["-l", "JavaScript", "-e", EXCHANGE_HELPER]);
    let started!: () => void;
    let failed!: (error: Error) => void;
    this.ready = new Promise<void>((resolve, reject) => {
      started = resolve;
      failed = reject;
    });
    const startTimer = setTimeout(() => this.stop(codedError("ETIMEDOUT", "The Moss exchange helper did not start.")), START_TIMEOUT_MS);
    this.ready.then(
      () => clearTimeout(startTimer),
      () => clearTimeout(startTimer),
    );
    createInterface({ input: this.child.stdout }).on("line", (line) => {
      let message: { ready?: boolean; id?: number; ok?: boolean; errno?: number };
      try {
        message = JSON.parse(line) as typeof message;
      } catch {
        return;
      }
      if (message.ready) {
        started();
        return;
      }
      const waiting = message.id === undefined ? undefined : this.waiting.get(message.id);
      if (!waiting) return;
      this.waiting.delete(message.id!);
      clearTimeout(waiting.timer);
      if (message.ok) waiting.resolve();
      else waiting.reject(codedError(errnoNames.get(message.errno ?? -1) ?? "EUNKNOWN", `renamex_np failed (errno ${message.errno})`));
    });
    this.child.stderr.on("data", (chunk: Buffer) => {
      this.stderr = (this.stderr + chunk.toString("utf8")).slice(-2000);
    });
    const closed = (error?: Error) => {
      const reason = codedError("EIO", `The Moss exchange helper stopped${error ? `: ${error.message}` : ""}${this.stderr ? `: ${this.stderr.trim()}` : ""}`);
      this.stopped = true;
      failed(reason);
      for (const [id, waiting] of this.waiting) {
        clearTimeout(waiting.timer);
        waiting.reject(reason);
        this.waiting.delete(id);
      }
    };
    this.child.on("error", closed);
    this.child.on("exit", () => closed());
    // Nothing should keep the host worker alive but its own work.
    this.child.unref?.();
  }

  get alive(): boolean {
    return !this.stopped;
  }

  async call(op: Op, from: string, to: string): Promise<void> {
    await this.ready;
    if (this.stopped) throw codedError("EIO", "The Moss exchange helper stopped.");
    const id = this.nextId++;
    await new Promise<void>((resolve, reject) => {
      const timer = setTimeout(() => {
        this.waiting.delete(id);
        reject(codedError("ETIMEDOUT", "The Moss exchange helper did not answer."));
        this.stop();
      }, REQUEST_TIMEOUT_MS);
      this.waiting.set(id, { resolve, reject, timer });
      this.child.stdin.write(`${asciiJson({ id, op, from, to })}\n`);
    });
  }

  stop(error?: Error): void {
    if (this.stopped) return;
    this.stopped = true;
    if (error) for (const waiting of this.waiting.values()) waiting.reject(error);
    this.child.stdin.end();
    this.child.kill();
  }
}

export interface MacExchangeOptions {
  spawn?: SpawnHelper;
  /** Only macOS has renamex_np. */
  isMac?: boolean;
}

/** The Mac's `PathExchange`, through the helper; `dispose` stops it. */
export function macPathExchange({ spawn = spawnProcess as SpawnHelper, isMac = platform() === "darwin" }: MacExchangeOptions = {}) {
  let helper: Helper | null = null;
  let idle: ReturnType<typeof setTimeout> | undefined;
  const volumes = new Map<number, { supported: boolean; at: number } | Promise<boolean>>();

  function running(): Helper {
    if (helper === null || !helper.alive) helper = new Helper(spawn);
    clearTimeout(idle);
    const current = helper;
    idle = setTimeout(() => current.stop(), IDLE_MS);
    idle.unref?.();
    return current;
  }

  async function call(op: Op, from: string, to: string): Promise<void> {
    if (!isMac) throw codedError("ENOTSUP", "Moss notes can be edited only on a Mac.");
    try {
      await running().call(op, from, to);
    } catch (error) {
      // If the helper could not say why, tell the caller what the paths show.
      if (errorCode(error) !== "EUNKNOWN") throw error;
      const exists = (path: string) => lstat(path).then(() => true, () => false);
      if (op === "excl" && (await exists(to))) throw codedError("EEXIST", `${to} exists`);
      if (op === "swap" && !((await exists(from)) && (await exists(to)))) throw codedError("ENOENT", "A file to exchange is missing.");
      throw codedError("EIO", (error as Error).message);
    }
  }

  /** Exchanges two scratch files in the folder: proof the helper runs and the volume can swap. */
  async function probe(directory: string): Promise<boolean> {
    const base = join(directory, `.bb-exchange-probe-${randomUUID()}`);
    const [first, second] = [`${base}-1`, `${base}-2`];
    try {
      await writeFile(first, "1", { flag: "wx" });
      await writeFile(second, "2", { flag: "wx" });
      await call("swap", first, second);
      return (await readFile(first, "utf8")) === "2" && (await readFile(second, "utf8")) === "1";
    } catch {
      return false;
    } finally {
      await unlink(first).catch(() => undefined);
      await unlink(second).catch(() => undefined);
    }
  }

  return {
    exchange: (first: string, second: string) => call("swap", first, second),
    renameExclusive: (from: string, to: string) => call("excl", from, to),

    async supports(directory: string): Promise<boolean> {
      if (!isMac) return false;
      const { dev } = await stat(directory);
      const known = volumes.get(dev);
      if (known instanceof Promise) return known;
      if (known && (known.supported || Date.now() - known.at < UNSUPPORTED_RETRY_MS)) return known.supported;
      const probing = probe(directory);
      volumes.set(dev, probing);
      const supported = await probing;
      volumes.set(dev, { supported, at: Date.now() });
      return supported;
    },

    dispose(): void {
      clearTimeout(idle);
      helper?.stop();
      helper = null;
    },
  } satisfies PathExchange & { dispose(): void };
}
