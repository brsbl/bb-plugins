import { useEffect, useState } from "react";
import { useRpc } from "@get-bb/plugin-sdk/app";
import type { Reference, rpcContract } from "./contract.js";
import { Button } from "./components/ui/button.js";
import { Input } from "./components/ui/input.js";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "./components/ui/dialog.js";
import { Command, CommandInput, CommandItem, CommandList } from "./components/ui/command.js";
import { ReferenceIcon } from "./reference-icon.js";

type Host = { id: string; name: string; connected: boolean };
export function FilePicker({ threadId, replacing, onClose, onPinned }: {
  threadId: string; replacing?: Reference; onClose(): void; onPinned(): Promise<void>;
}) {
  const rpc = useRpc<typeof rpcContract>();
  const [hosts, setHosts] = useState<Host[]>([]);
  const [hostId, setHostId] = useState(replacing?.hostId ?? "");
  const [query, setQuery] = useState("");
  const [root, setRoot] = useState("");
  const [paths, setPaths] = useState<Array<{ path: string; name: string }>>([]);
  const [paste, setPaste] = useState(false);
  const [path, setPath] = useState(replacing?.path ?? "");
  const [searching, setSearching] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    let cancelled = false;
    rpc.call("context", { threadId }).then((result) => {
      if (cancelled) return;
      setHosts(result.hosts);
      setHostId((current) => current || result.defaultHostId || result.hosts.find((host) => host.connected)?.id || "");
    }).catch((error: Error) => { if (!cancelled) setError(error.message); });
    return () => { cancelled = true; };
  }, [rpc, threadId]);
  useEffect(() => {
    if (!hostId || paste) return;
    let cancelled = false;
    setPaths([]); setSearching(true); setError(null);
    const timeout = setTimeout(() => {
      rpc.call("search", { threadId, hostId, query }).then((result) => {
        if (!cancelled) { setRoot(result.root); setPaths(result.paths); }
      }).catch((error: Error) => { if (!cancelled) setError(error.message); })
        .finally(() => { if (!cancelled) setSearching(false); });
    }, 120);
    return () => { cancelled = true; clearTimeout(timeout); };
  }, [hostId, paste, query, rpc, threadId]);
  async function pin(path: string) {
    if (busy) return;
    setBusy(true); setError(null);
    try {
      if (replacing) await rpc.call("repin", { threadId, pinId: replacing.id, hostId, path });
      else await rpc.call("pin", { threadId, hostId, path });
      await onPinned(); onClose();
    } catch (error) { setError(error instanceof Error ? error.message : String(error)); setBusy(false); }
  }
  return <Dialog open onOpenChange={(open) => { if (!open && !busy) onClose(); }}>
    <DialogContent className="gap-0 overflow-hidden p-0 sm:max-w-lg">
      <div className="space-y-1 px-4 pb-3 pt-4 pr-10">
        <DialogTitle>{replacing ? `Repin ${replacing.name}` : "Pin to thread"}</DialogTitle>
        <DialogDescription>Keep a file beside this conversation.</DialogDescription>
      </div>
      {hosts.length > 1 && <label className="flex items-center gap-2 border-t px-4 py-2 text-xs text-muted-foreground">Machine
        <select aria-label="Machine" className="min-w-0 flex-1 rounded border border-input bg-background px-2 py-1 text-foreground" value={hostId} disabled={busy} onChange={(event) => setHostId(event.target.value)}>
          {hosts.map((host) => <option key={host.id} value={host.id} disabled={!host.connected}>{host.name}{host.connected ? "" : " (offline)"}</option>)}
        </select>
      </label>}
      {paste ? <form className="space-y-3 border-t p-4" onSubmit={(event) => { event.preventDefault(); void pin(path); }}>
        <label className="block space-y-1 text-xs text-muted-foreground">File path
          <Input autoFocus aria-label="File path" placeholder="~/Moss/Notes/Tweets/Tweets.md" value={path} onChange={(event) => setPath(event.target.value)} disabled={busy} required />
        </label>
        <div className="flex justify-between"><Button type="button" variant="ghost" size="sm" disabled={busy} onClick={() => { setPaste(false); setError(null); }}>Back to search</Button>
          <Button type="submit" size="sm" disabled={busy || !hostId || !path.trim()}>{busy ? "Pinning…" : replacing ? "Repin" : "Pin to thread"}</Button></div>
      </form> : <Command shouldFilter={false} className="border-t" label="Choose a file to pin">
        <CommandInput autoFocus placeholder="Search files…" value={query} onValueChange={setQuery} disabled={busy} maxLength={500} />
        <CommandList aria-label="Files" aria-busy={searching || busy}>
          {paths.map((file) => <CommandItem key={file.path} value={file.path} disabled={busy} onSelect={() => void pin(file.path)}>
            <ReferenceIcon name={file.name} />
            <span className="min-w-0"><span className="block truncate">{file.name}</span><span className="block truncate text-xs text-muted-foreground">{file.path.startsWith(root + "/") ? file.path.slice(root.length + 1) : file.path}</span></span>
          </CommandItem>)}
          {paths.length === 0 && <div className="px-4 py-6 text-center text-sm text-muted-foreground" role="status">{searching ? "Searching…" : query.trim() ? "No files found." : "Type a filename to search."}</div>}
        </CommandList>
        <div className="flex items-center gap-2 border-t px-3 py-2">
          <span className="min-w-0 flex-1 truncate text-xs text-muted-foreground" title={root}>{root ? `Searching ${root}` : "Choose a machine"}</span>
          <Button type="button" size="sm" variant="ghost" disabled={busy} onClick={() => { setPaste(true); setError(null); }}>Paste a path…</Button>
        </div>
      </Command>}
      {error && <p role="alert" className="border-t px-4 py-3 text-xs text-destructive">{error}</p>}
    </DialogContent>
  </Dialog>;
}
