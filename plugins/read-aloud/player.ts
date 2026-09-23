import {
  kokoroWorkerSource,
  type EngineDevice,
  type WorkerRequest,
  type WorkerResponse,
} from "./kokoro-worker";

export interface SpeakOptions {
  text: string;
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
}

/** One reading at a time: starting another message stops the current one. */
export class ReadAloudPlayer {
  private worker: Worker | null = null;
  private context: AudioContext | null = null;
  private session: Session | null = null;
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
    const context = this.context!;
    const session: Session = {
      id: this.nextId++,
      key,
      callbacks,
      sources: new Set(),
      nextStart: context.currentTime,
      started: false,
      generated: false,
    };
    this.session = session;
    this.post({ type: "speak", id: session.id, ...options });
  }

  stop(): void {
    const session = this.session;
    if (!session) return;
    this.session = null;
    this.post({ type: "cancel", id: session.id });
    for (const source of session.sources) {
      source.onended = null;
      source.stop();
    }
    session.sources.clear();
  }

  dispose(): void {
    this.stop();
    this.worker?.terminate();
    this.worker = null;
    void this.context?.close();
    this.context = null;
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
        return;
      case "done":
        session.generated = true;
        this.finishIfDrained(session);
        return;
      case "error":
        this.stop();
        session.callbacks.onError(response.message);
    }
  }

  private schedule(session: Session, samples: Float32Array, sampleRate: number): void {
    const context = this.context;
    if (!context || samples.length === 0) return;
    const buffer = context.createBuffer(1, samples.length, sampleRate);
    buffer.copyToChannel(new Float32Array(samples), 0);
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
    session.callbacks.onFinished();
  }
}
