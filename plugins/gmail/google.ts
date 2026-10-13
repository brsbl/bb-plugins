import { createHash, randomBytes } from "node:crypto";
import type { GmailMessage } from "./model.js";

// compose already includes sending; no redundant send or mailbox-modification scope.
export const SCOPES = ["https://www.googleapis.com/auth/gmail.readonly", "https://www.googleapis.com/auth/gmail.compose"];
export const REDIRECT = "http://127.0.0.1:53683/";
export const GOOGLE = { api: "https://gmail.googleapis.com/gmail/v1/users/me", auth: "https://accounts.google.com/o/oauth2/v2/auth", token: "https://oauth2.googleapis.com/token" };
export type Endpoints = typeof GOOGLE;
export type Credentials = { clientId?: string; clientSecret?: string; refreshToken?: string };
export class GmailError extends Error {
  constructor(readonly code: string, message: string, readonly uncertain = false) { super(message); }
}
export function pkce() {
  const verifier = randomBytes(32).toString("base64url");
  return { verifier, state: randomBytes(24).toString("base64url"), challenge: createHash("sha256").update(verifier).digest("base64url") };
}
export function authUrl(endpoints: Endpoints, clientId: string, challenge: string, state: string) {
  const url = new URL(endpoints.auth);
  url.search = new URLSearchParams({ client_id: clientId, redirect_uri: REDIRECT, response_type: "code", scope: SCOPES.join(" "), code_challenge: challenge, code_challenge_method: "S256", state, access_type: "offline", prompt: "consent" }).toString();
  return url.toString();
}
export async function tokenRequest(fetchFn: typeof fetch, endpoints: Endpoints, values: Record<string, string>) {
  let response: Response;
  try { response = await fetchFn(endpoints.token, { method: "POST", headers: { "content-type": "application/x-www-form-urlencoded" }, body: new URLSearchParams(values).toString(), signal: AbortSignal.timeout(20_000), redirect: "error" }); }
  catch { throw new GmailError("unavailable", "Google sign-in is unavailable. Try again."); }
  // Never surface Google's error bodies: they can echo credentials or authorization codes.
  if (!response.ok) throw new GmailError(response.status === 400 || response.status === 401 ? "reconnect" : "unavailable", "Google rejected sign-in. Connect Gmail again.");
  const body = await response.json().catch(() => null) as { access_token?: string; refresh_token?: string; expires_in?: number; scope?: string } | null;
  if (!body?.access_token) throw new GmailError("reconnect", "Google did not return an access token. Connect Gmail again.");
  return body as { access_token: string; refresh_token?: string; expires_in?: number; scope?: string };
}
export function createGoogle(options: { fetch: typeof fetch; credentials(): Promise<Credentials>; endpoints?: Endpoints; now?: () => number }) {
  const endpoints = options.endpoints ?? GOOGLE, now = options.now ?? Date.now;
  let cached: { value: string; expires: number } | null = null;
  let refreshing: Promise<string> | null = null;
  const access = async () => {
    if (cached && cached.expires > now() + 60_000) return cached.value;
    if (refreshing) return refreshing;
    refreshing = (async () => {
      const c = await options.credentials();
      if (!c.clientId || !c.clientSecret || !c.refreshToken) throw new GmailError("reconnect", "Connect Gmail in the Gmail page first.");
      const t = await tokenRequest(options.fetch, endpoints, { grant_type: "refresh_token", client_id: c.clientId, client_secret: c.clientSecret, refresh_token: c.refreshToken });
      cached = { value: t.access_token, expires: now() + (t.expires_in ?? 3600) * 1000 };
      return cached.value;
    })();
    try { return await refreshing; } finally { refreshing = null; }
  };
  const request = async <T>(method: string, path: string, body?: unknown, query?: Record<string, string>, retry = false): Promise<T> => {
    const url = new URL(`${endpoints.api}${path}`);
    for (const [key, value] of Object.entries(query ?? {})) url.searchParams.set(key, value);
    const token = await access();
    let response: Response;
    try { response = await options.fetch(url, { method, headers: { authorization: `Bearer ${token}`, "content-type": "application/json" }, ...(body === undefined ? {} : { body: JSON.stringify(body) }), signal: AbortSignal.timeout(20_000), redirect: "error" }); }
    catch { throw new GmailError("unavailable", method === "GET" ? "Gmail is unreachable." : "Gmail's response was lost. Check the outcome before trying again.", method !== "GET"); }
    if (response.status === 401) {
      cached = null;
      if (method === "GET" && !retry) return request(method, path, body, query, true);
      throw new GmailError("reconnect", "Gmail access expired. Connect Gmail again.");
    }
    if (!response.ok) throw new GmailError(`http_${response.status}`, `Gmail returned ${response.status}.`, method !== "GET" && response.status >= 500);
    const result = await response.json().catch(() => null);
    if (result === null) throw new GmailError("unavailable", "Gmail's response was incomplete. Check the outcome before trying again.", method !== "GET");
    return result as T;
  };
  return {
    clear: () => { cached = null; },
    search: (q: string, max: number, pageToken?: string) => request<{ messages?: { id: string; threadId: string }[]; nextPageToken?: string; resultSizeEstimate?: number }>("GET", "/messages", undefined, { q, maxResults: String(max), ...(pageToken ? { pageToken } : {}) }),
    message: (id: string) => request<GmailMessage>("GET", `/messages/${encodeURIComponent(id)}`, undefined, { format: "full" }),
    thread: (id: string) => request<{ id: string; messages?: GmailMessage[] }>("GET", `/threads/${encodeURIComponent(id)}`, undefined, { format: "full" }),
    profile: () => request<{ emailAddress: string }>("GET", "/profile"),
    draft: (message: { raw: string; threadId?: string }, id?: string) => request<{ id: string; message: { id: string; threadId: string } }>(id ? "PUT" : "POST", `/drafts${id ? `/${encodeURIComponent(id)}` : ""}`, { message }),
    send: (message: { raw: string; threadId?: string }) => request<{ id: string; threadId: string }>("POST", "/messages/send", message),
  };
}
