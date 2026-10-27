import { useEffect, useId, useRef, useState, type KeyboardEvent, type ReactNode } from "react";
import type { ObjectiveView, PriorityView } from "../model.js";
import type { ThreadOption } from "../rpc.js";
import type { Rpc } from "./data.js";
import { chooseThread, mentionText, metricPatch, threadLabel, threadQuery } from "./view-model.js";

const PATHS = {
  pri: <><circle cx="8" cy="8" r="6" /><circle cx="8" cy="8" r="2.5" /></>,
  obj: <path d="M3.5 14V2.5M3.5 3h8l-1.6 3 1.6 3h-8" />,
  inv: <path d="M8 2l6 3-6 3-6-3 6-3zM2 8l6 3 6-3M2 11l6 3 6-3" />,
  team: <><circle cx="6" cy="5.5" r="2.5" /><path d="M1.5 14c0-2.5 2-4 4.5-4s4.5 1.5 4.5 4M11 3.2a2.3 2.3 0 010 4.6M12.5 10.2c1.3.5 2 1.8 2 3.8" /></>,
  add: <path d="M8 3v10M3 8h10" />,
  pen: <path d="M10.5 2.5l3 3L6 13H3v-3z" />,
  chev: <path d="M6 3.5L10.5 8 6 12.5" />,
  check: <path d="M3 8.5l3 3 7-7" />,
};
export type Glyph = keyof typeof PATHS;

export function Icon({ glyph }: { glyph: Glyph }) {
  return <svg className="pl-ic" viewBox="0 0 16 16" aria-hidden="true">{PATHS[glyph]}</svg>;
}

export function Pencil({ label, onEdit }: { label: string; onEdit: () => void }) {
  return <button type="button" className="pl-pen" aria-label={`Edit ${label}`} title="Edit" onClick={(event) => { event.stopPropagation(); onEdit(); }}>
    <Icon glyph="pen" />
  </button>;
}

export function Editable({ label, onEdit, children }: { label: string; onEdit: () => void; children: ReactNode }) {
  return <span className="pl-ed">{children}<Pencil label={label} onEdit={onEdit} /></span>;
}

function useSettle() {
  const settled = useRef(false);
  return (run: () => void) => { if (settled.current) return; settled.current = true; run(); };
}

function focusOnMount(input: HTMLInputElement | null) {
  if (!input) return;
  input.focus();
  input.select();
  input.scrollIntoView?.({ block: "nearest" });
}

function editKeys(finish: (keep: boolean) => void) {
  return (event: KeyboardEvent) => {
    if (event.key === "Enter") { event.preventDefault(); finish(true); }
    else if (event.key === "Escape") { event.preventDefault(); event.stopPropagation(); finish(false); }
  };
}

export function InlineText({ value, label, onSave, onCancel }: { value: string; label: string; onSave: (next: string) => Promise<unknown>; onCancel: () => void }) {
  const ref = useRef<HTMLInputElement>(null);
  const initial = useRef({ value, onSave }).current;
  const settle = useSettle();
  const [busy, setBusy] = useState(false);
  useEffect(() => focusOnMount(ref.current), []);
  const finish = (keep: boolean) => settle(() => {
    const next = ref.current?.value.trim() ?? "";
    if (!keep || !next || next === initial.value) { onCancel(); return; }
    setBusy(true);
    void initial.onSave(next);
  });
  return <input ref={ref} className="pl-ie" defaultValue={value} placeholder={label} aria-label={label} readOnly={busy}
    onClick={(event) => event.stopPropagation()} onKeyDown={editKeys(finish)} onBlur={() => finish(true)} />;
}

export function MetricEditor({ priority, onSave, onInvalid, onCancel }: {
  priority: PriorityView;
  onSave: (patch: Record<string, unknown>) => Promise<unknown>;
  onInvalid: (message: string) => void;
  onCancel: () => void;
}) {
  const initial = useRef({ priority, onSave }).current;
  const box = useRef<HTMLDivElement>(null);
  const now = useRef<HTMLInputElement>(null);
  const target = useRef<HTMLInputElement>(null);
  const by = useRef<HTMLInputElement>(null);
  const metric = useRef<HTMLInputElement>(null);
  const settle = useSettle();
  const [busy, setBusy] = useState(false);
  useEffect(() => focusOnMount(now.current), []);
  const finish = (keep: boolean) => settle(() => {
    if (!keep) { onCancel(); return; }
    const patch = metricPatch(initial.priority, {
      now: now.current?.value ?? "",
      target: target.current?.value ?? "",
      by: by.current?.value ?? "",
      ...(metric.current ? { metric: metric.current.value } : {}),
    });
    if (typeof patch === "string") { onInvalid(patch); onCancel(); return; }
    if (!Object.keys(patch).length) { onCancel(); return; }
    setBusy(true);
    void initial.onSave(patch);
  });
  return <div ref={box} className="pl-metric pl-mi" onKeyDown={editKeys(finish)}
    onBlur={(event) => { if (!box.current?.contains(event.relatedTarget as Node | null)) finish(true); }}>
    <input ref={now} className="pl-ie pl-n" inputMode="decimal" defaultValue={priority.now ?? ""} aria-label="Now" readOnly={busy} />
    <span>now →</span>
    <input ref={target} className="pl-ie pl-n" inputMode="decimal" defaultValue={priority.target ?? ""} aria-label="Target" readOnly={busy} />
    {priority.metric ? <span>{priority.metric} by</span> : <><input ref={metric} className="pl-ie pl-m" defaultValue="" placeholder="Metric" aria-label="Metric" readOnly={busy} /><span>by</span></>}
    <input ref={by} className="pl-ie pl-d" defaultValue={priority.by ?? ""} placeholder="YYYY-MM-DD" aria-label="By" readOnly={busy} />
  </div>;
}

export function TeamPicker({ objective, rpc, onPick, onCancel }: {
  objective: ObjectiveView;
  rpc: Rpc;
  onPick: (threadId: string | null) => Promise<unknown>;
  onCancel: () => void;
}) {
  const initial = useRef({ objective, onPick }).current;
  const listId = useId();
  const ref = useRef<HTMLInputElement>(null);
  const settle = useSettle();
  const [text, setText] = useState(objective.assignee ? `@${threadLabel(objective.assignee)}` : "@");
  const [options, setOptions] = useState<ThreadOption[]>([]);
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    const input = ref.current;
    if (!input) return;
    input.focus();
    input.setSelectionRange(input.value.length, input.value.length);
  }, []);
  useEffect(() => {
    let live = true;
    const timer = setTimeout(() => {
      rpc.call("searchThreads", { query: threadQuery(text) }).then((result) => { if (live) setOptions(result.threads); }, () => {});
    }, 150);
    return () => { live = false; clearTimeout(timer); };
  }, [rpc, text]);
  const finish = (keep: boolean) => settle(() => {
    if (!keep) { onCancel(); return; }
    setBusy(true);
    void (async () => {
      let choice = chooseThread(text, options);
      if (!choice) {
        const fresh = await rpc.call("searchThreads", { query: threadQuery(text) }).catch(() => ({ threads: [] }));
        choice = chooseThread(text, fresh.threads);
      }
      if (!choice || choice.id === initial.objective.assigneeThreadId) { onCancel(); return; }
      await initial.onPick(choice.id);
    })();
  });
  return <>
    <input ref={ref} className="pl-ie" list={listId} value={text} onChange={(event) => setText(mentionText(event.target.value))} readOnly={busy}
      aria-label="Assign a team: @mention its thread" onKeyDown={editKeys(finish)} onBlur={() => finish(true)} />
    <datalist id={listId}>{options.map((option) => <option key={option.id} value={`@${option.name}`} />)}</datalist>
  </>;
}
