import { scopes } from "./schemas.js";
/** Fake data only. Used by remote tests and an isolated development server. */
export function createFakeSlack() {
  const channel = { id: "CDEMO01", name: "partner-demo", is_private: true, is_ext_shared: true, is_member: true, is_archived: false };
  const identity = { team_id: "TDEMO01", user_id: "UDEMO01", team: "Demo workspace", user: "demo-user" };
  const messages = [
    { ts: "1791840000.000001", user: "UDEMO02", text: "Can we review the shared project on Friday?", reply_count: 1 },
    { ts: "1791840001.000002", thread_ts: "1791840000.000001", user: "UDEMO03", text: "Friday works. Please send the agenda here." },
  ];
  const posts: Record<string, unknown>[] = [];
  const requests: { method: string; params: Record<string, unknown> }[] = [];
  let failure: "reject" | "timeout" | "rate" | "report" | null = null;
  const fetcher: typeof fetch = async (input, init) => {
    const method = String(input).split("/").at(-1)!;
    const body = String(init?.body ?? "");
    const params = body.startsWith("{") ? JSON.parse(body) : Object.fromEntries(new URLSearchParams(body));
    requests.push({ method, params });
    const json = (value: unknown) => new Response(JSON.stringify(value), { headers: { "content-type": "application/json", "x-oauth-scopes": scopes.join(",") } });
    if (method === "auth.test") return json({ ok: true, ...identity });
    if (method === "conversations.list") return json({ ok: true, channels: params.cursor ? [] : [channel], response_metadata: { next_cursor: params.cursor ? "" : "page-two" } });
    if (method === "conversations.info") return json({ ok: true, channel });
    if (method === "conversations.history" || method === "conversations.replies") return json({ ok: true, messages: [...messages, ...posts.map(p => ({ ...p, user: identity.user_id }))], has_more: false, response_metadata: { next_cursor: "" } });
    if (method === "search.messages") return json({ ok: true, messages: { matches: messages.map(m => ({ ...m, channel })), paging: { page: Number(params.page), pages: 1, total: 2 } } });
    if (method === "chat.postMessage") {
      if (failure === "rate") return new Response("", { status: 429, headers: { "retry-after": "5" } });
      if (failure === "reject") return json({ ok: false, error: "not_in_channel" });
      const post = { ...params, ts: `1791840010.${String(posts.length + 1).padStart(6, "0")}` }; posts.push(post);
      if (failure === "timeout") throw new Error("Fake lost response after Slack accepted the message");
      return json({ ok: true, channel: params.channel, ts: post.ts });
    }
    return json({ ok: false, error: "unknown_method" });
  };
  return { fetch: fetcher, channel, identity, messages, posts, requests, fail: (value: typeof failure) => { failure = value; } };
}
