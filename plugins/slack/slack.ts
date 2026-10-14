import { PluginCliError } from "@get-bb/plugin-sdk";
import { z } from "zod";

import { scopes, channelId, timestamp, identitySchema, type Identity } from "./schemas.js";
export { channelId, timestamp, tokenSchema, type Identity } from "./schemas.js";
const failures: Record<string, string> = {
  invalid_auth: "Slack rejected the connection. Reconnect in Settings → Slack.",
  not_authed: "Connect Slack in Settings → Slack first.",
  token_revoked: "This Slack token was revoked. Reconnect in Settings → Slack.",
  token_expired: "This Slack token expired. Reconnect in Settings → Slack.",
  account_inactive: "This Slack identity is inactive. Reconnect in Settings → Slack.",
  missing_scope: "This Slack token lacks a required scope. Reinstall the Slack app with the scopes in the Slack plugin README, then reconnect.",
  not_allowed_token_type: "Slack requires a user token for this operation. Reconnect with a User OAuth Token.",
  channel_not_found: "Slack cannot find this channel. List channels again; Connect channel IDs can change. Check your workspace and channel membership.",
  not_in_channel: "Join this channel in Slack, then try again.",
  thread_not_found: "Slack cannot find this thread. Use the parent message's thread_ts or ts from history.",
  is_archived: "This Slack channel is archived.",
  restricted_action: "Workspace policy prevents this Slack action. Ask your Slack administrator.",
  no_permission: "Slack denied access. Check workspace policy and channel membership.",
  msg_too_long: "The reply is too long for Slack. Shorten the draft and approve it again.",
  no_text: "Write a reply before approving Send.",
};
export class SlackError extends PluginCliError {
  constructor(code: string, message: string, readonly certain = false, readonly retryAfter?: number) {
    super(message, { code });
  }
}
export function safeError(error: unknown): SlackError {
  return error instanceof SlackError ? error : new SlackError("slack_unavailable", "Slack could not complete the request. Check the connection and try again.");
}
const channelSchema = z.object({ id: channelId, name: z.string().max(200), is_private: z.boolean().optional(), is_ext_shared: z.boolean().optional(), is_member: z.boolean().optional(), is_archived: z.boolean().optional() });
export type Channel = z.infer<typeof channelSchema>;
const messageSchema = z.object({
  ts: timestamp, text: z.string().optional().default(""), user: z.string().optional(), bot_id: z.string().optional(),
  thread_ts: timestamp.optional(), reply_count: z.number().optional(), subtype: z.string().optional(),
  client_msg_id: z.string().optional(), permalink: z.string().optional(), channel: z.object({ id: z.string().max(40), name: z.string().max(200) }).optional(),
}).transform(({ text, ...message }) => ({ ...message, text: text.slice(0, 6000), truncated: text.length > 6000 }));
const messageList = z.array(messageSchema).max(15);
export type Message = z.infer<typeof messageSchema>;
const metadata = z.object({ next_cursor: z.string().max(2000).optional() }).optional();

export class SlackClient {
  constructor(private readonly token: string, private readonly fetcher: typeof fetch = globalThis.fetch, private readonly mockUrl?: string) {}
  private base() {
    if (!this.mockUrl) return "https://slack.com/api/";
    const url = new URL(this.mockUrl);
    if (url.protocol !== "http:" || url.hostname !== "127.0.0.1" || url.username || url.password || this.token !== "xoxp-fake-slack") {
      throw new SlackError("unsafe_mock", "The fake Slack API accepts only the fake token on IPv4 loopback.", true);
    }
    return `${url.origin}/api/`;
  }
  private async call(method: string, params: Record<string, unknown> = {}, signal?: AbortSignal): Promise<{ data: unknown; granted: string[] }> {
    const posting = method === "chat.postMessage";
    const body = posting ? JSON.stringify(params) : new URLSearchParams(Object.entries(params).filter(([, value]) => value !== undefined).map(([key, value]) => [key, String(value)]));
    let response: Response;
    try {
      response = await this.fetcher(`${this.base()}${method}`, {
        method: "POST", redirect: "error", headers: { Authorization: `Bearer ${this.token}`, "Content-Type": posting ? "application/json; charset=utf-8" : "application/x-www-form-urlencoded" },
        body, signal: signal ? AbortSignal.any([signal, AbortSignal.timeout(15_000)]) : AbortSignal.timeout(15_000),
      });
    } catch (error) { throw safeError(error); }
    if (response.status === 429) {
      const seconds = Number(response.headers.get("retry-after"));
      const retryAfter = Number.isFinite(seconds) && seconds > 0 ? Math.ceil(Math.min(seconds, 86400)) : 60;
      throw new SlackError("rate_limited", `Slack rate limit reached. Wait ${retryAfter} seconds before trying again.`, true, retryAfter);
    }
    if (!response.ok) throw new SlackError("slack_http_error", "Slack returned an unexpected HTTP response. Check the outcome before retrying a send.");
    let data: Record<string, unknown>;
    try {
      const reader = response.body?.getReader();
      if (!reader) throw new Error();
      const parts: Uint8Array[] = []; let size = 0;
      while (true) { const part = await reader.read(); if (part.done) break; size += part.value.byteLength; if (size > 2_000_000) { await reader.cancel(); throw new Error(); } parts.push(part.value); }
      data = JSON.parse(Buffer.concat(parts).toString("utf8"));
      if (!data || typeof data !== "object") throw new Error();
    } catch { throw new SlackError("slack_response_invalid", "Slack returned an unreadable response. Check the outcome before retrying a send."); }
    if (data.ok !== true) {
      const code = typeof data.error === "string" && Object.hasOwn(failures, data.error) ? data.error : "slack_rejected";
      // Unknown Slack errors (including internal_error) may follow a committed write.
      throw new SlackError(code, failures[code] ?? "Slack returned an unexpected error. Check the outcome before retrying a send.", code !== "slack_rejected");
    }
    return { data, granted: (response.headers.get("x-oauth-scopes") ?? "").split(",").map(s => s.trim()).filter(Boolean) };
  }
  async identity(signal?: AbortSignal) {
    const { data, granted } = await this.call("auth.test", {}, signal);
    const parsed = identitySchema.extend({ bot_id: z.string().optional() }).safeParse(data);
    if (!parsed.success || parsed.data.bot_id) throw new SlackError("user_token_required", "Connect a Slack User OAuth Token so replies use the identity you approve.", true);
    return { ...identitySchema.parse(parsed.data), missingScopes: scopes.filter(s => !granted.includes(s)) };
  }
  async channels(cursor?: string, limit = 100, signal?: AbortSignal) {
    const { data } = await this.call("conversations.list", { types: "public_channel,private_channel", exclude_archived: true, limit, ...(cursor ? { cursor } : {}) }, signal);
    const value = z.object({ channels: z.array(channelSchema).max(100), response_metadata: metadata }).parse(data);
    return { channels: value.channels, nextCursor: value.response_metadata?.next_cursor ?? "" };
  }
  async info(channel: string, signal?: AbortSignal): Promise<Channel> {
    return z.object({ channel: channelSchema }).parse((await this.call("conversations.info", { channel }, signal)).data).channel;
  }
  async messages(channel: string, options: { thread?: string; cursor?: string; limit?: number; oldest?: string; latest?: string } = {}, signal?: AbortSignal) {
    const { thread, ...page } = options;
    const { data } = await this.call(thread ? "conversations.replies" : "conversations.history", { channel, limit: 15, ...page, ...(thread ? { ts: thread } : {}) }, signal);
    const value = z.object({ messages: messageList, has_more: z.boolean().optional(), response_metadata: metadata }).parse(data);
    return { messages: value.messages, hasMore: value.has_more ?? false, nextCursor: value.response_metadata?.next_cursor ?? "" };
  }
  async search(query: string, page = 1, signal?: AbortSignal) {
    const { data } = await this.call("search.messages", { query, page, count: 15, sort: "timestamp", sort_dir: "desc", highlight: false }, signal);
    const value = z.object({ messages: z.object({ matches: messageList, paging: z.object({ page: z.number(), pages: z.number(), total: z.number() }) }) }).parse(data);
    return { messages: value.messages.matches, ...value.messages.paging };
  }
  async post(channel: string, text: string, attemptId: string, thread?: string) {
    const { data } = await this.call("chat.postMessage", { channel, text, client_msg_id: attemptId, ...(thread ? { thread_ts: thread } : {}), mrkdwn: false, parse: "none", link_names: false, unfurl_links: false, unfurl_media: false });
    const result = z.object({ channel: channelId, ts: timestamp }).safeParse(data);
    if (!result.success || result.data.channel !== channel) throw new SlackError("slack_response_invalid", "Slack did not return a verifiable message receipt. Check the outcome before retrying.");
    return result.data;
  }
}
