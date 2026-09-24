import { execFile, fork, type ChildProcess } from "node:child_process";
import { createHash } from "node:crypto";
import { cp, mkdir, readFile, rename, rm, writeFile } from "node:fs/promises";
import { setPriority } from "node:os";
import { join } from "node:path";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

export interface SpeechAudio {
  sampleRate: number;
  pcm: Uint8Array;
}

export interface SynthesisRequest {
  text: string;
  voice: string;
  speed: number;
  signal?: AbortSignal;
}

export interface Synthesizer {
  synthesize(request: SynthesisRequest): Promise<SpeechAudio>;
}

type WorkerMessage =
  | { type: "ready" }
  | { type: "audio"; id: number; sampleRate: number; pcm: Uint8Array }
  | { type: "error"; id: number; message: string };

interface Job extends SynthesisRequest {
  resolve(audio: SpeechAudio): void;
  reject(error: Error): void;
}

type SynthesisJob = Pick<SynthesisRequest, "text" | "voice" | "speed">;

/** Two chunks in flight keep 4 vCPUs ahead of 2× playback. */
const maxConcurrent = 2;
/** Room for several devices each prefetching a few chunks. */
const maxQueued = 12;
const readyTimeoutMs = 10 * 60_000;
const installTimeoutMs = 15 * 60_000;
// The lockfile ships under another name so the monorepo keeps one root
// lockfile; provisioning restores it as package-lock.json for `npm ci`.
const runtimeLock = "runtime-lock.json";
const runtimeFiles = ["package.json", "sharp-stub"];

export class SynthesisBusyError extends Error {}

/**
 * Bounded FIFO in front of the synthesis process. A request whose client
 * disconnects leaves the queue at once, so cancelled prefetches from speed
 * changes or stops never count against the limit.
 */
export class SynthesisQueue {
  private readonly waiting: Job[] = [];
  private readonly running = new Map<number, Job>();
  private send: ((id: number, job: SynthesisJob) => void) | null = null;
  private nextId = 1;

  constructor(
    private readonly concurrency = maxConcurrent,
    private readonly capacity = maxQueued,
  ) {}

  get size(): number {
    return this.waiting.length;
  }

  attach(send: (id: number, job: SynthesisJob) => void): void {
    this.send = send;
    this.pump();
  }

  detach(error: Error): void {
    this.send = null;
    for (const job of this.running.values()) job.reject(error);
    this.running.clear();
  }

  enqueue(request: SynthesisRequest): Promise<SpeechAudio> {
    if (request.signal?.aborted) return Promise.reject(new Error("Cancelled"));
    if (this.waiting.length >= this.capacity) {
      return Promise.reject(new SynthesisBusyError("The voice server is busy"));
    }
    return new Promise((resolve, reject) => {
      const job: Job = { ...request, resolve, reject };
      this.waiting.push(job);
      request.signal?.addEventListener(
        "abort",
        () => {
          const index = this.waiting.indexOf(job);
          if (index === -1) return;
          this.waiting.splice(index, 1);
          reject(new Error("Cancelled"));
        },
        { once: true },
      );
      this.pump();
    });
  }

  settle(id: number, result: SpeechAudio | Error): void {
    const job = this.running.get(id);
    if (!job) return;
    this.running.delete(id);
    if (result instanceof Error) job.reject(result);
    else job.resolve(result);
    this.pump();
  }

  private pump(): void {
    while (this.send && this.running.size < this.concurrency && this.waiting.length > 0) {
      const job = this.waiting.shift()!;
      const id = this.nextId++;
      this.running.set(id, job);
      this.send(id, { text: job.text, voice: job.voice, speed: job.speed });
    }
  }
}

/**
 * Installs the pinned Kokoro runtime into the plugin's data directory (once
 * per lockfile) and keeps a low-priority synthesis process warm.
 */
export class KokoroSynthesizer implements Synthesizer {
  private child: ChildProcess | null = null;
  private ready: Promise<void>;
  private markReady!: () => void;
  private failStartup!: (error: Error) => void;
  private readonly queue = new SynthesisQueue();

  constructor(
    private readonly shippedRuntimeDir: string,
    private readonly dataDir: string,
    private readonly log: (message: string) => void,
  ) {
    this.ready = this.resetReady();
  }

  /** Runs until `signal` aborts; rejects if the process exits unexpectedly. */
  async run(signal: AbortSignal): Promise<void> {
    let runtimeDir: string;
    try {
      runtimeDir = await this.provision();
    } catch (error) {
      this.failStartup(error instanceof Error ? error : new Error(String(error)));
      this.ready = this.resetReady();
      throw error;
    }
    if (signal.aborted) return;
    const child = fork(join(runtimeDir, "synth-worker.mjs"), [], {
      cwd: runtimeDir,
      env: { ...process.env, READ_ALOUD_MODEL_CACHE: join(this.dataDir, "models") },
      // Parent loader flags (such as a TypeScript loader) do not apply here.
      execArgv: [],
      serialization: "advanced",
      stdio: ["ignore", "ignore", "pipe", "ipc"],
    });
    this.child = child;
    if (child.pid) setPriority(child.pid, 10);
    let stderr = "";
    child.stderr?.on("data", (data: Buffer) => {
      stderr = (stderr + data.toString()).slice(-2000);
    });
    child.on("message", (message: WorkerMessage) => this.receive(message));
    const stop = () => child.kill();
    signal.addEventListener("abort", stop, { once: true });
    const exit = await new Promise<number | null>((resolve) => child.on("exit", resolve));
    signal.removeEventListener("abort", stop);
    this.child = null;
    const error = new Error(`Kokoro stopped (exit ${exit}). ${stderr.trim()}`.trim());
    this.failStartup(error);
    this.queue.detach(error);
    this.ready = this.resetReady();
    if (!signal.aborted) throw error;
  }

  async synthesize(request: SynthesisRequest): Promise<SpeechAudio> {
    await withTimeout(this.ready, readyTimeoutMs, "Kokoro is still starting");
    return this.queue.enqueue(request);
  }

  private resetReady(): Promise<void> {
    const ready = new Promise<void>((resolve, reject) => {
      this.markReady = resolve;
      this.failStartup = reject;
    });
    ready.catch(() => {});
    return ready;
  }

  private receive(message: WorkerMessage): void {
    if (message.type === "ready") {
      this.log("Kokoro is ready");
      this.markReady();
      const child = this.child;
      this.queue.attach((id, job) => child?.send({ type: "synthesize", id, ...job }));
      return;
    }
    this.queue.settle(
      message.id,
      message.type === "audio"
        ? { sampleRate: message.sampleRate, pcm: message.pcm }
        : new Error(message.message),
    );
  }

  /** Reinstalls dependencies only when the shipped lockfile changes. */
  private async provision(): Promise<string> {
    const runtimeDir = join(this.dataDir, "runtime");
    const lock = await readFile(join(this.shippedRuntimeDir, runtimeLock));
    const digest = createHash("sha256").update(lock).digest("hex");
    const stamp = join(runtimeDir, ".lock-sha256");
    const installed = await readFile(stamp, "utf8").catch(() => null);
    if (installed !== digest) {
      this.log("Installing the Kokoro runtime");
      const staging = `${runtimeDir}.staging`;
      await rm(staging, { recursive: true, force: true });
      await mkdir(staging, { recursive: true });
      for (const file of runtimeFiles) {
        await cp(join(this.shippedRuntimeDir, file), join(staging, file), { recursive: true });
      }
      await writeFile(join(staging, "package-lock.json"), lock);
      await execFileAsync(
        "npm",
        ["ci", "--omit=dev", "--omit=optional", "--ignore-scripts", "--no-audit", "--no-fund"],
        { cwd: staging, timeout: installTimeoutMs, maxBuffer: 16 * 1024 * 1024 },
      );
      await writeFile(join(staging, ".lock-sha256"), digest);
      await rm(runtimeDir, { recursive: true, force: true });
      await rename(staging, runtimeDir);
    }
    // The worker is plugin code, so it always tracks the installed version.
    await cp(
      join(this.shippedRuntimeDir, "synth-worker.mjs"),
      join(runtimeDir, "synth-worker.mjs"),
    );
    return runtimeDir;
  }
}

function withTimeout<T>(promise: Promise<T>, ms: number, message: string): Promise<T> {
  let timer: ReturnType<typeof setTimeout>;
  return Promise.race([
    promise,
    new Promise<never>((_, reject) => {
      timer = setTimeout(() => reject(new Error(message)), ms);
    }),
  ]).finally(() => clearTimeout(timer));
}

/** Wraps 16-bit mono PCM in a WAV container any browser can play. */
export function toWav({ sampleRate, pcm }: SpeechAudio): Uint8Array<ArrayBuffer> {
  const wav = new Uint8Array(44 + pcm.byteLength);
  const view = new DataView(wav.buffer);
  const ascii = (offset: number, text: string) => {
    for (let index = 0; index < text.length; index += 1) {
      view.setUint8(offset + index, text.charCodeAt(index));
    }
  };
  ascii(0, "RIFF");
  view.setUint32(4, 36 + pcm.byteLength, true);
  ascii(8, "WAVE");
  ascii(12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  ascii(36, "data");
  view.setUint32(40, pcm.byteLength, true);
  wav.set(pcm, 44);
  return wav;
}
