import { useCallback, useEffect, useLayoutEffect, useRef, useState, type ReactNode, type Ref } from "react";
import { definePluginApp, useBbNavigate, useComposer, useComposerView, useRealtime, useRpc, type PluginMessageDirectiveProps } from "@get-bb/plugin-sdk/app";
import type { rpcContract } from "./server.js";
import { actionLabel, actionMessage, chooseLabel, idSchema, title, type Action, type FollowUp, type Item, type ActionLog } from "./model.js";
import { ActionButton, PendingButton, IconButton, MoreMenu, MenuAction, DraftIcon, EditIcon, ResendIcon, UndoIcon, MailIcon, SignpostIcon, ViewIcon, ActionGlyphIcon, type ActionGlyph } from "./controls.js";
import { appendActionNote, insertActionMention, insertCommentMention, pendingLabel, sentStatus } from "./presentation.js";
import { Consequence } from "./consequence.js";
import { AnswerBar, Evidence, FollowUps, NoteIcon } from "./evidence.js";
import { DecisionSheet, SheetRowView, type SheetBinding } from "./sheet.js";
import { readableError, submitDraft, submitting } from "./submit.js";
import "./app.css";
import "./compact.css";

export function ActionCard({ id, threadId, row = false, expanded = false, onExpand, initialItem, onItem, sheet, logEntry }: {
  id: string; threadId: string; row?: boolean; expanded?: boolean; onExpand?: (open: boolean) => void;
  initialItem?: Item & { followUps?: FollowUp[] }; onItem?: (item: Item, own?: boolean) => void;
  // A decision sheet row stages its answer and keeps its comment in the sheet.
  sheet?: SheetBinding;
  logEntry?: { threadTitle: string; threadProjectId: string | null; showThread: boolean };
}) {
  const navigate = useBbNavigate();
  const [localNote, setLocalNote] = useState("");
  const note = sheet ? sheet.note : localNote;
  const noteEditor = useRef<HTMLInputElement>(null);
  const changeNote = (value: string) => sheet ? sheet.setNote(value) : setLocalNote(value);
  const clearNote = () => changeNote("");
  const [followUps, setFollowUps] = useState<FollowUp[]>(initialItem?.followUps ?? []);
  // Set when this view watches a ready card leave with a comment: its result plays "sent with your comment".
  const [accepted, setAccepted] = useState(false);
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
  const adopt = useCallback((next: Item & { followUps?: FollowUp[] }, own = false) => {
    const changedState = current.current?.state !== next.state;
    const leftWithNote = current.current?.state === "ready" && next.state !== "ready" && !!next.attempt?.note;
    const { followUps: latest, ...plain } = next;
    current.current = plain;
    if (alive.current) {
      setItem(plain); onItemRef.current?.(plain, own);
      if (latest) setFollowUps(latest);
      if (leftWithNote) setAccepted(true);
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
    // Check again after asynchronous saves; the user may have started typing.
    if (composer.scope.kind !== "thread" || composer.scope.threadId !== threadId) throw new Error("Open this card in its original thread to respond.");
    if (composer.text.trim() || view.current.draft.attachmentCount || view.current.run.isSubmitting) throw new Error("Send or clear your current composer message first, then try the card again.");
    composer.setText(actionMessage(next));
    insertActionMention(composer, next);
    appendActionNote(composer, next);
    if (!await submitDraft(composer, { experimental_data: { itemId: id } })) throw new Error("The request was not submitted. Send the prepared composer message or clear it and retry from the card.");
    adopt(await rpc.call("submitted", { id, threadId, attemptId: next.attempt!.id }));
  };

  const act = async (action?: Action, choice?: string) => {
    if (lock.current || submitting.has(threadId)) return;
    // A collapsed row hides the email: its first Send or Save opens the draft instead, and only a visible draft goes out.
    if (unseen(action)) { revealedAt.current = Date.now(); setOpen(true); setTimeout(() => reviewTarget.current?.focus()); return; }
    // The rest of the gesture that opened it (a double-click or a held Enter) must not send.
    if ((action === "send" || action === "save-draft") && Date.now() - revealedAt.current < 500) return;
    // A sheet row stages its answer; the sheet sends every staged row together.
    if (sheet && action && current.current?.state === "ready") { sheet.stage(action, choice); return; }
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
      // Preserve composer contents before reserving an action, too.
      if (composer.text.trim() || view.current.draft.attachmentCount) throw new Error("Send or clear your current composer message first, then try the card again.");
      if (composer.scope.kind !== "thread" || composer.scope.threadId !== threadId) throw new Error("Open this card in its original thread to respond.");
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
  const comment = async () => {
    if (lock.current || submitting.has(threadId) || !note.trim()) return;
    lock.current = true; submitting.add(threadId); setBusy(true); setError(null);
    try {
      await flush();
      const next = current.current;
      if (!next) return;
      if (composer.scope.kind !== "thread" || composer.scope.threadId !== threadId) throw new Error("Open this card in its original thread to comment.");
      if (composer.text.trim() || view.current.draft.attachmentCount || view.current.run.isSubmitting) throw new Error("Send or clear your current composer message first, then try again.");
      const saved = await rpc.call("comment", { id, threadId, revision: next.revision, note });
      // Do not overwrite text entered while the comment was being saved.
      if (composer.text.trim() || view.current.draft.attachmentCount || view.current.run.isSubmitting) throw new Error("Send or clear your current composer message first, then try again.");
      composer.setText("");
      insertCommentMention(composer, saved.item, saved.commentId);
      composer.updateText((value) => `${value} ${saved.note}`);
      const submittedText = composer.text;
      await composer.experimental_submit({ experimental_data: { itemId: id } });
      if (composer.text === submittedText) throw new Error("The comment was not submitted. Send the prepared composer message.");
      clearNote();
    } catch (err) { setError(readableError(err)); }
    finally { lock.current = false; submitting.delete(threadId); setBusy(false); }
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
  const ready = item?.state === "ready";
  const pending = item?.state === "pending";
  const status = item && !busy ? sentStatus(item) : null;
  // Prepared and once submitted, but never claimed by the time the thread went idle: the agent never got it.
  const stalled = !!item && item.state === "pending" && !busy && !status && !item.attempt?.claimed && !row;
  const done = item?.state === "succeeded" || item?.state === "failed" || !!status || stalled;
  const showBody = logEntry ? viewResult : row ? expanded : !done || viewResult;
  const editor = useRef<HTMLTextAreaElement>(null);
  const reviewTarget = useRef<HTMLButtonElement>(null);
  const unseen = (action?: Action) => !!reply && (row || !!logEntry) && !showBody && (action === "send" || action === "save-draft");
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
  // Card tools sit in the top-right corner.
  const tools = (ready || pending) && (reply || (pending && !busy)) && <span className="iac-header-tools">
    {pending && !busy && <IconButton label="Resend request" onClick={() => void act()}><ResendIcon /></IconButton>}
    {reply && <IconButton label="Save to Gmail drafts" disabled={disabled} onClick={() => void act("save-draft")}><DraftIcon /></IconButton>}
  </span>;
  // The primary button marks a comment that goes along with the choice.
  const attached = ready && !!note.trim();
  const withComment = (label: string) => <>{attached && <NoteIcon className="iac-attached" />}{label}{attached && <>{" "}<span className="iac-sr-only">with comment</span></>}</>;
  // A sent or finished attempt shows its own option; a ready card keeps the user's pick or the recommendation.
  const staged = sheet?.staged;
  const selectedId = (!ready && item.attempt?.choice?.id) || (sheet ? staged?.action === "choose" ? staged.choice : undefined : picked || choice?.recommended);
  const selected = choice?.options.find((option) => option.id === selectedId);
  const primary: Action = reply ? "send" : choice ? "choose" : "yes";
  const primaryLabel = reply ? "Send" : choice ? selected ? chooseLabel(selected.label) : "Choose an option" : actionLabel(item, "yes");
  const primaryButton = <PendingButton variant="default" className={choice ? "iac-choose" : undefined} pending={sending === primary} pendingLabel={pendingLabel(item, primary)} disabled={disabled || (!!choice && !selected)} onClick={() => void act(primary, selected?.id)}>{withComment(primaryLabel)}</PendingButton>;
  const secondaryButton = !reply && !choice && <PendingButton pending={sending === "no"} pendingLabel={pendingLabel(item, "no")} disabled={disabled} onClick={() => void act("no")}>{actionLabel(item, "no")}</PendingButton>;
  // One line: comment, then the answers. A sheet row's answer is staged in its header, so its bar keeps only the comment.
  const staging = !!sheet && !reply;
  const answerBar = (ready || pending) && <AnswerBar inputRef={noteEditor} value={note} disabled={disabled} busy={busy} onChange={changeNote} onSend={() => void comment()}>
    {staging ? sheet!.staged && <ActionButton onClick={sheet!.clear}>Clear answer</ActionButton> : <>{secondaryButton}{primaryButton}</>}
  </AnswerBar>;
  const failure = error && <div className="iac-error" role="alert">{error}<div className="iac-actions">
    {loadError && <ActionButton onClick={() => void load()}>Retry loading</ActionButton>}
    {saveError && <><ActionButton onClick={() => void flush().catch(() => {})}>Retry save</ActionButton><ActionButton onClick={() => void load(true)}>Load saved draft</ActionButton></>}
  </div></div>;
  const time = status ? status.time : item.updatedAt;
  // Status, its actions and the comment stay together as one compact unit.
  const result = <div className="iac-result-line" data-accepted={accepted || undefined} data-state={item.state}>
    <div className="iac-result-head">
      <span className={item.state === "failed" || stalled ? "iac-failed" : "iac-result"} role="status">
        <span aria-hidden="true">{item.state === "failed" || stalled ? "⚠" : "✓"}</span> {stalled ? `Not sent: “${actionLabel(item, item.attempt!.action)}” didn't reach the agent` : status ? status.label : resultLabel(item)}
        {row && <span className="iac-muted"> · {title(item)}</span>}
        <time dateTime={time}> · {new Date(time).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}</time>
      </span>
      <span className="iac-actions iac-result-actions">
        {stalled && <ActionButton variant="default" disabled={busy} onClick={() => void act()}>Resend</ActionButton>}
        {status && !item.attempt?.claimed && <IconButton label="Resend request" disabled={busy} onClick={() => void act()}><ResendIcon /></IconButton>}
        {(deferred || (item.state === "failed" && item.result?.retryable)) && <IconButton label={deferred ? "Resume" : reply ? "Edit draft" : "Choose again"} disabled={busy} onClick={() => void reopen()}>{reply && !deferred ? <EditIcon /> : <UndoIcon />}</IconButton>}
        <ActionButton aria-expanded={showBody} onClick={() => setOpen(!showBody)}>{showBody ? "Hide" : "View"}</ActionButton>
        {item.state === "failed" && <ActionButton ref={reviewTarget} variant="default" disabled={busy} onClick={() => void act(item.result?.retryable ? item.attempt!.action : undefined, item.attempt?.choice?.id)}>{item.result?.retryable ? unseen(item.attempt!.action) ? "Review and retry" : "Retry" : "Check outcome"}</ActionButton>}
      </span>
    </div>
    {item.attempt?.note && <div className="iac-result-note"><NoteIcon />{item.attempt.note}</div>}
  </div>;
  const recipients = reply && <div className="iac-muted iac-recipient-line">To {reply.to.join(", ")} · {reply.subject}
    {reply.cc.length > 0 && <div>Cc {reply.cc.join(", ")}</div>}{reply.bcc.length > 0 && <div>Bcc {reply.bcc.join(", ")}</div>}
  </div>;
  const original = reply && <details className="iac-original"><summary><span>{displayName(reply.original.from)}{reply.original.date ? `, ${reply.original.date}` : ""}: “{reply.original.body.replace(/\s+/g, " ").slice(0, 160)}”</span></summary>
    <div className="iac-email">{reply.original.body}</div>
  </details>;
  // Context, follow-ups and the comment field read top to bottom before the answer.
  const discussion = <>
    <Evidence content={item.content} threadId={threadId} />
    {choice && row && choice.options.some((option) => option.hint) && <ul className="iac-hints">{choice.options.filter((option) => option.hint).map((option) => <li key={option.id}><b>{option.label}</b> {option.hint}</li>)}</ul>}
    <FollowUps items={followUps} />
  </>;
  const details = <>
    {!row && <div className="iac-header">
      {reply ? recipients : <span className="iac-question">{title(item)}</span>}
      {tools}
    </div>}
    {row && reply && recipients}
    {reply ? <>
      {original}
      <textarea ref={editor} aria-label="Draft" value={draft} readOnly={!ready || busy} spellCheck maxLength={40000} rows={1}
        onChange={(event) => { text.current = event.target.value; dirty.current = true; setDraft(event.target.value); }}
        onBlur={() => void flush().catch(() => {})} />
      {ready && !saveError && (saving || dirty.current) && <span className="iac-save" role="status">Saving…</span>}
      {discussion}
    </> : <>
      {choice ? choice.consequence && <Consequence>{choice.consequence}</Consequence> : item.content.type === "decide" && <Consequence>{item.content.consequence}</Consequence>}
      {discussion}
      {choice && !row && <div role="radiogroup" aria-label={choice.question} className="iac-options">
        {choice.options.map((option) => <label key={option.id} className="iac-option">
          <input type="radio" name={`iac-${threadId}-${id}`} value={option.id} checked={selectedId === option.id} disabled={!ready || busy} onChange={() => setPicked(option.id)} />
          <span className="iac-option-text">
            <span className="iac-option-label">{option.label}</span>
            {choice.recommended === option.id && <span className="iac-tag">Recommended</span>}
            {option.hint && <span className="iac-option-hint" title={option.hint}>{option.hint}</span>}
          </span>
        </label>)}
      </div>}
    </>}
    {!done && answerBar}
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
    const kind = reply ? "Reply" : choice ? "Choice" : "Decision";
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
        : <>{reply && <MenuAction onSelect={() => void act("save-draft")}>{unseen("save-draft") ? "Review and save to Gmail drafts" : "Save to Gmail drafts"}</MenuAction>}<MenuAction onSelect={() => void act("skip")}>Skip</MenuAction></>}
        <MenuAction onSelect={openThread}>Open thread</MenuAction></>;
      secondary = reply ? commentButton : choice ? null : decideButton("no");
      primary = reply ? button(unseen("send") ? "Review and send" : "Send", "send", () => void act("send"), "default", disabled, pending && item.attempt?.action === "send" ? pendingLabel(item, "send") : undefined, reviewTarget)
        : choice ? chooseButton : decideButton("yes");
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
      {viewResult && <div className="iac-log-draft">
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
  if (row && sheet) return <SheetRowView item={item} done={done} result={result} expanded={expanded} onExpand={(open) => onExpand?.(open)}
    sheet={sheet} disabled={disabled} followUpCount={followUps.length} failure={failure} resend={pending && !busy && !status ? () => void act() : null}
    body={<div className="iac-row-expanded">{details}</div>} />;
  return <article className="iac-card" data-compact={done && !showBody ? true : undefined} aria-label={`${reply ? "Reply" : choice ? "Choice" : "Decision"}: ${title(item)}`}>
    {done ? result : null}
    {showBody && <div className="iac-body">{details}</div>}
    {failure}
  </article>;
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
  return <div className="iac-container"><ActionCard key={`${message.threadId}:${parsed.data}`} id={parsed.data} threadId={message.threadId} /></div>;
}
export function ActionsDirective({ attributes, message }: PluginMessageDirectiveProps) {
  const parsed = idSchema.safeParse(attributes.id);
  if (!parsed.success) return <div className="iac-card iac-error" role="alert">This table has an invalid ID. Ask the agent to recreate its link.</div>;
  return <div className="iac-container"><DecisionSheet key={`${message.threadId}:${parsed.data}`} id={parsed.data} threadId={message.threadId} /></div>;
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
