import { FitAddon } from "@xterm/addon-fit";
import { Terminal } from "@xterm/xterm";
import "@xterm/xterm/css/xterm.css";
import { useEffect, useRef, useState } from "react";

import { CommandPromptArt } from "../art";
import { SESSION_KEY, openSession, type CommandPromptTarget } from "../services/terminal";
import { useDesktop } from "../shell/data";
import { WindowFrame, type DesktopWindow } from "../windows";

export type { CommandPromptTarget };

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
      theme: { background: "#000000", foreground: "#c0c0c0", cursor: "#c0c0c0", selectionBackground: "#c0c0c0", selectionForeground: "#000000" },
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
    <div className="bbd-cmd h-full">
      {target === null ? (
        <p className="bbd-cmd-message">{unavailable}</p>
      ) : error !== null ? (
        <p className="bbd-cmd-message">Could not open a terminal: {error}</p>
      ) : null}
      <div ref={containerRef} className="bbd-cmd-screen" hidden={target === null || error !== null} />
    </div>
  );
}

/** The Start menu's Command Prompt, a terminal on the first machine. */

export function CommandPromptWindow({ window: desktopWindow }: { window: DesktopWindow }) {
  const desktop = useDesktop();
  const machine = desktop.snapshot.machines[0] ?? null;
  return (
    <WindowFrame
      window={desktopWindow}
      title={machine === null ? "Command Prompt" : `Command Prompt — ${machine.name}`}
      icon={<CommandPromptArt size={16} />}
    >
      <CommandPrompt target={machine === null ? null : { kind: "host", hostId: machine.id }} />
    </WindowFrame>
  );
}

