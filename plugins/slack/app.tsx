import { useEffect, useState } from "react";
import { definePluginApp, useRpc, type PluginPendingInteractionProps } from "@get-bb/plugin-sdk/app";
import type { rpcContract, Status } from "./contract.js";
import manifest from "./slack-app-manifest.json";
import "./app.css";
const slackAppUrl = `https://api.slack.com/apps?new_app=1&manifest_json=${encodeURIComponent(JSON.stringify(manifest))}`;

function TokenForm({ save, cancel }: { save: (token: string) => Promise<unknown>; cancel?: () => void }) {
  const [token, setToken] = useState(""); const [busy, setBusy] = useState(false); const [error, setError] = useState("");
  return <form className="slack-connect" onSubmit={event => {
    event.preventDefault(); if (busy || !token.trim()) return; setBusy(true); setError("");
    void save(token.trim()).then(() => setToken("")).catch(() => setError("Could not connect. Check that this is a valid User OAuth Token with the required scopes.")).finally(() => setBusy(false));
  }}>
    <h2>Connect Slack</h2>
    <p>Read your channels, including Slack Connect. Agents draft replies here; each reply waits for your approval before sending as you.</p>
    <label htmlFor="slack-user-token">User OAuth Token</label>
    <input id="slack-user-token" type="password" autoComplete="off" spellCheck={false} placeholder="xoxp-…" value={token} onChange={event => setToken(event.target.value)} disabled={busy} required />
    <p className="slack-hint">Stored in Slack’s secret settings. The token never appears in chat or reaches your agent.</p>
    <details><summary>Get a token</summary><p>Create and install a Slack app in your workspace using the <a href={slackAppUrl} target="_blank" rel="noreferrer">preconfigured app setup</a>. Copy its User OAuth Token from OAuth &amp; Permissions. Your workspace may require an admin to approve the app.</p></details>
    {error && <p role="alert">{error}</p>}
    <div className="slack-actions">{cancel && <button type="button" onClick={cancel} disabled={busy}>Cancel</button>}<button type="submit" disabled={busy || !token.trim()}>{busy ? "Connecting…" : "Connect Slack"}</button></div>
  </form>;
}
function ConnectInteraction({ submit, cancel }: PluginPendingInteractionProps) {
  return <TokenForm save={token => submit({ token })} cancel={() => void cancel()} />;
}
function Connection() {
  const rpc = useRpc<typeof rpcContract>(); const [status, setStatus] = useState<Status | null>(null); const [error, setError] = useState(false);
  useEffect(() => { let live = true; void rpc.call("status", {}).then(value => { if (live) setStatus(value); }).catch(() => { if (live) setError(true); }); return () => { live = false; }; }, [rpc]);
  if (!status && !error) return <div className="slack-connect" role="status">Checking Slack…</div>;
  if (!status?.connected || error) return <TokenForm save={async token => { setStatus(await rpc.call("connect", { token })); setError(false); }} />;
  return <section className="slack-connect">
    <h2>Slack is connected</h2>
    <p>Reading as <strong>{status.identity?.user}</strong> in <strong>{status.identity?.team}</strong>.</p>
    <p>Ask your agent to read a channel or draft a reply. You review and edit each Reply card before choosing Send to Slack.</p>
    {status.missingScopes.length > 0 && <p role="status">Some permissions may be missing: {status.missingScopes.join(", ")}. Reinstall the Slack app with these user scopes, then reconnect.</p>}
    <p><code>bb slack channels --json</code></p>
    <button type="button" onClick={() => { void rpc.call("disconnect", {}).then(setStatus).catch(() => setError(true)); }}>Disconnect Slack</button>
  </section>;
}
export default definePluginApp(app => {
  app.slots.pendingInteraction({ id: "connect", component: ConnectInteraction });
  app.slots.settingsSection({ id: "connection", title: "Slack", component: Connection });
});
