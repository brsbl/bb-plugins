import { useCallback, useEffect, useRef, useState } from "react";
import { definePluginApp, useComposer, useComposerView, useRealtime, useRpc, type PluginMessageDirectiveProps } from "@get-bb/plugin-sdk/app";
import type { rpcContract } from "./server.js";
import { actionMessage, idSchema, title, type Action, type Item } from "./model.js";
import "./app.css";

// Several cards may share one composer. A double click must never submit two drafts.
const submitting = new Set<string>();
const readableError = (error: unknown) => error instanceof Error ? error.message : "The card could not be updated. Try again.";

function ActionCard({ id, threadId }: { id: string; threadId: string }) {
  const rpc = useRpc<typeof rpcContract>();
  const composer = useComposer();
  const composerView = useComposerView();
  const view = useRef(composerView);
  view.current = composerView;
  const [item, setItem] = useState<Item | null>(null);
  const current = useRef<Item | null>(null);
  const [draft, setDraft] = useState("");
  const text = useRef("");
  const dirty = useRef(false);
  const [saving, setSaving] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saveError, setSaveError] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const flight = useRef<Promise<void> | null>(null);
  const lock = useRef(false);
  const alive = useRef(true);
  const adopt = useCallback((next: Item) => {
    current.current = next;
    if (alive.current) setItem(next);
  }, []);
  const load = useCallback(async (discard = false) => {
    try {
      const next = await rpc.call("get", { id, threadId });
      // Never advance the CAS revision under local edits or an in-flight write.
      if (!alive.current || flight.current || lock.current || (dirty.current && !discard)) return;
      if (current.current && next.revision < current.current.revision) return;
      adopt(next);
      text.current = next.content.type === "reply" ? next.content.draft : "";
      dirty.current = false;
      setDraft(text.current); setLoadError(false); setSaveError(false); setError(null);
    } catch (err) {
      if (alive.current) { setLoadError(true); setError(readableError(err)); }
    }
  }, [rpc, id, threadId, adopt]);
  useEffect(() => {
    alive.current = true;
    void load();
    // Reconcile missed realtime signals after reconnect and while the agent acts.
    const timer = setInterval(() => { void load(); }, 4000);
    return () => { alive.current = false; clearInterval(timer); };
  }, [load]);
  useRealtime("items", () => { void load(); });

  const flush = useCallback(async () => {
    if (flight.current) await flight.current;
    if (!dirty.current) return;
    const run = async () => {
      if (alive.current) { setSaving(true); setSaveError(false); }
      try {
        while (dirty.current) {
          const before = current.current;
          if (!before) throw new Error("Reload this card before editing.");
          const value = text.current;
          const next = await rpc.call("save", { id, threadId, revision: before.revision, draft: value });
          adopt(next);
          dirty.current = text.current !== value;
        }
        if (alive.current) setError(null);
      } catch (err) {
        if (alive.current) { setSaveError(true); setError(readableError(err)); }
        throw err;
      } finally {
        if (alive.current) setSaving(false);
      }
    };
    const pending = run();
    flight.current = pending;
    try { await pending; } finally { if (flight.current === pending) flight.current = null; }
  }, [rpc, id, threadId, adopt]);
  useEffect(() => {
    if (!dirty.current) return;
    const timer = setTimeout(() => { void flush().catch(() => {}); }, 500);
    return () => clearTimeout(timer);
  }, [draft, flush]);
  useEffect(() => () => { void flush().catch(() => {}); }, [flush]);

  const sendMessage = async (message: string) => {
    // Check again after asynchronous saves; the user may have started typing.
    if (composer.scope.kind !== "thread" || composer.scope.threadId !== threadId) throw new Error("Open this card in its original thread to respond.");
    if (composer.text.trim() || view.current.draft.attachmentCount || view.current.run.isSubmitting) throw new Error("Send or clear your current composer message first, then try the card again.");
    composer.setText(message);
    try {
      await composer.experimental_submit({ experimental_data: { itemId: id } });
      // Some older hosts restore the draft rather than reject on transport failure.
      if (composer.text === message) throw new Error("The request was not submitted. Retry this same request from the card or composer.");
    } catch (err) {
      throw err;
    }
  };

  const act = async (action?: Action) => {
    if (lock.current || submitting.has(threadId)) return;
    lock.current = true; submitting.add(threadId); setBusy(true); setError(null);
    try {
      await flush();
      let next = current.current;
      if (!next) return;
      // Preserve composer contents before reserving an action, too.
      if (composer.text.trim() || view.current.draft.attachmentCount) throw new Error("Send or clear your current composer message first, then try the card again.");
      if (composer.scope.kind !== "thread" || composer.scope.threadId !== threadId) throw new Error("Open this card in its original thread to respond.");
      if (action) {
        next = await rpc.call("prepare", { id, threadId, revision: next.revision, action });
        adopt(next);
      }
      // Resending a pending request keeps its attempt ID; claim refuses duplicates.
      const message = next.state === "failed"
        ? `Check outcome: ${title(next)} [action:${id}] [attempt:${next.attempt?.id}]`
        : actionMessage(next);
      await sendMessage(message);
    } catch (err) { setError(readableError(err)); }
    finally { lock.current = false; submitting.delete(threadId); setBusy(false); }
  };
  const askForChanges = async () => {
    if (lock.current) return;
    lock.current = true; setBusy(true);
    try {
      await flush();
      if (composer.scope.kind !== "thread" || composer.scope.threadId !== threadId) throw new Error("Open this card in its original thread to ask for changes.");
      const prompt = `Ask for changes: ${title(current.current!)} [action:${id}]\n`;
      composer.updateText((value) => `${value}${value.trim() ? "\n\n" : ""}${prompt}`);
      composer.focus();
    } catch (err) { setError(readableError(err)); }
    finally { lock.current = false; setBusy(false); }
  };
  const reopen = async () => {
    if (!current.current || lock.current) return;
    lock.current = true; setBusy(true);
    try { adopt(await rpc.call("reopen", { id, threadId, revision: current.current.revision })); setError(null); }
    catch (err) { setError(readableError(err)); }
    finally { lock.current = false; setBusy(false); }
  };
  if (!item) return <div className="iac-card" role="status">{error ?? "Loading card…"}{error && <button onClick={() => void load()}>Retry</button>}</div>;
  const reply = item.content.type === "reply" ? item.content : null;
  const ready = item.state === "ready";
  const deferred = item.state === "succeeded" && ["later", "skip"].includes(item.attempt?.action ?? "");
  return <article className="iac-card" aria-label={`${reply ? "Reply" : "Decision"}: ${title(item)}`}>
    <div className="iac-heading"><span className="iac-kind">{reply ? "Reply" : "Decide"}</span><strong>{title(item)}</strong></div>
    {reply ? <>
      <div className="iac-subject">{reply.subject}</div>
      <div className="iac-recipients">To: {reply.to.join(", ")}{reply.cc.length > 0 && <div>Cc: {reply.cc.join(", ")}</div>}{reply.bcc.length > 0 && <div>Bcc: {reply.bcc.join(", ")}</div>}</div>
      <details className="iac-original"><summary>Original email</summary><div className="iac-from">From: {reply.original.from}</div><div className="iac-email">{reply.original.body}</div></details>
      <div className="iac-draft-header"><label htmlFor={`draft-${threadId}-${id}`}>Draft</label><span role="status">{ready && (saveError ? "Not saved" : saving || dirty.current ? "Saving…" : "Saved")}</span></div>
      <textarea id={`draft-${threadId}-${id}`} aria-label="Draft" value={draft} readOnly={!ready || busy} spellCheck maxLength={40000} rows={Math.min(14, Math.max(5, draft.split("\n").length + 1))} onChange={(event) => { text.current = event.target.value; dirty.current = true; setDraft(event.target.value); }} onBlur={() => void flush().catch(() => {})} />
    </> : <p className="iac-consequence">{item.content.type === "decide" && item.content.consequence}</p>}
    {error && <div className="iac-error" role="alert">{error}<div className="iac-recovery">{loadError && <button onClick={() => void load()}>Retry loading</button>}{saveError && <><button onClick={() => void flush().catch(() => {})}>Retry save</button><button onClick={() => void load(true)}>Load saved draft</button></>}</div></div>}
    <div className="iac-footer">
      {ready ? <>
        <button className="iac-primary" disabled={busy || loadError} onClick={() => void act(reply ? "send" : "yes")}>{reply ? "Send" : "Yes"}</button>
        {reply ? <><button disabled={busy || loadError} onClick={() => void act("save-draft")}>Save to Gmail drafts</button><button disabled={busy || loadError} onClick={() => void askForChanges()}>Ask for changes</button></> : <button disabled={busy || loadError} onClick={() => void act("no")}>No</button>}
        <div className="iac-utilities"><button className="iac-icon" title="Later" aria-label="Later" disabled={busy || loadError} onClick={() => void act("later")}><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="8"/><path d="M12 7v5l3 2"/></svg></button><button className="iac-icon" title="Skip" aria-label="Skip" disabled={busy || loadError} onClick={() => void act("skip")}><svg viewBox="0 0 24 24" aria-hidden="true"><path d="m7 7 10 10M17 7 7 17"/></svg></button></div>
      </> : <>
        <span className={item.state === "failed" ? "iac-failed" : "iac-result"} role="status">{item.state === "pending" ? (item.attempt?.claimed ? "Agent is working…" : "Waiting for agent…") : <>{item.result?.message} <time dateTime={item.updatedAt}>{new Date(item.updatedAt).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}</time></>}</span>
        {item.state === "pending" && <button disabled={busy} title="Resend the same request; already claimed actions will not run again" onClick={() => void act()}>Resend request</button>}
        {item.state === "failed" && <button className="iac-primary" disabled={busy} onClick={() => void act(item.result?.retryable ? item.attempt!.action : undefined)}>{item.result?.retryable ? "Retry" : "Check outcome"}</button>}
        {(deferred || (item.state === "failed" && item.result?.retryable)) && <button disabled={busy} onClick={() => void reopen()}>{deferred ? "Resume" : reply ? "Edit draft" : "Choose again"}</button>}
      </>}
    </div>
  </article>;
}

export function ActionDirective({ attributes, message }: PluginMessageDirectiveProps) {
  const parsed = idSchema.safeParse(attributes.id);
  if (!parsed.success) return <div className="iac-card iac-error" role="alert">This card has an invalid item ID. Ask the agent to recreate its link.</div>;
  return <ActionCard key={`${message.threadId}:${parsed.data}`} id={parsed.data} threadId={message.threadId} />;
}
export default definePluginApp((app) => { app.slots.messageDirective({ id: "action", component: ActionDirective }); });
