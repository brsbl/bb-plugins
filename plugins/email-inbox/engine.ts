import { GmailError, type GmailClient } from "./gmail.js";
import { clean, header, isWeekend, localDay, mailLink, MAX_TEXT, parseFrom, replyPrompt, summaryPrompt, toMail, type Mail, type Overflow } from "./mail.js";

export const MINUTE = 60_000;
const DAY = 24 * 60 * MINUTE;
export const MAX_MESSAGES = 150;
export const MAX_CHARS = 150_000;
/** Messages listed per account beyond the reading cap, so the rest can still be counted. */
const MAX_LISTED = 500;
const KNOWN_TTL = 7 * DAY;
const RETRY = 15 * MINUTE;

export interface EmailState {
  /** End of the last summary's window; the next one covers mail received after it. */
  lastSummaryAt: number | null;
  /** Local day (`YYYY-Mon-D`) of the last scheduled summary, so each weekday runs once. */
  lastRunDay: string | null;
  lastRunAt: number | null;
  /** The last scheduled try, so a failing day retries every 15 minutes rather than every pass. */
  lastAttemptAt: number | null;
  summaryThreadId: string | null;
  /** Per account: the last read error, or null when it read fine. */
  errors: Record<string, string | null>;
  /** Accounts whose access was revoked, with their reconnect thread. */
  reconnect: Record<string, string>;
  /** Whether she has written to a sender, per account. */
  known: Record<string, Record<string, { sent: boolean; at: number }>>;
}

export const emptyState = (): EmailState => ({ lastSummaryAt: null, lastRunDay: null, lastRunAt: null, lastAttemptAt: null, summaryThreadId: null, errors: {}, reconnect: {}, known: {} });

export interface ThreadPort {
  /** A new Email thread whose first turn is the prompt. Notifies only when `notify`. */
  spawn(input: { title: string; prompt: string; kind: "summary" | "notice"; notify: boolean }): Promise<string>;
  /** Whether she wrote in the thread; "gone" when it's archived or deleted. */
  replied(threadId: string): Promise<boolean | "gone">;
  archive(threadId: string): Promise<void>;
}

export interface EngineDeps {
  gmail: Pick<GmailClient, "listMessages" | "getMessage">;
  threads: ThreadPort;
  load(): Promise<EmailState>;
  save(state: EmailState): Promise<void>;
  now(): number;
  log: { warn(message: string): void };
}

export interface EngineConfig {
  /** In settings order: the first one keeps a message sent to several. */
  accounts: string[];
  timeZone: string;
  /** Minutes after local midnight. */
  summaryAt: number;
}

const message = (error: unknown) => (error instanceof Error ? error.message : String(error));

/** Whether a scheduled summary is due now: a weekday, past the summary time, not yet run today. */
export function due(state: EmailState, now: number, config: EngineConfig): boolean {
  const today = localDay(now, config.timeZone);
  return !isWeekend(today.weekday) && today.minutes >= config.summaryAt && state.lastRunDay !== today.key;
}

/** The next scheduled summary, for status (to the minute; a DST change can shift it by an hour). */
export function nextSummaryAt(state: EmailState, now: number, config: EngineConfig): number {
  if (due(state, now, config)) return now;
  const today = localDay(now, config.timeZone);
  for (let days = 0; days < 8; days++) {
    const at = now + days * DAY + (config.summaryAt - today.minutes) * MINUTE;
    const day = localDay(at, config.timeZone);
    if (at > now && !isWeekend(day.weekday) && day.key !== state.lastRunDay) return at - (at % MINUTE);
  }
  return now + DAY;
}

/** The first window starts at the previous weekday's run: a day back, or three on Monday. */
const firstWindowStart = (now: number, timeZone: string) => now - (localDay(now, timeZone).weekday === "Mon" ? 3 : 1) * DAY;

export function createEngine(deps: EngineDeps) {
  const { gmail, threads } = deps;

  async function knownSender(state: EmailState, account: string, address: string, now: number): Promise<boolean> {
    const cache = (state.known[account] ??= {});
    const cached = cache[address];
    if (cached && now - cached.at < KNOWN_TTL) return cached.sent;
    const sent = (await gmail.listMessages(account, `in:sent to:${address}`, 1)).length > 0;
    cache[address] = { sent, at: now };
    return sent;
  }

  async function reportRevoked(state: EmailState, account: string) {
    if (state.reconnect[account]) return;
    state.reconnect[account] = "pending";
    await deps.save(state);
    state.reconnect[account] = await threads.spawn({
      title: `Email can't read ${account}`,
      kind: "notice",
      notify: true,
      prompt: replyPrompt([
        `Google access for ${account} was revoked or expired, so the Email summary leaves that account out until it's reconnected.`,
        "Ask an agent in bb to mint a new gmail.readonly refresh token for it and save it in the Email plugin's settings. The other accounts are still summarized.",
      ]),
    });
    await deps.save(state);
  }

  async function collect(state: EmailState, since: number, now: number, config: EngineConfig) {
    const seen = new Set<string>();
    const mails: (Mail & { known: boolean })[] = [];
    const overflow: Overflow[] = [];
    const unread: { account: string; reason: string }[] = [];
    let chars = 0;
    for (const account of config.accounts) {
      try {
        const refs = await gmail.listMessages(account, `in:inbox after:${Math.floor(since / 1000)}`, MAX_LISTED);
        for (const ref of refs) {
          const full = mails.length < MAX_MESSAGES && chars < MAX_CHARS;
          const raw = await gmail.getMessage(account, ref.id, full ? "full" : "metadata");
          // Gmail's after: is by the second; the window is exact.
          if (!raw || Number(raw.internalDate ?? 0) <= since) continue;
          const id = header(raw, "Message-ID").trim() || `${account}/${raw.id}`;
          if (seen.has(id)) continue;
          seen.add(id);
          if (!full) {
            overflow.push({ account, fromName: parseFrom(header(raw, "From")).name, subject: clean(header(raw, "Subject")) || "(no subject)", link: mailLink(account, raw.threadId) });
            continue;
          }
          const mail = toMail(raw, account, Math.min(MAX_TEXT, MAX_CHARS - chars));
          chars += mail.text.length;
          mails.push({ ...mail, known: mail.fromAddress ? await knownSender(state, account, mail.fromAddress, now) : false });
        }
        state.errors[account] = null;
        delete state.reconnect[account];
      } catch (error) {
        state.errors[account] = message(error);
        if (error instanceof GmailError && error.reconnect) await reportRevoked(state, account);
        else unread.push({ account, reason: message(error) });
      }
    }
    mails.sort((a, b) => a.receivedMs - b.receivedMs);
    return { mails, overflow, unread };
  }

  async function archivePrevious(previous: string | null) {
    if (!previous) return;
    try {
      const replied = await threads.replied(previous);
      if (replied === false) await threads.archive(previous);
    } catch (error) {
      deps.log.warn(`Email couldn't archive the previous summary: ${message(error)}`);
    }
  }

  async function summarize(state: EmailState, now: number, config: EngineConfig, scheduled: boolean) {
    const since = state.lastSummaryAt ?? firstWindowStart(now, config.timeZone);
    const { mails, overflow, unread } = await collect(state, since, now, config);
    const readAny = config.accounts.some((account) => state.errors[account] === null);
    if (!readAny) {
      await deps.save(state);
      throw new Error(`No account could be read: ${config.accounts.map((account) => `${account}: ${state.errors[account] ?? "not read"}`).join("; ")}`);
    }
    const sinceLabel = localDay(since, config.timeZone).weekday;
    const title = `Email · ${localDay(now, config.timeZone).label}`;
    const empty = mails.length === 0 && overflow.length === 0;
    const prompt = empty
      ? replyPrompt([`Nothing new since ${sinceLabel}.${unread.length ? ` Not read: ${unread.map((item) => item.account).join(", ")}.` : ""}`])
      : summaryPrompt({ sinceLabel, timeZone: config.timeZone, mails, overflow, unread });
    // The window moves before spawning, so a crash or restart never posts this summary twice.
    const previous = state.summaryThreadId;
    const before = { lastRunDay: state.lastRunDay, lastSummaryAt: state.lastSummaryAt, lastRunAt: state.lastRunAt };
    if (scheduled) state.lastRunDay = localDay(now, config.timeZone).key;
    state.lastSummaryAt = now;
    state.lastRunAt = now;
    state.summaryThreadId = null;
    await deps.save(state);
    try {
      state.summaryThreadId = await threads.spawn({ title, prompt, kind: "summary", notify: !empty });
    } catch (error) {
      // bb refused the thread, so nothing was posted: keep the window for the next try.
      Object.assign(state, before, { summaryThreadId: previous });
      await deps.save(state);
      throw error;
    }
    await deps.save(state);
    await archivePrevious(previous);
    return { threadId: state.summaryThreadId, messages: mails.length, overflow: overflow.length };
  }

  return {
    /** One pass: the scheduled summary when it's due (once per weekday, caught up later that day). */
    async tick(config: EngineConfig) {
      const state = await deps.load();
      const now = deps.now();
      if (config.accounts.length === 0 || !due(state, now, config)) return state;
      if (state.lastAttemptAt !== null && now - state.lastAttemptAt < RETRY) return state;
      state.lastAttemptAt = now;
      await deps.save(state);
      await summarize(state, now, config, true);
      return state;
    },
    /** A summary now, outside the schedule. */
    async summaryNow(config: EngineConfig) {
      if (config.accounts.length === 0) throw new Error("List at least one account in Email settings.");
      const state = await deps.load();
      return summarize(state, deps.now(), config, false);
    },
  };
}
