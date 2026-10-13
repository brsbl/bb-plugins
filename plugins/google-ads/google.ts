import { createHash, randomBytes } from "node:crypto";

export const API_VERSION = "v25";
export const REDIRECT_URI = "http://127.0.0.1:53683/";
export const SCOPE = "https://www.googleapis.com/auth/adwords";
export const MAX_ROWS = 20_000;
export interface Credentials {
  developerToken?: string; loginCustomerId?: string; customerId?: string;
  clientId?: string; clientSecret?: string; refreshToken?: string; downloadConversionActions?: string;
}
export class AdsError extends Error {
  constructor(readonly code: string, message: string) { super(message); }
}
export function customerId(value: string | undefined): string {
  const id = (value ?? "").replace(/-/g, "");
  if (!/^\d{10}$/.test(id)) throw new AdsError("configuration", "Set a ten-digit Google Ads customer ID in Google Ads settings.");
  return id;
}
export const endpoints = {
  api: `https://googleads.googleapis.com/${API_VERSION}`,
  token: "https://oauth2.googleapis.com/token", auth: "https://accounts.google.com/o/oauth2/v2/auth",
};
export function devEndpoints(base?: string): typeof endpoints {
  if (!base) return endpoints;
  if (!/^http:\/\/127\.0\.0\.1:\d+$/.test(base)) throw new AdsError("configuration", "Mock Google must use IPv4 loopback.");
  return { api: `${base}/${API_VERSION}`, token: `${base}/token`, auth: `${base}/auth` };
}
export function createPkce() {
  const verifier = randomBytes(32).toString("base64url");
  return { verifier, challenge: createHash("sha256").update(verifier).digest("base64url"), state: randomBytes(24).toString("base64url"), expiresAt: Date.now() + 600_000 };
}
export function authUrl(clientId: string, pending: ReturnType<typeof createPkce>, urls = endpoints) {
  const url = new URL(urls.auth);
  url.search = new URLSearchParams({ client_id: clientId, redirect_uri: REDIRECT_URI, response_type: "code", scope: SCOPE,
    code_challenge: pending.challenge, code_challenge_method: "S256", state: pending.state, access_type: "offline", prompt: "consent" }).toString();
  return url.toString();
}
export function callbackCode(redirect: string, pending: ReturnType<typeof createPkce>) {
  let url: URL;
  try { url = new URL(redirect); } catch { throw new AdsError("oauth", "Paste the complete address Google redirected to."); }
  if (url.origin + url.pathname !== REDIRECT_URI || url.searchParams.get("state") !== pending.state || Date.now() > pending.expiresAt)
    throw new AdsError("oauth", "That sign-in has expired or belongs to another attempt. Connect again.");
  const code = url.searchParams.get("code");
  if (url.searchParams.has("error") || !code) throw new AdsError("oauth", "Google sign-in was not approved. Connect again.");
  return code;
}
type Json = Record<string, any>;
export type Row = Json;
export function createGoogleClient(getCredentials: () => Promise<Credentials>, fetchFn: typeof fetch = fetch, urls = endpoints) {
  let token: { value: string; expires: number } | undefined;
  let generation = 0;
  async function request(url: string, init: RequestInit, signal?: AbortSignal): Promise<Json> {
    let response: Response;
    try { response = await fetchFn(url, { ...init, redirect: "error", signal: signal ? AbortSignal.any([signal, AbortSignal.timeout(25_000)]) : AbortSignal.timeout(25_000) }); }
    catch { throw new AdsError("unavailable", "Google is unreachable or the request was cancelled. Try again."); }
    // Never include Google's error body: it can contain credentials, queries, IDs or account data.
    if (!response.ok) {
      const code = response.status === 401 ? "reconnect" : response.status === 429 ? "rate_limited" : "google_error";
      throw new AdsError(code, response.status === 401 ? "Reconnect Google Ads." : `Google rejected the request (HTTP ${response.status}). Check access, developer-token approval and account settings.`);
    }
    try { const body = await response.json(); if (!body || typeof body !== "object" || Array.isArray(body)) throw new Error(); return body as Json; }
    catch { throw new AdsError("response", "Google returned an incomplete response. Try again."); }
  }
  async function tokenRequest(form: Record<string, string>, signal?: AbortSignal) {
    const body = await request(urls.token, { method: "POST", headers: { "content-type": "application/x-www-form-urlencoded" }, body: new URLSearchParams(form).toString() }, signal);
    if (typeof body.access_token !== "string") throw new AdsError("reconnect", "Reconnect Google Ads.");
    return body;
  }
  async function accessToken(c: Credentials, signal?: AbortSignal) {
    if (!c.clientId || !c.clientSecret || !c.refreshToken) throw new AdsError("reconnect", "Connect Google Ads first.");
    if (token && token.expires > Date.now() + 60_000) return token.value;
    const started = generation;
    const body = await tokenRequest({ grant_type: "refresh_token", client_id: c.clientId, client_secret: c.clientSecret, refresh_token: c.refreshToken }, signal);
    if (started !== generation) throw new AdsError("configuration", "Google Ads settings changed. Retry the read.");
    token = { value: body.access_token, expires: Date.now() + (Number(body.expires_in) || 3600) * 1000 };
    return token.value;
  }
  async function read(path: string, body?: unknown, signal?: AbortSignal, retry = true): Promise<Json> {
    // Only these two read endpoints exist. OAuth is separate; there is no arbitrary HTTP/GAQL command.
    if (path !== "/customers:listAccessibleCustomers" && !/^\/customers\/\d{10}\/googleAds:search$/.test(path)) throw new AdsError("read_only", "Only Google Ads reads are supported.");
    const c = await getCredentials();
    if (!c.developerToken) throw new AdsError("configuration", "Save the developer token in Google Ads secret settings.");
    const headers: Record<string, string> = { authorization: `Bearer ${await accessToken(c, signal)}`, "developer-token": c.developerToken, "content-type": "application/json" };
    if (c.loginCustomerId && body !== undefined) headers["login-customer-id"] = customerId(c.loginCustomerId);
    try { return await request(`${urls.api}${path}`, { method: body === undefined ? "GET" : "POST", headers, ...(body === undefined ? {} : { body: JSON.stringify(body) }) }, signal); }
    catch (error) { if (error instanceof AdsError && error.code === "reconnect" && retry) { token = undefined; return read(path, body, signal, false); } throw error; }
  }
  return {
    clear() { generation++; token = undefined; },
    async exchange(code: string, verifier: string) {
      const c = await getCredentials();
      if (!c.clientId || !c.clientSecret) throw new AdsError("configuration", "Save the OAuth client ID and client secret first.");
      const body = await tokenRequest({ grant_type: "authorization_code", code, code_verifier: verifier, client_id: c.clientId, client_secret: c.clientSecret, redirect_uri: REDIRECT_URI });
      if (typeof body.refresh_token !== "string" || !body.refresh_token) throw new AdsError("reconnect", "Google did not grant offline access. Connect again and allow access.");
      return body.refresh_token as string;
    },
    async accounts(signal?: AbortSignal) { return read("/customers:listAccessibleCustomers", undefined, signal); },
    async search(id: string, query: string, signal?: AbortSignal): Promise<Row[]> {
      if (!/^SELECT\s/i.test(query) || /\b(?:MUTATE|INSERT|UPDATE|DELETE)\b/i.test(query)) throw new AdsError("read_only", "Only SELECT queries are supported.");
      const rows: Row[] = [], seen = new Set<string>();
      let pageToken: string | undefined;
      do {
        const body = await read(`/customers/${customerId(id)}/googleAds:search`, { query, ...(pageToken ? { pageToken } : {}) }, signal);
        if (body.results !== undefined && !Array.isArray(body.results)) throw new AdsError("response", "Google returned an invalid result page.");
        rows.push(...(body.results ?? []));
        pageToken = body.nextPageToken;
        if (rows.length > MAX_ROWS || (pageToken && (rows.length >= MAX_ROWS || seen.has(pageToken) || seen.size >= 20)))
          throw new AdsError("too_large", "Report exceeds the read limit. Narrow the dates or use --campaign-id; no partial report was returned.");
        if (pageToken) seen.add(pageToken);
      } while (pageToken);
      return rows;
    },
  };
}
export type GoogleClient = ReturnType<typeof createGoogleClient>;
