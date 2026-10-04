import { useCallback, useEffect, useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { definePluginApp, useBbNavigate, useComposer, useComposerView, useRealtime, useRpc, type PluginMessageDirectiveProps } from "@get-bb/plugin-sdk/app";
import type { rpcContract } from "./server.js";
import { actionLabel, actionMessage, bulkLabel, idSchema, title, type Action, type Item, type TableView, type ActionLog } from "./model.js";
import { ActionButton, PendingButton, IconButton, MoreMenu, MenuAction, ClockIcon, SkipIcon, MailIcon, SignpostIcon, ViewIcon, ActionGlyphIcon, type ActionGlyph } from "./controls.js";
import { insertActionMention, pendingLabel } from "./presentation.js";
import "./app.css";

// Several cards may share one composer. A double click must never submit two drafts.
const submitting = new Set<string>();
const readableError = (error: unknown) => error instanceof Error ? error.message : "The card could not be updated. Try again.";

function ActionCard({ id, threadId, row = false, expanded = false, onExpand, initialItem, onItem, logEntry }: {
  id: string; threadId: string; row?: boolean; expanded?: boolean; onExpand?: (open: boolean) => void;
  initialItem?: Item; onItem?: (item: Item) => void; logEntry?: { threadTitle: string; threadProjectId: string | null; showThread: boolean };
}) {
  const navigate = useBbNavigate();
  const [viewResult, setViewResult] = useState(false);
  const onItemRef = useRef(onItem); onItemRef.current = onItem;
  const onExpandRef = useRef(onExpand); onExpandRef.current = onExpand;
  const rpc = useRpc<typeof rpcContract>();
  const composer = useComposer();
  const composerView = useComposerView();
  const view = useRef(composerView);
  view.current = composerView;
  const [item, setItem] = useState<Item | null>(initialItem ?? null);
  const current = useRef<Item | null>(initialItem ?? null);
  const [draft, setDraft] = useState(initialItem?.content.type === "reply" ? initialItem.content.draft : "");
  const text = useRef(draft);
  const dirty = useRef(false);
  const [saving, setSaving] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saveError, setSaveError] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const lastLoadFailed = useRef(false);
  const flight = useRef<Promise<void> | null>(null);
  const lock = useRef(false);
  const alive = useRef(true);
  const adopt = useCallback((next: Item) => {
    const changedState = current.current?.state !== next.state;
    current.current = next;
    if (alive.current) {
      setItem(next); onItemRef.current?.(next);
      if (changedState && (next.state === "succeeded" || next.state === "failed")) onExpandRef.current?.(false);
      if (changedState && (next.state === "succeeded" || next.state === "failed")) setError(null);
    }
  }, []);
  useEffect(() => {
    if (initialItem && initialItem.revision > (current.current?.revision ?? 0) && !dirty.current && !flight.current && !lock.current) {
      adopt(initialItem);
      text.current = initialItem.content.type === "reply" ? initialItem.content.draft : "";
      setDraft(text.current);
    }
  }, [initialItem, adopt]);
  const load = useCallback(async (discard = false) => {
    try {
      const next = await rpc.call("get", { id, threadId });
      // Never advance the CAS revision under local edits or an in-flight write.
      if (!alive.current || flight.current || lock.current || (dirty.current && !discard)) return;
      if (current.current && next.revision < current.current.revision) return;
      adopt(next);
      text.current = next.content.type === "reply" ? next.content.draft : "";
      dirty.current = false;
      setDraft(text.current); setLoadError(false); setSaveError(false);
      if (discard || lastLoadFailed.current) setError(null);
      lastLoadFailed.current = false;
    } catch (err) {
      if (alive.current) { lastLoadFailed.current = true; setLoadError(true); setError(readableError(err)); }
    }
  }, [rpc, id, threadId, adopt]);
  useEffect(() => {
    alive.current = true;
    if (logEntry) return () => { alive.current = false; };
    void load();
    // Reconcile missed realtime signals after reconnect and while the agent acts.
    const timer = setInterval(() => { void load(); }, 4000);
    return () => { alive.current = false; clearInterval(timer); };
  }, [load, !!logEntry]);
  useRealtime("items", () => { if (!logEntry) void load(); });

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

  const sendMessage = async (next: Item) => {
    // Check again after asynchronous saves; the user may have started typing.
    if (composer.scope.kind !== "thread" || composer.scope.threadId !== threadId) throw new Error("Open this card in its original thread to respond.");
    if (composer.text.trim() || view.current.draft.attachmentCount || view.current.run.isSubmitting) throw new Error("Send or clear your current composer message first, then try the card again.");
    composer.setText(actionMessage(next));
    insertActionMention(composer, next);
    const submittedText = composer.text;
    await composer.experimental_submit({ experimental_data: { itemId: id } });
    if (composer.text === submittedText) throw new Error("The request was not submitted. Send the prepared composer message or clear it and retry from the card.");
  };

  const act = async (action?: Action) => {
    if (lock.current || submitting.has(threadId)) return;
    lock.current = true; submitting.add(threadId); setBusy(true); setError(null);
    try {
      await flush();
      let next = current.current;
      if (!next) return;
      if (logEntry) {
        const updated = await rpc.call("decideFromLog", { id, threadId, revision: next.revision, ...(action ? { action } : {}) });
        adopt(updated);
        return;
      }
      // Preserve composer contents before reserving an action, too.
      if (composer.text.trim() || view.current.draft.attachmentCount) throw new Error("Send or clear your current composer message first, then try the card again.");
      if (composer.scope.kind !== "thread" || composer.scope.threadId !== threadId) throw new Error("Open this card in its original thread to respond.");
      if (action) {
        next = await rpc.call("prepare", { id, threadId, revision: next.revision, action });
        adopt(next);
      }
      // Resending a pending request keeps its attempt ID; claim refuses duplicates.
      await sendMessage(next);
    } catch (err) { setError(readableError(err)); }
    finally { lock.current = false; submitting.delete(threadId); setBusy(false); }
  };
  const askForChanges = async () => {
    if (logEntry) { navigate.toThread(threadId); return; }
    if (lock.current) return;
    lock.current = true; setBusy(true);
    try {
      await flush();
      if (composer.scope.kind !== "thread" || composer.scope.threadId !== threadId) throw new Error("Open this card in its original thread to ask for changes.");
      composer.updateText((value) => `${value}${value.trim() ? "\n\n" : ""}Ask for changes to `);
      insertActionMention(composer, current.current!, true);
      composer.updateText((value) => `${value}\n`);
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
  const reply = item?.content.type === "reply" ? item.content : null;
  const ready = item?.state === "ready";
  const pending = item?.state === "pending";
  const done = item?.state === "succeeded" || item?.state === "failed";
  const showBody = logEntry ? viewResult : row ? expanded : !done || viewResult;
  const editor = useRef<HTMLTextAreaElement>(null);
  useLayoutEffect(() => {
    const resize = () => {
      if (editor.current) {
        editor.current.style.height = "0px";
        editor.current.style.height = `${editor.current.scrollHeight}px`;
      }
    };
    resize();
    window.addEventListener("resize", resize);
    return () => window.removeEventListener("resize", resize);
  }, [draft, showBody]);
  if (!item) return <div className="iac-card" role="status">{error ?? "Loading card…"}{error && <ActionButton onClick={() => void load()}>Retry</ActionButton>}</div>;
  const disabled = busy || loadError || pending;
  const deferred = item.state === "succeeded" && ["later", "skip"].includes(item.attempt?.action ?? "");
  const setOpen = (open: boolean) => row ? onExpand?.(open) : setViewResult(open);
  const utilities = <div className="iac-actions">
    <IconButton label="Remind me later" disabled={disabled} onClick={() => void act("later")}><ClockIcon /></IconButton>
    <IconButton label="Skip" disabled={disabled} onClick={() => void act("skip")}><SkipIcon /></IconButton>
  </div>;
  const controls = <div className="iac-actions iac-footer">
    {ready || pending ? <>
      <span className="iac-menu-slot">{pending
        ? <MoreMenu disabled={busy}><MenuAction onSelect={() => void act()}>Resend request</MenuAction></MoreMenu>
        : reply && <MoreMenu disabled={disabled}><MenuAction onSelect={() => void act("save-draft")}>Save to Gmail drafts</MenuAction></MoreMenu>}</span>
      {reply ? <ActionButton disabled={disabled} onClick={() => void askForChanges()}>Ask for changes</ActionButton>
        : <PendingButton pending={pending && item.attempt?.action === "no"} pendingLabel={pendingLabel(item, "no")} disabled={disabled} onClick={() => void act("no")}>{actionLabel(item, "no")}</PendingButton>}
      <PendingButton variant="default" pending={pending && item.attempt?.action === (reply ? "send" : "yes")} pendingLabel={pendingLabel(item, reply ? "send" : "yes")} disabled={disabled} onClick={() => void act(reply ? "send" : "yes")}>{reply ? "Send" : actionLabel(item, "yes")}</PendingButton>
    </> : null}
  </div>;
  const failure = error && <div className="iac-error" role="alert">{error}<div className="iac-actions">
    {loadError && <ActionButton onClick={() => void load()}>Retry loading</ActionButton>}
    {saveError && <><ActionButton onClick={() => void flush().catch(() => {})}>Retry save</ActionButton><ActionButton onClick={() => void load(true)}>Load saved draft</ActionButton></>}
  </div></div>;
  const result = <div className="iac-result-line">
    <span className={item.state === "failed" ? "iac-failed" : "iac-result"} role="status">
      <span aria-hidden="true">{item.state === "failed" ? "⚠" : "✓"}</span> {resultLabel(item)}
      {row && <span className="iac-muted"> · {title(item)}</span>}
      <time dateTime={item.updatedAt}> · {new Date(item.updatedAt).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}</time>
    </span>
    <div className="iac-actions">
      {(deferred || (item.state === "failed" && item.result?.retryable)) && <MoreMenu disabled={busy}><MenuAction onSelect={() => void reopen()}>{deferred ? "Resume" : reply ? "Edit draft" : "Choose again"}</MenuAction></MoreMenu>}
      <ActionButton aria-expanded={showBody} onClick={() => setOpen(!showBody)}>{showBody ? "Hide" : "View"}</ActionButton>
      {item.state === "failed" && <ActionButton variant="default" disabled={busy} onClick={() => void act(item.result?.retryable ? item.attempt!.action : undefined)}>{item.result?.retryable ? "Retry" : "Check outcome"}</ActionButton>}
    </div>
  </div>;
  const details = <>
    <div className="iac-header">
      {reply ? <div className="iac-muted iac-recipient-line">To {reply.to.join(", ")} · {reply.subject}
        {reply.cc.length > 0 && <div>Cc {reply.cc.join(", ")}</div>}{reply.bcc.length > 0 && <div>Bcc {reply.bcc.join(", ")}</div>}
      </div> : <span className="iac-question">{title(item)}</span>}
      {(ready || pending) && utilities}
    </div>
    {reply ? <>
      <details className="iac-original"><summary><span>{displayName(reply.original.from)}{reply.original.date ? `, ${reply.original.date}` : ""}: “{reply.original.body.replace(/\s+/g, " ").slice(0, 160)}”</span></summary>
        <div className="iac-email">{reply.original.body}</div>
      </details>
      <textarea ref={editor} aria-label="Draft" value={draft} readOnly={!ready || busy} spellCheck maxLength={40000} rows={1}
        onChange={(event) => { text.current = event.target.value; dirty.current = true; setDraft(event.target.value); }}
        onBlur={() => void flush().catch(() => {})} />
      {ready && !saveError && (saving || dirty.current) && <span className="iac-save" role="status">Saving…</span>}
    </> : <p className="iac-consequence">{item.content.type === "decide" && item.content.consequence}</p>}
    {!done && controls}
  </>;
  if (logEntry) {
    const failed = item.state === "failed";
    const retryable = failed && !!item.result?.retryable;
    const later = item.state === "succeeded" && item.attempt?.action === "later";
    const quiet = item.state === "succeeded" && !later;
    const heading = reply ? `Reply to ${displayName(reply.to[0]!)}: ${reply.subject}` : title(item);
    const openThread = () => navigate.toThread(threadId);
    const toggleCard = <MenuAction onSelect={() => setViewResult(!viewResult)}>{viewResult ? "Hide card" : "View card"}</MenuAction>;
    // Log actions are icon-only squares; the tooltip and accessible name carry the full label.
    const button = (label: string, glyph: ActionGlyph, onClick: () => void, variant: "default" | "outline", isDisabled = busy, pendingText?: string) =>
      <IconButton label={pendingText ?? label} variant={variant} disabled={isDisabled || !!pendingText} aria-busy={pendingText ? true : undefined} onClick={onClick}><ActionGlyphIcon name={glyph} /></IconButton>;
    const choice = (action: "yes" | "no") => {
      const label = actionLabel(item, action);
      const verb = label.trim().split(/\s+/)[0]!.toLowerCase();
      const glyph = action === "yes" ? ({ merge: "merge", archive: "archive", send: "send" } as Record<string, ActionGlyph>)[verb] ?? "yes" : "no";
      return button(label, glyph, () => void (later ? choose(action) : act(action)), action === "yes" ? "default" : "outline", disabled, pending && item.attempt?.action === action ? pendingLabel(item, action) : undefined);
    };
    // A Later card reopens before taking its secondary choice, as if Resume came first.
    const choose = async (action: Action) => {
      if (later) { await reopen(); if (current.current?.state !== "ready") return; }
      await act(action);
    };
    // Every row shares one action grid: Review and ⋯, then secondary and primary squares; primary is always rightmost.
    let menu: ReactNode, review: ReactNode = null, secondary: ReactNode = null, primary: ReactNode = null;
    if (!quiet) review = <IconButton label={viewResult ? (reply ? "Hide draft" : "Hide card") : "Review"} aria-expanded={viewResult} disabled={loadError} onClick={() => setViewResult(!viewResult)}><ViewIcon /></IconButton>;
    const askForChangesButton = button("Ask for changes", "comment", () => void askForChanges(), "outline", disabled);
    if (quiet) {
      menu = <>{toggleCard}<MenuAction onSelect={openThread}>Open thread</MenuAction>{deferred && <MenuAction onSelect={() => void reopen()}>Resume</MenuAction>}</>;
      secondary = <span className="iac-log-status iac-log-result" title={item.result?.message}>{item.result?.message ?? "Done"}</span>;
    } else if (later) {
      menu = <MenuAction onSelect={openThread}>Open thread</MenuAction>;
      secondary = reply ? askForChangesButton : choice("no");
      primary = button("Resume", "resume", () => void reopen(), "default");
    } else if (failed) {
      menu = <MenuAction onSelect={openThread}>Open thread</MenuAction>;
      secondary = retryable && button(reply ? "Edit draft" : "Choose again", reply ? "edit" : "undo", () => void reopen(), "outline");
      primary = retryable ? button("Retry", "retry", () => void act(item.attempt!.action), "default") : button("Open thread", "open", openThread, "default", false);
    } else {
      menu = <>{pending ? <MenuAction onSelect={() => void act()}>Resend request</MenuAction>
        : <>{reply && <MenuAction onSelect={() => void act("save-draft")}>Save to Gmail drafts</MenuAction>}<MenuAction onSelect={() => void act("later")}>Remind me later</MenuAction><MenuAction onSelect={() => void act("skip")}>Skip</MenuAction></>}
        <MenuAction onSelect={openThread}>Open thread</MenuAction></>;
      secondary = reply ? askForChangesButton : choice("no");
      primary = reply ? button("Send", "send", () => void act("send"), "default", disabled, pending && item.attempt?.action === "send" ? pendingLabel(item, "send") : undefined) : choice("yes");
    }
    return <article className={quiet ? "iac-log-row iac-log-quiet" : later ? "iac-log-row iac-log-later" : "iac-log-row"} aria-label={`${reply ? "Reply" : "Decision"}: ${heading}`}>
      <span className="iac-log-kind" role="img" aria-label={reply ? "Reply" : "Decision"} title={reply ? "Reply" : "Decision"}>{reply ? <MailIcon /> : <SignpostIcon />}</span>
      <div className="iac-log-main">
        <span className="iac-log-title" title={heading}>{heading}</span>
        <span className="iac-log-meta">
          {later && <span>Later</span>}
          {failed && <span className="iac-failed" title={item.result?.message}><span role="img" aria-label="Failed">⚠</span> {item.result?.message}</span>}
          {logEntry.showThread && <a className="iac-log-thread" href={logEntry.threadProjectId ? `/projects/${encodeURIComponent(logEntry.threadProjectId)}/threads/${encodeURIComponent(threadId)}` : undefined} onClick={(event) => { event.preventDefault(); openThread(); }}>{logEntry.threadTitle}</a>}
          <time dateTime={item.updatedAt} title={new Date(item.updatedAt).toLocaleString()}>{shortTime(item.updatedAt)}</time>
          {item.attempt?.note && <span title={item.attempt.note}>“{item.attempt.note}”</span>}
        </span>
      </div>
      <div className="iac-log-actions">
        {review && <span className="iac-log-review">{review}</span>}
        <span className="iac-log-menu"><MoreMenu disabled={busy || loadError}>{menu}</MoreMenu></span>
        {secondary && <span className="iac-log-secondary">{secondary}</span>}
        {primary && <span className="iac-log-primary">{primary}</span>}
      </div>
      {viewResult && <div className="iac-log-draft">
        {reply ? <>
          {(reply.cc.length > 0 || reply.bcc.length > 0) && <p className="iac-muted">{[reply.cc.length && `Cc ${reply.cc.join(", ")}`, reply.bcc.length && `Bcc ${reply.bcc.join(", ")}`].filter(Boolean).join(" · ")}</p>}
          <textarea ref={editor} aria-label="Draft" value={draft} readOnly={!ready || busy} rows={1} maxLength={40000}
            onChange={(event) => { text.current = event.target.value; dirty.current = true; setDraft(event.target.value); }} onBlur={() => void flush().catch(() => {})} />
          {ready && !saveError && (saving || dirty.current) && <span className="iac-save" role="status">Saving…</span>}
        </> : <p className="iac-muted">{item.content.type === "decide" && item.content.consequence}</p>}
        {done && item.result && <p className="iac-muted">{item.result.message}</p>}
      </div>}
      {failure}
    </article>;
  }
  return <article className={row ? "iac-row" : "iac-card"} aria-label={`${reply ? "Reply" : "Decision"}: ${title(item)}`}>
    {done ? result : row ? <div className="iac-row-line">
      <div className="iac-row-description"><span>{reply ? `${displayName(reply.to[0]!)} · ${reply.subject}` : title(item)}</span>
        {!reply && <p className="iac-consequence">{item.content.type === "decide" && item.content.consequence}</p>}
      </div>
      {reply ? <ActionButton disabled={busy || loadError} aria-expanded={expanded} onClick={() => onExpand?.(!expanded)}>{expanded ? "Close" : "Review"} <span aria-hidden="true">{expanded ? "▴" : "▾"}</span></ActionButton> : controls}
    </div> : null}
    {showBody && <div className={row ? "iac-row-expanded" : "iac-body"}>{details}</div>}
    {failure}
  </article>;
}

function shortTime(value: string): string {
  const date = new Date(value);
  return date.toDateString() === new Date().toDateString()
    ? date.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })
    : date.toLocaleDateString([], { month: "short", day: "numeric" });
}
function displayName(value: string): string { return value.replace(/\s*<[^>]+>/, "").trim() || value; }
function resultLabel(item: Item): string {
  if (item.result?.message === "Sent" && item.content.type === "reply") return `Sent to ${item.content.to.map(displayName).join(", ")}`;
  return item.result?.message ?? "Completed";
}

function ActionTable({ id, threadId }: { id: string; threadId: string }) {
  const rpc = useRpc<typeof rpcContract>();
  const composer = useComposer();
  const composerView = useComposerView();
  const view = useRef(composerView); view.current = composerView;
  const [table, setTable] = useState<TableView | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [bulkAttempts, setBulkAttempts] = useState<string[]>([]);
  const [open, setOpen] = useState<string | null>(null);
  const lock = useRef(false);
  const load = useCallback(async () => {
    try { setTable(await rpc.call("table", { id, threadId })); setError(null); }
    catch (err) { setError(readableError(err)); }
  }, [rpc, id, threadId]);
  useEffect(() => { void load(); }, [load]);
  const updateItem = useCallback((next: Item) => setTable((value) => {
    if (!value || value.items.find((item) => item.id === next.id)?.revision === next.revision) return value;
    return { ...value, items: value.items.map((item) => item.id === next.id ? next : item) };
  }), []);
  const bulk = async () => {
    if (!table || lock.current || submitting.has(threadId)) return;
    lock.current = true; submitting.add(threadId); setBusy(true); setError(null);
    try {
      const checkComposer = () => {
        if (composer.scope.kind !== "thread" || composer.scope.threadId !== threadId) throw new Error("Open this table in its original thread to respond.");
        if (composer.text.trim() || view.current.draft.attachmentCount || view.current.run.isSubmitting) throw new Error("Send or clear your current composer message first, then try again.");
      };
      checkComposer();
      const items = await rpc.call("prepareTable", { id, threadId, items: table.items.filter((item) => item.state === "ready").map(({ id, revision }) => ({ id, revision })) });
      setBulkAttempts(items.map((item) => item.attempt!.id));
      items.forEach(updateItem);
      checkComposer();
      composer.setText(`${actionLabel(items[0]!, "yes")} `);
      items.forEach((item, index) => {
        if (index) composer.updateText((value) => `${value}, `);
        insertActionMention(composer, item);
      });
      const submittedText = composer.text;
      await composer.experimental_submit({ experimental_data: { tableId: id } });
      if (composer.text === submittedText) throw new Error("The request was not submitted. Send the prepared composer message, or resend each pending row.");
    } catch (err) { setError(readableError(err)); }
    finally { lock.current = false; submitting.delete(threadId); setBusy(false); }
  };
  if (!table) return <div className="iac-card" role="status">{error ?? "Loading actions…"}{error && <ActionButton onClick={() => void load()}>Retry</ActionButton>}</div>;
  const label = bulkLabel(table.items);
  const bulkPending = table.items.some((item) => item.state === "pending" && bulkAttempts.includes(item.attempt!.id));
  return <section className="iac-table" aria-label={table.title}>
    <div className="iac-table-header"><span>{table.title}</span>{label && <PendingButton pending={busy || bulkPending} pendingLabel={pendingLabel(table.items[0]!, "yes")} disabled={!table.items.some((item) => item.state === "ready")} onClick={() => void bulk()}>{label}</PendingButton>}</div>
    {error && <div className="iac-error" role="alert">{error}</div>}
    {table.items.map((item) => <ActionCard key={item.id} id={item.id} threadId={threadId} initialItem={item} row expanded={open === item.id} onExpand={(expanded) => setOpen((value) => expanded ? item.id : value === item.id ? null : value)} onItem={updateItem} />)}
  </section>;
}
export function ActionDirective({ attributes, message }: PluginMessageDirectiveProps) {
  const parsed = idSchema.safeParse(attributes.id);
  if (!parsed.success) return <div className="iac-card iac-error" role="alert">This card has an invalid item ID. Ask the agent to recreate its link.</div>;
  return <ActionCard key={`${message.threadId}:${parsed.data}`} id={parsed.data} threadId={message.threadId} />;
}
export function ActionsDirective({ attributes, message }: PluginMessageDirectiveProps) {
  const parsed = idSchema.safeParse(attributes.id);
  if (!parsed.success) return <div className="iac-card iac-error" role="alert">This table has an invalid ID. Ask the agent to recreate its link.</div>;
  return <ActionTable key={`${message.threadId}:${parsed.data}`} id={parsed.data} threadId={message.threadId} />;
}
const DONE_PREVIEW = 5;
// The sidebar page lists every thread; a thread panel lists only its own thread.
export function ActionLogView({ threadId }: { threadId?: string }) {
  const rpc = useRpc<typeof rpcContract>();
  const navigate = useBbNavigate();
  const [log, setLog] = useState<ActionLog | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showAllDone, setShowAllDone] = useState(false);
  const request = useRef(0);
  const load = useCallback(async () => {
    const version = ++request.current;
    try {
      const next = await rpc.call("log", threadId ? { threadId } : {});
      if (version === request.current) { setLog(next); setError(null); }
    } catch (err) { if (version === request.current) setError(readableError(err)); }
  }, [rpc, threadId]);
  useEffect(() => {
    setLog(null); void load();
    const timer = setInterval(() => void load(), 4000);
    return () => { request.current++; clearInterval(timer); };
  }, [load]);
  useRealtime("items", () => void load());
  const row = (item: ActionLog["waiting"][number]) => <ActionCard key={`${item.threadId}:${item.id}`} id={item.id} threadId={item.threadId} initialItem={item}
    logEntry={{ threadTitle: item.threadTitle, threadProjectId: item.threadProjectId, showThread: !threadId }} onItem={() => void load()} />;
  return <section className="iac-log" aria-label="Action log">
    <section className="iac-log-group" aria-label="Waiting on you">
      <header className="iac-log-heading">
        <h2><span className="iac-log-mark" aria-hidden="true"><span className="iac-log-dot" /></span>Waiting on you{log && <span className="iac-log-count">{log.waiting.length}</span>}</h2>
        {threadId && <a className="iac-log-see-all" href="/plugins/inline-action-cards/log" onClick={(event) => { event.preventDefault(); navigate.toPluginPanel("log"); }}>See all</a>}
      </header>
      {error && <div className="iac-error" role="alert">{error}<ActionButton onClick={() => void load()}>Retry</ActionButton></div>}
      {!log && !error && <p className="iac-log-empty" role="status">Loading…</p>}
      {log && !log.waiting.length && <p className="iac-log-empty">Nothing is waiting on you.</p>}
      {log?.waiting.map(row)}
    </section>
    {log && log.done.length > 0 && <section className="iac-log-group iac-log-done" aria-label="Done">
      <header className="iac-log-heading"><h2><span className="iac-log-mark" aria-hidden="true"><svg className="iac-log-check" viewBox="0 0 24 24"><path d="M5 12.5l4.5 4.5L19 7.5" /></svg></span>Done<span className="iac-log-count">{log.done.length}</span></h2></header>
      {(showAllDone ? log.done : log.done.slice(0, DONE_PREVIEW)).map(row)}
      {log.done.length > DONE_PREVIEW && <ActionButton className="iac-log-more" aria-expanded={showAllDone} onClick={() => setShowAllDone(!showAllDone)}>{showAllDone ? "Show fewer" : `Show all ${log.done.length}`}</ActionButton>}
    </section>}
  </section>;
}
export default definePluginApp((app) => {
  app.slots.navPanel({ id: "log", path: "log", title: "Action log", icon: "inline-action-cards/action-log", component: () => <ActionLogView /> });
  app.slots.threadPanelAction({ id: "log", title: "Action log", icon: "inline-action-cards/action-log", component: ({ threadId }) => <ActionLogView threadId={threadId} /> });
  // Skip-forward has no built-in host glyph; publish it through the SDK registry.
  app.experimental_icons.register({ name: "inline-action-cards/skip-forward", component: ({ className }) =>
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m5 4 11 8-11 8V4ZM19 4v16" /></svg> });
  app.slots.messageDirective({ id: "action", component: ActionDirective });
  app.slots.messageDirective({ id: "actions", component: ActionsDirective });
});
