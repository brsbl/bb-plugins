import type { GmailEndpoints } from "./gmail.js";
import type { GmailMessage, GmailPart } from "./mail.js";

// An in-memory Gmail for tests and dev QA. Nothing here talks to Google. It records every request, so tests can
// assert that the plugin only ever reads.

export interface FakeMailInput {
  id?: string;
  from: string;
  subject: string;
  text?: string;
  html?: string;
  messageId?: string;
  /** Epoch ms; defaults to the fake's clock. */
  receivedMs?: number;
  unread?: boolean;
  attachments?: string[];
  labels?: string[];
}

export interface FakeRequest {
  method: string;
  path: string;
  query: string;
}

const refreshTokenFor = (account: string) => `fake-refresh-${account}`;
const encode = (text: string) => Buffer.from(text, "utf8").toString("base64url");

export function createFakeGmail(base = "https://fake-gmail.test", clock: () => number = () => Date.now()) {
  const endpoints: GmailEndpoints = { apiBase: `${base}/gmail/v1`, tokenUrl: `${base}/token` };
  const accounts = new Map<string, { messages: Map<string, GmailMessage>; sentTo: Set<string> }>();
  const revoked = new Set<string>();
  const requests: FakeRequest[] = [];
  let next = 1;
  const json = (status: number, body: unknown) => new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } });
  const account = (address: string) => {
    let entry = accounts.get(address);
    if (!entry) accounts.set(address, (entry = { messages: new Map(), sentTo: new Set() }));
    return entry;
  };

  function matches(message: GmailMessage, q: string): boolean {
    const after = q.match(/after:(\d+)/);
    if (after && Number(message.internalDate) < Number(after[1]) * 1000) return false;
    if (/in:inbox/.test(q) && !message.labelIds?.includes("INBOX")) return false;
    return true;
  }

  async function handle(input: Parameters<typeof fetch>[0], init?: RequestInit): Promise<Response> {
    const url = new URL(typeof input === "string" ? input : input instanceof URL ? input.toString() : input.url);
    const method = (init?.method ?? "GET").toUpperCase();
    requests.push({ method, path: url.pathname, query: url.search });
    if (url.toString().startsWith(endpoints.tokenUrl)) {
      const form = new URLSearchParams(String(init?.body ?? ""));
      const owner = [...accounts.keys()].find((address) => refreshTokenFor(address) === form.get("refresh_token"));
      if (!owner || revoked.has(owner)) return json(400, { error: "invalid_grant" });
      return json(200, { access_token: `fake-access:${owner}`, expires_in: 3600 });
    }
    const owner = new Headers(init?.headers).get("authorization")?.match(/^Bearer fake-access:(.+)$/)?.[1];
    if (!owner || revoked.has(owner)) return json(401, { error: { message: "Invalid credentials" } });
    const entry = account(owner);
    if (method !== "GET") return json(405, { error: { message: "Read-only fake" } });
    const list = url.pathname.match(/\/gmail\/v1\/users\/me\/messages$/);
    if (list) {
      const q = url.searchParams.get("q") ?? "";
      const sentTo = q.match(/in:sent to:(\S+)/)?.[1];
      if (sentTo) return json(200, entry.sentTo.has(sentTo.toLowerCase()) ? { messages: [{ id: `sent-${sentTo}`, threadId: `sent-${sentTo}` }] } : {});
      const max = Number(url.searchParams.get("maxResults") ?? 100);
      const all = [...entry.messages.values()].filter((message) => matches(message, q)).sort((a, b) => Number(b.internalDate) - Number(a.internalDate));
      const start = Number(url.searchParams.get("pageToken") ?? 0);
      const page = all.slice(start, start + max);
      return json(200, { messages: page.map(({ id, threadId }) => ({ id, threadId })), ...(start + max < all.length ? { nextPageToken: String(start + max) } : {}) });
    }
    const get = url.pathname.match(/\/gmail\/v1\/users\/me\/messages\/([^/]+)$/);
    if (get) {
      const message = entry.messages.get(decodeURIComponent(get[1]!));
      if (!message) return json(404, { error: { message: "Not found" } });
      if (url.searchParams.get("format") === "metadata") {
        const { payload, ...rest } = message;
        return json(200, { ...rest, payload: { headers: payload?.headers } });
      }
      return json(200, message);
    }
    return json(404, { error: { message: "Not found" } });
  }

  return {
    endpoints,
    fetch: handle as typeof fetch,
    refreshTokenFor,
    addAccount: (address: string) => void account(address),
    put(address: string, input: FakeMailInput): GmailMessage {
      const id = input.id ?? `m${next++}`;
      const parts: GmailPart[] = [];
      if (input.text !== undefined) parts.push({ mimeType: "text/plain", body: { data: encode(input.text) } });
      if (input.html !== undefined) parts.push({ mimeType: "text/html", body: { data: encode(input.html) } });
      for (const name of input.attachments ?? []) parts.push({ mimeType: "application/octet-stream", filename: name, body: { attachmentId: `att-${name}`, size: 10 } });
      const message: GmailMessage = {
        id,
        threadId: `t-${id}`,
        labelIds: input.labels ?? ["INBOX", ...(input.unread === false ? [] : ["UNREAD"])],
        internalDate: String(input.receivedMs ?? clock()),
        payload: {
          mimeType: "multipart/mixed",
          headers: [
            { name: "From", value: input.from },
            { name: "Subject", value: input.subject },
            { name: "Message-ID", value: input.messageId ?? `<${id}@fake.test>` },
          ],
          parts,
        },
      };
      account(address).messages.set(id, message);
      return message;
    },
    /** Record that the account has written to this address. */
    sent: (address: string, to: string) => void account(address).sentTo.add(to.toLowerCase()),
    revoke: (address: string) => void revoked.add(address),
    restore: (address: string) => void revoked.delete(address),
    /** Every message's labels (read state included), per account. */
    labels: () => Object.fromEntries([...accounts].map(([address, entry]) => [address, Object.fromEntries([...entry.messages].map(([id, message]) => [id, [...(message.labelIds ?? [])]]))])),
    requests: () => [...requests],
  };
}

export type FakeGmail = ReturnType<typeof createFakeGmail>;
