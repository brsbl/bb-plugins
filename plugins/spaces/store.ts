// The Space registry: which sections are Spaces. Spaces is the single owner of the marker; membership itself is
// the native section, so nothing about threads is stored here.

import type { BbPluginApi } from "@get-bb/plugin-sdk";

const REGISTRY_KEY = "registry";

export interface SpaceRecord {
  /** Epoch ms when the section became a Space. */
  createdAt: number;
  /** True while the Space is out of More because Spaces brought it out, so only then does Spaces put it back. */
  autoShown: boolean;
}

function parseRecord(value: unknown): SpaceRecord | null {
  if (typeof value !== "object" || value === null || Array.isArray(value)) return null;
  const { createdAt, autoShown } = value as Record<string, unknown>;
  return { createdAt: typeof createdAt === "number" ? createdAt : Date.now(), autoShown: autoShown === true };
}

export function createStore(bb: BbPluginApi) {
  const records = new Map<string, SpaceRecord>();
  let writes: Promise<void> = Promise.resolve();

  /** Writes the whole registry; writes run one at a time so a slow one can't land after a newer one. */
  function persist(): Promise<void> {
    const snapshot = Object.fromEntries(records);
    const write = writes.then(() => bb.storage.kv.set(REGISTRY_KEY, snapshot));
    writes = write.catch(() => undefined);
    return write;
  }

  return {
    async load(): Promise<void> {
      const stored = await bb.storage.kv.get<unknown>(REGISTRY_KEY);
      records.clear();
      if (typeof stored !== "object" || stored === null || Array.isArray(stored)) return;
      for (const [sectionId, value] of Object.entries(stored)) {
        const record = parseRecord(value);
        if (record) records.set(sectionId, record);
      }
    },
    has(sectionId: string): boolean {
      return records.has(sectionId);
    },
    get(sectionId: string): SpaceRecord | undefined {
      return records.get(sectionId);
    },
    ids(): string[] {
      return [...records.keys()];
    },
    size(): number {
      return records.size;
    },
    /** Records the marker in memory at once, so readers see it before the write lands. */
    set(sectionId: string, record: SpaceRecord): Promise<void> {
      records.set(sectionId, record);
      return persist();
    },
    update(sectionId: string, patch: Partial<SpaceRecord>): Promise<void> {
      const current = records.get(sectionId);
      if (!current) return Promise.resolve();
      records.set(sectionId, { ...current, ...patch });
      return persist();
    },
    remove(sectionIds: readonly string[]): Promise<void> {
      let changed = false;
      for (const sectionId of sectionIds) changed = records.delete(sectionId) || changed;
      return changed ? persist() : Promise.resolve();
    },
  };
}

export type SpacesStore = ReturnType<typeof createStore>;
