// One editor save, as moss-multi's `MossNoteWrite` specifies it (steps 2-6;
// the caller holds the note's lock and has done step 1). Every byte sequence
// this displaces is checked against what was read, put back, or kept as a
// `.displaced` file and reported, so a save never destroys bytes Moss wrote.
import { link, readdir, readFile, rename, stat, unlink } from "node:fs/promises";
import { basename, dirname, join, relative } from "node:path";
import {
  codedError,
  entryAt,
  errorCode,
  isSafeName,
  locationOf,
  messageOf,
  noteVersions,
  readOptional,
  stateVersions,
  syncPath,
  writeNew,
  type NoteState,
  type PathExchange,
} from "./editor-files.js";
import type * as Moss from "./vendor/moss-editor-contract.js";

export interface WriteContext {
  helpers: Moss.MossEditorHostModule;
  paths: PathExchange;
  uuid(): string;
  readState(directory: string): Promise<NoteState>;
  /** A companion file's bytes as `readCompanion` reads them, or null when absent. */
  companionBytes(directory: string, relativePath: string): Promise<Buffer | null>;
}

type Applied =
  /** The target was exchanged with this write's bytes; `holding` has what it displaced. */
  | { how: "exchanged"; file: Moss.MossNoteFile; target: string; holding: string; wrote: Buffer }
  /** The target did not exist and now holds this write's bytes. */
  | { how: "created"; file: Moss.MossNoteFile; target: string; wrote: Buffer }
  /** The target was moved to `holding`. */
  | { how: "deleted"; file: Moss.MossNoteFile; target: string; holding: string };

/** Another writer changed a file while this write was applying. */
class Raced extends Error {}

/** Moss's folder-name limit; `allocateFolderName` keeps its ` (n)` suffix within it. */
const MAX_FOLDER_NAME_BYTES = 252;

const sameIgnoringCase = (left: string, right: string) =>
  left.normalize("NFC").toLowerCase() === right.normalize("NFC").toLowerCase();

const flipCase = (text: string) =>
  [...text].map((char) => (char === char.toUpperCase() ? char.toLowerCase() : char.toUpperCase())).join("");

export async function applyWrite(context: WriteContext, state: NoteState, write: Moss.MossNoteWrite): Promise<Moss.MossWriteResult> {
  const before = stateVersions(context.helpers, state);
  const refuse = (reason: "content" | "companion" | "meta"): Moss.MossWriteResult => ({
    kind: "conflict",
    reason,
    ...before,
    applied: [],
    preserved: [],
    location: locationOf(state),
  });
  if (before.version !== write.baseVersion) return refuse("content");
  for (const companion of write.companions) {
    const bytes = await context.companionBytes(state.directory, companion.relativePath);
    if (context.helpers.versionToken([{ role: "companion", bytes }]) !== companion.version) return refuse("companion");
  }
  if (before.metaVersion !== write.baseMetaVersion) return refuse("meta");
  // The editor's string is never trusted as a path: one safe segment, or nothing moves.
  if (write.rename && !isSafeName(write.rename.desiredName, MAX_FOLDER_NAME_BYTES)) {
    return {
      kind: "failed",
      code: "EINVAL",
      message: "The new title does not make a safe folder name.",
      applied: [],
      preserved: [],
      location: locationOf(state),
    };
  }
  return new WriteRun(context, state, write).apply();
}

class WriteRun {
  private directory: string;
  private folderName: string;
  private readonly applied: Applied[] = [];
  private readonly preserved: string[] = [];
  /** What each file should hold once the write lands. */
  private readonly landed: Record<Moss.MossNoteFile, Buffer | null>;

  constructor(
    private readonly context: WriteContext,
    private readonly state: NoteState,
    private readonly write: Moss.MossNoteWrite,
  ) {
    this.directory = state.directory;
    this.folderName = state.folderName;
    this.landed = { markdown: state.markdown?.bytes ?? null, comments: state.comments, layout: state.layout, meta: state.meta };
  }

  async apply(): Promise<Moss.MossWriteResult> {
    try {
      if (this.write.rename && !(await this.renameFolder(this.write.rename.desiredName))) return await this.raced();
      for (const op of this.write.ops) await this.applyOp(op);
      return await this.verify();
    } catch (error) {
      if (error instanceof Raced) return this.raced();
      return this.failed(error);
    }
  }

  private names() {
    return this.context.helpers.MOSS_NOTE_FILES;
  }

  private holdingPath(target: string, suffix: "tmp" | "displaced"): string {
    return join(this.directory, this.context.helpers.sidecarFileName(basename(target), this.context.uuid(), suffix));
  }

  /** Step 3. False when another rename took both names this tried. */
  private async renameFolder(desiredName: string): Promise<boolean> {
    const parent = dirname(this.directory);
    const caseInsensitive = await this.caseInsensitive();
    for (let attempt = 0; attempt < 2; attempt += 1) {
      const siblingNames = (await readdir(parent)).filter((name) => name !== this.folderName);
      const next = this.context.helpers.allocateFolderName({
        desiredName,
        currentName: this.folderName,
        siblingNames,
        caseInsensitive,
      });
      if (next === this.folderName) return true;
      if (!isSafeName(next)) throw codedError("EINVAL", "The new title does not make a safe folder name.");
      const target = join(parent, next);
      try {
        if (caseInsensitive && sameIgnoringCase(next, this.folderName)) await rename(this.directory, target);
        else await this.context.paths.renameExclusive(this.directory, target);
      } catch (error) {
        if (errorCode(error) === "EEXIST" || errorCode(error) === "ENOTEMPTY") continue;
        throw error;
      }
      // The folder rename is never rolled back; every later path is in the new folder.
      this.directory = target;
      this.folderName = next;
      return true;
    }
    return false;
  }

  /** Whether the note's volume compares names case-insensitively, probed on its markdown file. */
  private async caseInsensitive(): Promise<boolean> {
    const name = this.state.markdownName;
    if (name === null || flipCase(name) === name) return false;
    const [entry, flipped] = await Promise.all([
      entryAt(join(this.directory, name)),
      entryAt(join(this.directory, flipCase(name))),
    ]);
    return entry !== null && flipped !== null && entry.dev === flipped.dev && entry.ino === flipped.ino;
  }

  private async applyOp(op: Moss.MossFileOp): Promise<void> {
    if (op.file === "markdown") {
      if (op.kind !== "put") throw codedError("EINVAL", "A write cannot delete the note's markdown.");
      await this.putMarkdown(Buffer.from(op.text, "utf8"));
      return;
    }
    const target = join(this.directory, this.names()[op.file]);
    const expected = this.state[op.file];
    if (op.kind === "put") {
      const bytes = Buffer.from(op.text, "utf8");
      if (expected === null) await this.create(op.file, target, bytes);
      else await this.replace(op.file, target, expected, bytes);
      this.landed[op.file] = bytes;
      return;
    }
    if (expected === null) {
      if ((await entryAt(target)) !== null) throw new Raced();
    } else {
      await this.remove(op.file, target, expected);
    }
    this.landed[op.file] = null;
  }

  /**
   * The markdown always goes to `<folderName>.md`. When that name is the file
   * read in step 2 (the usual case, or a case-only retitle on a case-insensitive
   * volume) it is replaced in place and respelled; otherwise it is created and the
   * old file is deleted, verified.
   */
  private async putMarkdown(bytes: Buffer): Promise<void> {
    const old = this.state.markdown;
    const oldName = this.state.markdownName;
    if (old === null || oldName === null) throw codedError("ENOENT", "The note has no markdown file.");
    const target = join(this.directory, `${this.folderName}.md`);
    const entry = await entryAt(target);
    if (entry !== null && entry.dev === old.dev && entry.ino === old.ino) {
      await this.replace("markdown", target, old.bytes, bytes);
      await this.respell(target);
    } else if (entry === null) {
      await this.create("markdown", target, bytes);
      await this.remove("markdown", join(this.directory, oldName), old.bytes);
    } else {
      // Another file already has the name. moss-multi has not settled what Moss does
      // here (open item 6), so the write refuses rather than guess.
      throw new Raced();
    }
    this.landed.markdown = bytes;
  }

  /** After a case-only retitle, renames the entry to the exact spelling; the same file, so nothing is replaced. */
  private async respell(target: string): Promise<void> {
    const wanted = basename(target);
    const spelled = (await readdir(this.directory)).find((name) => name !== wanted && sameIgnoringCase(name, wanted));
    if (spelled === undefined) return;
    const [entry, current] = await Promise.all([entryAt(join(this.directory, spelled)), entryAt(target)]);
    if (entry === null || current === null || entry.dev !== current.dev || entry.ino !== current.ino) return;
    await rename(join(this.directory, spelled), target);
    await syncPath(this.directory);
  }

  /** A put over a file that existed in step 2: exchange, then check what came out. */
  private async replace(file: Moss.MossNoteFile, target: string, expected: Buffer, bytes: Buffer): Promise<void> {
    const mode = await stat(target).then(
      (details) => details.mode & 0o777,
      () => undefined,
    );
    const temp = this.holdingPath(target, "tmp");
    await writeNew(temp, bytes, mode);
    try {
      await this.context.paths.exchange(temp, target);
    } catch (error) {
      await unlink(temp).catch(() => undefined);
      if (errorCode(error) === "ENOENT") throw new Raced();
      throw error;
    }
    const applied: Applied & { how: "exchanged" } = { how: "exchanged", file, target, holding: temp, wrote: bytes };
    this.applied.push(applied);
    await syncPath(this.directory);
    const holding = this.holdingPath(target, "displaced");
    await rename(temp, holding);
    applied.holding = holding;
    if ((await readFile(holding)).equals(expected)) return;
    // Another writer landed after step 2: give its bytes back now.
    this.applied.pop();
    await this.undoExchange(applied);
    throw new Raced();
  }

  /** A put where no file existed in step 2: place it exclusively. */
  private async create(file: Moss.MossNoteFile, target: string, bytes: Buffer): Promise<void> {
    const temp = this.holdingPath(target, "tmp");
    await writeNew(temp, bytes);
    try {
      await link(temp, target);
    } catch (error) {
      if (errorCode(error) === "EEXIST") throw new Raced();
      throw error;
    } finally {
      await unlink(temp).catch(() => undefined);
    }
    this.applied.push({ how: "created", file, target, wrote: bytes });
    await syncPath(this.directory);
  }

  /** A delete of a file that existed in step 2: move it aside, then check what was moved. */
  private async remove(file: Moss.MossNoteFile, target: string, expected: Buffer): Promise<void> {
    const holding = this.holdingPath(target, "displaced");
    try {
      await rename(target, holding);
    } catch (error) {
      if (errorCode(error) === "ENOENT") throw new Raced();
      throw error;
    }
    const applied: Applied = { how: "deleted", file, target, holding };
    this.applied.push(applied);
    await syncPath(this.directory);
    if ((await readFile(holding)).equals(expected)) return;
    this.applied.pop();
    await this.putBack(target, holding);
    throw new Raced();
  }

  private async keep(path: string): Promise<void> {
    this.preserved.push(relative(this.directory, path));
  }

  /** Moves held bytes back to their path, unless something took the path meanwhile; then they are kept. */
  private async putBack(target: string, holding: string): Promise<void> {
    try {
      await link(holding, target);
    } catch (error) {
      if (errorCode(error) !== "EEXIST") throw error;
      await this.keep(holding);
      return;
    }
    await unlink(holding);
    await syncPath(this.directory);
  }

  /** Exchanges the held bytes back, if the target still holds this write's bytes; otherwise keeps them. */
  private async undoExchange(applied: Applied & { how: "exchanged" }): Promise<void> {
    const current = await readOptional(applied.target);
    if (current === null || !current.equals(applied.wrote)) {
      await this.keep(applied.holding);
      return;
    }
    await this.context.paths.exchange(applied.holding, applied.target);
    await syncPath(this.directory);
    const back = await readOptional(applied.holding);
    if (back !== null && back.equals(applied.wrote)) await unlink(applied.holding);
    else await this.keep(applied.holding);
  }

  private async undoCreate(applied: Applied & { how: "created" }): Promise<void> {
    const current = await readOptional(applied.target);
    if (current === null || !current.equals(applied.wrote)) return;
    const holding = this.holdingPath(applied.target, "displaced");
    await rename(applied.target, holding);
    if ((await readFile(holding)).equals(applied.wrote)) {
      await unlink(holding);
      await syncPath(this.directory);
      return;
    }
    await this.putBack(applied.target, holding);
  }

  /** Step 5: undoes this write's files, newest first. An entry stays listed until it is undone. */
  private async rollBack(): Promise<void> {
    while (this.applied.length > 0) {
      const applied = this.applied.at(-1)!;
      if (applied.how === "exchanged") await this.undoExchange(applied);
      else if (applied.how === "created") await this.undoCreate(applied);
      else await this.putBack(applied.target, applied.holding);
      this.applied.pop();
    }
  }

  /** Once every target is written or restored: drops held bytes the write replaced, and keeps any whose target changed again. */
  private async settle(): Promise<void> {
    for (const applied of this.applied.splice(0)) {
      if (applied.how === "created") continue;
      const current = await readOptional(applied.target);
      const stands = applied.how === "exchanged" ? current !== null && current.equals(applied.wrote) : current === null;
      if (stands) await unlink(applied.holding);
      else await this.keep(applied.holding);
    }
    await syncPath(this.directory);
  }

  /** The files that hold this write's bytes now. */
  private async filesHoldingWrite(): Promise<Moss.MossNoteFile[]> {
    const files: Moss.MossNoteFile[] = [];
    for (const op of this.write.ops) {
      const name = op.file === "markdown" ? `${this.folderName}.md` : this.names()[op.file];
      const current = await readOptional(join(this.directory, name));
      const holds = op.kind === "put" ? current !== null && current.equals(Buffer.from(op.text, "utf8")) : current === null;
      if (holds) files.push(op.file);
    }
    return files;
  }

  private knownLocation(): Moss.MossNoteLocation {
    return locationOf({ ...this.state, directory: this.directory, folderName: this.folderName });
  }

  /** Step 6: the files must still hold what this write produced. */
  private async verify(): Promise<Moss.MossWriteResult> {
    const after = await this.context.readState(this.directory);
    const actual = stateVersions(this.context.helpers, after);
    const expected = noteVersions(this.context.helpers, this.landed, this.state.folderPath);
    if (actual.version !== expected.version || actual.metaVersion !== expected.metaVersion) {
      // Someone replaced a file after its exchange. Nothing is rolled back.
      await this.settle();
      return {
        kind: "conflict",
        reason: "raced",
        ...actual,
        applied: await this.filesHoldingWrite(),
        preserved: this.preserved,
        location: locationOf(after),
      };
    }
    await this.settle();
    return { kind: "saved", ...actual, location: locationOf(after) };
  }

  private async raced(): Promise<Moss.MossWriteResult> {
    try {
      await this.rollBack();
      const after = await this.context.readState(this.directory);
      return {
        kind: "conflict",
        reason: "raced",
        ...stateVersions(this.context.helpers, after),
        applied: await this.filesHoldingWrite(),
        preserved: this.preserved,
        location: locationOf(after),
      };
    } catch (error) {
      return this.failed(error);
    }
  }

  /** An I/O failure: undo what can be undone, keep every held file the undo could not settle, and say where things are. */
  private async failed(error: unknown): Promise<Moss.MossWriteResult> {
    try {
      await this.rollBack();
    } catch {
      for (const applied of this.applied.splice(0)) {
        if (applied.how !== "created") await this.keep(applied.holding);
      }
    }
    const location = await this.context.readState(this.directory).then(locationOf, () => this.knownLocation());
    return {
      kind: "failed",
      code: errorCode(error) ?? null,
      message: messageOf(error),
      applied: await this.filesHoldingWrite().catch(() => []),
      preserved: this.preserved,
      location,
    };
  }
}
