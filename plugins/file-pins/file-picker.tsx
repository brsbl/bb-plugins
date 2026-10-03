import { useEffect, useRef, useState } from "react";
import * as Menu from "@radix-ui/react-dropdown-menu";
import { useRpc } from "@get-bb/plugin-sdk/app";
import type { RecentFile, rpcContract } from "./contract.js";
import { Command, CommandInput, CommandItem, CommandList } from "./components/ui/command.js";
import { DropdownMenuContent, DropdownMenuItem } from "./components/ui/dropdown-menu.js";
import { Icon } from "./components/ui/icon.js";
import { ReferenceIcon } from "./reference-icon.js";

export function FilePicker({ threadId, recent, onClose, onPinned }: {
  threadId: string; recent: RecentFile[]; onClose(): void; onPinned(): Promise<void>;
}) {
  const rpc = useRpc<typeof rpcContract>();
  const input = useRef<HTMLInputElement>(null);
  const [hosts, setHosts] = useState<Array<{ id: string; name: string; connected: boolean }>>([]);
  const [hostId, setHostId] = useState("");
  const [query, setQuery] = useState("");
  const [paths, setPaths] = useState<Array<{ path: string; name: string }>>([]);
  const [paste, setPaste] = useState(false);
  const [searching, setSearching] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const directPath = /^(\/|~\/)/.test(query.trim());
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
    if (!hostId || directPath || !query.trim()) return;
    let cancelled = false;
    setSearching(true);
    const timeout = setTimeout(() => {
      rpc.call("search", { threadId, hostId, query }).then((result) => {
        if (!cancelled) setPaths(result.paths);
      }).catch((error: Error) => { if (!cancelled) setError(error.message); })
        .finally(() => { if (!cancelled) setSearching(false); });
    }, 120);
    return () => { cancelled = true; clearTimeout(timeout); };
  }, [directPath, hostId, query, rpc, threadId]);
  async function pin(path: string) {
    if (busy || !hostId) return;
    setBusy(true); setError(null);
    try {
      await rpc.call("pin", { threadId, hostId, path });
      await onPinned(); onClose();
    } catch (error) { setError(error instanceof Error ? error.message : String(error)); setBusy(false); }
  }
  const files = query.trim() ? paths : recent.filter((file) => file.hostId === hostId);
  return <div aria-label="Pin to thread">
    <Command shouldFilter={false} label="Choose a file to pin">
      <div className="flex items-center border-b pr-1">
        <div className="min-w-0 flex-1 [&_[cmdk-input-wrapper]]:border-b-0">
          <CommandInput ref={input} autoFocus placeholder={paste ? "Paste a file path…" : "Search files…"} value={query} onValueChange={setQuery} disabled={busy} maxLength={4096} />
        </div>
        {hosts.length > 1 && <select aria-label="Machine" title="Search machine" className="h-7 max-w-24 shrink-0 rounded bg-transparent text-xs text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring" value={hostId} disabled={busy} onChange={(event) => setHostId(event.target.value)}>
          {hosts.map((host) => <option key={host.id} value={host.id} disabled={!host.connected}>{host.name}{host.connected ? "" : " (offline)"}</option>)}
        </select>}
        {/* Keep this small menu anchored on mobile, using the shared menu recipe. */}
        <Menu.Root modal={false}>
          <Menu.Trigger asChild><button type="button" aria-label="Pin options" title="Pin options" disabled={busy} className="flex size-7 shrink-0 items-center justify-center rounded text-muted-foreground hover:bg-state-hover hover:text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"><Icon name="MoreHorizontal" className="size-4" /></button></Menu.Trigger>
          <DropdownMenuContent align="end" style={{ animation: "none", transition: "none" }} onCloseAutoFocus={(event) => { if (paste) { event.preventDefault(); input.current?.focus(); } }}>
            <DropdownMenuItem onSelect={() => { setPaste(true); setQuery(""); setError(null); }}>Paste a path…</DropdownMenuItem>
          </DropdownMenuContent>
        </Menu.Root>
      </div>
      {!query.trim() && files.length > 0 && <p className="px-3 pb-1 pt-2 text-xs text-muted-foreground">Recent in this thread</p>}
      <CommandList aria-label="Files" aria-busy={searching || busy} className="max-h-56 p-1">
        {directPath ? <CommandItem value={query.trim()} disabled={busy || !hostId} onSelect={() => void pin(query.trim())} title={query.trim()}>
          <ReferenceIcon name={query.trim().split("/").pop() || query.trim()} moss={false} />
          <span className="min-w-0 truncate">Pin {query.trim()}</span>
        </CommandItem> : files.map((file) => <CommandItem key={file.path} value={file.path} disabled={busy} onSelect={() => void pin(file.path)}>
          <ReferenceIcon name={file.name} moss={"moss" in file && file.moss === true} />
          <span className="min-w-0"><span className="block truncate">{file.name}</span><span className="block truncate text-xs text-muted-foreground" title={file.path}>{file.path}</span></span>
        </CommandItem>)}
        {!directPath && files.length === 0 && <p className="px-2 py-3 text-xs text-muted-foreground" role="status">{searching ? "Searching…" : query.trim() ? "No files found." : "Search for a file to pin."}</p>}
      </CommandList>
    </Command>
    {error && <p role="alert" className="px-3 py-2 text-xs text-destructive">{error}</p>}
  </div>;
}
