import { createHash, randomBytes } from "node:crypto";
import type { EventWrite, GoogleEvent } from "./mapping.js";

// Google Calendar v3 REST and OAuth (installed-app flow with PKCE), over an injected fetch.

export const SCOPE = "https://www.googleapis.com/auth/calendar.app.created";
export const REDIRECT_URI = "http://127.0.0.1:53682/";
/** Every Google request gives up after this long and counts as Google being unreachable. */
export const REQUEST_TIMEOUT = 20_000;

export interface GoogleEndpoints {
  apiBase: string;
  authUrl: string;
  tokenUrl: string;
}

export const GOOGLE_ENDPOINTS: GoogleEndpoints = {
  apiBase: "https://www.googleapis.com/calendar/v3",
  authUrl: "https://accounts.google.com/o/oauth2/v2/auth",
  tokenUrl: "https://oauth2.googleapis.com/token",
};

/** Network failure, 5xx, or rate limit: retry later. */
export class GoogleUnavailable extends Error {
  constructor(message: string, readonly rateLimited = false) {
    super(message);
    this.name = "GoogleUnavailable";
  }
}

/** Refresh token revoked or expired: she has to reconnect. */
export class GoogleAuthRevoked extends Error {
  constructor(message = "Google Calendar access was revoked or expired") {
    super(message);
    this.name = "GoogleAuthRevoked";
  }
}

export class GoogleHttpError extends Error {
  constructor(readonly status: number, message: string) {
    super(message);
    this.name = "GoogleHttpError";
  }
}

export interface GoogleCalendar {
  id: string;
  summary?: string;
  timeZone?: string;
}

export interface EventPage {
  items?: GoogleEvent[];
  nextPageToken?: string;
  nextSyncToken?: string;
}

function base64url(buffer: Buffer): string {
  return buffer.toString("base64url");
}

export function createPkce(): { verifier: string; challenge: string; state: string } {
  const verifier = base64url(randomBytes(32));
  return { verifier, challenge: base64url(createHash("sha256").update(verifier).digest()), state: base64url(randomBytes(16)) };
}

export function buildAuthUrl(endpoints: GoogleEndpoints, clientId: string, challenge: string, state: string): string {
  const url = new URL(endpoints.authUrl);
  url.search = new URLSearchParams({
    client_id: clientId,
    redirect_uri: REDIRECT_URI,
    response_type: "code",
    scope: SCOPE,
    code_challenge: challenge,
    code_challenge_method: "S256",
    state,
    access_type: "offline",
    prompt: "consent",
  }).toString();
  return url.toString();
}

interface TokenResponse {
  access_token?: string;
  refresh_token?: string;
  expires_in?: number;
  error?: string;
  error_description?: string;
}

async function postToken(fetchFn: typeof fetch, endpoints: GoogleEndpoints, form: Record<string, string>): Promise<{ status: number; body: TokenResponse }> {
  let response: Response;
  try {
    response = await fetchFn(endpoints.tokenUrl, {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded", accept: "application/json" },
      body: new URLSearchParams(form).toString(),
      signal: AbortSignal.timeout(REQUEST_TIMEOUT),
    });
  } catch {
    throw new GoogleUnavailable("Google sign-in is unreachable");
  }
  if (response.status === 429 || response.status >= 500) throw new GoogleUnavailable("Google sign-in is unavailable", response.status === 429);
  const body = (await response.json().catch(() => ({}))) as TokenResponse;
  return { status: response.status, body };
}

export async function exchangeCode(
  fetchFn: typeof fetch,
  endpoints: GoogleEndpoints,
  input: { clientId: string; clientSecret: string; code: string; verifier: string },
): Promise<{ accessToken: string; refreshToken: string | null; expiresIn: number }> {
  const { status, body } = await postToken(fetchFn, endpoints, {
    grant_type: "authorization_code",
    code: input.code,
    code_verifier: input.verifier,
    client_id: input.clientId,
    client_secret: input.clientSecret,
    redirect_uri: REDIRECT_URI,
  });
  if (status !== 200 || !body.access_token) throw new GoogleHttpError(status, body.error_description ?? body.error ?? "Google rejected the sign-in code");
  return { accessToken: body.access_token, refreshToken: body.refresh_token ?? null, expiresIn: body.expires_in ?? 3600 };
}

export interface GoogleClientOptions {
  fetch: typeof fetch;
  endpoints: GoogleEndpoints;
  now(): Date;
  credentials(): Promise<{ clientId?: string; clientSecret?: string; refreshToken?: string }>;
}

export type GoogleClient = ReturnType<typeof createGoogleClient>;

export function createGoogleClient(options: GoogleClientOptions) {
  const { endpoints } = options;
  let token: { value: string; expiresAt: number } | null = null;

  const accessToken = async (): Promise<string> => {
    if (token && token.expiresAt > options.now().getTime() + 60_000) return token.value;
    const credentials = await options.credentials();
    if (!credentials.clientId || !credentials.clientSecret || !credentials.refreshToken) throw new GoogleAuthRevoked("Not signed in to Google Calendar");
    const { status, body } = await postToken(options.fetch, endpoints, {
      grant_type: "refresh_token",
      refresh_token: credentials.refreshToken,
      client_id: credentials.clientId,
      client_secret: credentials.clientSecret,
    });
    if (status !== 200 || !body.access_token) {
      if (status === 400 || status === 401) throw new GoogleAuthRevoked(body.error === "invalid_grant" ? undefined : body.error_description ?? body.error);
      throw new GoogleHttpError(status, body.error_description ?? "Could not refresh the Google access token");
    }
    token = { value: body.access_token, expiresAt: options.now().getTime() + (body.expires_in ?? 3600) * 1000 };
    return token.value;
  };

  const request = async <T>(
    method: string,
    path: string,
    init: { query?: Record<string, string | undefined>; body?: unknown; ifMatch?: string } = {},
    retried = false,
  ): Promise<T> => {
    const url = new URL(`${endpoints.apiBase}${path}`);
    for (const [key, value] of Object.entries(init.query ?? {})) if (value !== undefined) url.searchParams.set(key, value);
    const headers: Record<string, string> = { authorization: `Bearer ${await accessToken()}`, accept: "application/json" };
    if (init.body !== undefined) headers["content-type"] = "application/json";
    if (init.ifMatch) headers["if-match"] = init.ifMatch;
    let response: Response;
    try {
      response = await options.fetch(url.toString(), {
        method, headers, body: init.body === undefined ? undefined : JSON.stringify(init.body), signal: AbortSignal.timeout(REQUEST_TIMEOUT),
      });
    } catch {
      throw new GoogleUnavailable("Google Calendar is unreachable");
    }
    if (response.status === 401) {
      token = null;
      if (!retried) return request<T>(method, path, init, true);
      throw new GoogleAuthRevoked();
    }
    if (response.status === 429 || response.status >= 500) throw new GoogleUnavailable("Google Calendar is unavailable", response.status === 429);
    if (response.status === 204) return undefined as T;
    const body = (await response.json().catch(() => null)) as { error?: { message?: string; errors?: { reason?: string }[] } } | null;
    if (!response.ok) {
      const reason = body?.error?.errors?.[0]?.reason;
      if (response.status === 403 && (reason === "rateLimitExceeded" || reason === "userRateLimitExceeded")) {
        throw new GoogleUnavailable("Google Calendar rate-limited bb", true);
      }
      throw new GoogleHttpError(response.status, body?.error?.message ?? `Google Calendar returned ${response.status}`);
    }
    // A success whose body never arrived (timeout mid-read) is retried like any unreachable request.
    if (body === null) throw new GoogleUnavailable("Google Calendar's response was cut off");
    return body as T;
  };

  const calendarPath = (calendarId: string) => `/calendars/${encodeURIComponent(calendarId)}`;
  const eventPath = (calendarId: string, eventId: string) => `${calendarPath(calendarId)}/events/${encodeURIComponent(eventId)}`;

  return {
    setAccessToken(value: string, expiresIn: number): void {
      token = { value, expiresAt: options.now().getTime() + expiresIn * 1000 };
    },
    clearAccessToken(): void {
      token = null;
    },
    getCalendar: (calendarId: string) => request<GoogleCalendar>("GET", calendarPath(calendarId)),
    insertCalendar: (body: { summary: string; timeZone: string }) => request<GoogleCalendar>("POST", "/calendars", { body }),
    listEvents: (calendarId: string, query: { syncToken?: string; pageToken?: string }) =>
      request<EventPage>("GET", `${calendarPath(calendarId)}/events`, {
        query: { singleEvents: "false", showDeleted: "true", maxResults: "250", syncToken: query.syncToken, pageToken: query.pageToken },
      }),
    getEvent: (calendarId: string, eventId: string) => request<GoogleEvent>("GET", eventPath(calendarId, eventId)),
    insertEvent: (calendarId: string, body: EventWrite) => request<GoogleEvent>("POST", `${calendarPath(calendarId)}/events`, { body }),
    patchEvent: (calendarId: string, eventId: string, body: EventWrite, etag: string | null) =>
      request<GoogleEvent>("PATCH", eventPath(calendarId, eventId), { body, ifMatch: etag ?? undefined }),
    deleteEvent: (calendarId: string, eventId: string) => request<void>("DELETE", eventPath(calendarId, eventId)),
  };
}
