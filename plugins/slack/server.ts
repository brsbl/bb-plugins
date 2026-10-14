import { randomUUID } from "node:crypto";
import { cliCommand, defineCli, PluginCliError, type BbPluginApi, type PluginCliContext, type JsonValue } from "@get-bb/plugin-sdk";
import { z } from "zod";
import { rpcContract, type Status } from "./contract.js";
import { channelId, timestamp, tokenSchema, SlackClient, SlackError, safeError, type Identity } from "./slack.js";

const itemSchema = z.object({
  id: z.string(), threadId: z.string(), state: z.enum(["ready", "pending", "succeeded", "failed"]),
  content: z.object({ type: z.literal("reply"), service: z.literal("slack"), draft: z.string(), to: z.array(z.string()), subject: z.string() }),
  attempt: z.object({ id: z.string().uuid(), action: z.string(), claimed: z.boolean(), note: z.string().optional() }).nullable(),
});
type Item = z.infer<typeof itemSchema>;
type Binding = { thread_id: string; id: string; channel: string; slack_thread: string | null; team: string; user: string; recipient: string; subject: string };
type Delivery = { attempt: string; state: "preflight" | "sending" | "sent" | "failed"; message: string; retryable: number };
const json = { type: "boolean" as const, description: "Emit bounded JSON" };
const cursor = { type: "string" as const, description: "nextCursor from the previous page" };
const limit = { type: "integer" as const, min: 1, max: 15, default: 15, description: "Messages per request (1–15)" };
const channelPosition = [{ name: "channel", required: true, description: "Channel ID from channels --json" }];
const idPosition = [{ name: "id", required: true, description: "Slack Reply card ID" }];
const output = (value: unknown) => ({ exitCode: 0, stdout: JSON.stringify(value, null, 2) + "\n" });
const requireThread = (ctx: PluginCliContext) => {
  if (!ctx.threadId) throw new PluginCliError("Run this command in a bb thread.", { code: "thread_required" });
  return ctx.threadId;
};
async function guard<T>(fn: () => Promise<T>): Promise<T> {
  try { return await fn(); } catch (error) {
    if (error instanceof PluginCliError) throw error;
    // Never echo upstream bodies, fetch errors, secrets, or schema inputs.
    throw safeError(error);
  }
}

export default function plugin(bb: BbPluginApi): void {
  const settings = bb.settings.define({
    userToken: { type: "string", label: "Slack User OAuth Token", secret: true, description: "Use Connect Slack to save and verify a user token. Never paste it into chat." },
  });
  const db = bb.storage.database();
  bb.storage.migrate(db, [
    "CREATE TABLE slack_drafts (thread_id TEXT NOT NULL, id TEXT NOT NULL, channel TEXT NOT NULL, slack_thread TEXT, team TEXT NOT NULL, user TEXT NOT NULL, recipient TEXT NOT NULL, subject TEXT NOT NULL, PRIMARY KEY(thread_id,id))",
    "CREATE TABLE slack_deliveries (thread_id TEXT NOT NULL, id TEXT NOT NULL, attempt TEXT NOT NULL, state TEXT NOT NULL, message TEXT NOT NULL, retryable INTEGER NOT NULL DEFAULT 0, PRIMARY KEY(thread_id,id,attempt))",
  ]);
  const clientFor = (token: string) => new SlackClient(token, (input, init) => globalThis.fetch(input, init), process.env.BB_SLACK_FAKE_API);
  const client = async () => {
    const token = tokenSchema.safeParse((await settings.get()).userToken);
    if (!token.success) throw new SlackError("not_connected", "Run bb slack connect in a thread, or open Settings → Slack.", true);
    return clientFor(token.data);
  };
  const connected = async (api: SlackClient): Promise<Status> => {
    const { missingScopes, ...identity } = await api.identity();
    return { connected: true, identity, missingScopes };
  };
  const status = async (): Promise<Status> => (await settings.get()).userToken ? connected(await client()) : { connected: false, identity: null, missingScopes: [] };
  const connect = async (raw: unknown) => {
    const parsed = tokenSchema.safeParse(raw);
    if (!parsed.success) throw new SlackError("user_token_required", "Enter a Slack User OAuth Token in the masked field. Bot and browser-session tokens are unsupported.", true);
    const result = await connected(clientFor(parsed.data));
    await settings.experimental_set({ userToken: parsed.data });
    return result;
  };
  bb.rpc.register(rpcContract, {
    status: () => guard(status), connect: ({ token }) => guard(() => connect(token)),
    disconnect: () => guard(async () => { await settings.experimental_set({ userToken: null }); return status(); }),
  });
  const card = async (method: string, input: JsonValue): Promise<Item> => {
    try { return await bb.sdk.plugins.callRpc({ pluginId: "inline-action-cards", method, input, outputSchema: itemSchema }); }
    catch { throw new SlackError("card_unavailable", "Inline Decisions could not complete this action. Install the Slack-compatible Inline Decisions release and check the card's latest state.", true); }
  };
  const binding = (threadId: string, id: string) => {
    const value = db.prepare("SELECT * FROM slack_drafts WHERE thread_id=? AND id=?").get(threadId, id) as Binding | undefined;
    if (!value) throw new SlackError("draft_not_found", "This Slack draft does not belong to the current bb thread.", true);
    return value;
  };
  const report = (threadId: string, id: string, attemptId: string, value: { state: string; message: string; retryable: number }) => card("report", {
    threadId, id, attemptId, outcome: value.state === "sent" ? "succeeded" : "failed", message: value.message, retryable: !!value.retryable,
  });
  const record = (threadId: string, id: string, attempt: string, state: string, message: string, retryable = false) => {
    db.prepare("UPDATE slack_deliveries SET state=?,message=?,retryable=? WHERE thread_id=? AND id=? AND attempt=?").run(state, message, Number(retryable), threadId, id, attempt);
    return { state, message, retryable: Number(retryable) };
  };
  const activeSends = new Set<string>();
  const sendAttempt = async (threadId: string, id: string, attemptId: string) => {
    const target = binding(threadId, id);
    let item = await card("get", { threadId, id });
    if (item.attempt?.id !== attemptId) throw new SlackError("stale_attempt", "Use the attempt from the current card click.", true);
    const old = db.prepare("SELECT * FROM slack_deliveries WHERE thread_id=? AND id=? AND attempt=?").get(threadId, id, attemptId) as Delivery | undefined;
    if (old) {
      // A process interruption may have occurred on either side of Slack committing.
      const result = old.state === "preflight" || old.state === "sending" ? { ...old, message: "Outcome unknown. Read Slack history/thread to reconcile; do not resend.", retryable: 0 } : old;
      if (item.state !== "succeeded") await report(threadId, id, attemptId, result);
      return { ...result, repeated: true };
    }
    if (item.state !== "pending") throw new SlackError("approval_required", "Click Send to Slack on the Reply card first.", true);
    if (!item.attempt.claimed) item = await card("claim", { threadId, id, attemptId });
    if (item.state !== "pending" || !item.attempt?.claimed || item.attempt.id !== attemptId) throw new SlackError("approval_required", "A claimed card approval is required.", true);
    if (item.attempt.action !== "send") {
      await card("report", { threadId, id, attemptId, outcome: "succeeded", message: "Kept in bb. Nothing was sent to Slack.", retryable: false });
      return { state: "kept", message: "Kept in bb. Nothing was sent to Slack." };
    }
    // A unique durable reservation and previous uncertain/successful writes guard concurrent calls and new attempts.
    db.transaction(() => {
      if (db.prepare("SELECT 1 FROM slack_deliveries WHERE thread_id=? AND id=? AND state IN ('preflight','sending','sent')").get(threadId, id)) {
        throw new SlackError("delivery_exists", "This card already has a sent or uncertain delivery. Reconcile it; do not resend.", true);
      }
      db.prepare("INSERT INTO slack_deliveries VALUES (?,?,?,'preflight','Preparing approved reply',0)").run(threadId, id, attemptId);
    })();
    let result: { state: string; message: string; retryable: number };
    try {
      if (item.attempt.note?.trim()) throw new SlackError("approval_note", "Held without sending: this approval has a note. Apply the note to the draft, then approve again without a note.", true);
      if (item.content.to.length !== 1 || item.content.to[0] !== target.recipient || item.content.subject !== target.subject) throw new SlackError("target_changed", "The card destination changed. Create a new Slack draft and approve it.", true);
      if (!item.content.draft.trim() || item.content.draft.length > 4000) throw new SlackError("draft_length", "Keep the reply between 1 and 4,000 characters, then approve it again.", true);
      const api = await client();
      const identity = await api.identity();
      if (identity.team_id !== target.team || identity.user_id !== target.user) throw new SlackError("identity_changed", "Slack's connected identity changed. Create a new draft to approve its sender and workspace.", true);
      const channel = await api.info(target.channel);
      if (channel.is_archived || `#${channel.name} · ${identity.team}` !== target.recipient) throw new SlackError("channel_changed", "The channel changed or was archived. Create a new Slack draft and approve it.", true);
      // Ignore cancellation once reserved: interruption must not turn a committed post into a retry.
      record(threadId, id, attemptId, "sending", "Outcome unknown. Check Slack before any retry.");
      const posted = await api.post(target.channel, item.content.draft, attemptId, target.slack_thread ?? undefined);
      result = record(threadId, id, attemptId, "sent", `Sent to ${target.recipient}. Slack message ${posted.ts}.`);
    } catch (error) {
      const state = (db.prepare("SELECT state FROM slack_deliveries WHERE thread_id=? AND id=? AND attempt=?").get(threadId, id, attemptId) as Delivery).state;
      const failure = safeError(error);
      const certain = state === "preflight" || failure.certain;
      result = record(threadId, id, attemptId, certain ? "failed" : "sending", certain ? failure.message : "Outcome unknown. Read Slack history/thread to reconcile; do not resend.", certain);
    }
    // If this RPC fails, the durable receipt remains; repeating send only reports it.
    await report(threadId, id, attemptId, result);
    return result;
  };
  const send = async (threadId: string, id: string, attempt: string) => {
    const key = `${threadId}:${id}`;
    if (activeSends.has(key)) throw new SlackError("send_in_progress", "This card is already being processed. Wait for its result.", true);
    activeSends.add(key);
    try { return await sendAttempt(threadId, id, attempt); } finally { activeSends.delete(key); }
  };
  const read = (run: () => Promise<unknown>) => guard(async () => output(await run()));
  bb.cli.register(defineCli({ name: "slack", summary: "Read Slack and draft replies that require a card approval", commands: {
    status: cliCommand({ summary: "Check the connected Slack identity and scopes", options: { json }, run: () => read(status) }),
    connect: cliCommand({ summary: "Connect Slack using one masked User OAuth Token form", options: { json }, run: (_, ctx) => read(async () => {
      const answer = await bb.ui.requestInput({ threadId: requireThread(ctx), rendererId: "connect", title: "Connect Slack", payload: {}, describeSubmission: () => ({ title: "Submitted Slack connection" }) }, { signal: ctx.signal });
      if (answer.outcome !== "submitted") throw new SlackError("cancelled", "Slack connection cancelled.", true);
      return connect(z.object({ token: z.unknown() }).parse(answer.value).token);
    }) }),
    channels: cliCommand({ summary: "List public/private channels, including Slack Connect channels", options: { json, cursor, limit: { ...limit, max: 100, default: 100, description: "Channels per request (1–100)" } }, run: ({ options }, ctx) => read(async () => (await client()).channels(options.cursor, options.limit, ctx.signal)) }),
    history: cliCommand({ summary: "Read a page of channel history", positionals: channelPosition, options: { json, cursor, limit, oldest: { type: "string", description: "Only messages after this Slack timestamp" }, latest: { type: "string", description: "Only messages before this Slack timestamp" } }, run: ({ positionals, options }, ctx) => read(async () => (await client()).messages(channelId.parse(positionals.channel), { cursor: options.cursor, limit: options.limit, oldest: options.oldest ? timestamp.parse(options.oldest) : undefined, latest: options.latest ? timestamp.parse(options.latest) : undefined }, ctx.signal)) }),
    thread: cliCommand({ summary: "Read a parent message and its replies", positionals: [...channelPosition, { name: "ts", required: true, description: "Parent thread_ts (or ts) from history" }], options: { json, cursor, limit }, run: ({ positionals, options }, ctx) => read(async () => (await client()).messages(channelId.parse(positionals.channel), { thread: timestamp.parse(positionals.ts), cursor: options.cursor, limit: options.limit }, ctx.signal)) }),
    search: cliCommand({ summary: "Search messages visible to the connected user", positionals: [{ name: "query", required: true, description: "Slack query, e.g. in:partner-demo launch" }], options: { json, page: { type: "integer", min: 1, max: 100, default: 1, description: "Search page (15 matches)" } }, run: ({ positionals, options }, ctx) => read(async () => (await client()).search(z.string().min(1).max(1000).parse(positionals.query), options.page, ctx.signal)) }),
    draft: cliCommand({ summary: "Create an editable Reply card; never posts to Slack", positionals: channelPosition, options: {
      json, thread: { type: "string", description: "Slack parent timestamp; omit for a channel message" },
      text: { type: "string", required: true, stdin: true, description: "Reply text (1–4,000 characters); prefer --text-stdin" },
      why: { type: "string", required: true, description: "Why the user is being asked now" },
      recommendation: { type: "string", required: true, description: "Recommendation and its reason" },
    }, run: ({ positionals, options }, ctx) => guard(async () => {
      const threadId = requireThread(ctx); const channel = channelId.parse(positionals.channel); const thread = options.thread ? timestamp.parse(options.thread) : undefined;
      const draft = z.string().trim().min(1).max(4000).parse(options.text);
      const why = z.string().trim().min(1).max(1500).parse(options.why); const recommendation = z.string().trim().min(1).max(1500).parse(options.recommendation);
      const api = await client(); const identity: Identity = await api.identity(); const info = await api.info(channel, ctx.signal);
      if (info.is_archived) throw new SlackError("is_archived", "Choose an active channel.", true);
      const history = await api.messages(channel, { thread, limit: 5 }, ctx.signal);
      const id = `slack-${randomUUID()}`; const recipient = `#${info.name} · ${identity.team}`;
      const subject = thread ? `Slack thread ${thread}` : "Slack channel message";
      const original = history.messages.map(message => `${message.user ?? message.bot_id ?? "Slack"} (${message.ts}): ${message.text}`).join("\n\n").slice(0, 12000);
      const context = `**What this is:** A ${thread ? "thread reply" : "channel message"} to ${recipient}${info.is_ext_shared ? ", a Slack Connect channel visible to external members" : ""}, sent as ${identity.user}.\n\n**Why now:** ${why}\n\n**Options:** Send to Slack posts the exact text shown. Comment requests changes; Later or Skip keeps it in bb.\n\n**Recommendation:** ${recommendation}\n\n**Next:** Send posts the saved draft once as ${identity.user} and reports the outcome here. Comment requests a revision; Later or Skip keeps the reply in bb. A note on Send holds the reply for revision and another approval. No other choice posts. Drafts use plain text without automatic mentions or link previews.`;
      db.prepare("INSERT INTO slack_drafts VALUES (?,?,?,?,?,?,?,?)").run(threadId, id, channel, thread ?? null, identity.team_id, identity.user_id, recipient, subject);
      try { await card("create", { threadId, id, content: { type: "reply", service: "slack", summary: `Reply in #${info.name}`, to: [recipient], cc: [], bcc: [], subject, original: { from: recipient, body: original || "No messages in this channel yet." }, draft, context } }); }
      catch (error) { db.prepare("DELETE FROM slack_drafts WHERE thread_id=? AND id=?").run(threadId, id); throw error; }
      const directive = `::action{id="${id}"}`;
      return options.json ? output({ id, directive }) : { exitCode: 0, stdout: directive + "\n" };
    }) }),
    send: cliCommand({ summary: "Execute a clicked Reply attempt once; repeat only to recover its report", positionals: idPosition, options: { json, attempt: { type: "string", required: true, description: "Attempt ID from the user's card click" } }, run: ({ positionals, options }, ctx) => read(() => send(requireThread(ctx), z.string().min(1).parse(positionals.id), z.string().uuid().parse(options.attempt))) }),
  } }));
}
