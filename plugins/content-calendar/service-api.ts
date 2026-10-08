import type { z } from "zod";
import type { RpcContract } from "./contract.js";

type In<K extends keyof RpcContract> = z.infer<RpcContract[K]["input"]>;
type Out<K extends keyof RpcContract> = z.infer<RpcContract[K]["output"]>;

/** Errors carry bb's CLI error shape: `{ ok:false, error:{ code, message, hint } }`. */
export type CalendarErrorCode =
  | "not_connected"
  | "needs_client"
  | "not_found"
  | "conflict"
  | "invalid"
  | "limit"
  | "calendar_deleted"
  | "calendar_id_required"
  | "auth_failed";

export class CalendarError extends Error {
  constructor(
    readonly code: CalendarErrorCode,
    message: string,
    readonly hint?: string,
    /** For `conflict`: the fields Google Calendar kept. */
    readonly fields?: string[],
  ) {
    super(message);
    this.name = "CalendarError";
  }
}

/** Calendar operations owned by the sync engine. Host-file methods are wired in server.ts. */
export type CalendarOperations = {
  [K in "status" | "calendar" | "list" | "show" | "add" | "update" | "move" | "gateAdd" | "gateClear" | "gateRemove" | "attach" | "detach" | "delete" | "reapply" | "sync" | "export" | "visible" | "connectStart" | "connectFinish" | "disconnect" | "restoreCalendar"]:
    (input: In<K>) => Promise<Out<K>>;
};

/**
 * Online writes resolve once Google confirms; when Google is unreachable the
 * write is queued and resolves with `sync: "queued"`. Methods called with
 * `{ strict: true }` reject with `CalendarError("conflict")` when Google kept a
 * same-field change (the CLI uses this so a lost write never reports success);
 * otherwise the item resolves with `sync: "conflict"`.
 */
export interface CalendarService extends CalendarOperations {
  /** Like the operation, but rejects a same-field conflict instead of returning it. */
  strict: Pick<CalendarOperations, "add" | "update" | "move" | "gateAdd" | "gateClear" | "gateRemove" | "attach" | "detach" | "reapply">;
  /** Look up an item without touching Google (used for file attachments). */
  get(id: string): Promise<Out<"show">>;
  /** One polling step: flush queued writes, pull Google changes, and roll tray series forward on a new week. */
  tick(): Promise<void>;
  /** Milliseconds until the next tick: 60s while a view is visible, 10 minutes otherwise, sooner while writes wait to retry. */
  nextTickDelay(): number;
  dispose(): void;
}

export interface Credentials {
  clientId?: string;
  clientSecret?: string;
  refreshToken?: string;
  calendarId?: string;
}

/** What the engine needs from the plugin host; server.ts supplies the real ones, tests supply fakes. */
export interface ServiceDeps {
  /** The plugin's own SQLite database (better-sqlite3). */
  db: import("better-sqlite3").Database;
  /** `bb.storage.migrate`: append-only statements, index = migration id. */
  migrate(db: import("better-sqlite3").Database, statements: string[]): void;
  /** Secret settings. Only the refresh token and calendar ID are written by the engine. */
  credentials: {
    get(): Promise<Credentials>;
    set(values: { refreshToken?: string | null; calendarId?: string | null }): Promise<void>;
  };
  /** Publishes the `changed` realtime signal. */
  publish(reason: string): void;
  fetch: typeof fetch;
  now(): Date;
  log: { info(message: string): void; warn(message: string): void; error(message: string): void };
  /** Overridable endpoints for the local fake of Google's APIs. */
  google?: { apiBase?: string; authUrl?: string; tokenUrl?: string };
}
