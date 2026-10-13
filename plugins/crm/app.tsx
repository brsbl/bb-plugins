import { Fragment, useEffect, useState } from "react";
import { definePluginApp, experimental_Icon as Icon, useRpc, useRealtime, useRealtimeConnectionState } from "@get-bb/plugin-sdk/app";
import type { contract } from "./contract.js";
import { CHANGED } from "./signals.js";
import { CUSTOMER_CRITERIA, INVESTOR_CRITERIA, type CustomerRow, type InvestorRow, type Interaction, type Person, type Subject } from "./model.js";
import { Button } from "./components/ui/button.js";
import { Input } from "./components/ui/input.js";
import "./app.css";

type CustomerPage = { items: CustomerRow[]; total: number; nextOffset: number | null };
type InvestorPage = { items: InvestorRow[]; total: number; rankCount: number; nextOffset: number | null };
type HistoryPage = { items: Interaction[]; people: Person[]; nextOffset: number | null };
const label = (value: string) => value.charAt(0).toUpperCase() + value.slice(1);
export function dayText(value: string | null): string {
  if (!value) return "No date set";
  const now = new Date();
  const today = [now.getFullYear(), String(now.getMonth() + 1).padStart(2, "0"), String(now.getDate()).padStart(2, "0")].join("-");
  const parsed = new Date(value + "T12:00:00");
  const formatted = parsed.toLocaleDateString(undefined, { month: "short", day: "numeric", ...(parsed.getFullYear() !== now.getFullYear() ? { year: "numeric" as const } : {}) });
  return (value === today ? "Today · " : value < today ? "Overdue · " : "") + formatted;
}
function History({ subject, name, legacyStage, revision }: { subject: Subject; name: string; legacyStage?: string; revision: string }) {
  const rpc = useRpc<typeof contract>();
  const [offset, setOffset] = useState(0);
  const [retry, setRetry] = useState(0);
  const [result, setResult] = useState<HistoryPage | null>(null);
  const [error, setError] = useState(false);
  useEffect(() => {
    let active = true;
    setResult(null); setError(false);
    rpc.call("history", { ...subject, offset }).then(value => { if (active) setResult(value); }, () => { if (active) setError(true); });
    return () => { active = false; };
  }, [rpc, subject.subjectType, subject.subjectId, offset, revision, retry]);
  return <section className="crm-history" aria-label={name + " interaction history"}>
    {legacyStage && <p className="crm-legacy">Previous investor stage: <strong>{legacyStage}</strong></p>}
    {error ? <div role="alert"><p>History couldn’t load.</p><Button size="sm" variant="ghost" onClick={() => setRetry(v => v + 1)}>Try again</Button></div>
      : !result ? <p role="status">Loading history…</p>
      : <>
        {!result.items.length && <p>No interactions logged yet.</p>}
        {result.items.map(event => <div className="crm-event" key={event.id}>
          <div className="crm-event-meta"><span>{label(event.kind)}</span><span aria-hidden="true">·</span><time dateTime={event.date}>{new Date(event.date + "T12:00:00").toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}</time>{event.personId && <><span aria-hidden="true">·</span><span>{result.people.find(p => p.id === event.personId)?.name ?? "Contact"}</span></>}{event.track && <><span aria-hidden="true">·</span><span>{label(event.track)}</span></>}</div>
          <p>{event.note}</p>
        </div>)}
        {(offset > 0 || result.nextOffset !== null) && <div className="crm-pages"><Button size="sm" variant="ghost" disabled={offset === 0} onClick={() => setOffset(0)}>Latest</Button><Button size="sm" variant="ghost" disabled={result.nextOffset === null} onClick={() => setOffset(result.nextOffset!)}>Older</Button></div>}
      </>}
  </section>;
}
function Score({ value, criterion }: { value: number | null; criterion: string }) {
  return <td className="crm-score-cell"><span className="crm-score" data-score={value ?? "unset"} aria-label={criterion + ": " + (value === null ? "not scored" : value + " of 5")}>{value ?? "—"}</span></td>;
}
function Total({ value, scores }: { value: number | null; scores: Record<string, number | null> }) {
  return <td className="crm-total" title={Object.values(scores).filter(v => v !== null).length + " of 4 criteria scored"}>{value === null ? "—" : <>{value}<small>/20</small></>}</td>;
}
function NextStep({ track }: { track: CustomerRow["track"] }) {
  return <>{track?.nextStep || <span className="crm-muted">No next step set</span>}{track && <div className="crm-meta">{track.owner && <span>{track.owner} · </span>}<time dateTime={track.date ?? undefined}>{dayText(track.date)}</time></div>}</>;
}
export function CrmPage() {
  const rpc = useRpc<typeof contract>();
  const connection = useRealtimeConnectionState();
  const [kind, setKind] = useState<"customers" | "investors">("customers");
  const [query, setQuery] = useState("");
  const [offset, setOffset] = useState(0);
  const [revision, setRevision] = useState(0);
  const [data, setData] = useState<CustomerPage | InvestorPage | null>(null);
  const [error, setError] = useState(false);
  const [history, setHistory] = useState<string | null>(null);
  const [editing, setEditing] = useState<CustomerRow | InvestorRow | null>(null);
  const [position, setPosition] = useState(1);
  const [why, setWhy] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  useRealtime(CHANGED, () => setRevision(value => value + 1));
  useEffect(() => {
    let active = true;
    setError(false);
    const input = { query, limit: 50, offset };
    const request = kind === "customers" ? rpc.call("customers", input) : rpc.call("investors", input);
    request.then(value => { if (active) setData(value); }, () => { if (active) setError(true); });
    return () => { active = false; };
  }, [rpc, query, kind, offset, revision, connection]);
  const startEdit = (row: CustomerRow | InvestorRow) => {
    setEditing(row); setPosition("rank" in row ? row.rank : row.tier); setWhy(row.why); setSaveError("");
  };
  const save = async (automatic = false) => {
    if (!editing) return;
    setSaving(true); setSaveError("");
    try {
      if ("rank" in editing) {
        if (automatic) await rpc.call("autoRank", { id: editing.track.id });
        else await rpc.call("setRank", { id: editing.track.id, rank: position, why });
      } else await rpc.call("setTier", { id: editing.company.id, tier: automatic ? null : position, why });
      setEditing(null); setRevision(v => v + 1);
    } catch { setSaveError("Couldn’t save the priority. Check the position and reason, then try again."); }
    finally { setSaving(false); }
  };
  const priorityEditor = editing && <div className="crm-editor" key={"rank" in editing ? editing.track.id : editing.company.id}>
    <h3>{"rank" in editing ? "Rank " + (editing.person?.name ?? editing.company?.name ?? "investor") : "Tier for " + editing.company.name}</h3>
    <form className="crm-edit" aria-label="Edit priority" onSubmit={event => { event.preventDefault(); void save(); }}>
      <label>{kind === "investors" ? "Rank" : "Tier"}<Input autoFocus type="number" min={1} max={kind === "customers" ? 3 : (data as InvestorPage)?.rankCount} required value={position} disabled={saving} onChange={event => setPosition(Number(event.target.value))} /></label>
      <label className="crm-edit-why">Why it belongs here<Input required maxLength={2000} value={why} disabled={saving} onChange={event => setWhy(event.target.value)} /></label>
      <div className="crm-edit-actions"><Button type="button" size="sm" variant="ghost" disabled={saving} onClick={() => void save(true)}>Use score {kind === "customers" ? "tier" : "order"}</Button><Button type="button" size="sm" variant="ghost" disabled={saving} onClick={() => setEditing(null)}>Cancel</Button><Button size="sm" type="submit" disabled={saving}>{saving ? "Saving…" : "Save"}</Button></div>
      {saveError && <p role="alert">{saveError}</p>}
    </form>
  </div>;
  const historyButton = (id: string, name: string) => <Button size="sm" variant="ghost" aria-label={"History for " + name} aria-expanded={history === id} onClick={() => setHistory(history === id ? null : id)}><Icon name={history === id ? "ChevronDown" : "History"} className="size-4" /></Button>;
  const criteria = kind === "customers" ? CUSTOMER_CRITERIA : INVESTOR_CRITERIA;
  return <div className="crm-root"><main className="crm-wrap">
    <h1 className="crm-title">CRM</h1>
    <div className="crm-toolbar">
      <div className="crm-filters" role="group" aria-label="Pipeline"><Button size="sm" variant="ghost" aria-pressed={kind === "customers"} disabled={saving} onClick={() => { if (kind === "customers") return; setKind("customers"); setData(null); setOffset(0); setHistory(null); setEditing(null); }}>Customers</Button><Button size="sm" variant="ghost" aria-pressed={kind === "investors"} disabled={saving} onClick={() => { if (kind === "investors") return; setKind("investors"); setData(null); setOffset(0); setHistory(null); setEditing(null); }}>Investors</Button></div>
      <div className="crm-search"><Icon name="Search" className="size-4" /><Input aria-label="Search people or companies" placeholder="Search people or companies" value={query} maxLength={200} disabled={saving} onChange={event => { setData(null); setQuery(event.target.value); setOffset(0); setEditing(null); }} /></div>
    </div>
    <div className="crm-description"><div><h2>{kind === "customers" ? "Impact & milestones" : "Investor value"}</h2><p>{kind === "customers" ? "Tier sets priority. Milestone shows progress." : "One ranked list of people, ordered by the value they add."}</p></div><div className="crm-legend" aria-label="Each criterion scored from 0 to 5; darker shading means a higher score"><span>0</span>{[0,1,2,3,4,5].map(value => <span aria-hidden="true" key={value} className="crm-score" data-score={value} />)}<span>5</span><span>per criterion</span></div></div>
    <p className="crm-rules">{kind === "customers" ? "Total /20: Tier 1 ≥15 · Tier 2 ≥8 · Tier 3 <8 or unscored. Select a tier to override." : "Totals set the order. Select a rank to move someone by hand; Manual marks a fixed position."} <span>— Not scored</span></p>
    {priorityEditor}
    {error ? <div role="alert" className="crm-empty"><p>Pipeline couldn’t load.</p><Button variant="outline" size="sm" onClick={() => setRevision(value => value + 1)}>Try again</Button></div>
      : !data ? <p className="crm-empty" role="status">Loading pipeline…</p>
      : !data.items.length ? <div className="crm-empty" role="status"><h2>{query ? "No matches" : kind === "customers" ? "Your customer companies go here" : "Your investor ranking goes here"}</h2>{query ? <Button size="sm" variant="ghost" onClick={() => { setQuery(""); setOffset(0); }}>Clear search</Button> : <p>Ask your agent to add {kind === "customers" ? "a company" : "an investor"} to CRM.</p>}</div>
      : <div className="crm-table-scroll" tabIndex={0} role="region" aria-label={kind === "customers" ? "Customer impact heatmap, scroll horizontally for all columns" : "Investor value heatmap, scroll horizontally for all columns"}>
        <table className="crm-table" data-kind={kind}><caption className="crm-sr-only">{kind === "customers" ? "Companies grouped by impact tier, with independent milestones" : "Investors ordered by rank, with value scores and asks"}</caption>
          <thead><tr>{kind === "investors" && <th scope="col" className="crm-rank-col">#</th>}<th scope="col" className="crm-name-col">{kind === "customers" ? "Company / champion" : "Name"}</th><th scope="col">{kind === "customers" ? "Milestone" : "Company"}</th>{criteria.map(([key, name]) => <th scope="col" className="crm-criterion" key={key}>{name}</th>)}<th scope="col">Total</th><th scope="col" className="crm-why-col">Why it ranks here</th><th scope="col" className="crm-ask-col">{kind === "customers" ? "Next step" : "The ask"}</th><th scope="col"><span className="crm-sr-only">History</span></th></tr></thead>
          {kind === "customers" ? [1,2,3].map(tier => {
            const rows = (data as CustomerPage).items.filter(row => row.tier === tier);
            return !!rows.length && <tbody key={tier} aria-label={"Tier " + tier}><tr className="crm-tier-heading"><th colSpan={10} scope="colgroup">Tier {tier}</th></tr>{rows.map(row => <Fragment key={row.company.id}>
              <tr className="crm-data-row"><th scope="row"><strong>{row.company.name}</strong><span className="crm-secondary">{row.person?.name ?? "No champion assigned"}</span><Button size="sm" variant="ghost" className="crm-tier-button" onClick={() => startEdit(row)} disabled={saving} aria-label={"Change tier for " + row.company.name}>Tier {row.tier}{row.tierOverride !== null && " · Manual"}</Button></th><td className="crm-milestone">{row.track?.stage || "Not started"}</td>{CUSTOMER_CRITERIA.map(([key,name]) => <Score key={key} value={row.scores[key]} criterion={name} />)}<Total value={row.total} scores={row.scores} /><td>{row.why || <span className="crm-muted">No rationale yet</span>}</td><td><NextStep track={row.track} /></td><td>{historyButton(row.company.id, row.company.name)}</td></tr>
              {history === row.company.id && <tr><td colSpan={10}><History subject={{ subjectType: "company", subjectId: row.company.id }} name={row.company.name} revision={revision + ":" + connection} /></td></tr>}
            </Fragment>)}</tbody>;
          }) : <tbody>{(data as InvestorPage).items.map(row => <Fragment key={row.track.id}>
            <tr className="crm-data-row"><td><Button size="sm" variant="ghost" className="crm-rank-button" disabled={saving} aria-label={"Change rank for " + (row.person?.name ?? row.company?.name ?? "unassigned investor")} onClick={() => startEdit(row)}>#{row.rank}</Button>{row.rankOverride !== null && <span className="crm-manual">Manual</span>}</td><th scope="row"><strong>{row.person?.name ?? "No contact assigned"}</strong><span className="crm-secondary">{row.person?.role}</span></th><td>{row.company?.name ?? <span className="crm-muted">Independent</span>}</td>{INVESTOR_CRITERIA.map(([key,name]) => <Score key={key} value={row.scores[key]} criterion={name} />)}<Total value={row.total} scores={row.scores} /><td>{row.why || <span className="crm-muted">No rationale yet</span>}</td><td><NextStep track={row.track} /></td><td>{historyButton(row.track.id, row.person?.name ?? row.company?.name ?? "unassigned investor")}</td></tr>
            {history === row.track.id && <tr><td colSpan={11}><History subject={{ subjectType: row.track.subjectType, subjectId: row.track.subjectId }} name={row.person?.name ?? row.company?.name ?? "Investor"} legacyStage={row.legacyStage} revision={revision + ":" + connection} /></td></tr>}
          </Fragment>)}</tbody>}
        </table>
      </div>}
    {data && (offset > 0 || data.nextOffset !== null) && <div className="crm-pages"><Button size="sm" variant="outline" disabled={offset === 0 || saving} onClick={() => { setOffset(Math.max(0, offset - 50)); setEditing(null); }}>Previous</Button><span>{Math.min(offset + 1, data.total)}–{Math.min(offset + data.items.length, data.total)} of {data.total}</span><Button size="sm" variant="outline" disabled={data.nextOffset === null || saving} onClick={() => { setOffset(data.nextOffset!); setEditing(null); }}>Next</Button></div>}
  </main></div>;
}
export default definePluginApp(app => { app.slots.navPanel({ id: "crm", path: "crm", title: "CRM", icon: "UserRound", component: CrmPage }); });
