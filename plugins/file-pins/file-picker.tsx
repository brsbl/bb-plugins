import { useEffect, useState } from "react";
import { useRpc } from "@get-bb/plugin-sdk/app";
import type { RecentFile, rpcContract } from "./contract.js";
import { Button } from "./components/ui/button.js";
import { Input } from "./components/ui/input.js";
import { Command, CommandInput, CommandItem, CommandList } from "./components/ui/command.js";
import { ReferenceIcon } from "./reference-icon.js";

export function FilePicker({ threadId, recent, hasPins, onClose, onPinned, onCustomize }: {
  threadId: string; recent: RecentFile[]; hasPins: boolean; onClose(): void; onPinned(): Promise<void>; onCustomize(): void;
}) {
  const rpc = useRpc<typeof rpcContract>();
  const [hosts, setHosts] = useState<Array<{ id: string; name: string; connected: boolean }>>([]);
  const [hostId, setHostId] = useState("");
  const [query, setQuery] = useState("");
  const [paths, setPaths] = useState<Array<{ path: string; name: string }>>([]);
  const [paste, setPaste] = useState(false);
  const [searching, setSearching] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    let cancelled = false;
    rpc.call("context", { threadId }).then((result) => {
      if (cancelled) return;
      setHosts(result.hosts);
      setHostId(result.defaultHostId || result.hosts.find((host) => host.connected)?.id || "");
    }).catch((error: Error) => { if (!cancelled) setError(error.message); });
    return () => { cancelled = true; };
  }, [rpc, threadId]);
  useEffect(() => {
    setPaths([]); setError(null); setSearching(false);
    if (!hostId || paste || !query.trim()) return;
    let cancelled = false;
    setSearching(true);
    const timeout = setTimeout(() => {
      rpc.call("search", { threadId, hostId, query }).then((result) => {
        if (!cancelled) setPaths(result.paths);
      }).catch((error: Error) => { if (!cancelled) setError(error.message); })
        .finally(() => { if (!cancelled) setSearching(false); });
    }, 120);
    return () => { cancelled = true; clearTimeout(timeout); };
  }, [hostId, paste, query, rpc, threadId]);
  async function pin(path: string) {
    if (busy || !hostId) return;
    setBusy(true); setError(null);
    try {
      await rpc.call("pin", { threadId, hostId, path });
      await onPinned(); onClose();
    } catch (error) { setError(error instanceof Error ? error.message : String(error)); setBusy(false); }
  }
  const files = query.trim() ? paths : recent.filter((file) => file.hostId === hostId);
  const quiet = "rounded px-1 py-1 text-xs text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50";
  return <div aria-label="Pin to thread">
    {paste ? <form className="flex items-center gap-1 border-b p-2" onSubmit={(event) => { event.preventDefault(); void pin(query); }}>
      <Input autoFocus aria-label="File path" className="h-8 border-0 bg-transparent px-1 shadow-none" placeholder="Paste a file path…" value={query} onChange={(event) => setQuery(event.target.value)} disabled={busy} required />
      <Button type="submit" variant="ghost" size="sm" className="h-7 px-2 text-xs" disabled={busy || !hostId || !query.trim()}>{busy ? "Pinning…" : "Pin"}</Button>
    </form> : <Command shouldFilter={false} label="Choose a file to pin">
      <CommandInput autoFocus showSearchIcon={false} placeholder="Search files…" value={query} onValueChange={setQuery} disabled={busy} maxLength={500} />
      {!query.trim() && files.length > 0 && <p className="px-3 pb-1 pt-2 text-xs text-muted-foreground">Recent in this thread</p>}
      <CommandList aria-label="Files" aria-busy={searching || busy} className="max-h-56 p-1">
        {files.map((file) => <CommandItem key={file.path} value={file.path} disabled={busy} onSelect={() => void pin(file.path)}>
          <ReferenceIcon name={file.name} moss={"moss" in file && file.moss === true} />
          <span className="min-w-0"><span className="block truncate">{file.name}</span><span className="block truncate text-xs text-muted-foreground" title={file.path}>{file.path}</span></span>
        </CommandItem>)}
        {files.length === 0 && <p className="px-2 py-3 text-xs text-muted-foreground" role="status">{searching ? "Searching…" : query.trim() ? "No files found." : "Search for a file to pin."}</p>}
      </CommandList>
    </Command>}
    {error && <p role="alert" className="px-3 py-2 text-xs text-destructive">{error}</p>}
    <div className="flex flex-wrap items-center justify-between gap-x-2 px-2 pb-1">
      <button type="button" className={quiet} disabled={busy} onClick={() => { setPaste(!paste); setQuery(""); setError(null); }}>{paste ? "Back to search" : "Paste a path…"}</button>
      {hosts.length > 1 && <select aria-label="Machine" title="Search machine" className={`${quiet} max-w-32 bg-transparent`} value={hostId} disabled={busy} onChange={(event) => setHostId(event.target.value)}>
        {hosts.map((host) => <option key={host.id} value={host.id} disabled={!host.connected}>{host.name}{host.connected ? "" : " (offline)"}</option>)}
      </select>}
      {hasPins && <button type="button" className={quiet} disabled={busy} onClick={onCustomize}>Customize pins</button>}
    </div>
  </div>;
}
