import { useState } from "react";
import { experimental_useSidebarThreads as useSidebarThreads, useBbNavigate } from "@get-bb/plugin-sdk/app";
import type { CoordinatorItem, CoordinatorStatus, PendingApproval } from "../contracts.js";
import { approvalCardContent, itemStatusLine, qaCardContent } from "../model.js";
import { Button } from "./ui/button.js";
import { Menu } from "./menu.js";
import { SetupForm } from "./setup-form.js";
import { errorMessage, useCoordinatorRpc } from "./rpc.js";

type State = NonNullable<CoordinatorStatus["state"]>;

/**
 * A decision waiting on the user. The panel draws it with the same question and consequence as its
 * Action Cards card; answering here resolves that card through the server.
 */
type Decision =
  | { kind: "qa"; key: string; item: CoordinatorItem; question: string; consequence: string; threadId: string | null }
  | { kind: "approval"; key: string; approval: PendingApproval; question: string; consequence: string; threadId: string | null };

type Groups = { decisions: Decision[]; needsLink: CoordinatorItem[]; progress: CoordinatorItem[]; done: CoordinatorItem[] };

const isOpen = (item: CoordinatorItem) => item.status === "active" || item.status === "blocked";

function group(status: CoordinatorStatus, state: State): Groups {
  const { template } = state;
  const byId = new Map(status.items.map((item) => [item.id, item]));
  const groups: Groups = { decisions: [], needsLink: [], progress: [], done: [] };
  for (const item of status.items) {
    if (!isOpen(item)) {
      groups.done.push(item);
      continue;
    }
    const check = template.stages[item.stageIndex]?.check;
    if (check === "you_approve") {
      const { question, consequence } = qaCardContent(item, template);
      groups.decisions.push({ kind: "qa", key: `qa:${item.id}`, item, question, consequence, threadId: item.primaryThreadId });
    } else if (check === "link_added" && !item.link && item.status === "active") {
      groups.needsLink.push(item);
    } else {
      groups.progress.push(item);
    }
  }
  for (const approval of status.approvals) {
    const { question, consequence } = approvalCardContent(approval);
    const threadId = approval.itemId ? byId.get(approval.itemId)?.primaryThreadId ?? null : null;
    groups.decisions.push({ kind: "approval", key: `approval:${approval.id}`, approval, question, consequence, threadId });
  }
  return groups;
}

function relativeTime(at: number, now: number): string {
  const minutes = Math.floor((now - at) / 60_000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hr ago`;
  const days = Math.floor(hours / 24);
  return days === 1 ? "yesterday" : `${days} days ago`;
}

type TrackerProps = {
  threadId: string;
  threadName: string | null;
  status: CoordinatorStatus & { state: State };
  onChanged(): Promise<void>;
};

export function Tracker({ threadId, threadName, status, onChanged }: TrackerProps) {
  const call = useCoordinatorRpc();
  const { state } = status;
  const groups = group(status, state);
  const [busy, setBusy] = useState(false);
  const [confirmOff, setConfirmOff] = useState(false);
  const [editingRules, setEditingRules] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const run = async (action: () => Promise<unknown>) => {
    setBusy(true);
    setError(null);
    try {
      await action();
      await onChanged();
    } catch (reason) {
      setError(errorMessage(reason));
    } finally {
      setBusy(false);
    }
  };

  if (editingRules) {
    return (
      <SetupForm
        heading="Edit rules"
        submitLabel="Save rules"
        busyLabel="Saving…"
        projectId={null}
        initialTemplate={state.template}
        onCancel={() => setEditingRules(false)}
        onSubmit={async (template) => {
          await call("updateTemplate", { threadId, template });
          await onChanged();
          setEditingRules(false);
        }}
      />
    );
  }

  const [focus, ...others] = groups.decisions;
  const needsCount = groups.decisions.length + groups.needsLink.length;
  const empty = status.items.length === 0 && status.approvals.length === 0;

  return (
    <div className="cm-tracker">
      <header className="cm-head">
        <h2 className="cm-head-title">{threadName ? `${threadName} · ${state.template.name}` : state.template.name}</h2>
        {/* Each entry sets an absolute value from the latest state, so a repeat click is harmless. */}
        <Menu label="Coordinator options" entries={[
          { label: state.paused ? "Resume" : "Pause", onSelect: () => void run(() => call("setPaused", { threadId, paused: !state.paused })) },
          { label: "Auto-approve", checked: state.autoApprove, onSelect: () => void run(() => call("setAutoApprove", { threadId, autoApprove: !state.autoApprove })) },
          { label: "Edit rules", onSelect: () => setEditingRules(true) },
          { label: "Turn off", onSelect: () => setConfirmOff(true) },
        ]} />
      </header>

      {confirmOff && (
        <div className="cm-confirm" role="group" aria-label="Turn off Coordinator Mode">
          <span>Turn off Coordinator Mode? The thread and its history stay.</span>
          <div className="cm-actions">
            <Button variant="ghost" disabled={busy} onClick={() => setConfirmOff(false)}>Cancel</Button>
            <Button variant="default" disabled={busy}
              onClick={() => void run(() => call("turnOff", { threadId })).then(() => setConfirmOff(false))}>
              Turn off
            </Button>
          </div>
        </div>
      )}

      {status.staleRules && (
        <p className="cm-notice" role="status">
          Using old rules.{" "}
          <button type="button" className="cm-link" disabled={busy} onClick={() => void run(() => call("restartCoordinator", { threadId }))}>Restart</button>
        </p>
      )}

      {error && <p className="cm-error cm-pad" role="alert">{error}</p>}

      <div className="cm-body">
        {focus && (
          <section className="cm-focus" aria-label="Needs you">
            <div className="cm-eyebrow">Needs you · {needsCount === 1 ? "1" : `1 of ${needsCount}`}</div>
            <DecisionView key={focus.key} decision={focus} prominent onChanged={onChanged} />
          </section>
        )}

        {(others.length > 0 || groups.needsLink.length > 0) && (
          <section className="cm-section" aria-label={focus ? "Also needs you" : "Needs you"}>
            <div className="cm-eyebrow">{focus ? "Also needs you" : `Needs you · ${needsCount}`}</div>
            <ul className="cm-rows">
              {others.map((decision) => <li key={decision.key}><DecisionView decision={decision} onChanged={onChanged} /></li>)}
              {groups.needsLink.map((item) => <li key={item.id}><LinkRow item={item} onChanged={onChanged} /></li>)}
            </ul>
          </section>
        )}

        {groups.progress.length > 0 && (
          <section className="cm-section" aria-label="In progress">
            <div className="cm-eyebrow">In progress · {groups.progress.length}</div>
            <ul className="cm-rows">
              {groups.progress.map((item) => <li key={item.id}><ItemRow item={item} state={state} onChanged={onChanged} /></li>)}
            </ul>
          </section>
        )}

        {groups.done.length > 0 && (
          <details className="cm-section cm-done">
            <summary className="cm-eyebrow">Done · {groups.done.length}</summary>
            <ul className="cm-rows">
              {groups.done.map((item) => <li key={item.id}><ItemRow item={item} state={state} onChanged={onChanged} /></li>)}
            </ul>
          </details>
        )}

        {empty && <p className="cm-muted cm-pad">No items yet. Ask for something here and the coordinator will track it.</p>}
      </div>

      <footer className="cm-foot">
        <span>Auto-approve {state.autoApprove ? "on" : "off"}{state.paused ? " · Paused" : ""}</span>
        {state.lastBriefedAt !== null && <span>Briefed {relativeTime(state.lastBriefedAt, Date.now())}</span>}
      </footer>
    </div>
  );
}

function DecisionView({ decision, prominent = false, onChanged }: { decision: Decision; prominent?: boolean; onChanged(): Promise<void> }) {
  const call = useCoordinatorRpc();
  const navigate = useBbNavigate();
  const [asking, setAsking] = useState(false);
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const qa = decision.kind === "qa";
  const noLabel = qa ? "Reject" : "Decline";

  const run = async (action: () => Promise<unknown>) => {
    setBusy(true);
    setError(null);
    try {
      await action();
      setAsking(false);
      setReason("");
      await onChanged();
    } catch (failure) {
      setError(errorMessage(failure));
    } finally {
      setBusy(false);
    }
  };

  const approve = () => void run(() => decision.kind === "qa"
    ? call("approveItem", { itemId: decision.item.id })
    : call("resolveApproval", { approvalId: decision.approval.id, approve: true }));

  const submitNo = () => {
    const trimmed = reason.trim();
    if (decision.kind === "qa") {
      if (!trimmed) return;
      void run(() => call("rejectItem", { itemId: decision.item.id, reason: trimmed }));
    } else {
      void run(() => call("resolveApproval", { approvalId: decision.approval.id, approve: false, ...(trimmed ? { reason: trimmed } : {}) }));
    }
  };

  const buttonClass = prominent ? "" : "cm-small";
  const actions = asking ? (
    <form className="cm-reason" onSubmit={(event) => { event.preventDefault(); submitNo(); }}>
      <input autoFocus className="cm-input" value={reason} onChange={(event) => setReason(event.target.value)}
        aria-label={qa ? "Reason for rejecting" : "Reason for declining (optional)"}
        placeholder={qa ? "What needs to change?" : "Why not? (optional)"} />
      <div className="cm-actions cm-end">
        <Button variant="ghost" className={buttonClass} disabled={busy} onClick={() => { setAsking(false); setReason(""); }}>Cancel</Button>
        <Button type="submit" variant="default" className={buttonClass} disabled={busy || (qa && !reason.trim())}>{noLabel}</Button>
      </div>
    </form>
  ) : (
    <div className="cm-actions cm-end">
      <Button className={buttonClass} disabled={busy} onClick={() => setAsking(true)}>{noLabel}…</Button>
      <Button variant={prominent ? "default" : "outline"} className={buttonClass} disabled={busy} onClick={approve}>Approve</Button>
    </div>
  );

  if (prominent) {
    return (
      <div className="cm-decision">
        <h3 className="cm-question">{decision.question}</h3>
        <p className="cm-consequence">{decision.consequence}</p>
        <div className="cm-decision-foot">
          {decision.threadId && !asking && (
            <button type="button" className="cm-link" onClick={() => navigate.toThread(decision.threadId!)}>Details</button>
          )}
          {actions}
        </div>
        {error && <p className="cm-error" role="alert">{error}</p>}
      </div>
    );
  }
  return (
    <div className="cm-row">
      <div className="cm-row-main">
        <div className="cm-row-text">
          <div className="cm-row-title">{decision.question}</div>
          <div className="cm-row-sub">{decision.consequence}</div>
        </div>
        {!asking && actions}
      </div>
      {asking && actions}
      {error && <p className="cm-error" role="alert">{error}</p>}
    </div>
  );
}

function threadActivity(thread: { status: string; hasPendingInteraction: boolean } | undefined): string | null {
  if (!thread) return null;
  if (thread.hasPendingInteraction) return "Needs input";
  return thread.status === "active" || thread.status === "starting" ? "Working" : null;
}

function ItemRow({ item, state, onChanged }: { item: CoordinatorItem; state: State; onChanged(): Promise<void> }) {
  const call = useCoordinatorRpc();
  const navigate = useBbNavigate();
  const { threads } = useSidebarThreads();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const live = isOpen(item);
  const thread = item.primaryThreadId ? threads.find((candidate) => candidate.id === item.primaryThreadId) : undefined;
  const line = itemStatusLine(item, state.template, live ? threadActivity(thread) : null);

  const stopTracking = async () => {
    setBusy(true);
    setError(null);
    try {
      await call("cutItem", { itemId: item.id });
      await onChanged();
    } catch (failure) {
      setError(errorMessage(failure));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="cm-row" data-done={live ? undefined : "true"}>
      <div className="cm-row-main">
        <div className="cm-row-text">
          {item.primaryThreadId ? (
            <button type="button" className="cm-row-title cm-link" title={item.summary ?? undefined}
              onClick={() => navigate.toThread(item.primaryThreadId!)}>{item.title}</button>
          ) : (
            <div className="cm-row-title" title={item.summary ?? undefined}>{item.title}</div>
          )}
          {live && item.reason && <div className="cm-row-sub">{item.reason}</div>}
        </div>
        <span className="cm-row-status">{line}</span>
        {live && (
          <Menu label={`More for ${item.title}`} className="cm-row-menu"
            entries={[{ label: "Stop tracking", disabled: busy, onSelect: () => void stopTracking() }]} />
        )}
      </div>
      {error && <p className="cm-error" role="alert">{error}</p>}
    </div>
  );
}

function LinkRow({ item, onChanged }: { item: CoordinatorItem; onChanged(): Promise<void> }) {
  const call = useCoordinatorRpc();
  const [link, setLink] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const save = async () => {
    const trimmed = link.trim();
    if (!trimmed) return;
    setBusy(true);
    setError(null);
    try {
      await call("setLink", { itemId: item.id, link: trimmed });
      setLink("");
      await onChanged();
    } catch (failure) {
      setError(errorMessage(failure));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="cm-row">
      <div className="cm-row-main">
        <div className="cm-row-text">
          <div className="cm-row-title">{item.title}</div>
          <div className="cm-row-sub">Needs a link</div>
        </div>
      </div>
      <form className="cm-reason" onSubmit={(event) => { event.preventDefault(); void save(); }}>
        <input className="cm-input" type="url" aria-label={`Link for ${item.title}`} placeholder="Add link"
          value={link} onChange={(event) => setLink(event.target.value)} />
        <div className="cm-actions cm-end">
          <Button type="submit" className="cm-small" disabled={busy || !link.trim()}>Save</Button>
        </div>
      </form>
      {error && <p className="cm-error" role="alert">{error}</p>}
    </div>
  );
}
