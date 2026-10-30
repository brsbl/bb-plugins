import { randomBytes } from "node:crypto";
import { mkdir, readFile, rename, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { snapshotSchema, type Snapshot } from "./model.js";

export const SNAPSHOT_FILE = "snapshot.json";

export interface SnapshotStore {
  /** The saved snapshot, or null when none has been saved. Throws when the file is unreadable. */
  read(): Promise<Snapshot | null>;
  /** Replaces the saved snapshot in one rename, so readers see the old or the new file, never a mix. */
  write(snapshot: Snapshot): Promise<void>;
}

export function createSnapshotStore(directory: () => string): SnapshotStore {
  return {
    async read() {
      let text: string;
      try {
        text = await readFile(join(directory(), SNAPSHOT_FILE), "utf8");
      } catch (error) {
        if ((error as NodeJS.ErrnoException).code === "ENOENT") return null;
        throw error;
      }
      const parsed = snapshotSchema.safeParse(JSON.parse(text));
      if (!parsed.success) throw new Error("The saved table is unreadable: " + parsed.error.issues[0]?.message);
      return parsed.data;
    },
    async write(snapshot) {
      const valid = snapshotSchema.parse(snapshot);
      const dir = directory();
      await mkdir(dir, { recursive: true });
      const temporary = join(dir, `${SNAPSHOT_FILE}.${process.pid}.${randomBytes(6).toString("hex")}.tmp`);
      try {
        await writeFile(temporary, JSON.stringify(valid), { encoding: "utf8", mode: 0o600 });
        await rename(temporary, join(dir, SNAPSHOT_FILE));
      } catch (error) {
        await rm(temporary, { force: true });
        throw error;
      }
    },
  };
}
