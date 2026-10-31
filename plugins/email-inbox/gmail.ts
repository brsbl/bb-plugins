import type { GmailMessage } from "./mail.js";

// Read-only Gmail v1 over an injected fetch. Scope: gmail.readonly. The only calls are users.messages.list and
// users.messages.get, both GET; the one POST is the OAuth token refresh.

export const REQUEST_TIMEOUT = 20_000;

export interface GmailEndpoints {
  apiBase: string;
  tokenUrl: string;
}

export const GMAIL_ENDPOINTS: GmailEndpoints = {
  apiBase: "https://gmail.googleapis.com/gmail/v1",
  tokenUrl: "https://oauth2.googleapis.com/token",
};

export interface Credentials {
  clientId?: string;
  clientSecret?: string;
  refreshToken?: string;
}

export class GmailError extends Error {
  constructor(message: string, readonly status: number | null = null, readonly reconnect = false) {
    super(message);
    this.name = "GmailError";
  }
}

export interface MessageRef {
  id: string;
  threadId: string;
}

interface ListPage {
  messages?: MessageRef[];
  nextPageToken?: string;
}

export interface GmailClientOptions {
  fetch: typeof fetch;
  endpoints: GmailEndpoints;
  now(): number;
  credentials(account: string): Promise<Credentials>;
}

export type GmailClient = ReturnType<typeof createGmailClient>;

export function createGmailClient(options: GmailClientOptions) {
  const tokens = new Map<string, { value: string; expiresAt: number }>();

  async function call(url: string, init: RequestInit): Promise<Response> {
    try {
      return await options.fetch(url, { ...init, signal: AbortSignal.timeout(REQUEST_TIMEOUT) });
    } catch {
      throw new GmailError("Gmail is unreachable");
    }
  }

  async function accessToken(account: string): Promise<string> {
    const cached = tokens.get(account);
    if (cached && cached.expiresAt > options.now() + 60_000) return cached.value;
    const credentials = await options.credentials(account);
    if (!credentials.clientId || !credentials.clientSecret) throw new GmailError("Set the Google client ID and secret in Email settings");
    if (!credentials.refreshToken) throw new GmailError(`No refresh token for ${account} in Email settings`);
    const response = await call(options.endpoints.tokenUrl, {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded", accept: "application/json" },
      body: new URLSearchParams({
        grant_type: "refresh_token",
        refresh_token: credentials.refreshToken,
        client_id: credentials.clientId,
        client_secret: credentials.clientSecret,
      }).toString(),
    });
    const body = (await response.json().catch(() => ({}))) as { access_token?: string; expires_in?: number; error?: string };
    if (!response.ok || !body.access_token) {
      if (body.error === "invalid_grant") throw new GmailError("Google access was revoked or expired", response.status, true);
      throw new GmailError(`Google sign-in failed (${response.status})`, response.status);
    }
    const token = { value: body.access_token, expiresAt: options.now() + (body.expires_in ?? 3600) * 1000 };
    tokens.set(account, token);
    return token.value;
  }

  async function get<T>(account: string, path: string, query: Record<string, string | undefined>, retried = false): Promise<T | null> {
    const url = new URL(`${options.endpoints.apiBase}/users/me${path}`);
    for (const [key, value] of Object.entries(query)) if (value !== undefined) url.searchParams.set(key, value);
    const response = await call(url.toString(), { method: "GET", headers: { authorization: `Bearer ${await accessToken(account)}`, accept: "application/json" } });
    if (response.status === 401 && !retried) {
      tokens.delete(account);
      return get<T>(account, path, query, true);
    }
    if (response.status === 401) throw new GmailError("Gmail refused the account's access", 401, true);
    if (response.status === 404) return null;
    if (!response.ok) {
      const body = (await response.json().catch(() => ({}))) as { error?: { message?: string } };
      throw new GmailError(`Gmail returned ${response.status}${body.error?.message ? `: ${body.error.message}` : ""}`, response.status);
    }
    return (await response.json()) as T;
  }

  return {
    /** Message IDs matching a Gmail search, newest first, up to `max`. */
    async listMessages(account: string, q: string, max: number): Promise<MessageRef[]> {
      const refs: MessageRef[] = [];
      let pageToken: string | undefined;
      do {
        const page = await get<ListPage>(account, "/messages", { q, maxResults: String(Math.min(max - refs.length, 500)), pageToken });
        refs.push(...(page?.messages ?? []));
        pageToken = page?.nextPageToken;
      } while (pageToken && refs.length < max);
      return refs.slice(0, max);
    },
    /** One message (`full` for its text, `metadata` for headers only), or null when it no longer exists. */
    getMessage: (account: string, id: string, format: "full" | "metadata" = "full") =>
      get<GmailMessage>(account, `/messages/${encodeURIComponent(id)}`, { format }),
  };
}
