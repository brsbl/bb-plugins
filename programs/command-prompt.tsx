import { FitAddon } from "@xterm/addon-fit";
import { Terminal } from "@xterm/xterm";
import { useEffect, useRef, useState } from "react";

import { CommandPromptArt } from "../art";
import {
  SESSION_KEY,
  connectTerminal,
  openSession,
  useTerminalSdk,
  type CommandPromptTarget,
  type TerminalConnection,
} from "../services/terminal";
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
  useTerminalSdk();
  const targetKey = target === null ? null : target.kind === "host" ? `host:${target.hostId}` : `thread:${target.threadId}`;
  const containerRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [reconnecting, setReconnecting] = useState(false);

  useEffect(() => {
    const container = containerRef.current;
    if (container === null || target === null) return;
    const terminal = new Terminal({
      cursorBlink: true,
      cursorStyle: "underline",
      fontFamily: '"Lucida Console", Consolas, ui-monospace, monospace',
      fontSize: 13,
      scrollback: 10_000,
      theme: { background: "#000000", foreground: "#c0c0c0", cursor: "#c0c0c0", selectionBackground: "#c0c0c0", selectionForeground: "#000000" },
    });
    const fit = new FitAddon();
    terminal.loadAddon(fit);
    terminal.open(container);
    fit.fit();

    let connection: TerminalConnection | null = null;
    let disposed = false;
    const input = terminal.onData((data) => connection?.sendInput(toBase64(data)));
    const observer = new ResizeObserver(() => {
      fit.fit();
      connection?.sendResize(terminal.cols, terminal.rows);
    });
    observer.observe(container);

    openSession(target, sessionKey, terminal.cols, terminal.rows).then(
      (session) => {
        if (disposed) return;
        connection = connectTerminal(session.id, {
          onOutput: (dataBase64) => terminal.write(fromBase64(dataBase64)),
          onEnded: () => {
            localStorage.removeItem(sessionKey);
            terminal.write("\r\n\r\n[Process exited. Close this window and open Terminal again for a new session.]\r\n");
          },
          onError: setError,
          onReconnecting: () => setReconnecting(true),
          onReconnected: () => setReconnecting(false),
        });
        connection.sendResize(terminal.cols, terminal.rows);
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
      connection?.dispose();
      // open() queues a scroll-area sync on a timer that throws once the terminal is disposed, as it is when a window
      // closes right after opening or StrictMode remounts it. Detach it now and dispose it after that timer runs.
      terminal.element?.remove();
      setTimeout(() => terminal.dispose());
    };
  }, [targetKey, sessionKey]);

  return (
    <div className="bbd-cmd h-full">
      {target === null ? (
        <p className="bbd-cmd-message">{unavailable}</p>
      ) : error !== null ? (
        <p className="bbd-cmd-message">Could not open a terminal: {error}</p>
      ) : null}
      {reconnecting && error === null ? <p className="bbd-cmd-status" role="status">Reconnecting…</p> : null}
      <div ref={containerRef} className="bbd-cmd-screen" hidden={target === null || error !== null} />
    </div>
  );
}

/** The Start menu's Terminal, a terminal on the first machine. */

export function CommandPromptWindow({ window: desktopWindow }: { window: DesktopWindow }) {
  const desktop = useDesktop();
  const machine = desktop.snapshot.machines[0] ?? null;
  return (
    <WindowFrame
      window={desktopWindow}
      title={machine === null ? "Terminal" : `Terminal — ${machine.name}`}
      icon={<CommandPromptArt size={16} />}
    >
      <CommandPrompt target={machine === null ? null : { kind: "host", hostId: machine.id }} />
    </WindowFrame>
  );
}

