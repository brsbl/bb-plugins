import { useState } from "react";
import { useBbNavigate } from "@get-bb/plugin-sdk/app";
import type { CoordinatorItem, CoordinatorStatus, CoordinatorTemplate, PendingApproval } from "../contracts.js";
import { ACTION_LABELS } from "../model.js";
import { Button } from "./ui/button.js";
import { Switch } from "./ui/switch.js";
import { SetupForm } from "./setup-form.js";
import { errorMessage, useCoordinatorRpc } from "./rpc.js";

type Row = {
  key: string;
  item: CoordinatorItem | null;
  approvals: PendingApproval[];
  title: string;
  phrase: string;
  note: string | null;
  needsApproval: boolean;
  needsLink: boolean;
};

type TrackerGroups = { needs: Row[]; progress: Row[]; done: Row[] };

function groupItems(status: CoordinatorStatus, template: CoordinatorTemplate): TrackerGroups {
  const groups: TrackerGroups = { needs: [], progress: [], done: [] };
  const known = new Set(status.items.map((item) => item.id));
  for (const item of status.items) {
    const stage = template.stages[item.stageIndex];
    const stageName = stage?.name ?? "Unknown stage";
    const approvals = status.approvals.filter((approval) => approval.itemId === item.id);
    const waiting = item.status === "active" && !item.proposed;
    // A blocked item can still be waiting on you at an approval stage.
    const needsApproval = (item.status === "active" || item.status === "blocked") && !item.proposed && stage?.check === "you_approve";
    const needsLink = waiting && stage?.check === "link_added" && !item.link;
    const row: Row = {
      key: item.id,
      item,
      approvals,
      title: item.title,
      phrase: stageName,
      note: item.reason,
      needsApproval,
      needsLink,
    };
    if (item.status === "done" || item.status === "cut") {
      row.phrase = item.status === "cut" ? "Cut" : template.stages.at(-1)?.name ?? "Done";
      groups.done.push(row);
    } else if (item.proposed) {
      row.phrase = "Proposed";
      groups.needs.push(row);
    } else if (approvals.length > 0) {
      row.phrase = `Asks to ${ACTION_LABELS[approvals[0]!.action]}`;
      groups.needs.push(row);
    } else if (needsApproval || needsLink) {
      if (needsLink) row.phrase = `${stageName} · needs a link`;
      groups.needs.push(row);
    } else {
      if (item.status === "blocked") row.phrase = `${stageName} · Blocked`;
      groups.progress.push(row);
    }
  }
  for (const approval of status.approvals) {
    if (approval.itemId && known.has(approval.itemId)) continue;
    groups.needs.push({
      key: approval.id,
      item: null,
      approvals: [approval],
      title: approval.summary,
      phrase: `Asks to ${ACTION_LABELS[approval.action]}`,
      note: null,
      needsApproval: false,
      needsLink: false,
    });
  }
  return groups;
}

function subThreadCount(items: CoordinatorItem[]): number {
  const ids = new Set<string>();
  for (const item of items) {
    if (item.status === "cut") continue;
    if (item.primaryThreadId) ids.add(item.primaryThreadId);
    item.helperThreadIds.forEach((id) => ids.add(id));
  }
  return ids.size;
}

type TrackerProps = {
  threadId: string;
  threadName: string;
  status: CoordinatorStatus & { state: NonNullable<CoordinatorStatus["state"]> };
  onChanged(): Promise<void>;
};

export function Tracker({ threadId, threadName, status, onChanged }: TrackerProps) {
  const call = useCoordinatorRpc();
  const { state } = status;
  const groups = groupItems(status, state.template);
  const count = subThreadCount(status.items);
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

  return (
    <div className="cm-tracker">
      <header className="cm-tracker-head">
        <h2 className="cm-title">{threadName}</h2>
        <div className="cm-muted">
          Coordinator · {count} {count === 1 ? "sub-thread" : "sub-threads"}{state.paused ? " · Paused" : ""}
        </div>
      </header>

      {status.staleRules && (
        <div className="cm-banner" role="status">
          <span>Using old rules</span>
          <Button variant="ghost" className="cm-small" disabled={busy}
            onClick={() => void run(() => call("restartCoordinator", { threadId }))}>
            Restart
          </Button>
        </div>
      )}

      {error && <p className="cm-error cm-pad" role="alert">{error}</p>}

      <div className="cm-groups">
        <Group label="Needs you" rows={groups.needs} open tone="needs" onChanged={onChanged} />
        <Group label="In progress" rows={groups.progress} open onChanged={onChanged} />
        <Group label="Done" rows={groups.done} open={false} onChanged={onChanged} />
        {status.items.length === 0 && status.approvals.length === 0 && (
          <p className="cm-muted cm-pad">No items yet. Ask for something in this thread and the coordinator will propose an item.</p>
        )}
      </div>

      <footer className="cm-tracker-foot">
        {confirmOff ? (
          <div className="cm-confirm">
            <span>Turn off Coordinator Mode? The thread and its history stay.</span>
            <div className="cm-actions">
              <Button variant="ghost" disabled={busy} onClick={() => setConfirmOff(false)}>Cancel</Button>
              <Button variant="default" disabled={busy}
                onClick={() => void run(() => call("turnOff", { threadId })).then(() => setConfirmOff(false))}>
                Turn off
              </Button>
            </div>
          </div>
        ) : (
          <>
            <Button disabled={busy} onClick={() => void run(() => call("setPaused", { threadId, paused: !state.paused }))}>
              {state.paused ? "Resume" : "Pause"}
            </Button>
            <label className="cm-toggle">
              <Switch checked={state.autoApprove} disabled={busy} aria-label="Auto-approve commands"
                onCheckedChange={(autoApprove) => void run(() => call("setAutoApprove", { threadId, autoApprove }))} />
              <span>Auto-approve</span>
            </label>
            <Button variant="ghost" className="cm-push" disabled={busy} onClick={() => setEditingRules(true)}>Edit rules</Button>
            <Button variant="ghost" disabled={busy} onClick={() => setConfirmOff(true)}>Turn off</Button>
          </>
        )}
      </footer>
    </div>
  );
}

function Group({ label, rows, open, tone, onChanged }: {
  label: string;
  rows: Row[];
  open: boolean;
  tone?: "needs";
  onChanged(): Promise<void>;
}) {
  if (rows.length === 0) return null;
  return (
    <details className="cm-group" data-tone={tone} open={open}>
      <summary>{label} · {rows.length}</summary>
      <ul>
        {rows.map((row) => <TrackerRow key={row.key} row={row} onChanged={onChanged} />)}
      </ul>
    </details>
  );
}

type Prompt = { kind: "reject" } | { kind: "decline"; approvalId: string };

function TrackerRow({ row, onChanged }: { row: Row; onChanged(): Promise<void> }) {
  const call = useCoordinatorRpc();
  const navigate = useBbNavigate();
  const [prompt, setPrompt] = useState<Prompt | null>(null);
  const [reason, setReason] = useState("");
  const [link, setLink] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { item } = row;
  const live = item !== null && item.status !== "done" && item.status !== "cut";

  const run = async (action: () => Promise<unknown>) => {
    setBusy(true);
    setError(null);
    try {
      await action();
      setPrompt(null);
      setReason("");
      setLink("");
      await onChanged();
    } catch (failure) {
      setError(errorMessage(failure));
    } finally {
      setBusy(false);
    }
  };

  const submitPrompt = () => {
    if (!prompt) return;
    if (prompt.kind === "reject") {
      if (!item || !reason.trim()) return;
      void run(() => call("rejectItem", { itemId: item.id, reason: reason.trim() }));
    } else {
      const trimmed = reason.trim();
      void run(() => call("resolveApproval", { approvalId: prompt.approvalId, approve: false, ...(trimmed ? { reason: trimmed } : {}) }));
    }
  };

  return (
    <li className="cm-row">
      <div className="cm-row-main">
        {item?.primaryThreadId ? (
          <button type="button" className="cm-row-title cm-link" onClick={() => navigate.toThread(item.primaryThreadId!)}>{row.title}</button>
        ) : (
          <span className="cm-row-title">{row.title}</span>
        )}
        <span className="cm-row-phrase">{row.phrase}</span>
        {item && live && !item.proposed && (
          <Button variant="ghost" className="cm-small cm-row-cut" aria-label={`Cut ${row.title}`} disabled={busy}
            onClick={() => void run(() => call("cutItem", { itemId: item.id }))}>
            Cut
          </Button>
        )}
      </div>

      {row.note && <p className="cm-row-note">{row.note}</p>}
      {row.approvals.map((approval) => row.item && (
        <p key={approval.id} className="cm-row-note">{approval.summary}</p>
      ))}

      {prompt ? (
        <form className="cm-row-form" onSubmit={(event) => { event.preventDefault(); submitPrompt(); }}>
          <input autoFocus className="cm-input" value={reason} onChange={(event) => setReason(event.target.value)}
            aria-label={prompt.kind === "reject" ? "Reason for rejecting" : "Reason for declining (optional)"}
            placeholder={prompt.kind === "reject" ? "What needs to change?" : "Why not? (optional)"} />
          <Button variant="ghost" disabled={busy} onClick={() => { setPrompt(null); setReason(""); }}>Cancel</Button>
          <Button type="submit" variant="default" disabled={busy || (prompt.kind === "reject" && !reason.trim())}>
            {prompt.kind === "reject" ? "Reject" : "Decline"}
          </Button>
        </form>
      ) : (
        <>
          {item?.proposed && live && (
            <div className="cm-actions">
              <Button disabled={busy} onClick={() => void run(() => call("confirmItem", { itemId: item.id }))}>Keep</Button>
              <Button variant="ghost" disabled={busy} onClick={() => void run(() => call("cutItem", { itemId: item.id }))}>Drop</Button>
            </div>
          )}
          {row.approvals.map((approval) => (
            <div key={approval.id} className="cm-actions">
              <Button disabled={busy} onClick={() => void run(() => call("resolveApproval", { approvalId: approval.id, approve: true }))}>Approve</Button>
              <Button variant="ghost" disabled={busy} onClick={() => setPrompt({ kind: "decline", approvalId: approval.id })}>Decline</Button>
            </div>
          ))}
          {row.needsApproval && item && (
            <div className="cm-actions">
              <Button disabled={busy} onClick={() => void run(() => call("approveItem", { itemId: item.id }))}>Approve</Button>
              <Button variant="ghost" disabled={busy} onClick={() => setPrompt({ kind: "reject" })}>Reject</Button>
            </div>
          )}
          {row.needsLink && item && (
            <form className="cm-row-form" onSubmit={(event) => {
              event.preventDefault();
              if (link.trim()) void run(() => call("setLink", { itemId: item.id, link: link.trim() }));
            }}>
              <input className="cm-input" type="url" aria-label={`Link for ${row.title}`} placeholder="Add link"
                value={link} onChange={(event) => setLink(event.target.value)} />
              <Button type="submit" disabled={busy || !link.trim()}>Save</Button>
            </form>
          )}
        </>
      )}

      {error && <p className="cm-error" role="alert">{error}</p>}
    </li>
  );
}
