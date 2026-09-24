export type FetchSpeech = (
  text: string,
  speed: number,
  signal: AbortSignal,
) => Promise<Blob>;

export interface PlaybackCallbacks {
  onPlaying(): void;
  onFinished(): void;
  onError(message: string): void;
}

interface Pending {
  controller: AbortController;
  url: Promise<string>;
}

interface Session {
  key: string;
  chunks: string[];
  speed: number;
  /** Chunk being played, or awaited before playing. */
  index: number;
  playing: boolean;
  started: boolean;
  pending: Map<number, Pending>;
  callbacks: PlaybackCallbacks;
  interrupt: (() => void) | null;
}

/** Chunks requested ahead of the one playing. */
const prefetch = 2;
// 10 ms of silence, played from the click so mobile browsers allow later audio.
const silentWav =
  "data:audio/wav;base64,UklGRsQAAABXQVZFZm10IBAAAAABAAEAQB8AAIA+AAACABAAZGF0YaAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA";

/**
 * Plays server-synthesized chunks through one audio element, one reading at a
 * time, fetching a couple of chunks ahead so speech stays continuous.
 */
export class ReadAloudPlayer {
  private readonly element = new Audio();
  private session: Session | null = null;

  constructor(private readonly fetchSpeech: FetchSpeech) {
    this.element.preload = "auto";
  }

  isReading(key: string): boolean {
    return this.session?.key === key;
  }

  /** Call from the click so iOS and other mobile browsers allow playback. */
  unlock(): void {
    const audioSession = (navigator as { audioSession?: { type: string } }).audioSession;
    if (audioSession) audioSession.type = "playback";
    if (this.session) return;
    this.element.src = silentWav;
    void this.element.play().catch(() => {});
  }

  speak(key: string, chunks: string[], speed: number, callbacks: PlaybackCallbacks): void {
    this.stop();
    const session: Session = {
      key,
      chunks,
      speed,
      index: 0,
      playing: false,
      started: false,
      pending: new Map(),
      callbacks,
      interrupt: null,
    };
    this.session = session;
    this.fill(session);
    void this.play(session);
  }

  /**
   * Applies after the next chunk: the chunk playing and the one right behind
   * it keep their audio so playback never gaps, and later chunks are
   * re-requested at the new speed.
   */
  setSpeed(speed: number): void {
    const session = this.session;
    if (!session || session.speed === speed) return;
    session.speed = speed;
    for (const [index, pending] of session.pending) {
      if (index <= session.index + 1) continue;
      this.discard(pending);
      session.pending.delete(index);
    }
    this.fill(session);
  }

  stop(): void {
    const session = this.session;
    if (!session) return;
    this.session = null;
    for (const pending of session.pending.values()) this.discard(pending);
    session.pending.clear();
    this.element.pause();
    session.interrupt?.();
  }

  private discard(pending: Pending): void {
    pending.controller.abort();
    pending.url.then(URL.revokeObjectURL, () => {});
  }

  private fill(session: Session): void {
    const end = Math.min(session.chunks.length, session.index + prefetch + 1);
    for (let index = session.index; index < end; index += 1) {
      if (session.pending.has(index)) continue;
      const controller = new AbortController();
      const url = this.fetchSpeech(session.chunks[index]!, session.speed, controller.signal)
        .then((blob) => URL.createObjectURL(blob));
      url.catch(() => {});
      session.pending.set(index, { controller, url });
    }
  }

  private async play(session: Session): Promise<void> {
    try {
      while (this.session === session && session.index < session.chunks.length) {
        const url = await this.awaitCurrent(session);
        if (url === null) return;
        session.playing = true;
        this.element.src = url;
        const ended = this.waitForEnd(session);
        await this.element.play();
        if (!session.started) {
          session.started = true;
          session.callbacks.onPlaying();
        }
        await ended;
        URL.revokeObjectURL(url);
        if (this.session !== session) return;
        session.playing = false;
        session.pending.delete(session.index);
        session.index += 1;
        this.fill(session);
      }
      if (this.session === session) {
        this.session = null;
        session.callbacks.onFinished();
      }
    } catch (error) {
      if (this.session !== session) return;
      this.stop();
      session.callbacks.onError(
        error instanceof Error && error.name === "NotAllowedError"
          ? "Your browser blocked audio. Tap Read aloud again."
          : error instanceof Error
            ? error.message
            : "Playback failed",
      );
    }
  }

  /** Resolves the current chunk's audio, following re-requests after a speed change. */
  private async awaitCurrent(session: Session): Promise<string | null> {
    for (;;) {
      const pending = session.pending.get(session.index);
      if (!pending || this.session !== session) return null;
      try {
        const url = await pending.url;
        if (session.pending.get(session.index) === pending && this.session === session) {
          return url;
        }
      } catch (error) {
        if (this.session !== session) return null;
        if (session.pending.get(session.index) === pending) throw error;
      }
    }
  }

  private waitForEnd(session: Session): Promise<void> {
    return new Promise((resolve, reject) => {
      const cleanup = () => {
        this.element.onended = null;
        this.element.onerror = null;
        session.interrupt = null;
      };
      session.interrupt = () => {
        cleanup();
        resolve();
      };
      this.element.onended = session.interrupt;
      this.element.onerror = () => {
        cleanup();
        reject(new Error("The browser couldn’t play this audio"));
      };
    });
  }
}
