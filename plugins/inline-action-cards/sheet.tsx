import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { useRealtime, useRpc } from "@get-bb/plugin-sdk/app";
import type { rpcContract } from "./server.js";
import type { Action, Item, TableView } from "./model.js";
import { ActionButton } from "./controls.js";
import { DecisionGroup, SubmitRow } from "./ui/components.js";
import { readableError, submitting } from "./submit.js";
import { ActionCard } from "./app.js";

// A staged answer is local until Send; it records the revision the user answered.
export type Stage = { action: Action; choice?: string; revision: number };
export type SheetBinding = {
  staged: Stage | null; changed: boolean; note: string; busy: boolean;
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


export function DecisionSheet({ id, threadId, onLoaded }: { id: string; threadId: string; onLoaded?: () => void }) {
  const rpc = useRpc<typeof rpcContract>();
  const key = `iac-sheet:${threadId}:${id}`;
  const [table, setTable] = useState<TableView | null>(null);
  useLayoutEffect(() => { if (table) onLoaded?.(); }, [table, onLoaded]);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
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
  // One table read at a time: events that arrive meanwhile share a single trailing reload.
  const loading = useRef<Promise<void> | null>(null);
  const again = useRef(false);
  const load = useCallback(async (): Promise<void> => {
    if (loading.current) { again.current = true; return loading.current; }
    const run = (async () => {
      try { const next = await rpc.call("table", { id, threadId }); setTable(next); reconcile(next.items); setError(null); }
      catch (err) { setError(readableError(err)); }
    })();
    loading.current = run;
    try { await run; } finally { loading.current = null; }
    if (again.current) { again.current = false; await load(); }
  }, [rpc, id, threadId, reconcile]);
  // Folded rows are not mounted, so the sheet itself follows results; a failure moves back into the open list.
  useEffect(() => {
    void load();
    const timer = setInterval(() => { void load(); }, 5000);
    return () => clearInterval(timer);
  }, [load]);
  const ids = useRef<string[]>([]); ids.current = table?.ids ?? [];
  // Only this thread's rows matter; a change elsewhere never reloads this sheet.
  useRealtime("items", (payload) => {
    const change = payload as { threadId?: unknown; id?: unknown } | null;
    if (change?.threadId !== threadId || (typeof change.id === "string" && !ids.current.includes(change.id))) return;
    void load();
  });
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
    // A note with no answer is a question about that row.
    const questions = table.items.filter((item) => item.state === "ready" && !saved.stages[item.id] && (saved.notes[item.id] ?? "").trim());
    if (!rows.length && !questions.length) return;
    lock.current = true; submitting.add(threadId); setBusy(true); setError(null);
    try {
      const items = !rows.length ? [] : await rpc.call("prepareBatch", { id, threadId, items: rows.map((item) => {
        const stage = saved.stages[item.id]!;
        return { id: item.id, revision: item.revision, action: stage.action as "yes", ...(stage.choice ? { choice: stage.choice } : {}), note: (saved.notes[item.id] ?? "").trim() };
      }) });
      items.forEach((item) => updateItem(item));
      // Each comment now lives on its attempt; the staged copies are done.
      const asked = await Promise.all(questions.map((item) => rpc.call("comment", { id: item.id, threadId, revision: item.revision, note: (saved.notes[item.id] ?? "").trim() })));
      const sent = await rpc.call("dispatch", { threadId, entries: [
        ...items.map((item) => ({ kind: "action" as const, id: item.id, attemptId: item.attempt!.id })),
        ...asked.map((entry) => ({ kind: "comment" as const, id: entry.item.id, commentId: entry.commentId })),
      ] });
      sent.forEach((item) => updateItem(item));
      setSaved((value) => {
        const stages = { ...value.stages }, notes = { ...value.notes };
        for (const item of [...items, ...asked.map((entry) => entry.item)]) { delete stages[item.id]; delete notes[item.id]; }
        return { ...value, stages, notes };
      });
    } catch (err) { setError(readableError(err)); }
    finally { lock.current = false; submitting.delete(threadId); setBusy(false); }
  };

  if (!table) return <div className="iac-card" role="status">{error ?? "Loading actions…"}{error && <ActionButton onClick={() => void load()}>Retry</ActionButton>}</div>;
  const ready = table.items.filter((item) => item.state === "ready");
  const answers = ready.filter((item) => saved.stages[item.id]?.revision === item.revision).length;
  const questions = ready.filter((item) => !saved.stages[item.id] && (saved.notes[item.id] ?? "").trim()).length;
  // One form: every decision is a row, and one Submit sends what you filled in.
  const count = answers + questions;
  return <DecisionGroup title={table.title} progress={ready.length ? `${answers} of ${ready.length} answered` : undefined} onSubmit={() => void send()}
    footer={ready.length > 0 ? <SubmitRow canSubmit={count > 0} pending={busy} submitLabel={count ? `Submit ${count} ${count === 1 ? "answer" : "answers"}` : "Submit"} /> : null}>
    {table.items.map((item) => <ActionCard key={item.id} id={item.id} threadId={threadId} initialItem={item} row onItem={updateItem}
      sheet={{
        busy, staged: saved.stages[item.id] ?? null, changed: saved.changed.includes(item.id), note: saved.notes[item.id] ?? "",
        stage: (action, choice) => stageRow(item, action, choice), clear: () => clearRow(item.id), setNote: (note) => setNote(item.id, note),
      }} />)}
    {error && <div className="iac-error" role="alert">{error}</div>}
  </DecisionGroup>;
}
