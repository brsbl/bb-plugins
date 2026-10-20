import { useEffect, useState } from "react";
import { readableError, useCalendarRpc } from "./data.js";

type Machines = { id: string; name: string; connected: boolean }[];
type Found = { path: string; name: string; relative: string };
const looksLikePath = (value: string) => /^(\/|~\/)/.test(value.trim());

/**
 * Attach → File on Mac. Searches the Mac through bb's host connection,
 * starting in ~/Moss/Notes; a typed absolute path attaches that file. The
 * machine picker appears only when more than one machine is enrolled.
 */
export function FilePicker({ machines, onPick, onCancel }: {
  machines: Machines | null; onPick: (machineId: string, path: string) => Promise<void>; onCancel: () => void;
}) {
  const rpc = useCalendarRpc();
  const connected = machines?.filter((machine) => machine.connected) ?? [];
  const [machineId, setMachineId] = useState<string | null>(null);
  const machine = machineId ?? connected[0]?.id ?? null;
  const [query, setQuery] = useState("");
  const [result, setResult] = useState<{ root: string; files: Found[] } | null>(null);
  const [active, setActive] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    if (!machine || looksLikePath(query)) return;
    let live = true;
    const timer = setTimeout(() => {
      rpc.call("searchFiles", { machineId: machine, query: query.trim() }).then((next) => { if (live) { setResult(next); setActive(0); setError(null); } },
        (err: unknown) => { if (live) setError(readableError(err)); });
    }, 200);
    return () => { live = false; clearTimeout(timer); };
  }, [rpc, machine, query]);
  const pick = async (path: string) => {
    if (!machine || busy) return;
    setBusy(true); setError(null);
    try { await onPick(machine, path); } catch (err) { setError(readableError(err)); } finally { setBusy(false); }
  };
  if (!machines) return <div className="cc-picker"><p className="cc-muted" role="status">Looking for your Mac…</p></div>;
  if (!connected.length) return <div className="cc-picker">
    <p className="cc-muted">Mac offline. Attach a file when it reconnects.</p>
    <div className="cc-row-actions"><button type="button" className="cc-button" onClick={onCancel}>Close</button></div>
  </div>;
  const files = result?.files ?? [];
  const typedPath = looksLikePath(query) ? query.trim() : null;
  return <div className="cc-picker">
    <div className="cc-row-actions">
      {machines.length > 1 && <select className="cc-input" aria-label="Machine" value={machine ?? ""} onChange={(event) => { setMachineId(event.target.value); setResult(null); }}>
        {machines.map((entry) => <option key={entry.id} value={entry.id} disabled={!entry.connected}>{entry.name}{entry.connected ? "" : " (offline)"}</option>)}
      </select>}
      <input className="cc-input cc-grow" aria-label={result ? `Search files in ${result.root}` : "Search files"} placeholder="Search, or type a path" autoFocus
        role="combobox" aria-expanded={files.length > 0} aria-controls="cc-file-results" aria-activedescendant={!typedPath && files[active] ? `cc-file-${active}` : undefined}
        value={query} onChange={(event) => setQuery(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === "ArrowDown") { event.preventDefault(); setActive((index) => Math.min(index + 1, files.length - 1)); }
          else if (event.key === "ArrowUp") { event.preventDefault(); setActive((index) => Math.max(index - 1, 0)); }
          else if (event.key === "Enter") { event.preventDefault(); const path = typedPath ?? files[active]?.path; if (path) void pick(path); }
          else if (event.key === "Escape") { event.preventDefault(); onCancel(); }
        }} />
    </div>
    {typedPath ? <button type="button" className="cc-result" disabled={busy} onClick={() => void pick(typedPath)}>Attach {typedPath}</button>
      : <div id="cc-file-results" role="listbox" aria-label={result ? `Files in ${result.root}` : "Files"} className="cc-results">
        {result && !files.length && <p className="cc-empty-line">No matching files in {result.root}.</p>}
        {files.map((file, index) => <div key={file.path} id={`cc-file-${index}`} role="option" aria-selected={index === active} className="cc-result"
          onMouseEnter={() => setActive(index)} onClick={() => void pick(file.path)}>
          <span>{file.name}</span><small>{file.relative}</small>
        </div>)}
      </div>}
    {error && <p className="cc-error" role="alert">{error}</p>}
    <div className="cc-row-actions"><button type="button" className="cc-button" onClick={onCancel}>Cancel</button></div>
  </div>;
}
