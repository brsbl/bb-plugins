import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { definePluginApp, experimental_Icon as Icon, useRealtime, useRpc } from "@get-bb/plugin-sdk/app";
import type { contract } from "./contract.js";
import { STATE_CHANGED } from "./signals.js";
import { CountPanel } from "./components/panel.js";
import {
  COLS, PLANS, fmtStamp, heatAlpha, heatMax, nextSort, regions, visibleRows,
  type Row, type Signal, type Snapshot, type State, type View,
} from "./components/view.js";
import "./app.css";

const POLL_UPDATING_MS = 3_000;
const POLL_IDLE_MS = 60_000;

// The server publishes STATE_CHANGED on every change; polling is the fallback if an event is missed.
// Filters, search and sort survive leaving and reopening the page, like the original page's URL hash.
const session: View = { plan: "all", reg: "all", q: "", sort: "n", dir: -1 };

const message = (error: unknown) => error instanceof Error ? error.message : String(error);
const sentence = (text: string) => text.trim().replace(/[.\s]+$/u, "");

/**
 * Loads the saved snapshot and update status. The snapshot on screen only ever
 * changes by replacing the whole state with a new getState result, so a
 * finished update swaps the table in one step.
 */
function useCompanies() {
  const rpc = useRpc<typeof contract>();
  const [state, setState] = useState<State | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const load = useCallback(async () => {
    try {
      setState(await rpc.call("getState"));
      setLoadError(null);
    } catch (error) {
      setLoadError(message(error));
    }
  }, [rpc]);
  const refresh = useCallback(async () => {
    setState((prev) => prev && { ...prev, status: { ...prev.status, state: "updating", error: undefined } });
    try {
      const status = await rpc.call("refresh");
      setState((prev) => ({ snapshot: prev?.snapshot ?? null, status }));
    } catch (error) {
      setState((prev) => ({ snapshot: prev?.snapshot ?? null, status: { state: "failed", error: message(error) } }));
      return;
    }
    await load();
  }, [rpc, load]);

  useEffect(() => { void load(); }, [load]);
  useRealtime(STATE_CHANGED, () => void load());
  const updating = state?.status.state === "updating";
  useEffect(() => {
    const timer = setTimeout(() => void load(), updating ? POLL_UPDATING_MS : POLL_IDLE_MS);
    return () => clearTimeout(timer);
  }, [state, loadError, updating, load]);
  return { state, loadError, load, refresh };
}

function Table({ rows, all, view, setView, open, onCount }: {
  rows: Row[]; all: Row[]; view: View; setView: (view: View) => void;
  open: { c: string; s: Signal } | null; onCount: (c: string, s: Signal) => void;
}) {
  const max = useMemo(() => heatMax(all), [all]);
  const count = (x: Row, s: Signal, label: ReactNode, className = "cnt") =>
    <button type="button" className={className} data-c={x.c} data-s={s} aria-expanded={open?.c === x.c && open.s === s} onClick={() => onCount(x.c, s)}>{label}</button>;
  return <div className="wrap"><table>
    <thead><tr>{COLS.map(({ key, label, num, tip }) => {
      const active = view.sort === key;
      return <th key={key} className={num ? "n" : undefined} title={tip} aria-sort={active ? (view.dir > 0 ? "ascending" : "descending") : "none"}>
        <button type="button" onClick={() => setView(nextSort(view, key))}>{label}{active ? (view.dir > 0 ? " ↑" : " ↓") : ""}</button>
      </th>;
    })}</tr></thead>
    <tbody>{rows.map((x) => <tr key={x.c}>
      <td className="co" title={x.full || x.c}>{x.url ? <a href={x.url} target="_blank" rel="noopener">{x.c}</a> : x.c}</td>
      <td className="ctry" title={x.region || ""}>{x.country ? x.country : <span className="z">—</span>}</td>
      <td className="n sz">{x.size}</td>
      <td className="plan">{x.seg === "Size unknown" ? <span className="z">—</span> : <span className={`chip pl-${x.seg.split(" ")[0]}`}>{x.seg === "Small team" ? "Under 20" : x.seg}</span>}</td>
      <td className="n">{x.ppl.length ? count(x, "n", x.n) : x.n}</td>
      {(["iss", "prs", "dis"] as const).map((c) => <td key={c} className={`n${x[c] ? "" : " z"}`} style={x[c] ? { background: `rgba(var(--heat),${heatAlpha(x[c], max[c])})` } : undefined}>{x[c] ? count(x, c, x[c]) : 0}</td>)}
      <td className="sl">{x.slack ? count(x, "slack", <span className="chip yes">Connected</span>, "cnt chipbtn") : <span className="z">—</span>}</td>
    </tr>)}</tbody>
  </table></div>;
}

function CompaniesPage({ snapshot }: { snapshot: Snapshot }) {
  const [view, setViewState] = useState<View>(() => ({ ...session }));
  const setView = useCallback((next: View) => { Object.assign(session, next); setViewState(next); }, []);
  const [open, setOpen] = useState<{ c: string; s: Signal } | null>(null);
  const root = useRef<HTMLDivElement>(null);
  const all = snapshot.rows;
  const rows = useMemo(() => visibleRows(all, view), [all, view]);
  const regs = useMemo(() => regions(all), [all]);
  const openRow = open ? all.find((r) => r.c === open.c) : undefined;

  const trigger = useCallback((target: { c: string; s: Signal } | null) => {
    if (!target || !root.current) return null;
    return Array.from(root.current.querySelectorAll<HTMLElement>("button.cnt")).find((b) => b.dataset.c === target.c && b.dataset.s === target.s) ?? null;
  }, []);
  const close = useCallback(() => {
    setOpen((prev) => {
      if (prev) queueMicrotask(() => trigger(prev)?.focus());
      return null;
    });
  }, [trigger]);
  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => { if (event.key === "Escape") close(); };
    const onClick = (event: MouseEvent) => {
      const target = event.target as Element | null;
      if (!target?.closest?.(".cub-panel") && !target?.closest?.("button.cnt")) close();
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("click", onClick);
    return () => { document.removeEventListener("keydown", onKey); document.removeEventListener("click", onClick); };
  }, [open, close]);

  const select = (label: string, key: "plan" | "reg", options: [string, string][]) =>
    <label className="fl"><span>{label}</span><select value={view[key]} onChange={(event) => setView({ ...view, [key]: event.target.value })}>
      {options.map(([value, text]) => <option key={value} value={value}>{text}</option>)}
    </select></label>;

  return <div ref={root} className="cub-body">
    <div className="controls">
      {select("bb plan", "plan", PLANS)}
      {select("Region", "reg", regs)}
      <input type="search" placeholder="Search company or person" aria-label="Search company or person" value={view.q} onChange={(event) => setView({ ...view, q: event.target.value })} />
    </div>
    <p className="sum"><b>{rows.length}</b> companies · <b>{rows.reduce((sum, x) => sum + x.n, 0)}</b> users</p>
    <Table rows={rows} all={all} view={view} setView={setView} open={openRow ? open : null}
      onCount={(c, s) => open?.c === c && open.s === s ? close() : setOpen({ c, s })} />
    {open && openRow ? <CountPanel key={`${open.c}|${open.s}`} row={openRow} sig={open.s}
      anchor={() => trigger(open)} container={() => root.current} onClose={close} /> : null}
  </div>;
}

export function CompaniesUsingBb() {
  const { state, loadError, load, refresh } = useCompanies();
  const snapshot = state?.snapshot ?? null;
  const status = state?.status;
  const updating = status?.state === "updating";
  const failed = status?.state === "failed";
  return <div className="cub">
    <header>
      <div className="title">
        <h1>Companies using bb</h1>
        <button type="button" className="refresh" aria-label="Update now" title="Update now" disabled={!state || updating} onClick={() => void refresh()}>
          <Icon name="RotateCcw" aria-hidden="true" className={updating ? "spin" : undefined} />
        </button>
      </div>
      {snapshot ? <p className="stamp" aria-live="polite">Updated <time dateTime={snapshot.updatedAt}>{fmtStamp(snapshot.updatedAt)}</time> · updates daily{updating ? " · Updating…" : ""}</p> : null}
      <p className="sub">Using = opening a GitHub issue or PR, posting in Discord, or having Slack Connect with us</p>
    </header>
    {failed ? <div className="banner" role="alert">
      <p>Couldn't update: {sentence(status.error || "unknown error")}.{snapshot ? ` Showing data from ${fmtStamp(snapshot.updatedAt)}.` : ""}</p>
      <button type="button" onClick={() => void refresh()}>Retry</button>
    </div> : null}
    {!state && loadError ? <div className="banner" role="alert">
      <p>Couldn't load: {sentence(loadError)}.</p>
      <button type="button" onClick={() => void load()}>Retry</button>
    </div> : null}
    {snapshot ? <CompaniesPage snapshot={snapshot} />
      : failed || (!state && loadError) ? null
        : <div className="placeholder" aria-busy="true" aria-label="Loading companies"><span>Loading companies…</span>{[0, 1, 2, 3, 4].map((i) => <i key={i} />)}</div>}
  </div>;
}

export default definePluginApp((app) => {
  app.slots.navPanel({ id: "companies-using-bb", path: "companies", title: "Companies using bb", icon: "Globe", component: CompaniesUsingBb });
});
