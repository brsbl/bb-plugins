import { useEffect, useRef, useState } from "react";
import { useRpc } from "@get-bb/plugin-sdk/app";
import type { RecentFile, Scope, rpcContract } from "./contract.js";
import { Command, CommandInput, CommandItem, CommandList } from "./components/ui/command.js";
import { Icon } from "./components/ui/icon.js";
import { formatHomePathForDisplay } from "./lib/utils.js";
import { FolderChooser, type ChooserHost } from "./folder-chooser.js";
import { ReferenceIcon } from "./reference-icon.js";

type Result = { path: string; name: string; hostId: string };

const folderName = (path: string) => path.split(/[\\/]/).filter(Boolean).pop() ?? path;

export function FilePicker({ threadId, recent, stripFull, choosingFolder, onChoosingFolderChange, onClose, onPinned }: {
  threadId: string; recent: RecentFile[]; stripFull: boolean; choosingFolder: boolean;
  onChoosingFolderChange(open: boolean): void; onClose(): void; onPinned(): Promise<void>;
}) {
  const rpc = useRpc<typeof rpcContract>();
  const inputRef = useRef<HTMLInputElement>(null);
  const [hosts, setHosts] = useState<ChooserHost[]>([]);
  const [scope, setScope] = useState<Scope | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Result[]>([]);
  const [searching, setSearching] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const text = query.trim();
  // An absolute, ~/ or relative path offers itself first, alongside search matches.
  const typedPath = text.includes("/");
  const scopeHost = hosts.find((host) => host.id === scope?.hostId);
  useEffect(() => {
    let cancelled = false;
    rpc.call("context", { threadId }).then((result) => {
      if (cancelled) return;
      setHosts(result.hosts);
      setScope(result.scope);
    }).catch((error: Error) => { if (!cancelled) setError(error.message); })
      .finally(() => { if (!cancelled) setLoaded(true); });
    return () => { cancelled = true; };
  }, [rpc, threadId]);
  useEffect(() => {
    setResults([]); setError(null); setSearching(false);
    if (!scope || !text) return;
    let cancelled = false;
    setSearching(true);
    const timeout = setTimeout(() => {
      rpc.call("search", { threadId, hostId: scope.hostId, root: scope.path, query: text }).then((result) => {
        if (!cancelled) setResults(result.paths.map((file) => ({ ...file, hostId: scope.hostId })));
      }).catch((error: Error) => { if (!cancelled && !typedPath) setError(error.message); })
        .finally(() => { if (!cancelled) setSearching(false); });
    }, 120);
    return () => { cancelled = true; clearTimeout(timeout); };
  }, [rpc, scope, text, threadId, typedPath]);
  async function pin(fileHostId: string, path: string, cwd?: string) {
    if (busy) return;
    setBusy(true); setError(null);
    try {
      // With no room on the strip, new files join the ⋯ list instead.
      await rpc.call("pin", { threadId, hostId: fileHostId, path, ...(cwd ? { cwd } : {}), ...(stripFull ? { unpinned: true } : {}) });
      await onPinned(); onClose();
    } catch (error) { setError(error instanceof Error ? error.message : String(error)); setBusy(false); }
  }
  function choose(next: Scope) {
    setScope(next); onChoosingFolderChange(false);
    rpc.call("setScope", { threadId, scope: next }).catch((error: Error) => setError(error.message));
  }
  const files: Result[] = text ? results : recent;
  const hostName = (id: string) => hosts.find((host) => host.id === id)?.name;
  const showMachines = hosts.length > 1 && new Set(files.map((file) => file.hostId)).size > 1;
  const scopeLabel = scope ? folderName(scope.path) : loaded ? "Choose a folder" : "…";
  // The machine is named only when there is more than one.
  const machine = hosts.length > 1 && scopeHost ? scopeHost.name : null;
  return <div aria-label="Pin to thread">
    <Command shouldFilter={false} label="Choose a file to pin">
      <CommandInput ref={inputRef} autoFocus placeholder="Search files…" value={query} onValueChange={setQuery} disabled={busy} maxLength={4096} />
      <button type="button" disabled={busy || !loaded} onClick={() => onChoosingFolderChange(true)}
        // cmdk treats Enter anywhere in the command as choosing the highlighted file.
        onKeyDown={(event) => { if (event.key === "Enter") event.stopPropagation(); }}
        aria-label={scope ? `Search folder: ${scopeLabel}${machine ? ` on ${machine}` : ""}. Change` : "Choose a folder to search"}
        title={scope ? formatHomePathForDisplay(scope.path) : undefined}
        className="flex h-8 w-full min-w-0 items-center gap-1.5 border-b px-3 text-left text-xs text-muted-foreground transition-colors hover:bg-state-hover hover:text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-inset focus-visible:ring-ring disabled:pointer-events-none">
        <Icon name="Folder" className="size-3.5 shrink-0" aria-hidden />
        <span className="min-w-0 max-w-full shrink-0 truncate text-foreground">{scopeLabel}</span>
        {machine ? <span className="min-w-0 truncate">· {machine}</span> : null}
      </button>
      {!text && files.length > 0 && <p className="px-3 pb-1 pt-2 text-xs text-subtle-foreground">Recent in this thread</p>}
      <CommandList aria-label="Files" aria-busy={searching || busy} className="max-h-56 p-1">
        {typedPath && <CommandItem value={`path:${text}`} disabled={busy || !scope} onSelect={() => { if (scope) void pin(scope.hostId, text, scope.path); }} title={text}>
          <ReferenceIcon path={text} />
          <span className="min-w-0 truncate">Pin {text}</span>
        </CommandItem>}
        {files.map((file) => <CommandItem key={`${file.hostId}:${file.path}`} value={`${file.hostId}:${file.path}`} disabled={busy} onSelect={() => void pin(file.hostId, file.path)}>
          <ReferenceIcon path={file.path} />
          <span className="min-w-0">
            <span className="block truncate">{file.name}</span>
            <span className="block truncate text-xs text-muted-foreground" title={file.path}>{showMachines ? `${hostName(file.hostId) ?? "Unknown machine"} · ${file.path}` : file.path}</span>
          </span>
        </CommandItem>)}
        {!typedPath && files.length === 0 && <p className="px-2 py-3 text-xs text-muted-foreground" role="status">
          {!loaded ? "Loading…" : !scope ? "No machine is online." : searching ? "Searching…" : text ? `No files found in ${folderName(scope.path)}.` : "Search for a file to pin."}
        </p>}
      </CommandList>
    </Command>
    {error && <p role="alert" className="px-3 py-2 text-xs text-destructive">{error}</p>}
    <FolderChooser open={choosingFolder} threadId={threadId} hosts={hosts} scope={scope} onChoose={choose}
      onOpenChange={onChoosingFolderChange} onClosed={() => inputRef.current?.focus()} />
  </div>;
}
