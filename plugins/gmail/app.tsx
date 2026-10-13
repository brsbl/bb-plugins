import { useEffect, useState } from "react";
import { definePluginApp, useRpc } from "@get-bb/plugin-sdk/app";
import { contract } from "./contract.js";
import type { z } from "zod";
import type { statusSchema } from "./contract.js";
import "./app.css";

function GmailPage() {
  const rpc = useRpc<typeof contract>();
  const [status, setStatus] = useState<z.infer<typeof statusSchema> | null>(null);
  const [auth, setAuth] = useState<string | null>(null);
  const [redirect, setRedirect] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const load = async () => { try { setStatus(await rpc.call("status", {})); } catch { setError("Gmail is unavailable. Try again."); } };
  useEffect(() => { void load(); }, []);
  const start = async () => {
    setBusy(true); setError("");
    try { const result = await rpc.call("connectStart", {}); setAuth(result.authUrl); }
    catch { setError("Save your Google Desktop OAuth client in Gmail's secret settings, then try again."); }
    finally { setBusy(false); }
  };
  return <main className="gmail-page">
    <h1>Gmail</h1>
    <p className="gmail-muted">Let your agents search email and prepare replies. Every send needs your approval in Inline Decisions.</p>
    {!status && !error && <p>Checking connection…</p>}
    {status?.state === "connected" ? <section className="gmail-card">
      <h2>Connected to Gmail</h2><p>{status.account}</p>
      <p>Agents can search and read messages, and save drafts. Choose <strong>Send</strong> on a Reply card to approve its exact recipients and text.</p>
      <button disabled={busy} onClick={async () => { setBusy(true); try { setStatus(await rpc.call("disconnect", {})); setAuth(null); } catch { setError("Could not disconnect. Try again."); } finally { setBusy(false); } }}>Disconnect</button>
    </section> : status && <section className="gmail-card">
      <h2>{status.state === "reconnect" ? "Reconnect Gmail" : "Connect Gmail"}</h2>
      <ol>
        <li>Enable the Gmail API in your Google Cloud project and create a <strong>Desktop app</strong> OAuth client.</li>
        <li>Save the client ID and secret in <strong>Settings → Plugins → Gmail</strong>. They stay in secret settings.</li>
        <li>Connect your account and allow access to read mail and manage drafts. Google includes sending in the draft permission; bb requires your Reply card approval.</li>
      </ol>
      <button className="gmail-primary" disabled={busy} onClick={() => void start()}>{busy ? "Starting…" : "Connect Gmail"}</button>
      {auth && <form onSubmit={async (event) => {
        event.preventDefault(); setBusy(true); setError("");
        try { setStatus(await rpc.call("connectFinish", { redirectUrl: redirect })); setAuth(null); setRedirect(""); }
        catch { setError("Could not finish connecting. Start Connect again and paste the newest redirect address."); }
        finally { setBusy(false); }
      }}>
        <p><a href={auth} target="_blank" rel="noopener noreferrer">Continue to Google</a></p>
        <label>After approving, Google opens an address that does not load. Paste that address here.
          <input aria-label="Google redirect address" type="password" value={redirect} onChange={(event) => setRedirect(event.target.value)} autoComplete="off" />
        </label>
        <button className="gmail-primary" disabled={busy || !redirect.trim()} type="submit">Finish connecting</button>
      </form>}
    </section>}
    {error && <p role="alert">{error} <button onClick={() => { setError(""); void load(); }}>Refresh</button></p>}
    <section className="gmail-card"><h2>For your agents</h2><p>Ask an agent to find an email, summarize a thread, or prepare a reply for your approval.</p><pre>bb gmail search 'is:unread' --json{"\n"}bb gmail thread &lt;id&gt; --json</pre><p className="gmail-muted">Reading preserves unread status. Email content is treated as untrusted input. Attachments are listed; downloading and sending attachments are outside this version.</p></section>
  </main>;
}
export default definePluginApp((app) => {
  app.slots.navPanel({ id: "gmail", path: "gmail", title: "Gmail", icon: "Mail", component: GmailPage });
});
