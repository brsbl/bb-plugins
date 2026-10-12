import type { RingSetting, Rings, RingsSnapshot } from "./rings.js";

export interface RingStore {
  subscribe(listener: () => void): () => void;
  getSnapshot(): Rings;
  setServerRings(next: RingsSnapshot): void;
  load(fetch: () => Promise<RingsSnapshot>): Promise<void>;
  setSender(
    send: (key: string, ring: RingSetting | null) => Promise<RingsSnapshot>,
  ): void;
  queue(key: string, ring: RingSetting | null): void;
}

export function createRingStore(delayMs: number): RingStore {
  let server: RingsSnapshot = { revision: -1, rings: {} };
  let visible: Rings = {};
  const overrides = new Map<string, RingSetting | null>();
  const queued = new Map<string, RingSetting | null>();
  const listeners = new Set<() => void>();
  let timer: ReturnType<typeof setTimeout> | null = null;
  let flushing = false;
  let send:
    ((key: string, ring: RingSetting | null) => Promise<RingsSnapshot>) | null =
    null;

  const publish = () => {
    const next: Rings = { ...server.rings };
    for (const [key, setting] of overrides) {
      if (setting === null) delete next[key];
      else next[key] = setting;
    }
    visible = next;
    for (const listener of listeners) listener();
  };

  const accept = (next: RingsSnapshot) => {
    if (next.revision <= server.revision) return;
    server = next;
    publish();
  };

  const flush = async () => {
    if (flushing || send === null) return;
    flushing = true;
    try {
      while (timer === null) {
        const entry = queued.entries().next();
        if (entry.done) break;
        const [key, setting] = entry.value;
        queued.delete(key);
        try {
          accept(await send(key, setting));
        } catch {}
        if (!queued.has(key) && overrides.get(key) === setting)
          overrides.delete(key);
        publish();
      }
    } finally {
      flushing = false;
    }
  };

  return {
    subscribe(listener) {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    getSnapshot: () => visible,
    setServerRings: accept,
    async load(fetch) {
      accept(await fetch());
    },
    setSender(next) {
      send = next;
    },
    queue(key, ring) {
      overrides.set(key, ring);
      queued.set(key, ring);
      publish();
      if (timer !== null) clearTimeout(timer);
      timer = setTimeout(() => {
        timer = null;
        void flush();
      }, delayMs);
    },
  };
}
