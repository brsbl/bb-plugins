// A stand-in for the Mac's atomic exchange, which the tests' Linux volumes lack.
import { lstat, rename } from "node:fs/promises";
import type { PathExchange } from "../editor-files.js";

type Hook = (first: string, second: string) => Promise<void> | void;

/**
 * An exchange made of plain renames: not atomic, which is fine in a test with
 * no other writer, but each side can be interrupted to play one.
 */
export class TestPaths implements PathExchange {
  supported = true;
  /** Runs just before an exchange, as if another writer landed after the host's check. */
  before: Hook | null = null;
  /** Runs just after an exchange, as if another writer landed right after it. */
  after: Hook | null = null;
  /** Makes the next exchange fail with this code, as an I/O error would. */
  failNext: string | null = null;
  /** Makes the next exchange swap and then fail with this code, as a helper whose reply was lost would. */
  failAfterSwap: string | null = null;

  async exchange(first: string, second: string): Promise<void> {
    await this.before?.(first, second);
    if (this.failNext !== null) {
      const code = this.failNext;
      this.failNext = null;
      throw Object.assign(new Error(`${code}: exchange failed`), { code });
    }
    await lstat(first);
    await lstat(second);
    const aside = `${first}.swapping`;
    await rename(first, aside);
    await rename(second, first);
    await rename(aside, second);
    await this.after?.(first, second);
    if (this.failAfterSwap !== null) {
      const code = this.failAfterSwap;
      this.failAfterSwap = null;
      throw Object.assign(new Error(`${code}: no reply after the swap`), { code });
    }
  }

  async renameExclusive(from: string, to: string): Promise<void> {
    if (await lstat(to).then(() => true, () => false)) throw Object.assign(new Error(`EEXIST: ${to}`), { code: "EEXIST" });
    await rename(from, to);
  }

  async supports(): Promise<boolean> {
    return this.supported;
  }
}
