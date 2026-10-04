import { useEffect, useState } from "react";
import { useRpc } from "@get-bb/plugin-sdk/app";
import type { RecentFile, rpcContract } from "./contract.js";
import { Command, CommandGroup, CommandInput, CommandItem, CommandList } from "./components/ui/command.js";
import { ReferenceIcon } from "./reference-icon.js";

type Result = { path: string; name: string; hostId: string; hostName?: string; moss: boolean };
const groupClass = "p-0 [&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:pb-1 [&_[cmdk-group-heading]]:pt-2 [&_[cmdk-group-heading]]:font-normal";

export function FilePicker({ threadId, recent, stripFull, onClose, onPinned }: {
  threadId: string; recent: RecentFile[]; stripFull: boolean; onClose(): void; onPinned(): Promise<void>;
}) {
  const rpc = useRpc<typeof rpcContract>();
  const [hosts, setHosts] = useState<Array<{ id: string; name: string; connected: boolean }>>([]);
  const [hostId, setHostId] = useState("");
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Result[]>([]);
  const [searching, setSearching] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const text = query.trim();
  // An absolute, ~/ or relative path offers itself first, alongside search matches.
  const typedPath = text.includes("/");
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
    setResults([]); setError(null); setSearching(false);
    if (!hostId || !text) return;
    let cancelled = false;
    setSearching(true);
    const timeout = setTimeout(() => {
      rpc.call("search", { threadId, hostId, query: text }).then((result) => {
        if (!cancelled) setResults(result.paths);
      }).catch((error: Error) => { if (!cancelled && !typedPath) setError(error.message); })
        .finally(() => { if (!cancelled) setSearching(false); });
    }, 120);
    return () => { cancelled = true; clearTimeout(timeout); };
  }, [hostId, rpc, text, threadId, typedPath]);
  async function pin(fileHostId: string, path: string) {
    if (busy || !fileHostId) return;
    setBusy(true); setError(null);
    try {
      // With no room on the strip, new files join the ⋯ list instead.
      await rpc.call("pin", { threadId, hostId: fileHostId, path, ...(stripFull ? { unpinned: true } : {}) });
      await onPinned(); onClose();
    } catch (error) { setError(error instanceof Error ? error.message : String(error)); setBusy(false); }
  }
  const files: Result[] = text ? results : recent.filter((file) => file.hostId === hostId);
  const notes = text ? files.filter((file) => file.moss) : [];
  const others = files.filter((file) => !notes.includes(file));
  const showMachines = new Set(files.map((file) => file.hostId)).size > 1;
  const row = (file: Result) => <CommandItem key={`${file.hostId}:${file.path}`} value={`${file.hostId}:${file.path}`} disabled={busy} onSelect={() => void pin(file.hostId, file.path)}>
    <ReferenceIcon name={file.name} moss={file.moss} />
    <span className="min-w-0">
      <span className="block truncate">{file.name}</span>
      <span className="block truncate text-xs text-muted-foreground" title={file.path}>{showMachines && file.hostName ? `${file.hostName} · ${file.path}` : file.path}</span>
    </span>
  </CommandItem>;
  return <div aria-label="Pin to thread">
    <Command shouldFilter={false} label="Choose a file to pin">
      <div className="flex items-center border-b pr-1">
        <div className="min-w-0 flex-1 [&_[cmdk-input-wrapper]]:border-b-0">
          <CommandInput autoFocus placeholder="Search files…" value={query} onValueChange={setQuery} disabled={busy} maxLength={4096} />
        </div>
        {hosts.length > 1 && <select aria-label="Machine" title="Search machine" className="h-7 max-w-24 shrink-0 rounded bg-transparent text-xs text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring" value={hostId} disabled={busy} onChange={(event) => setHostId(event.target.value)}>
          {hosts.map((host) => <option key={host.id} value={host.id} disabled={!host.connected}>{host.name}{host.connected ? "" : " (offline)"}</option>)}
        </select>}
      </div>
      {!text && files.length > 0 && <p className="px-3 pb-1 pt-2 text-xs text-muted-foreground">Recent in this thread</p>}
      <CommandList aria-label="Files" aria-busy={searching || busy} className="max-h-56 p-1">
        {typedPath && <CommandItem value={`path:${text}`} disabled={busy || !hostId} onSelect={() => void pin(hostId, text)} title={text}>
          <ReferenceIcon name={text.split("/").pop() || text} moss={false} />
          <span className="min-w-0 truncate">Pin {text}</span>
        </CommandItem>}
        {notes.length > 0 && <CommandGroup heading="Moss notes" className={groupClass}>{notes.map(row)}</CommandGroup>}
        {others.length > 0 && (notes.length > 0 ? <CommandGroup heading="Files" className={groupClass}>{others.map(row)}</CommandGroup> : others.map(row))}
        {!typedPath && files.length === 0 && <p className="px-2 py-3 text-xs text-muted-foreground" role="status">{searching ? "Searching…" : text ? "No files found." : "Search for a file to pin."}</p>}
      </CommandList>
    </Command>
    {error && <p role="alert" className="px-3 py-2 text-xs text-destructive">{error}</p>}
  </div>;
}
