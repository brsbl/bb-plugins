import { details, notices, replyPrompt, threadTitle, toCalEvent, type CalEvent } from "./events.js";
import type { GoogleClient } from "./google.js";

export const MINUTE = 60_000;
export const WINDOW = 7 * 24 * 60 * MINUTE;
/** Entries stay this long after their event ends. */
export const LINGER = 30 * MINUTE;
export const REMINDER_LEAD = 10 * MINUTE;
/** A finished turn's notification is sent about 2 s after it settles; leave it well clear before muting, sending again or archiving. */
export const SETTLE = 30_000;
/** Archive a closing entry anyway when its last notice never settles. */
const CLOSE_TIMEOUT = 10 * MINUTE;
const FAILURE_ALERT_AFTER = 60 * MINUTE;
const PRUNE_AFTER = 24 * 60 * MINUTE;

export interface EventRecord {
  event: CalEvent;
  threadId: string | null;
  title: string;
  /** Its thread's first reply announces the event (it was added after the first sync). */
  announce: boolean;
  /** The 10-minute reminder was sent, or isn't due for this event. */
  reminded: boolean;
  /** live: listed; closing: a last notice, then archive; done: archived or dismissed. */
  phase: "live" | "closing" | "done";
  /** Lines of the next notice, sent once the thread is idle. The first line is the notification body. */
  pending: string[] | null;
  /** When the last notice was sent. */
  sentAt: number | null;
  /** Closed because it moved past the window; listed again if it comes back. */
  movedOut?: boolean;
}

export interface CalendarState {
  /** Events created after the first successful sync are announced; earlier ones are listed quietly. */
  baselineAt: number | null;
  lastSyncAt: number | null;
  lastError: string | null;
  failingSince: number | null;
  problemThreadId: string | null;
  events: Record<string, EventRecord>;
}

export const emptyState = (): CalendarState => ({ baselineAt: null, lastSyncAt: null, lastError: null, failingSince: null, problemThreadId: null, events: {} });

export type ThreadState = { state: "busy" } | { state: "gone" } | { state: "idle"; settledAt: number };

export interface ThreadPort {
  /** A new Calendar thread whose first turn replies with the prompt's text. Notifies only when `notify`. */
  spawn(input: { title: string; prompt: string; eventId: string | null; notify: boolean }): Promise<string>;
  /** The live Calendar thread already made for this event, if any. */
  find(eventId: string): Promise<string | null>;
  state(threadId: string): Promise<ThreadState>;
  /** One notifying turn on an idle thread. */
  send(threadId: string, prompt: string): Promise<void>;
  retitle(threadId: string, title: string): Promise<void>;
  archive(threadId: string): Promise<void>;
}

export interface EngineDeps {
  google: Pick<GoogleClient, "listEvents" | "getEvent">;
  threads: ThreadPort;
  load(): Promise<CalendarState>;
  save(state: CalendarState): Promise<void>;
  now(): number;
  log: { warn(message: string): void };
}

export interface EngineConfig {
  calendars: string[];
  timeZone: string;
}

const message = (error: unknown) => (error instanceof Error ? error.message : String(error));

export function createEngine(deps: EngineDeps) {
  const { threads, google } = deps;

  async function spawnFor(state: CalendarState, record: EventRecord, config: EngineConfig) {
    const notify = record.announce && record.event.startMs > deps.now();
    const lines = details(record.event, config.timeZone);
    const prompt = replyPrompt(notify ? [notices.added(record.event, config.timeZone), ...lines] : lines);
    // A record without a thread is either new or an interrupted spawn; adopt the thread an interrupted spawn made.
    record.threadId = (await threads.find(record.event.id)) ?? (await threads.spawn({ title: record.title, prompt, eventId: record.event.id, notify }));
    record.sentAt = deps.now();
    await deps.save(state);
  }

  async function added(state: CalendarState, event: CalEvent, now: number, config: EngineConfig) {
    const notify = event.createdMs >= (state.baselineAt ?? now) && event.startMs > now;
    const record: EventRecord = {
      event,
      threadId: null,
      title: threadTitle(event, config.timeZone),
      announce: notify,
      reminded: notify && event.startMs - now <= REMINDER_LEAD,
      phase: "live",
      pending: null,
      sentAt: null,
    };
    // Saved before spawning so a crash or restart never makes a second thread for this event.
    state.events[event.id] = record;
    await deps.save(state);
    await spawnFor(state, record, config);
  }

  async function changed(state: CalendarState, record: EventRecord, event: CalEvent, now: number, config: EngineConfig) {
    const moved = event.startMs !== record.event.startMs;
    const title = threadTitle(event, config.timeZone);
    if (moved && event.startMs > now) {
      record.pending = [notices.moved(event.startMs, config.timeZone), ...details(event, config.timeZone)];
      record.reminded = event.startMs - now <= REMINDER_LEAD;
    }
    const retitle = title !== record.title;
    if (!retitle && JSON.stringify(event) === JSON.stringify(record.event)) return;
    record.event = event;
    record.title = title;
    await deps.save(state);
    if (retitle && record.threadId) await threads.retitle(record.threadId, title);
  }

  /** A listed event no longer appears on its calendar: ask Google whether it was canceled or moved past the window. */
  async function vanished(state: CalendarState, record: EventRecord, now: number, config: EngineConfig) {
    if (now >= record.event.endMs + LINGER) return close(state, record, null);
    const raw = await google.getEvent(record.event.calendarId, record.event.id);
    const event = raw ? toCalEvent(raw, record.event.calendarId) : null;
    if (!raw || raw.status === "cancelled") {
      return close(state, record, record.event.startMs > now ? [notices.canceled()] : null);
    }
    if (!event) return close(state, record, null);
    if (event.startMs < now + WINDOW) return; // Still listed next sync.
    // The record keeps the old time so it is pruned soon; sync lists the event again if it returns.
    record.movedOut = true;
    return close(state, record, [notices.moved(event.startMs, config.timeZone), ...details(event, config.timeZone)]);
  }

  async function close(state: CalendarState, record: EventRecord, lines: string[] | null) {
    record.phase = "closing";
    record.pending = lines;
    await deps.save(state);
  }

  async function sync(state: CalendarState, now: number, config: EngineConfig) {
    const listed = new Map<string, CalEvent>();
    const read = new Set<string>();
    const errors: string[] = [];
    for (const calendarId of config.calendars) {
      try {
        const items = await google.listEvents(calendarId, now - LINGER, now + WINDOW);
        if (items === null) { errors.push(`Calendar ${calendarId} wasn't found`); continue; }
        read.add(calendarId);
        for (const item of items) {
          const event = toCalEvent(item, calendarId);
          // Shared calendars can carry the same event; the first calendar in settings keeps it.
          if (event && event.endMs + LINGER > now && !listed.has(event.id)) listed.set(event.id, event);
        }
      } catch (error) {
        errors.push(`${calendarId}: ${message(error)}`);
      }
    }
    state.lastError = errors.length ? errors.join("; ") : null;
    if (read.size === 0) {
      state.failingSince ??= now;
      await deps.save(state);
      return;
    }
    state.failingSince = null;
    state.problemThreadId = null;
    state.baselineAt ??= now;
    state.lastSyncAt = now;
    await deps.save(state);

    for (const event of listed.values()) {
      const record = state.events[event.id];
      try {
        if (!record || (record.phase === "done" && record.movedOut)) await added(state, event, now, config);
        else if (record.phase === "live") await changed(state, record, event, now, config);
      } catch (error) {
        deps.log.warn(`Calendar event ${event.id}: ${message(error)}`);
      }
    }
    for (const record of Object.values(state.events)) {
      if (record.phase !== "live" || listed.has(record.event.id) || !read.has(record.event.calendarId)) continue;
      try { await vanished(state, record, now, config); } catch (error) { deps.log.warn(`Calendar event ${record.event.id}: ${message(error)}`); }
    }
  }

  async function finish(state: CalendarState, record: EventRecord) {
    record.phase = "done";
    record.pending = null;
    await deps.save(state);
    if (record.threadId) await threads.archive(record.threadId);
  }

  /** Reminders, queued notices, closing and archiving, from saved state alone. */
  async function advance(state: CalendarState, now: number, config: EngineConfig) {
    for (const record of Object.values(state.events)) {
      if (record.phase === "done") continue;
      try {
        if (!record.threadId) {
          if (record.phase === "live") await spawnFor(state, record, config);
          else await finish(state, record);
          continue;
        }
        if (now >= record.event.endMs + LINGER) { await finish(state, record); continue; }
        const { startMs } = record.event;
        if (record.phase === "live" && !record.reminded && !record.pending && now >= startMs - REMINDER_LEAD && now < startMs) {
          record.pending = [notices.reminder(record.event), ...details(record.event, config.timeZone)];
          record.reminded = true;
          await deps.save(state);
        }
        if (!record.pending && record.phase !== "closing") continue;
        const thread = await threads.state(record.threadId);
        if (thread.state === "gone") { record.phase = "done"; record.pending = null; await deps.save(state); continue; }
        if (thread.state === "busy") {
          if (record.phase === "closing" && !record.pending && record.sentAt !== null && now - record.sentAt >= CLOSE_TIMEOUT) await finish(state, record);
          continue;
        }
        if (now - thread.settledAt < SETTLE) continue;
        if (record.pending) {
          const lines = record.pending;
          // Cleared before sending: a crash may drop this notice but never repeats it.
          record.pending = null;
          record.sentAt = now;
          await deps.save(state);
          await threads.send(record.threadId, replyPrompt(lines));
          continue;
        }
        // Closing: archive once the last notice's turn has settled and been notified.
        if (record.sentAt === null || thread.settledAt >= record.sentAt || now - record.sentAt >= CLOSE_TIMEOUT) await finish(state, record);
      } catch (error) {
        deps.log.warn(`Calendar event ${record.event.id}: ${message(error)}`);
      }
    }
    for (const [id, record] of Object.entries(state.events)) {
      if (record.phase === "done" && now - record.event.endMs > PRUNE_AFTER) delete state.events[id];
    }
  }

  async function alertIfFailing(state: CalendarState, now: number) {
    if (state.failingSince === null || state.problemThreadId || now - state.failingSince < FAILURE_ALERT_AFTER) return;
    state.problemThreadId = "pending";
    await deps.save(state);
    state.problemThreadId = await threads.spawn({
      title: "Calendar can't reach Google",
      prompt: replyPrompt([
        "Calendar hasn't been able to read your Google calendars for an hour, so new events and reminders won't show up here.",
        `Last error: ${state.lastError ?? "unknown"}. Ask an agent in bb to check the Calendar plugin's settings.`,
      ]),
      eventId: null,
      notify: true,
    });
    await deps.save(state);
  }

  return {
    /** One pass. `fetch` reads Google first; otherwise only saved state moves forward. */
    async tick(config: EngineConfig, options: { fetch: boolean }) {
      const state = await deps.load();
      const now = deps.now();
      if (options.fetch) await sync(state, now, config);
      await advance(state, now, config);
      await alertIfFailing(state, now);
      await deps.save(state);
      return state;
    },
  };
}
