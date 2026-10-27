import type { ReactNode } from "react";
import { useBbNavigate } from "@get-bb/plugin-sdk/app";
import type { Investment, InvestmentState, ObjectiveView, PriorityView } from "../model.js";
import type { Outcome, Snapshot } from "../rpc.js";
import type { Rpc } from "./data.js";
import { Editable, Icon, InlineText, MetricEditor, Pencil, TeamPicker } from "./inline.js";
import {
  allObjectives, busyFor, canShowStart, emptyPortfolioText, formatAmount, formatBy, liftBar, liftDomain, metricProgress, objectiveMeta,
  liftText, originLabel, researchFinishedUnsized, ownerObjectives, portfolioRows, startBlockedReason, threadLabel, unknownLiftText, type Origin, type Owner,
} from "./view-model.js";

export type Screen =
  | { kind: "plan" }
  | { kind: "portfolio"; objectiveId: string; origin: Origin }
  | { kind: "investment"; objectiveId: string; investmentId: string; origin: Origin }
  | { kind: "teams" }
  | { kind: "owner"; owner: Owner };

export type Editing =
  | { k: "pri" | "metric" | "obj" | "inv" | "owner"; id: string }
  | { k: "newPri" }
  | { k: "newObj"; priorityId: string }
  | { k: "newInv"; objectiveId: string }
  | null;

export interface Panel {
  snapshot: Snapshot;
  rpc: Rpc;
  editing: Editing;
  edit: (editing: Editing) => void;
  save: <T>(run: () => Promise<Outcome<T>>) => Promise<T | null>;
  notice: string | null;
  notify: (message: string | null) => void;
  go: (screen: Screen) => void;
}

const isEditing = (panel: Panel, k: "pri" | "metric" | "obj" | "inv" | "owner", id: string) => panel.editing !== null && panel.editing.k === k && "id" in panel.editing && panel.editing.id === id;
const done = (panel: Panel) => () => panel.edit(null);

const STATE: Record<InvestmentState, { dot: string; label: string }> = {
  not_started: { dot: "", label: "Not started" },
  in_progress: { dot: " pl-half", label: "In progress" },
  done: { dot: " pl-full", label: "Done" },
};

function StateTag({ state }: { state: InvestmentState }) {
  return <span className="pl-st"><span className={`pl-dot${STATE[state].dot}`} />{STATE[state].label}</span>;
}

function Top({ children }: { children: ReactNode }) {
  return <div className="pl-top">{children}</div>;
}

function Body({ panel, children }: { panel: Panel; children: ReactNode }) {
  return <div className="pl-body">
    {panel.notice ? <p className="pl-msg" role="alert">{panel.notice}</p> : null}
    {children}
  </div>;
}

const signed = (value: number) => `${value >= 0 ? "+" : ""}${value.toLocaleString("en-US")}`;
const amount = (value: number) => value.toLocaleString("en-US");

function MetricLine({ panel, priority }: { panel: Panel; priority: PriorityView }) {
  if (isEditing(panel, "metric", priority.id)) {
    return <MetricEditor priority={priority} onCancel={done(panel)} onInvalid={(message) => panel.notify(message)}
      onSave={async (patch) => { await panel.save(() => panel.rpc.call("editPriority", { id: priority.id, expectedRevision: priority.revision, ...patch })); panel.edit(null); }} />;
  }
  const pct = metricProgress(priority);
  return <div className="pl-metric">
    <span className="pl-prog" role="img" aria-label={`${pct}% of the way to target`}><i style={{ width: `${pct}%` }} /></span>
    <Editable label={`target for ${priority.name}`} onEdit={() => panel.edit({ k: "metric", id: priority.id })}>
      <span><b>{formatAmount(priority.now)}</b> now → {formatAmount(priority.target)}{priority.metric ? ` ${priority.metric}` : ""}{priority.by ? ` by ${formatBy(priority.by)}` : ""}</span>
    </Editable>
  </div>;
}

export function ObjectiveRow({ panel, objective, origin }: { panel: Panel; objective: ObjectiveView; origin: Origin }) {
  const meta = objective.approved ? objectiveMeta(objective) : `Proposed · ${objectiveMeta(objective)}`;
  if (isEditing(panel, "obj", objective.id)) {
    return <div className="pl-row"><Icon glyph="obj" /><span className="pl-t">
      <InlineText value={objective.name} label="Objective" onCancel={done(panel)}
        onSave={async (name) => { await panel.save(() => panel.rpc.call("editObjective", { id: objective.id, expectedRevision: objective.revision, name })); panel.edit(null); }} />
      <small>{meta}</small>
    </span></div>;
  }
  return <div className="pl-row" onClick={() => panel.go({ kind: "portfolio", objectiveId: objective.id, origin })}>
    <Icon glyph="obj" />
    <span className="pl-t">
      <span className="pl-ed"><button type="button" className="pl-open">{objective.name}</button><Pencil label={`objective: ${objective.name}`} onEdit={() => panel.edit({ k: "obj", id: objective.id })} /></span>
      <small>{meta}</small>
    </span>
    {objective.approved ? null : <button type="button" className="pl-ib" aria-label={`Approve objective ${objective.name}`} title="Approve"
      onClick={(event) => { event.stopPropagation(); void panel.save(() => panel.rpc.call("approveObjective", { id: objective.id, expectedRevision: objective.revision })); }}>
      <Icon glyph="check" />
    </button>}
    <span className="pl-go"><Icon glyph="chev" /></span>
  </div>;
}

function PrioritySection({ panel, priority }: { panel: Panel; priority: PriorityView }) {
  const adding = panel.editing?.k === "newObj" && panel.editing.priorityId === priority.id;
  return <section className="pl-sec">
    <div className="pl-type"><Icon glyph="pri" />Company priority</div>
    <div className="pl-h">
      {isEditing(panel, "pri", priority.id)
        ? <InlineText value={priority.name} label="Company priority" onCancel={done(panel)}
          onSave={async (name) => { await panel.save(() => panel.rpc.call("editPriority", { id: priority.id, expectedRevision: priority.revision, name })); panel.edit(null); }} />
        : <Editable label={`company priority: ${priority.name}`} onEdit={() => panel.edit({ k: "pri", id: priority.id })}>{priority.name}</Editable>}
    </div>
    <MetricLine panel={panel} priority={priority} />
    <div className="pl-kids">
      <div className="pl-lbl">Objectives · {priority.objectives.length}
        <button type="button" className="pl-ib" aria-label={`Add objective to ${priority.name}`} title="Add objective" onClick={() => panel.edit({ k: "newObj", priorityId: priority.id })}><Icon glyph="add" /></button>
      </div>
      {priority.objectives.map((objective) => <ObjectiveRow key={objective.id} panel={panel} objective={objective} origin={{ kind: "plan" }} />)}
      {adding ? <div className="pl-row"><Icon glyph="obj" /><span className="pl-t">
        <InlineText value="" label="Objective" onCancel={done(panel)}
          onSave={async (name) => { await panel.save(() => panel.rpc.call("addObjective", { priorityId: priority.id, name })); panel.edit(null); }} />
        <small>Unassigned</small>
      </span></div> : null}
    </div>
  </section>;
}

export function PlanScreen({ panel }: { panel: Panel }) {
  return <>
    <Top>
      <span className="pl-ttl">Plan</span>
      <button type="button" className="pl-btn" onClick={() => panel.go({ kind: "teams" })}>Orgs &amp; teams</button>
      <button type="button" className="pl-btn pl-ib" aria-label="Add company priority" title="Add company priority" onClick={() => panel.edit({ k: "newPri" })}><Icon glyph="add" /></button>
    </Top>
    <Body panel={panel}>
      {panel.snapshot.priorities.map((priority) => <PrioritySection key={priority.id} panel={panel} priority={priority} />)}
      {panel.editing?.k === "newPri" ? <section className="pl-sec">
        <div className="pl-type"><Icon glyph="pri" />Company priority</div>
        <div className="pl-h"><InlineText value="" label="Company priority" onCancel={done(panel)}
          onSave={async (name) => { await panel.save(() => panel.rpc.call("addPriority", { name })); panel.edit(null); }} /></div>
      </section> : null}
    </Body>
  </>;
}

function findObjective(snapshot: Snapshot, id: string): ObjectiveView | undefined {
  return allObjectives(snapshot.priorities).find((objective) => objective.id === id);
}

function Missing({ panel, back, label }: { panel: Panel; back: Screen; label: string }) {
  return <>
    <Top><button type="button" className="pl-back" onClick={() => panel.go(back)}>‹ {label}</button></Top>
    <Body panel={panel}><p className="pl-hintbox">This record no longer exists.</p></Body>
  </>;
}

function TeamField({ panel, objective }: { panel: Panel; objective: ObjectiveView }) {
  if (isEditing(panel, "owner", objective.id)) {
    return <TeamPicker objective={objective} rpc={panel.rpc} onCancel={done(panel)}
      onPick={async (assigneeThreadId) => { await panel.save(() => panel.rpc.call("assignObjective", { id: objective.id, expectedRevision: objective.revision, assigneeThreadId })); panel.edit(null); }} />;
  }
  return <Editable label={`team for ${objective.name}`} onEdit={() => panel.edit({ k: "owner", id: objective.id })}>
    {objective.assignee ? `@${threadLabel(objective.assignee)}` : "Unassigned"}
  </Editable>;
}

function LiftBar({ investment, domain }: { investment: Investment & { lift: NonNullable<Investment["lift"]> }; domain: { min: number; max: number } }) {
  const bar = liftBar(investment.lift, domain);
  return <span className="pl-bar" aria-hidden="true"><i style={{ left: `${bar.left.toFixed(1)}%`, width: `${bar.width.toFixed(1)}%` }} /><u style={{ left: `${bar.base.toFixed(1)}%` }} /></span>;
}

export function PortfolioScreen({ panel, objectiveId, origin }: { panel: Panel; objectiveId: string; origin: Origin }) {
  const objective = findObjective(panel.snapshot, objectiveId);
  const up: Screen = origin.kind === "plan" ? { kind: "plan" } : { kind: "owner", owner: origin.owner };
  if (!objective) return <Missing panel={panel} back={up} label={originLabel(origin)} />;
  const objectives = allObjectives(panel.snapshot.priorities);
  const busy = busyFor(objectives, objective.assigneeThreadId);
  const { ranked, unranked } = portfolioRows(objective);
  const domain = liftDomain(objective.investments.flatMap((investment) => (investment.lift ? [investment.lift] : [])));
  const adding = panel.editing?.k === "newInv" && panel.editing.objectiveId === objective.id;
  const open = (investment: Investment) => panel.go({ kind: "investment", objectiveId: objective.id, investmentId: investment.id, origin });
  const row = (investment: Investment, rank: number) => {
    const lift = investment.lift
      ? <span className="pl-lift"><LiftBar investment={{ ...investment, lift: investment.lift }} domain={domain} /><b>{signed(investment.lift.base)}</b> ({amount(investment.lift.low)}–{amount(investment.lift.high)})</span>
      : <span className="pl-lift">{liftText(objective, investment)}</span>;
    const why = startBlockedReason(objectives, objective, investment);
    const action = investment.state !== "not_started" ? <StateTag state={investment.state} />
      : canShowStart(investment) ? <button type="button" className="pl-btn" aria-label={`Start ${investment.name}`} disabled={why !== null} title={why ?? undefined}
        onClick={() => { void panel.save(() => panel.rpc.call("startInvestment", { id: investment.id })); }}>Start</button>
        : null;
    return <div key={investment.id} className="pl-inv">
      <span className="pl-rk">{rank || ""}</span>
      <button type="button" className="pl-nm" onClick={() => open(investment)}>{investment.name}</button>
      {lift}
      <span className="pl-act">{action}</span>
    </div>;
  };
  return <>
    <Top>
      <nav className="pl-crumb" aria-label="Breadcrumb">
        <button type="button" className="pl-back" onClick={() => panel.go(up)}>‹ {originLabel(origin)}</button>
        <span aria-hidden="true">/</span>
        <span className="pl-cur" aria-current="page">{objective.name}</span>
      </nav>
    </Top>
    <Body panel={panel}>
      <div className="pl-head">
        <div className="pl-type"><Icon glyph="inv" />Portfolio
          <button type="button" className="pl-ib" aria-label="Add investment" title="Add investment" onClick={() => panel.edit({ k: "newInv", objectiveId: objective.id })}><Icon glyph="add" /></button>
        </div>
        <dl className="pl-facts">
          <dt>Team</dt><dd><TeamField panel={panel} objective={objective} /></dd>
          {busy ? <><dt>Working on</dt><dd>{busy.investment.name}{busy.objective.id !== objective.id ? <small> · {busy.objective.name}</small> : null}</dd></> : null}
        </dl>
      </div>
      {!objective.investments.length && !adding ? <p className="pl-hintbox">{emptyPortfolioText(objective)}</p> : <>
        <div className="pl-colh"><span>#</span><span>Investment</span><span>Lift (range)</span><span /></div>
        {ranked.map((investment) => row(investment, investment.rank))}
        {unranked.map((investment) => row(investment, 0))}
        {adding ? <div className="pl-inv">
          <span className="pl-rk" />
          <span><InlineText value="" label="Investment" onCancel={done(panel)}
            onSave={async (name) => { await panel.save(() => panel.rpc.call("addInvestment", { objectiveId: objective.id, name })); panel.edit(null); }} /></span>
          <span className="pl-lift">{unknownLiftText(objective)}</span>
          <span />
        </div> : null}
      </>}
    </Body>
  </>;
}

function Sources({ sources }: { sources: string[] }) {
  if (!sources.length) return <>—</>;
  return <>{sources.map((source, index) => <span key={`${index}:${source}`} className="pl-src">
    {/^https?:\/\//.test(source) ? <a className="pl-lk" href={source} target="_blank" rel="noreferrer">{source}</a> : source}
  </span>)}</>;
}

export function InvestmentScreen({ panel, objectiveId, investmentId, origin }: { panel: Panel; objectiveId: string; investmentId: string; origin: Origin }) {
  const navigate = useBbNavigate();
  const objective = findObjective(panel.snapshot, objectiveId);
  const investment = objective?.investments.find((entry) => entry.id === investmentId);
  if (!objective || !investment) return <Missing panel={panel} back={{ kind: "plan" }} label="Plan" />;
  const lift = investment.lift;
  const unsized = researchFinishedUnsized(investment);
  const sources = [...new Set([...(lift?.sources ?? []), ...(investment.brief.sources ?? [])])];
  return <>
    <Top><button type="button" className="pl-back" onClick={() => panel.go({ kind: "portfolio", objectiveId, origin })}>‹ {objective.name}</button></Top>
    <Body panel={panel}>
      <div className="pl-head">
        <div className="pl-type"><Icon glyph="inv" />Investment<StateTag state={investment.state} /></div>
        <div className="pl-h">
          {isEditing(panel, "inv", investment.id)
            ? <InlineText value={investment.name} label="Investment" onCancel={done(panel)}
              onSave={async (name) => { await panel.save(() => panel.rpc.call("editInvestment", { id: investment.id, expectedRevision: investment.revision, name })); panel.edit(null); }} />
            : <Editable label={`investment: ${investment.name}`} onEdit={() => panel.edit({ k: "inv", id: investment.id })}>{investment.name}</Editable>}
        </div>
        {lift ? <>
          <p className="pl-big">{signed(lift.base)} <small>{lift.unit}</small></p>
          <p className="pl-hintbox pl-range">Likely range {amount(lift.low)} to {amount(lift.high)}</p>
        </> : <p className="pl-big">{unsized ? "—" : "Researching"}</p>}
      </div>
      <div className="pl-gh">Evidence</div>
      <dl className="pl-sum">
        <div><dt>How estimated</dt><dd>{lift?.method ?? (unsized ? "—" : "Researching")}</dd></div>
        {unsized ? <div><dt>Missing evidence</dt><dd>{investment.research?.missing}</dd></div> : null}
        <div><dt>Sources</dt><dd><Sources sources={sources} /></dd></div>
        {investment.research && investment.research.submissionThreadIds.length === 2 ? <div><dt>Research</dt><dd>
          <span className="pl-src">Open both submissions:</span>
          {investment.research.submissionThreadIds.map((threadId, index) => <button key={threadId} type="button" className="pl-lk pl-src"
            onClick={() => navigate.toThread(threadId)}>Submission {index === 0 ? "A" : "B"}</button>)}
        </dd></div> : null}
      </dl>
      {investment.research?.funnelSteps?.length ? <>
        <div className="pl-gh">Funnel steps</div>
        <dl className="pl-sum">
          {investment.research.funnelSteps.map((step, index) => <div key={`${index}:${step.step}`}>
            <dt>{step.step}</dt><dd>{amount(step.value)} {step.unit}</dd>
          </div>)}
        </dl>
      </> : null}
      <div className="pl-gh">Cost</div>
      <dl className="pl-sum">
        <div><dt>Effort</dt><dd>{lift?.cost ?? "—"}</dd></div>
        <div><dt>Depends on</dt><dd>{lift?.dependencies ?? "—"}</dd></div>
      </dl>
      <div className="pl-gh">Measurement</div>
      <dl className="pl-sum">
        <div><dt>Measured with</dt><dd>{investment.brief.measurement ?? "—"}</dd></div>
      </dl>
    </Body>
  </>;
}

export function TeamsScreen({ panel }: { panel: Panel }) {
  return <>
    <Top><button type="button" className="pl-back" onClick={() => panel.go({ kind: "plan" })}>‹ Plan</button></Top>
    <Body panel={panel}>
      <div className="pl-head"><div className="pl-type"><Icon glyph="team" />Orgs and teams</div><div className="pl-h">Who owns objectives</div></div>
      {panel.snapshot.orgs.map((org) => <div key={org.threadId}>
        <button type="button" className="pl-team pl-org" onClick={() => panel.go({ kind: "owner", owner: { kind: "org", threadId: org.threadId, name: org.name } })}>
          <Icon glyph="team" /><span>{threadLabel(org)}</span><Icon glyph="chev" />
        </button>
        {org.teams.map((team) => <button key={team.threadId} type="button" className="pl-team pl-sub"
          onClick={() => panel.go({ kind: "owner", owner: { kind: "team", threadId: team.threadId, name: team.name } })}>
          <span>{threadLabel(team)}</span><Icon glyph="chev" />
        </button>)}
      </div>)}
    </Body>
  </>;
}

export function OwnerScreen({ panel, owner }: { panel: Panel; owner: Owner }) {
  const objectives = ownerObjectives(allObjectives(panel.snapshot.priorities), panel.snapshot.orgs, owner);
  return <>
    <Top><button type="button" className="pl-back" onClick={() => panel.go({ kind: "teams" })}>‹ Orgs &amp; teams</button></Top>
    <Body panel={panel}>
      <div className="pl-head"><div className="pl-type"><Icon glyph="team" />{owner.kind === "team" ? "Team" : "Org"}</div><div className="pl-h">{threadLabel(owner)}</div></div>
      <div className="pl-kids">
        <div className="pl-lbl">Objectives · {objectives.length}</div>
        {objectives.map((objective) => <ObjectiveRow key={objective.id} panel={panel} objective={objective} origin={{ kind: "owner", owner }} />)}
      </div>
    </Body>
  </>;
}
