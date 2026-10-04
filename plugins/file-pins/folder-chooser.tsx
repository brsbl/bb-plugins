// Adapted from bb's ProjectPathDialog and RemotePathBrowser
// (apps/app/src/components/dialogs/), trimmed to choosing where the + picker
// searches: a machine, then a folder by browsing or typing, then confirm.
import { useCallback, useEffect, useRef, useState, type FormEvent, type ReactNode } from "react";
import { useRpc } from "@get-bb/plugin-sdk/app";
import type { DirectoryListing, Scope, rpcContract } from "./contract.js";
import { Button } from "./components/ui/button.js";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "./components/ui/dialog.js";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "./components/ui/dropdown-menu.js";
import { EmptyState } from "./components/ui/empty-state.js";
import { usePointerCoarse } from "./components/ui/hooks/use-pointer-coarse.js";
import { Icon } from "./components/ui/icon.js";
import { Input } from "./components/ui/input.js";
import { cn } from "./lib/utils.js";

export type ChooserHost = { id: string; name: string; connected: boolean };

interface Crumb { label: string; path: string }

function toBreadcrumb(directory: string): Crumb[] {
  if (!/^[A-Za-z]:/.test(directory)) {
    const crumbs: Crumb[] = [{ label: "/", path: "/" }];
    let accumulated = "";
    for (const segment of directory.split("/").filter(Boolean)) {
      accumulated = `${accumulated}/${segment}`;
      crumbs.push({ label: segment, path: accumulated });
    }
    return crumbs;
  }
  const segments = directory.replace(/\//g, "\\").split("\\").filter(Boolean);
  const drive = segments[0] ?? "";
  const crumbs: Crumb[] = [{ label: drive, path: `${drive}\\` }];
  let accumulated = drive;
  for (const segment of segments.slice(1)) {
    accumulated = `${accumulated}\\${segment}`;
    crumbs.push({ label: segment, path: accumulated });
  }
  return crumbs;
}

/** Like normalizeProjectPathInput in @bb/domain: trimmed, without trailing slashes. */
function normalizePathInput(path: string): string {
  const trimmed = path.trim();
  if (!trimmed || trimmed === "/") return trimmed;
  return /^[A-Za-z]:/.test(trimmed) ? trimmed.replace(/[\\/]+$/u, "") || trimmed : trimmed.replace(/\/+$/u, "");
}

/** Like MachineStatusDot (apps/app/src/components/machines/). */
function MachineStatusDot({ connected }: { connected: boolean }) {
  return <span aria-hidden className={cn("size-1.5 shrink-0 rounded-full", connected ? "bg-success" : "border border-muted-foreground")} />;
}

/** Fetches a folder listing through the plugin server, keeping the last one while the next loads. */
function useDirectory(threadId: string, hostId: string, path: string | null) {
  const rpc = useRpc<typeof rpcContract>();
  const key = `${hostId}\0${path ?? ""}`;
  const [state, setState] = useState<{ key: string | null; data: DirectoryListing | null; error: string | null }>({ key: null, data: null, error: null });
  useEffect(() => {
    let cancelled = false;
    rpc.call("directory", { threadId, hostId, ...(path ? { path } : {}) })
      .then((data) => { if (!cancelled) setState({ key, data, error: null }); })
      .catch((error: Error) => { if (!cancelled) setState((previous) => ({ ...previous, key, error: error.message || "Couldn't read this folder." })); });
    return () => { cancelled = true; };
  }, [hostId, key, path, rpc, threadId]);
  const settled = state.key === key;
  return { data: state.data, isError: settled && state.error !== null, error: state.error, isPlaceholderData: !settled && state.data !== null };
}

export function FolderChooser({ open, threadId, hosts, scope, onOpenChange, onChoose, onClosed }: {
  open: boolean; threadId: string; hosts: ChooserHost[]; scope: Scope | null;
  onOpenChange(open: boolean): void; onChoose(scope: Scope): void; onClosed(): void;
}) {
  return <Dialog open={open} onOpenChange={onOpenChange}>
    <DialogContent onAfterCloseAutoFocus={onClosed}>
      {open ? <FolderChooserContent threadId={threadId} hosts={hosts} scope={scope} onChoose={onChoose} /> : null}
    </DialogContent>
  </Dialog>;
}

function FolderChooserContent({ threadId, hosts, scope, onChoose }: {
  threadId: string; hosts: ChooserHost[]; scope: Scope | null; onChoose(scope: Scope): void;
}) {
  const firstConnectedHostId = hosts.find((host) => host.connected)?.id;
  const [selectedHostIdState, setSelectedHostId] = useState(scope?.hostId ?? firstConnectedHostId ?? null);
  const selectedHostId = hosts.some((host) => host.id === selectedHostIdState && host.connected) ? selectedHostIdState : firstConnectedHostId ?? null;
  const selectedHost = hosts.find((host) => host.id === selectedHostId);
  const showMachinePicker = hosts.length > 1;
  const [browserDirectory, setBrowserDirectory] = useState<string | null>(null);
  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (selectedHostId && browserDirectory) onChoose({ hostId: selectedHostId, path: browserDirectory });
  };
  return <>
    <DialogHeader>
      <DialogTitle>Search in</DialogTitle>
      <DialogDescription>
        {selectedHostId
          ? `Browse to a folder${selectedHost ? ` on ${selectedHost.name}` : ""}, or edit the path directly.`
          : "No machine is online. Start one to choose a folder."}
      </DialogDescription>
    </DialogHeader>
    <form className="min-w-0 space-y-4" onSubmit={handleSubmit}>
      {showMachinePicker ? <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button type="button" variant="outline" aria-label="Machine" className="w-full justify-between font-normal">
            <span className="flex min-w-0 items-center gap-2">
              {selectedHost ? <MachineStatusDot connected={selectedHost.connected} /> : null}
              <span className="min-w-0 truncate">{selectedHost?.name ?? "Select a machine"}</span>
            </span>
            <Icon name="ChevronDown" className="size-4 shrink-0 text-muted-foreground" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" mobileTitle="Machine" className="max-h-72 w-[var(--radix-dropdown-menu-trigger-width)] overflow-y-auto">
          {hosts.map((host) => <DropdownMenuItem key={host.id} disabled={!host.connected} className="flex items-center gap-2" onSelect={() => {
            if (!host.connected) return;
            setSelectedHostId(host.id);
            setBrowserDirectory(null);
          }}>
            <MachineStatusDot connected={host.connected} />
            <span className="min-w-0 flex-1 truncate">{host.name}</span>
            {!host.connected ? <span className="shrink-0 text-xs text-subtle-foreground">Offline</span> : null}
            <Icon name="Check" className={cn("size-4 shrink-0", host.id === selectedHostId ? "opacity-100" : "opacity-0")} />
          </DropdownMenuItem>)}
        </DropdownMenuContent>
      </DropdownMenu> : null}
      {selectedHostId ? <PathBrowser key={selectedHostId} threadId={threadId} hostId={selectedHostId}
        initialPath={scope?.hostId === selectedHostId ? scope.path : null} onDirectoryChange={setBrowserDirectory} />
        : <p className="rounded-md border px-3 py-6 text-center text-sm text-muted-foreground">Every machine is offline. Bring one online to browse its folders.</p>}
      <DialogFooter>
        <Button type="submit" disabled={!selectedHostId || !browserDirectory}>Search here</Button>
      </DialogFooter>
    </form>
  </>;
}

function PathBrowser({ threadId, hostId, initialPath, onDirectoryChange }: {
  threadId: string; hostId: string; initialPath: string | null; onDirectoryChange(directory: string | null): void;
}) {
  const [currentPath, setCurrentPath] = useState<string | null>(initialPath);
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState("");
  const editInputRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const isPointerCoarse = usePointerCoarse();
  const { data, isError, error, isPlaceholderData } = useDirectory(threadId, hostId, currentPath);
  const directory = isError ? null : data?.directory ?? null;
  const crumbs = data?.directory ? toBreadcrumb(data.directory) : [];
  const entries = data?.entries ?? [];
  const navigateTo = useCallback((path: string) => {
    scrollRef.current?.scrollTo({ top: 0 });
    setCurrentPath(path);
  }, []);
  useEffect(() => { onDirectoryChange(isPlaceholderData ? null : directory); }, [directory, isPlaceholderData, onDirectoryChange]);
  useEffect(() => { if (isEditing && !isPointerCoarse) editInputRef.current?.focus(); }, [isEditing, isPointerCoarse]);
  const openEditor = () => { setEditValue(data?.directory ?? ""); setIsEditing(true); };
  const commitEditor = () => {
    const normalized = normalizePathInput(editValue);
    setIsEditing(false);
    if (normalized) navigateTo(normalized);
  };

  let body: ReactNode;
  if (isError) body = <EmptyState icon="AlertCircle" message={error ?? "Couldn't read this folder."} messageClassName="text-destructive" className="px-2 py-3" />;
  else if (!data) body = <EmptyState icon="Spinner" iconClassName="animate-spin" message="Loading…" className="px-2 py-3" />;
  else if (entries.length === 0) body = <EmptyState message="This folder is empty." className="px-2 py-3" />;
  else body = <ul>
    {entries.map((entry) => entry.kind === "file"
      ? <li key={entry.path} className="flex w-full items-center gap-2 px-2 py-1 text-sm text-muted-foreground">
        <Icon name="File" className="size-4 shrink-0" />
        <span className="min-w-0 truncate" title={entry.name}>{entry.name}</span>
      </li>
      : <li key={entry.path} className="w-full">
        <button type="button" className="flex w-full items-center gap-2 rounded-sm px-2 py-1 text-left text-sm hover:bg-muted disabled:pointer-events-none" onClick={() => navigateTo(entry.path)}>
          <Icon name="Folder" className="size-4 shrink-0 text-muted-foreground" />
          <span className="min-w-0 truncate" title={entry.name}>{entry.name}</span>
          <Icon name="ChevronRight" className="ml-auto size-4 shrink-0 text-muted-foreground" />
        </button>
      </li>)}
  </ul>;

  return <div className="flex flex-col rounded-md border">
    <div className="flex items-center gap-1 border-b px-1.5 py-1">
      {isEditing ? <>
        <Input ref={editInputRef} aria-label="Folder path" className="h-7 flex-1 text-xs" value={editValue} placeholder="/path/to/folder"
          onChange={(event) => setEditValue(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") { event.preventDefault(); commitEditor(); }
            else if (event.key === "Escape") { event.preventDefault(); setIsEditing(false); }
          }} />
        <Button type="button" variant="ghost" size="icon" className="size-7 shrink-0" aria-label="Go to path" onClick={commitEditor}><Icon name="Check" /></Button>
      </> : <>
        <Button type="button" variant="ghost" size="icon" className="size-7 shrink-0" aria-label="Go to parent folder" disabled={!data?.parent}
          onClick={() => { if (data?.parent) navigateTo(data.parent); }}><Icon name="ArrowUp" /></Button>
        <div className="flex min-w-0 flex-1 items-center overflow-x-auto whitespace-nowrap text-xs text-muted-foreground">
          {crumbs.map((crumb, index) => <span key={crumb.path} className="flex items-center">
            {index > 0 ? <Icon name="ChevronRight" className="size-3 shrink-0 opacity-50" /> : null}
            <button type="button" className={cn("rounded px-1 py-0.5 hover:bg-muted hover:text-foreground", index === crumbs.length - 1 && "font-medium text-foreground")}
              onClick={() => navigateTo(crumb.path)}>{crumb.label}</button>
          </span>)}
        </div>
        <Button type="button" variant="ghost" size="icon" className="size-7 shrink-0" aria-label="Edit path" onClick={openEditor}><Icon name="Edit" /></Button>
      </>}
    </div>
    <div ref={scrollRef} className={cn("h-56 min-h-0 overflow-y-auto px-1.5 py-1", isPlaceholderData && "opacity-60")}>{body}</div>
  </div>;
}
