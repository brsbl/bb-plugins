import { FitAddon } from "@xterm/addon-fit";
import { Terminal } from "@xterm/xterm";
import "@xterm/xterm/css/xterm.css";
import { useEffect, useRef, useState } from "react";

const SESSION_KEY = "bb-desktop:command-prompt";

export type CommandPromptTarget = { kind: "host"; hostId: string } | { kind: "thread"; threadId: string };

interface StoredSession {
  terminalId: string;
  hostId: string;
}

interface TerminalSession {
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

async function openSession(target: CommandPromptTarget, sessionKey: string, cols: number, rows: number): Promise<TerminalSession> {
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

function toBase64(text: string): string {
  let binary = "";
  for (const byte of new TextEncoder().encode(text)) binary += String.fromCharCode(byte);
  return btoa(binary);
}

function fromBase64(data: string): Uint8Array {
  const binary = atob(data);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) bytes[index] = binary.charCodeAt(index);
  return bytes;
}

export function CommandPrompt({
  target,
  sessionKey = SESSION_KEY,
  unavailable = "No machine is connected to bb.",
}: {
  target: CommandPromptTarget | null;
  sessionKey?: string;
  unavailable?: string;
}) {
  const targetKey = target === null ? null : target.kind === "host" ? `host:${target.hostId}` : `thread:${target.threadId}`;
  const containerRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (container === null || target === null) return;
    const terminal = new Terminal({
      cursorBlink: true,
      cursorStyle: "underline",
      fontFamily: '"Lucida Console", Consolas, ui-monospace, monospace',
      fontSize: 13,
      theme: { background: "#0c0c0e", foreground: "#cbcbcf", cursor: "#cbcbcf", selectionBackground: "#316ac5" },
    });
    const fit = new FitAddon();
    terminal.loadAddon(fit);
    terminal.open(container);
    fit.fit();

    let socket: WebSocket | null = null;
    let disposed = false;
    const send = (message: object) => {
      if (socket?.readyState === WebSocket.OPEN) socket.send(JSON.stringify(message));
    };
    const input = terminal.onData((data) => send({ type: "input", dataBase64: toBase64(data) }));
    const observer = new ResizeObserver(() => {
      fit.fit();
      send({ type: "resize", cols: terminal.cols, rows: terminal.rows });
    });
    observer.observe(container);

    openSession(target, sessionKey, terminal.cols, terminal.rows).then(
      (session) => {
        if (disposed) return;
        const scheme = window.location.protocol === "https:" ? "wss" : "ws";
        socket = new WebSocket(`${scheme}://${window.location.host}/ws/terminals/${encodeURIComponent(session.id)}?sinceSeq=0`);
        socket.addEventListener("open", () => send({ type: "resize", cols: terminal.cols, rows: terminal.rows }));
        socket.addEventListener("message", (event) => {
          let message: unknown;
          try {
            message = JSON.parse(String(event.data));
          } catch {
            return;
          }
          const record = message as { type?: unknown; chunk?: { dataBase64?: unknown }; message?: unknown };
          if (record.type === "output" && typeof record.chunk?.dataBase64 === "string") {
            terminal.write(fromBase64(record.chunk.dataBase64));
          } else if (record.type === "exited") {
            localStorage.removeItem(sessionKey);
            terminal.write("\r\n\r\n[Process exited. Close this window and open Command Prompt again for a new session.]\r\n");
          } else if (record.type === "error") {
            setError(typeof record.message === "string" ? record.message : "The terminal connection failed.");
          }
        });
        socket.addEventListener("close", () => {
          if (!disposed) terminal.write("\r\n[Disconnected]\r\n");
        });
        terminal.focus();
      },
      (openError: unknown) => {
        if (!disposed) setError(openError instanceof Error ? openError.message : String(openError));
      },
    );

    return () => {
      disposed = true;
      observer.disconnect();
      input.dispose();
      socket?.close();
      terminal.dispose();
    };
  }, [targetKey, sessionKey]);

  return (
    <div className="bbd-program bbd-cmd h-full">
      {target === null ? (
        <p className="bbd-cmd-message">{unavailable}</p>
      ) : error !== null ? (
        <p className="bbd-cmd-message">Could not open a terminal: {error}</p>
      ) : null}
      <div ref={containerRef} className="bbd-cmd-screen" hidden={target === null || error !== null} />
    </div>
  );
}
