// Action Cards components. Presentational only: they take values and callbacks and never call RPC.
// Hierarchy, top to bottom: question → what happens → evidence → answer → note + submit → outcome.
import { useLayoutEffect, useRef, useState, type FormEvent, type ReactNode } from "react";
import { Button } from "../components/ui/button.js";
import { cn } from "../lib/utils.js";
import "./tokens.css";
import "./components.css";

export type Option = { id: string; label: string; hint?: string; destructive?: boolean };

/** The card surface. A single decision is a form; a group is one form holding several decisions. */
export function DecisionCard({ children, onSubmit, label, className }: { children: ReactNode; onSubmit?: () => void; label: string; className?: string }) {
  return <form className={cn("ac ac-card", className)} aria-label={label} onSubmit={(event: FormEvent) => { event.preventDefault(); onSubmit?.(); }}>{children}</form>;
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

/** Evidence sits in a recessed block below the question; a long one previews and opens in place. */
export function ContextBlock({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [long, setLong] = useState(false);
  useLayoutEffect(() => { const node = ref.current; if (node && !open) setLong(node.scrollHeight > node.clientHeight + 1); }, [open, children]);
  return <div className="ac-context" data-open={open || undefined} data-long={long || undefined}>
    <div className="ac-context-body" ref={ref}>{children}</div>
    {long && !open && <button type="button" className="ac-link" onClick={() => setOpen(true)}>Show more</button>}
  </div>;
}

/** bb's question-form option row, with a real radio underneath for keyboard and screen readers. */
export function OptionList({ name, label, options, value, recommended, disabled, onChange }: {
  name: string; label: string; options: Option[]; value: string | null; recommended?: string | null; disabled?: boolean; onChange: (id: string) => void;
}) {
  return <fieldset className="ac-options" disabled={disabled}>
    <legend className="ac-sr">{label}</legend>
    {options.map((option) => <label key={option.id} className="ac-option" data-destructive={option.destructive || undefined}>
      <input type="radio" name={name} value={option.id} checked={value === option.id} onChange={() => onChange(option.id)} />
      <span className="ac-glyph" aria-hidden="true" />
      <span className="ac-option-text">
        <span className="ac-option-label">{option.label}{recommended === option.id && <span className="ac-tag">Recommended</span>}</span>
        {option.hint && <span className="ac-option-hint">{option.hint}</span>}
      </span>
    </label>)}
  </fieldset>;
}

/** A note that rides along with an answer: an "Add note" button that opens a textarea. */
export function NoteField({ value, onChange, disabled, placeholder = "Add a note for the agent" }: { value: string; onChange: (value: string) => void; disabled?: boolean; placeholder?: string }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLTextAreaElement>(null);
  const shown = open || !!value;
  useLayoutEffect(() => { if (open) ref.current?.focus(); }, [open]);
  if (!shown) return <Button type="button" size="sm" variant="ghost" className="ac-note-toggle" disabled={disabled} onClick={() => setOpen(true)}><NoteIcon />Add note</Button>;
  return <textarea ref={ref} className="ac-textarea" aria-label="Note" placeholder={placeholder} value={value} rows={2} maxLength={1000} disabled={disabled}
    onChange={(event) => onChange(event.target.value)}
    onBlur={() => { if (!value.trim()) setOpen(false); }}
    onKeyDown={(event) => {
      if (event.key === "Enter" && (event.metaKey || event.ctrlKey)) { event.preventDefault(); event.currentTarget.form?.requestSubmit(); }
      else if (event.key === "Escape" && !value.trim()) { event.preventDefault(); onChange(""); setOpen(false); }
    }} />;
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
export function DecisionRow({ children }: { children: ReactNode }) { return <div className="ac-row" role="group">{children}</div>; }
export { Button };
