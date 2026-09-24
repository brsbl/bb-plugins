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
  /** The opening chunk of a reading; it goes to the front of the queue. */
  first?: boolean;
  /**
   * Speculative work (preparing a reply before anyone asks). It runs only
   * while nothing else does, and a new reading may take over from it.
   */
  background?: boolean;
  /** Called when the job reaches the voice process. */
  onStart?(): void;
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
const readyTimeoutMs = 90_000;
/** Upper bound for one chunk, including time spent queued. */
const requestTimeoutMs = 60_000;
const installTimeoutMs = 15 * 60_000;
// The lockfile ships under another name so the monorepo keeps one root
// lockfile; provisioning restores it as package-lock.json for `npm ci`.
const runtimeLock = "runtime-lock.json";
const runtimeFiles = ["package.json", "sharp-stub"];

export class SynthesisBusyError extends Error {}
/** Temporary: the voice process is starting, restarting, or overloaded. */
export class SynthesisUnavailableError extends Error {}

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

  get idle(): boolean {
    return this.waiting.length === 0 && this.running.size === 0;
  }

  /** True while the process only computes audio nobody is waiting for. */
  get onlyAbandonedWork(): boolean {
    if (this.running.size === 0) return false;
    for (const job of this.running.values()) {
      if (!job.signal?.aborted && !job.background) return false;
    }
    return true;
  }

  attach(send: (id: number, job: SynthesisJob) => void): void {
    this.send = send;
    this.pump();
  }

  /** Rejects running work; with `includeWaiting`, queued work too. */
  detach(error: Error, { includeWaiting = false } = {}): void {
    this.send = null;
    for (const job of this.running.values()) job.reject(error);
    this.running.clear();
    if (includeWaiting) {
      for (const job of this.waiting.splice(0)) job.reject(error);
    }
  }

  enqueue(request: SynthesisRequest): Promise<SpeechAudio> {
    if (request.signal?.aborted) return Promise.reject(new Error("Cancelled"));
    if (this.waiting.length >= this.capacity) {
      return Promise.reject(new SynthesisBusyError("The voice server is busy"));
    }
    return new Promise((resolve, reject) => {
      const job: Job = { ...request, resolve, reject };
      if (request.first) this.waiting.unshift(job);
      else if (request.background) this.waiting.push(job);
      else {
        const firstBackground = this.waiting.findIndex((queued) => queued.background);
        if (firstBackground === -1) this.waiting.push(job);
        else this.waiting.splice(firstBackground, 0, job);
      }
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
      // Background work never shares the process with anything else.
      if (this.waiting[0]!.background && this.running.size > 0) break;
      const job = this.waiting.shift()!;
      if (job.signal?.aborted) {
        job.reject(new Error("Cancelled"));
        continue;
      }
      job.onStart?.();
      const id = this.nextId++;
      this.running.set(id, job);
      this.send(id, { text: job.text, voice: job.voice, speed: job.speed });
    }
  }
}

/** One forked Kokoro process; `ready` resolves once its model is loaded. */
class KokoroProcess {
  readonly ready: Promise<void>;
  readonly exited: Promise<Error>;
  isReady = false;
  retired = false;
  private readonly child: ChildProcess;

  constructor(runtimeDir: string, modelDir: string, onMessage: (message: WorkerMessage) => void) {
    this.child = fork(join(runtimeDir, "synth-worker.mjs"), [], {
      cwd: runtimeDir,
      env: { ...process.env, READ_ALOUD_MODEL_CACHE: modelDir },
      // Parent loader flags (such as a TypeScript loader) do not apply here.
      execArgv: [],
      serialization: "advanced",
      stdio: ["ignore", "ignore", "pipe", "ipc"],
    });
    if (this.child.pid) setPriority(this.child.pid, 10);
    let stderr = "";
    this.child.stderr?.on("data", (data: Buffer) => {
      stderr = (stderr + data.toString()).slice(-2000);
    });
    this.exited = new Promise((resolve) =>
      this.child.on("exit", (code) =>
        resolve(new Error(`Kokoro stopped (exit ${code}). ${stderr.trim()}`.trim())),
      ),
    );
    this.ready = new Promise((resolve, reject) => {
      this.child.on("message", (message: WorkerMessage) => {
        if (message.type !== "ready") return onMessage(message);
        this.isReady = true;
        resolve();
      });
      void this.exited.then(reject);
    });
    this.ready.catch(() => {});
  }

  send(id: number, job: SynthesisJob): void {
    this.child.send({ type: "synthesize", id, ...job });
  }

  retire(): void {
    this.retired = true;
    this.child.kill();
  }
}

/**
 * Installs the pinned Kokoro runtime into the plugin's data directory (once
 * per lockfile) and keeps a low-priority synthesis process warm, plus a
 * standby. An in-flight ONNX run cannot be interrupted, so when a new reading
 * starts while the active process only works on abandoned audio, the standby
 * takes over and the busy process is killed.
 */
export class KokoroSynthesizer implements Synthesizer {
  private active: KokoroProcess | null = null;
  private standby: KokoroProcess | null = null;
  private runtimeDir = "";
  private fail: ((error: Error) => void) | null = null;
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

  /** Runs until `signal` aborts; rejects if a process exits unexpectedly. */
  async run(signal: AbortSignal): Promise<void> {
    try {
      this.runtimeDir = await this.provision();
      if (signal.aborted) return;
      await new Promise<void>((resolve, reject) => {
        this.fail = reject;
        signal.addEventListener("abort", () => resolve(), { once: true });
        const active = this.spawn();
        this.active = active;
        void active.ready.then(() => {
          this.log("Kokoro is ready");
          this.queue.attach((id, job) => active.send(id, job));
          this.markReady();
          this.ensureStandby();
        }, reject);
      });
    } catch (error) {
      if (!signal.aborted) throw error;
    } finally {
      const error = new SynthesisUnavailableError("The voice server is restarting");
      for (const worker of [this.active, this.standby]) worker?.retire();
      this.active = null;
      this.standby = null;
      this.fail = null;
      this.failStartup(error);
      // Nothing will serve queued requests once this run ends, so release
      // them instead of leaving their HTTP handlers open.
      this.queue.detach(error, { includeWaiting: true });
      this.ready = this.resetReady();
    }
  }

  async synthesize(request: SynthesisRequest): Promise<SpeechAudio> {
    await withTimeout(
      this.ready,
      readyTimeoutMs,
      () => new SynthesisUnavailableError("The voice server is still starting"),
    );
    // Live requests never wait on audio nobody is listening to: abandoned
    // chunks or speculative preparation.
    if (!request.background && this.queue.onlyAbandonedWork && this.standby?.isReady) {
      this.promoteStandby();
    }
    const timeout = AbortSignal.timeout(requestTimeoutMs);
    const signal = request.signal ? AbortSignal.any([request.signal, timeout]) : timeout;
    return withTimeout(
      this.queue.enqueue({ ...request, signal }),
      requestTimeoutMs,
      () => new SynthesisUnavailableError("The voice server took too long"),
    );
  }

  private spawn(): KokoroProcess {
    const worker = new KokoroProcess(
      this.runtimeDir,
      join(this.dataDir, "models"),
      (message) => this.receive(worker, message),
    );
    void worker.exited.then((error) => {
      if (!worker.retired) this.fail?.(error);
    });
    return worker;
  }

  /** Loads a spare process only while idle so it never slows live speech. */
  private ensureStandby(): void {
    if (this.standby || !this.active || !this.queue.idle || !this.fail) return;
    this.standby = this.spawn();
  }

  private promoteStandby(): void {
    const abandoned = this.active!;
    const active = this.standby!;
    this.active = active;
    this.standby = null;
    this.queue.detach(new Error("Cancelled"));
    this.queue.attach((id, job) => active.send(id, job));
    abandoned.retire();
    this.log("Cancelled abandoned speech by switching to the standby process");
  }

  private resetReady(): Promise<void> {
    const ready = new Promise<void>((resolve, reject) => {
      this.markReady = resolve;
      this.failStartup = reject;
    });
    ready.catch(() => {});
    return ready;
  }

  private receive(worker: KokoroProcess, message: WorkerMessage): void {
    if (worker !== this.active || message.type === "ready") return;
    this.queue.settle(
      message.id,
      message.type === "audio"
        ? { sampleRate: message.sampleRate, pcm: message.pcm }
        : new Error(message.message),
    );
    this.ensureStandby();
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

function withTimeout<T>(promise: Promise<T>, ms: number, error: () => Error): Promise<T> {
  let timer: ReturnType<typeof setTimeout>;
  return Promise.race([
    promise,
    new Promise<never>((_, reject) => {
      timer = setTimeout(() => reject(error()), ms);
    }),
  ]).finally(() => clearTimeout(timer));
}

/** Samples quieter than this (about -40 dBFS) count as silence. */
const silenceThreshold = Math.round(0.01 * 0x7fff);

/**
 * Kokoro pads every clip with about 0.3 s of silence before and 0.45 s after
 * at 1×, which doubles up between consecutive chunks. Trim both ends to a
 * natural pause: short after a clause, longer after a sentence.
 */
export function trimSilence(audio: SpeechAudio, text: string, speed: number): SpeechAudio {
  const view = new DataView(audio.pcm.buffer, audio.pcm.byteOffset, audio.pcm.byteLength);
  const count = Math.floor(audio.pcm.byteLength / 2);
  const loud = (index: number) => Math.abs(view.getInt16(index * 2, true)) >= silenceThreshold;
  let start = 0;
  while (start < count && !loud(start)) start += 1;
  let end = count;
  while (end > start && !loud(end - 1)) end -= 1;
  if (start >= end) return audio;
  const sentenceEnd = /[.!?…]["')\]]?$/.test(text.trim());
  const leadSamples = Math.round(audio.sampleRate * 0.04);
  const tailSamples = Math.round((audio.sampleRate * (sentenceEnd ? 0.22 : 0.09)) / speed);
  const from = Math.max(0, start - leadSamples);
  const to = Math.min(count, end + tailSamples);
  return {
    sampleRate: audio.sampleRate,
    pcm: new Uint8Array(audio.pcm.buffer, audio.pcm.byteOffset + from * 2, (to - from) * 2),
  };
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
