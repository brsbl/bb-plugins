import type { GoogleEvent } from "./events.js";

// Read-only Google Calendar v3 over an injected fetch. Scope: calendar.events.readonly.

export const REQUEST_TIMEOUT = 20_000;

export interface GoogleEndpoints {
  apiBase: string;
  tokenUrl: string;
}

export const GOOGLE_ENDPOINTS: GoogleEndpoints = {
  apiBase: "https://www.googleapis.com/calendar/v3",
  tokenUrl: "https://oauth2.googleapis.com/token",
};

export interface Credentials {
  clientId?: string;
  clientSecret?: string;
  refreshToken?: string;
}

export class GoogleError extends Error {
  constructor(message: string, readonly status: number | null = null) {
    super(message);
    this.name = "GoogleError";
  }
}

interface EventPage {
  items?: GoogleEvent[];
  nextPageToken?: string;
}

export interface GoogleClientOptions {
  fetch: typeof fetch;
  endpoints: GoogleEndpoints;
  now(): number;
  credentials(): Promise<Credentials>;
}

export type GoogleClient = ReturnType<typeof createGoogleClient>;

export function createGoogleClient(options: GoogleClientOptions) {
  let token: { value: string; expiresAt: number } | null = null;

  async function call(url: string, init: RequestInit): Promise<Response> {
    try {
      return await options.fetch(url, { ...init, signal: AbortSignal.timeout(REQUEST_TIMEOUT) });
    } catch {
      throw new GoogleError("Google is unreachable");
    }
  }

  async function accessToken(): Promise<string> {
    if (token && token.expiresAt > options.now() + 60_000) return token.value;
    const credentials = await options.credentials();
    if (!credentials.clientId || !credentials.clientSecret || !credentials.refreshToken) {
      throw new GoogleError("Set the Google client ID, client secret and refresh token in Calendar settings");
    }
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
      throw new GoogleError(body.error === "invalid_grant" ? "Google access was revoked or expired" : `Google sign-in failed (${response.status})`, response.status);
    }
    token = { value: body.access_token, expiresAt: options.now() + (body.expires_in ?? 3600) * 1000 };
    return token.value;
  }

  async function get<T>(path: string, query: Record<string, string | undefined> = {}, retried = false): Promise<T | null> {
    const url = new URL(`${options.endpoints.apiBase}${path}`);
    for (const [key, value] of Object.entries(query)) if (value !== undefined) url.searchParams.set(key, value);
    const response = await call(url.toString(), { headers: { authorization: `Bearer ${await accessToken()}`, accept: "application/json" } });
    if (response.status === 401 && !retried) {
      token = null;
      return get<T>(path, query, true);
    }
    if (response.status === 404 || response.status === 410) return null;
    if (!response.ok) throw new GoogleError(`Google Calendar returned ${response.status}`, response.status);
    return (await response.json()) as T;
  }

  const calendarPath = (calendarId: string) => `/calendars/${encodeURIComponent(calendarId)}/events`;

  return {
    /** Every event, expanded to instances, that ends after `timeMin` and starts before `timeMax`. Null when the calendar can't be found. */
    async listEvents(calendarId: string, timeMin: number, timeMax: number): Promise<GoogleEvent[] | null> {
      const items: GoogleEvent[] = [];
      let pageToken: string | undefined;
      do {
        const page = await get<EventPage>(calendarPath(calendarId), {
          timeMin: new Date(timeMin).toISOString(),
          timeMax: new Date(timeMax).toISOString(),
          singleEvents: "true",
          showDeleted: "false",
          maxResults: "250",
          pageToken,
        });
        if (!page) return null;
        items.push(...(page.items ?? []));
        pageToken = page.nextPageToken;
      } while (pageToken);
      return items;
    },
    /** The event, or null when Google says it no longer exists. */
    getEvent: (calendarId: string, eventId: string) => get<GoogleEvent>(`${calendarPath(calendarId)}/${encodeURIComponent(eventId)}`),
  };
}
