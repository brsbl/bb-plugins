import {
  kokoroWorkerSource,
  type EngineDevice,
  type WorkerRequest,
  type WorkerResponse,
} from "./kokoro-worker";

export interface SpeakOptions {
  chunks: string[];
  voice: string;
  speed: number;
  device: EngineDevice;
}

export interface PlaybackCallbacks {
  onLoading(device: EngineDevice): void;
  onPlaying(): void;
  onFinished(): void;
  onError(message: string): void;
}

interface Session {
  id: number;
  key: string;
  callbacks: PlaybackCallbacks;
  sources: Set<AudioBufferSourceNode>;
  nextStart: number;
  started: boolean;
  generated: boolean;
  pullTimer: ReturnType<typeof setTimeout> | null;
}

/** Seconds of audio to keep scheduled ahead before asking for more. */
const bufferAheadSeconds = 15;
/** Idle time after which the worker and its model are released. */
const idleReleaseMs = 3 * 60_000;

/** One reading at a time: starting another message stops the current one. */
export class ReadAloudPlayer {
  private worker: Worker | null = null;
  private context: AudioContext | null = null;
  private session: Session | null = null;
  private idleTimer: ReturnType<typeof setTimeout> | null = null;
  private nextId = 1;

  isReading(key: string): boolean {
    return this.session?.key === key;
  }

  /**
   * Must be called from the click that requested playback so browsers allow
   * the audio context to start.
   */
  unlockAudio(): void {
    this.context ??= new AudioContext();
    void this.context.resume();
  }

  speak(key: string, options: SpeakOptions, callbacks: PlaybackCallbacks): void {
    this.stop();
    this.unlockAudio();
    this.clearIdleTimer();
    const context = this.context!;
    const session: Session = {
      id: this.nextId++,
      key,
      callbacks,
      sources: new Set(),
      nextStart: context.currentTime,
      started: false,
      generated: false,
      pullTimer: null,
    };
    this.session = session;
    this.post({ type: "speak", id: session.id, ...options });
  }

  stop(): void {
    const session = this.session;
    if (!session) return;
    this.session = null;
    if (session.pullTimer) clearTimeout(session.pullTimer);
    this.worker?.postMessage({ type: "cancel", id: session.id } satisfies WorkerRequest);
    for (const source of session.sources) {
      source.onended = null;
      source.stop();
    }
    session.sources.clear();
    this.becomeIdle();
  }

  dispose(): void {
    this.stop();
    this.clearIdleTimer();
    this.worker?.terminate();
    this.worker = null;
    void this.context?.close();
    this.context = null;
  }

  private becomeIdle(): void {
    if (this.context?.state === "running") void this.context.suspend();
    this.clearIdleTimer();
    this.idleTimer = setTimeout(() => {
      this.idleTimer = null;
      if (this.session) return;
      this.worker?.terminate();
      this.worker = null;
    }, idleReleaseMs);
  }

  private clearIdleTimer(): void {
    if (this.idleTimer) clearTimeout(this.idleTimer);
    this.idleTimer = null;
  }

  private post(request: WorkerRequest): void {
    this.ensureWorker().postMessage(request);
  }

  private ensureWorker(): Worker {
    if (this.worker) return this.worker;
    const url = URL.createObjectURL(
      new Blob([kokoroWorkerSource], { type: "text/javascript" }),
    );
    const worker = new Worker(url, { type: "module", name: "read-aloud-kokoro" });
    URL.revokeObjectURL(url);
    worker.onmessage = (event: MessageEvent<WorkerResponse>) =>
      this.receive(event.data);
    worker.onerror = (event) => {
      event.preventDefault();
      const session = this.session;
      this.stop();
      this.worker?.terminate();
      this.worker = null;
      session?.callbacks.onError(event.message || "Kokoro failed to start");
    };
    this.worker = worker;
    return worker;
  }

  private receive(response: WorkerResponse): void {
    const session = this.session;
    if (!session || response.id !== session.id) return;
    switch (response.type) {
      case "loading":
        session.callbacks.onLoading(response.device);
        return;
      case "chunk":
        this.schedule(session, response.audio, response.sampleRate);
        this.requestMore(session);
        return;
      case "done":
        session.generated = true;
        this.finishIfDrained(session);
        return;
      case "error": {
        const { callbacks } = session;
        this.stop();
        callbacks.onError(response.message);
      }
    }
  }

  /** Lets the worker synthesize the next chunk once the buffer runs low. */
  private requestMore(session: Session): void {
    const context = this.context;
    if (!context || this.session !== session) return;
    const ahead = session.nextStart - context.currentTime;
    const wait = Math.max(0, ahead - bufferAheadSeconds) * 1000;
    session.pullTimer = setTimeout(() => {
      session.pullTimer = null;
      if (this.session === session) this.post({ type: "pull", id: session.id });
    }, wait);
  }

  private schedule(session: Session, samples: Float32Array, sampleRate: number): void {
    const context = this.context;
    if (!context || samples.length === 0) return;
    const buffer = context.createBuffer(1, samples.length, sampleRate);
    buffer.getChannelData(0).set(samples);
    const source = context.createBufferSource();
    source.buffer = buffer;
    source.connect(context.destination);
    const start = Math.max(context.currentTime + 0.05, session.nextStart);
    source.start(start);
    session.nextStart = start + buffer.duration;
    session.sources.add(source);
    source.onended = () => {
      session.sources.delete(source);
      this.finishIfDrained(session);
    };
    if (!session.started) {
      session.started = true;
      session.callbacks.onPlaying();
    }
  }

  private finishIfDrained(session: Session): void {
    if (this.session !== session || !session.generated || session.sources.size > 0) {
      return;
    }
    this.session = null;
    this.becomeIdle();
    session.callbacks.onFinished();
  }
}
