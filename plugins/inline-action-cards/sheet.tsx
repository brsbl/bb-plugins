import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { useComposer, useComposerView, useRealtime, useRpc } from "@get-bb/plugin-sdk/app";
import type { rpcContract } from "./server.js";
import { actionLabel, actionMessage, bulkLabel, title, type Action, type Item, type TableView } from "./model.js";
import { ActionButton, PendingButton } from "./controls.js";
import { NoteIcon } from "./evidence.js";
import { appendActionNote, insertActionMention } from "./presentation.js";
import { readableError, submitDraft, submitting } from "./submit.js";
import { ActionCard } from "./app.js";

// A staged answer is local until Send; it records the revision the user answered.
export type Stage = { action: Action; choice?: string; revision: number };
export type SheetBinding = {
  staged: Stage | null; changed: boolean; note: string;
  stage: (action: Action, choice?: string) => void; clear: () => void; setNote: (note: string) => void;
};
type Saved = { stages: Record<string, Stage>; notes: Record<string, string>; changed: string[] };
const empty: Saved = { stages: {}, notes: {}, changed: [] };

function restore(key: string): Saved {
  try {
    const value = JSON.parse(localStorage.getItem(key) ?? "null") as Partial<Saved> | null;
    return value && typeof value === "object" ? { stages: value.stages ?? {}, notes: value.notes ?? {}, changed: value.changed ?? [] } : empty;
  } catch { return empty; }
}

function recommendation(item: Item): Omit<Stage, "revision"> | null {
  if (item.content.type === "decide" && item.content.recommended) return { action: item.content.recommended };
  if (item.content.type === "choice" && item.content.recommended) return { action: "choose", choice: item.content.recommended };
  return null;
}

export function DecisionSheet({ id, threadId }: { id: string; threadId: string }) {
  const rpc = useRpc<typeof rpcContract>();
  const composer = useComposer();
  const composerView = useComposerView();
  const view = useRef(composerView); view.current = composerView;
  const key = `iac-sheet:${threadId}:${id}`;
  const [table, setTable] = useState<TableView | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [open, setOpen] = useState<string | null>(null);
  const [showFinished, setShowFinished] = useState(false);
  const [saved, setSaved] = useState<Saved>(() => restore(key));
  const lock = useRef(false);
  useEffect(() => {
    try {
      if (Object.keys(saved.stages).length || Object.values(saved.notes).some(Boolean) || saved.changed.length) localStorage.setItem(key, JSON.stringify(saved));
      else localStorage.removeItem(key);
    } catch { /* Private browsing can refuse storage; answers still work for this view. */ }
  }, [key, saved]);
  // An answer staged against an older revision no longer describes this row: drop it and say so.
  const reconcile = useCallback((items: Item[], own: Set<string> = new Set()) => setSaved((value) => {
    let next = value;
    for (const item of items) {
      const stage = next.stages[item.id];
      if (!stage || (stage.revision === item.revision && item.state === "ready")) continue;
      const { [item.id]: _dropped, ...stages } = next.stages;
      next = own.has(item.id) && item.state === "ready"
        ? { ...next, stages: { ...next.stages, [item.id]: { ...stage, revision: item.revision } } }
        : { ...next, stages, changed: item.state === "ready" ? [...new Set([...next.changed, item.id])] : next.changed };
    }
    return next;
  }), []);
  const load = useCallback(async () => {
    try { const next = await rpc.call("table", { id, threadId }); setTable(next); reconcile(next.items); setError(null); }
    catch (err) { setError(readableError(err)); }
  }, [rpc, id, threadId, reconcile]);
  // Folded rows are not mounted, so the sheet itself follows results; a failure moves back into the open list.
  useEffect(() => {
    void load();
    const timer = setInterval(() => { void load(); }, 5000);
    return () => clearInterval(timer);
  }, [load]);
  useRealtime("items", () => { void load(); });
  const updateItem = useCallback((next: Item, own = false) => {
    setTable((value) => {
      const previous = value?.items.find((item) => item.id === next.id);
      if (!value || !previous || previous.revision === next.revision) return value;
      return { ...value, items: value.items.map((item) => item.id === next.id ? { ...item, ...next } : item) };
    });
    reconcile([next], own ? new Set([next.id]) : undefined);
  }, [reconcile]);
  const stageRow = (item: Item, action: Action, choice?: string) => setSaved((value) => ({
    ...value, stages: { ...value.stages, [item.id]: { action, ...(choice ? { choice } : {}), revision: item.revision } }, changed: value.changed.filter((rowId) => rowId !== item.id),
  }));
  const clearRow = (rowId: string) => setSaved((value) => {
    const { [rowId]: _dropped, ...stages } = value.stages;
    return { ...value, stages, changed: value.changed.filter((changedId) => changedId !== rowId) };
  });
  const setNote = (rowId: string, note: string) => setSaved((value) => ({ ...value, notes: { ...value.notes, [rowId]: note } }));

  const send = async () => {
    if (!table || lock.current || submitting.has(threadId)) return;
    const rows = table.items.filter((item) => item.state === "ready" && saved.stages[item.id]?.revision === item.revision);
    if (!rows.length) return;
    lock.current = true; submitting.add(threadId); setBusy(true); setError(null);
    try {
      const checkComposer = () => {
        if (composer.scope.kind !== "thread" || composer.scope.threadId !== threadId) throw new Error("Open this table in its original thread to respond.");
        if (composer.text.trim() || view.current.draft.attachmentCount || view.current.run.isSubmitting) throw new Error("Send or clear your current composer message first, then try again.");
      };
      checkComposer();
      const items = await rpc.call("prepareBatch", { id, threadId, items: rows.map((item) => {
        const stage = saved.stages[item.id]!;
        return { id: item.id, revision: item.revision, action: stage.action as "yes", ...(stage.choice ? { choice: stage.choice } : {}), note: (saved.notes[item.id] ?? "").trim() };
      }) });
      items.forEach((item) => updateItem(item));
      // Each comment now lives on its attempt; the staged copies are done.
      setSaved((value) => {
        const stages = { ...value.stages }, notes = { ...value.notes };
        for (const item of items) { delete stages[item.id]; delete notes[item.id]; }
        return { ...value, stages, notes };
      });
      checkComposer();
      composer.setText("");
      items.forEach((item, index) => {
        composer.updateText((value) => `${value}${index ? "\n" : ""}${actionMessage(item)}`);
        insertActionMention(composer, item);
        appendActionNote(composer, item);
      });
      if (!await submitDraft(composer, { experimental_data: { tableId: id } })) throw new Error("The request was not submitted. Send the prepared composer message, or resend each pending row.");
      (await Promise.all(items.map((item) => rpc.call("submitted", { id: item.id, threadId, attemptId: item.attempt!.id })))).forEach((item) => updateItem(item));
    } catch (err) { setError(readableError(err)); }
    finally { lock.current = false; submitting.delete(threadId); setBusy(false); }
  };

  if (!table) return <div className="iac-card" role="status">{error ?? "Loading actions…"}{error && <ActionButton onClick={() => void load()}>Retry</ActionButton>}</div>;
  const ready = table.items.filter((item) => item.state === "ready");
  const staged = ready.filter((item) => saved.stages[item.id]?.revision === item.revision);
  const failed = table.items.filter((item) => item.state === "failed");
  // Open rows stay in place; anything sent or done folds into one group below them.
  const finished = table.items.filter((item) => item.state === "pending" || item.state === "succeeded");
  const toDecide = ready.length - staged.length;
  const summary = [toDecide ? `${toDecide} to decide` : ready.length ? "All answered" : "All sent", failed.length ? `${failed.length} need${failed.length === 1 ? "s" : ""} attention` : null].filter(Boolean).join(" · ");
  // Matching rows keep their one-click "… all"; otherwise the agent's recommendations can be staged at once.
  const all = bulkLabel(table.items);
  const suggested = ready.filter((item) => !saved.stages[item.id] && recommendation(item));
  const bulk = all && ready.some((item) => !saved.stages[item.id])
    ? { label: all, run: () => ready.forEach((item) => stageRow(item, "yes")) }
    : suggested.length ? { label: `Accept ${suggested.length} recommended`, run: () => suggested.forEach((item) => { const pick = recommendation(item)!; stageRow(item, pick.action, pick.choice); }) } : null;
  const row = (item: TableView["items"][number]) => <ActionCard key={item.id} id={item.id} threadId={threadId} initialItem={item} row expanded={open === item.id}
    onExpand={(expanded) => setOpen((value) => expanded ? item.id : value === item.id ? null : value)} onItem={updateItem}
    sheet={{
      staged: saved.stages[item.id] ?? null, changed: saved.changed.includes(item.id), note: saved.notes[item.id] ?? "",
      stage: (action, choice) => stageRow(item, action, choice), clear: () => clearRow(item.id), setNote: (note) => setNote(item.id, note),
    }} />;
  return <section className="iac-table iac-sheet" aria-label={table.title}>
    <div className="iac-table-header">
      <div className="iac-sheet-title"><span>{table.title}</span><span className="iac-sheet-counts">{summary}</span></div>
      {bulk && <ActionButton className="iac-quiet" disabled={busy} onClick={bulk.run}>{bulk.label}</ActionButton>}
    </div>
    {table.items.filter((item) => !finished.includes(item)).map(row)}
    {finished.length > 0 && <>
      <button type="button" className="iac-finished-toggle" aria-expanded={showFinished} onClick={() => setShowFinished(!showFinished)}>
        <span className="iac-disclosure" aria-hidden="true">{showFinished ? "▾" : "▸"}</span>{finished.length} sent or done
      </button>
      {showFinished && <div className="iac-finished">{finished.map(row)}</div>}
    </>}
    {error && <div className="iac-error" role="alert">{error}</div>}
    {staged.length > 0 && <div className="iac-sheet-footer">
      <span className="iac-muted" role="status">{staged.length} {staged.length === 1 ? "answer" : "answers"} not sent yet</span>
      <ActionButton disabled={busy} onClick={() => setSaved((value) => ({ ...value, stages: {} }))}>Clear</ActionButton>
      <PendingButton variant="default" pending={busy} pendingLabel="Sending…" onClick={() => void send()}>{`Send ${staged.length} ${staged.length === 1 ? "answer" : "answers"}`}</PendingButton>
    </div>}
  </section>;
}

// One sheet row: question, its staged answer, and the full card body when open.
export function SheetRowView({ item, done, result, expanded, onExpand, sheet, disabled, followUpCount, failure, body }: {
  item: Item; done: boolean; result: ReactNode; expanded: boolean; onExpand: (open: boolean) => void; sheet: SheetBinding;
  disabled: boolean; followUpCount: number; failure: ReactNode; body: ReactNode;
}) {
  const { content } = item;
  const staged = sheet.staged;
  const name = `iac-sheet-${item.threadId}-${item.id}`;
  const status = `${name}-status`;
  const answer = content.type === "decide"
    ? <Segments name={name} label={title(item)} describedBy={staged ? status : undefined} disabled={disabled} value={staged && (staged.action === "yes" || staged.action === "no") ? staged.action : null}
      recommended={content.recommended ?? null} options={[{ id: "yes", label: actionLabel(item, "yes") }, { id: "no", label: actionLabel(item, "no") }]}
      onChange={(value) => sheet.stage(value as Action)} />
    : content.type === "choice"
      ? <Segments name={name} label={title(item)} describedBy={staged ? status : undefined} disabled={disabled} value={staged?.action === "choose" ? staged.choice ?? null : null}
        recommended={content.recommended ?? null} options={content.options} onChange={(value) => sheet.stage("choose", value)} />
      : staged ? <span className="iac-staged-action">{actionLabel(item, staged.action)}</span>
        : <ActionButton variant="outline" disabled={disabled} aria-expanded={expanded} onClick={() => onExpand(!expanded)}>{expanded ? "Close" : "Review"}</ActionButton>;
  return <article className="iac-row iac-sheet-row" data-staged={staged ? true : undefined} data-open={expanded || undefined} aria-label={`${content.type === "reply" ? "Reply" : content.type === "choice" ? "Choice" : "Decision"}: ${title(item)}`}>
    {done ? result : <div className="iac-row-line">
      <button type="button" className="iac-row-summary" aria-expanded={expanded} onClick={() => onExpand(!expanded)}>
        <span className="iac-row-question">{title(item)}
          {(sheet.note.trim() || followUpCount > 0) && <NoteIcon className="iac-row-mark" />}
          <span className="iac-disclosure" aria-hidden="true">{expanded ? "▾" : "▸"}</span>
        </span>
      </button>
      <div className="iac-row-answer">
        {sheet.changed && !staged && <span className="iac-tag iac-tag-changed">Changed — review again</span>}
        {staged && <span id={status} className="iac-sr-only">Not sent yet</span>}
        {answer}
      </div>
    </div>}
    {expanded && body}
    {failure}
  </article>;
}

function Segments({ name, label, describedBy, options, value, recommended, disabled, onChange }: {
  name: string; label: string; describedBy?: string; options: { id: string; label: string }[]; value: string | null; recommended: string | null; disabled: boolean; onChange: (value: string) => void;
}) {
  return <div role="radiogroup" aria-label={label} aria-describedby={describedBy} className="iac-segments">
    {options.map((option) => <label key={option.id} className="iac-segment" data-recommended={recommended === option.id || undefined} title={recommended === option.id ? `${option.label} (recommended)` : option.label}>
      <input type="radio" name={name} value={option.id} checked={value === option.id} disabled={disabled} onChange={() => onChange(option.id)} />
      <span>{option.label}</span>
      {recommended === option.id && <span className="iac-sr-only"> (recommended)</span>}
    </label>)}
  </div>;
}
