/** bb terminal sessions behind Terminal windows and thread terminal tabs. */
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

interface Opening {
  session: Promise<TerminalSession>;
  /** Its window closed while it was starting: it must not become the stored session, and it closes once it exists. */
  state: { abandoned: boolean };
}

const opening = new Map<string, Opening>();

function closeTerminal(terminalId: string) {
  void api(`/terminals/${encodeURIComponent(terminalId)}/close`, {
    method: "POST",
    body: JSON.stringify({ mode: "force", reason: "user" }),
  }).catch(() => undefined);
}

/**
 * Reuses the window's stored terminal or creates one. A second call for the same key while the first is
 * still creating, as React's StrictMode remount does, shares that request instead of creating a second terminal.
 */
export function openSession(target: CommandPromptTarget, sessionKey: string, cols: number, rows: number): Promise<TerminalSession> {
  const pending = opening.get(sessionKey);
  if (pending !== undefined) return pending.session;
  const state = { abandoned: false };
  const session = reuseOrCreate(target, sessionKey, cols, rows, state).finally(() => {
    if (opening.get(sessionKey)?.session === session) opening.delete(sessionKey);
  });
  opening.set(sessionKey, { session, state });
  return session;
}

async function reuseOrCreate(
  target: CommandPromptTarget,
  sessionKey: string,
  cols: number,
  rows: number,
  state: Opening["state"],
): Promise<TerminalSession> {
  const stored = readStored(sessionKey);
  if (stored !== null) {
    const sameHost = target.kind !== "host" || stored.hostId === target.hostId;
    const existing = sameHost ? await api(`/terminals/${encodeURIComponent(stored.terminalId)}`).catch(() => null) : null;
    if (isSession(existing) && (existing.status === "running" || existing.status === "starting")) return existing;
    // The window now targets another machine, or its terminal disconnected: close it rather than leave it running.
    if (!(isSession(existing) && existing.status === "exited")) closeTerminal(stored.terminalId);
  }
  const created = await api("/terminals", {
    method: "POST",
    body: JSON.stringify({
      cols,
      rows,
      start: { mode: "shell" },
      target: target.kind === "host" ? { kind: "host_path", hostId: target.hostId, cwd: null } : { kind: "thread", threadId: target.threadId },
      title: "Terminal",
    }),
  });
  if (!isSession(created)) throw new Error("bb returned an unexpected terminal");
  if (!state.abandoned) localStorage.setItem(sessionKey, JSON.stringify({ terminalId: created.id, hostId: created.hostId }));
  return created;
}

export function closeCommandPromptSession(sessionKey = SESSION_KEY) {
  const pending = opening.get(sessionKey);
  if (pending !== undefined) {
    // The window closed while its terminal was still starting. Close that terminal once it exists, and let a window
    // reopened meanwhile start its own instead of sharing, and then losing, this one.
    pending.state.abandoned = true;
    opening.delete(sessionKey);
    void pending.session.then((session) => closeTerminal(session.id), () => undefined);
  }
  const stored = readStored(sessionKey);
  localStorage.removeItem(sessionKey);
  if (stored !== null) closeTerminal(stored.terminalId);
}

const RECONNECT_DELAYS_MS = [100, 250, 500, 1_000, 2_000];
const HEARTBEAT_INTERVAL_MS = 15_000;
const HEARTBEAT_TIMEOUT_MS = 45_000;
const INPUT_QUEUE_LIMIT = 1024 * 1024;
const ENDED_CODES = new Set(["terminal_exited", "terminal_not_found", "terminal_not_running"]);

export interface TerminalConnection {
  sendInput(dataBase64: string): void;
  sendResize(cols: number, rows: number): void;
  dispose(): void;
}

/**
 * A terminal socket that behaves like bb's own: it reconnects after a drop, resumes from the next output sequence so
 * nothing replays twice, pings to notice a dead connection, and holds typed input until the socket is open again.
 */
export function connectTerminal(
  terminalId: string,
  handlers: {
    onOutput(dataBase64: string): void;
    onEnded(): void;
    onError(message: string): void;
    onReconnecting(): void;
    onReconnected(): void;
  },
): TerminalConnection {
  const scheme = window.location.protocol === "https:" ? "wss" : "ws";
  let socket: WebSocket | null = null;
  let nextSeq = 0;
  let attempt = 0;
  let ended = false;
  let disposed = false;
  let dropped = false;
  let lastPong = 0;
  let resize: { cols: number; rows: number } | null = null;
  let queued: string[] = [];
  let queuedBytes = 0;
  let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  let heartbeat: ReturnType<typeof setInterval> | null = null;

  const send = (payload: object) => {
    if (socket?.readyState !== WebSocket.OPEN) return false;
    socket.send(JSON.stringify(payload));
    return true;
  };

  const stopHeartbeat = () => {
    if (heartbeat !== null) clearInterval(heartbeat);
    heartbeat = null;
  };

  const end = () => {
    ended = true;
    if (reconnectTimer !== null) clearTimeout(reconnectTimer);
    handlers.onEnded();
  };

  const connect = () => {
    if (disposed || ended) return;
    const current = new WebSocket(`${scheme}://${window.location.host}/ws/terminals/${encodeURIComponent(terminalId)}?sinceSeq=${nextSeq}`);
    socket = current;
    current.addEventListener("open", () => {
      if (socket !== current) return;
      attempt = 0;
      lastPong = Date.now();
      if (dropped) handlers.onReconnected();
      dropped = false;
      if (resize !== null) send({ type: "resize", ...resize });
      for (const payload of queued) current.send(payload);
      queued = [];
      queuedBytes = 0;
      stopHeartbeat();
      heartbeat = setInterval(() => {
        if (socket !== current || current.readyState !== WebSocket.OPEN) return;
        if (Date.now() - lastPong > HEARTBEAT_TIMEOUT_MS) current.close(4000, "heartbeat-timeout");
        else send({ type: "ping" });
      }, HEARTBEAT_INTERVAL_MS);
    });
    current.addEventListener("message", (event) => {
      if (socket !== current) return;
      let message: { type?: unknown; code?: unknown; message?: unknown; replayStartSeq?: unknown; chunk?: { seq?: unknown; dataBase64?: unknown } };
      try {
        message = JSON.parse(String(event.data));
      } catch {
        return;
      }
      if (message.type === "pong") lastPong = Date.now();
      else if (message.type === "attached" && typeof message.replayStartSeq === "number") nextSeq = Math.max(nextSeq, message.replayStartSeq);
      else if (message.type === "output" && typeof message.chunk?.dataBase64 === "string") {
        const seq = typeof message.chunk.seq === "number" ? message.chunk.seq : nextSeq;
        if (seq < nextSeq) return;
        nextSeq = seq + 1;
        handlers.onOutput(message.chunk.dataBase64);
      } else if (message.type === "exited") end();
      else if (message.type === "error") {
        if (typeof message.code === "string" && ENDED_CODES.has(message.code)) end();
        else handlers.onError(typeof message.message === "string" ? message.message : "The terminal connection failed.");
      }
    });
    current.addEventListener("close", () => {
      if (socket !== current) return;
      socket = null;
      stopHeartbeat();
      if (disposed || ended || reconnectTimer !== null) return;
      if (!dropped) handlers.onReconnecting();
      dropped = true;
      const delay = RECONNECT_DELAYS_MS[Math.min(attempt, RECONNECT_DELAYS_MS.length - 1)];
      attempt += 1;
      reconnectTimer = setTimeout(() => {
        reconnectTimer = null;
        connect();
      }, delay);
    });
  };

  connect();
  return {
    sendInput(dataBase64) {
      const payload = JSON.stringify({ type: "input", dataBase64 });
      if (queued.length === 0 && socket?.readyState === WebSocket.OPEN) socket.send(payload);
      else if (queuedBytes + payload.length <= INPUT_QUEUE_LIMIT) {
        queued.push(payload);
        queuedBytes += payload.length;
      }
    },
    sendResize(cols, rows) {
      if (resize?.cols === cols && resize.rows === rows) return;
      resize = { cols, rows };
      send({ type: "resize", cols, rows });
    },
    dispose() {
      disposed = true;
      if (reconnectTimer !== null) clearTimeout(reconnectTimer);
      stopHeartbeat();
      socket?.close();
      socket = null;
    },
  };
}
