import { useEffect, useState } from "react";
import { definePluginApp, useRpc } from "@get-bb/plugin-sdk/app";
import { rpcContract, type statusSchema } from "./contract.js";
import type { z } from "zod";
import "./app.css";

export function GoogleAdsPage() {
  const rpc = useRpc<typeof rpcContract>();
  const [status, setStatus] = useState<z.infer<typeof statusSchema> | null>(null);
  const [auth, setAuth] = useState<string | null>(null);
  const [redirect, setRedirect] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const run = async (fn: () => Promise<void>) => {
    setBusy(true); setError("");
    try { await fn(); } catch (e) { setError(e instanceof Error ? e.message : "Could not connect. Try again."); } finally { setBusy(false); }
  };
  useEffect(() => { void run(async () => setStatus(await rpc.call("status", {}))); }, [rpc]);
  return <main className="ga-page">
    <div className="ga-eyebrow">GOOGLE ADS · READ ONLY</div>
    <h1>Read your ads. Decide what’s next.</h1>
    <p className="ga-intro">Give your agents campaign reports, search terms and ad copy. Proposals come back as decisions for you to make in Google Ads.</p>
    {error && <p className="ga-error" role="alert">{error}</p>}
    {!status ? <p role="status">Loading connection…</p> : <>
      <section className="ga-section" aria-label="Google connection">
        <h2>{status.connected ? "Google is connected" : "Connect Google Ads"}</h2>
        {!status.configured && <>
          <p>Save your developer token and Google OAuth client in <b>Settings → Google Ads</b>, or ask your agent to open bb’s secure credential form.</p>
          <p className="ga-muted">Use a Desktop app OAuth client with the Google Ads API enabled. Keep the consent screen in production for ongoing access.</p>
        </>}
        {status.configured && <>
          <p>{status.connected ? "Your sign-in is saved. Agents can use the read commands below." : "Sign in to the Google account that has access to your ads."}</p>
          <p className="ga-muted">Google’s consent screen grants Ads access. This plugin only reads; it has no commands that change your account.</p>
          <div className="ga-actions">
            <button disabled={busy} onClick={() => void run(async () => { const result = await rpc.call("connectStart", {}); setAuth(result.authUrl); })}>{status.connected ? "Reconnect Google Ads" : "Connect Google Ads"}</button>
            {status.connected && <button className="ga-secondary" disabled={busy} onClick={() => void run(async () => { setStatus(await rpc.call("disconnect", {})); setAuth(null); setRedirect(""); })}>Disconnect</button>}
          </div>
        </>}
        {auth && <form onSubmit={e => { e.preventDefault(); void run(async () => { setStatus(await rpc.call("connectFinish", { redirectUrl: redirect.trim() })); setRedirect(""); setAuth(null); }); }}>
          <p><a href={auth} target="_blank" rel="noopener noreferrer">Continue to Google sign-in ↗</a></p>
          <label>After allowing access, Google opens an address that won’t load. Paste that address here.
            <input aria-label="Address from Google" type="password" autoComplete="off" value={redirect} onChange={e => setRedirect(e.target.value)} placeholder="http://127.0.0.1:53683/…" />
          </label>
          <button disabled={busy || !redirect.trim()}>Finish connecting</button>
        </form>}
        <button className="ga-link" disabled={busy} onClick={() => void run(async () => setStatus(await rpc.call("status", {})))}>Refresh connection status</button>
      </section>
      <section className="ga-section" aria-label="Weekly reads">
        <h2>Your weekly read</h2>
        <p>Ask your agent: “Read the last seven completed days by ad, compare messages within each ad group, and propose the next experiment.”</p>
        <code>bb google-ads report --last-7-days --json</code>
        <ul className="ga-checklist">
          <li>{status.customerSelected ? "✓ Advertising account selected" : "Select the advertising customer ID in settings. Use accounts to discover access."}</li>
          <li>{status.downloadsSelected ? "✓ Download-button actions selected" : "Select download-button conversion actions after the first read. Until then, conversions are unknown."}</li>
        </ul>
        <p className="ga-muted">Reports use the account’s currency and time zone. An approved proposal still needs your manual change in Google Ads.</p>
      </section>
    </>}
  </main>;
}
export default definePluginApp(app => { app.slots.navPanel({ id: "google-ads", path: "google-ads", title: "Google Ads", icon: "ChartColumn", component: GoogleAdsPage }); });
