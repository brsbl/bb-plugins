import { useEffect, useId, useState, type ReactNode } from "react";
import type { CoordinatorRule, CoordinatorTemplate, RuleColumn } from "../contracts.js";
import { COLUMN_LABELS, describeRule } from "../model.js";
import { Button } from "./ui/button.js";
import { errorMessage, useCoordinatorRpc } from "./rpc.js";

const DESCRIBE = "__describe__";
const COLUMNS: RuleColumn[] = ["alone", "ask", "never"];
export const AUTO_APPROVE_DISCLOSURE =
  "Coordinator Mode approves ordinary commands for this thread and its sub-threads on your behalf. You can turn this off.";

function copy(template: CoordinatorTemplate): CoordinatorTemplate {
  return JSON.parse(JSON.stringify(template)) as CoordinatorTemplate;
}

type SetupFormProps = {
  heading: string;
  submitLabel: string;
  busyLabel: string;
  /** Project used to draft a template from a description. */
  projectId: string | null;
  /** Extra fields above the template, such as a project picker. */
  children?: ReactNode;
  /** Disables submit, with an explanation, when the caller is not ready. */
  blockedReason?: string | null;
  /** Edit an existing coordinator's template: no picker or disclosure, opens in edit mode. */
  initialTemplate?: CoordinatorTemplate;
  onCancel?(): void;
  onSubmit(template: CoordinatorTemplate, autoApprove: boolean): Promise<void>;
};

export function SetupForm({ heading, submitLabel, busyLabel, projectId, children, blockedReason, initialTemplate, onCancel, onSubmit }: SetupFormProps) {
  const fixed = initialTemplate !== undefined;
  const call = useCoordinatorRpc();
  const ids = useId();
  const [templates, setTemplates] = useState<CoordinatorTemplate[] | null>(null);
  const [choice, setChoice] = useState("");
  const [draft, setDraft] = useState<CoordinatorTemplate | null>(() => initialTemplate ? copy(initialTemplate) : null);
  const [described, setDescribed] = useState<CoordinatorTemplate | null>(null);
  const [description, setDescription] = useState("");
  const [drafting, setDrafting] = useState(false);
  const [editing, setEditing] = useState(fixed);
  const [autoApprove, setAutoApprove] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (fixed) return;
    let live = true;
    call("templates", {})
      .then(({ templates: loaded }) => {
        if (!live) return;
        setTemplates(loaded);
        const first = loaded[0];
        setChoice(first ? first.id : DESCRIBE);
        setDraft(first ? copy(first) : null);
      })
      .catch((reason: unknown) => { if (live) setError(errorMessage(reason)); });
    return () => { live = false; };
  }, [call, fixed]);

  const choose = (value: string) => {
    setChoice(value);
    setEditing(false);
    setError(null);
    if (value === DESCRIBE) {
      setDraft(described ? copy(described) : null);
      return;
    }
    const template = templates?.find((candidate) => candidate.id === value);
    setDraft(template ? copy(template) : null);
  };

  const describe = async () => {
    if (!description.trim()) return;
    setDrafting(true);
    setError(null);
    try {
      const { template } = await call("describeProcess", { description: description.trim(), projectId: projectId ?? "" });
      setDescribed(template);
      setDraft(copy(template));
    } catch (reason) {
      setError(errorMessage(reason));
    } finally {
      setDrafting(false);
    }
  };

  const submit = async () => {
    if (!draft) return;
    setBusy(true);
    setError(null);
    try {
      await onSubmit(draft, autoApprove);
    } catch (reason) {
      setError(errorMessage(reason));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="cm-setup">
      <div className="cm-setup-head">
        <h2 className="cm-title">{heading}</h2>
        {children}
        {!fixed && <select
          aria-label="Template"
          className="cm-select"
          value={choice}
          disabled={!templates || busy}
          onChange={(event) => choose(event.target.value)}
        >
          {templates?.map((template) => <option key={template.id} value={template.id}>{template.name}</option>)}
          <option value={DESCRIBE}>Describe your process…</option>
        </select>}
        {!fixed && choice === DESCRIBE && (
          <div className="cm-describe">
            <textarea
              aria-label="Describe your process"
              className="cm-textarea"
              placeholder="For example: take each bug from report to a verified fix, and ask me before merging."
              value={description}
              onChange={(event) => setDescription(event.target.value)}
            />
            <Button disabled={!description.trim() || drafting} onClick={() => void describe()}>
              {drafting ? "Drafting…" : described ? "Draft again" : "Draft template"}
            </Button>
          </div>
        )}
      </div>

      {!fixed && !templates && !error && <p className="cm-muted cm-pad">Loading templates…</p>}

      {draft && (
        <TemplateFields
          ids={ids}
          template={draft}
          editing={editing}
          onChange={setDraft}
        />
      )}

      {error && <p className="cm-error cm-pad" role="alert">{error}</p>}

      <div className="cm-setup-foot">
        <div className="cm-actions">
          {onCancel && <Button variant="ghost" disabled={busy} onClick={onCancel}>Cancel</Button>}
          {draft && !fixed && (
            <Button variant="ghost" disabled={busy} onClick={() => setEditing((value) => !value)}>
              {editing ? "Done editing" : "Edit"}
            </Button>
          )}
          <Button variant="default" disabled={!draft || busy || !!blockedReason} onClick={() => void submit()}>
            {busy ? busyLabel : submitLabel}
          </Button>
        </div>
        {blockedReason && <p className="cm-muted">{blockedReason}</p>}
        {!fixed && (
          <label className="cm-disclosure">
            <input type="checkbox" checked={autoApprove} onChange={(event) => setAutoApprove(event.target.checked)} />
            <span>{AUTO_APPROVE_DISCLOSURE}</span>
          </label>
        )}
      </div>
    </div>
  );
}

type TemplateFieldsProps = {
  ids: string;
  template: CoordinatorTemplate;
  editing: boolean;
  onChange(template: CoordinatorTemplate): void;
};

function TemplateFields({ ids, template, editing, onChange }: TemplateFieldsProps) {
  const set = (patch: Partial<CoordinatorTemplate>) => onChange({ ...template, ...patch });
  return (
    <dl className="cm-fields">
      <dt><label htmlFor={`${ids}-purpose`}>Purpose</label></dt>
      <dd>
        {editing
          ? <textarea id={`${ids}-purpose`} className="cm-textarea" value={template.purpose} onChange={(event) => set({ purpose: event.target.value })} />
          : template.purpose || <span className="cm-muted">None</span>}
      </dd>

      <dt>Stages</dt>
      <dd>
        <ol className="cm-stages" aria-label="Stages">
          {template.stages.map((stage) => <li key={stage.name}><span className="cm-stage">{stage.name}</span></li>)}
        </ol>
      </dd>

      <dt>Coordinator rules</dt>
      <dd>
        <RuleList rules={template.rules} editing={editing} onChange={(rules) => set({ rules })} />
      </dd>

      <dt><label htmlFor={`${ids}-threads`}>Sub-thread rules</label></dt>
      <dd>
        {editing
          ? <textarea id={`${ids}-threads`} className="cm-textarea" value={template.subThreadRules} onChange={(event) => set({ subThreadRules: event.target.value })} />
          : template.subThreadRules || <span className="cm-muted">None</span>}
      </dd>

      <dt><label htmlFor={`${ids}-briefing`}>Briefing</label></dt>
      <dd>
        {editing
          ? <input id={`${ids}-briefing`} className="cm-input" value={template.briefingLabel} onChange={(event) => set({ briefingLabel: event.target.value })} />
          : template.briefingLabel || <span className="cm-muted">None</span>}
      </dd>
    </dl>
  );
}

function RuleList({ rules, editing, onChange }: { rules: CoordinatorRule[]; editing: boolean; onChange(rules: CoordinatorRule[]): void }) {
  const [text, setText] = useState("");
  const [column, setColumn] = useState<RuleColumn>("never");
  const add = () => {
    if (!text.trim()) return;
    onChange([...rules, { kind: "instruction", column, text: text.trim() }]);
    setText("");
  };
  return (
    <div className="cm-rules">
      {COLUMNS.map((key) => {
        const entries = rules.map((rule, index) => ({ rule, index })).filter(({ rule }) => rule.column === key);
        return (
          <div key={key} className="cm-rule-group">
            <div className="cm-rule-column">{COLUMN_LABELS[key]}</div>
            {entries.length === 0 && <div className="cm-muted">Nothing</div>}
            <ul>
              {entries.map(({ rule, index }) => (
                <li key={index}>
                  <span>{describeRule(rule)}</span>
                  {rule.kind === "instruction" && <span className="cm-tag">Instruction only · not enforced</span>}
                  {editing && rule.kind === "instruction" && (
                    <Button variant="ghost" className="cm-small" aria-label={`Remove rule: ${rule.text}`}
                      onClick={() => onChange(rules.filter((_, position) => position !== index))}>
                      Remove
                    </Button>
                  )}
                </li>
              ))}
            </ul>
          </div>
        );
      })}
      {editing && (
        <div className="cm-rule-add">
          <select aria-label="Rule column" className="cm-select" value={column} onChange={(event) => setColumn(event.target.value as RuleColumn)}>
            {COLUMNS.map((key) => <option key={key} value={key}>{COLUMN_LABELS[key]}</option>)}
          </select>
          <input aria-label="New rule" className="cm-input" placeholder="Add an instruction" value={text}
            onChange={(event) => setText(event.target.value)}
            onKeyDown={(event) => { if (event.key === "Enter") { event.preventDefault(); add(); } }} />
          <Button disabled={!text.trim()} onClick={add}>Add</Button>
        </div>
      )}
    </div>
  );
}
