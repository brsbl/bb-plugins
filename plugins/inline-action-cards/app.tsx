import { useCallback, useEffect, useLayoutEffect, useRef, useState, type ReactNode, type Ref } from "react";
import { definePluginApp, experimental_Icon as Icon, Markdown, useBbNavigate, useRealtime, useRpc, type PluginMessageDirectiveProps } from "@get-bb/plugin-sdk/app";
import type { rpcContract } from "./server.js";
import { actionLabel, idSchema, title, type Action, type FollowUp, type Item, type ItemView, type ActionLog, type TableView } from "./model.js";
import { ActionButton, IconButton, MoreMenu, MenuAction, MailIcon, SignpostIcon, ViewIcon, ActionGlyphIcon, type ActionGlyph } from "./controls.js";
import { pendingLabel, sentStatus } from "./presentation.js";
import { FollowUps, Media } from "./evidence.js";
import { Button, ClampedContext, ContextBlock, DecisionBody, DecisionCard, DecisionHeader, OptionList, Outcome, SubmitRow, type Option } from "./ui/components.js";
import { readableError, submitting } from "./submit.js";
import { ReloadFrame } from "./reload-frame.js";
import { openWaiting, WaitingBanner } from "./drawer.js";
import { markWaitingThreads } from "./sidebar-status.js";
import "./app.css";
import "./compact.css";

type CardItem = Item & Partial<Pick<ItemView, "followUps" | "threadTitle" | "threadProjectId">>;

// Where a card renders. In the timeline an unanswered card is one line pointing to Waiting on you;
// the drawer shows its form without a note, since the drawer itself names the question and thread.
export type Surface = "timeline" | "drawer";

export function ActionCard({ id, threadId, surface, initialItem, onItem, logEntry, onLoaded }: {
  id: string; threadId: string; surface?: Surface;
  initialItem?: CardItem; onItem?: (item: Item, own?: boolean) => void;
  onLoaded?: () => void;
  logEntry?: { threadTitle: string; threadProjectId: string | null; showThread: boolean };
}) {
  const navigate = useBbNavigate();
  // An ask's written answer, sent as its attempt note.
  const [note, changeNote] = useState("");
  const clearNote = () => changeNote("");
  const [followUps, setFollowUps] = useState<FollowUp[]>(initialItem?.followUps ?? []);
  const [viewResult, setViewResult] = useState(false);
  const onItemRef = useRef(onItem); onItemRef.current = onItem;
  const rpc = useRpc<typeof rpcContract>();
  const [item, setItem] = useState<Item | null>(initialItem ?? null);
  useLayoutEffect(() => { if (item) onLoaded?.(); }, [item, onLoaded]);
  const current = useRef<Item | null>(initialItem ?? null);
  const [draft, setDraft] = useState(initialItem?.content.type === "reply" ? initialItem.content.draft : "");
  const text = useRef(draft);
  const dirty = useRef(false);
  const [saving, setSaving] = useState(false);
  const [busy, setBusy] = useState(false);
  const [sending, setSending] = useState<Action | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saveError, setSaveError] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const [picked, setPicked] = useState<string | null>(null);
  const lastLoadFailed = useRef(false);
  const flight = useRef<Promise<void> | null>(null);
  const lock = useRef(false);
  const revealedAt = useRef(0);
  const alive = useRef(true);
  const adopt = useCallback((next: CardItem, own = false) => {
    const changedState = current.current?.state !== next.state;
    const { followUps: latest, threadTitle: _title, threadProjectId: _project, ...plain } = next;
    current.current = plain;
    if (alive.current) {
      setItem(plain); onItemRef.current?.(plain, own);
      if (latest) setFollowUps(latest);
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
          adopt(next, true);
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
    const [sent] = await rpc.call("dispatch", { threadId, entries: [{ kind: "action", id, attemptId: next.attempt!.id }] });
    adopt(sent!);
  };

  const act = async (action?: Action, choice?: string) => {
    if (lock.current || submitting.has(threadId)) return;
    // A collapsed row hides the email: its first Send or Save opens the draft instead, and only a visible draft goes out.
    if (unseen(action)) { revealedAt.current = Date.now(); setOpen(true); setTimeout(() => reviewTarget.current?.focus()); return; }
    // The rest of the gesture that opened it (a double-click or a held Enter) must not send.
    if ((action === "send" || action === "save-draft") && Date.now() - revealedAt.current < 500) return;
    lock.current = true; submitting.add(threadId); setBusy(true); setSending(action ?? current.current?.attempt?.action ?? null); setError(null);
    try {
      await flush();
      let next = current.current;
      if (!next) return;
      if (logEntry) {
        const updated = await rpc.call("decideFromLog", { id, threadId, revision: next.revision, ...(action ? { action } : {}) });
        adopt(updated);
        return;
      }
      if (action) {
        next = action === "choose" && choice
          ? await rpc.call("choose", { id, threadId, revision: next.revision, choice, ...(next.state === "ready" ? { note } : {}) })
          : await rpc.call("prepare", { id, threadId, revision: next.revision, action, ...(next.state === "ready" ? { note } : {}) });
        adopt(next);
      }
      // Resending a pending request keeps its attempt ID; claim refuses duplicates.
      await sendMessage(next);
    } catch (err) { setError(readableError(err)); }
    finally { lock.current = false; submitting.delete(threadId); setBusy(false); setSending(null); }
  };
  const reopen = async () => {
    if (!current.current || lock.current) return;
    lock.current = true; setBusy(true);
    try { adopt(await rpc.call("reopen", { id, threadId, revision: current.current.revision })); setError(null); clearNote(); }
    catch (err) { setError(readableError(err)); }
    finally { lock.current = false; setBusy(false); }
  };
  const reply = item?.content.type === "reply" ? item.content : null;
  const choice = item?.content.type === "choice" ? item.content : null;
  const ask = item?.content.type === "ask";
  const ready = item?.state === "ready";
  const pending = item?.state === "pending";
  const status = item && !busy ? sentStatus(item) : null;
  // Prepared and once submitted, but never claimed by the time the thread went idle: the agent never got it.
  const stalled = !!item && item.state === "pending" && !busy && !status && !item.attempt?.claimed;
  const done = item?.state === "succeeded" || item?.state === "failed" || !!status || stalled;
  const showBody = logEntry ? viewResult : !done || viewResult;
  const editor = useRef<HTMLTextAreaElement>(null);
  const reviewTarget = useRef<HTMLButtonElement>(null);
  const unseen = (action?: Action) => !!reply && !!logEntry && !showBody && (action === "send" || action === "save-draft");
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
  // Like bb's own question form: number keys pick an option and Enter submits, unless the user is typing elsewhere.
  const keys = useRef<(event: KeyboardEvent) => void>(() => {});
  useEffect(() => {
    if (surface !== "drawer") return;
    const onKey = (event: KeyboardEvent) => keys.current(event);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [surface]);
  if (!item) return <div className="iac-card" role="status">{error ?? "Loading card…"}{error && <ActionButton onClick={() => void load()}>Retry</ActionButton>}</div>;
  const disabled = busy || loadError || pending;
  const deferred = item.state === "succeeded" && ["later", "skip"].includes(item.attempt?.action ?? "");
  const setOpen = setViewResult;
  const recipients = reply && <div className="iac-muted iac-recipient-line">To {reply.to.join(", ")} · {reply.subject}
    {reply.cc.length > 0 && <div>Cc {reply.cc.join(", ")}</div>}{reply.bcc.length > 0 && <div>Bcc {reply.bcc.join(", ")}</div>}
  </div>;
  const original = reply && <details className="iac-original"><summary><span>{displayName(reply.original.from)}{reply.original.date ? `, ${reply.original.date}` : ""}: “{reply.original.body.replace(/\s+/g, " ").slice(0, 160)}”</span></summary>
    <div className="iac-email">{reply.original.body}</div>
  </details>;
  // The proposal: Action Cards design-system components (ui/), fed by this card's state.
  const value = picked;
  const formOptions: Option[] = reply ? [{ id: "send", label: "Send" }, { id: "save-draft", label: "Save to Gmail drafts" }]
    : choice ? choice.options : [{ id: "yes", label: actionLabel(item, "yes") }, { id: "no", label: actionLabel(item, "no") }];
  const suggested = choice ? choice.recommended : item.content.type === "decide" ? item.content.recommended : undefined;
  const drawer = surface === "drawer";
  const submit = () => {
    if (ask) { if (note.trim()) void act("answer"); }
    else if (value) void act(choice ? "choose" : value as Action, choice ? value : undefined);
  };
  keys.current = (event) => {
    if (!ready || busy || ask || reply || event.defaultPrevented || event.metaKey || event.ctrlKey || event.altKey) return;
    const target = event.target instanceof Element ? event.target : null;
    if (target?.closest("input:not([type=radio]), textarea, select, [contenteditable]:not([contenteditable=false])")) return;
    const digit = Number(event.key);
    if (Number.isInteger(digit) && digit >= 1 && digit <= formOptions.length) {
      event.preventDefault();
      const option = formOptions[digit - 1]!.id;
      setPicked(option);
      // Focus follows the pick, so Enter submits it rather than activating whatever had focus.
      Array.from(document.getElementsByName(fieldId)).find((input) => input instanceof HTMLInputElement && input.value === option)?.focus();
    }
    else if (event.key === "Enter" && value && !target?.closest("button, a")) { event.preventDefault(); submit(); }
  };
  const fieldId = `iac-${threadId}-${id}`;
  const heading = reply ? `Reply to ${displayName(reply.to[0]!)}: ${reply.subject}` : title(item);
  const consequence = choice ? choice.consequence : item.content.type === "decide" ? item.content.consequence : null;
  const { context, media } = item.content;
  const brief = context && <ContextBlock><Markdown content={context} /></ContextBlock>;
  const field = <DecisionBody
    about={<>
      {drawer ? consequence && <p className="ac-consequence">{consequence}</p> : <DecisionHeader question={heading} consequence={consequence} id={`${fieldId}-q`} />}
      {drawer ? context && <ClampedContext><Markdown content={context} /></ClampedContext> : brief}
      {reply && <>
        {recipients}
        {original}
        <textarea ref={editor} aria-label="Draft" className="ac-textarea" value={draft} readOnly={!ready || busy} spellCheck maxLength={40000} rows={4}
          onChange={(event) => { text.current = event.target.value; dirty.current = true; setDraft(event.target.value); }}
          onBlur={() => void flush().catch(() => {})} />
        {ready && !saveError && (saving || dirty.current) && <span className="ac-meta" role="status">Saving…</span>}
      </>}
      <Media media={media} threadId={threadId} />
      <FollowUps items={followUps} />
    </>}
    answer={ask
      ? <textarea className="ac-textarea" aria-label="Your answer" placeholder="Your answer" value={note} readOnly={!ready || busy} rows={2} maxLength={1000} onChange={(event) => changeNote(event.target.value)}
        onKeyDown={(event) => { if (event.key === "Enter" && !event.shiftKey && !event.nativeEvent.isComposing) { event.preventDefault(); submit(); } }} />
      : <OptionList name={fieldId} label={heading} options={formOptions} value={value} recommended={suggested} disabled={!ready || busy} onChange={setPicked} shortcuts={drawer} />} />;
  const failure = error && <div className="iac-error" role="alert">{error}<div className="iac-actions">
    {loadError && <ActionButton onClick={() => void load()}>Retry loading</ActionButton>}
    {saveError && <><ActionButton onClick={() => void flush().catch(() => {})}>Retry save</ActionButton><ActionButton onClick={() => void load(true)}>Load saved draft</ActionButton></>}
  </div></div>;
  const time = status ? status.time : item.updatedAt;
  const chosen = item.attempt ? item.attempt.choice?.label ?? actionLabel(item, item.attempt.action) : null;
  const where = stalled ? "Not sent: it didn't reach the agent." : item.state === "failed" ? item.result?.message ?? "Failed." : item.state === "succeeded" ? resultLabel(item) : status ? "Sent. Waiting for the agent." : "";
  const tone = stalled ? "unsent" : item.state === "failed" ? "failed" : item.state === "succeeded" ? "done" : "sent";
  const result = <DecisionBody about={<div className="ac-question">{heading}</div>} answer={<Outcome tone={tone} answer={chosen ?? ""} note={item.attempt?.note} status={where} time={new Date(time).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}
      actions={(stalled || item.state === "failed" || deferred) ? <>
        {(deferred || (item.state === "failed" && item.result?.retryable)) && <Button type="button" size="sm" variant="outline" disabled={busy} onClick={() => void reopen()}>{deferred ? "Resume" : reply ? "Edit draft" : "Choose again"}</Button>}
        {stalled && <Button type="button" size="sm" variant="default" disabled={busy} onClick={() => void act()}>Resend</Button>}
        {item.state === "failed" && <Button ref={reviewTarget} type="button" size="sm" variant="default" disabled={busy} onClick={() => void act(item.result?.retryable ? item.attempt!.action : undefined, item.attempt?.choice?.id)}>{item.result?.retryable ? unseen(item.attempt!.action) ? "Review and retry" : "Retry" : "Check outcome"}</Button>}
      </> : undefined} />} />;
  if (logEntry) {
    const failed = item.state === "failed";
    const retryable = failed && !!item.result?.retryable;
    const later = item.state === "succeeded" && item.attempt?.action === "later";
    const quiet = item.state === "succeeded" && !later;
    const heading = reply ? `Reply to ${displayName(reply.to[0]!)}: ${reply.subject}` : title(item);
    const openThread = () => navigate.toThread(threadId);
    const toggleCard = <MenuAction onSelect={() => setViewResult(!viewResult)}>{viewResult ? "Hide card" : "View card"}</MenuAction>;
    // Log actions are icon-only squares; the tooltip and accessible name carry the full label.
    const button = (label: string, glyph: ActionGlyph, onClick: () => void, variant: "default" | "outline", isDisabled = busy, pendingText?: string, ref?: Ref<HTMLButtonElement>) =>
      <IconButton ref={ref} label={pendingText ?? label} variant={variant} disabled={isDisabled || !!pendingText} aria-busy={pendingText ? true : undefined} onClick={onClick}><ActionGlyphIcon name={glyph} /></IconButton>;
    const decideButton = (action: "yes" | "no") => {
      const label = actionLabel(item, action);
      const verb = label.trim().split(/\s+/)[0]!.toLowerCase();
      const glyph = action === "yes" ? verbGlyphs.get(verb) ?? "yes" : "no";
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
    // Comments need the card's note field, so Comment opens the card's thread.
    const commentButton = button("Comment", "comment", openThread, "outline", disabled);
    // Picking an option needs the card's radio list, so Choose opens the card's thread and never offers Yes or No.
    const chooseButton = button("Choose", "open", openThread, "default", false, pending && item.attempt?.action === "choose" ? pendingLabel(item, "choose") : undefined);
    const kind = reply ? "Reply" : choice ? "Choice" : ask ? "Ask" : "Decision";
    if (quiet) {
      menu = <>{toggleCard}<MenuAction onSelect={openThread}>Open thread</MenuAction>{deferred && <MenuAction onSelect={() => void reopen()}>Resume</MenuAction>}</>;
      secondary = <span className="iac-log-status iac-log-result" title={item.result?.message}>{item.result?.message ?? "Done"}</span>;
    } else if (later) {
      menu = null;
      secondary = reply ? commentButton : choice ? null : decideButton("no");
      primary = button("Resume", "resume", () => void reopen(), "default");
    } else if (failed) {
      menu = null;
      secondary = retryable && button(reply ? "Edit draft" : "Choose again", reply ? "edit" : "undo", () => void reopen(), "outline");
      primary = choice ? chooseButton : retryable ? button(unseen(item.attempt!.action) ? "Review and retry" : "Retry", "retry", () => void act(item.attempt!.action), "default", busy, undefined, reviewTarget) : button("Open thread", "open", openThread, "default", false);
    } else {
      menu = <>{pending ? <MenuAction onSelect={() => void act()}>Resend request</MenuAction>
        : <>{reply && <MenuAction onSelect={() => void act("save-draft")}>{unseen("save-draft") ? "Review and save to Gmail drafts" : "Save to Gmail drafts"}</MenuAction>}{!ask && <MenuAction onSelect={() => void act("skip")}>Skip</MenuAction>}</>}
        <MenuAction onSelect={openThread}>Open thread</MenuAction></>;
      // An ask is answered in Waiting on you, above the prompt box.
      secondary = reply ? commentButton : choice || ask ? null : decideButton("no");
      primary = reply ? button(unseen("send") ? "Review and send" : "Send", "send", () => void act("send"), "default", disabled, pending && item.attempt?.action === "send" ? pendingLabel(item, "send") : undefined, reviewTarget)
        : choice ? chooseButton : ask ? null : decideButton("yes");
    }
    return <article className={quiet ? "iac-log-row iac-log-quiet" : later ? "iac-log-row iac-log-later" : "iac-log-row"} aria-label={`${kind}: ${heading}`}>
      <span className="iac-log-kind" role="img" aria-label={kind} title={kind}>{reply ? <MailIcon /> : <SignpostIcon />}</span>
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
        {/* A lone Open thread is its own button, never a one-item ⋯ menu; skip it when the primary already opens the thread. */}
        {menu ? <span className="iac-log-menu"><MoreMenu disabled={busy || loadError}>{menu}</MoreMenu></span>
          : !(failed && (choice || !retryable)) && <span className="iac-log-menu">{button("Open thread", "open", openThread, "outline", false)}</span>}
        {secondary && <span className="iac-log-secondary">{secondary}</span>}
        {primary && <span className="iac-log-primary">{primary}</span>}
      </div>
      {!quiet && brief && <div className="ac iac-log-brief">{brief}</div>}
      {viewResult && <div className="iac-log-draft">
        {quiet && brief && <div className="ac">{brief}</div>}
        {reply ? <>
          {recipients}
          {original}
          <textarea ref={editor} aria-label="Draft" value={draft} readOnly={!ready || busy} rows={1} maxLength={40000}
            onChange={(event) => { text.current = event.target.value; dirty.current = true; setDraft(event.target.value); }} onBlur={() => void flush().catch(() => {})} />
          {ready && !saveError && (saving || dirty.current) && <span className="iac-save" role="status">Saving…</span>}
        </> : choice ? <ul className="iac-log-options">{choice.options.map((option) => <li key={option.id}>{option.label}{option.id === choice.recommended && <span className="iac-muted"> · Recommended</span>}</li>)}</ul>
          : <p className="iac-muted">{item.content.type === "decide" && item.content.consequence}</p>}
        {done && item.result && <p className="iac-muted">{item.result.message}</p>}
      </div>}
      {failure}
    </article>;
  }
  const label = `${reply ? "Reply" : choice ? "Choice" : ask ? "Ask" : "Decision"}: ${title(item)}`;
  if (surface === "timeline" && ready) return <button type="button" className="iac-waiting-line" aria-label={`In Waiting on you: ${heading}`} onClick={() => openWaiting(threadId, id)}>
    <Icon name="CircleQuestion" className="iac-waiting-icon" aria-hidden />
    <span className="iac-waiting-where">Waiting for answer</span>
    <span className="iac-waiting-question">{heading}</span>
  </button>;
  return <DecisionCard label={label} className={drawer ? "ac-drawer" : undefined} onSubmit={submit}>
    {done ? result : <>{field}<SubmitRow disabled={disabled} canSubmit={ask ? !!note.trim() : !!value} pending={!!sending} /></>}
    {failure}
  </DecisionCard>;
}

// A Map, not an object literal, so agent-written labels such as "Constructor" cannot reach prototype keys.
const verbGlyphs = new Map<string, ActionGlyph>([["merge", "merge"], ["archive", "archive"], ["send", "send"]]);
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

export function ActionDirective({ attributes, message }: PluginMessageDirectiveProps) {
  const parsed = idSchema.safeParse(attributes.id);
  if (!parsed.success) return <div className="iac-card iac-error" role="alert">This card has an invalid item ID. Ask the agent to recreate its link.</div>;
  const key = JSON.stringify(["action", message.threadId, parsed.data]);
  return <ReloadFrame key={key} cacheKey={key}>{(onLoaded) => <ActionCard id={parsed.data} threadId={message.threadId} surface="timeline" onLoaded={onLoaded} />}</ReloadFrame>;
}
export function ActionsDirective({ attributes, message }: PluginMessageDirectiveProps) {
  const parsed = idSchema.safeParse(attributes.id);
  if (!parsed.success) return <div className="iac-card iac-error" role="alert">This table has an invalid ID. Ask the agent to recreate its link.</div>;
  const key = JSON.stringify(["actions", message.threadId, parsed.data]);
  return <ReloadFrame key={key} cacheKey={key}>{(onLoaded) => <TableLines id={parsed.data} threadId={message.threadId} onLoaded={onLoaded} />}</ReloadFrame>;
}
// A past decision sheet: each row is its own line, answered in Waiting on you or showing its result.
function TableLines({ id, threadId, onLoaded }: { id: string; threadId: string; onLoaded: () => void }) {
  const rpc = useRpc<typeof rpcContract>();
  const [table, setTable] = useState<TableView | null>(null);
  const [error, setError] = useState<string | null>(null);
  useLayoutEffect(() => { if (table) onLoaded(); }, [table, onLoaded]);
  const load = useCallback(async () => {
    try { setTable(await rpc.call("table", { id, threadId })); setError(null); } catch (err) { setError(readableError(err)); }
  }, [rpc, id, threadId]);
  useEffect(() => { void load(); }, [load]);
  if (!table) return <div className="iac-card" role="status">{error ?? "Loading decisions…"}{error && <ActionButton onClick={() => void load()}>Retry</ActionButton>}</div>;
  return <section className="iac-table-lines" aria-label={table.title}>
    {table.items.map((item) => <ActionCard key={item.id} id={item.id} threadId={threadId} surface="timeline" initialItem={item} />)}
  </section>;
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
  return <section className="iac-log" aria-label="Decision log">
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
  app.slots.navPanel({ id: "log", path: "log", title: "Decision log", icon: "inline-action-cards/action-log", component: () => <ActionLogView /> });
  app.slots.threadPanelAction({ id: "log", title: "Decision log", icon: "inline-action-cards/action-log", component: ({ threadId }) => <ActionLogView threadId={threadId} /> });
  // Skip-forward has no built-in host glyph; publish it through the SDK registry.
  app.experimental_icons.register({ name: "inline-action-cards/skip-forward", component: ({ className }) =>
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m5 4 11 8-11 8V4ZM19 4v16" /></svg> });
  app.slots.messageDirective({ id: "action", component: ActionDirective });
  app.slots.messageDirective({ id: "actions", component: ActionsDirective });
  app.composer.customize({ id: "waiting", scopes: ["thread"], banners: [{ id: "waiting", chrome: "bare", component: WaitingBanner }] });
  app.contentScripts.register({ id: "waiting-threads", mount: markWaitingThreads });
});
