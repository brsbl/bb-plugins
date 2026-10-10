import { useState } from "react";
import type { PluginPendingInteractionProps } from "@get-bb/plugin-sdk/app";
import type { ConnectionStatus } from "../contract.js";
import { readableError, useCalendarRpc } from "./data.js";

/**
 * Sign-in with paste-back: Connect opens Google's consent screen in a new tab,
 * Google then redirects to a loopback address that doesn't load, and she pastes
 * that address here to finish.
 */
export function ConnectFlow({ disabled = false, label = "Connect Google Calendar", askCalendarId = true, onConnected }: {
  disabled?: boolean; label?: string; askCalendarId?: boolean; onConnected: (status: ConnectionStatus) => void;
}) {
  const rpc = useCalendarRpc();
  const [calendarId, setCalendarId] = useState("");
  const [opened, setOpened] = useState(false);
  const [redirect, setRedirect] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const start = async () => {
    setBusy(true); setError(null);
    try {
      const { authUrl } = await rpc.call("connectStart", calendarId.trim() ? { calendarId: calendarId.trim() } : {});
      window.open(authUrl, "_blank", "noopener,noreferrer");
      setOpened(true);
    } catch (err) { setError(readableError(err)); } finally { setBusy(false); }
  };
  const finish = async () => {
    setBusy(true); setError(null);
    try { onConnected(await rpc.call("connectFinish", { redirectUrl: redirect.trim() })); }
    catch (err) { setError(readableError(err)); } finally { setBusy(false); }
  };
  return <div className="cc-connect-flow">
    {askCalendarId && <label className="cc-stack">
      <span className="cc-muted">Existing calendar ID (optional). Use it if bb lost its data, so it reuses your Content calendar instead of creating a second one.</span>
      <input className="cc-input" value={calendarId} onChange={(event) => setCalendarId(event.target.value)} placeholder="…@group.calendar.google.com" disabled={disabled} />
    </label>}
    <div className="cc-row-actions"><button type="button" className="cc-button cc-primary" disabled={disabled || busy} onClick={() => void start()}>{label}</button></div>
    {opened && <form className="cc-stack" onSubmit={(event) => { event.preventDefault(); if (redirect.trim()) void finish(); }}>
      <label className="cc-stack">
        <span>After you allow access, Google opens a page that doesn't load. Paste that page's address here.</span>
        <input className="cc-input" aria-label="Address from Google" placeholder="http://127.0.0.1/…?code=…" value={redirect} onChange={(event) => setRedirect(event.target.value)} autoFocus />
      </label>
      <div className="cc-row-actions"><button type="submit" className="cc-button cc-primary" disabled={!redirect.trim() || busy}>{busy ? "Connecting…" : "Finish connecting"}</button></div>
    </form>}
    {error && <p className="cc-error" role="alert">{error}</p>}
  </div>;
}

/** The page's empty state while Google isn't connected. */
export function ConnectSteps({ status, onConnected }: { status: ConnectionStatus; onConnected: (status: ConnectionStatus) => void }) {
  const needsClient = status.state === "needs_client";
  return <section className="cc-connect" aria-label="Connect Google Calendar">
    <h2>Connect Google Calendar</h2>
    <p className="cc-muted">Content Calendar keeps every item on a Google calendar named Content, so the schedule also shows in Google Calendar and on your phone. bb can only see calendars it creates.</p>
    <ol>
      <li><b>Create a Google OAuth client.</b> In your Google Cloud project, enable the Calendar API and create a “Desktop app” client. Set the consent screen to In production; Testing apps lose access after 7 days.</li>
      <li><b>Save the client ID and secret</b> in Settings → Content Calendar, or run <code>bb content-calendar connect</code> in a thread. {needsClient ? "Not saved yet." : "Saved."}</li>
      <li><b>Connect.</b> Allow access on Google's consent screen, then paste the address it sends you to.
        <ConnectFlow disabled={needsClient} onConnected={onConnected} />
      </li>
    </ol>
  </section>;
}

/** The masked form `bb content-calendar connect` shows in a thread. Values go straight to secret settings. */
export function ConnectClientForm({ interaction, submit, cancel }: PluginPendingInteractionProps) {
  const [clientId, setClientId] = useState("");
  const [clientSecret, setClientSecret] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const ready = clientId.trim() !== "" && clientSecret.trim() !== "";
  return <form className="cc-root cc-client-form" aria-label="Google OAuth client" onSubmit={(event) => {
    event.preventDefault();
    if (!ready || busy) return;
    setBusy(true); setError(null);
    submit({ clientId: clientId.trim(), clientSecret: clientSecret.trim() }).catch(() => { setError("Couldn't save the client. Try again."); setBusy(false); });
  }}>
    <h3>{interaction.title || "Google OAuth client"}</h3>
    <p className="cc-muted">Saved to Content Calendar's secret settings. They never appear in the chat or reach the agent.</p>
    <label className="cc-stack"><span>Client ID</span>
      <input className="cc-input" type="password" autoComplete="off" spellCheck={false} value={clientId} onChange={(event) => setClientId(event.target.value)} autoFocus /></label>
    <label className="cc-stack"><span>Client secret</span>
      <input className="cc-input" type="password" autoComplete="off" spellCheck={false} value={clientSecret} onChange={(event) => setClientSecret(event.target.value)} /></label>
    {error && <p className="cc-error" role="alert">{error}</p>}
    <div className="cc-row-actions">
      <button type="button" className="cc-button" disabled={busy} onClick={() => void cancel()}>Cancel</button>
      <button type="submit" className="cc-button cc-primary" disabled={!ready || busy}>{busy ? "Saving…" : "Save"}</button>
    </div>
  </form>;
}
