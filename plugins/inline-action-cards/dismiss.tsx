// Dismiss: settle a waiting item without answering it. One click starts it; Undo or a reason are offered for a
// few seconds, and only then is it stored and its thread told, so an undone dismissal leaves no trace.
import { useCallback, useEffect, useRef, useState } from "react";
import { useRpc } from "@get-bb/plugin-sdk/app";
import type { rpcContract } from "./server.js";
import type { Item } from "./model.js";
import { readableError } from "./submit.js";

export const UNDO_MS = 5000;

export function useDismiss(item: Item | null, onDismissed?: (item: Item) => void) {
  const rpc = useRpc<typeof rpcContract>();
  const [pending, setPending] = useState(false);
  // Once the request starts, Undo is gone: it could no longer prevent the dismissal or its notice.
  const [committing, setCommitting] = useState(false);
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);
  // revision: the exact item the user chose to dismiss; a different revision is a different decision.
  const state = useRef({ pending: false, reason: "", item, sent: false, revision: 0 });
  state.current.item = item;
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const done = useRef(onDismissed); done.current = onDismissed;
  const clear = () => { if (timer.current) clearTimeout(timer.current); timer.current = null; };
  const commit = useCallback(async () => {
    clear();
    const current = state.current;
    if (!current.pending || current.sent || !current.item) return;
    current.sent = true;
    setCommitting(true);
    try {
      const reasonText = current.reason.trim();
      const next = await rpc.call("dismiss", { threadId: current.item.threadId, id: current.item.id, revision: current.revision, ...(reasonText ? { reason: reasonText.slice(0, 200) } : {}) });
      current.pending = false;
      setPending(false); setCommitting(false);
      done.current?.(next);
    } catch (err) {
      current.sent = false; current.pending = false;
      setPending(false); setCommitting(false); setError(readableError(err));
    }
  }, [rpc]);
  const schedule = useCallback((ms = UNDO_MS) => { clear(); timer.current = setTimeout(() => void commit(), ms); }, [commit]);
  const start = () => {
    if (!item) return;
    Object.assign(state.current, { pending: true, reason: "", sent: false, revision: item.revision });
    setPending(true); setReason(""); setError(null); schedule();
  };
  const undo = () => {
    if (state.current.sent) return;
    clear(); state.current.pending = false; setPending(false); setReason("");
  };
  const changeReason = (value: string) => { state.current.reason = value; setReason(value); };
  // The item changed under a pending dismissal (reopened, retried, edited elsewhere): cancel it, never carry it over.
  useEffect(() => {
    const current = state.current;
    if (current.pending && !current.sent && item && item.revision !== current.revision) undo();
  }, [item?.revision]);
  // Leaving the view keeps the dismissal the user started.
  useEffect(() => () => { if (state.current.pending) void commit(); }, [commit]);
  return { pending, committing, reason, error, start, undo, commit, schedule, pause: clear, changeReason };
}

export type Dismissal = ReturnType<typeof useDismiss>;

/** Shown in place of the item's controls while Undo is still possible. */
export function DismissBar({ dismissal }: { dismissal: Dismissal }) {
  if (dismissal.committing) return <div className="iac-dismiss" role="status"><span className="iac-dismiss-label">Dismissing…</span></div>;
  return <div className="iac-dismiss" role="status">
    <span className="iac-dismiss-label">Dismissed</span>
    <input className="iac-dismiss-reason" aria-label="Reason (optional)" placeholder="Reason (optional) · Enter to dismiss now" maxLength={200} value={dismissal.reason}
      onFocus={dismissal.pause} onBlur={() => dismissal.schedule(3000)}
      onChange={(event) => dismissal.changeReason(event.target.value)}
      onKeyDown={(event) => {
        if (event.key === "Enter") { event.preventDefault(); void dismissal.commit(); }
        else if (event.key === "Escape") { event.preventDefault(); event.stopPropagation(); dismissal.undo(); }
      }} />
    <button type="button" className="iac-dismiss-undo" onClick={dismissal.undo}>Undo</button>
  </div>;
}
