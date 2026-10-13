import { useEffect, useId, useState } from "react";
import { definePluginApp, experimental_Icon as Icon, useRpc, useRealtime, useRealtimeConnectionState } from "@get-bb/plugin-sdk/app";
import type { contract } from "./contract.js";
import { CHANGED } from "./signals.js";
import type { Group, Interaction, Person, Track } from "./model.js";
import { Button } from "./components/ui/button.js";
import { Input } from "./components/ui/input.js";
import "./app.css";

type View = { groups: Group[]; total: number; nextOffset: number | null };
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
function interactionDate(value: string) {
  return new Date(value + "T12:00:00").toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}
function TrackRow({ track, people }: { track: Track; people: Person[] }) {
  const person = people.find(p => p.id === track.personId);
  return <article className="crm-track" aria-label={(person?.name ?? "Unassigned") + " " + track.kind + " track"}>
    <div className="crm-track-top">
      <div className="crm-person"><strong>{person?.name ?? "No contact assigned"}</strong>{person?.role && <span className="crm-role">{person.role}</span>}</div>
      <div className="crm-stage"><span className="crm-kind">{label(track.kind)}</span><span aria-hidden="true">·</span><span>{track.stage}</span></div>
    </div>
    <p className="crm-next"><span>Next </span>{track.nextStep || "No next step set"}</p>
    <div className="crm-meta"><time dateTime={track.date ?? undefined}>{dayText(track.date)}</time><span aria-hidden="true">·</span><span>{track.owner ? "Owner: " + track.owner : "No owner assigned"}</span></div>
  </article>;
}
function History({ group, revision }: { group: Group; revision: string }) {
  const rpc = useRpc<typeof contract>();
  const [offset, setOffset] = useState(0);
  const [retry, setRetry] = useState(0);
  const [result, setResult] = useState<HistoryPage | null>(null);
  const [error, setError] = useState(false);
  useEffect(() => {
    let active = true;
    setResult(null); setError(false);
    rpc.call("history", { subjectType: group.subjectType, subjectId: group.subjectId, offset }).then(value => {
      if (active) setResult(value);
    }, () => { if (active) setError(true); });
    return () => { active = false; };
  }, [rpc, group.subjectType, group.subjectId, offset, revision, retry]);
  return <section className="crm-history" aria-label={group.name + " interaction history"}>
    {error ? <div role="alert"><p>History couldn’t load.</p><Button size="sm" variant="ghost" onClick={() => setRetry(v => v + 1)}>Try again</Button></div>
      : !result ? <p role="status">Loading history…</p>
      : <>
        {!result.items.length && <p>No interactions logged yet.</p>}
        {result.items.map(event => <div className="crm-event" key={event.id}>
          <div className="crm-event-meta"><Icon name={event.kind === "message" ? "MessageSquare" : event.kind === "intro" ? "ArrowUpRight" : "Mic"} className="size-3.5" /><span>{label(event.kind)}</span><span aria-hidden="true">·</span><time dateTime={event.date}>{interactionDate(event.date)}</time>{event.personId && <><span aria-hidden="true">·</span><span>{result.people.find(p => p.id === event.personId)?.name ?? "Contact"}</span></>}{event.track && <><span aria-hidden="true">·</span><span>{label(event.track)}</span></>}</div>
          <p>{event.note}</p>
        </div>)}
        {(offset > 0 || result.nextOffset !== null) && <div className="crm-pages"><Button size="sm" variant="ghost" disabled={offset === 0} onClick={() => setOffset(0)}>Latest</Button><Button size="sm" variant="ghost" disabled={result.nextOffset === null} onClick={() => setOffset(result.nextOffset!)}>Older</Button></div>}
      </>}
  </section>;
}
function CompanyGroup({ group, revision }: { group: Group; revision: string }) {
  const [expanded, setExpanded] = useState(false);
  const historyId = useId();
  const unassigned = group.people.filter(person => !group.tracks.some(track => track.personId === person.id));
  return <section className="crm-group" aria-label={group.name}>
    <div className="crm-group-head">
      <h2 className="crm-group-name"><Icon name={group.subjectType === "company" ? "Home" : "UserRound"} className="size-4 text-muted-foreground shrink-0" />{group.name}{group.subjectType === "person" && <span className="crm-independent">Independent</span>}</h2>
      <Button size="sm" variant="ghost" className="crm-history-button" aria-label={"History for " + group.name} aria-expanded={expanded} aria-controls={expanded ? historyId : undefined} onClick={() => setExpanded(value => !value)}><Icon name={expanded ? "ChevronDown" : "ChevronRight"} className="size-3.5" />History<span>{group.historyCount}</span></Button>
    </div>
    {group.tracks.map(track => <TrackRow key={track.id} track={track} people={group.people} />)}
    {!group.tracks.length && <p className="crm-no-tracks">No customer or investor track yet.</p>}
    {!!unassigned.length && <p className="crm-contacts">Contacts: {unassigned.map(person => person.name + (person.role ? " (" + person.role + ")" : "")).join(" · ")}</p>}
    {expanded && <div id={historyId}><History group={group} revision={revision} /></div>}
  </section>;
}
export function CrmPage() {
  const rpc = useRpc<typeof contract>();
  const connection = useRealtimeConnectionState();
  const [query, setQuery] = useState("");
  const [kind, setKind] = useState<"customer" | "investor" | undefined>();
  const [offset, setOffset] = useState(0);
  const [revision, setRevision] = useState(0);
  const [data, setData] = useState<View | null>(null);
  const [error, setError] = useState(false);
  useRealtime(CHANGED, () => setRevision(value => value + 1));
  useEffect(() => {
    let active = true;
    setError(false);
    rpc.call("view", { query, ...(kind ? { kind } : {}), limit: 50, offset }).then(value => {
      if (active) setData(value);
    }, () => { if (active) setError(true); });
    return () => { active = false; };
  }, [rpc, query, kind, offset, revision, connection]);
  return <div className="crm-root"><main className="crm-wrap">
    <h1 className="crm-title">People &amp; next steps</h1>
    <p className="crm-subtitle">Customer and investor conversations, together in one place.</p>
    <div className="crm-toolbar">
      <div className="crm-filters" role="group" aria-label="Conversation type">
        {([undefined, "customer", "investor"] as const).map(value => <Button key={value ?? "all"} size="sm" variant="ghost" aria-pressed={kind === value} onClick={() => { if (kind !== value) setData(null); setKind(value); setOffset(0); }}>{value ? label(value) + "s" : "All"}</Button>)}
      </div>
      <div className="crm-search"><Icon name="Search" className="size-4" /><Input aria-label="Search people or companies" placeholder="Search people or companies" value={query} maxLength={200} onChange={event => { setData(null); setQuery(event.target.value); setOffset(0); }} /></div>
    </div>
    {error ? <div role="alert" className="crm-empty"><p>Conversations couldn’t load.</p><Button variant="outline" size="sm" onClick={() => setRevision(value => value + 1)}>Try again</Button></div>
      : !data ? <p className="crm-empty" role="status">Loading conversations…</p>
      : !data.groups.length ? <div className="crm-empty" role="status">
        <h2>{query || kind ? "No conversations found" : "Your conversations go here"}</h2>
        {query || kind ? <Button size="sm" variant="ghost" onClick={() => { setQuery(""); setKind(undefined); setOffset(0); }}>Clear filters</Button> : <p>Ask your agent to add a company or a person to CRM.</p>}
      </div>
      : <>{data.groups.map(group => <CompanyGroup key={group.subjectType + group.subjectId} group={group} revision={revision + ":" + connection} />)}
        {(offset > 0 || data.nextOffset !== null) && <div className="crm-pages"><Button size="sm" variant="outline" disabled={offset === 0} onClick={() => setOffset(Math.max(0, offset - 50))}>Previous</Button><span>{offset + 1}–{offset + data.groups.length} of {data.total}</span><Button size="sm" variant="outline" disabled={data.nextOffset === null} onClick={() => setOffset(data.nextOffset!)}>Next</Button></div>}
      </>}
  </main></div>;
}
export default definePluginApp(app => {
  app.slots.navPanel({ id: "crm", path: "crm", title: "CRM", icon: "UserRound", component: CrmPage });
});

