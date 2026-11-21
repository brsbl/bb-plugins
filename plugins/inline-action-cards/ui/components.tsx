// Action Cards components. Presentational only: they take values and callbacks and never call RPC.
// Hierarchy, top to bottom: question → what happens → evidence → answer → note + submit → outcome.
import { Fragment, useEffect, useLayoutEffect, useRef, useState, type FormEvent, type KeyboardEvent, type ReactNode, type RefObject } from "react";
import { Button } from "../components/ui/button.js";
import { cn } from "../lib/utils.js";
import "./tokens.css";
import "./components.css";

export type Option = { id: string; label: string; hint?: string; destructive?: boolean };

/** The card surface. A single decision is a form; a group is one form holding several decisions. */
export function DecisionCard({ children, onSubmit, onKeyDown, label, className }: { children: ReactNode; onSubmit?: () => void; onKeyDown?: (event: KeyboardEvent<HTMLFormElement>) => void; label: string; className?: string }) {
  return <form className={cn("ac ac-card", className)} aria-label={label} onKeyDown={onKeyDown} onSubmit={(event: FormEvent) => { event.preventDefault(); onSubmit?.(); }}>{children}</form>;
}

/** Question first; consequence is the quiet line that says what the answer does. */
export function DecisionHeader({ question, consequence, id }: { question: string; consequence?: string | null; id?: string }) {
  return <div className="ac-header">
    <div className="ac-question" id={id}>{question}</div>
    {consequence && <p className="ac-consequence">{consequence}</p>}
  </div>;
}

/** The decision's two columns: what it is about on the left, the answer on the right. Narrow cards stack them. */
export function DecisionBody({ about, answer }: { about: ReactNode; answer: ReactNode }) {
  return <div className="ac-body"><div className="ac-about">{about}</div><div className="ac-answer">{answer}</div></div>;
}

/** Optional context: the original text on one muted line under the question, with a quiet "more" whenever any of it is hidden. */
export function ContextLine({ media, children }: { media?: boolean; children: ReactNode }) {
  const line = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [clipped, setClipped] = useState(false);
  useLayoutEffect(() => {
    const node = line.current;
    if (!node || open) return;
    // Hidden when it overflows the line in either direction, or holds images or line breaks the one-line view folds away.
    const measure = () => setClipped(!!media || node.scrollWidth > node.clientWidth + 1 || node.scrollHeight > node.clientHeight + 1
      || !!node.querySelector("img, video, picture, br"));
    measure();
    const observer = typeof ResizeObserver === "undefined" ? null : new ResizeObserver(measure);
    observer?.observe(node);
    return () => observer?.disconnect();
  }, [open, media, children]);
  return <div className="ac-context-line" data-open={open || undefined}>
    <div ref={line} className={open ? "ac-context-full" : "ac-context-summary"}>{children}</div>
    {(open || clipped) && <button type="button" className="ac-context-more" aria-expanded={open} aria-label={open ? "Show less context" : "Show all context"} onClick={() => setOpen(!open)}>{open ? "less" : "more"}</button>}
  </div>;
}

/** bb's question-form option row, with a real radio underneath for keyboard and screen readers. */
/** `selected` renders right under the picked option, outside its label so clicks in it don't re-pick. */
export function OptionList({ name, label, options, value, recommended, disabled, onChange, shortcuts, selected }: {
  name: string; label: string; options: Option[]; value: string | null; recommended?: string | null; disabled?: boolean; onChange: (id: string) => void; shortcuts?: boolean;
  selected?: ReactNode;
}) {
  return <fieldset className="ac-options" disabled={disabled}>
    <legend className="ac-sr">{label}</legend>
    {options.map((option, index) => <Fragment key={option.id}>
      <label className="ac-option" data-destructive={option.destructive || undefined}>
        <input type="radio" name={name} value={option.id} checked={value === option.id} onChange={() => onChange(option.id)} />
        <span className="ac-glyph" aria-hidden="true" />
        <span className="ac-option-text">
          <span className="ac-option-label">{option.label}{recommended === option.id && <span className="ac-tag">Recommended</span>}</span>
          {option.hint && <span className="ac-option-hint">{option.hint}</span>}
        </span>
        {shortcuts && index < 9 && <kbd className="ac-option-key" aria-hidden="true">{index + 1}</kbd>}
      </label>
      {value === option.id && selected}
    </Fragment>)}
  </fieldset>;
}

// Grows a one-line textarea to fit its text, in browsers without field-sizing support too.
function useAutoGrow(ref: RefObject<HTMLTextAreaElement | null>, value: string, active = true) {
  useLayoutEffect(() => {
    if (!active) return;
    const resize = () => {
      const node = ref.current;
      if (node) { node.style.height = "0px"; node.style.height = `${node.scrollHeight}px`; }
    };
    resize();
    window.addEventListener("resize", resize);
    return () => window.removeEventListener("resize", resize);
  }, [ref, active, value]);
}

/** An optional comment for the picked option: one line that grows as you type. Enter adds a line; only Submit sends it. */
export function CommentInput({ value, onChange, disabled, invalid, describedBy }: {
  value: string; onChange: (value: string) => void; disabled?: boolean; invalid?: boolean; describedBy?: string;
}) {
  const ref = useRef<HTMLTextAreaElement>(null);
  useAutoGrow(ref, value);
  return <div className="ac-note-field ac-option-comment">
    <textarea ref={ref} className="ac-note-input" aria-label="Comment (optional)" placeholder="Add a comment (optional)" value={value} rows={1} disabled={disabled}
      aria-invalid={invalid || undefined} aria-describedby={describedBy}
      onChange={(event) => onChange(event.target.value)}
      onKeyDown={(event) => { if (event.key === "Enter") event.stopPropagation(); }} />
  </div>;
}

/** A note stays in one inline field. Saving keeps it with the answer; only Submit sends it. */
export function NoteField({ value, onChange, disabled, placeholder, comment = false, invalid, describedBy }: {
  value: string; onChange: (value: string) => void; disabled?: boolean; placeholder?: string;
  comment?: boolean; invalid?: boolean; describedBy?: string;
}) {
  const [editing, setEditing] = useState(false);
  const saved = useRef(value);
  const ref = useRef<HTMLTextAreaElement>(null);
  const toggleRef = useRef<HTMLButtonElement>(null);
  const wasEditing = useRef(false);
  useLayoutEffect(() => {
    const node = ref.current;
    if (editing && node) { node.focus(); node.setSelectionRange(node.value.length, node.value.length); }
    else if (wasEditing.current) (node ?? toggleRef.current)?.focus();
    wasEditing.current = editing;
  }, [editing]);
  // Comments stay editable until the answer is submitted.
  useAutoGrow(ref, value, comment && (editing || !!value.trim()));
  const edit = () => { saved.current = value; setEditing(true); };
  const cancel = () => { onChange(saved.current); setEditing(false); };
  const save = () => { onChange(value.trim()); setEditing(false); };
  // Cleared from outside (for example once Submit sends it), not by typing: close the empty editor.
  const typed = useRef(value);
  useEffect(() => { if (!comment && editing && !value && typed.current !== value) setEditing(false); typed.current = value; }, [comment, editing, value]);
  if (editing || value.trim()) return <div className="ac-note-field">
    <textarea ref={ref} className="ac-note-input" aria-label={comment ? "Comment (optional)" : "Note"} aria-invalid={invalid || undefined} aria-describedby={describedBy} title={editing ? undefined : "Edit note"} placeholder={placeholder ?? (comment ? "Comment (optional)" : "Add a note for the agent")} value={value} rows={1} maxLength={comment ? undefined : 1000} disabled={disabled} readOnly={!comment && !editing}
      onClick={() => { if (!editing) edit(); }}
      onChange={(event) => { typed.current = event.target.value; onChange(event.target.value); }}
      onKeyDown={(event) => {
        if (comment) { if (event.key === "Enter") event.stopPropagation(); return; }
        if (event.nativeEvent.isComposing) return;
        if (event.key === "Enter") { event.preventDefault(); event.stopPropagation(); if (editing) save(); else edit(); }
        else if (event.key === "Escape" && editing) { event.preventDefault(); event.stopPropagation(); cancel(); }
      }} />
    {editing && !comment && <div className="ac-note-actions">
      <button type="button" className="ac-icon-button" aria-label="Save note" title="Save note (Enter)" disabled={disabled} onMouseDown={(event) => event.preventDefault()} onClick={save}><CheckIcon /></button>
      <button type="button" className="ac-icon-button" aria-label="Cancel note" title="Cancel note (Esc)" disabled={disabled} onMouseDown={(event) => event.preventDefault()} onClick={cancel}><XIcon /></button>
    </div>}
  </div>;
  return <button ref={toggleRef} type="button" className="ac-note-toggle" disabled={disabled} onClick={edit}><NoteIcon />{comment ? "Add comment" : "Add note"}</button>;
}

function CheckIcon() {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m5 12 4 4L19 6" /></svg>;
}

function XIcon() {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18" /></svg>;
}

/** The last part of a decision: the note, then a row with "Add note" (until opened) and the form's one action. */
export function SubmitRow({ note, onNote, disabled, canSubmit, pending, submitLabel = "Submit", notePlaceholder }: {
  note?: string; onNote?: (value: string) => void; disabled?: boolean; canSubmit: boolean; pending?: boolean; submitLabel?: string; notePlaceholder?: string;
}) {
  return <div className="ac-submit">
    {onNote && <NoteField value={note ?? ""} onChange={onNote} disabled={disabled} placeholder={notePlaceholder} />}
    <Button type="submit" size="sm" variant="default" className="ac-button" disabled={disabled || !canSubmit || pending} aria-busy={pending || undefined}>{pending ? "Submitting…" : submitLabel}</Button>
  </div>;
}

function NoteIcon() {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M14.5 20.5H7A2.5 2.5 0 0 1 4.5 18V6A2.5 2.5 0 0 1 7 3.5h10A2.5 2.5 0 0 1 19.5 6v9.5z" /><path d="M14.5 20.5v-3a2 2 0 0 1 2-2h3M8.5 8.5h7M8.5 12h4" /></svg>;
}

export type OutcomeTone = "sent" | "done" | "failed" | "unsent";
/** What happened, in one compact block: answer, note, status, and its recovery action. */
export function Outcome({ tone, answer, note, status, time, actions }: {
  tone: OutcomeTone; answer: string; note?: string | null; status: string; time?: string; actions?: ReactNode;
}) {
  return <div className="ac-outcome" data-tone={tone}>
    <div className="ac-outcome-line">
      <span className="ac-outcome-icon" aria-hidden="true">{tone === "done" ? "✓" : tone === "sent" ? "↗" : "!"}</span>
      <span className="ac-outcome-answer">{answer}</span>
      <span className="ac-outcome-status" role="status">{status}{time && <time> · {time}</time>}</span>
    </div>
    {note && <div className="ac-outcome-note">“{note}”</div>}
    {actions && <div className="ac-outcome-actions">{actions}</div>}
  </div>;
}

/** Several decisions in one form: a header, rows split by hairlines, and one Submit at the end. */
export function DecisionGroup({ title, progress, children, footer, onSubmit }: { title: string; progress?: string; children: ReactNode; footer: ReactNode; onSubmit?: () => void }) {
  return <DecisionCard label={title} className="ac-group" onSubmit={onSubmit}>
    <div className="ac-group-head"><span className="ac-group-title">{title}</span>{progress && <span className="ac-meta">{progress}</span>}</div>
    {children}
    <div className="ac-group-foot">{footer}</div>
  </DecisionCard>;
}
export function DecisionRow({ label, children }: { label: string; children: ReactNode }) { return <div className="ac-row" role="group" aria-label={label}>{children}</div>; }
export { Button };
