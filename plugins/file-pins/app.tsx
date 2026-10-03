import { useCallback, useEffect, useRef, useState, type FormEvent, type MouseEvent } from "react";
import { definePluginApp, experimental_Icon as Icon, experimental_FileLink as FileLink, useBbNavigate, useComposer, useRealtime, useRealtimeConnectionState, useRpc } from "@get-bb/plugin-sdk/app";
import type { Pin, rpcContract } from "./contract.js";

const control = "inline-flex h-7 items-center justify-center rounded-md px-2 text-xs text-muted-foreground hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50";
const field = "h-8 min-w-0 rounded-md border border-input bg-background px-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";
type Host = { id: string; name: string; connected: boolean };

function PinStrip({ threadId }: { threadId: string }) {
  const rpc = useRpc<typeof rpcContract>();
  const navigate = useBbNavigate();
  const connection = useRealtimeConnectionState();
  const [pins, setPins] = useState<Pin[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [path, setPath] = useState("");
  const [hosts, setHosts] = useState<Host[]>([]);
  const [hostId, setHostId] = useState("");
  const [busy, setBusy] = useState(false);
  const generation = useRef(0);
  const alive = useRef(true);
  const input = useRef<HTMLInputElement>(null);
  const report = useCallback((cause: unknown) => {
    if (alive.current) setError(cause instanceof Error ? cause.message : String(cause));
  }, []);
  const refresh = useCallback(async () => {
    const request = ++generation.current;
    try {
      const result = await rpc.call("list", { threadId });
      if (alive.current && request === generation.current) {
        setPins(result.pins);
        setLoaded(true);
      }
    } catch (cause) { report(cause); }
  }, [rpc, threadId, report]);
  useEffect(() => {
    alive.current = true;
    return () => { alive.current = false; generation.current++; };
  }, []);
  useEffect(() => { void refresh(); }, [refresh, connection]);
  useRealtime("pins-changed", (payload) => {
    if (payload && typeof payload === "object" && "threadId" in payload && payload.threadId === threadId) void refresh();
  });
  useEffect(() => {
    if (!adding) return;
    input.current?.focus();
    let cancelled = false;
    rpc.call("context", { threadId }).then((result) => {
      if (cancelled) return;
      setHosts(result.hosts);
      setHostId((current) => current || result.defaultHostId || (result.hosts.length === 1 ? result.hosts[0]!.id : ""));
    }, report);
    return () => { cancelled = true; };
  }, [adding, rpc, threadId, report]);
  async function submit(event: FormEvent) {
    event.preventDefault();
    if (busy) return;
    setBusy(true); setError(null);
    try {
      await rpc.call("pin", { threadId, hostId, path });
      if (!alive.current) return;
      setPath(""); setAdding(false);
      await refresh();
    } catch (cause) { report(cause); }
    finally { if (alive.current) setBusy(false); }
  }
  async function unpin(pin: Pin) {
    setBusy(true); setError(null);
    try { await rpc.call("unpin", { threadId, pinId: pin.id }); await refresh(); }
    catch (cause) { report(cause); }
    finally { if (alive.current) setBusy(false); }
  }
  function open(pin: Pin, event: MouseEvent<HTMLAnchorElement>) {
    if (!/\.(?:md|markdown)$/i.test(pin.path) || event.defaultPrevented || event.button !== 0 || event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return;
    event.preventDefault();
    setError(null);
    void rpc.call("openMossNote", { threadId, pinId: pin.id }).then(({ opened }) => {
      if (!opened && alive.current) navigate.experimental_openFilePreview({ target: { kind: "host", hostId: pin.hostId, path: pin.path }, location: null });
    }).catch(report);
  }
  return (
    <section aria-label="Pinned files" className="min-w-0 space-y-2 px-1 py-1 text-foreground">
      <div className="flex flex-wrap items-center gap-1.5">
        {pins.length > 0 && <Icon name="Pin" className="size-3.5 shrink-0 text-muted-foreground" />}
        {pins.map((pin) => (
          <div key={pin.id} className="inline-flex max-w-full items-center rounded-md border border-border bg-background">
            <FileLink target={{ kind: "host", hostId: pin.hostId, path: pin.path }} onClick={(event) => open(pin, event)} title={`${pin.path}\nHost: ${pin.hostId}`} aria-label={`Open ${pin.name}`} className={`${control} min-w-0 max-w-64 justify-start text-foreground`}><span className="truncate">{pin.name}</span></FileLink>
            <button type="button" className={`${control} w-7 shrink-0 px-0`} title={`Unpin ${pin.name}`} aria-label={`Unpin ${pin.name}`} disabled={busy} onClick={() => void unpin(pin)}><Icon name="X" className="size-3" /></button>
          </div>
        ))}
        <button type="button" className={`${control} gap-1`} aria-label="Pin a file" title="Pin a file" aria-expanded={adding} disabled={busy} onClick={() => { setAdding(!adding); setError(null); }}>
          <Icon name="Plus" className="size-3.5" />{pins.length === 0 && (loaded ? "Pin a file" : "Loading pins…")}
        </button>
      </div>
      {adding && <form onSubmit={submit} className="flex flex-wrap items-center gap-2">
        <label className="min-w-40 flex-1"><span className="sr-only">File path</span><input ref={input} className={`${field} w-full`} value={path} onChange={(event) => setPath(event.target.value)} placeholder="~/Moss/Notes/Tweets/Tweets.md" required disabled={busy} /></label>
        <label><span className="sr-only">File host</span><select className={`${field} max-w-52`} value={hostId} onChange={(event) => setHostId(event.target.value)} required disabled={busy}>
          <option value="" disabled>Choose a host</option>
          {hosts.map((host) => <option key={host.id} value={host.id} disabled={!host.connected}>{host.name}{host.connected ? "" : " (offline)"}</option>)}
        </select></label>
        <button className={`${control} bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground`} type="submit" disabled={busy || !hostId || !path || !hosts.some((host) => host.id === hostId && host.connected)}>{busy ? "Pinning…" : "Pin"}</button>
        <button className={control} type="button" disabled={busy} onClick={() => { setAdding(false); setError(null); }}>Cancel</button>
      </form>}
      {error && <div role="alert" className="flex items-center gap-2 text-xs text-destructive"><span>{error}</span><button className={control} type="button" onClick={() => { setError(null); void refresh(); }}>Retry</button></div>}
    </section>
  );
}
function PinsBanner() {
  const composer = useComposer();
  return composer.scope.kind === "thread" ? <PinStrip key={composer.scope.threadId} threadId={composer.scope.threadId} /> : null;
}
export default definePluginApp((app) => {
  app.composer.customize({ id: "file-pins", scopes: ["thread"], banners: [{ id: "pins", chrome: "bare", component: PinsBanner }] });
});
