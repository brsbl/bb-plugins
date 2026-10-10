import type { RingSetting, Rings } from "./rings.js";

export interface RingStore {
  subscribe(listener: () => void): () => void;
  getSnapshot(): Rings;
  setServerRings(next: Rings): void;
  setSender(
    send: (key: string, ring: RingSetting | null) => Promise<Rings>,
  ): void;
  queue(key: string, ring: RingSetting | null): void;
}

export function createRingStore(delayMs: number): RingStore {
  let serverRings: Rings = {};
  let visible: Rings = {};
  const overrides = new Map<string, RingSetting | null>();
  const queued = new Map<string, RingSetting | null>();
  const listeners = new Set<() => void>();
  let timer: ReturnType<typeof setTimeout> | null = null;
  let flushing = false;
  let send: ((key: string, ring: RingSetting | null) => Promise<Rings>) | null =
    null;

  const publish = () => {
    const next: Rings = { ...serverRings };
    for (const [key, setting] of overrides) {
      if (setting === null) delete next[key];
      else next[key] = setting;
    }
    visible = next;
    for (const listener of listeners) listener();
  };

  const flush = async () => {
    if (flushing || send === null) return;
    flushing = true;
    try {
      for (;;) {
        const entry = queued.entries().next();
        if (entry.done) break;
        const [key, setting] = entry.value;
        queued.delete(key);
        try {
          serverRings = await send(key, setting);
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
    setServerRings(next) {
      serverRings = next;
      publish();
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
