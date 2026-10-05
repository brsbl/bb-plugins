import { FitAddon } from "@xterm/addon-fit";
import { Terminal } from "@xterm/xterm";
import { useEffect, useRef, useState } from "react";
import { useDesktop } from "./data";
import { connectTerminal, openSession, terminalSessionKey, useTerminalSdk, type TerminalConnection } from "./terminal";
import { WindowFrame, type DesktopWindow } from "./windows";
import "./xterm.css";

/** A terminal in a thread's environment, as Desktop opens one from a thread window, drawn in bb's terminal colors. */

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

/** xterm takes hex colors; bb's tokens are oklch. Paint one pixel to read the color back as hex. */
function tokenColor(element: Element, token: string, fallback: string): string {
  const value = getComputedStyle(element).getPropertyValue(token).trim();
  if (value === "") return fallback;
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = 1;
  const context = canvas.getContext("2d", { willReadFrequently: true });
  if (context === null) return fallback;
  context.fillStyle = fallback;
  context.fillStyle = value;
  context.fillRect(0, 0, 1, 1);
  const [r, g, b] = context.getImageData(0, 0, 1, 1).data;
  return `#${[r, g, b].map((channel) => (channel ?? 0).toString(16).padStart(2, "0")).join("")}`;
}

function ThreadTerminal({ threadId, tabId }: { threadId: string; tabId: string }) {
  useTerminalSdk();
  const containerRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [reconnecting, setReconnecting] = useState(false);
  const sessionKey = terminalSessionKey(tabId);

  useEffect(() => {
    const container = containerRef.current;
    if (container === null) return;
    const background = tokenColor(container, "--background", "#ffffff");
    const foreground = tokenColor(container, "--foreground", "#333333");
    const terminal = new Terminal({
      cursorBlink: true,
      fontFamily: getComputedStyle(container).getPropertyValue("--font-terminal").trim() || "ui-monospace, SFMono-Regular, Menlo, monospace",
      fontSize: 13,
      scrollback: 10_000,
      theme: { background, foreground, cursor: foreground, selectionBackground: tokenColor(container, "--state-active", "#cccccc") },
    });
    const fit = new FitAddon();
    terminal.loadAddon(fit);
    terminal.open(container);
    fit.fit();

    let connection: TerminalConnection | null = null;
    let disposed = false;
    const input = terminal.onData((data) => connection?.sendInput(toBase64(data)));
    const observer = new ResizeObserver(() => {
      // The canvas scales windows when zoomed; fit to the window's own size, which the scale leaves unchanged.
      fit.fit();
      connection?.sendResize(terminal.cols, terminal.rows);
    });
    observer.observe(container);

    openSession({ kind: "thread", threadId }, sessionKey, terminal.cols, terminal.rows).then(
      (session) => {
        if (disposed) return;
        connection = connectTerminal(session.id, {
          onOutput: (dataBase64) => terminal.write(fromBase64(dataBase64)),
          onEnded: () => {
            try {
              localStorage.removeItem(sessionKey);
            } catch {
              // Nothing to forget.
            }
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
      // open() queues a scroll-area sync that throws once the terminal is disposed; detach now, dispose after it runs.
      terminal.element?.remove();
      setTimeout(() => terminal.dispose());
    };
  }, [sessionKey, threadId]);

  return (
    <div className="cdc-terminal">
      {error === null ? null : <p className="cdc-terminal-message">Couldn’t open a terminal: {error}</p>}
      {reconnecting && error === null ? <p className="cdc-terminal-status" role="status">Reconnecting…</p> : null}
      <div ref={containerRef} className="cdc-terminal-screen" hidden={error !== null} />
    </div>
  );
}

export function TerminalWindow({ window: desktopWindow, threadId, tabId }: { window: DesktopWindow; threadId: string; tabId: string }) {
  const desktop = useDesktop();
  const thread = desktop.threadById.get(threadId);
  return (
    <WindowFrame window={desktopWindow} title={`Terminal — ${thread?.displayTitle ?? "Thread"}`} icon="Terminal"
      statusBar={<span className="cdc-statusbar-note">{thread?.environment?.name ?? thread?.environment?.branchName ?? thread?.environment?.path ?? "The thread’s environment"}</span>}>
      <ThreadTerminal threadId={threadId} tabId={tabId} />
    </WindowFrame>
  );
}
