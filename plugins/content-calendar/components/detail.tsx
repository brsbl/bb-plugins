import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { useBbNavigate } from "@get-bb/plugin-sdk/app";
import { LIMITS, STAGE_LABELS, TRAY_LABELS, todayInCalendar, type Attachment, type Format, type Gate, type Item, type Tray } from "../model.js";
import type { GateInput, UpdateInput } from "../contract.js";
import { isDate, isRejected, parsePullRequest, scheduledBefore, shortDate } from "../calendar-layout.js";
import { readableError, useCalendarRpc, useDeferredDelete, useLiveReload, type When } from "./data.js";
import { FormatSelect, MoveTo } from "./board.js";
import { Popover, usePopover } from "./popover.js";
import { useToasts } from "./toasts.js";
import { FilePicker } from "./file-picker.js";

type FileState = "available" | "missing" | "offline";
type Machines = { id: string; name: string; connected: boolean }[];

/**
 * Edits a field locally and saves it on blur or Enter. The value at focus is
 * remembered, and blur commits only when the draft differs from it, so an
 * outside update that lands while the field is focused is never written back.
 */
export function useDraft(value: string) {
  const [draft, setDraft] = useState(value);
  const base = useRef<string | null>(null);
  const latest = useRef(value); latest.current = value;
  useEffect(() => { if (base.current === null) setDraft(value); }, [value]);
  return {
    draft,
    setDraft,
    onFocus: () => { if (base.current === null) base.current = draft; },
    /** Ends the edit: the draft when she changed it, otherwise null (and the field shows the latest value). */
    finish: (): string | null => {
      const start = base.current ?? latest.current;
      base.current = null;
      if (draft === start) { setDraft(latest.current); return null; }
      return draft;
    },
    reset: () => { base.current = null; setDraft(latest.current); },
  };
}

/**
 * One item's detail: every field saves on change, with no Save button. Shown
 * beside the grid on the page and in the thread side panel from an inline calendar.
 */
export function ItemDetail({ itemId, onClose, onItem, onDelete }: {
  itemId: string; onClose?: () => void; onItem?: (item: Item) => void; onDelete?: (item: Item) => void;
}) {
  const rpc = useCalendarRpc();
  const navigate = useBbNavigate();
  const toasts = useToasts();
  const [item, setItem] = useState<Item | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [state, setState] = useState<"open" | "hidden" | "deleted">("open");
  const onItemRef = useRef(onItem); onItemRef.current = onItem;
  const version = useRef(0);
  const load = useCallback(async () => {
    const current = ++version.current;
    try {
      const next = await rpc.call("show", { id: itemId });
      if (current === version.current) { setItem(next); setLoadError(null); }
    } catch (err) { if (current === version.current) setLoadError(readableError(err)); }
  }, [rpc, itemId]);
  useEffect(() => { setItem(null); setLoadError(null); setError(null); setState("open"); void load(); }, [load]);
  useLiveReload(() => void load());

  const adopt = useCallback((next: Item) => { setItem(next); onItemRef.current?.(next); }, []);
  const act = useCallback(async (run: () => Promise<Item>, optimistic?: Partial<Item>) => {
    if (optimistic) setItem((current) => current && { ...current, ...optimistic });
    setError(null);
    try { adopt(await run()); } catch (err) { setError(readableError(err)); void load(); }
  }, [adopt, load]);
  const update = (input: Omit<UpdateInput, "id">, optimistic?: Partial<Item>) => act(() => rpc.call("update", { id: itemId, ...input }), optimistic);
  const move = (when: When) => act(() => rpc.call("move", { id: itemId, when }), "date" in when ? { date: when.date, tray: null } : { tray: when.tray, date: null });

  const deferDelete = useDeferredDelete();
  const remove = (target: Item) => {
    if (onDelete) { onDelete(target); return; }
    deferDelete(target, { hide: () => setState("hidden"), restore: () => setState("open"), deleted: () => setState("deleted"), error: setError });
  };

  if (state === "deleted") return <div className="cc-detail cc-detail-empty"><p>This item was deleted.</p></div>;
  if (state === "hidden") return <div className="cc-detail cc-detail-empty"><p>Deleted. Undo is in the message below.</p></div>;
  if (!item) return <div className="cc-detail cc-detail-empty" role="status">
    {loadError ? <><p className="cc-error">{loadError}</p><button type="button" className="cc-button" onClick={() => void load()}>Retry</button></> : <p className="cc-muted">Loading…</p>}
  </div>;
  return <DetailBody key={item.id} item={item} error={error} onDismissError={() => setError(null)} onClose={onClose} update={update} move={move} act={act} remove={remove}
    openAttachment={async (attachment) => {
      if (attachment.kind === "thread") { navigate.toThread(attachment.threadId); return; }
      try {
        const result = await rpc.call("openAttachment", { id: item.id, attachmentId: attachment.id });
        if (result.opened === "moss") toasts.show({ message: "Opened in Moss" });
        else if (result.opened === "preview") {
          if (!navigate.experimental_openFilePreview({ target: { kind: "host", hostId: result.hostId, path: result.path }, location: null })) {
            toasts.show({ message: "bb can't preview this file here. Open it from a thread.", tone: "error" });
          }
        } else if (!navigate.openUrl(result.url)) window.open(result.url, "_blank", "noopener,noreferrer");
      } catch (err) { toasts.show({ message: readableError(err), tone: "error" }); }
    }} />;
}

function DetailBody({ item, error, onDismissError, onClose, update, move, act, remove, openAttachment }: {
  item: Item; error: string | null; onDismissError: () => void; onClose?: () => void;
  update: (input: Omit<UpdateInput, "id">, optimistic?: Partial<Item>) => Promise<void>;
  move: (when: When) => Promise<void>;
  act: (run: () => Promise<Item>, optimistic?: Partial<Item>) => Promise<void>;
  remove: (item: Item) => void;
  openAttachment: (attachment: Attachment) => Promise<void>;
}) {
  const rpc = useCalendarRpc();
  const title = useDraft(item.title);
  const target = useDraft(item.target ?? "");
  const notes = useDraft(item.notes);
  const date = useDraft(item.date ?? "");
  const menu = usePopover<"menu" | "move">();
  const posted = item.status === "posted";
  const id = item.id;
  const commitTitle = () => {
    const edited = title.finish();
    if (edited === null) return;
    const value = edited.trim();
    if (!value) { title.setDraft(item.title); return; }
    if (value !== item.title) void update({ title: value }, { title: value });
  };
  const commitTarget = () => {
    const edited = target.finish();
    if (edited === null) return;
    const value = edited.trim();
    if (value !== (item.target ?? "")) void update({ target: value || null }, { target: value || null });
  };
  const commitNotes = () => {
    const edited = notes.finish();
    if (edited !== null && edited !== item.notes) void update({ notes: edited }, { notes: edited });
  };
  // The date saves on blur or Enter, so typing it digit by digit moves the item once.
  const commitDate = () => {
    const edited = date.finish();
    if (edited === null) return;
    if (!isDate(edited)) { date.setDraft(item.date ?? ""); return; }
    if (edited !== item.date) void move({ date: edited });
  };
  const rejected = isRejected(item);
  const whenMode = item.tray ?? "date";
  const before = scheduledBefore(item);

  return <article className="cc-detail" aria-label={`Item: ${item.title}`}>
    <div className="cc-detail-head">
      <input type="checkbox" className="cc-check cc-check-large" aria-label="Posted" checked={posted}
        onChange={(event) => void update({ status: event.target.checked ? "posted" : "ready" }, { status: event.target.checked ? "posted" : "ready" })} />
      <input className="cc-title-input" aria-label="Title" value={title.draft} maxLength={LIMITS.title}
        onFocus={title.onFocus} onChange={(event) => title.setDraft(event.target.value)} onBlur={commitTitle}
        onKeyDown={(event) => {
          if (event.key === "Enter") event.currentTarget.blur();
          if (event.key === "Escape") title.reset();
        }} />
      <button type="button" className="cc-icon-button" aria-label="More" aria-haspopup="menu" aria-expanded={menu.open?.kind === "menu"} onClick={(event) => menu.toggle("menu", event.currentTarget)}>⋯</button>
      {onClose && <button type="button" className="cc-icon-button" aria-label="Close" onClick={onClose}>×</button>}
    </div>
    {menu.open && <Popover anchor={menu.open.anchor} onClose={menu.close} align="end" width={menu.open.kind === "move" ? 260 : 190} label={menu.open.kind === "move" ? `Move ${item.title}` : `Actions for ${item.title}`}
      role={menu.open.kind === "menu" ? "menu" : "dialog"}>
      {menu.open.kind === "menu" ? <div className="cc-menu">
        <button type="button" role="menuitem" onClick={() => menu.show("move", menu.open!.anchor)}>Move to…</button>
        <button type="button" role="menuitem" className="cc-danger" onClick={() => { menu.close(); remove(item); }}>Delete</button>
      </div> : <MoveTo item={item} onMove={(when) => { menu.close(); void move(when); }} />}
    </Popover>}
    {item.conflict && <div className="cc-notice cc-notice-warn" role="alert">
      <span>{item.conflict.message || `Changed in Google Calendar; your ${item.conflict.fields.join(", ")} change wasn't applied`}</span>
      <button type="button" className="cc-button" onClick={() => void act(() => rpc.call("reapply", { id }))}>Reapply</button>
    </div>}
    {item.notice && (rejected
      ? <p className="cc-notice cc-notice-error" role="alert">{item.notice}</p>
      : <p className="cc-notice">{item.notice}</p>)}
    {error && <p className="cc-error" role="alert">{error} <button type="button" className="cc-link" onClick={onDismissError}>Dismiss</button></p>}
    <div className="cc-rows">
      <div className="cc-field">
        <label htmlFor={`cc-format-${id}`}>Format</label>
        <span className="cc-field-value"><i className={`cc-swatch cc-f-${item.format ?? "none"}`} aria-hidden="true" />
          <FormatSelect id={`cc-format-${id}`} value={item.format} onChange={(format: Format | null) => void update({ format }, { format })} /></span>
      </div>
      {!posted && <div className="cc-field">
        <span className="cc-label" id={`cc-stage-${id}`}>Stage</span>
        <span className="cc-seg" role="radiogroup" aria-labelledby={`cc-stage-${id}`}>
          {(["idea", "drafting", "ready"] as const).map((stage) => <label key={stage} className={item.status === stage ? "cc-seg-on" : undefined}>
            <input type="radio" name={`cc-stage-${id}`} checked={item.status === stage} onChange={() => void update({ status: stage }, { status: stage })} />
            <span>{STAGE_LABELS[stage]}</span>
          </label>)}
        </span>
      </div>}
      <div className="cc-field">
        <label htmlFor={`cc-when-${id}`}>When</label>
        <span className="cc-field-value">
          <select id={`cc-when-${id}`} className="cc-input" value={whenMode} onChange={(event) => {
            const value = event.target.value;
            void move(value === "date" ? { date: todayInCalendar() } : { tray: value as Tray });
          }}>
            <option value="date">On a date</option>
            <option value="evergreen">{TRAY_LABELS.evergreen}</option>
            <option value="later">{TRAY_LABELS.later}</option>
          </select>
          {item.date && <input type="date" className="cc-input" aria-label="Date" value={date.draft}
            onFocus={date.onFocus} onChange={(event) => date.setDraft(event.target.value)} onBlur={commitDate}
            onKeyDown={(event) => { if (event.key === "Enter") { event.preventDefault(); event.currentTarget.blur(); } if (event.key === "Escape") date.reset(); }} />}
          {item.days > 1 && <span className="cc-muted">{item.days} days</span>}
        </span>
      </div>
      {item.time !== null && <div className="cc-field">
        <label htmlFor={`cc-time-${id}`}>Time</label>
        <span className="cc-field-value">
          <input id={`cc-time-${id}`} type="time" className="cc-input" value={item.time} onChange={(event) => { if (event.target.value) void update({ time: event.target.value }, { time: event.target.value }); }} />
          <button type="button" className="cc-text-button" onClick={() => void update({ time: null }, { time: null })}>All day</button>
        </span>
      </div>}
      <div className="cc-field">
        <label htmlFor={`cc-target-${id}`}>Target</label>
        <input id={`cc-target-${id}`} className="cc-input" value={target.draft} maxLength={LIMITS.target} placeholder="Add a target"
          onFocus={target.onFocus} onChange={(event) => target.setDraft(event.target.value)} onBlur={commitTarget}
          onKeyDown={(event) => { if (event.key === "Enter") event.currentTarget.blur(); }} />
      </div>
    </div>
    <WaitsOn item={item} before={before} act={act} />
    <Attachments item={item} act={act} open={openAttachment} />
    <section className="cc-section">
      <h3><label htmlFor={`cc-notes-${id}`}>Notes</label></h3>
      <textarea id={`cc-notes-${id}`} className="cc-input cc-notes" value={notes.draft} maxLength={LIMITS.notes}
        onFocus={notes.onFocus} onChange={(event) => notes.setDraft(event.target.value)} onBlur={commitNotes} />
    </section>
    <footer className="cc-detail-foot">
      {rejected ? <span className="cc-foot-error"><i className="cc-dot cc-dot-error" aria-hidden="true" />Not saved to Google Calendar</span>
        : item.sync === "queued" ? <span><i className="cc-dot cc-dot-warn" aria-hidden="true" />Not synced yet</span>
        : item.sync === "conflict" ? <span><i className="cc-dot cc-dot-warn" aria-hidden="true" />Google Calendar kept its change</span>
        : <span><i className="cc-dot cc-dot-ok" aria-hidden="true" />Saved to Google Calendar</span>}
    </footer>
  </article>;
}

function Section({ title, action, children }: { title: string; action?: ReactNode; children: ReactNode }) {
  return <section className="cc-section"><h3><span>{title}</span>{action}</h3>{children}</section>;
}

function gateText(gate: Gate): string {
  if (gate.kind === "pr") return `${gate.repo} #${gate.number}`;
  if (gate.kind === "item") return gate.title ?? "Deleted item";
  return gate.text;
}

function WaitsOn({ item, before, act }: { item: Item; before: { title: string; date: string }[]; act: (run: () => Promise<Item>) => Promise<void> }) {
  const rpc = useCalendarRpc();
  const [adding, setAdding] = useState(false);
  const full = item.waitsOn.length >= LIMITS.gates;
  return <Section title="Waits on" action={!full && <button type="button" className="cc-text-button" aria-expanded={adding} onClick={() => setAdding(!adding)}>Add</button>}>
    {item.waitsOn.length === 0 && !adding && <p className="cc-empty-line">Nothing. Gates make the item dashed until they're cleared.</p>}
    {item.waitsOn.map((gate) => <div key={gate.id} className="cc-li">
      <input type="checkbox" aria-label={`Cleared: ${gateText(gate)}`} checked={gate.cleared} disabled={gate.kind === "item"}
        title={gate.kind === "item" ? "Cleared while that item is checked" : undefined}
        onChange={(event) => void act(() => rpc.call("gateClear", { id: item.id, gateId: gate.id, cleared: event.target.checked }))} />
      <span className="cc-glyph" aria-hidden="true">{gate.kind === "pr" ? "⑂" : gate.kind === "item" ? "▦" : "•"}</span>
      <span className="cc-li-name">{gate.kind === "text" && gate.url ? <a href={gate.url} target="_blank" rel="noopener noreferrer">{gate.text}</a> : gateText(gate)}</span>
      {gate.kind === "item" && gate.date && <span className="cc-li-meta">{shortDate(gate.date)}</span>}
      <span className={gate.cleared ? "cc-pill" : "cc-pill cc-pill-open"}>{gate.cleared ? "Cleared" : "Open"}</span>
      <button type="button" className="cc-icon-button cc-li-remove" aria-label={`Remove ${gateText(gate)}`} onClick={() => void act(() => rpc.call("gateRemove", { id: item.id, gateId: gate.id }))}>×</button>
    </div>)}
    {before.map((gate) => <p key={gate.title} className="cc-notice cc-notice-warn">Scheduled before {gate.title} ({shortDate(gate.date)})</p>)}
    {adding && <GateForm item={item} onAdd={async (gate) => { await act(() => rpc.call("gateAdd", { id: item.id, gate })); setAdding(false); }} onCancel={() => setAdding(false)} />}
  </Section>;
}

function GateForm({ item, onAdd, onCancel }: { item: Item; onAdd: (gate: GateInput) => Promise<void>; onCancel: () => void }) {
  const rpc = useCalendarRpc();
  const [kind, setKind] = useState<GateInput["kind"]>("pr");
  const [text, setText] = useState("");
  const [url, setUrl] = useState("");
  const [itemId, setItemId] = useState("");
  const [options, setOptions] = useState<Item[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    if (kind !== "item" || options) return;
    rpc.call("list", { limit: LIMITS.listMax }).then((result) => setOptions(result.items.filter((entry) => entry.id !== item.id)), (err: unknown) => setError(readableError(err)));
  }, [kind, options, rpc, item.id]);
  const submit = () => {
    setError(null);
    let gate: GateInput;
    if (kind === "pr") {
      const pr = parsePullRequest(text);
      if (!pr) { setError("Use owner/repo#123 or a GitHub pull request URL."); return; }
      gate = { kind: "pr", ...pr };
    } else if (kind === "item") {
      if (!itemId) { setError("Pick an item."); return; }
      gate = { kind: "item", itemId };
    } else {
      if (!text.trim()) { setError("Describe what it waits on."); return; }
      gate = { kind: "text", text: text.trim(), ...(url.trim() ? { url: url.trim() } : {}) };
    }
    void onAdd(gate);
  };
  return <form className="cc-inline-form" onSubmit={(event) => { event.preventDefault(); submit(); }}>
    <select className="cc-input" aria-label="Waits on" value={kind} onChange={(event) => { setKind(event.target.value as GateInput["kind"]); setText(""); setError(null); }}>
      <option value="pr">Pull request</option>
      <option value="item">Calendar item</option>
      <option value="text">Something else</option>
    </select>
    {kind === "pr" && <input className="cc-input" aria-label="Pull request" placeholder="owner/repo#123 or URL" value={text} onChange={(event) => setText(event.target.value)} autoFocus />}
    {kind === "item" && <select className="cc-input" aria-label="Item" value={itemId} onChange={(event) => setItemId(event.target.value)}>
      <option value="">{options ? "Choose an item" : "Loading…"}</option>
      {options?.map((entry) => <option key={entry.id} value={entry.id}>{entry.title}{entry.date ? ` · ${shortDate(entry.date)}` : entry.tray ? ` · ${TRAY_LABELS[entry.tray]}` : ""}</option>)}
    </select>}
    {kind === "text" && <>
      <input className="cc-input" aria-label="What it waits on" placeholder="Upload the social preview" maxLength={LIMITS.gateText} value={text} onChange={(event) => setText(event.target.value)} autoFocus />
      <input className="cc-input" aria-label="Link (optional)" placeholder="Link (optional)" value={url} onChange={(event) => setUrl(event.target.value)} />
    </>}
    <div className="cc-row-actions"><button type="button" className="cc-button" onClick={onCancel}>Cancel</button><button type="submit" className="cc-button cc-primary">Add</button></div>
    {error && <p className="cc-error" role="alert">{error}</p>}
  </form>;
}

type AttachMode = "file" | "url" | "pr" | "thread";
const ATTACH_LABELS: Record<AttachMode, string> = { file: "File on Mac…", url: "Link", pr: "Pull request", thread: "bb thread" };

function Attachments({ item, act, open }: { item: Item; act: (run: () => Promise<Item>) => Promise<void>; open: (attachment: Attachment) => Promise<void> }) {
  const rpc = useCalendarRpc();
  const menu = usePopover<"attach">();
  const [mode, setMode] = useState<AttachMode | null>(null);
  const [states, setStates] = useState<Record<string, FileState>>({});
  const [machines, setMachines] = useState<Machines | null>(null);
  const files = item.attachments.filter((attachment) => attachment.kind === "file");
  const fileKey = files.map((file) => file.id).join(",");
  // Availability: checked when the item opens and every 30 seconds while it stays open.
  useEffect(() => {
    if (!fileKey) return;
    let live = true;
    const check = () => rpc.call("inspectFiles", { id: item.id }).then((result) => {
      if (live) setStates(Object.fromEntries(result.files.map((file) => [file.attachmentId, file.status])));
    }, () => {});
    void check();
    const timer = setInterval(() => void check(), 30_000);
    return () => { live = false; clearInterval(timer); };
  }, [rpc, item.id, fileKey]);
  useEffect(() => {
    if (!fileKey && mode !== "file") return;
    rpc.call("machines", {}).then((result) => setMachines(result.machines), () => {});
  }, [rpc, fileKey, mode]);
  const machineName = (machineId: string) => machines?.find((machine) => machine.id === machineId)?.name ?? "Mac";
  const meta = (attachment: Attachment): string => {
    if (attachment.kind === "file") {
      const state = states[attachment.id];
      const where = /\.md$/i.test(attachment.name) && /\/Moss\//.test(attachment.path) ? `Moss · ${machineName(attachment.machineId)}` : machineName(attachment.machineId);
      return state === "missing" ? `Missing on ${machineName(attachment.machineId)}` : state === "offline" ? "Mac offline" : where;
    }
    if (attachment.kind === "url") { try { return new URL(attachment.url).hostname; } catch { return "Link"; } }
    if (attachment.kind === "pr") return "Pull request";
    return "bb thread";
  };
  const name = (attachment: Attachment): string => attachment.kind === "file" ? attachment.name
    : attachment.kind === "url" ? attachment.title || attachment.url
      : attachment.kind === "pr" ? `${attachment.repo} #${attachment.number}` : attachment.title || attachment.threadId;
  const full = item.attachments.length >= LIMITS.attachments;
  return <Section title="Attachments" action={!full && <button type="button" className="cc-text-button" aria-haspopup="menu" aria-expanded={!!menu.open} onClick={(event) => menu.toggle("attach", event.currentTarget)}>Attach</button>}>
    {menu.open && <Popover anchor={menu.open.anchor} onClose={menu.close} align="end" width={180} label="Attach" role="menu">
      <div className="cc-menu">{(Object.keys(ATTACH_LABELS) as AttachMode[]).map((kind) => <button key={kind} type="button" role="menuitem" onClick={() => { setMode(kind); menu.close(); }}>{ATTACH_LABELS[kind]}</button>)}</div>
    </Popover>}
    {item.attachments.length === 0 && !mode && <p className="cc-empty-line">Attach Moss notes, links, pull requests, or bb threads.</p>}
    {item.attachments.map((attachment) => {
      const missing = attachment.kind === "file" && states[attachment.id] === "missing";
      const offline = attachment.kind === "file" && states[attachment.id] === "offline";
      return <div key={attachment.id} className={missing ? "cc-li cc-li-missing" : "cc-li"}>
        <span className="cc-glyph" aria-hidden="true">{attachment.kind === "file" ? "▤" : attachment.kind === "url" ? "↗" : attachment.kind === "pr" ? "⑂" : "◎"}</span>
        <button type="button" className="cc-li-name cc-li-open" disabled={offline} onClick={() => void open(attachment)}>{name(attachment)}</button>
        <span className="cc-li-meta">{meta(attachment)}</span>
        <button type="button" className="cc-icon-button cc-li-remove" aria-label={`Remove ${name(attachment)}`} onClick={() => void act(() => rpc.call("detach", { id: item.id, attachmentId: attachment.id }))}>×</button>
      </div>;
    })}
    {mode === "file" && <FilePicker machines={machines} onCancel={() => setMode(null)}
      onPick={async (machineId, path) => { await act(() => rpc.call("attachFile", { id: item.id, machineId, path })); setMode(null); }} />}
    {mode && mode !== "file" && <AttachForm mode={mode} onCancel={() => setMode(null)} onAttach={async (attachment) => { await act(() => rpc.call("attach", { id: item.id, attachment })); setMode(null); }} />}
  </Section>;
}

function AttachForm({ mode, onAttach, onCancel }: {
  mode: Exclude<AttachMode, "file">; onCancel: () => void;
  onAttach: (attachment: { kind: "url"; url: string; title?: string } | { kind: "pr"; repo: string; number: number } | { kind: "thread"; threadId: string }) => Promise<void>;
}) {
  const [value, setValue] = useState("");
  const [title, setTitle] = useState("");
  const [error, setError] = useState<string | null>(null);
  const submit = () => {
    setError(null);
    const text = value.trim();
    if (mode === "url") {
      if (!/^https?:\/\/\S+$/i.test(text)) { setError("Paste an http(s) URL."); return; }
      if (text.length > LIMITS.reference) { setError(`Keep URLs to ${LIMITS.reference} characters.`); return; }
      void onAttach({ kind: "url", url: text, ...(title.trim() ? { title: title.trim() } : {}) });
    } else if (mode === "pr") {
      const pr = parsePullRequest(text);
      if (!pr) { setError("Use owner/repo#123 or a GitHub pull request URL."); return; }
      void onAttach({ kind: "pr", ...pr });
    } else {
      if (!/^thr_[A-Za-z0-9]+$/.test(text)) { setError("Thread IDs start with thr_."); return; }
      void onAttach({ kind: "thread", threadId: text });
    }
  };
  const placeholder = mode === "url" ? "https://…" : mode === "pr" ? "owner/repo#123 or URL" : "thr_…";
  return <form className="cc-inline-form" onSubmit={(event) => { event.preventDefault(); submit(); }}>
    <input className="cc-input" aria-label={ATTACH_LABELS[mode]} placeholder={placeholder} value={value} onChange={(event) => setValue(event.target.value)} autoFocus />
    {mode === "url" && <input className="cc-input" aria-label="Title (optional)" placeholder="Title (optional)" value={title} maxLength={300} onChange={(event) => setTitle(event.target.value)} />}
    <div className="cc-row-actions"><button type="button" className="cc-button" onClick={onCancel}>Cancel</button><button type="submit" className="cc-button cc-primary">Attach</button></div>
    {error && <p className="cc-error" role="alert">{error}</p>}
  </form>;
}
