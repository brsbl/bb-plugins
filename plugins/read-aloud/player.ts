export type FetchSpeech = (
  text: string,
  speed: number,
  signal: AbortSignal,
  first: boolean,
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
  paused: boolean;
  /** Releases playback held by a pause between chunks. */
  resumeWaiter: (() => void) | null;
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
 * Plays server-synthesized chunks one reading at a time, fetching a couple of
 * chunks ahead. Two audio elements alternate so the next chunk is already
 * loaded when the current one ends.
 */
export class ReadAloudPlayer {
  private readonly elements = [new Audio(), new Audio()] as const;
  /** The element playing, or last played, for pause and resume. */
  private element: HTMLAudioElement = this.elements[0];
  private session: Session | null = null;

  constructor(private readonly fetchSpeech: FetchSpeech) {
    for (const element of this.elements) element.preload = "auto";
  }

  isReading(key: string): boolean {
    return this.session?.key === key;
  }

  /** Call from the click so iOS and other mobile browsers allow playback. */
  unlock(): void {
    const audioSession = (navigator as { audioSession?: { type: string } }).audioSession;
    if (audioSession) audioSession.type = "playback";
    if (this.session) return;
    for (const element of this.elements) {
      element.src = silentWav;
      void element.play().catch(() => {});
    }
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
      paused: false,
      resumeWaiter: null,
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

  /** Pauses the current chunk, or holds the next one until resumed. */
  pause(): void {
    const session = this.session;
    if (!session || session.paused) return;
    session.paused = true;
    if (session.playing) this.element.pause();
  }

  /** Call from the click so mobile browsers allow playback to continue. */
  resume(): void {
    const session = this.session;
    if (!session?.paused) return;
    session.paused = false;
    if (session.playing) void this.element.play().catch(() => {});
    session.resumeWaiter?.();
    session.resumeWaiter = null;
  }

  stop(): void {
    const session = this.session;
    if (!session) return;
    this.session = null;
    for (const pending of session.pending.values()) this.discard(pending);
    session.pending.clear();
    for (const element of this.elements) element.pause();
    session.resumeWaiter?.();
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
      const url = this.fetchSpeech(
        session.chunks[index]!,
        session.speed,
        controller.signal,
        index === 0,
      )
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
        if (session.paused) {
          await new Promise<void>((resolve) => (session.resumeWaiter = resolve));
          if (this.session !== session) {
            URL.revokeObjectURL(url);
            return;
          }
        }
        session.playing = true;
        const element = this.elements[session.index % 2]!;
        if (element.src !== url) element.src = url;
        this.element = element;
        const ended = this.waitForEnd(session, element);
        await element.play();
        if (!session.started) {
          session.started = true;
          session.callbacks.onPlaying();
        }
        void this.preloadNext(session);
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

  /** Loads the next chunk into the idle element while this one plays. */
  private async preloadNext(session: Session): Promise<void> {
    const index = session.index + 1;
    const pending = session.pending.get(index);
    if (!pending) return;
    const url = await pending.url.catch(() => null);
    if (
      url === null ||
      this.session !== session ||
      session.index !== index - 1 ||
      session.pending.get(index) !== pending
    ) {
      return;
    }
    const element = this.elements[index % 2]!;
    element.src = url;
    element.load();
  }

  private waitForEnd(session: Session, element: HTMLAudioElement): Promise<void> {
    return new Promise((resolve, reject) => {
      const cleanup = () => {
        element.onended = null;
        element.onerror = null;
        session.interrupt = null;
      };
      session.interrupt = () => {
        cleanup();
        resolve();
      };
      element.onended = session.interrupt;
      element.onerror = () => {
        cleanup();
        reject(new Error("The browser couldn’t play this audio"));
      };
    });
  }
}
