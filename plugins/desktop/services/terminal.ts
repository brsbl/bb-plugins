/** bb terminal sessions behind Command Prompt windows and thread terminal tabs. */
export const SESSION_KEY = "bb-desktop:command-prompt";

export type CommandPromptTarget = { kind: "host"; hostId: string } | { kind: "thread"; threadId: string };

interface StoredSession {
  terminalId: string;
  hostId: string;
}

export interface TerminalSession {
  id: string;
  hostId: string;
  status: "starting" | "running" | "disconnected" | "exited";
}

export function threadTerminalSessionKey(tabId: string): string {
  return `bb-desktop:thread-terminal:${tabId}`;
}

function readStored(sessionKey: string): StoredSession | null {
  try {
    const parsed: unknown = JSON.parse(localStorage.getItem(sessionKey) ?? "null");
    if (typeof parsed !== "object" || parsed === null) return null;
    const record = parsed as Record<string, unknown>;
    return typeof record.terminalId === "string" && typeof record.hostId === "string"
      ? { terminalId: record.terminalId, hostId: record.hostId }
      : null;
  } catch {
    return null;
  }
}

function isSession(value: unknown): value is TerminalSession {
  if (typeof value !== "object" || value === null) return false;
  const record = value as Record<string, unknown>;
  return typeof record.id === "string" && typeof record.hostId === "string" && typeof record.status === "string";
}

async function api(path: string, init?: RequestInit): Promise<unknown> {
  const response = await fetch(`/api/v1${path}`, {
    ...init,
    credentials: "same-origin",
    headers: { "content-type": "application/json", ...init?.headers },
  });
  const body: unknown = await response.json().catch(() => null);
  if (!response.ok) {
    const message = (body as { error?: { message?: unknown }; message?: unknown } | null)?.error?.message ?? (body as { message?: unknown } | null)?.message;
    throw new Error(typeof message === "string" ? message : `Request failed (${response.status})`);
  }
  return body;
}

export async function openSession(target: CommandPromptTarget, sessionKey: string, cols: number, rows: number): Promise<TerminalSession> {
  const stored = readStored(sessionKey);
  if (stored !== null && (target.kind !== "host" || stored.hostId === target.hostId)) {
    const existing = await api(`/terminals/${encodeURIComponent(stored.terminalId)}`).catch(() => null);
    if (isSession(existing) && (existing.status === "running" || existing.status === "starting")) return existing;
  }
  const created = await api("/terminals", {
    method: "POST",
    body: JSON.stringify({
      cols,
      rows,
      start: { mode: "shell" },
      target: target.kind === "host" ? { kind: "host_path", hostId: target.hostId, cwd: null } : { kind: "thread", threadId: target.threadId },
      title: "Command Prompt",
    }),
  });
  if (!isSession(created)) throw new Error("bb returned an unexpected terminal");
  localStorage.setItem(sessionKey, JSON.stringify({ terminalId: created.id, hostId: created.hostId }));
  return created;
}

export function closeCommandPromptSession(sessionKey = SESSION_KEY) {
  const stored = readStored(sessionKey);
  localStorage.removeItem(sessionKey);
  if (stored === null) return;
  void api(`/terminals/${encodeURIComponent(stored.terminalId)}/close`, {
    method: "POST",
    body: JSON.stringify({ mode: "force", reason: "user" }),
  }).catch(() => undefined);
}
